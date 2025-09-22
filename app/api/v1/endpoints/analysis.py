from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.services.ai_document_analysis_service import AIDocumentAnalysisService
from app.models.case import Case

router = APIRouter()

class RAGRequest(BaseModel):
    case_id: Optional[int] = None
    query: Optional[str] = None

@router.post("/rag", response_model=Dict[str, Any])
async def run_rag(request: RAGRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    service = AIDocumentAnalysisService(db)

    # If case_id provided, analyze documents for that case
    if request.case_id:
        analysis = service.analyze_case_documents(request.case_id, operator_id=current_user.id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Case or documents not found")
        return {
            "content": analysis.content,
            "summary": analysis.summary,
            "recommendations": analysis.recommendations,
            "possible_actions": analysis.possible_actions,
            "confidence_score": float(analysis.confidence_score or 0),
        }

    # Otherwise, if query text provided, generate an on-the-fly analysis
    if request.query:
        dummy_case = Case(id=0, title="Ad-hoc analiza", description=request.query)
        result = service.generate_legal_analysis(dummy_case, request.query)
        return result

    raise HTTPException(status_code=400, detail="Provide case_id or query") 