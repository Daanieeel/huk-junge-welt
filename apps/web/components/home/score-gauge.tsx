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

export function ScoreGauge({ score }: { score: number }) {
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
