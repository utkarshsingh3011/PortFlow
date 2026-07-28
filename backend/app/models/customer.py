import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedBase

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.onboarding import OnboardingFlow
    from app.models.customer_activity import CustomerActivity
    from app.models.customer_document import CustomerDocument


class Customer(TimestampedBase):
    """Customer entity model representing onboarding customers for brokers."""

    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint("broker_id", "email", name="uq_customer_broker_email"),
        UniqueConstraint("broker_id", "gstin", name="uq_customer_broker_gstin"),
    )

    broker_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    customer_type: Mapped[str] = mapped_column(String(50), nullable=False)

    broker: Mapped["User"] = relationship("User", back_populates="customers")
    onboarding_flow: Mapped[Optional["OnboardingFlow"]] = relationship(
        "OnboardingFlow", back_populates="customer", uselist=False, cascade="all, delete-orphan"
    )
    activities: Mapped[List["CustomerActivity"]] = relationship(
        "CustomerActivity", back_populates="customer", cascade="all, delete-orphan", order_by="CustomerActivity.created_at.desc()"
    )
    documents: Mapped[List["CustomerDocument"]] = relationship(
        "CustomerDocument", back_populates="customer", cascade="all, delete-orphan", order_by="CustomerDocument.created_at.desc()"
    )
