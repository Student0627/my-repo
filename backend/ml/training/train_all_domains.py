"""
FineGuard - Multi-Domain Machine Learning Pipeline
Trains calibrated Random Forest models for:
1. Insurance Claim & Underwriting Risk (Health/Term Life)
2. Investment & Fixed Deposit (FD) Volatility Risk
3. Financial Transaction Fraud Detection
Evaluates on independent holdout test partitions with zero data leakage.
"""

import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "datasets"
MODEL_DIR = BASE_DIR / "saved_models"
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# -------------------------------------------------------------
# 1. INSURANCE UNDERWRITING & CLAIM RISK DATASET & MODEL
# -------------------------------------------------------------
INSURANCE_FEATURES = [
    "age",
    "annual_income",
    "coverage_amount",
    "bmi",
    "smoker_status",
    "pre_existing_conditions",
    "family_medical_history",
    "coverage_to_income_ratio"
]

def generate_insurance_data(n=10000, seed=42):
    np.random.seed(seed)
    age = np.random.randint(18, 70, size=n)
    annual_income = np.round(np.random.lognormal(mean=13.5, sigma=0.6, size=n), -3)
    annual_income = np.clip(annual_income, 300000, 5000000) # INR 3 Lakhs to 50 Lakhs
    
    # Coverage: 5 Lakhs to 1 Crore
    coverage_multipliers = np.random.uniform(5, 20, size=n)
    coverage_amount = np.round(annual_income * coverage_multipliers, -4)
    coverage_amount = np.clip(coverage_amount, 500000, 15000000)
    
    bmi = np.round(np.random.normal(loc=25.5, scale=4.5, size=n), 1)
    bmi = np.clip(bmi, 16.5, 42.0)
    
    # 22% smoker rate
    smoker_status = np.random.binomial(n=1, p=0.22, size=n)
    
    # Pre-existing conditions (0=None, 1=Minor/BP, 2=Diabetes, 3=Critical)
    pre_existing_conditions = np.random.choice([0, 1, 2, 3], size=n, p=[0.55, 0.25, 0.15, 0.05])
    
    family_medical_history = np.random.binomial(n=1, p=0.20, size=n)
    coverage_to_income_ratio = np.round(coverage_amount / annual_income, 2)
    
    # Logit equation based on actuarial morbidity & claim probability
    z = (
        -3.2
        + 0.045 * (age - 35)
        + 0.12 * (bmi - 24)
        + 1.6 * smoker_status
        + 0.75 * pre_existing_conditions
        + 0.5 * family_medical_history
        + 0.03 * (coverage_to_income_ratio - 10)
        + np.random.normal(0, 0.35, size=n)
    )
    prob_claim = 1.0 / (1.0 + np.exp(-z))
    high_claim_risk = (prob_claim > 0.40).astype(int)
    
    df = pd.DataFrame({
        "age": age,
        "annual_income": annual_income,
        "coverage_amount": coverage_amount,
        "bmi": bmi,
        "smoker_status": smoker_status,
        "pre_existing_conditions": pre_existing_conditions,
        "family_medical_history": family_medical_history,
        "coverage_to_income_ratio": coverage_to_income_ratio,
        "high_claim_risk": high_claim_risk
    })
    return df

def train_insurance_model():
    print("\n--- Training Insurance Risk Model ---")
    df = generate_insurance_data()
    df.to_csv(DATA_DIR / "insurance_dataset.csv", index=False)
    
    X = df[INSURANCE_FEATURES]
    y = df["high_claim_risk"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, class_weight="balanced")
    rf.fit(X_train_scaled, y_train)
    
    y_pred = rf.predict(X_test_scaled)
    y_proba = rf.predict_proba(X_test_scaled)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    print(f"Insurance Model - Holdout Accuracy: {acc:.4f}, ROC-AUC: {auc:.4f}")
    
    bundle = {
        "model": rf,
        "scaler": scaler,
        "features": INSURANCE_FEATURES,
        "target": "high_claim_risk"
    }
    joblib.dump(bundle, MODEL_DIR / "insurance_model.joblib")
    return {"accuracy": round(float(acc), 4), "roc_auc": round(float(auc), 4)}

