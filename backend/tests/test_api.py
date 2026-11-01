"""
FineGuard - Comprehensive End-to-End Backend Test Suite
Tests authentication, ML inference, SHAP explanations, What-If simulation,
report persistence, PDF generation, and dashboard metrics.
"""

import sys
from pathlib import Path
import pytest
from httpx import AsyncClient, ASGITransport

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

@pytest.mark.anyio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

@pytest.mark.anyio
async def test_auth_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register
        reg_payload = {
            "name": "Alex Mercer",
            "email": "alex.mercer@fintech.test",
            "password": "SecurePassword123!"
        }
        res_reg = await client.post("/api/auth/register", json=reg_payload)
        assert res_reg.status_code == 201
        data_reg = res_reg.json()
        assert "access_token" in data_reg
        token = data_reg["access_token"]

        # Login
        login_payload = {
            "email": "alex.mercer@fintech.test",
            "password": "SecurePassword123!"
        }
        res_login = await client.post("/api/auth/login", json=login_payload)
        assert res_login.status_code == 200
        login_token = res_login.json()["access_token"]
        assert len(login_token) > 20

        # Get me with the new login token
        headers = {"Authorization": f"Bearer {login_token}"}
        res_me = await client.get("/api/auth/me", headers=headers)
        assert res_me.status_code == 200
        assert res_me.json()["email"] == "alex.mercer@fintech.test"

