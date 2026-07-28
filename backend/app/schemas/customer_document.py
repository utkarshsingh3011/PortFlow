import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CustomerDocumentRead(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    step_id: Optional[uuid.UUID] = None
    document_type: str
    filename: str
    file_path: str
    file_size: int
    content_type: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
