"""
FineGuard - Real-Time Transaction Fraud Detection API Router
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.schemas.fraud import FraudPredictionRequest, FraudPredictionResponse
from app.services.fraud_service import analyze_fraud_risk
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/fraud", tags=["Fraud Detection"])

@router.post("/predict", response_model=FraudPredictionResponse)
async def predict_fraud_risk(
    req: FraudPredictionRequest,
    current_user: Optional[dict] = Depends(get_current_user_payload)
):
    try:
        return analyze_fraud_risk(req)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Fraud detection machine learning model is not yet compiled. Please run training pipeline."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference error during fraud risk computation: {str(e)}"
        )
