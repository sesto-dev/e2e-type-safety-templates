"use server";

import { DataTable } from "~/components/ui/data-table";
import { Heading } from "~/components/ui/heading";
import { Separator } from "~/components/ui/separator";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { columns } from "./_components/columns";
import PageContainer from "~/components/layout/page-container";
import { apiPaymentsList } from "~/client";
import { getCurrentCookies } from "~/lib/server/cookies";

export default async function PaymentsPage() {
  try {
    const payments = await apiPaymentsList({
      credentials: "include",
      headers: { cookie: await getCurrentCookies() },
    });

    return (
      <PageContainer scrollable>
        <div className="flex items-center justify-between">
          <Heading
            title={`(${Array.isArray(payments.data) ? payments.data.length : 0}) Payments`}
            description="Your payment history."
          />
        </div>
        <Separator className="my-4" />
        <DataTable
          columns={columns}
          data={Array.isArray(payments.data) ? payments.data : []}
          searchKey="id"
        />
      </PageContainer>
    );
  } catch (error) {
    console.error("[PAYMENTS_PAGE]", error);
    redirect("/admin");
  }
}
