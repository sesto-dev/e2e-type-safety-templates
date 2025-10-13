"use client";

import { Button } from "~/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { Payment, Referral } from "~/client";

// Define a type that picks only the required properties from Payment
type ReferralWithPayment = Referral & {
  payment: Payment;
};

export const columns: ColumnDef<ReferralWithPayment>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <Link href={`/admin/user/referrals/${row.original.id}`}>
        <Button variant="outline">{row.original.id}</Button>
      </Link>
    ),
  },
  {
    accessorKey: "payableAmount",
    header: "Payable Amount",
    cell: ({ row }) => <span>$ {row.original.payment.final_amount}</span>,
  },
  {
    accessorKey: "referralCommission",
    header: "Commission Amount",
    cell: ({ row }) => <span>$ {row.original.commission_amount}</span>,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <span>
        {formatDistanceToNow(new Date(row.original.created_at), {
          addSuffix: true,
        })}
      </span>
    ),
  },
];
