import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import ForeignKey, String, Integer, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import TimestampedBase

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.customer import Customer


class FlowStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class StepStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class OnboardingFlow(TimestampedBase):
    """Onboarding Flow entity for a SaaS customer journey."""

    __tablename__ = "onboarding_flows"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), unique=True, nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    status: Mapped[FlowStatus] = mapped_column(
        SQLEnum(FlowStatus), default=FlowStatus.NOT_STARTED, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="onboarding_flows")
    customer: Mapped[Optional["Customer"]] = relationship("Customer", back_populates="onboarding_flow")
    steps: Mapped[List["OnboardingStep"]] = relationship(
        "OnboardingStep", back_populates="flow", cascade="all, delete-orphan", order_by="OnboardingStep.order"
    )


from sqlalchemy import ForeignKey, String, Integer, JSON, Enum as SQLEnum

class OnboardingStep(TimestampedBase):
    """Individual step item inside an Onboarding Flow."""

    __tablename__ = "onboarding_steps"

    flow_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("onboarding_flows.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[StepStatus] = mapped_column(
        SQLEnum(StepStatus), default=StepStatus.PENDING, nullable=False
    )
    data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    flow: Mapped["OnboardingFlow"] = relationship("OnboardingFlow", back_populates="steps")
