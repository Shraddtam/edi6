"use client"

import { GlobeLock } from "lucide-react"
import type { PrivacyScore } from "@/lib/types"

type DomainAnalysis = NonNullable<PrivacyScore["ml"]>["domainAnalysis"]

interface DomainRiskPanelProps {
  domains?: DomainAnalysis
}

function riskClass(level: string) {
  if (level === "Critical" || level === "High") return "text-risk-high"
  if (level === "Medium") return "text-risk-medium"
  return "text-risk-low"
}

export function DomainRiskPanel({ domains = [] }: DomainRiskPanelProps) {
  if (domains.length === 0) {
    return (
      <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        No domains were detected in the simulator inputs.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {domains.slice(0, 6).map((domain) => (
        <div key={domain.domain} className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <GlobeLock className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate text-sm font-medium text-foreground">{domain.domain}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${riskClass(domain.risk_level)}`}>
                {domain.risk_level}
              </span>
              <span className="text-sm text-muted-foreground">{domain.risk_score}/100</span>
            </div>
          </div>
          {domain.red_flags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {domain.red_flags.map((flag) => (
                <span key={flag} className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                  {flag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
