# FineGuard — Explainable AI Financial Risk Analysis Platform

**B.Tech CSE Data Science & AI Capstone Project**  
*An Institutional-Grade Multi-Domain Risk Assessment Platform Powered by Calibrated Ensembles, Exact TreeSHAP Explainability, and Indian Regulatory Benchmarks (INR ₹).*

---

## 🌐 Live Public Deployment & Demo Access

The project is currently hosted and accessible live on the public web:

| Environment | Public URL | Notes |
| :--- | :--- | :--- |

### 🔑 Instant Demo Evaluator Account
* **Email:** `evaluator@university.edu.in`
* **Password:** `VivaPassword2026!`
* *(Or simply click the one-tap **"Autofill Demo Credentials"** button on the login screen)*

---

## 🌟 Executive Summary

Traditional financial risk assessment and credit scoring engines operate as proprietary black-boxes, providing applicants and compliance officers with isolated probability numbers without causal transparency.

**FineGuard** solves this fundamental limitation by combining:
1. **Four Specialized Machine Learning Models** trained with zero data leakage on empirical financial datasets.
2. **Exact TreeSHAP Explainability** from cooperative game theory to compute true feature attributions ($f(x) = \phi_0 + \sum_{i=1}^M \phi_i$).
3. **Counterfactual Simulation Engine** ("What-If") allowing risk analysts to perturb borrower financials and observe real model response curves.
4. **Indian Financial & Regulatory Compliance** using Indian Rupees (₹), CIBIL credit scoring standards (300–900), RBI FOIR/DTI guidelines ($\le 40\%$), IRDAI underwriting benchmarks, and RBI Cyber Security 2FA directives.

---

## 🛡️ Complete Multi-Domain Modules

### 1. Loan & Credit Risk Analysis
* **Problem Formulation:** Binary classification predicting 90-day severe loan delinquency or default within 24 months (`loan_default`).
* **Input Features:** Monthly Gross Income (₹), Monthly Debt Obligations (₹), Requested Loan Amount (₹), Repayment Tenure (Months), CIBIL Credit Score (300–900), Employment Stability (Years), Credit History Tier.
* **Derived Metrics:** Debt-to-Income (DTI / FOIR) and Loan-to-Income (LTI) calculated live against RBI lending benchmarks.
* **ML Model:** Calibrated Random Forest (100 Trees, Max Depth 8) evaluated on an 80/20 holdout test set (**94.21% Test Accuracy, 0.980 ROC-AUC**).
* **Explainability:** TreeSHAP waterfall and attribution bar charts identifying exact marginal impact of each credit factor.

### 2. Insurance Underwriting & Claim Risk
* **Problem Formulation:** Actuarial claim risk prediction and premium loading tier assignment for term life and comprehensive health policies.
* **Input Features:** Applicant Age, Annual Income (₹), Sum Assured / Coverage (₹), Body Mass Index (BMI), Tobacco/Smoker Status, Pre-Existing Conditions (0=None to 3=Critical), Family Medical History.
* **Derived Metrics:** Coverage-to-Income Multiplier (evaluated against the IRDAI 10x–20x rule) and WHO BMI morbidity classification.
* **ML Model:** Balanced Random Forest Classifier (**91.95% Test Accuracy, 0.981 ROC-AUC**).
* **Underwriting Decision:** Standard Life (0% Loading), Moderate (+15% to +25% Loading), or High Claim Risk (Tele-MER / Medical Examination Mandatory).

### 3. Investment & Fixed Deposit (FD) Volatility Risk
* **Problem Formulation:** Portfolio drawdown volatility prediction and capital safety indexing for retail investors.
* **Input Features:** Total Capital (₹), Investor Age, Investment Horizon (Years), Risk Tolerance (Conservative, Moderate, Aggressive), Equity / Mutual Funds Split (%), Fixed Deposit & Sovereign Debt Split (%), Emergency Fund Liquidity (Months).
* **Derived Metrics:** Asset allocation compliance with the empirical "Rule of 100" ($\text{Max Equity} = 100 - \text{Age}$) and liquid safety cushions.
* **ML Model:** Random Forest Classifier (**95.05% Test Accuracy, 0.989 ROC-AUC**).
* **Output:** FineGuard Capital Safety Index (Score out of 1000) and actionable rebalancing recommendations based on RBI DICGC ₹5 Lakh deposit insurance limits.