@pytest.mark.anyio
async def test_loan_risk_prediction_and_shap():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register user for auth header
        reg_payload = {
            "name": "Jane Underwriter",
            "email": "jane@underwriting.test",
            "password": "SecurePassword123!"
        }
        res_reg = await client.post("/api/auth/register", json=reg_payload)
        token = res_reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Predict Loan Risk
        loan_payload = {
            "monthly_income": 7500.0,
            "monthly_debt": 1800.0,
            "loan_amount": 28000.0,
            "loan_term_months": 48,
            "credit_score": 730,
            "employment_years": 5.0
        }
        res = await client.post("/api/loans/predict", json=loan_payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        
        # Verify prediction structure
        assert "prediction" in data
        assert "default_probability" in data["prediction"]
        assert "risk_tier" in data["prediction"]
        assert "risk_score" in data["prediction"]
        assert "base_value" in data["prediction"]
        
        # Verify DTI
        assert round(data["debt_to_income_ratio"], 4) == round(1800.0 / 7500.0, 4)
        
        # Verify SHAP attributions
        assert len(data["contributions"]) > 0
        assert "narrative" in data
        assert len(data["narrative"]) > 20

@pytest.mark.anyio
async def test_what_if_simulator():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register user
        res_reg = await client.post("/api/auth/register", json={
            "name": "Sam Analyst",
            "email": "sam@risk.test",
            "password": "SecurePassword123!"
        })
        token = res_reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        sim_payload = {
            "original": {
                "monthly_income": 5000.0,
                "monthly_debt": 2500.0,
                "loan_amount": 35000.0,
                "loan_term_months": 36,
                "credit_score": 620,
                "employment_years": 2.0
            },
            "modified": {
                "monthly_income": 5000.0,
                "monthly_debt": 1000.0,  # Lower debt
                "loan_amount": 20000.0,  # Lower loan amount
                "loan_term_months": 48,  # Longer term
                "credit_score": 700,     # Higher score
                "employment_years": 2.0
            }
        }

        res = await client.post("/api/simulation/run", json=sim_payload, headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert "original_result" in data
        assert "modified_result" in data
        assert "comparison" in data
        assert "probability_diff" in data["comparison"]
        assert "summary" in data["comparison"]

@pytest.mark.anyio
async def test_reports_lifecycle_and_pdf():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register user
        res_reg = await client.post("/api/auth/register", json={
            "name": "Audit Officer",
            "email": "audit@bank.test",
            "password": "SecurePassword123!"
        })
        token = res_reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # First predict
        pred_res = await client.post("/api/loans/predict", json={
            "monthly_income": 8000.0,
            "monthly_debt": 1200.0,
            "loan_amount": 25000.0,
            "loan_term_months": 36,
            "credit_score": 760,
            "employment_years": 6.0
        }, headers=headers)
        pred_data = pred_res.json()

        # Save Report
        report_payload = {
            "title": "Prime Borrower Assessment - Case #9042",
            "notes": "Strong income stability and excellent debt coverage ratio.",
            "inputs": {
                "monthly_income": 8000.0,
                "monthly_debt": 1200.0,
                "loan_amount": 25000.0,
                "loan_term_months": 36,
                "credit_score": 760,
                "employment_years": 6.0
            },
            "result": pred_data
        }
        save_res = await client.post("/api/reports", json=report_payload, headers=headers)
        assert save_res.status_code == 201
        report = save_res.json()
        report_id = report["id"]

        # List reports
        list_res = await client.get("/api/reports", headers=headers)
        assert list_res.status_code == 200
        reports_list = list_res.json()
        assert len(reports_list) >= 1
        assert any(r["id"] == report_id for r in reports_list)

        # Get Report Detail
        detail_res = await client.get(f"/api/reports/{report_id}", headers=headers)
        assert detail_res.status_code == 200
        assert detail_res.json()["title"] == "Prime Borrower Assessment - Case #9042"

        # Download PDF
        pdf_res = await client.get(f"/api/reports/{report_id}/pdf", headers=headers)
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert len(pdf_res.content) > 1000

        # Dashboard Summary
        dash_res = await client.get("/api/dashboard/summary", headers=headers)
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        assert dash_data["stats"]["total_analyses"] >= 1
        assert dash_data["model_status"]["is_trained"] is True

        # Delete Report
        del_res = await client.delete(f"/api/reports/{report_id}", headers=headers)
        assert del_res.status_code == 204

        # Confirm deleted
        get_deleted = await client.get(f"/api/reports/{report_id}", headers=headers)
        assert get_deleted.status_code == 404

@pytest.mark.anyio
async def test_insurance_prediction():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_reg = await client.post("/api/auth/register", json={
            "name": "Underwriter Test",
            "email": "underwriter@test.com",
            "password": "Password123!"
        })
        token = res_reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "age": 35,
            "annual_income": 1200000.0,
            "coverage_amount": 10000000.0,
            "bmi": 24.5,
            "smoker_status": 0,
            "pre_existing_conditions": 0,
            "family_medical_history": 0
        }
        res = await client.post("/api/insurance/predict", json=payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "prediction" in data
        assert "claim_risk_probability" in data["prediction"]
        assert "premium_loading" in data["prediction"]
        assert len(data["contributions"]) > 0
        assert data["coverage_to_income_ratio"] == round(10000000.0 / 1200000.0, 2)

@pytest.mark.anyio
async def test_insurance_policy_scanner():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_reg = await client.post("/api/auth/register", json={
            "name": "Policy Auditor",
            "email": "policy_auditor@test.com",
            "password": "Password123!"
        })
        token = res_reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Test with preset
        res = await client.post(
            "/api/insurance/analyze-policy",
            data={"preset": "hdfc"},
            headers=headers
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert "company_name" in data
        assert "company_website" in data
        assert data["company_website"].startswith("https://")
        assert "clauses_to_remember" in data
        assert len(data["clauses_to_remember"]) >= 4
        assert "is_good_to_buy" in data
        assert data["is_good_to_buy"] is True
        assert "verdict_summary" in data

@pytest.mark.anyio
async def test_insurance_policy_scanner_handles_non_health_coverages():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_reg = await client.post("/api/auth/register", json={
            "name": "Policy Auditor 2",
            "email": "policy_auditor_2@test.com",
            "password": "Password123!"
        })
        token = res_reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = await client.post(
            "/api/insurance/analyze-policy",
            data={"preset": "maxlife"},
            headers=headers
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert data["policy_domain"] in {"life", "term_life", "life_insurance"}
        assert "critical_highlights" in data
        assert len(data["critical_highlights"]) >= 3
        assert "clauses_to_remember" in data
        assert len(data["clauses_to_remember"]) >= 4

@pytest.mark.anyio
async def test_investment_prediction():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_reg = await client.post("/api/auth/register", json={
            "name": "Investor Test",
            "email": "investor@test.com",
            "password": "Password123!"
        })
        token = res_reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "investment_amount": 500000.0,
            "investor_age": 32,
            "time_horizon_years": 5,
            "risk_tolerance": 2,
            "equity_allocation_pct": 60.0,
            "fd_debt_allocation_pct": 40.0,
            "emergency_fund_months": 6
        }
        res = await client.post("/api/investments/predict", json=payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "prediction" in data
        assert "volatility_risk_probability" in data["prediction"]
        assert "capital_safety_index" in data["prediction"]
        assert len(data["contributions"]) > 0

@pytest.mark.anyio
async def test_fraud_prediction():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_reg = await client.post("/api/auth/register", json={
            "name": "Fraud Analyst",
            "email": "fraud@test.com",
            "password": "Password123!"
        })
        token = res_reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "transaction_amount": 45000.0,
            "account_avg_transaction": 1500.0,
            "transaction_hour": 3,
            "merchant_category": 3,
            "transaction_velocity_1h": 6,
            "is_foreign_transaction": 1,
            "device_fingerprint_match": 1
        }
        res = await client.post("/api/fraud/predict", json=payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "prediction" in data
        assert "fraud_probability" in data["prediction"]
        assert data["prediction"]["action"] in ["APPROVE", "STEP-UP 2FA", "DECLINE & BLOCK"]
        assert data["surge_ratio"] == 30.0
        assert len(data["contributions"]) > 0

