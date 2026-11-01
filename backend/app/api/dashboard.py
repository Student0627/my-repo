"""
FineGuard - Overview Dashboard API
"""

import json
from pathlib import Path
from fastapi import APIRouter, Depends
from app.database.repo import Repository
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

METADATA_PATH = Path(__file__).resolve().parent.parent.parent / "ml" / "saved_models" / "model_metadata.json"

@router.get("/summary")
async def get_dashboard_summary(current_user: dict = Depends(get_current_user_payload)):
    user_id = current_user["sub"]
    stats = await Repository.get_dashboard_stats(user_id)

    # Load real model evaluation metrics if available
    model_info = {}
    if METADATA_PATH.exists():
        try:
            with open(METADATA_PATH, "r") as f:
                meta = json.load(f)
                model_info = {
                    "model_name": meta.get("model_name"),
                    "version": meta.get("version"),
                    "accuracy": meta.get("test_metrics", {}).get("accuracy"),
                    "roc_auc": meta.get("test_metrics", {}).get("roc_auc"),
                    "test_samples": meta.get("test_samples")
                }
        except Exception:
            pass

    return {
        "stats": {
            "total_analyses": stats["total_analyses"],
            "loan_risk_assessments": stats["total_analyses"],
            "saved_reports": stats["saved_reports_count"],
            "low_risk": stats["low_risk_count"],
            "moderate_risk": stats["moderate_risk_count"],
            "high_risk": stats["high_risk_count"]
        },
        "history": stats["history"],
        "recent_reports": stats["recent_reports"],
        "model_status": {
            "is_trained": METADATA_PATH.exists(),
            "details": model_info
        }
    }
