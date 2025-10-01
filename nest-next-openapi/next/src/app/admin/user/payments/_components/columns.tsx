"use client";

import { Button } from "~/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import NextLink from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import type { Payment } from "@prisma/client";

type SelectedPayment = Pick<
  Payment,
  "id" | "title" | "final_amount" | "created_at"
>;

export const columns: ColumnDef<SelectedPayment>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <Link href={`/admin/user/payments/${row.original.id}`}>
        <Button variant="outline">{row.original.id}</Button>
      </Link>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => <span>{row.original.title}</span>,
  },
  {
    accessorKey: "payable",
    header: "Payable",
    cell: ({ row }) => <span>$ {row.original.final_amount.toString()}</span>,
  },
  {
    accessorKey: "createdAt",
    header: "Created at",
    cell: ({ row }) => (
      <span>
        {formatDistanceToNow(new Date(row.original.created_at), {
          addSuffix: true,
        })}
      </span>
    ),
  },
];
