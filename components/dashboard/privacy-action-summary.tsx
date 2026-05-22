"use client"

import { CheckCircle2, KeyRound, LockKeyhole, Settings2 } from "lucide-react"
import type { AnalysisResult } from "@/lib/types"

interface PrivacyActionSummaryProps {
  analysis: AnalysisResult
}

export function PrivacyActionSummary({ analysis }: PrivacyActionSummaryProps) {
  const breakdown = analysis.score.breakdown
  const sortedRisks = [
    { label: "Accounts", value: breakdown.accountsRisk, icon: Settings2 },
    { label: "Passwords", value: breakdown.passwordRisk, icon: KeyRound },
    { label: "Third-party access", value: breakdown.thirdPartyRisk, icon: LockKeyhole },
  ].sort((a, b) => b.value - a.value)

  const primary = sortedRisks[0]
  const Icon = primary.icon

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-border p-4">
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Biggest Driver</h3>
        </div>
        <div className="text-2xl font-bold text-foreground">{primary.label}</div>
        <p className="mt-1 text-sm text-muted-foreground">
          {Math.round(primary.value)}% risk contribution
        </p>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-risk-low" />
          <h3 className="text-sm font-semibold text-foreground">First Fix</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {analysis.recommendations.priorityImprovements[0] || "Review privacy settings and app permissions."}
        </p>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="mb-3 flex items-center gap-2">
          <LockKeyhole className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Model Status</h3>
        </div>
        <div className="text-sm font-medium text-foreground">
          {analysis.score.ml?.model || "baseline"} scoring
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {analysis.score.ml ? "explainable privacy debt model" : "local score engine"}
        </p>
      </div>
    </div>
  )
}
