from pydantic import BaseModel, Field
from typing import List, Dict, Any

class FraudPredictionRequest(BaseModel):
    transaction_amount: float = Field(..., gt=0, description="Transaction ticket in INR")
    account_avg_transaction: float = Field(..., gt=0, description="Average transaction amount in INR")
    transaction_hour: int = Field(..., ge=0, le=23, description="Hour of transaction (0-23)")
    merchant_category: int = Field(..., ge=0, le=3, description="0=Retail, 1=Utility, 2=Luxury, 3=Crypto/Forex")
    transaction_velocity_1h: int = Field(default=1, ge=0, le=50, description="Transactions in last hour")
    is_foreign_transaction: int = Field(default=0, ge=0, le=1, description="0=Domestic, 1=Cross-border")
    device_fingerprint_match: int = Field(default=0, ge=0, le=1, description="0=Recognized device, 1=Unknown device")

class FraudPredictionResult(BaseModel):
    fraud_probability: float
    action: str
    threat_level: str
    action_desc: str
    base_value: float

class FraudPredictionResponse(BaseModel):
    prediction: FraudPredictionResult
    surge_ratio: float
    contributions: List[Dict[str, Any]]
    risk_increasing_factors: List[Dict[str, Any]]
    risk_decreasing_factors: List[Dict[str, Any]]
    narrative: str
    raw_inputs: Dict[str, Any]
