from typing import Optional

from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
)
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    Token,
)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate_user(
        self,
        credentials: LoginRequest,
    ) -> Optional[User]:

        stmt = select(User).where(User.email == credentials.email)
        result = await self.db.execute(stmt)

        user = result.scalar_one_or_none()

        if user is None:
            return None

        if not verify_password(
            credentials.password,
            user.hashed_password,
        ):
            return None

        return user

    async def login(
        self,
        credentials: LoginRequest,
    ) -> Token:

        user = await self.authenticate_user(credentials)

        if user is None:
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
            )

        access_token = create_access_token(
            subject=str(user.id)
        )

        return Token(
            access_token=access_token,
            token_type="bearer",
        )

    async def register_user(
        self,
        user_in: RegisterRequest,
    ) -> User:

        stmt = select(User).where(
            User.email == user_in.email
        )

        result = await self.db.execute(stmt)

        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists.",
            )

        company = user_in.company_name or user_in.business_name
        new_user = User(
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            company_name=company,
            is_active=True,
            is_superuser=False,
        )

        self.db.add(new_user)

        await self.db.commit()

        await self.db.refresh(new_user)

        return new_user

    async def create_user_tokens(
        self,
        user: User,
    ) -> Token:

        access_token = create_access_token(
            subject=str(user.id)
        )

        return Token(
            access_token=access_token,
            token_type="bearer",
        )