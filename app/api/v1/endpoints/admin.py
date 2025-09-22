from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.case import Case
from app.models.payment import Payment
from app.models.notification import Notification
from app.models.kancelaria import Kancelaria
from app.api.v1.endpoints.auth import require_admin
from pydantic import BaseModel, EmailStr
from app.services.auth_service import AuthService

router = APIRouter()

# Response schemas
class DashboardStats(BaseModel):
    users: dict
    lawFirms: dict
    subscriptions: dict
    apiUsage: dict

class RecentActivity(BaseModel):
    id: str
    type: str
    description: str
    timestamp: str
    user: Optional[dict] = None

class UserManagement(BaseModel):
    id: int
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]

class UserRoleUpdate(BaseModel):
    role: UserRole

class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole = UserRole.CLIENT

class UserLookupResponse(BaseModel):
    id: int
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for admin panel"""
    
    # User statistics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Users by role
    role_counts = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    users_by_role = {
        "clients": 0,
        "operators": 0,
        "admins": 0,
        "lawyers": 0
    }
    
    for role, count in role_counts:
        role_name = role.value if hasattr(role, 'value') else str(role)
        if role_name == "client":
            users_by_role["clients"] = count
        elif role_name == "operator":
            users_by_role["operators"] = count
        elif role_name == "admin":
            users_by_role["admins"] = count
        else:
            users_by_role["lawyers"] += count

    # New users this month
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_users_this_month = db.query(User).filter(User.created_at >= month_start).count()

    # Law firms statistics (defensive if table missing)
    try:
        total_law_firms = db.query(Kancelaria).count()
        active_law_firms = db.query(Kancelaria).filter(Kancelaria.is_active == True).count()
        verified_law_firms = db.query(Kancelaria).filter(Kancelaria.is_verified == True).count()
        new_law_firms_this_month = db.query(Kancelaria).filter(Kancelaria.created_at >= month_start).count()
    except Exception:
        total_law_firms = active_law_firms = verified_law_firms = new_law_firms_this_month = 0

    # Payment/subscription statistics (defensive)
    try:
        total_payments = db.query(Payment).count()
        active_subscriptions = db.query(Payment).filter(Payment.status == "PAID").count()
        revenue_query = db.query(func.sum(Payment.amount)).filter(Payment.status == "PAID").scalar()
        total_revenue = float(revenue_query) if revenue_query else 0.0
    except Exception:
        total_payments = active_subscriptions = 0
        total_revenue = 0.0

    # API usage (simplified - using case creation as proxy)
    today = datetime.now().date()
    try:
        today_cases = db.query(Case).filter(func.date(Case.created_at) == today).count()
        total_cases = db.query(Case).count()
    except Exception:
        today_cases = total_cases = 0

    return DashboardStats(
        users={
            "total": total_users,
            "active": active_users,
            "newThisMonth": new_users_this_month,
            "byRole": users_by_role
        },
        lawFirms={
            "total": total_law_firms,
            "active": active_law_firms,
            "verified": verified_law_firms,
            "newThisMonth": new_law_firms_this_month
        },
        subscriptions={
            "total": total_payments,
            "active": active_subscriptions,
            "trial": 0,  # Placeholder
            "revenue": total_revenue
        },
        apiUsage={
            "totalCalls": total_cases,
            "todayCalls": today_cases,
            "avgResponseTime": 150  # Placeholder
        }
    )

@router.get("/dashboard/activity", response_model=dict)
async def get_recent_activity(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get recent activity for admin dashboard"""
    
    activities = []
    
    # Recent user registrations
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()
    for user in recent_users:
        activities.append({
            "id": f"user_{user.id}",
            "type": "user_registered",
            "description": f"Nowy użytkownik zarejestrowany",
            "timestamp": user.created_at.isoformat(),
            "user": {
                "name": f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email,
                "email": user.email,
                "avatar": None
            }
        })
    
    # Recent cases
    recent_cases = db.query(Case).order_by(Case.created_at.desc()).limit(5).all()
    for case in recent_cases:
        user = case.user
        activities.append({
            "id": f"case_{case.id}",
            "type": "api_call",
            "description": f"Nowa sprawa utworzona: {case.title}",
            "timestamp": case.created_at.isoformat(),
            "user": {
                "name": f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email,
                "email": user.email,
                "avatar": None
            }
        })
    
    # Sort by timestamp
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {"activities": activities[:10]}

@router.get("/users", response_model=List[UserManagement])
async def get_all_users(
    limit: int = 100,
    offset: int = 0,
    role_filter: Optional[UserRole] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all users for admin management"""
    
    query = db.query(User)
    
    if role_filter:
        query = query.filter(User.role == role_filter)
    
    users = query.offset(offset).limit(limit).all()
    
    return [
        UserManagement(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role.value if hasattr(user.role, 'value') else str(user.role),
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login=user.last_login
        )
        for user in users
    ]

@router.get("/users/search", response_model=Optional[UserLookupResponse])
async def search_user(
    email: EmailStr,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Find user by email (admin only). Returns null if not found."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    return UserLookupResponse(id=user.id, email=user.email, first_name=user.first_name, last_name=user.last_name)

@router.post("/users", response_model=UserManagement, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: CreateUserRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new user (admin only)."""
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed = AuthService.get_password_hash(body.password) if body.password else None
    user = User(
        email=body.email,
        first_name=body.first_name,
        last_name=body.last_name,
        hashed_password=hashed,
        role=body.role,
        is_active=True,
        is_verified=True,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserManagement(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role),
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        last_login=user.last_login,
    )

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user role (admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = role_update.role
    db.commit()
    
    return {"message": f"User role updated to {role_update.role.value}"}

@router.put("/users/{user_id}/status")
async def toggle_user_status(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Toggle user active status (admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}"}

@router.get("/cases", response_model=List[dict])
async def get_all_cases(
    limit: int = 100,
    offset: int = 0,
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all cases for admin oversight"""
    
    query = db.query(Case).join(User)
    
    if status_filter:
        query = query.filter(Case.status == status_filter)
    
    cases = query.offset(offset).limit(limit).all()
    
    return [
        {
            "id": case.id,
            "title": case.title,
            "status": case.status.value if hasattr(case.status, 'value') else str(case.status),
            "created_at": case.created_at.isoformat(),
            "client_name": f"{case.user.first_name or ''} {case.user.last_name or ''}".strip() or case.user.email,
            "client_email": case.user.email,
            "operator_id": case.operator_id,
            "package_type": case.package_type.value if case.package_type and hasattr(case.package_type, 'value') else str(case.package_type) if case.package_type else None
        }
        for case in cases
    ]

@router.get("/statistics")
async def get_detailed_statistics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get detailed system statistics"""
    
    # Performance metrics
    return {
        "database_connections": 1,  # Placeholder
        "active_sessions": 1,  # Placeholder  
        "memory_usage": "45%",  # Placeholder
        "cpu_usage": "23%",  # Placeholder
        "uptime": "99.9%"  # Placeholder
    }