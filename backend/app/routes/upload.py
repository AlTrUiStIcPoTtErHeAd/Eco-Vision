import os
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile, status


router = APIRouter(tags=["Upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")

# Allowed MIME types for image uploads
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def _ensure_upload_dir() -> None:
    """Create the uploads directory if it does not exist."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/image", status_code=status.HTTP_200_OK)
async def upload_image(file: UploadFile = File(None)):
    """
    Upload a single image file.

    Accepts JPEG / PNG images only. Saves to the local ``uploads/`` directory
    and returns the public URL path for the uploaded file.
    """

    # --- Validation: file must be provided ---
    if file is None or file.filename is None or file.filename == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File upload required",
        )

    # --- Validation: must be an image type ---
    ext = os.path.splitext(file.filename)[1].lower()
    content_type = (file.content_type or "").lower()

    is_valid_type = content_type in ALLOWED_CONTENT_TYPES
    is_valid_ext = ext in ALLOWED_EXTENSIONS

    if not (is_valid_type or is_valid_ext):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type",
        )

    # --- Save the file ---
    _ensure_upload_dir()

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    with open(file_path, "wb") as f:
        f.write(contents)

    return {
        "filename": unique_filename,
        "file_url": f"/uploads/{unique_filename}",
    }