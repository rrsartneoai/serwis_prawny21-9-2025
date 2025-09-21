from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    client_notes = Column(Text, nullable=True)
    status = Column(String, default="new")  # new, processing, completed, cancelled
    package_type = Column(String, nullable=True)  # basic, standard, premium
    package_price = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign key to user
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="cases")
    
    # Relationship to documents
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    original_filename = Column(String)
    file_type = Column(String)  # pdf, image
    file_size = Column(Integer)
    file_path = Column(String)  # Path where file is stored
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Foreign key to case
    case_id = Column(Integer, ForeignKey("cases.id"))
    case = relationship("Case", back_populates="documents")