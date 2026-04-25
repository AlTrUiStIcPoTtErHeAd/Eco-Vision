import os
import tempfile
import uuid
from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import UploadFile

from app.models.post import PostInDB, PostResponse
from app.utils.db import get_database


POSTS_COLLECTION = "posts"
USERS_COLLECTION = "users"
POST_IMAGES_DIR = os.path.join(tempfile.gettempdir(), "ecovision_posts")


def _ensure_post_images_dir() -> None:
    os.makedirs(POST_IMAGES_DIR, exist_ok=True)


def _save_uploaded_image(upload: UploadFile, prefix: str) -> str:
    _ensure_post_images_dir()
    ext = os.path.splitext(upload.filename or "")[1].lower() or ".jpg"
    file_name = f"{prefix}_{uuid.uuid4().hex}{ext}"
    target_path = os.path.join(POST_IMAGES_DIR, file_name)

    upload.file.seek(0)
    with open(target_path, "wb") as image_file:
        image_file.write(upload.file.read())

    return target_path


def create_post(
    user_id: str,
    before_image: UploadFile,
    after_image: UploadFile,
    waste_type: str,
    recycled: bool,
) -> PostResponse:
    db = get_database()
    posts_collection = db[POSTS_COLLECTION]
    users_collection = db[USERS_COLLECTION]

    before_image_path = _save_uploaded_image(before_image, "before")
    after_image_path = _save_uploaded_image(after_image, "after")
    timestamp = datetime.now(timezone.utc)

    post = PostInDB(
        user_id=user_id,
        before_image_path=before_image_path,
        after_image_path=after_image_path,
        waste_type=waste_type,
        recycled=recycled,
        timestamp=timestamp,
    )

    inserted = posts_collection.insert_one(post.model_dump(exclude={"id"}))

    points_increment = 10 if recycled else 2
    co2_increment = 0.5 if recycled else 0.0
    try:
        user_query = {"_id": ObjectId(user_id)}
    except (InvalidId, TypeError):
        user_query = {"_id": user_id}

    users_collection.update_one(
        user_query,
        {"$inc": {"points": points_increment, "co2_saved": co2_increment}},
    )

    return PostResponse(
        id=str(inserted.inserted_id),
        user_id=user_id,
        before_image_path=before_image_path,
        after_image_path=after_image_path,
        waste_type=waste_type,
        recycled=recycled,
        timestamp=timestamp,
    )


def get_all_posts() -> List[PostResponse]:
    db = get_database()
    posts_collection = db[POSTS_COLLECTION]

    posts: List[PostResponse] = []
    for record in posts_collection.find().sort("timestamp", -1):
        posts.append(
            PostResponse(
                id=str(record["_id"]),
                user_id=record["user_id"],
                before_image_path=record["before_image_path"],
                after_image_path=record["after_image_path"],
                waste_type=record["waste_type"],
                recycled=record["recycled"],
                timestamp=record["timestamp"],
            )
        )

    return posts
