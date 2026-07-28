import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import ForeignKey, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedBase

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.onboarding import OnboardingStep


class CustomerDocument(TimestampedBase):
    """Uploaded onboarding document entity associated with a customer and step."""

    __tablename__ = "customer_documents"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    step_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("onboarding_steps.id", ondelete="SET NULL"), nullable=True, index=True
    )
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="documents")
    step: Mapped[Optional["OnboardingStep"]] = relationship("OnboardingStep")
