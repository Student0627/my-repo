"""
FineGuard - Investment & Fixed Deposit (FD) Risk Prediction API Router
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.schemas.investment import InvestmentPredictionRequest, InvestmentPredictionResponse
from app.services.investment_service import analyze_investment_risk
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/investments", tags=["Investment Risk"])

@router.post("/predict", response_model=InvestmentPredictionResponse)
async def predict_investment_risk(
    req: InvestmentPredictionRequest,
    current_user: Optional[dict] = Depends(get_current_user_payload)
):
    try:
        return analyze_investment_risk(req)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Investment risk machine learning model is not yet compiled. Please run training pipeline."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference error during investment risk computation: {str(e)}"
        )
