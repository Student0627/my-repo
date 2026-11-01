"""
Quick smoke test for SHAP explainer
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_dir))

from ml.explainability.shap_explainer import LoanRiskExplainer

def test_explainer():
    explainer = LoanRiskExplainer()
    sample = {
        "monthly_income": 6500.0,
        "monthly_debt": 1500.0,
        "loan_amount": 20000.0,
        "loan_term_months": 36,
        "credit_score": 720,
        "employment_years": 4.5,
        "credit_history": 2,
        "debt_to_income_ratio": 1500.0 / 6500.0,
        "loan_to_income_ratio": 20000.0 / (6500.0 * 12)
    }

    result = explainer.explain_instance(sample)
    print("Prediction:", result["prediction"])
    print("Top risk-increasing:", result["risk_increasing_factors"][:2])
    print("Top risk-decreasing:", result["risk_decreasing_factors"][:2])
    print("Narrative:", result["narrative"])
    assert "default_probability" in result["prediction"]
    assert len(result["contributions"]) == 9
    print("SHAP explainer test PASSED!")

if __name__ == "__main__":
    test_explainer()
