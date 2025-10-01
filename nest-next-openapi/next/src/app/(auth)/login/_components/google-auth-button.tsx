// next\src\app\(auth)\login\_components\google-auth-button.tsx

'use client'

import { BrandIcons } from '~/components/shared/brand-icons'
import { useState } from 'react'
import { Loader2Icon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import Link from 'next/link'

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false)

  function handleClick() {
    setLoading(true)
  }

  return (
    <Link
      type="button"
      className="w-full"
      href={`${process.env.NEXT_PUBLIC_API_BASEURL}/auth/google`}
      onClick={handleClick}
    >
      <Button size="lg" className="w-full p-6 text-lg">
        {loading ? (
          <>
            <Loader2Icon className="ml-2 size-5 animate-spin" />
            Signing in ...
          </>
        ) : (
          'Sign in with Google'
        )}
        <BrandIcons.google className="mr-2 size-5" />
      </Button>
    </Link>
  )
}
