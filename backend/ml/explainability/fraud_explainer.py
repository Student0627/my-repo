"""
FineGuard - Real-Time Transaction Fraud Detection Explainable AI (SHAP) Service
Anomaly scoring & transaction fraud attribution via TreeSHAP.
"""

import joblib
import shap
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "saved_models" / "fraud_model.joblib"

FEATURE_LABELS = {
    "transaction_amount": "Transaction Amount (INR)",
    "account_avg_transaction": "Historical Account Average Ticket (INR)",
    "amount_to_avg_ratio": "Transaction Surge Ratio",
    "transaction_hour": "Time of Transaction (Hour 0-23)",
    "merchant_category": "Merchant Industry Category",
    "transaction_velocity_1h": "Transaction Velocity (Last 60 Mins)",
    "is_foreign_transaction": "International / Cross-Border Indicator",
    "device_fingerprint_match": "Device / IP Fingerprint Mismatch"
}

class FraudDetectionExplainer:
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

        prob_fraud = float(self.model.predict_proba(scaled)[0][1])

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

        # Fraud action threshold
        if prob_fraud < 0.20:
            action = "APPROVE"
            threat_level = "Low Risk (Legitimate)"
            action_desc = "Transaction cleared for instant settlement."
        elif prob_fraud < 0.55:
            action = "STEP-UP 2FA"
            threat_level = "Suspicious Anomaly"
            action_desc = "Trigger mandatory OTP / Biometric verification before authorizing."
        else:
            action = "DECLINE & BLOCK"
            threat_level = "Critical Threat (Fraud Detected)"
            action_desc = "Transaction declined immediately. Alert sent to customer security desk."

        top_inc = [f"{c['label']} (+{c['shap_value']:.3f})" for c in risk_increasing[:2]]
        top_dec = [f"{c['label']} ({c['shap_value']:.3f})" for c in risk_decreasing[:2]]

        narrative = f"FineGuard's Real-Time Fraud Engine estimated a fraud probability of {prob_fraud*100:.1f}%, issuing a decision of **{action}** ({threat_level}). "
        if risk_increasing:
            narrative += f"Suspicious triggers were {', '.join(top_inc)}. "
        if risk_decreasing:
            narrative += f"Legitimacy was substantiated by {', '.join(top_dec)}. "

        surge = raw_input.get("amount_to_avg_ratio", 1.0)
        if surge > 5.0:
            narrative += f"Alert: The transaction amount represents an acute {surge:.1f}x surge compared to the user's typical historical spending pattern. "
        if raw_input.get("is_foreign_transaction") == 1:
            narrative += "Cross-border routing from a foreign gateway elevated the anomalous risk profile."

        return {
            "prediction": {
                "fraud_probability": round(prob_fraud, 4),
                "action": action,
                "threat_level": threat_level,
                "action_desc": action_desc,
                "base_value": round(base_value, 4)
            },
            "contributions": contributions_sorted,
            "risk_increasing_factors": risk_increasing,
            "risk_decreasing_factors": risk_decreasing,
            "narrative": narrative
        }
