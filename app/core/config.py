# Configuration settings for the application

# File upload limits
MAX_FILE_SIZE_MB = 50
MAX_FILES_PER_CASE = 10
ALLOWED_FILE_TYPES = ["pdf", "jpg", "jpeg", "png", "doc", "docx"]

# Database settings
import os
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# JWT settings
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# External service settings
TWILIO_ACCOUNT_SID = ""
TWILIO_AUTH_TOKEN = ""
TWILIO_PHONE_NUMBER = ""

SMTP_SERVER = ""
SMTP_PORT = 587
SMTP_USERNAME = ""
SMTP_PASSWORD = ""

# PayU settings
PAYU_CLIENT_ID = ""
PAYU_CLIENT_SECRET = ""
PAYU_ENVIRONMENT = "sandbox"  # sandbox or production