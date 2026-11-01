"""
FineGuard - Insurance Risk Explainable AI (SHAP) Service
Underwriting claim probability & premium loading risk attribution via TreeSHAP.
"""

import joblib
import shap
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "saved_models" / "insurance_model.joblib"

FEATURE_LABELS = {
    "age": "Applicant Age (Years)",
    "annual_income": "Annual Income (INR)",
    "coverage_amount": "Requested Coverage / Sum Assured (INR)",
    "bmi": "Body Mass Index (BMI)",
    "smoker_status": "Tobacco / Smoking Status",
    "pre_existing_conditions": "Pre-Existing Medical Conditions",
    "family_medical_history": "Critical Family Medical History",
    "coverage_to_income_ratio": "Coverage-to-Income Multiplier"
}

class InsuranceRiskExplainer:
    def __init__(self, model_bundle_path: Path = MODEL_PATH):
        bundle = joblib.load(model_bundle_path)
        self.model = bundle["model"]
        self.scaler = bundle["scaler"]
        self.features = bundle["features"]
        self.target = bundle["target"]
        self.explainer = shap.TreeExplainer(self.model)

    def explain_instance(self, raw_input: Dict[str, Any]) -> Dict[str, Any]:
        input_df = pd.DataFrame([{f: raw_input.get(f, 0.0) for f in self.features}])
        scaled = self.scaler.transform(input_df)

        prob_claim = float(self.model.predict_proba(scaled)[0][1])
        predicted_class = int(self.model.predict(scaled)[0])

        shap_vals = self.explainer.shap_values(scaled)
        if isinstance(shap_vals, list):
            instance_shap = shap_vals[1][0]
            base_value = float(self.explainer.expected_value[1]) if isinstance(self.explainer.expected_value, (list, np.ndarray)) else float(self.explainer.expected_value)
        elif len(shap_vals.shape) == 3:
            instance_shap = shap_vals[0, :, 1]
            base_value = float(self.explainer.expected_value[1])
        else:
            instance_shap = shap_vals[0]
            base_value = float(self.explainer.expected_value)

        contributions = []
        for feat_name, sv in zip(self.features, instance_shap):
            raw_val = float(input_df[feat_name].iloc[0])
            contributions.append({
                "feature": feat_name,
                "label": FEATURE_LABELS.get(feat_name, feat_name),
                "feature_value": raw_val,
                "shap_value": round(float(sv), 4),
                "impact": "increase" if sv > 0 else "decrease"
            })

        contributions_sorted = sorted(contributions, key=lambda x: abs(x["shap_value"]), reverse=True)
        risk_increasing = [c for c in contributions_sorted if c["shap_value"] > 0]
        risk_decreasing = [c for c in contributions_sorted if c["shap_value"] < 0]

        # Indian Underwriting & Premium Loading Tiers
        if prob_claim < 0.25:
            tier = "Standard (Preferred)"
            premium_loading = "0% (Standard Base Premium)"
            recommendation = "Approved for standard insurance cover without medical loading."
        elif prob_claim < 0.50:
            tier = "Moderate Loading"
            premium_loading = "+15% to +25% Premium Loading"
            recommendation = "Conditional approval. Premium loading recommended due to health risk factors."
        else:
            tier = "High Risk (Medical Review)"
            premium_loading = "+35% to +50% Loading or Tele-MER Required"
            recommendation = "High claim risk detected. Requires manual tele-medical underwriting or tele-MER."

        # Plain-English synthesis
        top_inc = [f"{c['label']} (+{c['shap_value']:.3f})" for c in risk_increasing[:2]]
        top_dec = [f"{c['label']} ({c['shap_value']:.3f})" for c in risk_decreasing[:2]]

        narrative = f"FineGuard's Insurance Model estimated a high claim probability of {prob_claim*100:.1f}%, categorizing the policy under **{tier}**. "
        if risk_increasing and risk_decreasing:
            narrative += f"Primary claim risk escalators were {', '.join(top_inc)}, while risk was mitigated by {', '.join(top_dec)}. "
        elif risk_increasing:
            narrative += f"Adverse risk drivers include {', '.join(top_inc)}. "
        else:
            narrative += f"The applicant demonstrated favorable health attributes led by {', '.join(top_dec)}. "

        if raw_input.get("smoker_status") == 1:
            narrative += "Tobacco use significantly escalates actuarial morbidity risk. "
        if raw_input.get("bmi", 0) > 30:
            narrative += "BMI > 30 places the applicant in the elevated metabolic risk bracket. "

        return {
            "prediction": {
                "claim_risk_probability": round(prob_claim, 4),
                "risk_tier": tier,
                "premium_loading": premium_loading,
                "recommendation": recommendation,
                "base_value": round(base_value, 4)
            },
            "contributions": contributions_sorted,
            "risk_increasing_factors": risk_increasing,
            "risk_decreasing_factors": risk_decreasing,
            "narrative": narrative
        }
