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
from app.api.v1.schemas.case import CaseCreate, CaseInDB, CaseUpdate, CaseClientUpdate, DocumentInDB
from app.api.v1.endpoints.auth import get_verified_user

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=CaseInDB, status_code=status.HTTP_201_CREATED)
async def create_case(
    title: str = Form(...),
    description: str = Form(None),
    client_notes: str = Form(None),
    client_context: str = Form(None),
    client_agreement: str = Form(None),
    package_type: str = Form(None),
    package_price: float = Form(None),
    files: List[UploadFile] = File([]),
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db)
):
    """Create a new case with optional file uploads"""
    
    # Check file count limit before processing
    if len(files) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 files allowed per case"
        )
    
    # Prepare all data and validate files before any database operations
    uploaded_files_to_cleanup = []
    validated_files = []
    
    try:
        # Pre-validate all files first
        for file in files:
            if file.filename:
                # Read file contents first to get actual size
                contents = await file.read()
                file_size = len(contents)
                
                if file_size == 0:
                    continue  # Skip empty files
                
                # Validate file type by content-type and extension
                allowed_types = [
                    'application/pdf', 
                    'image/jpeg', 
                    'image/png',
                    'application/msword',  # .doc
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'  # .docx
                ]
                allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
                
                file_extension = os.path.splitext(file.filename)[1].lower()
                
                if file.content_type not in allowed_types or file_extension not in allowed_extensions:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"File type not allowed. Allowed types: PDF, DOC, DOCX, JPG, PNG"
                    )
                
                # Validate file size (10MB max)
                if file_size > 10 * 1024 * 1024:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"File {file.filename} is too large. Maximum size is 10MB"
                    )
                
                validated_files.append({
                    'contents': contents,
                    'filename': file.filename,
                    'content_type': file.content_type,
                    'size': file_size,
                    'extension': file_extension
                })
        
        # Convert string package_type to enum
        from app.models.case import PackageType, CaseStatus
        package_enum = None
        if package_type:
            package_type_lower = package_type.lower()
            if package_type_lower == "basic":
                package_enum = PackageType.BASIC
            elif package_type_lower == "standard":
                package_enum = PackageType.STANDARD
            elif package_type_lower == "premium":
                package_enum = PackageType.PREMIUM
            elif package_type_lower == "express":
                package_enum = PackageType.EXPRESS
            else:
                package_enum = PackageType.STANDARD  # default

        # Now create case and handle file uploads in single transaction
        db_case = Case(
            title=title,
            description=description,
            client_notes=client_notes,
            client_context=client_context,
            client_agreement=client_agreement,
            package_type=package_enum,
            package_price=package_price,
            user_id=current_user.id,
            status=CaseStatus.NEW
        )
        db.add(db_case)
        db.flush()  # Get case ID without committing
        
        # Process validated files
        for file_data in validated_files:
            # Generate unique filename
            unique_filename = f"{uuid.uuid4()}{file_data['extension']}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            
            # Save file to disk
            with open(file_path, "wb") as f:
                f.write(file_data['contents'])
            uploaded_files_to_cleanup.append(file_path)
            
            # Create document record
            if file_data['content_type'] == "application/pdf":
                file_type = "pdf"
            elif file_data['content_type'] in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                file_type = "doc"
            else:
                file_type = "image"
            db_document = Document(
                filename=unique_filename,
                original_filename=file_data['filename'],
                file_type=file_type,
                file_size=file_data['size'],
                file_path=file_path,
                case_id=db_case.id
            )
            db.add(db_document)
        
        # Only commit if everything succeeded
        db.commit()
        
        # Refresh case with documents
        db.refresh(db_case)
        
        return db_case
    
    except Exception as e:
        # Cleanup uploaded files on any error
        for file_path in uploaded_files_to_cleanup:
            if os.path.exists(file_path):
                os.remove(file_path)
        
        # Rollback all database changes
        db.rollback()
        raise e

@router.get("", response_model=List[CaseInDB])
def get_user_cases(
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db)
):
    """Get all cases for the current user"""
    cases = db.query(Case).filter(Case.user_id == current_user.id).all()
    return cases

@router.get("/{case_id}", response_model=CaseInDB)
def get_case(
    case_id: int,
    current_user: User = Depends(get_verified_user),
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
    current_user: User = Depends(get_verified_user),
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
    current_user: User = Depends(get_verified_user),
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
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db)
):
    """Download a document file"""
    from app.models.user import UserRole
    
    # Check if user owns the case OR is an operator
    case = db.query(Case).filter(Case.id == case_id).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Allow access for case owner or operator
    if case.user_id != current_user.id and current_user.role != UserRole.OPERATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
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