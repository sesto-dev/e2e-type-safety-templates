import { DataTable } from "~/components/ui/data-table";
import { Heading } from "~/components/ui/heading";
import { Separator } from "~/components/ui/separator";
import { redirect } from "next/navigation";

import { columns } from "./_components/columns";
import PageContainer from "~/components/layout/page-container";
import { getCurrentCookies } from "~/lib/server/cookies";
import { listReferrals } from "~/actions/referral-actions";

export default async function ReferralsPage() {
  try {
    const referrals = await listReferrals();

    return (
      <PageContainer scrollable>
        <div className="flex items-center justify-between">
          <Heading
            title={`(${referrals.length}) Referrals`}
            description="Your referral history."
          />
        </div>
        <Separator className="my-4" />
        <DataTable
          columns={columns}
          data={referrals}
          searchKey="id"
        />
      </PageContainer>
    );
  } catch (error) {
    console.error("[REFERRALS_PAGE]", error);
    redirect("/admin");
  }
}
