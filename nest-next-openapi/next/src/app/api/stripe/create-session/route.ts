// app/api/stripe/create-session/route.ts
import { NextResponse } from "next/server";
import { createStripeCheckoutSession } from "~/actions/stripe-actions";
import prisma from "~/lib/server/prisma";

/**
 * POST /api/stripe/create-session
 * Body:
 *  { bundle_id, provider, organization_id }
 *
 * NOTE: This route must be authenticated. For brevity it's left as "TODO".
 * Replace "getUserIdFromRequest" with your auth logic to get the user id server-side.
 */

async function getUserIdFromRequest(req: Request): Promise<string | null> {
  // TODO: integrate your auth (cookies/JWT/session). Example:
  // const token = req.headers.get("authorization")?.split(" ")[1];
  // const user = await verifyTokenAndGetUser(token);
  // return user?.id ?? null;
  return null; // <-- Replace with actual logic
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { bundle_id: bundleId, provider, organization_id: organizationId } = body;

  // authentication
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await createStripeCheckoutSession({
      bundleId,
      provider,
      organizationId,
      userId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "failed" }, { status: 400 });
  }
}
