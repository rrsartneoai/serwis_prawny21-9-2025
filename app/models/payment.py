from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.database import Base

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"

class PaymentProvider(enum.Enum):
    PAYU = "payu"
    STRIPE = "stripe"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"

class PaymentType(enum.Enum):
    ANALYSIS = "analysis"
    LEGAL_DOCUMENT = "legal_document"
    PACKAGE = "package"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"))
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    
    # Payment details
    amount = Column(Float)
    currency = Column(String, default="PLN")
    payment_type = Column(Enum(PaymentType))
    description = Column(Text, nullable=True)
    
    # Payment provider data
    provider = Column(Enum(PaymentProvider), default=PaymentProvider.PAYU)
    external_payment_id = Column(String, nullable=True)  # PayU order ID
    payment_url = Column(String, nullable=True)  # Redirect URL
    
    # Status
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Invoice data
    invoice_number = Column(String, nullable=True)
    fakturownia_id = Column(Integer, nullable=True)  # Fakturownia invoice ID
    
    # Applied promotion
    applied_promotion_id = Column(Integer, ForeignKey("payment_promotions.id"), nullable=True)
    applied_promotion_code = Column(String, nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="payments")
    case = relationship("Case", back_populates="payments")


class PaymentPromotion(Base):
    __tablename__ = "payment_promotions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    discount_percent = Column(Float, nullable=True)
    discount_amount = Column(Float, nullable=True)
    code = Column(String, unique=True, nullable=True)  # Promo code
    
    # Validity
    valid_from = Column(DateTime)
    valid_to = Column(DateTime)
    max_uses = Column(Integer, nullable=True)
    current_uses = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Conditions
    min_amount = Column(Float, nullable=True)
    applicable_types = Column(String, nullable=True)  # JSON array
    
    created_at = Column(DateTime, default=datetime.utcnow)