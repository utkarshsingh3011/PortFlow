import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class CustomerActivityRead(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    event_type: str
    title: str
    description: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
