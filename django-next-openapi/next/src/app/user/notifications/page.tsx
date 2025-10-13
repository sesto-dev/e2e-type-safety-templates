import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table";
import { Heading } from "~/components/ui/heading";
import { Separator } from "~/components/ui/separator";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { columns } from "./_components/columns";
import PageContainer from "~/components/layout/page-container";
import { apiNotificationsList } from "~/client";
import { getCurrentCookies } from "~/lib/server/cookies";

export default async function NotificationsPage() {
  try {
    const notifications = await apiNotificationsList({
      credentials: "include",
      headers: { cookie: await getCurrentCookies() },
    });

    return (
      <PageContainer scrollable>
        <div className="flex items-center justify-between">
          <Heading
            title={`(${Array.isArray(notifications.data) ? notifications.data.length : 0}) Notifications`}
            description="Your Notifications."
          />
        </div>
        <Separator className="my-4" />
        <DataTable
          columns={columns}
          data={Array.isArray(notifications.data) ? notifications.data : []}
          searchKey="title"
        />
      </PageContainer>
    );
  } catch (error) {
    console.error("[NOTIFICATIONS_PAGE]", error);
    redirect("/admin");
  }
}
