"""
FineGuard - Executive PDF Report Generation Service
Generates publication-quality PDF risk reports using ReportLab.
"""

import io
from datetime import datetime
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_loan_report_pdf(report_data: Dict[str, Any]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0a1128'),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#475569'),
        spaceAfter=14
    )
    
    section_style = ParagraphStyle(
        'DocSection',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0f766e'),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1e293b')
    )

    elements = []

    # Header
    elements.append(Paragraph("FINEGUARD | EXPLAINABLE AI RISK ASSESSMENT", title_style))
    report_title = report_data.get("title", "Loan Credit Risk Evaluation Report")
    created_at = report_data.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M UTC"))
    elements.append(Paragraph(f"<b>Report:</b> {report_title} &nbsp;|&nbsp; <b>Generated:</b> {created_at} &nbsp;|&nbsp; <b>Model:</b> v1.0.0", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0d9488'), spaceAfter=14))

    # Executive Summary Card
    pred = report_data.get("result", {}).get("prediction", {})
    tier = pred.get("risk_tier", "Low")
    prob = pred.get("default_probability", 0.0)
    score = pred.get("risk_score", 1000)
    
    tier_color = colors.HexColor('#059669') if tier == "Low" else (colors.HexColor('#d97706') if tier == "Moderate" else colors.HexColor('#e11d48'))

    summary_table_data = [
        [
            Paragraph("<b>Overall Risk Tier</b>", body_style),
            Paragraph(f"<b><font color='{tier_color.hexval()}'>{tier.upper()} RISK</font></b>", body_style),
            Paragraph("<b>FineGuard Credit Index</b>", body_style),
            Paragraph(f"<b>{score} / 1000</b>", body_style)
        ],
        [
            Paragraph("<b>Default Probability</b>", body_style),
            Paragraph(f"<b>{prob * 100:.2f}%</b>", body_style),
            Paragraph("<b>Underwriting Decision</b>", body_style),
            Paragraph("<b>Approved / Low Friction</b>" if tier == "Low" else ("<b>Conditional / Manual Review</b>" if tier == "Moderate" else "<b>High Risk / Elevated Safeguards</b>"), body_style)
        ]
    ]
    t_summary = Table(summary_table_data, colWidths=[1.8*inch, 1.8*inch, 1.8*inch, 1.8*inch])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_summary)
    elements.append(Spacer(1, 12))

    # Borrower Profile Table
    elements.append(Paragraph("1. Borrower Financial Profile & Parameters", section_style))
    inputs = report_data.get("inputs", {})
    income = float(inputs.get("monthly_income", 0))
    debt = float(inputs.get("monthly_debt", 0))
    loan_amt = float(inputs.get("loan_amount", 0))
    term = int(inputs.get("loan_term_months", 36))
    credit_score = int(inputs.get("credit_score", 700))
    emp_yrs = float(inputs.get("employment_years", 3.0))
    dti = float(report_data.get("result", {}).get("debt_to_income_ratio", debt/income if income>0 else 0)) * 100

    profile_data = [
        ["Parameter", "Submitted Value", "Parameter", "Submitted Value"],
        ["Monthly Gross Income", f"Rs. {income:,.2f}", "Requested Loan Amount", f"Rs. {loan_amt:,.2f}"],
        ["Monthly Debt Obligations", f"Rs. {debt:,.2f}", "Loan Repayment Term", f"{term} months"],
        ["Debt-to-Income (DTI)", f"{dti:.1f}%", "Credit Score (CIBIL)", f"{credit_score}"],
        ["Employment History", f"{emp_yrs:.1f} years", "Model Target", "90-Day Delinquency"]
    ]
    t_profile = Table(profile_data, colWidths=[2.1*inch, 1.5*inch, 2.1*inch, 1.5*inch])
    t_profile.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0a1128')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('TOPPADDING', (0,1), (-1,-1), 4),
        ('BOTTOMPADDING', (0,1), (-1,-1), 4),
    ]))
    elements.append(t_profile)
    elements.append(Spacer(1, 12))

    # Explainable AI SHAP Breakdown
    elements.append(Paragraph("2. Explainable AI (SHAP) Feature Attribution Audit", section_style))
    elements.append(Paragraph(
        "SHAP (SHapley Additive exPlanations) computes the exact marginal contribution of each borrower characteristic towards the predicted default probability relative to the baseline population average.",
        body_style
    ))
    elements.append(Spacer(1, 6))

    contributions = report_data.get("result", {}).get("contributions", [])
    shap_table_data = [["Feature Description", "Feature Value", "SHAP Impact", "Risk Effect"]]
    for item in contributions[:6]: # Top 6
        sv = item.get("shap_value", 0.0)
        effect = "Risk Escalator (+)" if sv > 0 else "Risk Mitigator (-)"
        shap_table_data.append([
            item.get("label", item.get("feature")),
            str(item.get("feature_value")),
            f"{sv:+.4f}",
            effect
        ])

    t_shap = Table(shap_table_data, colWidths=[2.6*inch, 1.4*inch, 1.4*inch, 1.8*inch])
    t_shap.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t_shap)
    elements.append(Spacer(1, 10))

    # Narrative Explanation
    elements.append(Paragraph("3. Transparent Decision Narrative", section_style))
    narrative = report_data.get("result", {}).get("narrative", "Analysis successfully completed.")
    elements.append(Paragraph(f"<i>\"{narrative}\"</i>", body_style))
    elements.append(Spacer(1, 10))

    # Governance Notice
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94a3b8'), spaceAfter=8))
    elements.append(Paragraph(
        "<b>Model Governance & Compliance:</b> FineGuard v1.0.0 is trained on empirical credit data with balanced cross-validation. This assessment does not substitute for licensed human underwriting and complies with Explainable AI transparency requirements.",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7.5, textColor=colors.HexColor('#64748b'), leading=10)
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer
