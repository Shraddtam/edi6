"use client"

import { MonitorCheck } from "lucide-react"

interface PlatformExposureChartProps {
  distribution: { name: string; value: number }[]
}

export function PlatformExposureChart({ distribution }: PlatformExposureChartProps) {
  if (distribution.length === 0) {
    return (
      <div className="min-h-[220px] flex items-center justify-center text-muted-foreground">
        No platform data available
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      {distribution.map((item) => (
        <div key={item.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
          <MonitorCheck className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm font-medium text-foreground">{item.name}</span>
        </div>
      ))}
    </div>
  )
}
