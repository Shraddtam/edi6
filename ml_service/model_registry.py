from __future__ import annotations

import json
import os
import time
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

import joblib
import numpy as np
import pandas as pd

from ml_service.domain_risk import analyze_domain
from ml_service.feature_engineering import build_privacy_features


DEFAULT_MODEL_DIR = Path(__file__).resolve().parents[2] / "privacy_debt_models-20260520T150333Z-3-001" / "privacy_debt_models"
MODEL_VERSION = "privacy-debt-pkl-v1"


def _risk_level(score: int) -> str:
    if score >= 70:
        return "High"
    if score >= 31:
        return "Medium"
    return "Low"


def _feature_label(feature: str) -> str:
    return feature.replace("_", " ").title()


class ModelRegistry:
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.metadata = self._load_metadata()
        self.xgb_privacy_debt = joblib.load(model_dir / "xgb_privacy_debt.pkl")
        self.rf_privacy_debt = joblib.load(model_dir / "rf_privacy_debt.pkl")
        self.xgb_domain_risk = joblib.load(model_dir / "xgb_domain_risk.pkl")
        self.rf_domain_risk = joblib.load(model_dir / "rf_domain_risk.pkl")
        self.xgb_domain_clf = joblib.load(model_dir / "xgb_domain_clf.pkl")
        self.shap_explainer = self._build_shap_explainer()

    def _load_metadata(self) -> Dict[str, Any]:
        with open(self.model_dir / "metadata.json", "r", encoding="utf-8") as file:
            return json.load(file)

    def _build_shap_explainer(self):
        try:
            import shap

            return shap.TreeExplainer(self.xgb_privacy_debt)
        except Exception:
            return None

    def _predict_score(self, frame: pd.DataFrame) -> tuple[int, str]:
        try:
            prediction = self.xgb_privacy_debt.predict(frame)
            return int(np.clip(round(float(prediction[0])), 0, 100)), "xgboost"
        except Exception:
            prediction = self.rf_privacy_debt.predict(frame)
            return int(np.clip(round(float(prediction[0])), 0, 100)), "random_forest"

    def _explain(self, frame: pd.DataFrame, features: Dict[str, float]) -> tuple[Dict[str, float], list[Dict[str, Any]]]:
        if self.shap_explainer is not None:
            try:
                shap_values = self.shap_explainer.shap_values(frame)
                values = shap_values[0] if isinstance(shap_values, np.ndarray) else shap_values.values[0]
                contributions = {
                    feature: round(float(value), 4)
                    for feature, value in zip(frame.columns.tolist(), values)
                }
            except Exception:
                contributions = self._approximate_contributions(features)
        else:
            contributions = self._approximate_contributions(features)

        protective_features = {
            "privacy_awareness",
            "avg_password_strength",
            "vpn_usage",
            "mfa_enabled",
            "browser_security_score",
            "protection_score",
        }

        shap_summary = [
            {
                "feature": feature,
                "value": features.get(feature, 0),
                "contribution": contribution,
                "direction": "protective" if contribution < 0 or feature in protective_features else "risk",
                "label": _feature_label(feature),
            }
            for feature, contribution in contributions.items()
        ]
        shap_summary.sort(key=lambda item: abs(item["contribution"]), reverse=True)
        return contributions, shap_summary

    def _approximate_contributions(self, features: Dict[str, float]) -> Dict[str, float]:
        weights = {
            "password_reuse_count": 1.4,
            "risky_domains_visited": 1.2,
            "third_party_apps": 0.7,
            "inactive_accounts": 0.9,
            "tracker_acceptance_rate": 12,
            "public_profile_score": 0.18,
            "pii_shared_frequency": 0.16,
            "risk_burden": 0.28,
            "exposure_index": 0.22,
            "awareness_adjusted_risk": 0.2,
            "avg_password_strength": -0.12,
            "mfa_enabled": -12,
            "browser_security_score": -0.1,
            "protection_score": -0.18,
            "privacy_awareness": -3,
        }
        return {feature: round(weights.get(feature, 0.04) * value, 4) for feature, value in features.items()}

    def predict(self, form_data: Dict[str, Any], domains: list[str]) -> Dict[str, Any]:
        started_at = time.perf_counter()
        features = build_privacy_features(form_data, self.metadata["d1_features"])
        frame = pd.DataFrame([features], columns=self.metadata["d1_features"])
        score, model_name = self._predict_score(frame)
        contributions, shap_summary = self._explain(frame, features)
        top_risk_factors = [
            item["label"] for item in shap_summary if item["direction"] == "risk" and item["contribution"] > 0
        ][:5]
        protective_factors = [item["label"] for item in shap_summary if item["direction"] == "protective"][:5]

        return {
            "prediction": {
                "privacy_score": score,
                "risk_level": _risk_level(score),
                "top_risk_factors": top_risk_factors,
                "protective_factors": protective_factors,
                "feature_contributions": contributions,
                "shap_summary": shap_summary,
                "model": model_name,
                "model_version": MODEL_VERSION,
                "prediction_metadata": {
                    "source": "python_ml_service",
                    "latency_ms": round((time.perf_counter() - started_at) * 1000),
                    "feature_count": len(features),
                },
            },
            "domain_analysis": [analyze_domain(domain) for domain in domains],
        }


@lru_cache(maxsize=1)
def get_registry() -> ModelRegistry:
    model_dir = Path(os.environ.get("ML_MODELS_DIR", DEFAULT_MODEL_DIR))
    return ModelRegistry(model_dir)
