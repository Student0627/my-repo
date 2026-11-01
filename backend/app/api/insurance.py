"""
FineGuard - Insurance Risk Prediction API Router
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Optional
from app.schemas.insurance import InsurancePredictionRequest, InsurancePredictionResponse
from app.services.insurance_service import analyze_insurance_risk
from app.services.policy_analyzer_service import analyze_policy_content
from app.core.security import get_current_user_payload, get_optional_user_payload

router = APIRouter(prefix="/insurance", tags=["Insurance Risk"])

@router.post("/predict", response_model=InsurancePredictionResponse)
async def predict_insurance_risk(
    req: InsurancePredictionRequest,
    current_user: Optional[dict] = Depends(get_current_user_payload)
):
    try:
        return analyze_insurance_risk(req)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Insurance risk machine learning model is not yet compiled. Please run training pipeline."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference error during insurance risk computation: {str(e)}"
        )

@router.post("/analyze-policy")
async def analyze_policy_pdf(
    file: Optional[UploadFile] = File(None),
    preset: Optional[str] = Form(None),
    raw_text: Optional[str] = Form(None),
    current_user: Optional[dict] = Depends(get_optional_user_payload)
):
    """
    Parses an uploaded insurance policy document PDF using PyPDF,
    extracts fine-print clauses, evaluates policy health, and returns official company purchase links.
    """
    try:
        file_bytes = None
        filename = None
        if file is not None:
            filename = file.filename
            file_bytes = await file.read()
        return analyze_policy_content(
            file_bytes=file_bytes,
            filename=filename,
            preset_code=preset,
            raw_text=raw_text
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=400,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing insurance policy document: {str(e)}"
        )

