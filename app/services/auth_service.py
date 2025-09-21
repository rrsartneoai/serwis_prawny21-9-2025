import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import httpx
import random

from app.models.user import User, UserRole, AuthProvider, VerificationCode
from app.db.database import get_db

# Configuration from environment
import os
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "development-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def generate_verification_code() -> str:
        """Generate 6-digit verification code"""
        return ''.join(random.choices(string.digits, k=6))
    
    @staticmethod
    def create_user(
        db: Session, 
        email: Optional[str] = None,
        phone: Optional[str] = None,
        password: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        company_name: Optional[str] = None,
        auth_provider: AuthProvider = AuthProvider.EMAIL,
        google_id: Optional[str] = None,
        facebook_id: Optional[str] = None,
        role: UserRole = UserRole.CLIENT
    ) -> User:
        """Create new user"""
        hashed_password = None
        if password:
            hashed_password = AuthService.get_password_hash(password)
            
        user = User(
            email=email,
            phone=phone,
            first_name=first_name,
            last_name=last_name,
            company_name=company_name,
            hashed_password=hashed_password,
            auth_provider=auth_provider,
            google_id=google_id,
            facebook_id=facebook_id,
            role=role,
            is_active=True,
            is_verified=False
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = db.query(User).filter(User.email == email).first()
        if not user or not user.hashed_password:
            return None
        if not AuthService.verify_password(password, user.hashed_password):
            return None
        return user
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_phone(db: Session, phone: str) -> Optional[User]:
        """Get user by phone"""
        return db.query(User).filter(User.phone == phone).first()
    
    @staticmethod
    def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
        """Get user by Google ID"""
        return db.query(User).filter(User.google_id == google_id).first()
    
    @staticmethod
    def create_verification_code(
        db: Session, 
        user_id: int, 
        code_type: str,
        expires_minutes: int = 10
    ) -> VerificationCode:
        """Create verification code"""
        # Deactivate existing codes
        db.query(VerificationCode).filter(
            VerificationCode.user_id == user_id,
            VerificationCode.code_type == code_type,
            VerificationCode.is_used == False
        ).update({"is_used": True})
        
        code = AuthService.generate_verification_code()
        expires_at = datetime.utcnow() + timedelta(minutes=expires_minutes)
        
        verification = VerificationCode(
            user_id=user_id,
            code=code,
            code_type=code_type,
            expires_at=expires_at
        )
        
        db.add(verification)
        db.commit()
        db.refresh(verification)
        return verification
    
    @staticmethod
    def verify_code(db: Session, user_id: int, code: str, code_type: str) -> bool:
        """Verify verification code"""
        verification = db.query(VerificationCode).filter(
            VerificationCode.user_id == user_id,
            VerificationCode.code == code,
            VerificationCode.code_type == code_type,
            VerificationCode.is_used == False,
            VerificationCode.expires_at > datetime.utcnow()
        ).first()
        
        if verification:
            verification.is_used = True
            db.commit()
            return True
        return False
    
    @staticmethod
    def mark_user_verified(db: Session, user_id: int):
        """Mark user as verified"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_verified = True
            user.last_login = datetime.utcnow()
            db.commit()


class GoogleOAuthService:
    """Google OAuth integration service"""
    
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://0.0.0.0:5000/auth/google/callback")
    
    @staticmethod
    def get_google_auth_url() -> str:
        """Get Google OAuth authorization URL"""
        base_url = "https://accounts.google.com/o/oauth2/auth"
        params = {
            "response_type": "code",
            "client_id": GoogleOAuthService.GOOGLE_CLIENT_ID,
            "redirect_uri": GoogleOAuthService.GOOGLE_REDIRECT_URI,
            "scope": "openid email profile",
            "access_type": "offline"
        }
        
        param_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{base_url}?{param_string}"
    
    @staticmethod
    async def exchange_code_for_token(code: str) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            token_url = "https://oauth2.googleapis.com/token"
            token_data = {
                "code": code,
                "client_id": GoogleOAuthService.GOOGLE_CLIENT_ID,
                "client_secret": GoogleOAuthService.GOOGLE_CLIENT_SECRET,
                "redirect_uri": GoogleOAuthService.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code"
            }
            
            response = await client.post(token_url, data=token_data)
            if response.status_code == 200:
                return response.json()
            return None
    
    @staticmethod
    async def get_user_info(access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from Google"""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            return None


class SMSService:
    """SMS verification service"""
    
    @staticmethod
    async def send_sms_verification(phone: str, code: str) -> bool:
        """Send SMS verification code"""
        # This will be integrated with Twilio or similar service
        message = f"Twój kod weryfikacyjny do Prawnik AI: {code}. Kod wygasa za 10 minut."
        
        # For now, just log the code (in production, integrate with Twilio)
        print(f"SMS to {phone}: {message}")
        return True


class EmailService:
    """Email verification service"""
    
    @staticmethod
    async def send_email_verification(email: str, code: str) -> bool:
        """Send email verification code"""
        subject = "Kod weryfikacyjny - Prawnik AI"
        message = f"""
        Witaj!
        
        Twój kod weryfikacyjny to: {code}
        
        Kod jest ważny przez 10 minut.
        
        Jeśli to nie Ty się rejestrujesz, zignoruj tę wiadomość.
        
        Zespół Prawnik AI
        """
        
        # This will be integrated with Replit Mail or similar service
        print(f"Email to {email}: {subject} - {message}")
        return True