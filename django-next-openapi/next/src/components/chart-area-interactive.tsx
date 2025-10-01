"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "~/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

export const description = "An interactive area chart";

const chartConfig = {
  attempt: {
    label: "Attempt",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive(params: { data: any}) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const aggregatedData = React.useMemo(() => {
    // days window
    const days =
      timeRange === "90d" ? 90 : timeRange === "30d" ? 30 : 7;

    // determine reference (use max created_at if available so chart covers actual data)
    const maxDate = params.data.reduce((m: Date | null, a: any) => {
      if (!a.created_at) return m;
      const d = new Date(a.created_at);
      if (isNaN(d.getTime())) return m;
      return m === null || d > m ? d : m;
    }, null as Date | null);
    const referenceDate = maxDate ?? new Date();

    // start date (inclusive)
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - days + 1); // include today as one of the days

    // create map with one entry per day (YYYY-MM-DD) initialized to 0
    const dayMap = new Map<string, number>();
    for (let d = new Date(startDate); d <= referenceDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      dayMap.set(key, 0);
    }

    // count attempts per day
    for (const a of params.assessmentAttempts) {
      if (!a.created_at) continue;
      const dt = new Date(a.created_at);
      if (isNaN(dt.getTime())) continue;
      if (dt < startDate || dt > referenceDate) continue;
      const key = dt.toISOString().slice(0, 10);
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }

    // convert to sorted array usable by recharts
    const arr = Array.from(dayMap.entries()).map(([date, attempt]) => ({
      date, // YYYY-MM-DD string
      attempt,
    }));

    // already in ascending order due to iteration, but ensure it
    arr.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return arr;
  }, [params.assessmentAttempts, timeRange]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Attempts</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Total attempts for the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup type="single" value={timeRange} onValueChange={setTimeRange} variant="outline" className="@[767px]/card:flex hidden *:data-[slot=toggle-group-item]:!px-4" > <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem> <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem> <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem> </ToggleGroup> <Select value={timeRange} onValueChange={setTimeRange}> <SelectTrigger className="**:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden flex w-40" size="sm" aria-label="Select a value" > <SelectValue placeholder="Last 3 months" /> </SelectTrigger> <SelectContent className="rounded-xl"> <SelectItem value="90d" className="rounded-lg"> Last 3 months </SelectItem> <SelectItem value="30d" className="rounded-lg"> Last 30 days </SelectItem> <SelectItem value="7d" className="rounded-lg"> Last 7 days </SelectItem> </SelectContent> </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <AreaChart data={aggregatedData}>
            <defs> <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1"> <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={1.0} /> <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} /> </linearGradient> <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1"> <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} /> <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} /> </linearGradient> </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => {
                const date = new Date(value);
                if (isNaN(date.getTime())) return value;
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : Math.max(0, aggregatedData.length - 1)}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const d = new Date(String(value));
                    return isNaN(d.getTime())
                      ? String(value)
                      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="attempt"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}