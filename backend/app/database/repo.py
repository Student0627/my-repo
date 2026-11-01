"""
FineGuard - Data Repository
Provides unified persistence across MongoDB and in-memory fallback.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.database.mongodb import get_database

# In-memory storage for test/fallback environments
_memory_users: Dict[str, Dict[str, Any]] = {}
_memory_reports: Dict[str, Dict[str, Any]] = {}

class Repository:
    @staticmethod
    async def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        db = get_database()
        if db is not None:
            try:
                user = await db.users.find_one({"email": email.lower()})
                if user:
                    user["id"] = str(user.get("_id", user.get("id")))
                    return user
            except Exception:
                pass
        
        # Fallback
        for u in _memory_users.values():
            if u["email"].lower() == email.lower():
                return u
        return None

    @staticmethod
    async def create_user(name: str, email: str, hashed_password: str) -> Dict[str, Any]:
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "name": name,
            "email": email.lower(),
            "hashed_password": hashed_password,
            "role": "analyst",
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        db = get_database()
        if db is not None:
            try:
                user_doc["_id"] = user_id
                await db.users.insert_one(user_doc)
            except Exception:
                pass

        _memory_users[user_id] = user_doc
        return user_doc

    @staticmethod
    async def create_report(user_id: str, title: str, notes: Optional[str], inputs: Dict[str, Any], result: Dict[str, Any]) -> Dict[str, Any]:
        report_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        
        pred = result.get("prediction", {})
        report_doc = {
            "id": report_id,
            "user_id": user_id,
            "title": title,
            "notes": notes or "",
            "inputs": inputs,
            "result": result,
            "risk_tier": pred.get("risk_tier", "Low"),
            "risk_score": pred.get("risk_score", 1000),
            "default_probability": pred.get("default_probability", 0.0),
            "loan_amount": float(inputs.get("loan_amount", 0)),
            "monthly_income": float(inputs.get("monthly_income", 0)),
            "debt_to_income_ratio": float(result.get("debt_to_income_ratio", 0)),
            "created_at": created_at,
            "model_version": "1.0.0"
        }

        db = get_database()
        if db is not None:
            try:
                report_doc["_id"] = report_id
                await db.reports.insert_one(report_doc)
            except Exception:
                pass

        _memory_reports[report_id] = report_doc
        return report_doc

    @staticmethod
    async def get_user_reports(user_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        if db is not None:
            try:
                cursor = db.reports.find({"user_id": user_id}).sort("created_at", -1)
                reports = []
                async for doc in cursor:
                    doc["id"] = str(doc.get("_id", doc.get("id")))
                    reports.append(doc)
                if reports:
                    return reports
            except Exception:
                pass

        # Fallback
        user_reports = [r for r in _memory_reports.values() if r["user_id"] == user_id]
        user_reports.sort(key=lambda x: x["created_at"], reverse=True)
        return user_reports

    @staticmethod
    async def get_report_by_id(report_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        db = get_database()
        if db is not None:
            try:
                doc = await db.reports.find_one({"$or": [{"_id": report_id}, {"id": report_id}], "user_id": user_id})
                if doc:
                    doc["id"] = str(doc.get("_id", doc.get("id")))
                    return doc
            except Exception:
                pass

        doc = _memory_reports.get(report_id)
        if doc and doc["user_id"] == user_id:
            return doc
        return None

    @staticmethod
    async def delete_report(report_id: str, user_id: str) -> bool:
        db = get_database()
        deleted = False
        if db is not None:
            try:
                res = await db.reports.delete_one({"$or": [{"_id": report_id}, {"id": report_id}], "user_id": user_id})
                if res.deleted_count > 0:
                    deleted = True
            except Exception:
                pass

        if report_id in _memory_reports and _memory_reports[report_id]["user_id"] == user_id:
            del _memory_reports[report_id]
            deleted = True

        return deleted

    @staticmethod
    async def get_dashboard_stats(user_id: str) -> Dict[str, Any]:
        reports = await Repository.get_user_reports(user_id)
        
        total_analyses = len(reports)
        low_risk_count = sum(1 for r in reports if r.get("risk_tier") == "Low")
        moderate_risk_count = sum(1 for r in reports if r.get("risk_tier") == "Moderate")
        high_risk_count = sum(1 for r in reports if r.get("risk_tier") == "High")
        
        # Calculate recent activity and timeline
        history_points = []
        for r in reversed(reports[-10:]):
            history_points.append({
                "date": r["created_at"][:10],
                "risk_score": r.get("risk_score", 0),
                "default_prob": round(r.get("default_probability", 0) * 100, 1),
                "title": r.get("title", "Assessment")
            })

        return {
            "total_analyses": total_analyses,
            "saved_reports_count": total_analyses,
            "low_risk_count": low_risk_count,
            "moderate_risk_count": moderate_risk_count,
            "high_risk_count": high_risk_count,
            "history": history_points,
            "recent_reports": reports[:5]
        }
