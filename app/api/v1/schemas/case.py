from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from sqlalchemy import Column, Integer, ForeignKey

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
    client_context: Optional[str] = None  # What client expects from analysis
    client_agreement: Optional[str] = None  # Does client agree/disagree with document

class CaseCreate(CaseBase):
    package_type: Optional[Literal["basic", "standard", "premium", "express"]] = None
    package_price: Optional[float] = None

# Client can only update basic case info
class CaseClientUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    client_notes: Optional[str] = None
    client_context: Optional[str] = None
    client_agreement: Optional[str] = None

# Operator/Admin can update status and package
class CaseOperatorUpdate(CaseClientUpdate):
    status: Optional[Literal["new", "awaiting_payment", "paid", "processing", "analysis_ready", "documents_ready", "completed", "cancelled"]] = None
    package_type: Optional[Literal["basic", "standard", "premium", "express"]] = None
    package_price: Optional[float] = None

# Legacy update schema for backward compatibility
class CaseUpdate(CaseClientUpdate):
    pass

class CaseInDB(CaseBase):
    id: int
    status: str
    package_type: Optional[str] = None
    package_price: Optional[float] = None
    client_context: Optional[str] = None
    client_agreement: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user_id: int
    documents: List[DocumentInDB] = []

    class Config:
        from_attributes = True

user_id = Column(Integer, ForeignKey("users.id"))