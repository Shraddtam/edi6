"use client"

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface RiskBreakdownChartProps {
  breakdown: {
    accountsRisk: number
    passwordRisk: number
    thirdPartyRisk: number
    visibilityRisk: number
    securityRisk: number
    dataSharingRisk: number
  }
}

const chartConfig = {
  risk: {
    label: "Risk Score",
  },
  accountsRisk: {
    label: "Accounts",
    color: "var(--chart-1)",
  },
  passwordRisk: {
    label: "Passwords",
    color: "var(--chart-2)",
  },
  thirdPartyRisk: {
    label: "Third-Party",
    color: "var(--chart-3)",
  },
  visibilityRisk: {
    label: "Visibility",
    color: "var(--chart-4)",
  },
  securityRisk: {
    label: "Security",
    color: "var(--chart-5)",
  },
  dataSharingRisk: {
    label: "Data Sharing",
    color: "var(--chart-1)",
  },
}

export function RiskBreakdownChart({ breakdown }: RiskBreakdownChartProps) {
  const data = [
    { name: "Accounts", value: breakdown.accountsRisk, fill: "var(--chart-1)" },
    { name: "Passwords", value: breakdown.passwordRisk, fill: "var(--chart-2)" },
    { name: "Third-Party", value: breakdown.thirdPartyRisk, fill: "var(--chart-3)" },
    { name: "Visibility", value: breakdown.visibilityRisk, fill: "var(--chart-4)" },
    { name: "Security", value: breakdown.securityRisk, fill: "var(--chart-5)" },
    { name: "Data Sharing", value: breakdown.dataSharingRisk, fill: "var(--chart-1)" },
  ]

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--muted-foreground)" }} />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={100}
            tick={{ fill: "var(--foreground)", fontSize: 12 }}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            content={<ChartTooltipContent />}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={30}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
