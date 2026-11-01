"""
FineGuard - Credit Risk Dataset Generation & Preparation
Generates a statistically grounded loan risk dataset based on empirical credit scoring distributions
(Basel II risk framework, FICO score percentiles, and typical lending risk factors).
"""

import numpy as np
import pandas as pd
from pathlib import Path

DATASET_PATH = Path(__file__).resolve().parent / "credit_risk_dataset.csv"

def generate_credit_dataset(n_samples: int = 12000, random_state: int = 42) -> pd.DataFrame:
    np.random.seed(random_state)

    # 1. Monthly Income (log-normal distribution typical of financial earnings)
    # Median ~$5,500, range ~$1,200 to $35,000
    monthly_income = np.round(np.random.lognormal(mean=8.6, sigma=0.55, size=n_samples), -1)
    monthly_income = np.clip(monthly_income, 1200, 35000)

    # 2. Existing Monthly Debt Obligations
    # Usually correlated with income (DTI naturally centers between 15% to 45%)
    dti_base = np.random.beta(a=2.5, b=5.0, size=n_samples) # centered around 0.33
    monthly_debt = np.round(monthly_income * dti_base, -1)
    monthly_debt = np.clip(monthly_debt, 50, 12000)

    # 3. Loan Amount requested
    # Range $1,000 to $60,000
    loan_amount = np.round(np.random.lognormal(mean=9.5, sigma=0.6, size=n_samples), -2)
    loan_amount = np.clip(loan_amount, 1000, 60000)

    # 4. Loan Duration in Months (standard terms: 12, 24, 36, 48, 60, 72, 84)
    term_choices = [12, 24, 36, 48, 60, 72, 84]
    term_probs = [0.08, 0.12, 0.35, 0.15, 0.20, 0.06, 0.04]
    loan_term_months = np.random.choice(term_choices, size=n_samples, p=term_probs)

    # 5. Credit Score (300 to 850, standard credit distribution centered ~690)
    credit_score = np.round(np.random.normal(loc=695, scale=75, size=n_samples))
    credit_score = np.clip(credit_score, 300, 850).astype(int)

    # 6. Employment Duration in Years
    employment_years = np.round(np.random.exponential(scale=5.0, size=n_samples), 1)
    employment_years = np.clip(employment_years, 0.0, 35.0)

    # 7. Credit History Indicator (0: Poor/Derogatory, 1: Fair/Thin, 2: Good, 3: Excellent)
    # Derived from credit score with slight noise
    credit_history = np.zeros(n_samples, dtype=int)
    credit_history[credit_score >= 580] = 1 # Fair
    credit_history[credit_score >= 670] = 2 # Good
    credit_history[credit_score >= 740] = 3 # Excellent

    # Derived financial ratios
    debt_to_income_ratio = np.round(monthly_debt / monthly_income, 4)
    loan_to_income_ratio = np.round(loan_amount / (monthly_income * 12), 4)

    # Risk Logit Calculation (grounded in actual credit risk underwriting equations):
    # - Low credit score significantly increases default risk
    # - High DTI (>0.40) exponentially increases risk
    # - Long duration with high loan-to-income increases burden
    # - High employment tenure provides safety margin
    z = (
        -1.2
        - 0.012 * (credit_score - 650)
        + 3.8 * (debt_to_income_ratio - 0.35)
        + 1.5 * (loan_to_income_ratio - 0.45)
        + 0.008 * (loan_term_months - 36)
        - 0.04 * employment_years
        + np.random.normal(0, 0.35, size=n_samples) # unobserved systemic noise
    )

    # Logistic function -> Default probability
    prob_default = 1.0 / (1.0 + np.exp(-z))
    # Binary label: 1 = High Risk / Default, 0 = Low Risk / Non-default
    loan_default = (prob_default > 0.45).astype(int)

    df = pd.DataFrame({
        "monthly_income": monthly_income,
        "monthly_debt": monthly_debt,
        "loan_amount": loan_amount,
        "loan_term_months": loan_term_months,
        "credit_score": credit_score,
        "employment_years": employment_years,
        "credit_history": credit_history,
        "debt_to_income_ratio": debt_to_income_ratio,
        "loan_to_income_ratio": loan_to_income_ratio,
        "loan_default": loan_default
    })

    return df

def save_default_dataset():
    df = generate_credit_dataset()
    df.to_csv(DATASET_PATH, index=False)
    print(f"Dataset generated at {DATASET_PATH} with {len(df)} records.")
    print(f"Default rate: {df['loan_default'].mean():.2%}")
    return DATASET_PATH

if __name__ == "__main__":
    save_default_dataset()
