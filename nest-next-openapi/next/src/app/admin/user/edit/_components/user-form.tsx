'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { Heading } from '~/components/ui/heading'
import { Input } from '~/components/ui/input'
import type { User } from '@prisma/client'
import { updateUser } from '~/actions/user-actions'

// declare type Partial User
type PartialUser = Partial<User>

export const profileSchema = z.object({
  email: z.string().email('Invalid email address.'),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  avatar: z.string().optional(),
  phone: z.string().optional(),
  birthday: z.string().optional(),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileFormProps {
  initialData: PartialUser
}

export default function UserCreateForm({ initialData }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: initialData?.email,
      name: initialData?.name || undefined,
      avatar: initialData?.avatar || undefined,
      phone: initialData?.phone || undefined,
      birthday: initialData?.birthday
        ? new Date(initialData.birthday).toISOString().split('T')[0]
        : undefined,
    },
  })

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setLoading(true)

      const payload: Partial<User> = {
        id: initialData.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar ?? undefined,
        phone: data.phone ?? undefined,
        birthday: data.birthday ? new Date(data.birthday) : null, // Prisma might accept Date | null
      }

      const res = await updateUser(payload)

      toast.success('Information updated successfully.')
    } catch (error) {
      toast.error('An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title="Edit Profile"
          description="On this page, you can edit your account information."
        />
      </div>
      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.name?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.email?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.phone?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birth Date</FormLabel>
                  <FormControl>
                    <Input type="date" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.birthday?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
          </div>

          <Button disabled={loading} type="submit">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </Form>
    </>
  )
}
