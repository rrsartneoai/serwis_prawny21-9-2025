import os
import shutil
import uuid
from typing import List, Tuple
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from pathlib import Path

from app.models.case import Document, Case
from app.core.config import MAX_FILE_SIZE_MB, MAX_FILES_PER_CASE, ALLOWED_FILE_TYPES
from app.schemas.document import DocumentCreate, DocumentType, DocumentResponse


class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        
    def get_document_type(self, filename: str) -> DocumentType:
        """Determine document type based on file extension"""
        ext = filename.lower().split('.')[-1]
        if ext == 'pdf':
            return DocumentType.PDF
        elif ext in ['jpg', 'jpeg', 'png']:
            return DocumentType.PHOTO
        elif ext in ['doc', 'docx']:
            return DocumentType.WORD
        else:
            return DocumentType.OTHER
    
    def get_file_size(self, file: UploadFile) -> int:
        """Get file size safely from UploadFile"""
        current_pos = file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()  # Get position (size)
        file.file.seek(0)  # Reset to beginning
        return file_size

    def validate_file(self, file: UploadFile, case_id: int) -> Tuple[bool, str]:
        """Validate uploaded file against limits and restrictions"""
        
        # Check if case exists
        case = self.db.query(Case).filter(Case.id == case_id).first()
        if not case:
            return False, f"Sprawa o ID {case_id} nie istnieje"
        
        # Check file size
        file_size = self.get_file_size(file)
        if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
            return False, f"Plik '{file.filename}' przekracza maksymalny rozmiar {MAX_FILE_SIZE_MB}MB"
        
        # Check file extension
        if '.' not in file.filename:
            return False, f"Plik '{file.filename}' nie ma rozszerzenia"
            
        ext = file.filename.lower().split('.')[-1]
        if ext not in ALLOWED_FILE_TYPES:
            return False, f"Nieprawidłowe rozszerzenie '{ext}'. Dozwolone: {', '.join(ALLOWED_FILE_TYPES)}"
        
        # Check number of files for this case
        existing_files = self.db.query(Document).filter(Document.case_id == case_id).count()
        if existing_files >= MAX_FILES_PER_CASE:
            return False, f"Osiągnięto maksymalną liczbę plików ({MAX_FILES_PER_CASE}) dla tej sprawy"
        
        return True, ""
    
    def save_file(self, file: UploadFile, case_id: int) -> str:
        """Save uploaded file to storage and return file path"""
        
        # Create directory structure: uploads/case_{case_id}/
        upload_dir = Path(f"uploads/case_{case_id}")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename to prevent conflicts
        ext = file.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4()}.{ext}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return str(file_path)
    
    def create_document_record(self, file: UploadFile, case_id: int, file_path: str) -> Document:
        """Create database record for uploaded document"""
        
        file_size = self.get_file_size(file)
        
        document = Document(
            case_id=case_id,
            filename=file.filename,
            content_type=file.content_type or 'application/octet-stream',
            size=file_size,
            file_path=file_path,
            document_type=self.get_document_type(file.filename),
            processing_status="uploaded"
        )
        
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        
        return document
    
    def upload_files(self, files: List[UploadFile], case_id: int) -> Tuple[List[DocumentResponse], List[str]]:
        """Upload multiple files for a case"""
        
        documents = []
        errors = []
        
        for file in files:
            try:
                # Validate file
                is_valid, error_msg = self.validate_file(file, case_id)
                if not is_valid:
                    errors.append(error_msg)
                    continue
                
                # Save file
                file_path = self.save_file(file, case_id)
                
                # Create database record
                document = self.create_document_record(file, case_id, file_path)
                
                # Convert to response model
                documents.append(DocumentResponse.model_validate(document, from_attributes=True))
                
            except Exception as e:
                errors.append(f"Błąd podczas uploadu '{file.filename}': {str(e)}")
        
        return documents, errors
    
    def get_case_documents(self, case_id: int) -> List[DocumentResponse]:
        """Get all documents for a case"""
        documents = self.db.query(Document).filter(Document.case_id == case_id).all()
        return [DocumentResponse.model_validate(doc, from_attributes=True) for doc in documents]
    
    def delete_document(self, document_id: int, user_id: int) -> bool:
        """Delete a document (file and database record)"""
        
        document = self.db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return False
            
        # Check if user owns the case
        case = self.db.query(Case).filter(
            Case.id == document.case_id, 
            Case.created_by_user_id == user_id
        ).first()
        if not case:
            return False
        
        # Delete physical file
        try:
            if os.path.exists(document.file_path):
                os.remove(document.file_path)
        except Exception as e:
            print(f"Warning: Could not delete file {document.file_path}: {e}")
        
        # Delete database record
        self.db.delete(document)
        self.db.commit()
        
        return True