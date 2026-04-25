from typing import List

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile, status

from app.models.post import PostResponse
from app.services.post_service import create_post, get_all_posts
from app.utils.auth import AuthTokenError, decode_access_token_strict


router = APIRouter(prefix="/posts", tags=["Posts"])


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


@router.post("/create", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post_endpoint(
    before_image: UploadFile | None = File(None),
    after_image: UploadFile | None = File(None),
    waste_type: str | None = Form(None),
    recycled: bool | None = Form(None),
    authorization: str = Header(...),
) -> PostResponse:
    if before_image is None or after_image is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File upload required",
        )

    allowed_extensions = (".jpg", ".jpeg", ".png", ".webp")
    if not (before_image.filename or "").lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are supported for before_image.",
        )
    if not (after_image.filename or "").lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are supported for after_image.",
        )

    if waste_type is None or not waste_type.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="waste_type is required.",
        )
    if recycled is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="recycled is required.",
        )

    user_id = _extract_user_id_from_auth_header(authorization)
    return create_post(
        user_id=user_id,
        before_image=before_image,
        after_image=after_image,
        waste_type=waste_type.strip(),
        recycled=recycled,
    )


@router.get("", response_model=List[PostResponse], status_code=status.HTTP_200_OK)
def get_posts_endpoint() -> List[PostResponse]:
    return get_all_posts()
