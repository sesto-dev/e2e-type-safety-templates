'use server'

import { DataTable } from "~/components/ui/data-table";
import { Heading } from "~/components/ui/heading";
import { Separator } from "~/components/ui/separator";
import { redirect } from "next/navigation";

import { columns } from "./_components/columns";
import PageContainer from "~/components/layout/page-container";
import prisma from "~/lib/server/prisma";

export default async function NotificationsPage() {
  try {
    const notifications = await prisma.notification.findMany({
    });

    return (
      <PageContainer scrollable>
        <div className="flex items-center justify-between">
          <Heading
            title={`(${notifications}) Notifications`}
            description="Your Notifications."
          />
        </div>
        <Separator className="my-4" />
        <DataTable
          columns={columns}
          data={notifications}
          searchKey="title"
        />
      </PageContainer>
    );
  } catch (error) {
    console.error("[NOTIFICATIONS_PAGE]", error);
    redirect("/admin");
  }
}
