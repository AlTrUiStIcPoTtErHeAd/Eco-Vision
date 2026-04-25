from fastapi import APIRouter, Header, HTTPException, status

from app.models.user import UserStatsResponse
from app.services.user_service import get_user_stats
from app.utils.auth import AuthTokenError, decode_access_token_strict


router = APIRouter(tags=["User"])


def _extract_user_id_from_auth_header(authorization: str) -> str:
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

    if "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing or invalid")

    return str(payload["sub"])


@router.get("/stats", response_model=UserStatsResponse, status_code=status.HTTP_200_OK)
def get_user_stats_endpoint(authorization: str = Header(...)) -> UserStatsResponse:
    user_id = _extract_user_id_from_auth_header(authorization)
    return UserStatsResponse(**get_user_stats(user_id))
