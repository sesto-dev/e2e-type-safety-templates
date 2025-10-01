"use server";

import { Heading } from "~/components/ui/heading";
import { Separator } from "~/components/ui/separator";
import { redirect } from "next/navigation";
import PageContainer from "~/components/layout/page-container";
import { getCurrentCookies } from "~/lib/server/cookies";
import prisma from "~/lib/server/prisma";

export default async function NotificationPage({
  params,
}: {
  params: { notificationId: string };
}) {
  
  const notification = await prisma.notification.findUnique({
    where: { id: params.notificationId },
  });

  return (
    <PageContainer scrollable>
      <div className="flex items-center justify-between">
        <Heading
          title={notification?.title as string}
          description="Your notifications."
        />
      </div>
      <Separator className="my-4" />
      <div className="w-full">
        <p>
          {notification?.content}
        </p>
      </div>
    </PageContainer>
  );
}
