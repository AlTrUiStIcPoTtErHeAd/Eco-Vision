from typing import Dict

from fastapi import APIRouter, Header, HTTPException, Path, status

from app.services.admin_service import (
    delete_post_by_id,
    delete_user_by_id,
    get_activity,
    get_total_co2_saved,
    get_users_count,
    list_users,
)
from app.utils.auth import AuthTokenError, decode_access_token_strict


router = APIRouter(tags=["Admin"])


def _extract_admin_payload(authorization: str) -> Dict:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing or invalid",
        )

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing or invalid",
        )

    try:
        payload = decode_access_token_strict(parts[1].strip())
    except AuthTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    # Support either explicit role claim or existing is_admin boolean.
    role = payload.get("role")
    is_admin = bool(payload.get("is_admin"))
    if role != "admin" and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access",
        )

    return payload


@router.get("/users-count", status_code=status.HTTP_200_OK)
def users_count_endpoint(authorization: str = Header(...)) -> Dict[str, int]:
    _extract_admin_payload(authorization)
    return get_users_count()


@router.get("/co2-saved", status_code=status.HTTP_200_OK)
def co2_saved_endpoint(authorization: str = Header(...)) -> Dict[str, float]:
    _extract_admin_payload(authorization)
    return get_total_co2_saved()


@router.get("/activity", status_code=status.HTTP_200_OK)
def activity_endpoint(authorization: str = Header(...)) -> Dict[str, int]:
    _extract_admin_payload(authorization)
    return get_activity()


@router.delete("/post/{id}", status_code=status.HTTP_200_OK)
def delete_post_endpoint(
    id: str = Path(...),
    authorization: str = Header(...),
) -> Dict[str, str]:
    _extract_admin_payload(authorization)
    try:
        return delete_post_by_id(id)
    except ValueError as exc:
        detail = str(exc)
        if detail == "Post not found.":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc


@router.get("/users", status_code=status.HTTP_200_OK)
def list_users_endpoint(authorization: str = Header(...)) -> Dict[str, object]:
    _extract_admin_payload(authorization)
    return {"users": list_users()}


@router.delete("/users/{id}", status_code=status.HTTP_200_OK)
def delete_user_endpoint(
    id: str = Path(...),
    authorization: str = Header(...),
) -> Dict[str, str]:
    _extract_admin_payload(authorization)
    try:
        return delete_user_by_id(id)
    except ValueError as exc:
        detail = str(exc)
        if detail == "User not found.":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
