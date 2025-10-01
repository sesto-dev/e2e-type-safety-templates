// next\src\hooks\use-tooltip.ts

import { useState, useCallback } from "react";
import { ChartConfig } from "~/types/chart";

interface TooltipData {
  x: number;
  y: number;
  content: string;
}

export function useTooltip(
  chartConfig: ChartConfig,
  selectedCurrencies: string[],
  csmData: any[]
) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const handleCrosshairMove = useCallback(
    (param: any) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        setTooltip(null);
      } else {
        const timePoint = param.time as number;
        // Use a tolerance (e.g., 1 second) for matching the time value.
        const tolerance = 1;
        const csmDataPoint = csmData.find(
          (d) => Math.abs(d.time - timePoint) < tolerance
        );

        if (csmDataPoint) {
          const content = selectedCurrencies
            .map((currency) => {
              const value = csmDataPoint[currency];
              const color =
                chartConfig[currency as keyof typeof chartConfig].color;
              return `<div class="tooltip-row" style="color: ${color};">
                <span class="currency">${currency}</span>
                <span class="value">${value?.toFixed(4) ?? "N/A"}</span>
              </div>`;
            })
            .join("");

          setTooltip({
            x: param.point.x,
            y: param.point.y,
            content: `
              <div class="tooltip-container">
                <div class="tooltip-time">${new Date(
                  timePoint * 1000
                ).toLocaleString()}</div>
                ${content}
              </div>
            `,
          });
        } else {
          setTooltip(null);
        }
      }
    },
    [selectedCurrencies, csmData, chartConfig]
  );

  return { tooltip, handleCrosshairMove };
}
