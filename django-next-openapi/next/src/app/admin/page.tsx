'use client';

import { useEffect, useState } from "react";
import { ChartAreaInteractive } from "~/components/chart-area-interactive";
import { DataTable } from "~/components/data-table";
import { SectionCards } from "~/components/section-cards";

import data from "./data.json";

export default function Page() {

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards assessmentAttempts={} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive assessmentAttempts={} />
      </div>
      <DataTable data={data} />
    </div>
  );
}
