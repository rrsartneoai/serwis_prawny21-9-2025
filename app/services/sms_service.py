import os
import logging
from typing import Optional, Dict, Any
from twilio.rest import Client
from twilio.base.exceptions import TwilioException

from app.models.notification import Notification, NotificationStatus
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class SMSService:
    """SMS service using Twilio integration for sending messages to clients"""
    
    def __init__(self):
        self.account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
        self.auth_token = os.environ.get("TWILIO_AUTH_TOKEN") 
        self.phone_number = os.environ.get("TWILIO_PHONE_NUMBER")
        
        # Check if credentials are configured
        self.is_configured = bool(self.account_sid and self.auth_token and self.phone_number)
        
        if self.is_configured:
            self.client = Client(self.account_sid, self.auth_token)
            logger.info("SMS service initialized with Twilio")
        else:
            logger.warning("SMS service not configured - missing Twilio credentials")
    
    def send_sms(self, to_phone: str, message: str, notification_id: Optional[int] = None) -> Dict[str, Any]:
        """Send SMS message using Twilio
        
        Args:
            to_phone: Recipient phone number (with country code, e.g., +48123456789)
            message: Message content
            notification_id: Database notification ID for tracking
            
        Returns:
            Dict with success status and details
        """
        if not self.is_configured:
            return {
                "success": False, 
                "error": "SMS service not configured - missing Twilio credentials",
                "message_sid": None
            }
        
        try:
            # Ensure phone number has country code
            if not to_phone.startswith('+'):
                # Assume Polish number if no country code
                to_phone = '+48' + to_phone.lstrip('0')
            
            # Send message via Twilio
            message_obj = self.client.messages.create(
                body=message,
                from_=self.phone_number,
                to=to_phone
            )
            
            logger.info(f"SMS sent successfully: SID {message_obj.sid} to {to_phone}")
            
            return {
                "success": True,
                "message_sid": message_obj.sid,
                "status": message_obj.status,
                "error": None
            }
            
        except TwilioException as e:
            logger.error(f"Twilio SMS error: {e}")
            return {
                "success": False,
                "error": f"SMS sending failed: {str(e)}",
                "message_sid": None
            }
        except Exception as e:
            logger.error(f"Unexpected SMS error: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "message_sid": None
            }
    
    def get_delivery_status(self, message_sid: str) -> Dict[str, Any]:
        """Check delivery status of sent SMS message"""
        if not self.is_configured:
            return {"success": False, "error": "SMS service not configured"}
        
        try:
            message = self.client.messages(message_sid).fetch()
            return {
                "success": True,
                "status": message.status,
                "date_sent": message.date_sent,
                "price": message.price,
                "error": None
            }
        except TwilioException as e:
            logger.error(f"Error fetching SMS status: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def update_notification_status(self, db: Session, notification: Notification, sms_result: Dict[str, Any]):
        """Update notification status in database based on SMS result"""
        if sms_result["success"]:
            notification.status = NotificationStatus.SENT
            notification.external_id = sms_result.get("message_sid")
            notification.error_message = None
        else:
            notification.status = NotificationStatus.FAILED
            notification.error_message = sms_result.get("error")
        
        db.commit()

# Global SMS service instance
sms_service = SMSService()