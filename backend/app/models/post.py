from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PostInDB(BaseModel):
    id: Optional[str] = None
    user_id: str
    before_image_path: str
    after_image_path: str
    waste_type: str = Field(..., min_length=1, max_length=100)
    recycled: bool
    timestamp: datetime


class PostResponse(BaseModel):
    id: str
    user_id: str
    before_image_path: str
    after_image_path: str
    waste_type: str
    recycled: bool
    timestamp: datetime


class CreatePostRequestValidation(BaseModel):
    waste_type: str = Field(..., min_length=1, max_length=100)
    recycled: bool
