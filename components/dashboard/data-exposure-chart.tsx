"use client"

import { CheckCircle, XCircle } from "lucide-react"

interface DataExposureChartProps {
  exposure: { type: string; shared: boolean }[]
}

export function DataExposureChart({ exposure }: DataExposureChartProps) {
  const sharedCount = exposure.filter((e) => e.shared).length
  const totalCount = exposure.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">Data Types Exposed</span>
        <span className={`text-lg font-semibold ${
          sharedCount > 5 ? "text-risk-high" : 
          sharedCount > 2 ? "text-risk-medium" : 
          "text-risk-low"
        }`}>
          {sharedCount} / {totalCount}
        </span>
      </div>
      
      <div className="grid gap-2">
        {exposure.map((item) => (
          <div
            key={item.type}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              item.shared
                ? "bg-risk-high/5 border-risk-high/30"
                : "bg-risk-low/5 border-risk-low/30"
            }`}
          >
            <span className="text-sm">{item.type}</span>
            {item.shared ? (
              <div className="flex items-center gap-2 text-risk-high">
                <span className="text-xs">Exposed</span>
                <XCircle className="h-4 w-4" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-risk-low">
                <span className="text-xs">Protected</span>
                <CheckCircle className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
