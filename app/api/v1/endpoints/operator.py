from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.models.case import Case, Analysis, LegalDocument, CaseStatus
from app.models.user import User, UserRole
from app.api.v1.endpoints.auth import get_current_user, get_verified_user
from app.services.ai_document_analysis_service import create_ai_document_service

router = APIRouter()

# Pydantic schemas for operator operations
class AnalysisCreate(BaseModel):
    case_id: int
    content: str
    summary: Optional[str] = None
    recommendations: Optional[str] = None
    possible_actions: Optional[str] = None
    confidence_score: Optional[float] = None

class AnalysisResponse(BaseModel):
    id: int
    case_id: int
    content: str
    summary: Optional[str]
    recommendations: Optional[str]
    possible_actions: Optional[str]
    confidence_score: Optional[float]
    is_preview: bool
    created_at: datetime
    updated_at: datetime
    operator_id: Optional[int]
    
    class Config:
        from_attributes = True

class LegalDocumentCreate(BaseModel):
    case_id: int
    document_name: str
    document_type: str
    content: str
    price: float
    instructions: Optional[str] = None

class LegalDocumentResponse(BaseModel):
    id: int
    case_id: int
    document_name: str
    document_type: str
    content: str
    price: float
    is_purchased: bool
    is_preview: bool
    instructions: Optional[str]
    created_at: datetime
    purchased_at: Optional[datetime]
    operator_id: Optional[int]
    
    class Config:
        from_attributes = True

class CaseUpdateStatus(BaseModel):
    status: CaseStatus
    operator_id: Optional[int] = None

class OperatorCaseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    client_notes: Optional[str]
    status: CaseStatus
    package_type: Optional[str] 
    package_price: Optional[float]
    created_at: datetime
    updated_at: datetime
    deadline: Optional[datetime]
    user_id: int
    operator_id: Optional[int]
    
    # Client info
    client_name: Optional[str]
    client_email: Optional[str]
    client_phone: Optional[str]
    
    # Related data
    documents: List[dict]
    analysis: Optional[AnalysisResponse]
    legal_documents: List[LegalDocumentResponse]
    
    class Config:
        from_attributes = True

# Check if user is operator - doesn't require email verification
async def require_operator(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.OPERATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator access required"
        )
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    return current_user

