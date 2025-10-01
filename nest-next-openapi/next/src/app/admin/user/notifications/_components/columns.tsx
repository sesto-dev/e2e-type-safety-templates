"use client";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { Notification } from "@prisma/client";

export const columns: ColumnDef<Notification>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      return (
        <Link href={`/admin/user/notifications/${row.original.id}`}>
          <Button variant="outline">{row.original.title}</Button>
        </Link>
      );
    },
  },
  {
    accessorKey: "isRead",
    header: "Status",
    cell: ({ row }) => {
      const isRead = row.getValue("isRead");
      return (
        <Badge variant={isRead ? "default" : "destructive"}>
          {isRead ? "Read" : "Unread"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created at",
    cell: ({ row }) =>
      formatDistanceToNow(new Date(row.getValue("createdAt")), {
        addSuffix: true,
      }),
  },
];
