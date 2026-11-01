"""
FineGuard - Saved Report Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class ReportCreate(BaseModel):
    title: str = Field(default="Loan Risk Assessment Report", max_length=120)
    notes: Optional[str] = Field(default=None, max_length=500)
    inputs: Dict[str, Any]
    result: Dict[str, Any]

class ReportSummary(BaseModel):
    id: str
    user_id: str
    title: str
    notes: Optional[str] = None
    risk_tier: str
    risk_score: int
    default_probability: float
    loan_amount: float
    monthly_income: float
    debt_to_income_ratio: float
    created_at: str

class ReportDetail(BaseModel):
    id: str
    user_id: str
    title: str
    notes: Optional[str] = None
    inputs: Dict[str, Any]
    result: Dict[str, Any]
    risk_tier: str
    risk_score: int
    default_probability: float
    created_at: str
    model_version: str = "1.0.0"
