from typing import Optional, List
from pydantic import BaseModel, validator
from datetime import datetime
from enum import Enum

class DocumentType(str, Enum):
    PHOTO = "photo"
    PDF = "pdf" 
    WORD = "word"
    OTHER = "other"

class DocumentBase(BaseModel):
    filename: str
    content_type: str
    size: int
    document_type: DocumentType

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    case_id: int
    file_path: str
    ocr_text: Optional[str] = None
    processing_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentUploadResponse(BaseModel):
    success: bool
    message: str
    documents: List[DocumentResponse] = []
    errors: List[str] = []

class FileUploadLimits(BaseModel):
    max_file_size_mb: int = 50
    max_files_per_case: int = 10
    allowed_file_types: List[str] = ["pdf", "jpg", "jpeg", "png", "doc", "docx"]