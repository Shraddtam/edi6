import type { PrivacyFormData } from "@/lib/types"

export type MlRiskLevel = "Low" | "Medium" | "High" | "Critical"

export type FeatureContribution = {
  feature: string
  value: number
  contribution: number
  direction: "risk" | "protective"
  label: string
}

export type DomainRiskResult = {
  domain: string
  risk_score: number
  risk_level: MlRiskLevel
  red_flags: string[]
  privacy_debt_impact: number
  features: Record<string, number | boolean | string>
}

export type MlPredictionResult = {
  privacy_score: number
  risk_level: Exclude<MlRiskLevel, "Critical">
  top_risk_factors: string[]
  protective_factors: string[]
  feature_contributions: Record<string, number>
  shap_summary: FeatureContribution[]
  model: "xgboost" | "random_forest" | "rule_fallback"
  model_version: string
  prediction_metadata: {
    source: "python_ml_service" | "typescript_fallback"
    latency_ms: number
    feature_count: number
    fallback_reason?: string
  }
}

export type MlAnalyzeInput = {
  formData: PrivacyFormData
  domains: string[]
}

export type MlAnalyzeResult = {
  prediction: MlPredictionResult
  domain_analysis: DomainRiskResult[]
}

export type MlModelMetadata = {
  d1_features: string[]
  d2_features: string[]
  awareness_map: Record<string, number>
  label_map: Record<string, number>
  risk_level_map: Record<string, string>
}
