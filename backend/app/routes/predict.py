from typing import Any, Dict

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.services.ml_service import predict_waste


router = APIRouter(prefix="/predict", tags=["Prediction"])


@router.post("", status_code=status.HTTP_200_OK)
async def predict(file: UploadFile = File(...)) -> Dict[str, Any]:
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File upload required",
        )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File upload required",
        )

    allowed_extensions = (".jpg", ".jpeg", ".png", ".webp")
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are supported: .jpg, .jpeg, .png, .webp",
        )

    # Read to validate a non-empty upload; contents are not used in mock mode.
    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image is empty.",
        )

    prediction = predict_waste(file_name=file.filename)
    return {
        "filename": file.filename,
        **prediction,
    }
