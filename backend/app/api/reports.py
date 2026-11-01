"""
FineGuard - Reports Management API
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from typing import List
from app.schemas.report import ReportCreate, ReportDetail, ReportSummary
from app.database.repo import Repository
from app.core.security import get_current_user_payload
from app.services.pdf_service import generate_loan_report_pdf

router = APIRouter(prefix="/reports", tags=["Reports & History"])

@router.post("", response_model=ReportDetail, status_code=status.HTTP_201_CREATED)
async def save_report(
    report_in: ReportCreate,
    current_user: dict = Depends(get_current_user_payload)
):
    user_id = current_user["sub"]
    doc = await Repository.create_report(
        user_id=user_id,
        title=report_in.title,
        notes=report_in.notes,
        inputs=report_in.inputs,
        result=report_in.result
    )
    return ReportDetail(**doc)

@router.get("", response_model=List[ReportSummary])
async def list_reports(current_user: dict = Depends(get_current_user_payload)):
    user_id = current_user["sub"]
    reports = await Repository.get_user_reports(user_id)
    return [ReportSummary(**r) for r in reports]

@router.get("/{report_id}", response_model=ReportDetail)
async def get_report_detail(
    report_id: str,
    current_user: dict = Depends(get_current_user_payload)
):
    user_id = current_user["sub"]
    report = await Repository.get_report_by_id(report_id, user_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or access denied")
    return ReportDetail(**report)

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: str,
    current_user: dict = Depends(get_current_user_payload)
):
    user_id = current_user["sub"]
    success = await Repository.delete_report(report_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found or access denied")
    return None

@router.get("/{report_id}/pdf")
async def export_report_pdf(
    report_id: str,
    current_user: dict = Depends(get_current_user_payload)
):
    user_id = current_user["sub"]
    report = await Repository.get_report_by_id(report_id, user_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or access denied")

    pdf_buffer = generate_loan_report_pdf(report)
    filename = f"FineGuard_Report_{report_id[:8]}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
