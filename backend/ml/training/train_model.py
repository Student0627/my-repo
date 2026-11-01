"""
FineGuard - Model Training Pipeline
Trains an interpretable Random Forest classifier for loan risk assessment,
evaluates on an independent test set to prevent data leakage, and serializes
both the model artifact and metadata.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "datasets" / "credit_risk_dataset.csv"
MODEL_DIR = BASE_DIR / "saved_models"
MODEL_PATH = MODEL_DIR / "loan_risk_model.joblib"
METADATA_PATH = MODEL_DIR / "model_metadata.json"

FEATURES = [
    "monthly_income",
    "monthly_debt",
    "loan_amount",
    "loan_term_months",
    "credit_score",
    "employment_years",
    "credit_history",
    "debt_to_income_ratio",
    "loan_to_income_ratio"
]
TARGET = "loan_default"

def load_and_preprocess_data(data_path: Path):
    if not data_path.exists():
        from ml.datasets.generate_dataset import save_default_dataset
        save_default_dataset()

    df = pd.read_csv(data_path)

    # Validate columns
    for col in FEATURES + [TARGET]:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # Clean & handle missing values if any
    df = df.dropna(subset=FEATURES + [TARGET])

    X = df[FEATURES]
    y = df[TARGET]

    return X, y, df

def train_loan_model():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    print("Loading and preparing dataset...")
    X, y, full_df = load_and_preprocess_data(DATA_PATH)

    # Stratified Train/Test Split (80% Train, 20% Test) to prevent data leakage
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Feature scaling (fit on train only!)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print(f"Training set size: {len(X_train)}, Test set size: {len(X_test)}")
    print(f"Train default rate: {y_train.mean():.2%}, Test default rate: {y_test.mean():.2%}")

    # Train Random Forest Classifier
    # Depth limited to 8 to maintain explainability, prevent overfitting, and ensure robust SHAP calculations
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42,
        class_weight="balanced"
    )
    rf.fit(X_train_scaled, y_train)

    # Evaluate on independent Test set ONLY
    y_pred = rf.predict(X_test_scaled)
    y_proba = rf.predict_proba(X_test_scaled)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba)
    cm = confusion_matrix(y_test, y_pred).tolist()

    print("\n--- Test Set Evaluation Metrics ---")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print("Confusion Matrix:\n", cm)

    # Feature importances
    feature_importances = dict(zip(FEATURES, [round(float(v), 4) for v in rf.feature_importances_]))
    sorted_importances = sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)
    print("\nFeature Importances (MDI):")
    for feat, imp in sorted_importances:
        print(f"  {feat}: {imp:.4f}")

    # Package model artifacts
    bundle = {
        "model": rf,
        "scaler": scaler,
        "features": FEATURES,
        "target": TARGET,
        "background_data": X_train.sample(n=min(200, len(X_train)), random_state=42).to_dict(orient="records")
    }

    joblib.dump(bundle, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")

    # Save comprehensive metadata
    metadata = {
        "model_name": "FineGuard Loan Risk Random Forest",
        "version": "1.0.0",
        "algorithm": "RandomForestClassifier(n_estimators=100, max_depth=8)",
        "target_variable": TARGET,
        "features": FEATURES,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "test_metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc_auc), 4),
            "confusion_matrix": cm
        },
        "feature_importances": feature_importances,
        "dataset_summary": {
            "total_records": len(full_df),
            "default_rate": round(float(full_df[TARGET].mean()), 4),
            "features_description": {
                "monthly_income": "Borrower gross monthly income in USD",
                "monthly_debt": "Total monthly non-mortgage and mortgage debt obligations",
                "loan_amount": "Total requested principal amount",
                "loan_term_months": "Repayment duration in months (12 - 84)",
                "credit_score": "FICO-equivalent credit score (300 - 850)",
                "employment_years": "Verified continuous employment in years",
                "credit_history": "Categorical credit tier (0=Poor, 1=Fair, 2=Good, 3=Excellent)",
                "debt_to_income_ratio": "Debt-to-income ratio (monthly_debt / monthly_income)",
                "loan_to_income_ratio": "Annual loan-to-income ratio (loan_amount / annual_income)"
            }
        },
        "model_limitations": [
            "Trained for individual unsecured and personal installment loans up to $60,000.",
            "Requires valid positive income and debt values.",
            "Predictions reflect probability of 90-day delinquency or default within 24 months."
        ]
    }

    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Model metadata saved to {METADATA_PATH}")
    return metadata

if __name__ == "__main__":
    train_loan_model()
