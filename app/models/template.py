from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime
from app.db.database import Base

class MessageTemplate(Base):
    __tablename__ = "message_templates"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=False, default="GENERAL")
    is_favorite = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)