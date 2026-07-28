from fastapi import APIRouter
from app.schemas.common import ResponseModel

router = APIRouter()


@router.get("", response_model=ResponseModel[dict])
async def health_check() -> ResponseModel[dict]:
    """Health check endpoint to verify backend service status."""
    return ResponseModel(
        success=True,
        message="PortFlow service operational",
        data={"status": "online"},
    )
