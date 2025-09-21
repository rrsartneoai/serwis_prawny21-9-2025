from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.v1.endpoints.auth import get_verified_user
from app.models.user import User
from app.models.case import Case
from app.services.document_service import DocumentService
from app.schemas.document import DocumentUploadResponse, DocumentResponse, FileUploadLimits

router = APIRouter()

@router.post("/upload/{case_id}", response_model=DocumentUploadResponse)
async def upload_documents(
    case_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    """
    Upload documents for a specific case.
    
    - **case_id**: ID sprawy do której przypisać dokumenty
    - **files**: Lista plików do uploadu (max 10 plików, 50MB każdy)
    
    Dozwolone formaty: PDF, JPG, JPEG, PNG, DOC, DOCX
    """
    
    # Verify case belongs to user
    case = db.query(Case).filter(
        Case.id == case_id, 
        Case.user_id == current_user.id
    ).first()
    
    if not case:
        raise HTTPException(
            status_code=404, 
            detail="Sprawa nie została znaleziona lub nie masz do niej uprawnień"
        )
    
    # Initialize document service
    document_service = DocumentService(db)
    
    # Upload files
    documents, errors = document_service.upload_files(files, case_id)
    
    return DocumentUploadResponse(
        success=len(documents) > 0,
        message=f"Pomyślnie przesłano {len(documents)} plików" if documents else "Nie udało się przesłać żadnego pliku",
        documents=documents,
        errors=errors
    )

@router.get("/case/{case_id}", response_model=List[DocumentResponse])
async def get_case_documents(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    """
    Pobierz wszystkie dokumenty dla danej sprawy
    """
    
    # Verify case belongs to user or user is operator/admin
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Sprawa nie została znaleziona")
    
    # Check permissions
    if case.user_id != current_user.id and current_user.role not in ['OPERATOR', 'ADMIN']:
        raise HTTPException(
            status_code=403, 
            detail="Nie masz uprawnień do przeglądania dokumentów tej sprawy"
        )
    
    # Get documents
    document_service = DocumentService(db)
    return document_service.get_case_documents(case_id)

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    """
    Usuń dokument (dostępne tylko dla właściciela sprawy)
    """
    
    document_service = DocumentService(db)
    success = document_service.delete_document(document_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=404, 
            detail="Dokument nie został znaleziony lub nie masz uprawnień do jego usunięcia"
        )
    
    return {"message": "Dokument został usunięty"}

@router.get("/limits", response_model=FileUploadLimits)
async def get_upload_limits():
    """
    Pobierz limity dla uploadu plików
    """
    from app.core.config import MAX_FILE_SIZE_MB, MAX_FILES_PER_CASE, ALLOWED_FILE_TYPES
    return FileUploadLimits(
        max_file_size_mb=MAX_FILE_SIZE_MB,
        max_files_per_case=MAX_FILES_PER_CASE,
        allowed_file_types=ALLOWED_FILE_TYPES
    )