import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    gstin: Optional[str] = None
    customer_type: str


class CustomerCreate(CustomerBase):
    broker_id: uuid.UUID


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    gstin: Optional[str] = None
    customer_type: Optional[str] = None
    broker_id: Optional[uuid.UUID] = None


class CustomerRead(CustomerBase):
    id: uuid.UUID
    broker_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
