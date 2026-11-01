"""
FineGuard - Explainable AI (SHAP) Service
Provides mathematically sound feature attributions using TreeSHAP on the trained model.
Calculates base value, feature-level SHAP attributions, categorizes into risk-increasing
and risk-decreasing factors, and synthesizes clear plain-English explanations.
"""

import joblib
import shap
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "saved_models" / "loan_risk_model.joblib"

FEATURE_DISPLAY_NAMES = {
    "monthly_income": "Monthly Income (INR)",
    "monthly_debt": "Monthly Debt Obligations (INR)",
    "loan_amount": "Requested Loan Amount (INR)",
    "loan_term_months": "Loan Term (Months)",
    "credit_score": "CIBIL Credit Score",
    "employment_years": "Employment History (Years)",
    "credit_history": "Credit Rating Grade",
    "debt_to_income_ratio": "Debt-to-Income (DTI) Ratio",
    "loan_to_income_ratio": "Loan-to-Income Ratio"
}

class LoanRiskExplainer:
    def __init__(self, model_bundle_path: Path = MODEL_PATH):
        if not model_bundle_path.exists():
            raise FileNotFoundError(f"Model bundle not found at {model_bundle_path}. Please train model first.")

        bundle = joblib.load(model_bundle_path)
        self.model = bundle["model"]
        self.scaler = bundle["scaler"]
        self.features = bundle["features"]
        self.target = bundle["target"]

        # TreeExplainer for Random Forest
        # We use model_output="probability" or standard margin log-odds
        self.explainer = shap.TreeExplainer(self.model)

    def explain_instance(self, raw_input_dict: Dict[str, float]) -> Dict[str, Any]:
        """
        Calculates exact SHAP values for a single borrower profile.
        """
        # Ensure ordered dataframe
        input_df = pd.DataFrame([{f: raw_input_dict.get(f, 0.0) for f in self.features}])
        scaled_input = self.scaler.transform(input_df)

        # Predict probability of default (Class 1)
        probabilities = self.model.predict_proba(scaled_input)[0]
        prob_default = float(probabilities[1])
        predicted_class = int(self.model.predict(scaled_input)[0])

        # Compute SHAP values for class 1 (default risk)
        shap_values = self.explainer.shap_values(scaled_input)

        # Handle different SHAP output formats (multiclass array vs 2D array)
        if isinstance(shap_values, list):
            # Class 1 is default
            instance_shap = shap_values[1][0]
            base_value = float(self.explainer.expected_value[1]) if isinstance(self.explainer.expected_value, (list, np.ndarray)) else float(self.explainer.expected_value)
        elif len(shap_values.shape) == 3:
            # (n_samples, n_features, n_classes)
            instance_shap = shap_values[0, :, 1]
            base_value = float(self.explainer.expected_value[1])
        else:
            instance_shap = shap_values[0]
            base_value = float(self.explainer.expected_value)

        # Build feature contributions list
        contributions = []
        for feat_name, sv in zip(self.features, instance_shap):
            raw_val = float(input_df[feat_name].iloc[0])
            contributions.append({
                "feature": feat_name,
                "label": FEATURE_DISPLAY_NAMES.get(feat_name, feat_name),
                "feature_value": raw_val,
                "shap_value": round(float(sv), 4),
                "impact": "increase" if sv > 0 else "decrease"
            })

        # Sort by absolute SHAP magnitude
        contributions_sorted = sorted(contributions, key=lambda x: abs(x["shap_value"]), reverse=True)

        # Risk-increasing factors (positive SHAP pushing towards default)
        risk_increasing = [c for c in contributions_sorted if c["shap_value"] > 0]
        # Risk-decreasing factors (negative SHAP pulling away from default)
        risk_decreasing = [c for c in contributions_sorted if c["shap_value"] < 0]

        # Categorize risk
        if prob_default < 0.25:
            risk_tier = "Low"
            risk_badge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        elif prob_default < 0.55:
            risk_tier = "Moderate"
            risk_badge = "bg-amber-500/10 text-amber-400 border-amber-500/20"
        else:
            risk_tier = "High"
            risk_badge = "bg-rose-500/10 text-rose-400 border-rose-500/20"

        # Generate contextual plain-English explanation
        explanation_narrative = self._generate_narrative(
            prob_default=prob_default,
            risk_tier=risk_tier,
            increasing=risk_increasing,
            decreasing=risk_decreasing,
            raw_inputs=raw_input_dict
        )

        return {
            "prediction": {
                "default_probability": round(prob_default, 4),
                "predicted_label": predicted_class,
                "risk_tier": risk_tier,
                "risk_score": int(round((1.0 - prob_default) * 1000)), # FineGuard credit risk index (0 - 1000)
                "base_value": round(base_value, 4)
            },
            "contributions": contributions_sorted,
            "risk_increasing_factors": risk_increasing,
            "risk_decreasing_factors": risk_decreasing,
            "narrative": explanation_narrative
        }

    def _generate_narrative(
        self,
        prob_default: float,
        risk_tier: str,
        increasing: List[Dict[str, Any]],
        decreasing: List[Dict[str, Any]],
        raw_inputs: Dict[str, float]
    ) -> str:
        """
        Creates an honest, transparent plain-English summary of the model's decision drivers.
        """
        prob_pct = f"{prob_default * 100:.1f}%"
        dti = raw_inputs.get("debt_to_income_ratio", 0.0) * 100

        top_inc_names = [f"{c['label']} ({'+' if c['shap_value'] > 0 else ''}{c['shap_value']:.3f})" for c in increasing[:2]]
        top_dec_names = [f"{c['label']} ({c['shap_value']:.3f})" for c in decreasing[:2]]

        summary = f"FineGuard's Random Forest ensemble estimated an estimated default risk probability of {prob_pct}, classifying this loan application under the **{risk_tier} Risk** tier. "

        if increasing and decreasing:
            summary += f"The primary drivers increasing credit risk are {', '.join(top_inc_names)}. Conversely, risk was mitigated by {', '.join(top_dec_names)}. "
        elif increasing:
            summary += f"The key risk escalators include {', '.join(top_inc_names)}. "
        elif decreasing:
            summary += f"The profile demonstrated strong positive financial safety buffers led by {', '.join(top_dec_names)}. "

        if dti > 43.0:
            summary += f"Note: The Debt-to-Income ratio of {dti:.1f}% exceeds standard lending thresholds (43%), acting as a primary driver of default vulnerability. "
        elif dti <= 25.0:
            summary += f"The low Debt-to-Income ratio ({dti:.1f}%) provides substantial buffer against repayment shocks. "

        summary += "SHAP values measure each feature's marginal contribution against the baseline population average; local impact may vary across different borrower profiles."
        return summary
