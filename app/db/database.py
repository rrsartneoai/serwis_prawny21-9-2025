from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os

# Use PostgreSQL database from Replit environment
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,  # Reduce log noise in production
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=300,    # Reconnect every 5 minutes
    pool_timeout=30,     # Wait 30s for connection
    max_overflow=10,     # Allow 10 overflow connections
    connect_args={
        "sslmode": "prefer",
        "connect_timeout": 10,
        "application_name": "kancelaria_app"
    } if SQLALCHEMY_DATABASE_URL.startswith("postgresql") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()