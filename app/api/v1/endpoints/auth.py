from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.db.database import get_db
from app.services.auth_service import (
    AuthService, GoogleOAuthService, SMSService, EmailService
)
from app.api.v1.schemas.auth import (
    UserRegistration, UserLogin, PhoneLogin, EmailLogin, 
    VerificationRequest, GoogleAuthCallback, TokenResponse,
    AuthResponse, VerificationResponse, AuthUrlResponse, UserResponse
)
from app.models.user import User, AuthProvider, UserRole

router = APIRouter()
security = HTTPBearer()

# Dependency to get current user from JWT token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from JWT token"""
    payload = AuthService.verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

async def get_verified_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get verified user from JWT token - for protected endpoints"""
    user = await get_current_user(credentials, db)
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not verified. Please verify your account first."
        )
    
    return user

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is an admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

@router.post("/register", response_model=AuthResponse)
async def register_user(
    user_data: UserRegistration,
    db: Session = Depends(get_db)
):
    """Register new user"""
    
    # Check if user already exists
    existing_user = None
    if user_data.email:
        existing_user = AuthService.get_user_by_email(db, user_data.email)
    elif user_data.phone:
        existing_user = AuthService.get_user_by_phone(db, user_data.phone)
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists with this email/phone"
        )
    
    # Create user
    user = AuthService.create_user(
        db=db,
        email=user_data.email,
        phone=user_data.phone,
        password=user_data.password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        company_name=user_data.company_name,
        auth_provider=user_data.auth_provider
    )
    
    # Send verification code
    verification_sent_to = None
    if user_data.auth_provider == AuthProvider.EMAIL and user.email:
        verification_code = AuthService.create_verification_code(db, user.id, "email")
        await EmailService.send_email_verification(user.email, verification_code.code)
        verification_sent_to = user.email
    elif user_data.auth_provider == AuthProvider.PHONE and user.phone:
        verification_code = AuthService.create_verification_code(db, user.id, "sms")
        await SMSService.send_sms_verification(user.phone, verification_code.code)
        verification_sent_to = user.phone
    
    # Create token (but user still needs to verify)
    access_token = AuthService.create_access_token(data={"sub": str(user.id)})
    
    return AuthResponse(
        user=UserResponse.from_orm(user),
        access_token=access_token,
        requires_verification=True,
        verification_sent_to=verification_sent_to
    )

@router.post("/login", response_model=AuthResponse)
async def login_user(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Login with email/phone and password"""
    
    user = None
    if login_data.email:
        user = AuthService.authenticate_user(db, login_data.email, login_data.password)
    elif login_data.phone:
        phone_user = AuthService.get_user_by_phone(db, login_data.phone)
        if phone_user and phone_user.hashed_password:
            if AuthService.verify_password(login_data.password, phone_user.hashed_password):
                user = phone_user
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create token
    access_token = AuthService.create_access_token(data={"sub": str(user.id)})
    
    return AuthResponse(
        user=UserResponse.from_orm(user),
        access_token=access_token,
        requires_verification=not user.is_verified
    )

@router.post("/login/phone", response_model=AuthResponse)
async def login_with_phone(
    phone_data: PhoneLogin,
    db: Session = Depends(get_db)
):
    """Initiate phone-based login (SMS verification)"""
    
    user = AuthService.get_user_by_phone(db, phone_data.phone)
    if not user:
        # Create new user if doesn't exist
        user = AuthService.create_user(
            db=db,
            phone=phone_data.phone,
            auth_provider=AuthProvider.PHONE
        )
    
    # Send SMS verification code
    verification_code = AuthService.create_verification_code(db, user.id, "sms")
    await SMSService.send_sms_verification(user.phone, verification_code.code)
    
    # Create temporary token
    access_token = AuthService.create_access_token(data={"sub": str(user.id)})
    
    return AuthResponse(
        user=UserResponse.from_orm(user),
        access_token=access_token,
        requires_verification=True,
        verification_sent_to=user.phone
    )

@router.post("/login/email", response_model=AuthResponse) 
async def login_with_email(
    email_data: EmailLogin,
    db: Session = Depends(get_db)
):
    """Initiate email-based login (email verification)"""
    
    user = AuthService.get_user_by_email(db, email_data.email)
    if not user:
        # Create new user if doesn't exist
        user = AuthService.create_user(
            db=db,
            email=email_data.email,
            auth_provider=AuthProvider.EMAIL
        )
    
    # Send email verification code
    verification_code = AuthService.create_verification_code(db, user.id, "email")
    await EmailService.send_email_verification(user.email, verification_code.code)
    
    # Create temporary token
    access_token = AuthService.create_access_token(data={"sub": str(user.id)})
    
    return AuthResponse(
        user=UserResponse.from_orm(user),
        access_token=access_token,
        requires_verification=True,
        verification_sent_to=user.email
    )

@router.post("/verify", response_model=VerificationResponse)
async def verify_code(
    verification_data: VerificationRequest,
    db: Session = Depends(get_db)
):
    """Verify SMS or email code"""
    
    if AuthService.verify_code(
        db, 
        verification_data.user_id, 
        verification_data.code, 
        verification_data.code_type
    ):
        # Mark user as verified
        AuthService.mark_user_verified(db, verification_data.user_id)
        
        # Create new token
        access_token = AuthService.create_access_token(
            data={"sub": str(verification_data.user_id)}
        )
        
        return VerificationResponse(
            success=True,
            message="Verification successful",
            access_token=access_token
        )
    else:
        return VerificationResponse(
            success=False,
            message="Invalid or expired verification code"
        )

@router.get("/google", response_model=AuthUrlResponse)
async def google_oauth_url():
    """Get Google OAuth authorization URL"""
    auth_url = GoogleOAuthService.get_google_auth_url()
    return AuthUrlResponse(auth_url=auth_url)

@router.post("/google/callback", response_model=AuthResponse)
async def google_oauth_callback(
    callback_data: GoogleAuthCallback,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback"""
    
    # Exchange code for token
    token_data = await GoogleOAuthService.exchange_code_for_token(callback_data.code)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange code for token"
        )
    
    # Get user info
    user_info = await GoogleOAuthService.get_user_info(token_data["access_token"])
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get user information"
        )
    
    # Check if user exists
    user = AuthService.get_user_by_google_id(db, user_info["id"])
    if not user:
        # Check by email
        user = AuthService.get_user_by_email(db, user_info["email"])
        if user:
            # Link Google account
            user.google_id = user_info["id"]
            user.auth_provider = AuthProvider.GOOGLE
            db.commit()
        else:
            # Create new user
            user = AuthService.create_user(
                db=db,
                email=user_info["email"],
                first_name=user_info.get("given_name"),
                last_name=user_info.get("family_name"),
                auth_provider=AuthProvider.GOOGLE,
                google_id=user_info["id"]
            )
            # Google users are automatically verified
            user.is_verified = True
            db.commit()
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create token
    access_token = AuthService.create_access_token(data={"sub": str(user.id)})
    
    return AuthResponse(
        user=UserResponse.from_orm(user),
        access_token=access_token,
        requires_verification=False
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """Logout user (token is handled client-side)"""
    return {"message": "Successfully logged out"}