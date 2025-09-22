from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.template import MessageTemplate
from app.api.v1.endpoints.auth import require_admin
from pydantic import BaseModel

router = APIRouter()

class TemplateIn(BaseModel):
    name: str
    subject: Optional[str] = None
    content: str
    category: str = "GENERAL"
    is_favorite: bool = False

class TemplateOut(BaseModel):
    id: int
    name: str
    subject: Optional[str]
    content: str
    category: str
    is_favorite: bool
    usage_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[TemplateOut])
async def list_templates(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    items = db.query(MessageTemplate).order_by(MessageTemplate.created_at.desc()).all()
    return items

@router.post("/", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(body: TemplateIn, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    item = MessageTemplate(
        name=body.name,
        subject=body.subject,
        content=body.content,
        category=body.category,
        is_favorite=body.is_favorite,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{template_id}", response_model=TemplateOut)
async def update_template(template_id: int, body: TemplateIn, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    item = db.query(MessageTemplate).filter(MessageTemplate.id == template_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Template not found")
    item.name = body.name
    item.subject = body.subject
    item.content = body.content
    item.category = body.category
    item.is_favorite = body.is_favorite
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    item = db.query(MessageTemplate).filter(MessageTemplate.id == template_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(item)
    db.commit()
    return None

@router.post("/{template_id}/use", response_model=TemplateOut)
async def mark_used(template_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    item = db.query(MessageTemplate).filter(MessageTemplate.id == template_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Template not found")
    item.usage_count = (item.usage_count or 0) + 1
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item 