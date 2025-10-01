import PageContainer from "~/components/layout/page-container"
import { Heading } from "~/components/ui/heading"
import { Separator } from "~/components/ui/separator"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center py-16">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <Heading
          title="Payment Successful"
          description="Thank you for your purchase! Your payment has been processed."
        />
        <Separator className="my-8" />
        <p className="text-lg text-gray-700 mb-6 text-center">
          Your credits have been added to your account. You can now continue using the platform.
        </p>
        <Link
          href="/admin/organizations/billing"
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Go to Billing
        </Link>
      </div>
    </PageContainer>
  )}