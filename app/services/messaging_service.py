"""
Messaging Service for communication between users
"""

import os
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from pathlib import Path

from app.models.message import Message, MessageThread, MessageType, MessageStatus, MessagePriority
from app.models.user import User, UserRole
from app.models.case import Case
from app.services.notification_service import notification_service
from app.services.email_service import email_service

logger = logging.getLogger(__name__)

class MessagingService:
    """Service for managing user communications"""
    
    def __init__(self, db: Session):
        self.db = db
        self.attachments_dir = Path("uploads/message_attachments")
        self.attachments_dir.mkdir(parents=True, exist_ok=True)
    
    async def send_message(
        self,
        sender_id: int,
        recipient_id: int,
        subject: str,
        content: str,
        case_id: Optional[int] = None,
        message_type: MessageType = MessageType.TEXT,
        priority: MessagePriority = MessagePriority.NORMAL,
        attachment_file: Optional[bytes] = None,
        attachment_filename: Optional[str] = None
    ) -> Message:
        """Send a message between users"""
        
        try:
            # Validate users exist
            sender = self.db.query(User).filter(User.id == sender_id).first()
            recipient = self.db.query(User).filter(User.id == recipient_id).first()
            
            if not sender or not recipient:
                raise ValueError("Sender or recipient not found")
            
            # Validate case if provided
            case = None
            if case_id:
                case = self.db.query(Case).filter(Case.id == case_id).first()
                if not case:
                    raise ValueError("Case not found")
            
            # Handle attachment if provided
            attachment_path = None
            if attachment_file and attachment_filename:
                attachment_path = await self._save_attachment(attachment_file, attachment_filename)
            
            # Create message
            message = Message(
                sender_id=sender_id,
                recipient_id=recipient_id,
                subject=subject,
                content=content,
                case_id=case_id,
                message_type=message_type,
                priority=priority,
                attachment_path=str(attachment_path) if attachment_path else None,
                attachment_filename=attachment_filename,
                status=MessageStatus.SENT,
                is_internal=self._is_internal_message(sender, recipient)
            )
            
            self.db.add(message)
            self.db.commit()
            self.db.refresh(message)
            
            # Send notifications
            await self._send_message_notifications(message)
            
            # Update message thread if exists
            await self._update_message_thread(message)
            
            logger.info(f"Message sent from user {sender_id} to user {recipient_id}")
            return message
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error sending message: {e}")
            raise
    
    async def get_user_messages(
        self,
        user_id: int,
        conversation_with: Optional[int] = None,
        case_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Message]:
        """Get messages for a user"""
        
        query = self.db.query(Message).filter(
            or_(Message.sender_id == user_id, Message.recipient_id == user_id)
        )
        
        if conversation_with:
            query = query.filter(
                or_(
                    and_(Message.sender_id == user_id, Message.recipient_id == conversation_with),
                    and_(Message.sender_id == conversation_with, Message.recipient_id == user_id)
                )
            )
        
        if case_id:
            query = query.filter(Message.case_id == case_id)
        
        messages = query.order_by(desc(Message.created_at)).offset(offset).limit(limit).all()
        
        # Mark messages as delivered if recipient is requesting
        for message in messages:
            if message.recipient_id == user_id and message.status == MessageStatus.SENT:
                message.status = MessageStatus.DELIVERED
                message.delivered_at = datetime.utcnow()
        
        self.db.commit()
        return messages
    
    async def mark_message_as_read(self, message_id: int, user_id: int) -> bool:
        """Mark a message as read"""
        
        message = self.db.query(Message).filter(
            Message.id == message_id,
            Message.recipient_id == user_id
        ).first()
        
        if not message:
            return False
        
        if message.status != MessageStatus.READ:
            message.status = MessageStatus.READ
            message.read_at = datetime.utcnow()
            self.db.commit()
        
        return True
    
    async def get_conversations(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all conversations for a user"""
        
        # Get unique conversation partners
        sent_to = self.db.query(Message.recipient_id).filter(Message.sender_id == user_id).distinct().subquery()
        received_from = self.db.query(Message.sender_id).filter(Message.recipient_id == user_id).distinct().subquery()
        
        # Get conversation partners
        conversations = []
        
        # Partners user sent messages to
        partners_sent = self.db.query(User).filter(User.id.in_(sent_to)).all()
        # Partners user received messages from
        partners_received = self.db.query(User).filter(User.id.in_(received_from)).all()
        
        all_partners = {p.id: p for p in partners_sent + partners_received}
        
        for partner_id, partner in all_partners.items():
            # Get last message in conversation
            last_message = self.db.query(Message).filter(
                or_(
                    and_(Message.sender_id == user_id, Message.recipient_id == partner_id),
                    and_(Message.sender_id == partner_id, Message.recipient_id == user_id)
                )
            ).order_by(desc(Message.created_at)).first()
            
            # Count unread messages
            unread_count = self.db.query(Message).filter(
                Message.sender_id == partner_id,
                Message.recipient_id == user_id,
                Message.status != MessageStatus.READ
            ).count()
            
            conversations.append({
                "partner_id": partner_id,
                "partner_name": f"{partner.first_name or ''} {partner.last_name or ''}".strip() or partner.email,
                "partner_role": partner.role.value if partner.role else "user",
                "last_message": {
                    "id": last_message.id,
                    "subject": last_message.subject,
                    "content": last_message.content[:100] + "..." if len(last_message.content) > 100 else last_message.content,
                    "created_at": last_message.created_at,
                    "sender_id": last_message.sender_id,
                    "case_id": last_message.case_id
                } if last_message else None,
                "unread_count": unread_count
            })
        
        # Sort by last message date
        conversations.sort(key=lambda x: x["last_message"]["created_at"] if x["last_message"] else datetime.min, reverse=True)
        
        return conversations
    
    async def get_case_messages(self, case_id: int, user_id: int) -> List[Message]:
        """Get all messages related to a specific case"""
        
        # Verify user has access to this case
        case = self.db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise ValueError("Case not found")
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Check access rights
        has_access = (
            case.user_id == user_id or  # Case owner
            user.role in [UserRole.ADMIN, UserRole.OPERATOR]  # Staff
        )
        
        if not has_access:
            raise ValueError("Access denied to case messages")
        
        messages = self.db.query(Message).filter(
            Message.case_id == case_id
        ).order_by(Message.created_at).all()
        
        return messages
    
    async def send_case_update_message(
        self,
        case_id: int,
        sender_id: int,
        update_type: str,
        details: str
    ) -> Message:
        """Send automated case update message"""
        
        case = self.db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise ValueError("Case not found")
        
        subject = f"Aktualizacja sprawy: {case.title}"
        content = f"""
Aktualizacja sprawy #{case_id}: {case.title}

Typ aktualizacji: {update_type}

Szczegóły:
{details}

Data aktualizacji: {datetime.now().strftime('%d.%m.%Y %H:%M')}
        """.strip()
        
        return await self.send_message(
            sender_id=sender_id,
            recipient_id=case.user_id,
            subject=subject,
            content=content,
            case_id=case_id,
            message_type=MessageType.SYSTEM,
            priority=MessagePriority.NORMAL
        )
    
    async def send_broadcast_message(
        self,
        sender_id: int,
        recipient_role: UserRole,
        subject: str,
        content: str,
        priority: MessagePriority = MessagePriority.NORMAL
    ) -> List[Message]:
        """Send message to all users with specific role"""
        
        recipients = self.db.query(User).filter(User.role == recipient_role).all()
        messages = []
        
        for recipient in recipients:
            if recipient.id != sender_id:  # Don't send to self
                message = await self.send_message(
                    sender_id=sender_id,
                    recipient_id=recipient.id,
                    subject=subject,
                    content=content,
                    message_type=MessageType.SYSTEM,
                    priority=priority
                )
                messages.append(message)
        
        return messages
    
    def _is_internal_message(self, sender: User, recipient: User) -> bool:
        """Check if message is internal (between staff members)"""
        staff_roles = [UserRole.ADMIN, UserRole.OPERATOR]
        return sender.role in staff_roles and recipient.role in staff_roles
    
    async def _save_attachment(self, file_content: bytes, filename: str) -> Path:
        """Save message attachment"""
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = "".join(c for c in filename if c.isalnum() or c in "._-")
        unique_filename = f"{timestamp}_{safe_filename}"
        
        file_path = self.attachments_dir / unique_filename
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        return file_path
    
    async def _send_message_notifications(self, message: Message):
        """Send notifications about new message"""
        
        try:
            recipient = self.db.query(User).filter(User.id == message.recipient_id).first()
            sender = self.db.query(User).filter(User.id == message.sender_id).first()
            
            if not recipient or not sender:
                return
            
            # Create in-app notification
            await notification_service.create_notification(
                user_id=recipient.id,
                title="Nowa wiadomość",
                message=f"Otrzymałeś nową wiadomość od {sender.first_name or sender.email}",
                category="message",
                related_id=message.id
            )
            
            # Send email notification if enabled
            if message.priority in [MessagePriority.HIGH, MessagePriority.URGENT]:
                await email_service.send_message_notification(recipient.email, message)
                
        except Exception as e:
            logger.error(f"Error sending message notifications: {e}")
    
    async def _update_message_thread(self, message: Message):
        """Update or create message thread"""
        
        # This would be implemented if using threaded conversations
        # For now, we'll keep simple message list approach
        pass
    
    async def get_admin_message_overview(self) -> Dict[str, Any]:
        """Get message overview for admin dashboard"""
        
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timedelta(days=7)
        
        # Total messages
        total_messages = self.db.query(Message).count()
        
        # Messages today
        messages_today = self.db.query(Message).filter(
            Message.created_at >= today
        ).count()
        
        # Messages this week
        messages_week = self.db.query(Message).filter(
            Message.created_at >= week_ago
        ).count()
        
        # Unread messages by priority
        urgent_unread = self.db.query(Message).filter(
            Message.priority == MessagePriority.URGENT,
            Message.status != MessageStatus.READ
        ).count()
        
        high_unread = self.db.query(Message).filter(
            Message.priority == MessagePriority.HIGH,
            Message.status != MessageStatus.READ
        ).count()
        
        # Messages by role
        staff_roles = [UserRole.ADMIN, UserRole.OPERATOR]
        internal_messages = self.db.query(Message).join(
            User, Message.sender_id == User.id
        ).filter(User.role.in_(staff_roles)).count()
        
        client_messages = self.db.query(Message).join(
            User, Message.sender_id == User.id
        ).filter(User.role == UserRole.USER).count()
        
        return {
            "total_messages": total_messages,
            "messages_today": messages_today,
            "messages_week": messages_week,
            "urgent_unread": urgent_unread,
            "high_unread": high_unread,
            "internal_messages": internal_messages,
            "client_messages": client_messages
        }

def create_messaging_service(db: Session) -> MessagingService:
    """Factory function for creating messaging service"""
    return MessagingService(db)