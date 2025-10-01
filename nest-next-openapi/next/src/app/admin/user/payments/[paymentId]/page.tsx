'use server'

import { Separator } from "~/components/ui/separator";
import { redirect } from "next/navigation";
import Invoice from "./_components/invoice";
import PageContainer from "~/components/layout/page-container";
import prisma from "~/lib/server/prisma";

export default async function LinkPage({
  params,
}: {
  params: { paymentId: string };
}) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: {
        user: true,
        provider: true,
        discount_code: true,
      },
    })

    if (!payment) {
      redirect("/admin");
    }

    return (
      <PageContainer scrollable>
        <div className="flex items-center justify-between">
        <Invoice payment={payment} />
        </div>
        <Separator className="my-4" />
        <Invoice payment={payment} />
      </PageContainer>
    );
  } catch (error) {
    console.error("[PAYMENT_PAGE]", error);
    redirect("/admin");
  }
}
