import logging
import uuid
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EntityNotFoundException
from app.models.customer import Customer
from app.models.customer_activity import CustomerActivity
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate

logger = logging.getLogger(__name__)


class CustomerService:
    """Service handling Customer Onboarding operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _log_activity(
        self,
        customer_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
        event_type: str,
        title: str,
        description: Optional[str] = None,
        metadata_json: Optional[dict] = None,
    ):
        """Internal helper to append activity timeline events."""
        activity = CustomerActivity(
            customer_id=customer_id,
            user_id=user_id,
            event_type=event_type,
            title=title,
            description=description,
            metadata_json=metadata_json,
        )
        self.db.add(activity)

    async def create_customer(self, customer_in: CustomerCreate) -> Customer:
        """Create a new customer linked to a broker (User)."""
        user_stmt = select(User).where(User.id == customer_in.broker_id)
        result = await self.db.execute(user_stmt)
        user = result.scalar_one_or_none()
        if user is None:
            raise EntityNotFoundException(entity_name="User", entity_id=customer_in.broker_id)

        # 1. Uniqueness check for email under the same broker
        email_clean = customer_in.email.strip().lower()
        email_stmt = select(Customer).where(
            Customer.broker_id == customer_in.broker_id,
            func.lower(Customer.email) == email_clean,
        )
        existing_email = await self.db.execute(email_stmt)
        if existing_email.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Customer with this email already exists.",
            )

        # 2. Uniqueness check for GSTIN under the same broker (if provided)
        gstin_clean = customer_in.gstin.strip() if customer_in.gstin else None
        if gstin_clean:
            gstin_stmt = select(Customer).where(
                Customer.broker_id == customer_in.broker_id,
                Customer.gstin == gstin_clean,
            )
            existing_gstin = await self.db.execute(gstin_stmt)
            if existing_gstin.scalar_one_or_none() is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Customer with this GSTIN already exists.",
                )

        customer = Customer(
            broker_id=customer_in.broker_id,
            name=customer_in.name.strip(),
            email=customer_in.email.strip(),
            gstin=gstin_clean,
            customer_type=customer_in.customer_type,
        )
        self.db.add(customer)
        await self.db.flush()

        # Log creation activity
        await self._log_activity(
            customer_id=customer.id,
            user_id=customer.broker_id,
            event_type="customer_created",
            title="Customer Account Created",
            description=f"Customer '{customer.name}' registered ({customer.customer_type}).",
            metadata_json={"email": customer.email, "gstin": customer.gstin},
        )

        try:
            await self.db.commit()
            await self.db.refresh(customer)
        except IntegrityError as exc:
            await self.db.rollback()
            exc_str = str(exc).lower()
            if "gstin" in exc_str:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Customer with this GSTIN already exists.",
                )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Customer with this email already exists.",
            )

        return customer

    async def list_customers(
        self,
        broker_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Customer], int]:
        """List customers with optional broker_id filtering and pagination."""
        query = select(Customer)
        count_query = select(func.count(Customer.id))

        if broker_id is not None:
            query = query.where(Customer.broker_id == broker_id)
            count_query = count_query.where(Customer.broker_id == broker_id)

        total_res = await self.db.execute(count_query)
        total = total_res.scalar_one() or 0

        offset = (page - 1) * page_size
        query = query.order_by(Customer.created_at.desc()).offset(offset).limit(page_size)

        result = await self.db.execute(query)
        customers = list(result.scalars().all())

        return customers, total

    async def get_customer(self, customer_id: uuid.UUID) -> Customer:
        """Fetch customer details by ID."""
        stmt = select(Customer).where(Customer.id == customer_id)
        result = await self.db.execute(stmt)
        customer = result.scalar_one_or_none()
        if customer is None:
            raise EntityNotFoundException(entity_name="Customer", entity_id=customer_id)
        return customer

    async def update_customer(
        self,
        customer_id: uuid.UUID,
        customer_in: CustomerUpdate,
    ) -> Customer:
        """Update customer attributes."""
        customer = await self.get_customer(customer_id)
        update_data = customer_in.model_dump(exclude_unset=True)

        if "broker_id" in update_data and update_data["broker_id"] is not None:
            user_stmt = select(User).where(User.id == update_data["broker_id"])
            user_res = await self.db.execute(user_stmt)
            if user_res.scalar_one_or_none() is None:
                raise EntityNotFoundException(entity_name="User", entity_id=update_data["broker_id"])

        # Check email uniqueness if updating email
        if "email" in update_data and update_data["email"]:
            new_email = update_data["email"].strip().lower()
            if new_email != customer.email.lower():
                email_stmt = select(Customer).where(
                    Customer.broker_id == customer.broker_id,
                    Customer.id != customer_id,
                    func.lower(Customer.email) == new_email,
                )
                existing = await self.db.execute(email_stmt)
                if existing.scalar_one_or_none() is not None:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Customer with this email already exists.",
                    )

        # Check GSTIN uniqueness if updating GSTIN
        if "gstin" in update_data and update_data["gstin"]:
            new_gstin = update_data["gstin"].strip()
            if new_gstin != customer.gstin:
                gstin_stmt = select(Customer).where(
                    Customer.broker_id == customer.broker_id,
                    Customer.id != customer_id,
                    Customer.gstin == new_gstin,
                )
                existing = await self.db.execute(gstin_stmt)
                if existing.scalar_one_or_none() is not None:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Customer with this GSTIN already exists.",
                    )

        for field, value in update_data.items():
            setattr(customer, field, value)

        self.db.add(customer)
        await self._log_activity(
            customer_id=customer.id,
            user_id=customer.broker_id,
            event_type="customer_updated",
            title="Customer Profile Updated",
            description=f"Profile attributes updated for {customer.name}.",
            metadata_json=update_data,
        )

        try:
            await self.db.commit()
            await self.db.refresh(customer)
        except IntegrityError as exc:
            await self.db.rollback()
            exc_str = str(exc).lower()
            if "gstin" in exc_str:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Customer with this GSTIN already exists.",
                )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Customer with this email already exists.",
            )

        return customer

    async def delete_customer(self, customer_id: uuid.UUID) -> Customer:
        """Delete customer permanently from PostgreSQL database."""
        logger.info(f"DELETE request received in CustomerService for customer_id: {customer_id}")
        customer = await self.get_customer(customer_id)

        await self._log_activity(
            customer_id=customer.id,
            user_id=customer.broker_id,
            event_type="customer_deleted",
            title="Customer Account Deleted",
            description=f"Customer '{customer.name}' deleted from database.",
            metadata_json={"email": customer.email, "gstin": customer.gstin},
        )
        await self.db.flush()

        logger.info(f"Deleting customer record (ID: {customer.id}, Name: {customer.name}, Email: {customer.email})")
        await self.db.delete(customer)
        await self.db.commit()
        logger.info(f"Database commit completed successfully. Customer {customer_id} deleted (1 row affected).")

        return customer
