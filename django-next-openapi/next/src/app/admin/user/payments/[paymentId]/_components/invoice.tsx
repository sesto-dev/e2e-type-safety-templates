import React from "react";
import type {
  Payment,
} from "~/client";
import { format } from "date-fns";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Table } from "~/components/ui/table";
import { Separator } from "~/components/ui/separator";

const Invoice = ({ payment }: { payment: Payment }) => {
  const {
    id,
    status,
    ref_id,
    card_pan,
    original_amount,
    discount_amount,
    vat_amount,
    final_amount,
    created_at,
    discount_code,
    provider,
    user,
  } = payment;

  const statusText = () => {
    switch (status) {
      case "Processing":
        return "Awaiting Payment";
      case "Paid":
        return "Paid";
      case "Failed":
        return "Failed";
      case "Denied":
        return "Declined";
      default:
        return "Unknown";
    }
  };

  return (
    <Card className="mx-auto max-w-4xl rounded-lg p-6 text-sm font-light shadow-lg">
      <CardHeader className="mb-6 border-b pb-4">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="mb-4 md:mb-0">
            <h2 className="text-3xl">Invoice</h2>
            <p className="">#{id.toString().padStart(6, "0")}</p>
          </div>
          {/* Optional: Add a download or print button here */}
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-lg">Customer Information:</h3>
              <p>Name: {user?.name || "N/A"}</p>
              <p>Email: {user?.email || "N/A"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-lg">Invoice Details</h3>
              <p>
                Date:{" "}
                {format(new Date(created_at), "PPP", {
                  useAdditionalWeekYearTokens: true,
                })}
              </p>
              <p>Status: {statusText()}</p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        <div className="">
          <h3 className="mb-4 text-lg">Payment Details</h3>
          <div>
            <Card>
              <CardContent className="p-4">
                <p>Payment Processor: {provider?.title}</p>
                {card_pan && (
                  <p>Card Number: **** **** **** {card_pan.slice(-4)}</p>
                )}
                <p>Reference ID: {ref_id}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-6" />

        <Card>
          <CardContent className="overflow-x-auto p-4">
            <Table className="min-w-full">
              <thead className="">
                <tr className="text-left">
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2">Original Amount</td>
                  <td className="px-4 py-2">${parseFloat(original_amount).toFixed(2)}</td>
                </tr>
                {discount_amount && parseFloat(discount_amount) > 0 && (
                  <tr className="border-t">
                    <td className="px-4 py-2">Discount</td>
                    <td className="px-4 py-2">
                      -${parseFloat(discount_amount).toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr className="border-t">
                  <td className="px-4 py-2">VAT</td>
                  <td className="px-4 py-2">${parseFloat(vat_amount).toFixed(2)}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Payable Amount</td>
                  <td className="px-4 py-2">${parseFloat(final_amount).toFixed(2)}</td>
                </tr>
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {discount_code && (
          <Card className="">
            <CardContent className="p-4">
              <h3 className="mb-2 text-lg">Applied Discount</h3>
              <p className="">Code: {discount_code.code}</p>
              <p className="">
                Description: {discount_code.description || "N/A"}
              </p>
              <p className="">Discount Percentage: {discount_code.percent}%</p>
              <p className="">
                Discount Amount: $
                {/* {discount_code.max_discount_amount?.toFixed(2)} */}
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>

      <Separator className="my-6" />

      <CardFooter className="">
        <div>
          <p className="mb-2 text-sm">Thank you!</p>
          <p className="text-xs">
            For any questions about this invoice, please contact our support
            team.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Invoice;
