from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.database import Base

class UserRole(enum.Enum):
    CLIENT = "client"
    OPERATOR = "operator"
    ADMIN = "admin"

class AuthProvider(enum.Enum):
    EMAIL = "email"
    PHONE = "phone"
    GOOGLE = "google"
    FACEBOOK = "facebook"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    company_name = Column(String, nullable=True)  # For legal entities
    hashed_password = Column(String, nullable=True)  # Optional for social login
    role = Column(Enum(UserRole), default=UserRole.CLIENT)
    auth_provider = Column(Enum(AuthProvider), default=AuthProvider.EMAIL)
    google_id = Column(String, unique=True, nullable=True)
    facebook_id = Column(String, unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationship to cases (only as owner, not operator)
    cases = relationship("Case", foreign_keys="Case.user_id", back_populates="user", cascade="all, delete-orphan")
    
    # Relationship to payments
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    
    # Relationship to notifications
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class VerificationCode(Base):
    __tablename__ = "verification_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    code = Column(String, index=True)
    code_type = Column(String)  # sms, email
    expires_at = Column(DateTime)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")