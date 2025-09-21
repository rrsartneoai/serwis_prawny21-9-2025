from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.db.database import get_db
from app.models.notification import Notification, NotificationStatus, NotificationType, NotificationTemplateType
from app.models.user import User, UserRole
from app.api.v1.endpoints.auth import get_verified_user
from app.services.notification_service import notification_service

router = APIRouter()

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    case_id: Optional[int]
    type: NotificationType
    template: NotificationTemplateType
    subject: Optional[str]
    content: str
    recipient_phone: Optional[str]
    recipient_email: Optional[str]
    status: NotificationStatus
    external_id: Optional[str]
    error_message: Optional[str]
    created_at: str
    sent_at: Optional[str]
    read_at: Optional[str]
    
    class Config:
        from_attributes = True

class MarkAsReadRequest(BaseModel):
    notification_id: int

@router.get("/", response_model=List[NotificationResponse])
async def get_user_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db)
):
    """Get notifications for current user"""
    notifications = notification_service.get_user_notifications(
        db, current_user.id, limit, unread_only
    )
    return notifications

@router.post("/mark-read")
async def mark_notification_as_read(
    request: MarkAsReadRequest,
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    success = notification_service.mark_as_read(
        db, request.notification_id, current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification marked as read"}

@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read_at.is_(None)
    ).count()
    
    return {"unread_count": count}

# Operator endpoints
async def require_operator(current_user: User = Depends(get_verified_user)):
    if current_user.role != UserRole.OPERATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator access required"
        )
    return current_user

class SendNotificationRequest(BaseModel):
    case_id: int
    type: NotificationType
    template: NotificationTemplateType
    variables: Optional[dict] = None

@router.post("/operator/send")
async def send_operator_notification(
    request: SendNotificationRequest,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    """Send notification to case client (operator only)"""
    from app.models.case import Case
    
    case = db.query(Case).filter(Case.id == request.case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    notification = notification_service.send_notification(
        db, case.user_id, request.type, request.template, case, request.variables
    )
    
    return {"message": "Notification sent", "notification_id": notification.id}

@router.get("/operator/recent", response_model=List[NotificationResponse])
async def get_recent_notifications(
    limit: int = 100,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    """Get recent notifications for all users (operator only)"""
    notifications = db.query(Notification).order_by(
        Notification.created_at.desc()
    ).limit(limit).all()
    
    return notifications

@router.get("/operator/failed", response_model=List[NotificationResponse])
async def get_failed_notifications(
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    """Get failed notifications for troubleshooting (operator only)"""
    notifications = db.query(Notification).filter(
        Notification.status == NotificationStatus.FAILED
    ).order_by(Notification.created_at.desc()).limit(50).all()
    
    return notifications