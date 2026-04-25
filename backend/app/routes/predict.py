"""
/predict endpoint — accepts an uploaded image and returns a waste classification.

Flow:
    POST /predict  (multipart/form-data, field name: "file")
    → validate file
    → read bytes
    → ml_service.predict_waste_from_bytes()
    → return JSON prediction
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.services.ml_service import predict_waste_from_bytes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predict", tags=["Prediction"])

ALLOWED_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("", status_code=status.HTTP_200_OK)
async def predict(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Classify waste from an uploaded image.

    - **file**: JPEG / PNG / WebP image (max 10 MB)

    Returns:
        ```json
        {
          "filename":              "photo.jpg",
          "waste_type":            "plastic",
          "confidence":            0.9341,
          "recyclable":            true,
          "disposal_instructions": "Rinse and place in the plastics bin.",
          "ideas":                 ["Reuse container for storage", ...]
        }
        ```
    """
    # ── Validate presence ────────────────────────────────────────────────────
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File upload required.",
        )

    # ── Validate extension ───────────────────────────────────────────────────
    fname = file.filename or ""
    if not fname.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # ── Read bytes ───────────────────────────────────────────────────────────
    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image is empty.",
        )

    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image exceeds 10 MB limit.",
        )

    # ── Validate that PIL can open it (catches corrupt images) ───────────────
    try:
        from PIL import Image
        import io
        Image.open(io.BytesIO(contents)).verify()
    except Exception as exc:
        logger.warning("Corrupt or unreadable image uploaded: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot read image — file may be corrupt or not a valid image.",
        ) from exc

    # ── Run prediction ───────────────────────────────────────────────────────
    logger.info("➡️  /predict called — file=%s  size=%d bytes", fname, len(contents))
    try:
        prediction = predict_waste_from_bytes(contents)
    except FileNotFoundError as exc:
        logger.error("Model file missing: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model is not available. Please contact the administrator.",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error during prediction: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed due to an internal error.",
        ) from exc

    logger.info(
        "✅ /predict → waste_type=%s  confidence=%.4f",
        prediction.get("waste_type"), prediction.get("confidence"),
    )

    return {"filename": fname, **prediction}
