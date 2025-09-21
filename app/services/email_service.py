import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
import os
from datetime import datetime

from app.models.notification import Notification, NotificationStatus
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class EmailService:
    """Email service for sending email notifications to clients"""
    
    def __init__(self):
        # Email configuration from environment variables
        self.smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        self.smtp_username = os.environ.get("SMTP_USERNAME")
        self.smtp_password = os.environ.get("SMTP_PASSWORD")
        self.from_email = os.environ.get("FROM_EMAIL", "noreply@prawnik.ai")
        self.from_name = os.environ.get("FROM_NAME", "AI Prawnik PL")
        
        # Check if credentials are configured
        self.is_configured = bool(self.smtp_username and self.smtp_password)
        
        if self.is_configured:
            logger.info("Email service initialized with SMTP configuration")
        else:
            logger.warning("Email service not configured - missing SMTP credentials")
    
    def send_email(
        self, 
        to_email: str, 
        subject: str, 
        content: str, 
        notification_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Send email notification
        
        Args:
            to_email: Recipient email address
            subject: Email subject line
            content: Email content (plain text)
            notification_id: Database notification ID for tracking
            
        Returns:
            Dict with success status and details
        """
        if not self.is_configured:
            return {
                "success": False,
                "error": "Email service not configured - missing SMTP credentials",
                "message_id": None
            }
        
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add body
            msg.attach(MIMEText(content, 'plain', 'utf-8'))
            
            # Connect to server and send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()  # Enable security
                server.login(self.smtp_username, self.smtp_password)
                
                # Send email
                text = msg.as_string()
                server.sendmail(self.from_email, to_email, text)
            
            logger.info(f"Email sent successfully to {to_email}")
            
            return {
                "success": True,
                "message_id": f"email_{datetime.utcnow().timestamp()}_{notification_id or 'unknown'}",
                "error": None
            }
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {e}")
            return {
                "success": False,
                "error": "Email authentication failed - check SMTP credentials",
                "message_id": None
            }
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error: {e}")
            return {
                "success": False,
                "error": f"Email sending failed: {str(e)}",
                "message_id": None
            }
        except Exception as e:
            logger.error(f"Unexpected email error: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "message_id": None
            }
    
    def update_notification_status(self, db: Session, notification: Notification, email_result: Dict[str, Any]):
        """Update notification status in database based on email result"""
        if email_result["success"]:
            notification.status = NotificationStatus.SENT
            notification.external_id = email_result.get("message_id")
            notification.error_message = None
            notification.sent_at = datetime.utcnow()
        else:
            notification.status = NotificationStatus.FAILED
            notification.error_message = email_result.get("error")
        
        # Note: Don't commit here - let the calling service handle the commit

# Global email service instance
email_service = EmailService()