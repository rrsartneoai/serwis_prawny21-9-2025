from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import hashlib
import hmac
import json

from app.db.database import get_db
from app.models.payment import Payment, PaymentStatus, PaymentProvider, PaymentType
from app.models.user import User
from app.models.case import Case
from app.api.v1.endpoints.auth import get_verified_user

router = APIRouter()

# Pydantic schemas
class PaymentCreate(BaseModel):
    case_id: int
    amount: float
    payment_type: PaymentType = PaymentType.ANALYSIS
    provider: PaymentProvider = PaymentProvider.PAYU
    description: Optional[str] = None
    promo_code: Optional[str] = None

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
    current_user: User = Depends(get_verified_user),
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
    
    # Server-side amount validation - calculate based on case package
    from app.models.case import PackageType
    
    # Updated pricing to match frontend packages
    package_pricing = {
        PackageType.BASIC: 39.0,      # Basic analysis
        PackageType.STANDARD: 59.0,   # Standard analysis  
        PackageType.PREMIUM: 89.0,    # Premium analysis
        PackageType.EXPRESS: 129.0,   # Express analysis (6h)
        PackageType.BUSINESS: 199.0,  # Business package for companies
    }
    
    # Require valid package type - no fallback
    if case.package_type not in package_pricing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid package type: {case.package_type}"
        )
    
    base_amount = package_pricing[case.package_type]
    final_amount = base_amount
    applied_promo = None
    
    # Apply promo code if provided
    if payment_data.promo_code:
        promo_code = payment_data.promo_code.upper().strip()
        
        # Sample promo codes with package restrictions
        promo_codes = {
            "PRAWNIK10": {"discount": 10, "type": "percent", "description": "10% zniżki", "allowed_packages": None},
            "NOWY2025": {"discount": 15, "type": "amount", "description": "15 zł zniżki", "allowed_packages": None},
            "EXPRESS50": {"discount": 50, "type": "amount", "description": "50 zł zniżki na Express", "allowed_packages": [PackageType.EXPRESS]},
            "WEEKEND20": {"discount": 20, "type": "percent", "description": "20% zniżki weekendowa", "allowed_packages": None},
        }
        
        if promo_code in promo_codes:
            promo = promo_codes[promo_code]
            
            # Check package restrictions
            if promo["allowed_packages"] and case.package_type not in promo["allowed_packages"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Promo code {promo_code} is not valid for package {case.package_type.value}"
                )
            
            if promo["type"] == "percent":
                discount_amount = base_amount * (promo["discount"] / 100)
                final_amount = base_amount - discount_amount
            else:  # amount
                final_amount = max(0, base_amount - promo["discount"])
            
            applied_promo = {
                "code": promo_code,
                "discount": promo["discount"],
                "type": promo["type"],
                "description": promo["description"]
            }
            
            final_amount = round(final_amount, 2)
    
    # Validate client amount against server calculation (with discount)
    if abs(payment_data.amount - final_amount) > 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid amount. Expected {final_amount} (base: {base_amount}), got {payment_data.amount}"
        )

    # Create payment record with server-validated amount
    payment = Payment(
        user_id=current_user.id,
        case_id=payment_data.case_id,
        amount=final_amount,  # Use server-calculated amount with discount
        payment_type=payment_data.payment_type,
        provider=payment_data.provider,
        description=payment_data.description or f"Analiza dokumentów - sprawa #{payment_data.case_id}",
        status=PaymentStatus.PENDING,
        applied_promotion_code=applied_promo["code"] if applied_promo else None
    )
    
    db.add(payment)
    
    # Update case status to AWAITING_PAYMENT when payment is created
    if payment_data.case_id:
        from app.models.case import CaseStatus
        case.status = CaseStatus.AWAITING_PAYMENT
    
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
    current_user: User = Depends(get_verified_user),
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
    current_user: User = Depends(get_verified_user),
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

# SECURE WEBHOOK ENDPOINT for PayU notifications  
@router.post("/webhook/payu")
async def payu_webhook(
    webhook_data: dict,
    db: Session = Depends(get_db)
):
    """Secure webhook endpoint for PayU payment notifications"""
    
    # CRITICAL: Verify PayU signature before processing  
    import os
    environment = os.getenv("ENVIRONMENT", "").lower()
    
    # In development, skip signature verification for testing
    if environment in ["development", "dev", "test"]:
        # Development mode - allow webhook for testing
        pass
    else:
        # Production mode - require proper signature verification
        raise HTTPException(status_code=501, detail="Production webhook verification not yet implemented")
    
    try:
        # Extract payment info from PayU webhook
        external_payment_id = webhook_data.get('order', {}).get('orderId')
        payment_status = webhook_data.get('order', {}).get('status')
        
        if not external_payment_id:
            raise HTTPException(status_code=400, detail="Missing order ID")
        
        # Find payment by external ID
        payment = db.query(Payment).filter(
            Payment.external_payment_id == external_payment_id
        ).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Update payment status based on PayU notification
        if payment_status == 'COMPLETED':
            payment.status = PaymentStatus.PAID
            payment.paid_at = datetime.utcnow()
            
            # Update case status to 'paid' and trigger notifications
            if payment.case_id:
                case = db.query(Case).filter(Case.id == payment.case_id).first()
                if case:
                    from app.models.case import CaseStatus
                    case.status = CaseStatus.PAID  # Use proper enum value
                    
                    # Send notification to client
                    await send_payment_confirmation_notification(case, payment, db)
                    
        elif payment_status == 'CANCELED':
            payment.status = PaymentStatus.CANCELLED
        elif payment_status == 'PENDING':
            payment.status = PaymentStatus.PENDING
        
        db.commit()
        return {"status": "ok", "message": "Webhook processed"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")


async def send_payment_confirmation_notification(case: Case, payment: Payment, db: Session):
    """Send payment confirmation notifications to client using notification service"""
    from app.services.notification_service import notification_service
    
    # Send payment confirmation via notification service
    notification_service.send_payment_confirmation(db, case, payment.amount)


def verify_payu_signature(webhook_data: dict, signature: str, secret: str) -> bool:
    """Verify PayU webhook signature for security"""
    try:
        # Create payload string for verification
        payload = json.dumps(webhook_data, separators=(',', ':'), sort_keys=True)
        
        # Calculate expected signature
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures securely
        return hmac.compare_digest(signature, expected_signature)
    except Exception:
        return False


def get_client_panel_url() -> str:
    """Get URL for client panel"""
    # TODO: Get from environment variable or config
    return "https://prawnik.ai/panel-klienta"

@router.post("/simulate-success/{payment_id}")
async def simulate_payment_success(
    payment_id: int,
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db)
):
    """Simulate successful payment (DEVELOPMENT ONLY - for testing)"""
    import os
    
    # Only allow in development/test environment explicitly
    environment = os.getenv("ENVIRONMENT", "").lower()
    if environment not in ["development", "dev", "test"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Simulate payment is only available in development environment"
        )
    
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
    
    # Update case status and send notifications
    if payment.case_id:
        case = db.query(Case).filter(Case.id == payment.case_id).first()
        if case:
            from app.models.case import CaseStatus
            case.status = CaseStatus.PAID  # Use proper enum
            
            # Send notifications to client
            await send_payment_confirmation_notification(case, payment, db)
    
    db.commit()
    db.refresh(payment)
    
    return {"message": "Payment marked as successful", "payment": payment}