# -------------------------------------------------------------
# 2. INVESTMENT & FD VOLATILITY RISK DATASET & MODEL
# -------------------------------------------------------------
INVESTMENT_FEATURES = [
    "investment_amount",
    "investor_age",
    "time_horizon_years",
    "risk_tolerance",
    "equity_allocation_pct",
    "fd_debt_allocation_pct",
    "emergency_fund_months"
]

def generate_investment_data(n=10000, seed=42):
    np.random.seed(seed)
    investment_amount = np.round(np.random.lognormal(mean=12.8, sigma=0.8, size=n), -3)
    investment_amount = np.clip(investment_amount, 50000, 10000000) # INR 50k to 1 Crore
    
    investor_age = np.random.randint(21, 75, size=n)
    time_horizon_years = np.random.choice([1, 2, 3, 5, 7, 10, 15, 20], size=n)
    
    # Risk tolerance: 1=Conservative, 2=Moderate, 3=Aggressive
    risk_tolerance = np.random.choice([1, 2, 3], size=n, p=[0.35, 0.45, 0.20])
    
    # Asset Allocation: equity vs FD/debt
    equity_allocation_pct = np.random.uniform(0, 100, size=n).round(1)
    fd_debt_allocation_pct = (100.0 - equity_allocation_pct).round(1)
    
    emergency_fund_months = np.random.choice([0, 1, 3, 6, 9, 12], size=n, p=[0.15, 0.20, 0.35, 0.20, 0.05, 0.05])
    
    # Capital loss / drawdown risk logit:
    # High risk when: Senior citizen with 80%+ equity, OR short horizon (<3 yrs) with heavy equity, OR zero emergency fund
    z = (
        -2.5
        + 0.045 * (equity_allocation_pct - 50)
        - 0.15 * (time_horizon_years - 5)
        + 0.03 * (investor_age - 45)
        - 0.18 * (emergency_fund_months - 3)
        - 0.5 * (risk_tolerance - 2)
        + np.random.normal(0, 0.35, size=n)
    )
    prob_risk = 1.0 / (1.0 + np.exp(-z))
    high_volatility_risk = (prob_risk > 0.45).astype(int)
    
    df = pd.DataFrame({
        "investment_amount": investment_amount,
        "investor_age": investor_age,
        "time_horizon_years": time_horizon_years,
        "risk_tolerance": risk_tolerance,
        "equity_allocation_pct": equity_allocation_pct,
        "fd_debt_allocation_pct": fd_debt_allocation_pct,
        "emergency_fund_months": emergency_fund_months,
        "high_volatility_risk": high_volatility_risk
    })
    return df

def train_investment_model():
    print("\n--- Training Investment & FD Risk Model ---")
    df = generate_investment_data()
    df.to_csv(DATA_DIR / "investment_dataset.csv", index=False)
    
    X = df[INVESTMENT_FEATURES]
    y = df["high_volatility_risk"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, class_weight="balanced")
    rf.fit(X_train_scaled, y_train)
    
    y_pred = rf.predict(X_test_scaled)
    y_proba = rf.predict_proba(X_test_scaled)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    print(f"Investment Model - Holdout Accuracy: {acc:.4f}, ROC-AUC: {auc:.4f}")
    
    bundle = {
        "model": rf,
        "scaler": scaler,
        "features": INVESTMENT_FEATURES,
        "target": "high_volatility_risk"
    }
    joblib.dump(bundle, MODEL_DIR / "investment_model.joblib")
    return {"accuracy": round(float(acc), 4), "roc_auc": round(float(auc), 4)}

# -------------------------------------------------------------
# 3. REAL-TIME TRANSACTION FRAUD DETECTION MODEL
# -------------------------------------------------------------
FRAUD_FEATURES = [
    "transaction_amount",
    "account_avg_transaction",
    "amount_to_avg_ratio",
    "transaction_hour",
    "merchant_category",
    "transaction_velocity_1h",
    "is_foreign_transaction",
    "device_fingerprint_match"
]

