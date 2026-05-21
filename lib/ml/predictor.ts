import "server-only"

import { calculatePrivacyScore } from "@/lib/score-engine"
import type { PrivacyFormData } from "@/lib/types"
import { analyzeDomainRisk } from "@/lib/ml/domain-risk"
import { buildPrivacyFeatureVector, extractDomainsFromFormData } from "@/lib/ml/feature-engineering"
import { getMlServiceUrl, loadModelMetadata } from "@/lib/ml/model-loader"
import { buildApproximateContributions, normalizeFeatureContributions } from "@/lib/ml/shap-utils"
import type { MlAnalyzeResult, MlPredictionResult } from "@/lib/ml/types"

let serviceAvailable: boolean | null = null
let lastServiceFailureAt = 0
const serviceRetryIntervalMs = 30_000

function toMlRiskLevel(score: number): MlPredictionResult["risk_level"] {
  if (score >= 70) return "High"
  if (score >= 31) return "Medium"
  return "Low"
}

function buildFallbackPrediction(
  data: PrivacyFormData,
  fallbackReason: string,
  startedAt: number
): MlPredictionResult {
  const score = calculatePrivacyScore(data)
  const features = buildPrivacyFeatureVector(data)
  const featureContributions = buildApproximateContributions(features)
  const shapSummary = normalizeFeatureContributions(featureContributions, features)
  const topRiskFactors = shapSummary
    .filter((item) => item.direction === "risk" && item.contribution > 0)
    .slice(0, 5)
    .map((item) => item.label)
  const protectiveFactors = shapSummary
    .filter((item) => item.direction === "protective")
    .slice(0, 5)
    .map((item) => item.label)

  return {
    privacy_score: score.totalScore,
    risk_level: toMlRiskLevel(score.totalScore),
    top_risk_factors: topRiskFactors,
    protective_factors: protectiveFactors,
    feature_contributions: featureContributions,
    shap_summary: shapSummary,
    model: "rule_fallback",
    model_version: "fallback-v1",
    prediction_metadata: {
      source: "typescript_fallback",
      latency_ms: Date.now() - startedAt,
      feature_count: Object.keys(features).length,
      fallback_reason: fallbackReason,
    },
  }
}

async function callPythonMlService(data: PrivacyFormData, domains: string[]) {
  const response = await fetch(`${getMlServiceUrl()}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      form_data: data,
      domains,
    }),
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    throw new Error(`ML service prediction failed with ${response.status}`)
  }

  return (await response.json()) as MlAnalyzeResult
}

export async function analyzeWithMl(data: PrivacyFormData): Promise<MlAnalyzeResult> {
  const startedAt = Date.now()
  const domains = extractDomainsFromFormData(data)

  await loadModelMetadata().catch(() => null)

  if (serviceAvailable !== false || Date.now() - lastServiceFailureAt > serviceRetryIntervalMs) {
    try {
      const result = await callPythonMlService(data, domains)
      serviceAvailable = true
      return result
    } catch (error) {
      serviceAvailable = false
      lastServiceFailureAt = Date.now()
      const prediction = buildFallbackPrediction(
        data,
        error instanceof Error ? error.message : "ML service unavailable",
        startedAt
      )

      return {
        prediction,
        domain_analysis: domains.map(analyzeDomainRisk),
      }
    }
  }

  return {
    prediction: buildFallbackPrediction(data, "ML service unavailable", startedAt),
    domain_analysis: domains.map(analyzeDomainRisk),
  }
}
