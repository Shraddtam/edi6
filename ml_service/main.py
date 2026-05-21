from fastapi import FastAPI
import time

from ml_service.model_registry import get_registry
from ml_service.schemas import PredictRequest, PredictResponse

app = FastAPI(title="Privacy Debt ML Service", version="1.0.0")


@app.on_event("startup")
def warm_models() -> None:
    get_registry()


@app.get("/health")
def health() -> dict:
    registry = get_registry()
    return {
        "ok": True,
        "model_dir": str(registry.model_dir),
        "d1_feature_count": len(registry.metadata.get("d1_features", [])),
        "d2_feature_count": len(registry.metadata.get("d2_features", [])),
    }


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> dict:
    started_at = time.perf_counter()
    result = get_registry().predict(payload.form_data, payload.domains)
    prediction = result["prediction"]
    print(
        "[ml-service] prediction.completed "
        f"model={prediction['model']} "
        f"score={prediction['privacy_score']} "
        f"risk={prediction['risk_level']} "
        f"domains={len(result['domain_analysis'])} "
        f"duration_ms={round((time.perf_counter() - started_at) * 1000)}",
        flush=True,
    )
    for domain in result["domain_analysis"][:12]:
        print(
            "[ml-service] domain.analyzed "
            f"domain={domain['domain']} "
            f"risk={domain['risk_score']} "
            f"level={domain['risk_level']} "
            f"flags={','.join(domain['red_flags']) if domain['red_flags'] else 'none'}",
            flush=True,
        )
    return result