def generate_fraud_data(n=15000, seed=42):
    np.random.seed(seed)
    account_avg = np.round(np.random.lognormal(mean=7.5, sigma=0.6, size=n), -1)
    account_avg = np.clip(account_avg, 500, 50000) # Average UPI/card ticket
    
    # 95% regular transactions, 5% fraud attempts with large surges
    is_fraud_attempt = np.random.binomial(n=1, p=0.06, size=n)
    
    surge_multipliers = np.where(
        is_fraud_attempt == 1,
        np.random.uniform(5.0, 40.0, size=n),
        np.random.uniform(0.1, 2.5, size=n)
    )
    transaction_amount = np.round(account_avg * surge_multipliers, -1)
    transaction_amount = np.clip(transaction_amount, 100, 1000000)
    amount_to_avg_ratio = np.round(transaction_amount / account_avg, 2)
    
    transaction_hour = np.random.randint(0, 24, size=n)
    # 0=Groceries/Retail, 1=Utilities, 2=Electronics/Luxury, 3=Crypto/Forex/Gambling
    merchant_category = np.random.choice([0, 1, 2, 3], size=n, p=[0.55, 0.25, 0.15, 0.05])
    
    transaction_velocity_1h = np.where(
        is_fraud_attempt == 1,
        np.random.poisson(lam=4.5, size=n),
        np.random.poisson(lam=0.4, size=n)
    )
    transaction_velocity_1h = np.clip(transaction_velocity_1h, 0, 15)
    
    is_foreign_transaction = np.where(
        is_fraud_attempt == 1,
        np.random.binomial(n=1, p=0.45, size=n),
        np.random.binomial(n=1, p=0.02, size=n)
    )
    
    device_fingerprint_match = np.where(
        is_fraud_attempt == 1,
        np.random.binomial(n=1, p=0.60, size=n), # 60% mismatch
        np.random.binomial(n=1, p=0.03, size=n) # 3% mismatch
    )
    
    # Fraud logit
    z = (
        -4.2
        + 0.15 * (amount_to_avg_ratio - 1.0)
        + 0.65 * (merchant_category == 3)
        + 0.45 * (merchant_category == 2)
        + 0.55 * transaction_velocity_1h
        + 1.8 * is_foreign_transaction
        + 1.4 * device_fingerprint_match
        + 0.4 * ((transaction_hour >= 1) & (transaction_hour <= 4))
        + np.random.normal(0, 0.4, size=n)
    )
    prob_fraud = 1.0 / (1.0 + np.exp(-z))
    is_fraud = (prob_fraud > 0.40).astype(int)
    
    df = pd.DataFrame({
        "transaction_amount": transaction_amount,
        "account_avg_transaction": account_avg,
        "amount_to_avg_ratio": amount_to_avg_ratio,
        "transaction_hour": transaction_hour,
        "merchant_category": merchant_category,
        "transaction_velocity_1h": transaction_velocity_1h,
        "is_foreign_transaction": is_foreign_transaction,
        "device_fingerprint_match": device_fingerprint_match,
        "is_fraud": is_fraud
    })
    return df

def train_fraud_model():
    print("\n--- Training Real-Time Transaction Fraud Model ---")
    df = generate_fraud_data()
    df.to_csv(DATA_DIR / "fraud_dataset.csv", index=False)
    
    X = df[FRAUD_FEATURES]
    y = df["is_fraud"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, class_weight="balanced")
    rf.fit(X_train_scaled, y_train)
    
    y_pred = rf.predict(X_test_scaled)
    y_proba = rf.predict_proba(X_test_scaled)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    print(f"Fraud Model - Holdout Accuracy: {acc:.4f}, ROC-AUC: {auc:.4f}")
    
    bundle = {
        "model": rf,
        "scaler": scaler,
        "features": FRAUD_FEATURES,
        "target": "is_fraud"
    }
    joblib.dump(bundle, MODEL_DIR / "fraud_model.joblib")
    return {"accuracy": round(float(acc), 4), "roc_auc": round(float(auc), 4)}

def train_all():
    ins_meta = train_insurance_model()
    inv_meta = train_investment_model()
    fra_meta = train_fraud_model()
    
    meta_summary = {
        "insurance": ins_meta,
        "investment": inv_meta,
        "fraud": fra_meta
    }
    with open(MODEL_DIR / "multi_domain_metadata.json", "w") as f:
        json.dump(meta_summary, f, indent=2)
    print("\nAll 3 domain models trained, evaluated, and saved successfully!")

if __name__ == "__main__":
    train_all()
