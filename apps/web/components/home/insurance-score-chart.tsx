"use client";

import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

interface InsuranceScoreChartProps {
  score: number;
  scoreLabel: string;
  totalCovered: number;
  totalRecommended: number;
}

const chartConfig = {
  score: {
    label: "Abgesichert",
    color: "var(--color-primary)",
  },
  remaining: {
    label: "Offen",
    color: "oklch(0.922 0 0)",
  },
} satisfies ChartConfig;

export function InsuranceScoreChart({
  score,
  scoreLabel,
  totalCovered,
  totalRecommended,
}: InsuranceScoreChartProps) {
  const remaining = 100 - score;
  const chartData = [{ score, remaining }];

  return (
    <div className="flex flex-col items-center">
      <ChartContainer
        config={chartConfig}
        className="mx-auto w-full max-w-75"
        style={{ height: 160 }}
      >
        <RadialBarChart
          data={chartData}
          startAngle={0}
          endAngle={180}
          innerRadius={85}
          outerRadius={128}
          cy="100%"
        >
          <PolarGrid
            gridType="circle"
            radialLines={false}
            stroke="none"
            className="first:fill-muted last:fill-background"
            polarRadius={[91, 79]}
          />
          <RadialBar
            dataKey="score"
            stackId="gauge"
            cornerRadius={6}
            fill="var(--color-primary)"
            className="stroke-transparent stroke-2"
          />
          <RadialBar
            dataKey="remaining"
            stackId="gauge"
            cornerRadius={6}
            fill="oklch(0.922 0 0)"
            className="stroke-transparent stroke-2"
          />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  const cx = viewBox.cx ?? 0;
                  const cy = viewBox.cy ?? 0;
                  return (
                    <text textAnchor="middle">
                      <tspan
                        x={cx}
                        y={cy - 36}
                        fill="var(--foreground)"
                        fontSize={56}
                        fontWeight={900}
                      >
                        {score}
                      </tspan>
                      <tspan
                        x={cx}
                        y={cy - 12}
                        fill="var(--muted-foreground)"
                        fontSize={13}
                        fontWeight={500}
                      >
                        {scoreLabel}
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>

      {/* Coverage summary below the arc */}
      <p className="mt-3 text-[13px] text-muted-foreground">
        <span className="font-semibold text-foreground">{totalCovered}</span> von{" "}
        <span className="font-semibold text-foreground">{totalRecommended}</span> empfohlenen
        Versicherungen aktiv
      </p>
    </div>
  );
}
