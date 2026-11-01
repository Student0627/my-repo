"""
FineGuard - Investment & Fixed Deposit (FD) Risk Explainable AI (SHAP) Service
Portfolio volatility & capital preservation risk attribution via TreeSHAP.
"""

import joblib
import shap
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "saved_models" / "investment_model.joblib"

FEATURE_LABELS = {
    "investment_amount": "Total Portfolio Capital (INR)",
    "investor_age": "Investor Age (Years)",
    "time_horizon_years": "Investment Time Horizon (Years)",
    "risk_tolerance": "Stated Risk Tolerance Profile",
    "equity_allocation_pct": "Equity / Mutual Fund Allocation (%)",
    "fd_debt_allocation_pct": "Fixed Deposit (FD) & Debt Allocation (%)",
    "emergency_fund_months": "Emergency Liquidity Buffer (Months)"
}

class InvestmentRiskExplainer:
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

        prob_volatility = float(self.model.predict_proba(scaled)[0][1])

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

        # Tiers & Allocation Suggestions
        if prob_volatility < 0.25:
            tier = "Capital Preservation (Low Volatility)"
            recommendation = "Portfolio has strong capital protection with solid Fixed Deposit / Debt cushions."
        elif prob_volatility < 0.50:
            tier = "Balanced Growth (Moderate Volatility)"
            recommendation = "Balanced risk-reward profile. Suitable for medium to long-term goals (3-7 years)."
        else:
            tier = "High Drawdown Exposure (High Risk)"
            recommendation = "High volatility detected relative to investor horizon or emergency liquidity buffer."

        top_inc = [f"{c['label']} (+{c['shap_value']:.3f})" for c in risk_increasing[:2]]
        top_dec = [f"{c['label']} ({c['shap_value']:.3f})" for c in risk_decreasing[:2]]

        narrative = f"FineGuard's Investment Risk Engine estimated a volatility drawdown probability of {prob_volatility*100:.1f}%, classifying the strategy under **{tier}**. "
        if risk_increasing and risk_decreasing:
            narrative += f"Primary risk drivers were {', '.join(top_inc)}, while stability was anchored by {', '.join(top_dec)}. "
        elif risk_increasing:
            narrative += f"Risk factors include {', '.join(top_inc)}. "
        else:
            narrative += f"The portfolio demonstrates high capital stability anchored by {', '.join(top_dec)}. "

        if raw_input.get("emergency_fund_months", 0) < 3:
            narrative += "Alert: An emergency fund of less than 3 months forces premature liquidation of investments during market corrections."

        return {
            "prediction": {
                "volatility_risk_probability": round(prob_volatility, 4),
                "capital_safety_index": int(round((1.0 - prob_volatility) * 1000)),
                "risk_tier": tier,
                "recommendation": recommendation,
                "base_value": round(base_value, 4)
            },
            "contributions": contributions_sorted,
            "risk_increasing_factors": risk_increasing,
            "risk_decreasing_factors": risk_decreasing,
            "narrative": narrative
        }
