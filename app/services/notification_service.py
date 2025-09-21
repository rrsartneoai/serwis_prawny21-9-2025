import logging
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.notification import (
    Notification, NotificationStatus, NotificationType, 
    NotificationTemplateType, MessageTemplate
)
from app.models.case import Case
from app.models.user import User
from app.services.sms_service import sms_service
from app.services.email_service import email_service

logger = logging.getLogger(__name__)

class NotificationService:
    """Service for managing and sending notifications (SMS, Email, In-app)"""
    
    def __init__(self):
        self.templates = {
            # Payment notifications
            NotificationTemplateType.PAYMENT_RECEIVED: {
                "sms": "Prawnik AI: Płatność {amount}zł potwierdzona. Analiza dokumentów w trakcie realizacji. Status: {panel_url}",
                "email_subject": "Płatność potwierdzona - AI Prawnik PL",
                "email_body": "Dziękujemy za płatność za analizę w sprawie '{case_title}'. Płatność w wysokości {amount} zł została potwierdzona. Prawnik przystąpi do analizy dokumentów."
            },
            
            # Analysis notifications  
            NotificationTemplateType.ANALYSIS_STARTED: {
                "sms": "Prawnik AI: Rozpoczęto analizę dokumentów w sprawie '{case_title}'. Powiadomimy Cię gdy analiza będzie gotowa.",
                "email_subject": "Rozpoczęto analizę dokumentów",
                "email_body": "Prawnik rozpoczął analizę dokumentów w sprawie '{case_title}'. Otrzymasz powiadomienie gdy analiza będzie gotowa."
            },
            
            NotificationTemplateType.ANALYSIS_READY: {
                "sms": "Prawnik AI: Analiza dokumentów gotowa! Sprawdź szczegóły w panelu: {panel_url}",
                "email_subject": "Analiza dokumentów gotowa - AI Prawnik PL", 
                "email_body": "Analiza dokumentów w sprawie '{case_title}' została ukończona. Zaloguj się do panelu aby przeczytać szczegółowe rekomendacje."
            },
            
            NotificationTemplateType.DOCUMENTS_READY: {
                "sms": "Prawnik AI: Przygotowano dokumenty prawne do zakupu. Sprawdź szczegóły: {panel_url}",
                "email_subject": "Dokumenty prawne gotowe do zakupu",
                "email_body": "W ramach analizy sprawy '{case_title}' przygotowano dokumenty prawne które możesz zakupić w panelu klienta."
            },
            
            # Issue notifications
            NotificationTemplateType.UNCLEAR_SCANS: {
                "sms": "Prawnik AI: Niektóre dokumenty są nieczytelne. Prawnik skontaktuje się w sprawie dodatkowych informacji.",
                "email_subject": "Potrzebne dodatkowe informacje", 
                "email_body": "W sprawie '{case_title}' niektóre dokumenty wymagają doprecyzowania. Prawnik skontaktuje się z Tobą w celu wyjaśnienia szczegółów."
            },
            
            NotificationTemplateType.CASE_COMPLETED: {
                "sms": "Prawnik AI: Sprawa '{case_title}' zakończona. Dziękujemy za skorzystanie z usług!",
                "email_subject": "Sprawa zakończona - AI Prawnik PL",
                "email_body": "Sprawa '{case_title}' została zakończona. Wszystkie analizy i dokumenty pozostają dostępne w Twoim panelu klienta."
            }
        }
    
    def send_notification(
        self, 
        db: Session,
        user_id: int, 
        notification_type: NotificationType,
        template_type: NotificationTemplateType,
        case: Optional[Case] = None,
        variables: Optional[dict] = None
    ) -> Notification:
        """Send notification to user with specified template"""
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Prepare template variables
        template_vars = variables or {}
        template_vars.update({
            'user_name': user.first_name or user.email,
            'user_email': user.email,
            'panel_url': self._get_panel_url(),
            'case_title': case.title if case else 'Twoja sprawa',
            'case_id': case.id if case else '',
            'support_email': 'pomoc@prawnik.ai',
            'support_phone': '+48 123 456 789'
        })
        
        # Get template content
        template = self.templates.get(template_type, {})
        
        # Create notification record
        notification = Notification(
            user_id=user_id,
            case_id=case.id if case else None,
            type=notification_type,
            template=template_type,
            status=NotificationStatus.PENDING
        )
        
        if notification_type == NotificationType.SMS:
            content = template.get('sms', '').format(**template_vars)
            notification.content = content
            notification.recipient_phone = user.phone
            
            # Add to session and flush to get ID before sending
            db.add(notification)
            db.flush()
            
            if user.phone:
                # Send SMS with notification ID
                result = sms_service.send_sms(user.phone, content, notification.id)
                
                # Update status based on result
                if result["success"]:
                    notification.status = NotificationStatus.SENT
                    notification.external_id = result.get("message_sid")
                    notification.error_message = None
                    notification.sent_at = datetime.utcnow()
                else:
                    notification.status = NotificationStatus.FAILED
                    notification.error_message = result.get("error")
            else:
                notification.status = NotificationStatus.FAILED
                notification.error_message = "User has no phone number"
                
        elif notification_type == NotificationType.EMAIL:
            notification.subject = template.get('email_subject', '').format(**template_vars)
            notification.content = template.get('email_body', '').format(**template_vars)
            notification.recipient_email = user.email
            
            # Add to session and flush to get ID before sending
            db.add(notification)
            db.flush()
            
            # Send email using email service
            result = email_service.send_email(
                user.email, 
                notification.subject, 
                notification.content, 
                notification.id
            )
            
            # Update status based on result
            if result["success"]:
                notification.status = NotificationStatus.SENT
                notification.external_id = result.get("message_id")
                notification.error_message = None
                notification.sent_at = datetime.utcnow()
            else:
                notification.status = NotificationStatus.FAILED
                notification.error_message = result.get("error")
        
        # Single commit after all operations
        db.commit()
        db.refresh(notification)
        
        logger.info(f"Notification {notification.id} created and sent for user {user_id}")
        return notification
    
    def send_payment_confirmation(self, db: Session, case: Case, amount: float):
        """Send payment confirmation notifications"""
        variables = {'amount': amount}
        
        # Send SMS notification
        if case.user and case.user.phone:
            self.send_notification(
                db, case.user_id, NotificationType.SMS,
                NotificationTemplateType.PAYMENT_RECEIVED,
                case, variables
            )
        
        # Send Email notification (when implemented)
        self.send_notification(
            db, case.user_id, NotificationType.EMAIL,
            NotificationTemplateType.PAYMENT_RECEIVED,
            case, variables
        )
    
    def send_analysis_ready(self, db: Session, case: Case):
        """Send analysis ready notifications"""
        
        # SMS notification
        if case.user and case.user.phone:
            self.send_notification(
                db, case.user_id, NotificationType.SMS,
                NotificationTemplateType.ANALYSIS_READY, case
            )
        
        # Email notification
        self.send_notification(
            db, case.user_id, NotificationType.EMAIL,
            NotificationTemplateType.ANALYSIS_READY, case
        )
    
    def send_documents_ready(self, db: Session, case: Case):
        """Send documents ready notifications"""
        
        if case.user and case.user.phone:
            self.send_notification(
                db, case.user_id, NotificationType.SMS,
                NotificationTemplateType.DOCUMENTS_READY, case
            )
        
        self.send_notification(
            db, case.user_id, NotificationType.EMAIL,
            NotificationTemplateType.DOCUMENTS_READY, case
        )
    
    def send_unclear_documents(self, db: Session, case: Case, operator_message: str):
        """Send notification about unclear documents"""
        variables = {'operator_message': operator_message}
        
        if case.user and case.user.phone:
            self.send_notification(
                db, case.user_id, NotificationType.SMS,
                NotificationTemplateType.UNCLEAR_SCANS, case, variables
            )
        
        self.send_notification(
            db, case.user_id, NotificationType.EMAIL,
            NotificationTemplateType.UNCLEAR_SCANS, case, variables
        )
    
    def get_user_notifications(
        self, 
        db: Session, 
        user_id: int, 
        limit: int = 50,
        unread_only: bool = False
    ) -> List[Notification]:
        """Get notifications for user"""
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.read_at.is_(None))
        
        return query.order_by(Notification.created_at.desc()).limit(limit).all()
    
    def mark_as_read(self, db: Session, notification_id: int, user_id: int) -> bool:
        """Mark notification as read"""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.read_at = datetime.utcnow()
            db.commit()
            return True
        return False
    
    def _get_panel_url(self) -> str:
        """Get client panel URL"""
        import os
        base_url = os.environ.get("CLIENT_PANEL_URL", "https://prawnik.ai")
        return f"{base_url}/panel-klienta"

# Global notification service instance
notification_service = NotificationService()