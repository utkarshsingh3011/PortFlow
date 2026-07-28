from fastapi import APIRouter, Depends, status
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.common import ResponseModel
from app.schemas.user import UserRead
from app.services.auth_service import AuthService

router = APIRouter()


@router.post(
    "/login",
    response_model=ResponseModel[Token],
)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db),
):

    auth_service = AuthService(db)

    token = await auth_service.login(credentials)

    return ResponseModel(
        success=True,
        message="Login successful",
        data=token,
    )


@router.post(
    "/register",
    response_model=ResponseModel[UserRead],
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_in: RegisterRequest, db: AsyncSession = Depends(get_db)
) -> ResponseModel[UserRead]:
    """Register a new user account on the portal."""
    auth_service = AuthService(db)
    user = await auth_service.register_user(user_in)
    return ResponseModel(
        success=True,
        message="User registered successfully",
        data=UserRead.model_validate(user),
    )


from app.api.v1.deps import get_current_user
from app.models.user import User


@router.post("/refresh", response_model=ResponseModel[Token])
async def refresh_token(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[Token]:
    """Refresh active session access token."""
    auth_service = AuthService(db)
    token = await auth_service.create_user_tokens(current_user)
    return ResponseModel(
        success=True,
        message="Token refreshed successfully",
        data=token,
    )
