from pydantic import BaseModel, Field
from typing import List, Dict, Any

class InvestmentPredictionRequest(BaseModel):
    investment_amount: float = Field(..., gt=0, description="Total portfolio capital in INR")
    investor_age: int = Field(..., ge=18, le=95, description="Investor age")
    time_horizon_years: int = Field(..., ge=1, le=30, description="Investment horizon in years")
    risk_tolerance: int = Field(..., ge=1, le=3, description="1=Conservative, 2=Moderate, 3=Aggressive")
    equity_allocation_pct: float = Field(..., ge=0, le=100, description="Equity percentage")
    fd_debt_allocation_pct: float = Field(..., ge=0, le=100, description="Fixed Deposit & Debt percentage")
    emergency_fund_months: int = Field(default=3, ge=0, le=24, description="Emergency fund coverage in months")

class InvestmentPredictionResult(BaseModel):
    volatility_risk_probability: float
    capital_safety_index: int
    risk_tier: str
    recommendation: str
    base_value: float

class InvestmentPredictionResponse(BaseModel):
    prediction: InvestmentPredictionResult
    contributions: List[Dict[str, Any]]
    risk_increasing_factors: List[Dict[str, Any]]
    risk_decreasing_factors: List[Dict[str, Any]]
    narrative: str
    raw_inputs: Dict[str, Any]
