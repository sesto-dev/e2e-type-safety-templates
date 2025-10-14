'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent } from '~/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion'
import { Label } from '~/components/ui/label'
import Icons from '~/components/shared/icons'
import { toast } from 'sonner'
import GoogleSignInButton from './google-auth-button'

import { authControllerSendOtp, authControllerVerifyOtp } from '~/client'

// Validation schema for email
const userAuthSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
})

type FormData = z.infer<typeof userAuthSchema>

// Validation schema for OTP
const otpSchema = z.object({
  email: z.string().email(),
  code: z
    .string()
    .min(6, 'OTP must be 6 digits')
    .max(6, 'OTP must be 6 digits'),
})

type OTPFormData = z.infer<typeof otpSchema>

export default function UserAuthForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [otp, setOTP] = useState('')
  const [countdown, setCountdown] = useState(30)

  // React Hook Form for email
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
  })

  // Countdown timer effect (starts when OTP is sent)
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => timer && clearInterval(timer)
  }, [countdown])

  // Handle sending OTP using the hey‑api client
  const onEmailSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      // Call the OTP send endpoint via hey‑api
      await authControllerSendOtp({ body: data })
      setCurrentStep(2)
      toast('A one-time password has been successfully sent to your email.')
      setCountdown(30)
    } catch (error: any) {
      console.error('Failed to send OTP', error)
      toast('Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OTP verification using the hey‑api client
  const onOTPSubmit = async () => {
    const data: OTPFormData = {
      email: getValues('email'),
      code: otp,
    }

    setIsVerifying(true)
    try {
      await authControllerVerifyOtp({ body: data })
      setCountdown(0)
      reset()
      toast('You have successfully logged in!')
      router.push('/')
    } catch (error: any) {
      console.error('OTP verification failed', error)
      toast('OTP verification was unsuccessful.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle resending OTP
  const handleResend = async () => {
    const emailValue = getValues('email')
    if (!emailValue) return
    setCountdown(0)
    setOTP('')
    await onEmailSubmit({ email: emailValue })
  }

  return (
    <>
      <Card className="py-2">
        <CardContent className="px-4">
          <Accordion type="single" collapsible>
            <AccordionItem className="border-none" value="item-1">
              <AccordionTrigger>Sign in with Email</AccordionTrigger>
              <AccordionContent>
                {currentStep === 1 && (
                  <form onSubmit={handleSubmit(onEmailSubmit)}>
                    <div className="flex flex-col gap-2.5">
                      <div>
                        <Label className="sr-only" htmlFor="email">
                          Email
                        </Label>
                        <Input
                          id="email"
                          placeholder="name@example.com"
                          type="email"
                          disabled={isLoading}
                          {...register('email')}
                        />
                        {errors?.email && (
                          <p className="mt-2 text-xs text-destructive">
                            {errors?.email.message}
                          </p>
                        )}
                      </div>
                      <Button type="submit" disabled={isLoading || isVerifying}>
                        {isLoading && (
                          <Icons.spinner className="mr-2 size-4 animate-spin" />
                        )}
                        Send One-Time Password
                      </Button>
                    </div>
                  </form>
                )}
                {currentStep === 2 && (
                  <>
                    <p className="mb-4 text-center">
                      Enter the code sent to your email.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        onOTPSubmit()
                      }}
                      className="flex flex-col gap-2.5"
                    >
                      <div>
                        <Label className="sr-only" htmlFor="otp">
                          Enter the code sent to your email.
                        </Label>
                        <Input
                          id="otp"
                          type="text"
                          value={otp}
                          onChange={(e) => setOTP(e.target.value)}
                          maxLength={6}
                          disabled={isLoading}
                          placeholder="123456"
                          className="text-center tracking-wider"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isVerifying || otp.length !== 6}
                        className="mt-4"
                      >
                        {isVerifying && (
                          <Icons.spinner className="mr-2 size-4 animate-spin" />
                        )}
                        Verify
                      </Button>
                    </form>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                      <span>Resend OTP?</span>
                      {countdown > 0 ? (
                        <span>in {countdown} seconds</span>
                      ) : (
                        <Button
                          variant="link"
                          onClick={handleResend}
                          className="h-auto p-0"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Sending...' : 'Resend'}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or our suggestion
          </span>
        </div>
      </div>
      <div className="w-full">
        <GoogleSignInButton />
      </div>
    </>
  )
}
