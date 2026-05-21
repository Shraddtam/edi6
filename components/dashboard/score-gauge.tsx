"use client"

import { useEffect, useState } from "react"

interface ScoreGaugeProps {
  score: number
  riskLevel: "low" | "medium" | "high"
}

export function ScoreGauge({ score, riskLevel }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score)
    }, 100)
    return () => clearTimeout(timer)
  }, [score])

  const getColor = () => {
    if (riskLevel === "low") return "text-risk-low"
    if (riskLevel === "medium") return "text-risk-medium"
    return "text-risk-high"
  }

  const getStrokeColor = () => {
    if (riskLevel === "low") return "stroke-risk-low"
    if (riskLevel === "medium") return "stroke-risk-medium"
    return "stroke-risk-high"
  }

  const getRiskLabel = () => {
    if (riskLevel === "low") return "Low Risk"
    if (riskLevel === "medium") return "Medium Risk"
    return "High Risk"
  }

  // Calculate the stroke-dashoffset for the progress arc
  const circumference = 2 * Math.PI * 80 // radius = 80
  const progressArc = circumference * 0.75 // 270 degrees
  const offset = progressArc - (progressArc * animatedScore) / 100

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-64 h-64">
        {/* Background Arc */}
        <svg
          className="w-full h-full -rotate-135"
          viewBox="0 0 200 200"
        >
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
            className="text-secondary"
            strokeDasharray={progressArc}
            strokeDashoffset={0}
          />
          {/* Progress Arc */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            strokeWidth="16"
            strokeLinecap="round"
            className={`${getStrokeColor()} transition-all duration-1000 ease-out`}
            strokeDasharray={progressArc}
            strokeDashoffset={offset}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-6xl font-bold ${getColor()} transition-colors duration-300`}>
            {animatedScore}
          </span>
          <span className="text-sm text-muted-foreground mt-1">out of 100</span>
        </div>
      </div>

      {/* Risk Level Badge */}
      <div className={`mt-4 px-6 py-2 rounded-full ${
        riskLevel === "low" ? "bg-risk-low/20 text-risk-low" :
        riskLevel === "medium" ? "bg-risk-medium/20 text-risk-medium" :
        "bg-risk-high/20 text-risk-high"
      } font-semibold text-lg`}>
        {getRiskLabel()}
      </div>

      <p className="mt-4 text-center text-muted-foreground text-sm max-w-xs">
        {riskLevel === "low" && "Your privacy practices are solid. Keep maintaining good habits."}
        {riskLevel === "medium" && "There's room for improvement. Review the recommendations below."}
        {riskLevel === "high" && "Immediate action recommended. Your data is at significant risk."}
      </p>
    </div>
  )
}
