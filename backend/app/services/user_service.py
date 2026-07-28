import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """Service handling user profile management and queries."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Fetch user by unique UUID primary key."""
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user profile by email address."""
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Fetch paginated list of user records."""
        stmt = select(User).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_multiple(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Fetch paginated list of user records (alias for get_multi)."""
        return await self.get_multi(skip=skip, limit=limit)

    async def create(self, user_in: UserCreate) -> User:
        """Create new user entity."""
        user_data = (
            user_in.model_dump(exclude={"password"})
            if hasattr(user_in, "model_dump")
            else user_in.dict(exclude={"password"})
        )
        hashed_password = get_password_hash(user_in.password)
        db_user = User(**user_data, hashed_password=hashed_password)
        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user

    async def update(
        self, user_id: uuid.UUID, user_in: UserUpdate
    ) -> Optional[User]:
        """Update existing user entity."""
        db_user = await self.get_by_id(user_id)
        if db_user is None:
            return None

        update_data = (
            user_in.model_dump(exclude_unset=True)
            if hasattr(user_in, "model_dump")
            else user_in.dict(exclude_unset=True)
        )
        if "password" in update_data:
            password = update_data.pop("password")
            if password is not None:
                db_user.hashed_password = get_password_hash(password)

        for field, value in update_data.items():
            setattr(db_user, field, value)

        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user
