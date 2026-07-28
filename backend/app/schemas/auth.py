from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Minimum 8 characters")
    full_name: Optional[str] = Field(default=None, alias="fullName")
    company_name: Optional[str] = Field(default=None, alias="companyName")
    business_name: Optional[str] = Field(default=None, alias="businessName")
    gstin: Optional[str] = Field(default=None)
    customer_type: Optional[str] = Field(default=None, alias="customerType")

    model_config = ConfigDict(populate_by_name=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
