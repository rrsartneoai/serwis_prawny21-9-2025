from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.database import Base

class NotificationType(enum.Enum):
    SMS = "sms"
    EMAIL = "email"
    PUSH = "push"
    IN_APP = "in_app"

class NotificationStatus(enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    READ = "read"

class NotificationTemplateType(enum.Enum):
    PAYMENT_RECEIVED = "payment_received"
    ANALYSIS_STARTED = "analysis_started"
    ANALYSIS_READY = "analysis_ready"
    DOCUMENTS_READY = "documents_ready"
    UNCLEAR_SCANS = "unclear_scans"
    CASE_COMPLETED = "case_completed"
    VERIFICATION_CODE = "verification_code"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to user
    user_id = Column(Integer, ForeignKey("users.id"))
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    
    # Notification details
    type = Column(Enum(NotificationType))
    template = Column(Enum(NotificationTemplateType))
    subject = Column(String, nullable=True)
    content = Column(Text)
    
    # Recipient info
    recipient_phone = Column(String, nullable=True)  # For SMS
    recipient_email = Column(String, nullable=True)  # For Email
    
    # Status
    status = Column(Enum(NotificationStatus), default=NotificationStatus.PENDING)
    
    # External provider data
    external_id = Column(String, nullable=True)  # Provider message ID
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    case = relationship("Case", back_populates="notifications")


class NotificationTemplate(Base):
    __tablename__ = "notification_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    type = Column(Enum(NotificationType))
    
    # Template content
    subject_template = Column(String, nullable=True)  # For email
    content_template = Column(Text)
    
    # Variables that can be used in template
    available_variables = Column(Text, nullable=True)  # JSON array
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MessageTemplate(Base):
    __tablename__ = "message_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)  # e.g., "unclear_scans", "missing_info"
    category = Column(String)  # operator_to_client, system_to_client
    
    # Template content (Polish)
    subject = Column(String, nullable=True)
    content = Column(Text)
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = relationship("User")