### 4. Real-Time Transaction Fraud Detection
* **Problem Formulation:** Real-time anomaly detection for digital payments and card/UPI transactions.
* **Input Features:** Current Transaction Amount (₹), Historical Account Average Ticket (₹), Transaction Hour (0–23), Merchant Industry Category (Retail, Utilities, Luxury/Electronics, Crypto/Forex), 60-Minute Transaction Velocity, Foreign/Cross-Border Indicator, Device Fingerprint Match.
* **Derived Metrics:** Instantaneous Surge Ratio ($\text{Current Ticket} / \text{Historical Mean}$) with anomaly sensitivity threshold.
* **ML Model:** Highly calibrated Random Forest Classifier (**99.63% Test Accuracy, 0.999 ROC-AUC**).
* **Automated Security Actions:**
  * `APPROVE` (P(Fraud) < 20%): Cleared for immediate settlement.
  * `STEP-UP 2FA` (20% $\le$ P(Fraud) < 55%): Triggers mandatory RBI Additional Factor of Authentication (OTP / Biometric challenge).
  * `DECLINE & BLOCK` (P(Fraud) $\ge$ 55%): Instant settlement refusal and security alert.

### 5. Insurance Policy Document PDF Reviewer & Clause Extractor (PyPDF)
* **Problem Formulation:** Automating fine-print clause extraction and consumer protection analysis from official Insurance Policy Wordings / Prospectus PDFs.
* **Extraction Pipeline:** Built using Python's `pypdf.PdfReader` to extract text page-by-page, tokenized across IRDAI Health Insurance Regulations categories.
* **Exact Clause Detection:** Identifies the **exact verbatim sentence** in the uploaded document and reports the **exact page number** (e.g. Page 2, Line 14) for:
  * Room Rent & ICU sub-limits (e.g. 1% capping and proportionate deduction penalties).
  * Pre-Existing Disease (PED) waiting periods (24 vs 36–48 months).
  * Mandatory co-payment clauses (0% nil copay vs 10%–20% cost sharing).
  * 100% Sum Insured restoration and recharge benefits.
  * Pre (30/60 days) and Post (60/180 days) hospitalization consultation & diagnostic reimbursement.
  * Non-payable hospital consumables exclusions.
* **Consumer Decision:** Computes an objective Consumer Health Score (1 to 10) and renders a clear **"GOOD TO BUY" / "BUY WITH CAUTION" / "NOT RECOMMENDED"** verdict.
* **Official Redirection:** Direct, verified one-click redirection links to official insurer portals across 20+ Indian companies (HDFC ERGO, Star Health, Care Health, Niva Bupa, ICICI Lombard, Bajaj Allianz, Tata AIG, SBI General, Max Life, etc.).

### 6. What-If Counterfactual Simulator
* Run comparative scenarios (Original vs. Hypothetical) through the identical trained model and scaler pipeline.
* Interactive sliders for income, debt, tenure, and loan amount to observe genuine model response without hardcoded assumptions.
* Variance metrics ($\Delta P(\text{Default})$ and $\Delta \text{Credit Score}$) with comparative bar charts.

### 7. Audit Reports & Executive PDF Generator
* Persist completed assessments to MongoDB (with graceful fallback).
* View archived reports with timestamps, input parameters, model predictions, and SHAP narratives.
* Export high-resolution, publication-grade executive PDFs generated via ReportLab using Indian Rupee notation (`Rs.`).

---

## 🔬 Explainable AI (XAI) Theory: TreeSHAP

FineGuard implements **TreeSHAP** (*Lundberg et al., Nature Machine Intelligence 2020*), which computes the exact Shapley values from cooperative game theory in polynomial time $\mathcal{O}(T L D^2)$ instead of exponential time $\mathcal{O}(T L 2^M)$.

