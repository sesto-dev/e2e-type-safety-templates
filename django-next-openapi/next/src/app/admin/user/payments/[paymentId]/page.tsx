import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table";
import { Heading } from "~/components/ui/heading";
import { Separator } from "~/components/ui/separator";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Invoice from "./_components/invoice";
import PageContainer from "~/components/layout/page-container";
import { apiPaymentsList, apiPaymentsRetrieve } from "~/client";
import { getCurrentCookies } from "~/lib/server/cookies";

export default async function LinkPage({
  params,
}: {
  params: { paymentId: number };
}) {
  try {
    const payment = await apiPaymentsList({
      query: {
        id: params.paymentId,
      },
      credentials: "include",
      headers: { cookie: await getCurrentCookies() },
    });

    // If the API returns an array directly
    const paymentData = Array.isArray(payment?.data) ? payment.data[0] : undefined;

    if (!paymentData) {
      redirect("/admin");
    }

    return (
      <PageContainer scrollable>
        <div className="flex items-center justify-between">
        <Invoice payment={paymentData} />
        </div>
        <Separator className="my-4" />
        <Invoice payment={paymentData} />
      </PageContainer>
    );
  } catch (error) {
    console.error("[PAYMENT_PAGE]", error);
    redirect("/admin");
  }
}
