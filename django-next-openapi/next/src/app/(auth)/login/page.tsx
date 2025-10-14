'use server'

import Link from 'next/link'
import SignInForm from './_components/signin-form'
import { apiAuthMeRetrieve } from '~/client'
import { getCurrentCookies } from '~/lib/server/cookies'
import { redirect } from 'next/navigation'

export async function generateMetadata() {
  return {
    title: 'Sign In',
    description: 'Register or log in to your account',
  }
}

export default async function SignInViewPage() {
  // If user already has a session cookie, redirect them
  const res = await apiAuthMeRetrieve({
    credentials: 'include',
    headers: { cookie: await getCurrentCookies() },
  })

  return (
    <div className="relative h-screen flex-col items-center justify-center">
      <div className="flex h-full items-center p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[420px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in with your email and password. If you don't have an
              account, switch to Register below to create one.
            </p>
          </div>

          <SignInForm />

          <p className="px-8 text-center text-sm text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link
              target="_blank"
              href="/legal/tos"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              target="_blank"
              href="/legal/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
