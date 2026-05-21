"use client"

import { AlertTriangle, CheckCircle, ArrowRight, Zap } from "lucide-react"
import { AIRecommendation } from "@/lib/types"

interface RecommendationPanelProps {
  recommendations: AIRecommendation
}

export function RecommendationPanel({ recommendations }: RecommendationPanelProps) {
  return (
    <div className="space-y-8">
      {/* Priority Improvements */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-risk-high" />
          <h3 className="text-lg font-semibold text-foreground">Priority Actions</h3>
        </div>
        <div className="space-y-3">
          {recommendations.priorityImprovements.map((improvement, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg bg-risk-high/10 border border-risk-high/30"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-risk-high text-background flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <p className="text-sm text-foreground">{improvement}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Risks */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-risk-medium" />
          <h3 className="text-lg font-semibold text-foreground">Identified Risks</h3>
        </div>
        <div className="space-y-2">
          {recommendations.topRisks.map((risk, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
            >
              <AlertTriangle className="h-4 w-4 text-risk-medium flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{risk}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-risk-low" />
          <h3 className="text-lg font-semibold text-foreground">Recommendations</h3>
        </div>
        <div className="space-y-2">
          {recommendations.recommendations.map((rec, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors group"
            >
              <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform" />
              <p className="text-sm text-foreground">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
