import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer_activity import CustomerActivity
from app.models.customer import Customer


class ActivityService:
    """Service handling persistent customer activity timeline logs."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_activity(
        self,
        customer_id: uuid.UUID,
        event_type: str,
        title: str,
        user_id: Optional[uuid.UUID] = None,
        description: Optional[str] = None,
        metadata_json: Optional[Dict[str, Any]] = None,
    ) -> CustomerActivity:
        """Create and persist a new customer activity event record."""
        activity = CustomerActivity(
            customer_id=customer_id,
            user_id=user_id,
            event_type=event_type,
            title=title,
            description=description,
            metadata_json=metadata_json,
        )
        self.db.add(activity)
        await self.db.commit()
        await self.db.refresh(activity)
        return activity

    async def get_customer_activities(self, customer_id: uuid.UUID) -> List[CustomerActivity]:
        """Fetch all activity events logged for a specific customer chronologically (newest first)."""
        stmt = (
            select(CustomerActivity)
            .where(CustomerActivity.customer_id == customer_id)
            .order_by(CustomerActivity.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_broker_activities(
        self, user_id: uuid.UUID, limit: int = 20
    ) -> List[CustomerActivity]:
        """Fetch recent activity events across all customers assigned to a specific broker."""
        stmt = (
            select(CustomerActivity)
            .join(Customer, CustomerActivity.customer_id == Customer.id)
            .where(Customer.broker_id == user_id)
            .order_by(CustomerActivity.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
