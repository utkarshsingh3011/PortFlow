import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

from app.models.onboarding import FlowStatus, StepStatus


class OnboardingStepBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int
    data: Optional[Dict[str, Any]] = None


class OnboardingStepCreate(OnboardingStepBase):
    pass


class OnboardingStepUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    status: Optional[StepStatus] = None
    data: Optional[Dict[str, Any]] = None


class OnboardingStepRead(OnboardingStepBase):
    id: uuid.UUID
    flow_id: uuid.UUID
    status: StepStatus
    data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OnboardingFlowBase(BaseModel):
    title: str
    description: Optional[str] = None


class OnboardingFlowCreate(OnboardingFlowBase):
    customer_id: Optional[uuid.UUID] = None
    steps: List[OnboardingStepCreate] = []


class OnboardingFlowUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[FlowStatus] = None


class OnboardingFlowRead(OnboardingFlowBase):
    id: uuid.UUID
    user_id: uuid.UUID
    customer_id: Optional[uuid.UUID] = None
    customer_name: Optional[str] = None
    status: FlowStatus
    steps: List[OnboardingStepRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
