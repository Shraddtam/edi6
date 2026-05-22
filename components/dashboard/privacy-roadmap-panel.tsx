"use client"

import { CalendarCheck, Clock3, Target } from "lucide-react"
import type { AnalysisResult } from "@/lib/types"

interface PrivacyRoadmapPanelProps {
  analysis: AnalysisResult
}

export function PrivacyRoadmapPanel({ analysis }: PrivacyRoadmapPanelProps) {
  const priority = analysis.recommendations.priorityImprovements
  const recommendations = analysis.recommendations.recommendations

  const roadmap = [
    {
      title: "Today",
      icon: Target,
      items: priority.slice(0, 2),
    },
    {
      title: "This Week",
      icon: Clock3,
      items: recommendations.slice(0, 3),
    },
    {
      title: "This Month",
      icon: CalendarCheck,
      items: recommendations.slice(3, 6),
    },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {roadmap.map((section) => {
        const Icon = section.icon

        return (
          <div key={section.title} className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
            </div>
            <div className="space-y-2">
              {(section.items.length ? section.items : ["Review account permissions and remove unused access."]).map(
                (item) => (
                  <p key={item} className="text-sm text-muted-foreground">
                    {item}
                  </p>
                )
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
