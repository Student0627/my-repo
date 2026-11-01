"""
FineGuard - What-If Simulator API
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.schemas.loan import WhatIfRequest, WhatIfResponse
from app.services.loan_service import run_what_if_simulation
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/simulation", tags=["What-If Simulator"])

@router.post("/run", response_model=WhatIfResponse)
async def run_simulation(
    req: WhatIfRequest,
    current_user: Optional[dict] = Depends(get_current_user_payload)
):
    try:
        response = run_what_if_simulation(req)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation error during comparison: {str(e)}"
        )
