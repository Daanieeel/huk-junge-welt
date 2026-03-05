"use client"

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
  score: {
    label: "Schutz",
    color: "var(--primary)",
  },
  remainder: {
    label: "Offen",
    color: "var(--border)",
  },
} satisfies ChartConfig

export function ScoreGauge({ score, isProcessing }: { score: number; isProcessing?: boolean }) {
  if (isProcessing) {
    return (
      <div className="mx-auto w-full max-w-[260px]">
        {/*
          viewBox crops to just the ring: x=0..260, y=18..130 (outer arc peak to center line).
          Path uses sweep=1 for outer (CW → top) and sweep=0 for inner return (CCW → top).
        */}
        <svg viewBox="0 18 260 112" className="w-full">
          <path
            d="M 18,130 A 112,112 0 0 1 242,130 L 202,130 A 72,72 0 0 0 58,130 Z"
            className="fill-muted animate-pulse"
          />
        </svg>
      </div>
    )
  }

  const chartData = [{ score, remainder: 100 - score }]

  return (
    <ChartContainer
      id="score-gauge"
      config={chartConfig}
      className="mx-auto aspect-square w-full max-w-[260px]"
    >
      <RadialBarChart
        data={chartData}
        startAngle={180}
        endAngle={0}
        innerRadius={72}
        outerRadius={112}
      >
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 18}
                      className="fill-foreground text-5xl font-bold"
                    >
                      {score}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 4}
                      className="fill-muted-foreground text-sm"
                    >
                      von 100
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </PolarRadiusAxis>
        <RadialBar
          dataKey="score"
          stackId="a"
          cornerRadius={5}
          fill="var(--color-score)"
          className="stroke-transparent stroke-2"
        />
        <RadialBar
          dataKey="remainder"
          fill="var(--color-remainder)"
          stackId="a"
          cornerRadius={5}
          className="stroke-transparent stroke-2"
        />
      </RadialBarChart>
    </ChartContainer>
  )
}
