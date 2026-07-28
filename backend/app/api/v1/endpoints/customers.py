import logging
import math
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse, ResponseModel
from app.schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate
from app.schemas.customer_activity import CustomerActivityRead
from app.services.activity_service import ActivityService
from app.services.customer_service import CustomerService
from app.services.seed_service import SeedService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/activities/recent", response_model=ResponseModel[List[CustomerActivityRead]])
async def get_recent_broker_activities(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[List[CustomerActivityRead]]:
    """Fetch recent activity timeline events across all customers owned by the authenticated broker."""
    # Ensure demo data exists for broker if first login
    seed_svc = SeedService(db)
    await seed_svc.ensure_demo_data_for_broker(current_user.id)

    act_service = ActivityService(db)
    activities = await act_service.list_broker_activities(user_id=current_user.id, limit=limit)
    formatted = [CustomerActivityRead.model_validate(a) for a in activities]
    return ResponseModel(
        success=True,
        message="Broker recent activities retrieved successfully",
        data=formatted,
    )


@router.post("", response_model=ResponseModel[CustomerRead], status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_in: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[CustomerRead]:
    """Create a new customer linked to a broker."""
    if not current_user.is_superuser and customer_in.broker_id != current_user.id:
        customer_in.broker_id = current_user.id

    service = CustomerService(db)
    customer = await service.create_customer(customer_in)
    return ResponseModel(
        success=True,
        message="Customer created successfully",
        data=CustomerRead.model_validate(customer),
    )


@router.get("", response_model=ResponseModel[PaginatedResponse[CustomerRead]])
async def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    broker_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[PaginatedResponse[CustomerRead]]:
    """List customers with pagination and optional broker filter."""
    if not current_user.is_superuser:
        broker_id = current_user.id

    if broker_id:
        seed_svc = SeedService(db)
        await seed_svc.ensure_demo_data_for_broker(broker_id)

    service = CustomerService(db)
    customers, total = await service.list_customers(
        broker_id=broker_id, page=page, page_size=page_size
    )

    items = [CustomerRead.model_validate(c) for c in customers]
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    paginated = PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
    return ResponseModel(
        success=True,
        message="Customers retrieved successfully",
        data=paginated,
    )


@router.get("/{customer_id}", response_model=ResponseModel[CustomerRead])
async def get_customer(
    customer_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[CustomerRead]:
    """Fetch customer details by UUID."""
    service = CustomerService(db)
    customer = await service.get_customer(customer_id)
    if not current_user.is_superuser and customer.broker_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )
    return ResponseModel(
        success=True,
        message="Customer retrieved successfully",
        data=CustomerRead.model_validate(customer),
    )


@router.get("/{customer_id}/activities", response_model=ResponseModel[List[CustomerActivityRead]])
async def get_customer_activities(
    customer_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[List[CustomerActivityRead]]:
    """Fetch activity timeline history for a specific customer."""
    cust_service = CustomerService(db)
    customer = await cust_service.get_customer(customer_id)
    if not current_user.is_superuser and customer.broker_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    act_service = ActivityService(db)
    activities = await act_service.get_customer_activities(customer_id)
    formatted = [CustomerActivityRead.model_validate(a) for a in activities]
    return ResponseModel(
        success=True,
        message="Customer activities retrieved successfully",
        data=formatted,
    )


@router.put("/{customer_id}", response_model=ResponseModel[CustomerRead])
async def update_customer(
    customer_id: uuid.UUID,
    customer_in: CustomerUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[CustomerRead]:
    """Update customer attributes."""
    service = CustomerService(db)
    customer = await service.get_customer(customer_id)
    if not current_user.is_superuser and customer.broker_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )
    updated_customer = await service.update_customer(customer_id, customer_in)
    return ResponseModel(
        success=True,
        message="Customer updated successfully",
        data=CustomerRead.model_validate(updated_customer),
    )


@router.delete(
    "/{customer_id}",
    response_model=ResponseModel[dict],
    status_code=status.HTTP_200_OK,
)
async def delete_customer(
    customer_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[dict]:
    """Delete a customer record by UUID."""
    logger.info(f"DELETE endpoint invoked for customer_id: {customer_id} by user: {current_user.id}")
    service = CustomerService(db)
    customer = await service.get_customer(customer_id)
    if not current_user.is_superuser and customer.broker_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )
    await service.delete_customer(customer_id)
    logger.info(f"DELETE endpoint completed for customer_id: {customer_id}")
    return ResponseModel(
        success=True,
        message="Customer deleted successfully",
        data={"id": str(customer_id)},
    )
