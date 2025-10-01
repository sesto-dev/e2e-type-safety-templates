"use server";

import { DataTable } from "~/components/ui/data-table";
import { Heading } from "~/components/ui/heading";
import { Separator } from "~/components/ui/separator";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { columns } from "./_components/columns";
import PageContainer from "~/components/layout/page-container";
import { getCurrentCookies } from "~/lib/server/cookies";
import prisma from "~/lib/server/prisma";

export default async function PaymentsPage() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        user: true,
        provider: true,
        discount_code: true,
      },
    })

    return (
      <PageContainer scrollable>
        <div className="flex items-center justify-between">
          <Heading
            title={`(${payments.length}) Payments`}
            description="Your payment history."
          />
        </div>
        <Separator className="my-4" />
        <DataTable
          columns={columns}
          data={payments}
          searchKey="id"
        />
      </PageContainer>
    );
  } catch (error) {
    console.error("[PAYMENTS_PAGE]", error);
    redirect("/admin");
  }
}