### Additive Feature Attribution Property
For an instance $x$, the model prediction $f(x)$ is decomposed as:

$$f(x) = \phi_0 + \sum_{i=1}^M \phi_i(x)$$

Where:
* $\phi_0 = \mathbb{E}[f(X)]$ is the expected baseline prediction across the training population.
* $\phi_i(x)$ is the marginal contribution of feature $i$.
* $\phi_i > 0$ denotes a **Risk Escalator** (increases probability of default, claim, or fraud).
* $\phi_i < 0$ denotes a **Risk Mitigator** (anchors safety and decreases risk).

---

## 📂 Project Architecture

```text
fineguard/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI Routers (auth, loans, insurance, investments, fraud, simulation, reports, dashboard)
│   │   ├── core/            # Config, security (bcrypt password hashing, JWT HS256 tokens)
│   │   ├── database/        # Async Motor MongoDB repository with in-memory fallback
│   │   ├── schemas/         # Strict Pydantic v2 schemas for all 4 domains
│   │   ├── services/        # Domain orchestrators (loan, insurance, investment, fraud, ReportLab PDF generator)
│   │   └── main.py          # FastAPI application entrypoint with CORS
│   ├── ml/
│   │   ├── datasets/        # Empirical training datasets (credit_risk, insurance, investment, fraud)
│   │   ├── training/        # Model training scripts (train_model.py, train_all_domains.py)
│   │   ├── explainability/  # Domain TreeSHAP explainers (shap_explainer, insurance, investment, fraud)
│   │   └── saved_models/    # Serialized .joblib models & model_metadata.json
│   └── tests/
│       └── test_api.py      # Automated Pytest suite (8/8 tests covering all endpoints)
└── frontend/
    ├── src/
    │   ├── components/      # Sidebar, TopNav, RiskGauge, FeatureImpactBar, WaterfallChart
    │   ├── layouts/         # AppLayout (clean desktop sidebar & mobile drawer)
    │   ├── pages/           # Dashboard, LoanRisk, InsuranceRisk, InvestmentRisk, FraudDetection, Simulator, Reports, Settings, Login, Register
    │   ├── services/        # Axios API client (auth, loans, insurance, investments, fraud, reports) & AuthContext
    │   ├── App.jsx          # Route manager
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## 🚀 How to Run the Platform

### 1. Backend Server
```bash
cd /Users/name/Desktop/fineguard/backend

# Activate the virtual environment
source ../venv/bin/activate

# Run tests to verify all 8 endpoints
pytest tests/test_api.py -v

# Start FastAPI server on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: **`http://localhost:8000/docs`**

### 2. Frontend Development Server
```bash
cd /Users/name/Desktop/fineguard/frontend

# Start Vite dev server on port 5173
npm run dev
```
Open your browser at: **`http://localhost:5173`**

### 3. One-Click Live Public Deployment (Script)
To launch the backend, frontend, and generate a live public internet URL in one command:
```bash
./start_live.sh
```

### 4. Docker Container Deployment (Single Command)
Run the entire platform (Node build + Python ML backend + static SPA server) in isolated containers:
```bash
docker compose up --build
```
Access at `http://localhost:8000`.

### 5. Cloud Deployment (Render.com / PaaS)
FineGuard is pre-configured with `render.yaml` and `Procfile`.
* In production, FastAPI automatically serves the pre-compiled React SPA assets directly from `frontend/dist` on a single port (`$PORT`), eliminating CORS configuration and separate frontend hosting costs.
* To deploy on Render: Connect your GitHub repository and select **New Web Service** (Build Command: `pip install -r requirements.txt && cd frontend && npm install && npm run build && cd ..`, Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`).

### 6. Quick Demo Login Credentials
* **Email:** `evaluator@university.edu.in`
* **Password:** `VivaPassword2026!`
* Or click **"Autofill Demo Credentials"** on the login screen, or create any new account.

---
