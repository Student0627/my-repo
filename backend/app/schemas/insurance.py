from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class InsurancePredictionRequest(BaseModel):
    age: int = Field(..., ge=18, le=90, description="Applicant age")
    annual_income: float = Field(..., gt=0, description="Gross annual income in INR")
    coverage_amount: float = Field(..., gt=0, description="Sum assured in INR")
    bmi: float = Field(..., ge=10.0, le=60.0, description="Body Mass Index")
    smoker_status: int = Field(..., ge=0, le=1, description="0=Non-smoker, 1=Smoker")
    pre_existing_conditions: int = Field(..., ge=0, le=3, description="0=None, 1=Minor, 2=Diabetes/Chronic, 3=Critical")
    family_medical_history: int = Field(default=0, ge=0, le=1, description="0=Clean, 1=Critical History")

class InsurancePredictionResult(BaseModel):
    claim_risk_probability: float
    risk_tier: str
    premium_loading: str
    recommendation: str
    base_value: float

class InsurancePredictionResponse(BaseModel):
    prediction: InsurancePredictionResult
    coverage_to_income_ratio: float
    contributions: List[Dict[str, Any]]
    risk_increasing_factors: List[Dict[str, Any]]
    risk_decreasing_factors: List[Dict[str, Any]]
    narrative: str
    raw_inputs: Dict[str, Any]
