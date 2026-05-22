"use client"

import { Activity, Database, Sparkles } from "lucide-react"
import type { AnalysisResult } from "@/lib/types"

interface AnalysisProvenancePanelProps {
  analysis: AnalysisResult
}

export function AnalysisProvenancePanel({ analysis }: AnalysisProvenancePanelProps) {
  const ml = analysis.score.ml
  const genAiUsed = analysis.recommendations.recommendations.length > 0

  const items = [
    {
      label: "Scoring Engine",
      value: ml ? `${ml.model} + calibration` : "baseline score engine",
      detail: ml ? `${ml.predictionMetadata.source}, ${ml.predictionMetadata.latency_ms}ms` : "local rules",
      icon: Activity,
    },
    {
      label: "Persistence",
      value: analysis.id ? "Saved to Supabase" : "Session only",
      detail: analysis.id ? "Analysis history is available" : "No database record returned",
      icon: Database,
    },
    {
      label: "Recommendations",
      value: genAiUsed ? "Generated with fallback-safe pipeline" : "Not available",
      detail: "GenAI when configured, rule fallback otherwise",
      icon: Sparkles,
    },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon

        return (
          <div key={item.label} className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
            </div>
            <div className="text-sm font-medium text-foreground">{item.value}</div>
            <p className="mt-1 break-words text-xs text-muted-foreground">{item.detail}</p>
          </div>
        )
      })}
    </div>
  )
}
