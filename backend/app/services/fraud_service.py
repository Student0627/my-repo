"""
FineGuard - Real-Time Financial Fraud Detection Service
Orchestrates anomaly scoring, velocity/surge metrics, and TreeSHAP risk attribution.
"""

from typing import Dict, Any
from app.schemas.fraud import (
    FraudPredictionRequest,
    FraudPredictionResponse,
    FraudPredictionResult
)
from ml.explainability.fraud_explainer import FraudDetectionExplainer

_fraud_explainer: FraudDetectionExplainer = None

def get_fraud_explainer() -> FraudDetectionExplainer:
    global _fraud_explainer
    if _fraud_explainer is None:
        _fraud_explainer = FraudDetectionExplainer()
    return _fraud_explainer

def analyze_fraud_risk(req: FraudPredictionRequest) -> FraudPredictionResponse:
    explainer = get_fraud_explainer()
    
    surge_ratio = round(req.transaction_amount / req.account_avg_transaction, 2)
    
    raw_inputs = {
        "transaction_amount": float(req.transaction_amount),
        "account_avg_transaction": float(req.account_avg_transaction),
        "amount_to_avg_ratio": float(surge_ratio),
        "transaction_hour": int(req.transaction_hour),
        "merchant_category": int(req.merchant_category),
        "transaction_velocity_1h": int(req.transaction_velocity_1h),
        "is_foreign_transaction": int(req.is_foreign_transaction),
        "device_fingerprint_match": int(req.device_fingerprint_match)
    }
    
    result = explainer.explain_instance(raw_inputs)
    
    pred = FraudPredictionResult(
        fraud_probability=result["prediction"]["fraud_probability"],
        action=result["prediction"]["action"],
        threat_level=result["prediction"]["threat_level"],
        action_desc=result["prediction"]["action_desc"],
        base_value=result["prediction"]["base_value"]
    )
    
    return FraudPredictionResponse(
        prediction=pred,
        surge_ratio=surge_ratio,
        contributions=result["contributions"],
        risk_increasing_factors=result["risk_increasing_factors"],
        risk_decreasing_factors=result["risk_decreasing_factors"],
        narrative=result["narrative"],
        raw_inputs=raw_inputs
    )
