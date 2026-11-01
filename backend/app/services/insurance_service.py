"""
FineGuard - Insurance Risk Analysis Service
Orchestrates underwriting assessment, morbidity loading, and SHAP feature attribution.
"""

from typing import Dict, Any
from app.schemas.insurance import (
    InsurancePredictionRequest,
    InsurancePredictionResponse,
    InsurancePredictionResult
)
from ml.explainability.insurance_explainer import InsuranceRiskExplainer

_insurance_explainer: InsuranceRiskExplainer = None

def get_insurance_explainer() -> InsuranceRiskExplainer:
    global _insurance_explainer
    if _insurance_explainer is None:
        _insurance_explainer = InsuranceRiskExplainer()
    return _insurance_explainer

def analyze_insurance_risk(req: InsurancePredictionRequest) -> InsurancePredictionResponse:
    explainer = get_insurance_explainer()
    
    cov_ratio = round(req.coverage_amount / req.annual_income, 2)
    
    raw_inputs = {
        "age": req.age,
        "annual_income": float(req.annual_income),
        "coverage_amount": float(req.coverage_amount),
        "bmi": float(req.bmi),
        "smoker_status": int(req.smoker_status),
        "pre_existing_conditions": int(req.pre_existing_conditions),
        "family_medical_history": int(req.family_medical_history),
        "coverage_to_income_ratio": float(cov_ratio)
    }
    
    result = explainer.explain_instance(raw_inputs)
    
    pred = InsurancePredictionResult(
        claim_risk_probability=result["prediction"]["claim_risk_probability"],
        risk_tier=result["prediction"]["risk_tier"],
        premium_loading=result["prediction"]["premium_loading"],
        recommendation=result["prediction"]["recommendation"],
        base_value=result["prediction"]["base_value"]
    )
    
    return InsurancePredictionResponse(
        prediction=pred,
        coverage_to_income_ratio=cov_ratio,
        contributions=result["contributions"],
        risk_increasing_factors=result["risk_increasing_factors"],
        risk_decreasing_factors=result["risk_decreasing_factors"],
        narrative=result["narrative"],
        raw_inputs=raw_inputs
    )
