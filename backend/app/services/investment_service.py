"""
FineGuard - Investment & Fixed Deposit (FD) Risk Analysis Service
Orchestrates portfolio volatility scoring, capital safety index, and SHAP attribution.
"""

from typing import Dict, Any
from app.schemas.investment import (
    InvestmentPredictionRequest,
    InvestmentPredictionResponse,
    InvestmentPredictionResult
)
from ml.explainability.investment_explainer import InvestmentRiskExplainer

_investment_explainer: InvestmentRiskExplainer = None

def get_investment_explainer() -> InvestmentRiskExplainer:
    global _investment_explainer
    if _investment_explainer is None:
        _investment_explainer = InvestmentRiskExplainer()
    return _investment_explainer

def analyze_investment_risk(req: InvestmentPredictionRequest) -> InvestmentPredictionResponse:
    explainer = get_investment_explainer()
    
    raw_inputs = {
        "investment_amount": float(req.investment_amount),
        "investor_age": int(req.investor_age),
        "time_horizon_years": int(req.time_horizon_years),
        "risk_tolerance": int(req.risk_tolerance),
        "equity_allocation_pct": float(req.equity_allocation_pct),
        "fd_debt_allocation_pct": float(req.fd_debt_allocation_pct),
        "emergency_fund_months": int(req.emergency_fund_months)
    }
    
    result = explainer.explain_instance(raw_inputs)
    
    pred = InvestmentPredictionResult(
        volatility_risk_probability=result["prediction"]["volatility_risk_probability"],
        capital_safety_index=result["prediction"]["capital_safety_index"],
        risk_tier=result["prediction"]["risk_tier"],
        recommendation=result["prediction"]["recommendation"],
        base_value=result["prediction"]["base_value"]
    )
    
    return InvestmentPredictionResponse(
        prediction=pred,
        contributions=result["contributions"],
        risk_increasing_factors=result["risk_increasing_factors"],
        risk_decreasing_factors=result["risk_decreasing_factors"],
        narrative=result["narrative"],
        raw_inputs=raw_inputs
    )
