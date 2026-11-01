"""
FineGuard - Loan Risk Prediction API
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.schemas.loan import LoanPredictionRequest, LoanPredictionResponse
from app.services.loan_service import analyze_loan_risk
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/loans", tags=["Loan Risk"])

@router.post("/predict", response_model=LoanPredictionResponse)
async def predict_loan_risk(
    req: LoanPredictionRequest,
    current_user: Optional[dict] = Depends(get_current_user_payload)
):
    try:
        result = analyze_loan_risk(req)
        return result
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail="Machine learning model is not yet compiled. Please trigger training first."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference error during risk computation: {str(e)}"
        )
