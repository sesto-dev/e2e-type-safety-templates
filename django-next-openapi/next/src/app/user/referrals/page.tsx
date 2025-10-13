import { DataTable } from "~/components/ui/data-table";
import { Heading } from "~/components/ui/heading";
import { Separator } from "~/components/ui/separator";
import { redirect } from "next/navigation";

import { columns } from "./_components/columns";
import PageContainer from "~/components/layout/page-container";
import { apiReferralsList } from "~/client";
import { getCurrentCookies } from "~/lib/server/cookies";

export default async function ReferralsPage() {
  try {
    const referrals = await apiReferralsList({
      credentials: "include",
      headers: { cookie: await getCurrentCookies() },
    });

    return (
      <PageContainer scrollable>
        <div className="flex items-center justify-between">
          <Heading
            title={`(${Array.isArray((referrals.data as any)?.results) ? (referrals.data as any).results.length : 0}) Referrals`}
            description="Your referral history."
          />
        </div>
        <Separator className="my-4" />
        <DataTable
          columns={columns}
          data={Array.isArray((referrals.data as any)?.results) ? (referrals.data as any).results : []}
          searchKey="id"
        />
      </PageContainer>
    );
  } catch (error) {
    console.error("[REFERRALS_PAGE]", error);
    redirect("/admin");
  }
}
