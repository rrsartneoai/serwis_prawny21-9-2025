from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.models.payment import Payment, PaymentStatus, PaymentProvider, PaymentType
from app.models.user import User
from app.models.case import Case
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

# Pydantic schemas
class PaymentCreate(BaseModel):
    case_id: int
    amount: float
    payment_type: PaymentType = PaymentType.ANALYSIS
    provider: PaymentProvider = PaymentProvider.PAYU
    description: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    case_id: Optional[int]
    amount: float
    currency: str
    payment_type: PaymentType
    description: Optional[str]
    provider: PaymentProvider
    status: PaymentStatus
    payment_url: Optional[str]
    external_payment_id: Optional[str]
    created_at: datetime
    paid_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class PaymentUpdateStatus(BaseModel):
    status: PaymentStatus
    external_payment_id: Optional[str] = None
    payment_url: Optional[str] = None

@router.post("/", response_model=PaymentResponse)
async def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new payment for a case"""
    
    # Verify case exists and belongs to user
    case = db.query(Case).filter(
        Case.id == payment_data.case_id,
        Case.user_id == current_user.id
    ).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found or access denied"
        )
    
    # Check if payment already exists for this case
    existing_payment = db.query(Payment).filter(
        Payment.case_id == payment_data.case_id,
        Payment.status.in_([PaymentStatus.PENDING, PaymentStatus.PAID])
    ).first()
    
    if existing_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment already exists for this case"
        )
    
    # Create payment record
    payment = Payment(
        user_id=current_user.id,
        case_id=payment_data.case_id,
        amount=payment_data.amount,
        payment_type=payment_data.payment_type,
        provider=payment_data.provider,
        description=payment_data.description or f"Analiza dokumentów - sprawa #{payment_data.case_id}",
        status=PaymentStatus.PENDING
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    # Simulate payment URL generation (for now)
    # TODO: Integrate with real payment provider
    if payment_data.provider == PaymentProvider.PAYU:
        payment.payment_url = f"https://secure.payu.com/pl/payment/{payment.id}"
        payment.external_payment_id = f"payu_order_{payment.id}_{datetime.now().timestamp()}"
    elif payment_data.provider == PaymentProvider.STRIPE:
        payment.payment_url = f"https://checkout.stripe.com/payment/{payment.id}"
        payment.external_payment_id = f"stripe_session_{payment.id}_{datetime.now().timestamp()}"
    
    db.commit()
    db.refresh(payment)
    
    return payment

@router.get("/", response_model=List[PaymentResponse])
async def get_user_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all payments for current user"""
    
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).all()
    
    return payments

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific payment details"""
    
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    return payment

@router.patch("/{payment_id}/status", response_model=PaymentResponse)
async def update_payment_status(
    payment_id: int,
    status_update: PaymentUpdateStatus,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update payment status (for webhook integration)"""
    
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Update payment status
    payment.status = status_update.status
    
    if status_update.external_payment_id:
        payment.external_payment_id = status_update.external_payment_id
    
    if status_update.payment_url:
        payment.payment_url = status_update.payment_url
    
    # Set paid_at timestamp if payment is completed
    if status_update.status == PaymentStatus.PAID and not payment.paid_at:
        payment.paid_at = datetime.utcnow()
    
    db.commit()
    db.refresh(payment)
    
    # If payment is successful, update case status
    if status_update.status == PaymentStatus.PAID and payment.case_id:
        case = db.query(Case).filter(Case.id == payment.case_id).first()
        if case and case.status == "draft":
            case.status = "pending"  # Case becomes pending for analysis
            db.commit()
    
    return payment

@router.post("/simulate-success/{payment_id}")
async def simulate_payment_success(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Simulate successful payment (for development/testing)"""
    
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment is not in pending status"
        )
    
    # Mark as paid
    payment.status = PaymentStatus.PAID
    payment.paid_at = datetime.utcnow()
    
    # Update case status
    if payment.case_id:
        case = db.query(Case).filter(Case.id == payment.case_id).first()
        if case and case.status == "draft":
            case.status = "pending"
    
    db.commit()
    db.refresh(payment)
    
    return {"message": "Payment marked as successful", "payment": payment}