from fastapi import APIRouter

from app.api.v1.endpoints import auth, customers, documents, health, onboarding, users

api_v1_router = APIRouter()

api_v1_router.include_router(health.router, prefix="/health", tags=["Health"])
api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(users.router, prefix="/users", tags=["Users"])
api_v1_router.include_router(
    onboarding.router, prefix="/onboarding", tags=["Onboarding"]
)
api_v1_router.include_router(
    customers.router, prefix="/customers", tags=["Customers"]
)
api_v1_router.include_router(
    documents.router, prefix="", tags=["Documents"]
)
