from fastapi import APIRouter, HTTPException, status

from app.models.user import AuthResponse, UserLoginRequest, UserSignupRequest
from app.services.auth_service import login_user, signup_user


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignupRequest) -> AuthResponse:
    try:
        result = signup_user(
            name=payload.name,
            email=payload.email,
            password=payload.password,
            is_admin=payload.is_admin,
        )
        return AuthResponse(**result)
    except HTTPException as exc:
        raise exc


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLoginRequest) -> AuthResponse:
    try:
        result = login_user(email=payload.email, password=payload.password)
        return AuthResponse(**result)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            ) from exc
        raise exc


@router.post("/admin/login", response_model=AuthResponse)
def admin_login(payload: UserLoginRequest) -> AuthResponse:
    try:
        result = login_user(
            email=payload.email,
            password=payload.password,
            admin_only=True,
        )
        return AuthResponse(**result)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            ) from exc
        if exc.status_code == status.HTTP_403_FORBIDDEN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized access",
            ) from exc
        raise exc
