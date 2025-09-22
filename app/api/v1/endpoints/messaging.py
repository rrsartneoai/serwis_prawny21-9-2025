"""
Messaging API endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.models.message import MessageType, MessagePriority
from app.services.messaging_service import create_messaging_service
from datetime import datetime

router = APIRouter()

# Pydantic models for request/response
class SendMessageRequest(BaseModel):
    recipient_id: int
    subject: str
    content: str
    case_id: Optional[int] = None
    message_type: MessageType = MessageType.TEXT
    priority: MessagePriority = MessagePriority.NORMAL

class MessageResponse(BaseModel):
    id: int
    subject: str
    content: str
    message_type: str
    priority: str
    sender_id: int
    recipient_id: int
    case_id: Optional[int]
    status: str
    is_internal: bool
    attachment_filename: Optional[str]
    created_at: datetime
    read_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    partner_id: int
    partner_name: str
    partner_role: str
    last_message: Optional[dict]
    unread_count: int

class CaseUpdateRequest(BaseModel):
    update_type: str
    details: str

class BroadcastMessageRequest(BaseModel):
    recipient_role: str
    subject: str
    content: str
    priority: MessagePriority = MessagePriority.NORMAL

@router.post("/send", response_model=MessageResponse)
async def send_message(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to another user"""
    
    messaging_service = create_messaging_service(db)
    
    try:
        message = await messaging_service.send_message(
            sender_id=current_user.id,
            recipient_id=request.recipient_id,
            subject=request.subject,
            content=request.content,
            case_id=request.case_id,
            message_type=request.message_type,
            priority=request.priority
        )
        
        return MessageResponse.from_orm(message)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.post("/send-with-attachment")
async def send_message_with_attachment(
    recipient_id: int = Form(...),
    subject: str = Form(...),
    content: str = Form(...),
    case_id: Optional[int] = Form(None),
    message_type: MessageType = Form(MessageType.TEXT),
    priority: MessagePriority = Form(MessagePriority.NORMAL),
    attachment: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message with optional file attachment"""
    
    messaging_service = create_messaging_service(db)
    
    try:
        attachment_file = None
        attachment_filename = None
        
        if attachment:
            attachment_file = await attachment.read()
            attachment_filename = attachment.filename
        
        message = await messaging_service.send_message(
            sender_id=current_user.id,
            recipient_id=recipient_id,
            subject=subject,
            content=content,
            case_id=case_id,
            message_type=message_type,
            priority=priority,
            attachment_file=attachment_file,
            attachment_filename=attachment_filename
        )
        
        return MessageResponse.from_orm(message)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for current user"""
    
    messaging_service = create_messaging_service(db)
    conversations = await messaging_service.get_conversations(current_user.id)
    
    return [ConversationResponse(**conv) for conv in conversations]

@router.get("/conversation/{partner_id}", response_model=List[MessageResponse])
async def get_conversation_messages(
    partner_id: int,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages in conversation with specific user"""
    
    messaging_service = create_messaging_service(db)
    messages = await messaging_service.get_user_messages(
        user_id=current_user.id,
        conversation_with=partner_id,
        limit=limit,
        offset=offset
    )
    
    return [MessageResponse.from_orm(msg) for msg in messages]

@router.get("/case/{case_id}", response_model=List[MessageResponse])
async def get_case_messages(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all messages related to a specific case"""
    
    messaging_service = create_messaging_service(db)
    
    try:
        messages = await messaging_service.get_case_messages(case_id, current_user.id)
        return [MessageResponse.from_orm(msg) for msg in messages]
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/mark-read/{message_id}")
async def mark_message_as_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a message as read"""
    
    messaging_service = create_messaging_service(db)
    success = await messaging_service.mark_message_as_read(message_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"status": "success", "message": "Message marked as read"}

@router.post("/case-update/{case_id}")
async def send_case_update(
    case_id: int,
    request: CaseUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send case update message (staff only)"""
    
    if current_user.role not in [UserRole.ADMIN, UserRole.OPERATOR]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    messaging_service = create_messaging_service(db)
    
    try:
        message = await messaging_service.send_case_update_message(
            case_id=case_id,
            sender_id=current_user.id,
            update_type=request.update_type,
            details=request.details
        )
        
        return MessageResponse.from_orm(message)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/broadcast", response_model=List[MessageResponse])
async def send_broadcast_message(
    request: BroadcastMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send broadcast message to all users with specific role (admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        recipient_role = UserRole(request.recipient_role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recipient role")
    
    messaging_service = create_messaging_service(db)
    messages = await messaging_service.send_broadcast_message(
        sender_id=current_user.id,
        recipient_role=recipient_role,
        subject=request.subject,
        content=request.content,
        priority=request.priority
    )
    
    return [MessageResponse.from_orm(msg) for msg in messages]

@router.get("/admin/overview")
async def get_admin_message_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get message overview for admin dashboard"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    messaging_service = create_messaging_service(db)
    overview = await messaging_service.get_admin_message_overview()
    
    return overview

@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread messages for current user"""
    
    from app.models.message import Message, MessageStatus
    
    unread_count = db.query(Message).filter(
        Message.recipient_id == current_user.id,
        Message.status != MessageStatus.READ
    ).count()
    
    return {"unread_count": unread_count}

@router.get("/staff-users")
async def get_staff_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of staff users for messaging (client users only see staff)"""
    
    if current_user.role == UserRole.USER:
        # Regular users can only message staff
        staff_users = db.query(User).filter(
            User.role.in_([UserRole.ADMIN, UserRole.OPERATOR])
        ).all()
    else:
        # Staff can message anyone
        staff_users = db.query(User).filter(User.id != current_user.id).all()
    
    return [
        {
            "id": user.id,
            "name": f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email,
            "email": user.email,
            "role": user.role.value if user.role else "user"
        }
        for user in staff_users
    ]