// app/api/stripe/webhook/route.ts
import prisma from '~/lib/server/prisma'
import { stripe } from '~/lib/server/stripe'

import { NextResponse } from 'next/server'

/**
 * Stripe webhook route.
 * - Validates signature using STRIPE_WEBHOOK_SECRET_KEY
 * - Handles checkout.session.completed and mirrors your Django fulfillment logic:
 *    - resolve user via metadata.user_id or customer_details.email
 *    - create/update Payment
 *    - if bundle_id present: credit the organization's Wallet inside a transaction
 *
 * Stripe requires the raw request body for signature verification.
 */
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET_KEY env var')
    return NextResponse.json({}, { status: 500 })
  }

  // get raw body as text and signature
  const payload = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: any
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
  } catch (err: any) {
    console.warn('Invalid Stripe webhook:', err?.message)
    return NextResponse.json(
      { error: 'Invalid signature or payload' },
      { status: 400 }
    )
  }

  const evType = event.type
  const data = (event.data && event.data.object) || {}
  console.info('Stripe event received:', event.id, evType)

  // helper to get ref id
  const safeRefId = (sessionObj: any) =>
    sessionObj.payment_intent || sessionObj.id

  if (evType === 'checkout.session.completed') {
    const session = data
    const metadata = session.metadata || {}

    function metaGet(k: string) {
      const v = metadata[k]
      return v === '' ? null : v ?? null
    }

    const refId = safeRefId(session)
    const userIdFromMeta = metaGet('user_id')
    const customerEmail = (session.customer_details || {}).email

    // find user: prefer meta user id, otherwise fall back to email
    let user = null
    if (userIdFromMeta) {
      user = await prisma.user.findUnique({ where: { id: userIdFromMeta } })
    }
    if (!user && customerEmail) {
      user = await prisma.user.findFirst({
        where: { email: { equals: customerEmail, mode: 'insensitive' } },
      })
    }

    if (!user) {
      console.error('Payment succeeded but no user found', {
        refId,
        email: customerEmail,
        metadata,
      })
      // Acknowledge to avoid retry loops; decide to store a "problem" record if desired
      return NextResponse.json({}, { status: 200 })
    }

    // compute amounts; try retrieving PaymentIntent if present
    let finalAmount = 0
    let originalAmount = 0
    try {
      if (session.payment_intent) {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent)
        finalAmount = (pi.amount_received ?? 0) / 100
        originalAmount = (pi.amount ?? finalAmount * 100) / 100
      } else {
        finalAmount = (session.amount_total ?? 0) / 100
        originalAmount = finalAmount
      }
    } catch (err) {
      console.warn('Failed to retrieve PaymentIntent:', err)
    }

    // provider record (get or create)
    const providerTitle = 'stripe'
    let provider = await prisma.paymentProvider.findUnique({
      where: { title: providerTitle },
    })
    if (!provider) {
      provider = await prisma.paymentProvider.create({
        data: { title: providerTitle, is_active: true },
      })
    }

    if (!refId) {
      console.error('No ref_id present on session', session.id)
      return NextResponse.json({}, { status: 400 })
    }

    // idempotent: find existing payment by composite (provider + ref_id)
    const existing = await prisma.payment.findFirst({
      where: { providerId: provider.id, ref_id: refId },
    })

    try {
      let payment
      if (existing) {
        // update
        payment = await prisma.payment.update({
          where: { id: existing.id },
          data: {
            status: 'Paid',
            title: metadata.title ?? `Stripe payment ${refId}`,
            original_amount: originalAmount,
            vat_amount: 0,
            final_amount: finalAmount,
            userId: user.id,
          },
        })
      } else {
        // create
        payment = await prisma.payment.create({
          data: {
            status: 'Paid',
            title: metadata.title ?? `Stripe payment ${refId}`,
            ref_id: refId,
            original_amount: originalAmount,
            vat_amount: 0,
            final_amount: finalAmount,
            providerId: provider.id,
            userId: user.id,
          },
        })
      }

      // Determine org and bundle
      const bundleId = metaGet('bundle_id')
      let orgId =
        metaGet('organization_id') ?? session.client_reference_id ?? null
      let org = null

      if (!orgId) {
        // fallback: user's first organization (membership)
        const membership = await prisma.membership.findFirst({
          where: { userId: user.id },
        })
        if (membership) {
          org = await prisma.organization.findUnique({
            where: { id: membership.organizationId },
          })
        }
      } else {
        // try id then slug
        org =
          (await prisma.organization.findUnique({ where: { id: orgId } })) ??
          (await prisma.organization.findUnique({ where: { slug: orgId } }))
      }

      if (bundleId) {
        if (!org) {
          console.error(
            'Bundle present but organization could not be determined',
            { bundleId, orgId }
          )
          // Return 500 so Stripe will retry (same behaviour as your Django code)
          return NextResponse.json({}, { status: 500 })
        }

        // fulfill purchase inside a transaction
        try {
          // fetch wallet (create if missing) and bundle, then update wallet credits and create WalletTransaction
          const result = await prisma.$transaction(async (tx: any) => {
            const wallet =
              (await tx.wallet.findUnique({
                where: { organizationId: org!.id },
              })) ??
              (await tx.wallet.create({
                data: { organizationId: org!.id, credits: '0.00' },
              }))
            const bundle = await tx.creditBundle.findUnique({
              where: { id: bundleId },
            })
            if (!bundle)
              throw new Error('CreditBundle missing during fulfillment')

            // compute new credits, wallet.credits stored as Decimal string; convert safe
            const currentCredits = Number(wallet.credits ?? 0)
            const newCredits = (
              currentCredits + Number(bundle.credits)
            ).toFixed(2)

            const updatedWallet = await tx.wallet.update({
              where: { id: wallet.id },
              data: { credits: newCredits },
            })

            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                change: Number(bundle.credits).toFixed(2),
                type: 'IN',
                reason: `purchase ${bundle.credits} credits (bundle ${bundle.code})`,
                paymentId: payment.id,
              },
            })

            // optional: decrement discount code
            const discountCodeStr = metaGet('discount_code')
            if (discountCodeStr) {
              const dc = await tx.discountCode.findFirst({
                where: {
                  code: { equals: discountCodeStr, mode: 'insensitive' },
                },
              })
              if (dc && dc.stock > 0) {
                await tx.discountCode.update({
                  where: { id: dc.id },
                  data: { stock: dc.stock - 1 },
                })
              }
            }

            return { updatedWallet }
          }) // end transaction
        } catch (err) {
          console.error('Error fulfilling purchase:', err)
          // Return 500 so Stripe retries
          return NextResponse.json({}, { status: 500 })
        }
      }

      // success ack to Stripe
      return NextResponse.json({}, { status: 200 })
    } catch (err) {
      console.error('Failed to create/update Payment for ref:', refId, err)
      return NextResponse.json({}, { status: 500 })
    }
  } // end checkout.session.completed

  // Default: acknowledge other events
  return NextResponse.json({}, { status: 200 })
}
