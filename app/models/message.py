"""
Message Model for communication between users
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum
from datetime import datetime

class MessageType(enum.Enum):
    """Types of messages"""
    TEXT = "text"
    DOCUMENT = "document"
    SYSTEM = "system"
    NOTIFICATION = "notification"

class MessageStatus(enum.Enum):
    """Message status"""
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    ARCHIVED = "archived"

class MessagePriority(enum.Enum):
    """Message priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class Message(Base):
    """Message model for user communication"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    
    # Message content
    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), default=MessageType.TEXT, nullable=False)
    priority = Column(Enum(MessagePriority), default=MessagePriority.NORMAL, nullable=False)
    
    # Participants
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Case reference (optional)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    
    # Thread reference (optional)
    thread_id = Column(Integer, ForeignKey("message_threads.id"), nullable=True)
    
    # Message status
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT, nullable=False)
    is_internal = Column(Boolean, default=False)  # Internal messages between staff
    
    # Attachments
    attachment_path = Column(String(500), nullable=True)
    attachment_filename = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_messages")
    case = relationship("Case", back_populates="messages", overlaps="comments,status_history")
    thread = relationship("MessageThread", foreign_keys=[thread_id], back_populates="messages")

class MessageThread(Base):
    """Message thread for grouping related messages"""
    __tablename__ = "message_threads"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    
    # Participants
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Case reference
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    
    # Thread status
    is_active = Column(Boolean, default=True)
    is_closed = Column(Boolean, default=False)
    
    # Metadata
    last_message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    unread_count_user = Column(Integer, default=0)
    unread_count_staff = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    staff_member = relationship("User", foreign_keys=[staff_id])
    case = relationship("Case")
    last_message = relationship("Message", foreign_keys=[last_message_id])
    messages = relationship("Message", 
                          primaryjoin="MessageThread.id == foreign(Message.thread_id)",
                          order_by="Message.created_at")

# Add relationship to User model if needed
# This would be added to the User model:
# sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
# received_messages = relationship("Message", foreign_keys="Message.recipient_id", back_populates="recipient")

# Add relationship to Case model if needed
# This would be added to the Case model:
# messages = relationship("Message", back_populates="case")