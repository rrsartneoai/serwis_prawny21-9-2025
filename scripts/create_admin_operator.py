import sys
import os

# Dodaj główny katalog projektu do ścieżki Pythona
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.database import SessionLocal
from app.models.user import User
from app.models.case import Case
from app.models.payment import Payment
from app.models.notification import Notification
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_user(email, password, role):
    db = SessionLocal()
    hashed_password = pwd_context.hash(password)
    user = User(
        email=email,
        hashed_password=hashed_password,
        role=role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    print(f"Utworzono użytkownika: {email} z rolą: {role}")

if __name__ == "__main__":
    # Podaj dane użytkownika
    create_user("admin@example.com", "TwojeHaslo123", "ADMIN")
    create_user("operator@example.com", "TwojeHaslo456", "OPERATOR")