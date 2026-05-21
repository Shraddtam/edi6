from typing import Any, Dict, List, Literal

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    form_data: Dict[str, Any]
    domains: List[str] = Field(default_factory=list)


class FeatureContribution(BaseModel):
    feature: str
    value: float
    contribution: float
    direction: Literal["risk", "protective"]
    label: str


class PredictionMetadata(BaseModel):
    source: Literal["python_ml_service"]
    latency_ms: int
    feature_count: int
    fallback_reason: str | None = None


class MlPredictionResult(BaseModel):
    privacy_score: int
    risk_level: Literal["Low", "Medium", "High"]
    top_risk_factors: List[str]
    protective_factors: List[str]
    feature_contributions: Dict[str, float]
    shap_summary: List[FeatureContribution]
    model: Literal["xgboost", "random_forest"]
    model_version: str
    prediction_metadata: PredictionMetadata


class DomainRiskResult(BaseModel):
    domain: str
    risk_score: int
    risk_level: Literal["Low", "Medium", "High", "Critical"]
    red_flags: List[str]
    privacy_debt_impact: int
    features: Dict[str, Any]


class PredictResponse(BaseModel):
    prediction: MlPredictionResult
    domain_analysis: List[DomainRiskResult]
