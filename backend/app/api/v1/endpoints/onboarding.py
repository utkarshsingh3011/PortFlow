import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import ResponseModel
from app.schemas.onboarding import (
    OnboardingFlowCreate,
    OnboardingFlowRead,
    OnboardingFlowUpdate,
    OnboardingStepRead,
    OnboardingStepUpdate,
)
from app.services.onboarding_service import OnboardingService
from app.services.seed_service import SeedService

router = APIRouter()


def _format_flow_read(flow) -> OnboardingFlowRead:
    """Helper to convert model to OnboardingFlowRead schema with customer_name populated."""
    read_obj = OnboardingFlowRead.model_validate(flow)
    if flow.customer and hasattr(flow.customer, 'name'):
        read_obj.customer_name = flow.customer.name
    return read_obj


@router.get("/flows", response_model=ResponseModel[List[OnboardingFlowRead]])
async def get_user_onboarding_flows(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[List[OnboardingFlowRead]]:
    """Retrieve onboarding flows for active authenticated broker."""
    seed_svc = SeedService(db)
    await seed_svc.ensure_demo_data_for_broker(current_user.id)

    service = OnboardingService(db)
    flows = await service.get_user_flows(current_user.id)
    formatted = [_format_flow_read(f) for f in flows]
    return ResponseModel(
        success=True,
        message="Onboarding flows loaded",
        data=formatted,
    )


@router.get("/flows/customer/{customer_id}", response_model=ResponseModel[Optional[OnboardingFlowRead]])
async def get_flow_by_customer_id(
    customer_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[Optional[OnboardingFlowRead]]:
    """Retrieve onboarding flow assigned to a specific customer (auto-provisions if missing)."""
    service = OnboardingService(db)
    flow = await service.get_flow_by_customer_id(customer_id)
    if flow and not current_user.is_superuser and flow.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding flow not found",
        )
    formatted = _format_flow_read(flow) if flow else None
    return ResponseModel(
        success=True,
        message="Customer onboarding flow loaded",
        data=formatted,
    )


@router.post(
    "/flows",
    response_model=ResponseModel[OnboardingFlowRead],
    status_code=status.HTTP_201_CREATED,
)
async def create_onboarding_flow(
    flow_in: OnboardingFlowCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[OnboardingFlowRead]:
    """Create a new onboarding flow."""
    service = OnboardingService(db)
    flow = await service.create_flow(current_user.id, flow_in)
    return ResponseModel(
        success=True,
        message="Onboarding flow created successfully",
        data=_format_flow_read(flow),
    )


@router.get("/flows/{flow_id}", response_model=ResponseModel[OnboardingFlowRead])
async def get_onboarding_flow(
    flow_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[OnboardingFlowRead]:
    """Retrieve onboarding flow details by ID."""
    service = OnboardingService(db)
    flow = await service.get_flow(flow_id)
    if not flow or (not current_user.is_superuser and flow.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding flow not found",
        )
    return ResponseModel(
        success=True,
        message="Onboarding flow loaded",
        data=_format_flow_read(flow),
    )


@router.put("/flows/{flow_id}", response_model=ResponseModel[OnboardingFlowRead])
async def update_onboarding_flow(
    flow_id: uuid.UUID,
    flow_in: OnboardingFlowUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[OnboardingFlowRead]:
    """Update onboarding flow details."""
    service = OnboardingService(db)
    flow = await service.get_flow(flow_id)
    if not flow or (not current_user.is_superuser and flow.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding flow not found",
        )
    updated_flow = await service.update_flow(flow_id, flow_in)
    return ResponseModel(
        success=True,
        message="Onboarding flow updated successfully",
        data=_format_flow_read(updated_flow),
    )


@router.patch("/steps/{step_id}", response_model=ResponseModel[OnboardingStepRead])
async def update_onboarding_step(
    step_id: uuid.UUID,
    step_in: OnboardingStepUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[OnboardingStepRead]:
    """Update onboarding step status, description, or form data."""
    service = OnboardingService(db)
    updated_step = await service.update_step(step_id, step_in)
    if not updated_step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding step not found",
        )
    return ResponseModel(
        success=True,
        message="Onboarding step updated successfully",
        data=OnboardingStepRead.model_validate(updated_step),
    )
