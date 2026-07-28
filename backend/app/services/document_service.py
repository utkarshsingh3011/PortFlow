import os
import uuid
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer_document import CustomerDocument
from app.services.activity_service import ActivityService

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "documents")


class DocumentService:
    """Service handling onboarding document uploads, disk storage, downloads, and deletion."""

    def __init__(self, db: AsyncSession):
        self.db = db
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    async def upload_document(
        self,
        customer_id: uuid.UUID,
        user_id: uuid.UUID,
        document_type: str,
        file: UploadFile,
        step_id: Optional[uuid.UUID] = None,
    ) -> CustomerDocument:
        """Save physical file to disk, create DB record, and record activity timeline event."""
        # Clean file name and generate unique disk filename
        file_ext = os.path.splitext(file.filename or "")[1]
        unique_name = f"{customer_id}_{document_type}_{uuid.uuid4().hex[:8]}{file_ext}"
        target_path = os.path.join(UPLOAD_DIR, unique_name)

        # Read file contents and save to disk
        contents = await file.read()
        file_size = len(contents)

        with open(target_path, "wb") as f:
            f.write(contents)

        doc = CustomerDocument(
            customer_id=customer_id,
            step_id=step_id,
            document_type=document_type,
            filename=file.filename or unique_name,
            file_path=target_path,
            file_size=file_size,
            content_type=file.content_type or "application/octet-stream",
        )
        self.db.add(doc)
        await self.db.flush()

        # Log Activity event to PostgreSQL
        act_service = ActivityService(self.db)
        formatted_type = document_type.replace("_", " ").upper()
        await act_service.log_activity(
            customer_id=customer_id,
            user_id=user_id,
            event_type="document_uploaded",
            title=f"Document Uploaded: {formatted_type}",
            description=f"Uploaded file '{doc.filename}' ({round(file_size / 1024, 1)} KB).",
            metadata_json={"document_id": str(doc.id), "document_type": document_type},
        )

        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def list_customer_documents(self, customer_id: uuid.UUID) -> List[CustomerDocument]:
        """Fetch all documents uploaded for a customer."""
        stmt = (
            select(CustomerDocument)
            .where(CustomerDocument.customer_id == customer_id)
            .order_by(CustomerDocument.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_document(self, document_id: uuid.UUID) -> Optional[CustomerDocument]:
        """Fetch document record by ID."""
        stmt = select(CustomerDocument).where(CustomerDocument.id == document_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def delete_document(self, document_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete document record and remove physical file from disk."""
        doc = await self.get_document(document_id)
        if not doc:
            return False

        # Remove file from disk if exists
        if os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except OSError:
                pass

        # Log activity before deletion
        act_service = ActivityService(self.db)
        formatted_type = doc.document_type.replace("_", " ").upper()
        await act_service.log_activity(
            customer_id=doc.customer_id,
            user_id=user_id,
            event_type="document_deleted",
            title=f"Document Removed: {formatted_type}",
            description=f"File '{doc.filename}' deleted.",
        )

        await self.db.delete(doc)
        await self.db.commit()
        return True
