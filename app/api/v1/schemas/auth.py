from pydantic import BaseModel, EmailStr, field_validator, model_validator
from pydantic_core.core_schema import FieldValidationInfo
from typing import Optional, Self
from app.models.user import UserRole, AuthProvider

class UserRegistration(BaseModel):
    """User registration schema"""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    auth_provider: AuthProvider = AuthProvider.EMAIL
    
    @model_validator(mode='after')
    def validate_contact_info(self) -> Self:
        """At least one contact method must be provided"""
        if not self.email and not self.phone:
            raise ValueError('Either email or phone must be provided')
        return self
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: Optional[str], info: FieldValidationInfo) -> Optional[str]:
        """Password validation"""
        if v and len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserLogin(BaseModel):
    """User login schema"""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str
    
    @model_validator(mode='after')
    def validate_contact_info(self) -> Self:
        """Either email or phone must be provided"""
        if not self.email and not self.phone:
            raise ValueError('Either email or phone must be provided')
        return self

class PhoneLogin(BaseModel):
    """Phone-based login request"""
    phone: str

class EmailLogin(BaseModel):
    """Email-based login request"""
    email: EmailStr

class VerificationRequest(BaseModel):
    """Verification code request"""
    user_id: int
    code: str
    code_type: str  # "sms" or "email"

class GoogleAuthCallback(BaseModel):
    """Google OAuth callback"""
    code: str
    state: Optional[str] = None

class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: int

class UserResponse(BaseModel):
    """User response schema"""
    id: int
    email: Optional[str]
    phone: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    company_name: Optional[str]
    role: UserRole
    auth_provider: AuthProvider
    is_verified: bool
    is_active: bool
    
    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    """Authentication response"""
    user: UserResponse
    access_token: str
    token_type: str = "bearer"
    requires_verification: bool = False
    verification_sent_to: Optional[str] = None

class VerificationResponse(BaseModel):
    """Verification response"""
    success: bool
    message: str
    access_token: Optional[str] = None

class AuthUrlResponse(BaseModel):
    """OAuth URL response"""
    auth_url: str
    state: Optional[str] = None