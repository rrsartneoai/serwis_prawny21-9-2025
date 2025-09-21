from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class DocumentBase(BaseModel):
    filename: str
    original_filename: str
    file_type: str
    file_size: int

class DocumentCreate(DocumentBase):
    pass

class DocumentInDB(DocumentBase):
    id: int
    uploaded_at: datetime
    case_id: int

    class Config:
        from_attributes = True

class CaseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    client_notes: Optional[str] = None

class CaseCreate(CaseBase):
    package_type: Optional[str] = None
    package_price: Optional[float] = None

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    client_notes: Optional[str] = None
    status: Optional[str] = None
    package_type: Optional[str] = None
    package_price: Optional[float] = None

class CaseInDB(CaseBase):
    id: int
    status: str
    package_type: Optional[str] = None
    package_price: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    user_id: int
    documents: List[DocumentInDB] = []

    class Config:
        from_attributes = True