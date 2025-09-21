"""
Comprehensive authentication tests including admin and operator roles
"""
from app.models.user import User, UserRole, AuthProvider
from app.core.security import get_password_hash, create_access_token
from datetime import timedelta

def test_register_user(client, db_session):
    """Test user registration"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "User",
            "auth_provider": "email"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "test@example.com"
    assert "access_token" in data
    assert data["requires_verification"] == True

def test_register_duplicate_email(client, db_session):
    """Test registration with existing email"""
    # First registration
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "User",
            "auth_provider": "email"
        }
    )
    
    # Second registration with same email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "differentpass",
            "first_name": "Another",
            "last_name": "User",
            "auth_provider": "email"
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()

def test_login_valid_user(client, db_session):
    """Test login with valid credentials"""
    # Create user directly in database
    hashed_password = get_password_hash("testpass123")
    user = User(
        email="login@example.com",
        hashed_password=hashed_password,
        first_name="Login",
        last_name="Test",
        auth_provider=AuthProvider.EMAIL,
        is_verified=True,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "login@example.com"
    assert "access_token" in data
    assert data["requires_verification"] == False

def test_login_invalid_credentials(client, db_session):
    """Test login with invalid credentials"""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "wrongpass"}
    )
    assert response.status_code == 401
    assert "invalid credentials" in response.json()["detail"].lower()

def test_admin_user_login(client, db_session):
    """Test admin user login and role assignment"""
    # Create admin user
    hashed_password = get_password_hash("adminpass123")
    admin_user = User(
        email="admin@example.com",
        hashed_password=hashed_password,
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        auth_provider=AuthProvider.EMAIL,
        is_verified=True,
        is_active=True
    )
    db_session.add(admin_user)
    db_session.commit()
    
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "adminpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "admin"
    assert data["user"]["is_verified"] == True

def test_operator_user_login(client, db_session):
    """Test operator user login and role assignment"""
    # Create operator user
    hashed_password = get_password_hash("operatorpass123")
    operator_user = User(
        email="operator@example.com",
        hashed_password=hashed_password,
        first_name="Operator",
        last_name="User",
        role=UserRole.OPERATOR,
        auth_provider=AuthProvider.EMAIL,
        is_verified=True,
        is_active=True
    )
    db_session.add(operator_user)
    db_session.commit()
    
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "operator@example.com", "password": "operatorpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "operator"
    assert data["user"]["is_verified"] == True

def test_get_current_user_with_valid_token(client, db_session):
    """Test getting current user with valid JWT token"""
    # Create user
    hashed_password = get_password_hash("testpass123")
    user = User(
        email="token@example.com",
        hashed_password=hashed_password,
        first_name="Token",
        last_name="User",
        auth_provider=AuthProvider.EMAIL,
        is_verified=True,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Create token
    access_token = create_access_token(
        subject=str(user.id),
        expires_delta=timedelta(minutes=30)
    )
    
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "token@example.com"
    assert data["id"] == user.id

def test_get_current_user_with_invalid_token(client, db_session):
    """Test getting current user with invalid JWT token"""
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401

def test_get_current_user_without_token(client, db_session):
    """Test getting current user without JWT token"""
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401

def test_password_hashing_and_verification():
    """Test password hashing and verification"""
    from app.core.security import get_password_hash, verify_password
    
    password = "testpassword123"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert verify_password(password, hashed) == True
    assert verify_password("wrongpassword", hashed) == False

def test_jwt_token_creation_and_validation():
    """Test JWT token creation and validation"""
    from jose import jwt
    from app.core.security import SECRET_KEY, ALGORITHM
    
    user_id = "123"
    token = create_access_token(
        subject=user_id,
        expires_delta=timedelta(minutes=30)
    )
    
    assert token is not None
    
    # Decode token
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == user_id

def test_inactive_user_login(client, db_session):
    """Test login with inactive user"""
    # Create inactive user
    hashed_password = get_password_hash("testpass123")
    user = User(
        email="inactive@example.com",
        hashed_password=hashed_password,
        first_name="Inactive",
        last_name="User",
        auth_provider=AuthProvider.EMAIL,
        is_verified=True,
        is_active=False  # User is inactive
    )
    db_session.add(user)
    db_session.commit()
    
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@example.com", "password": "testpass123"}
    )
    assert response.status_code == 401

def test_existing_user_wrong_password(client, db_session):
    """Test login with existing user but wrong password"""
    # Create user
    hashed_password = get_password_hash("correctpass123")
    user = User(
        email="existing@example.com",
        hashed_password=hashed_password,
        first_name="Existing",
        last_name="User",
        auth_provider=AuthProvider.EMAIL,
        is_verified=True,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    # Try to login with wrong password
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "existing@example.com", "password": "wrongpass123"}
    )
    assert response.status_code == 401
    assert "invalid credentials" in response.json()["detail"].lower()

def test_unverified_user_login_behavior(client, db_session):
    """Test login behavior for unverified users"""
    # Create unverified user
    hashed_password = get_password_hash("testpass123")
    user = User(
        email="unverified@example.com",
        hashed_password=hashed_password,
        first_name="Unverified",
        last_name="User",
        auth_provider=AuthProvider.EMAIL,
        is_verified=False,  # User is not verified
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "unverified@example.com", "password": "testpass123"}
    )
    
    # Depending on implementation, this might succeed but require verification
    # or be rejected outright - we test the expected behavior
    if response.status_code == 200:
        data = response.json()
        # If login succeeds, it should indicate verification is required
        assert data.get("requires_verification") == True
        assert data["user"]["is_verified"] == False
    else:
        # If login is rejected for unverified users
        assert response.status_code in [401, 403]

def test_expired_token_access(client, db_session):
    """Test access with expired JWT token"""
    # Create user
    hashed_password = get_password_hash("testpass123")
    user = User(
        email="expire@example.com",
        hashed_password=hashed_password,
        first_name="Expire",
        last_name="User",
        auth_provider=AuthProvider.EMAIL,
        is_verified=True,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Create expired token (negative timedelta)
    expired_token = create_access_token(
        subject=str(user.id),
        expires_delta=timedelta(seconds=-1)  # Already expired
    )
    
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    # Expired token should be rejected
    assert response.status_code == 401

def test_token_without_sub_claim(client, db_session):
    """Test JWT token without subject claim"""
    from jose import jwt
    from app.core.security import SECRET_KEY, ALGORITHM
    from datetime import datetime
    
    # Create token without 'sub' claim
    payload = {
        "exp": datetime.utcnow() + timedelta(minutes=30),
        # Missing 'sub' claim
    }
    malformed_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {malformed_token}"}
    )
    # Should be rejected due to missing subject
    assert response.status_code == 401

def test_token_with_nonexistent_user_id(client, db_session):
    """Test JWT token with user ID that doesn't exist"""
    # Create token with non-existent user ID
    nonexistent_token = create_access_token(
        subject="99999",  # User ID that doesn't exist
        expires_delta=timedelta(minutes=30)
    )
    
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {nonexistent_token}"}
    )
    # Should be rejected - user not found
    assert response.status_code == 401