import math
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse, ResponseModel
from app.schemas.user import UserRead, UserUpdate
from app.services.user_service import UserService

router = APIRouter()


@router.get(
    "/me",
    response_model=ResponseModel[UserRead],
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> ResponseModel[UserRead]:
    """Retrieve profile for currently authenticated user."""
    return ResponseModel(
        success=True,
        message="Profile loaded",
        data=UserRead.model_validate(current_user),
    )


@router.patch(
    "/me",
    response_model=ResponseModel[UserRead],
)
async def update_current_user_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[UserRead]:
    """Update profile for currently authenticated user."""
    user_service = UserService(db)
    updated_user = await user_service.update(current_user.id, user_in)
    if updated_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return ResponseModel(
        success=True,
        message="Profile updated successfully",
        data=UserRead.model_validate(updated_user),
    )


@router.get("", response_model=ResponseModel[PaginatedResponse[UserRead]])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[PaginatedResponse[UserRead]]:
    """List user accounts (Admin / Authenticated)."""
    user_service = UserService(db)
    skip = (page - 1) * page_size
    users = await user_service.get_multi(skip=skip, limit=page_size)

    count_stmt = select(func.count(User.id))
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    paginated_data = PaginatedResponse(
        items=[UserRead.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )

    return ResponseModel(
        success=True,
        message="Users retrieved successfully",
        data=paginated_data,
    )


@router.get("/{user_id}", response_model=ResponseModel[UserRead])
async def get_user_by_id(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[UserRead]:
    """Retrieve user details by UUID."""
    user_service = UserService(db)
    user = await user_service.get_by_id(user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return ResponseModel(
        success=True,
        message="User retrieved successfully",
        data=UserRead.model_validate(user),
    )


@router.patch("/{user_id}", response_model=ResponseModel[UserRead])
async def update_user(
    user_id: uuid.UUID,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[UserRead]:
    """Update user account attributes."""
    user_service = UserService(db)
    user = await user_service.update(user_id, user_in)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return ResponseModel(
        success=True,
        message="User updated successfully",
        data=UserRead.model_validate(user),
    )
