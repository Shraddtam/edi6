"use client"

import { BrainCircuit, ShieldCheck, TrendingUp } from "lucide-react"
import type { PrivacyScore } from "@/lib/types"

interface MlExplanationPanelProps {
  ml?: PrivacyScore["ml"]
}

export function MlExplanationPanel({ ml }: MlExplanationPanelProps) {
  if (!ml) {
    return (
      <div className="text-sm text-muted-foreground">
        ML explanation data is not available for this analysis.
      </div>
    )
  }

  const contributions = ml.shapSummary.slice(0, 8)

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Contribution values show how strongly each factor influenced the score. Risk factors push the score upward;
          protective factors represent safeguards such as stronger passwords, MFA, safer browsing, and lower tracking exposure.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Model</span>
            <span className="font-medium text-foreground">{ml.model}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2">
            <span className="text-muted-foreground">Source</span>
            <span className="font-medium text-foreground">{ml.predictionMetadata.source}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2">
            <span className="text-muted-foreground">Latency</span>
            <span className="font-medium text-foreground">{ml.predictionMetadata.latency_ms}ms</span>
          </div>
        </div>

        <div className="space-y-3">
          {contributions.map((item) => {
            const width = Math.min(100, Math.max(8, Math.abs(item.contribution) * 4))
            const isRisk = item.direction === "risk"

            return (
              <div key={item.feature} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className={isRisk ? "text-sm text-risk-high" : "text-sm text-risk-low"}>
                    {isRisk ? "risk" : "protective"} {Math.abs(item.contribution).toFixed(2)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={isRisk ? "h-full rounded-full bg-risk-high" : "h-full rounded-full bg-risk-low"}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-lg border border-risk-high/30 bg-risk-high/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-risk-high" />
            <h3 className="text-sm font-semibold text-foreground">Top Risk Factors</h3>
          </div>
          <div className="space-y-2">
            {ml.topRiskFactors.slice(0, 4).map((factor) => (
              <div key={factor} className="text-sm text-muted-foreground">{factor}</div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-risk-low/30 bg-risk-low/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-risk-low" />
            <h3 className="text-sm font-semibold text-foreground">Protective Factors</h3>
          </div>
          <div className="space-y-2">
            {ml.protectiveFactors.slice(0, 4).map((factor) => (
              <div key={factor} className="text-sm text-muted-foreground">{factor}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
