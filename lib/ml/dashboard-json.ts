import "server-only"

import type { MlAnalyzeResult } from "@/lib/ml/types"

export function buildMlDashboardJson(result: MlAnalyzeResult) {
  return {
    scoreExplanation: {
      model: result.prediction.model,
      modelVersion: result.prediction.model_version,
      topRiskFactors: result.prediction.top_risk_factors,
      protectiveFactors: result.prediction.protective_factors,
      shapSummary: result.prediction.shap_summary,
    },
    domainRisk: result.domain_analysis,
    predictionMetadata: result.prediction.prediction_metadata,
  }
}
