import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import ResponseModel
from app.schemas.customer_document import CustomerDocumentRead
from app.services.customer_service import CustomerService
from app.services.document_service import DocumentService

router = APIRouter()


@router.post("/customers/{customer_id}/documents", response_model=ResponseModel[CustomerDocumentRead], status_code=status.HTTP_201_CREATED)
async def upload_customer_document(
    customer_id: uuid.UUID,
    document_type: str = Form(...),
    step_id: Optional[uuid.UUID] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[CustomerDocumentRead]:
    """Upload an onboarding document file for a customer."""
    cust_service = CustomerService(db)
    customer = await cust_service.get_customer(customer_id)
    if not current_user.is_superuser and customer.broker_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    doc_service = DocumentService(db)
    doc = await doc_service.upload_document(
        customer_id=customer_id,
        user_id=current_user.id,
        document_type=document_type,
        file=file,
        step_id=step_id,
    )
    return ResponseModel(
        success=True,
        message="Document uploaded successfully",
        data=CustomerDocumentRead.model_validate(doc),
    )


@router.get("/customers/{customer_id}/documents", response_model=ResponseModel[List[CustomerDocumentRead]])
async def list_customer_documents(
    customer_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[List[CustomerDocumentRead]]:
    """List documents uploaded for a specific customer."""
    cust_service = CustomerService(db)
    customer = await cust_service.get_customer(customer_id)
    if not current_user.is_superuser and customer.broker_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    doc_service = DocumentService(db)
    docs = await doc_service.list_customer_documents(customer_id)
    formatted = [CustomerDocumentRead.model_validate(d) for d in docs]
    return ResponseModel(
        success=True,
        message="Documents retrieved successfully",
        data=formatted,
    )


@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download a customer document file."""
    doc_service = DocumentService(db)
    doc = await doc_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    cust_service = CustomerService(db)
    customer = await cust_service.get_customer(doc.customer_id)
    if not current_user.is_superuser and customer.broker_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file missing on server")

    return FileResponse(
        path=doc.file_path,
        filename=doc.filename,
        media_type=doc.content_type,
    )


@router.delete("/documents/{document_id}", response_model=ResponseModel[dict])
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel[dict]:
    """Delete a customer document record and physical file."""
    doc_service = DocumentService(db)
    doc = await doc_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    cust_service = CustomerService(db)
    customer = await cust_service.get_customer(doc.customer_id)
    if not current_user.is_superuser and customer.broker_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    await doc_service.delete_document(document_id, user_id=current_user.id)
    return ResponseModel(
        success=True,
        message="Document deleted successfully",
        data={"id": str(document_id)},
    )
