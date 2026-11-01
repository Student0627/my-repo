"""
FineGuard - Loan Risk Prediction and Simulation Schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class LoanPredictionRequest(BaseModel):
    monthly_income: float = Field(..., gt=0, description="Monthly gross income in INR")
    monthly_debt: float = Field(..., ge=0, description="Existing monthly debt commitments in INR")
    loan_amount: float = Field(..., gt=0, description="Requested loan amount in INR")
    loan_term_months: int = Field(..., ge=6, le=120, description="Loan term duration in months")
    credit_score: int = Field(..., ge=300, le=900, description="Borrower CIBIL credit score (300-900)")
    employment_years: float = Field(default=3.0, ge=0, le=50, description="Employment tenure in years")
    credit_history: Optional[int] = Field(default=None, ge=0, le=3, description="0=Poor, 1=Fair, 2=Good, 3=Excellent")

class FeatureContribution(BaseModel):
    feature: str
    label: str
    feature_value: float
    shap_value: float
    impact: str # "increase" | "decrease"

class PredictionResult(BaseModel):
    default_probability: float
    predicted_label: int
    risk_tier: str
    risk_score: int
    base_value: float

class LoanPredictionResponse(BaseModel):
    prediction: PredictionResult
    debt_to_income_ratio: float
    loan_to_income_ratio: float
    contributions: List[FeatureContribution]
    risk_increasing_factors: List[FeatureContribution]
    risk_decreasing_factors: List[FeatureContribution]
    narrative: str
    model_version: str = "1.0.0"
    raw_inputs: Dict[str, Any]

class WhatIfRequest(BaseModel):
    original: LoanPredictionRequest
    modified: LoanPredictionRequest

class WhatIfComparison(BaseModel):
    probability_diff: float # modified - original
    risk_score_diff: int
    dti_diff: float
    summary: str

class WhatIfResponse(BaseModel):
    original_result: LoanPredictionResponse
    modified_result: LoanPredictionResponse
    comparison: WhatIfComparison
