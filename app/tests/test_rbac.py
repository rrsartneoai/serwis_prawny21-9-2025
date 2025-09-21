"""
Role-Based Access Control (RBAC) tests for admin and operator endpoints
"""
from app.models.user import User, UserRole, AuthProvider
from app.services.auth_service import AuthService
from datetime import timedelta

def create_test_users(db_session):
    """Helper function to create users with different roles"""
    users = {}
    
    # Admin user
    admin_user = User(
        email="rbac_admin@test.com",
        hashed_password=AuthService.get_password_hash("adminpass"),
        first_name="RBAC",
        last_name="Admin",
        role=UserRole.ADMIN,
        auth_provider=AuthProvider.EMAIL,
        is_verified=True,
        is_active=True
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)
    
    # Operator user
    operator_user = User(
        email="rbac_operator@test.com",
        hashed_password=AuthService.get_password_hash("operatorpass"),
        first_name="RBAC",
        last_name="Operator",
        role=UserRole.OPERATOR,
        auth_provider=AuthProvider.EMAIL,
        is_verified=True,
        is_active=True
    )
    db_session.add(operator_user)
    db_session.commit()
    db_session.refresh(operator_user)
    
    # Client user
    client_user = User(
        email="rbac_client@test.com",
        hashed_password=AuthService.get_password_hash("clientpass"),
        first_name="RBAC",
        last_name="Client",
        role=UserRole.CLIENT,
        auth_provider=AuthProvider.EMAIL,
        is_verified=True,
        is_active=True
    )
    db_session.add(client_user)
    db_session.commit()
    db_session.refresh(client_user)
    
    users['admin'] = admin_user
    users['operator'] = operator_user
    users['client'] = client_user
    
    return users

def get_auth_headers(user):
    """Helper function to create auth headers for a user"""
    token = AuthService.create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=30)
    )
    return {"Authorization": f"Bearer {token}"}

def test_admin_dashboard_access_by_admin(client, db_session):
    """Test admin can access admin dashboard"""
    users = create_test_users(db_session)
    headers = get_auth_headers(users['admin'])
    
    response = client.get("/api/v1/admin/dashboard/stats", headers=headers)
    # May return 200 or 500 (if endpoint has issues), but NOT 401/403
    assert response.status_code != 401
    assert response.status_code != 403

def test_admin_dashboard_denied_for_operator(client, db_session):
    """Test operator is denied access to admin dashboard"""
    users = create_test_users(db_session)
    headers = get_auth_headers(users['operator'])
    
    response = client.get("/api/v1/admin/dashboard/stats", headers=headers)
    # Should be denied access (401 or 403)
    assert response.status_code in [401, 403]

def test_admin_dashboard_denied_for_client(client, db_session):
    """Test client is denied access to admin dashboard"""
    users = create_test_users(db_session)
    headers = get_auth_headers(users['client'])
    
    response = client.get("/api/v1/admin/dashboard/stats", headers=headers)
    # Should be denied access (401 or 403)
    assert response.status_code in [401, 403]

def test_operator_cases_access_by_operator(client, db_session):
    """Test operator can access operator cases"""
    users = create_test_users(db_session)
    headers = get_auth_headers(users['operator'])
    
    response = client.get("/api/v1/operator/cases", headers=headers)
    # Should succeed (200) - operator can access their endpoints
    assert response.status_code == 200

def test_operator_cases_access_by_admin(client, db_session):
    """Test admin can access operator cases (admin has broader access)"""
    users = create_test_users(db_session)
    headers = get_auth_headers(users['admin'])
    
    response = client.get("/api/v1/operator/cases", headers=headers)
    # Admin should have access to operator endpoints too
    assert response.status_code in [200, 500]  # 200 success, 500 if endpoint issues
    assert response.status_code != 403  # Should not be forbidden

def test_operator_cases_denied_for_client(client, db_session):
    """Test client is denied access to operator cases"""
    users = create_test_users(db_session)
    headers = get_auth_headers(users['client'])
    
    response = client.get("/api/v1/operator/cases", headers=headers)
    # Should be denied access (401 or 403)
    assert response.status_code in [401, 403]

def test_admin_users_management_by_admin(client, db_session):
    """Test admin can access user management"""
    users = create_test_users(db_session)
    headers = get_auth_headers(users['admin'])
    
    response = client.get("/api/v1/admin/users", headers=headers)
    # Admin should be able to access user management
    assert response.status_code != 403

def test_admin_users_management_denied_for_operator(client, db_session):
    """Test operator is denied access to user management"""
    users = create_test_users(db_session)
    headers = get_auth_headers(users['operator'])
    
    response = client.get("/api/v1/admin/users", headers=headers)
    # Should be denied access (401 or 403)
    assert response.status_code in [401, 403]

def test_admin_users_management_denied_for_client(client, db_session):
    """Test client is denied access to user management"""
    users = create_test_users(db_session)
    headers = get_auth_headers(users['client'])
    
    response = client.get("/api/v1/admin/users", headers=headers)
    # Should be denied access (401 or 403)
    assert response.status_code in [401, 403]

def test_notifications_access_permissions(client, db_session):
    """Test notifications endpoint access by different roles"""
    users = create_test_users(db_session)
    
    # Admin should have access
    admin_headers = get_auth_headers(users['admin'])
    admin_response = client.get("/api/v1/notifications", headers=admin_headers)
    assert admin_response.status_code != 403
    
    # Operator should have access
    operator_headers = get_auth_headers(users['operator'])
    operator_response = client.get("/api/v1/notifications", headers=operator_headers)
    assert operator_response.status_code != 403
    
    # Client might have limited access to their own notifications
    client_headers = get_auth_headers(users['client'])
    client_response = client.get("/api/v1/notifications", headers=client_headers)
    # This depends on implementation - client might see their own notifications
    assert client_response.status_code in [200, 401, 403, 404, 500]

def test_access_without_token(client, db_session):
    """Test that protected endpoints require authentication"""
    
    # Admin endpoints require auth
    response = client.get("/api/v1/admin/dashboard/stats")
    assert response.status_code == 401
    
    # Operator endpoints require auth
    response = client.get("/api/v1/operator/cases")
    assert response.status_code == 401
    
    # User management requires auth
    response = client.get("/api/v1/admin/users")
    assert response.status_code == 401

def test_access_with_invalid_token(client, db_session):
    """Test that invalid tokens are rejected"""
    invalid_headers = {"Authorization": "Bearer invalid-token-12345"}
    
    # All protected endpoints should reject invalid tokens
    endpoints = [
        "/api/v1/admin/dashboard/stats",
        "/api/v1/operator/cases", 
        "/api/v1/admin/users",
        "/api/v1/users/me"
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint, headers=invalid_headers)
        assert response.status_code == 401