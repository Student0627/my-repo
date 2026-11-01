"""
FineGuard - Loan Risk Analysis & Simulation Service
Orchestrates model scoring, automated ratio derivation, and SHAP explainability.
"""

from typing import Dict, Any
from app.schemas.loan import (
    LoanPredictionRequest, LoanPredictionResponse, PredictionResult,
    FeatureContribution, WhatIfRequest, WhatIfResponse, WhatIfComparison
)
from ml.explainability.shap_explainer import LoanRiskExplainer

# Singleton explainer
_explainer_instance: LoanRiskExplainer = None

def get_explainer() -> LoanRiskExplainer:
    global _explainer_instance
    if _explainer_instance is None:
        _explainer_instance = LoanRiskExplainer()
    return _explainer_instance

def prepare_feature_dict(req: LoanPredictionRequest) -> Dict[str, float]:
    """
    Derives financial ratios and categorical indicators consistently.
    """
    # Auto-infer credit history tier from FICO score if omitted
    if req.credit_history is None:
        if req.credit_score < 580:
            ch = 0
        elif req.credit_score < 670:
            ch = 1
        elif req.credit_score < 740:
            ch = 2
        else:
            ch = 3
    else:
        ch = req.credit_history

    dti = round(req.monthly_debt / req.monthly_income, 4)
    lti = round(req.loan_amount / (req.monthly_income * 12), 4)

    return {
        "monthly_income": float(req.monthly_income),
        "monthly_debt": float(req.monthly_debt),
        "loan_amount": float(req.loan_amount),
        "loan_term_months": int(req.loan_term_months),
        "credit_score": int(req.credit_score),
        "employment_years": float(req.employment_years),
        "credit_history": int(ch),
        "debt_to_income_ratio": float(dti),
        "loan_to_income_ratio": float(lti)
    }

def analyze_loan_risk(req: LoanPredictionRequest) -> LoanPredictionResponse:
    explainer = get_explainer()
    features = prepare_feature_dict(req)
    result = explainer.explain_instance(features)

    prediction_obj = PredictionResult(
        default_probability=result["prediction"]["default_probability"],
        predicted_label=result["prediction"]["predicted_label"],
        risk_tier=result["prediction"]["risk_tier"],
        risk_score=result["prediction"]["risk_score"],
        base_value=result["prediction"]["base_value"]
    )

    contributions = [FeatureContribution(**c) for c in result["contributions"]]
    increasing = [FeatureContribution(**c) for c in result["risk_increasing_factors"]]
    decreasing = [FeatureContribution(**c) for c in result["risk_decreasing_factors"]]

    return LoanPredictionResponse(
        prediction=prediction_obj,
        debt_to_income_ratio=features["debt_to_income_ratio"],
        loan_to_income_ratio=features["loan_to_income_ratio"],
        contributions=contributions,
        risk_increasing_factors=increasing,
        risk_decreasing_factors=decreasing,
        narrative=result["narrative"],
        model_version="1.0.0",
        raw_inputs=features
    )

def run_what_if_simulation(req: WhatIfRequest) -> WhatIfResponse:
    original_result = analyze_loan_risk(req.original)
    modified_result = analyze_loan_risk(req.modified)

    p_orig = original_result.prediction.default_probability
    p_mod = modified_result.prediction.default_probability
    prob_diff = round(p_mod - p_orig, 4)

    s_orig = original_result.prediction.risk_score
    s_mod = modified_result.prediction.risk_score
    score_diff = s_mod - s_orig

    dti_orig = original_result.debt_to_income_ratio
    dti_mod = modified_result.debt_to_income_ratio
    dti_diff = round((dti_mod - dti_orig) * 100, 2)

    # Truthful narrative based on real model output
    if prob_diff < -0.01:
        direction = f"decreased estimated default risk by {abs(prob_diff)*100:.1f}% (improving score by +{score_diff} pts)"
    elif prob_diff > 0.01:
        direction = f"increased estimated default risk by +{prob_diff*100:.1f}% (reducing score by {score_diff} pts)"
    else:
        direction = "maintained a nearly neutral default risk probability"

    summary = (
        f"Under the modified scenario, the model {direction}. "
        f"Borrower DTI shifted from {dti_orig*100:.1f}% to {dti_mod*100:.1f}% ({'+' if dti_diff>0 else ''}{dti_diff:.1f}% delta)."
    )

    comparison = WhatIfComparison(
        probability_diff=prob_diff,
        risk_score_diff=score_diff,
        dti_diff=dti_diff,
        summary=summary
    )

    return WhatIfResponse(
        original_result=original_result,
        modified_result=modified_result,
        comparison=comparison
    )
