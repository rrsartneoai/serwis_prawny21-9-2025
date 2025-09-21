import os
import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.case import Case, Document
from app.api.v1.schemas.case import CaseCreate, CaseInDB, CaseUpdate, DocumentInDB
from app.core.auth import get_current_active_user

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=CaseInDB, status_code=status.HTTP_201_CREATED)
async def create_case(
    title: str = Form(...),
    description: str = Form(None),
    client_notes: str = Form(None),
    package_type: str = Form(None),
    package_price: float = Form(None),
    files: List[UploadFile] = File([]),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new case with optional file uploads"""
    
    # Create the case
    case_data = CaseCreate(
        title=title,
        description=description,
        client_notes=client_notes,
        package_type=package_type,
        package_price=package_price
    )
    
    db_case = Case(
        **case_data.dict(),
        user_id=current_user.id
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    
    # Handle file uploads
    uploaded_documents = []
    for file in files:
        if file.filename and file.size > 0:
            # Validate file type
            allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
            if file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type {file.content_type} not allowed. Allowed types: PDF, JPG, PNG"
                )
            
            # Validate file size (10MB max)
            if file.size > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File {file.filename} is too large. Maximum size is 10MB"
                )
            
            # Generate unique filename
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            
            # Save file
            contents = await file.read()
            with open(file_path, "wb") as f:
                f.write(contents)
            
            # Create document record
            file_type = "pdf" if file.content_type == "application/pdf" else "image"
            db_document = Document(
                filename=unique_filename,
                original_filename=file.filename,
                file_type=file_type,
                file_size=file.size,
                file_path=file_path,
                case_id=db_case.id
            )
            db.add(db_document)
            uploaded_documents.append(db_document)
    
    db.commit()
    
    # Refresh case with documents
    db.refresh(db_case)
    
    return db_case

@router.get("/", response_model=List[CaseInDB])
def get_user_cases(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all cases for the current user"""
    cases = db.query(Case).filter(Case.user_id == current_user.id).all()
    return cases

@router.get("/{case_id}", response_model=CaseInDB)
def get_case(
    case_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific case"""
    case = db.query(Case).filter(
        Case.id == case_id,
        Case.user_id == current_user.id
    ).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    return case

@router.put("/{case_id}", response_model=CaseInDB)
def update_case(
    case_id: int,
    case_update: CaseUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a case"""
    case = db.query(Case).filter(
        Case.id == case_id,
        Case.user_id == current_user.id
    ).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    update_data = case_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)
    
    case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(case)
    
    return case

@router.delete("/{case_id}")
def delete_case(
    case_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a case and its documents"""
    case = db.query(Case).filter(
        Case.id == case_id,
        Case.user_id == current_user.id
    ).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Delete associated files
    for document in case.documents:
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
    
    db.delete(case)
    db.commit()
    
    return {"message": "Case deleted successfully"}

@router.get("/{case_id}/documents/{document_id}/download")
def download_document(
    case_id: int,
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Download a document file"""
    # Verify case ownership
    case = db.query(Case).filter(
        Case.id == case_id,
        Case.user_id == current_user.id
    ).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Get document
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.case_id == case_id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    return FileResponse(
        path=document.file_path,
        filename=document.original_filename,
        media_type='application/octet-stream'
    )