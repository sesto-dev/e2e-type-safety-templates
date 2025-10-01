"use server";

import { Heading } from "~/components/ui/heading";
import { Separator } from "~/components/ui/separator";
import { redirect } from "next/navigation";
import PageContainer from "~/components/layout/page-container";
import { apiNotificationsRetrieve } from "~/client";
import { getCurrentCookies } from "~/lib/server/cookies";

export default async function NotificationPage({
  params,
}: {
  params: { notificationId: number };
}) {
  const notification = await apiNotificationsRetrieve({
    path: {
      id: params.notificationId,
    },
    credentials: "include",
    headers: { cookie: await getCurrentCookies() },
  });

  return (
    <PageContainer scrollable>
      <div className="flex items-center justify-between">
        <Heading
          title={
            typeof notification?.data === "object" &&
            notification?.data !== null &&
            "title" in notification.data
              ? (notification.data as { title: string }).title
              : ""
          }
          description="Your notifications."
        />
      </div>
      <Separator className="my-4" />
      <div className="w-full">
        <p>
          {typeof notification?.data === "object" && notification?.data !== null && "content" in notification.data
            ? (notification.data as { content: string }).content
            : ""}
        </p>
      </div>
    </PageContainer>
  );
}
