'use client'

import { useEffect, useState } from "react";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export function SectionCards(params: { data: any }) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3 *:shadow-xs">
      <Card className="@container/card bg-gradient-to-br from-sky-100 to-white dark:from-sky-900/20 dark:to-purple-900/20">
        <CardHeader>
          <CardDescription>Attempts</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {params.data.length}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp  />
              {Math.abs(params.data.length).toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card bg-gradient-to-br from-sky-100 to-white dark:from-sky-900/20 dark:to-purple-900/20">
        <CardHeader>
          <CardDescription>Answers</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {params.data.length}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {<IconTrendingUp className={green} />}
              {Math.abs(params.data.length).toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down 20% this period <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card bg-gradient-to-br from-sky-100 to-white dark:from-sky-900/20 dark:to-purple-900/20">
        <CardHeader>
          <CardDescription>Invitations</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {params.data.length}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {<IconTrendingUp className={green} />}
              {Math.abs(params.data.length).toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Engagement exceed targets</div>
        </CardFooter>
      </Card>
    </div>
  );
}