@router.get("/cases", response_model=List[OperatorCaseResponse])
async def get_operator_cases(
    status_filter: Optional[CaseStatus] = None,
    operator_id: Optional[int] = None,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    """Get all cases for operator dashboard"""
    query = db.query(Case)
    
    if status_filter:
        query = query.filter(Case.status == status_filter)
    
    if operator_id:
        query = query.filter(Case.operator_id == operator_id)
    
    # Show cases that need operator attention
    cases = query.filter(
        Case.status.in_([
            CaseStatus.NEW,
            CaseStatus.AWAITING_PAYMENT,
            CaseStatus.PAID, 
            CaseStatus.PROCESSING, 
            CaseStatus.ANALYSIS_READY,
            CaseStatus.DOCUMENTS_READY
        ])
    ).all()
    
    # Transform cases to include client info
    result = []
    for case in cases:
        client = case.user
        case_dict = {
            **case.__dict__,
            "client_name": f"{client.first_name or ''} {client.last_name or ''}".strip() or client.email,
            "client_email": client.email,
            "client_phone": client.phone,
            "documents": [
                {
                    "id": doc.id,
                    "filename": doc.filename,
                    "original_filename": doc.original_filename,
                    "file_type": doc.file_type,
                    "file_size": doc.file_size,
                    "uploaded_at": doc.uploaded_at
                } 
                for doc in case.documents
            ],
            "analysis": case.analysis,
            "legal_documents": case.legal_documents or []
        }
        result.append(OperatorCaseResponse(**case_dict))
    
    return result

@router.get("/cases/{case_id}", response_model=OperatorCaseResponse)
async def get_operator_case(
    case_id: int,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    """Get specific case details for operator"""
    case = db.query(Case).filter(Case.id == case_id).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    client = case.user
    case_dict = {
        **case.__dict__,
        "client_name": f"{client.first_name or ''} {client.last_name or ''}".strip() or client.email,
        "client_email": client.email,
        "client_phone": client.phone,
        "documents": [
            {
                "id": doc.id,
                "filename": doc.filename,
                "original_filename": doc.original_filename,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "uploaded_at": doc.uploaded_at
            } 
            for doc in case.documents
        ],
        "analysis": case.analysis,
        "legal_documents": case.legal_documents or []
    }
    
    return OperatorCaseResponse(**case_dict)

@router.post("/cases/{case_id}/analysis", response_model=AnalysisResponse)
async def create_analysis(
    case_id: int,
    analysis_data: AnalysisCreate,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    """Create analysis for a case"""
    case = db.query(Case).filter(Case.id == case_id).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Check if analysis already exists
    existing_analysis = db.query(Analysis).filter(Analysis.case_id == case_id).first()
    if existing_analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Analysis already exists for this case"
        )
    
    # Create analysis
    analysis = Analysis(
        case_id=case_id,
        content=analysis_data.content,
        summary=analysis_data.summary,
        recommendations=analysis_data.recommendations,
        possible_actions=analysis_data.possible_actions,
        confidence_score=analysis_data.confidence_score,
        is_preview=False,
        operator_id=current_user.id
    )
    
    db.add(analysis)
    
    # Update case status
    case.status = CaseStatus.ANALYSIS_READY
    case.operator_id = current_user.id
    case.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(analysis)
    
    # Send notification to client about analysis ready
    from app.services.notification_service import notification_service
    notification_service.send_analysis_ready(db, case)
    
    return analysis

@router.post("/cases/{case_id}/legal-documents", response_model=LegalDocumentResponse)
async def create_legal_document(
    case_id: int,
    document_data: LegalDocumentCreate,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    """Create legal document for a case"""
    case = db.query(Case).filter(Case.id == case_id).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Create legal document
    legal_doc = LegalDocument(
        case_id=case_id,
        document_name=document_data.document_name,
        document_type=document_data.document_type,
        content=document_data.content,
        price=document_data.price,
        is_purchased=False,
        is_preview=True,
        instructions=document_data.instructions,
        operator_id=current_user.id
    )
    
    db.add(legal_doc)
    
    # Update case status
    case.status = CaseStatus.DOCUMENTS_READY
    case.operator_id = current_user.id
    case.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(legal_doc)
    
    # Send notification to client about documents ready
    from app.services.notification_service import notification_service
    notification_service.send_documents_ready(db, case)
    
    return legal_doc

@router.put("/cases/{case_id}/status", response_model=dict)
async def update_case_status(
    case_id: int,
    status_data: CaseUpdateStatus,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    """Update case status"""
    case = db.query(Case).filter(Case.id == case_id).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    case.status = status_data.status
    if status_data.operator_id:
        case.operator_id = status_data.operator_id
    case.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Case status updated successfully", "status": case.status}

@router.post("/cases/{case_id}/assign", response_model=dict)
async def assign_case_to_operator(
    case_id: int,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    """Assign case to current operator"""
    case = db.query(Case).filter(Case.id == case_id).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    case.operator_id = current_user.id
    case.status = CaseStatus.PROCESSING
    case.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Case assigned successfully"}

@router.post("/cases/{case_id}/messages", response_model=dict)
async def send_client_message(
    case_id: int,
    message_content: str,
    template_id: Optional[str] = None,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    """Send message to client (placeholder for notification system)"""
    case = db.query(Case).filter(Case.id == case_id).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # TODO: Implement actual notification system (SMS/Email)
    # For now, just log the message
    print(f"Message to case {case_id} client: {message_content}")
    
    return {
        "message": "Message sent successfully",
        "case_id": case_id,
        "sent_at": datetime.utcnow().isoformat()
    }


@router.post("/cases/{case_id}/analyze-ai", response_model=AnalysisResponse)  
def trigger_ai_analysis(
    case_id: int,
    operator: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    """Automatycznie wygeneruj analizę dokumentów sprawy za pomocą AI"""
    
    # Sprawdź czy sprawa istnieje
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Stwórz service AI i wygeneruj analizę
    ai_service = create_ai_document_service(db)
    
    try:
        # Service method is synchronous, don't await
        analysis = ai_service.analyze_case_documents(case_id, operator.id)
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to generate analysis - no documents found or processing failed"
            )
        
        return analysis
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI analysis: {str(e)}"
        )


@router.get("/cases/{case_id}/documents-summary")
def get_case_documents_summary(
    case_id: int,
    operator: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    """Pobierz podsumowanie dokumentów sprawy"""
    
    # Sprawdź czy sprawa istnieje
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    ai_service = create_ai_document_service(db)
    summary = ai_service.get_case_documents_summary(case_id)
    
    return {
        "case_id": case_id,
        "summary": summary,
        "generated_at": datetime.utcnow().isoformat()
    }