#!/usr/bin/env python3
"""
Script to create admin and operator test accounts
"""

import sys
import os

# Add the parent directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

from app.db.database import get_db, engine, Base
from app.services.auth_service import AuthService
from app.models.user import User, UserRole, AuthProvider
from sqlalchemy.orm import Session

def create_test_users():
    """Create test admin and operator users"""
    
    # Create database tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Check if admin already exists
        existing_admin = AuthService.get_user_by_email(db, "admin@test.com")
        if not existing_admin:
            # Create admin user
            admin_user = AuthService.create_user(
                db=db,
                email="admin@test.com",
                password="admin123",
                first_name="Test",
                last_name="Admin",
                auth_provider=AuthProvider.EMAIL,
                role=UserRole.ADMIN
            )
            # Mark admin as verified and active
            admin_user.is_verified = True
            admin_user.is_active = True
            db.commit()
            print(f"✅ Created admin user: admin@test.com (password: admin123)")
        else:
            print(f"ℹ️  Admin user admin@test.com already exists")
            
        # Check if operator already exists
        existing_operator = AuthService.get_user_by_email(db, "operator@test.com")
        if not existing_operator:
            # Create operator user
            operator_user = AuthService.create_user(
                db=db,
                email="operator@test.com",
                password="operator123",
                first_name="Test",
                last_name="Operator", 
                auth_provider=AuthProvider.EMAIL,
                role=UserRole.OPERATOR
            )
            # Mark operator as verified and active
            operator_user.is_verified = True
            operator_user.is_active = True
            db.commit()
            print(f"✅ Created operator user: operator@test.com (password: operator123)")
        else:
            print(f"ℹ️  Operator user operator@test.com already exists")
            
        # Create a second operator for testing
        existing_operator2 = AuthService.get_user_by_email(db, "operator2@test.com")
        if not existing_operator2:
            operator2_user = AuthService.create_user(
                db=db,
                email="operator2@test.com",
                password="operator123",
                first_name="Test2",
                last_name="Operator2",
                auth_provider=AuthProvider.EMAIL,
                role=UserRole.OPERATOR
            )
            # Mark operator as verified and active
            operator2_user.is_verified = True
            operator2_user.is_active = True
            db.commit()
            print(f"✅ Created second operator user: operator2@test.com (password: operator123)")
        else:
            print(f"ℹ️  Second operator user operator2@test.com already exists")
            
        print("\n🎉 Test users setup complete!")
        print("\n📋 Test Accounts Summary:")
        print("Admin: admin@test.com / admin123")
        print("Operator 1: operator@test.com / operator123") 
        print("Operator 2: operator2@test.com / operator123")
        
    except Exception as e:
        print(f"❌ Error creating test users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()