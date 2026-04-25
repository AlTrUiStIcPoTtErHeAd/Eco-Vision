from typing import Dict

from bson import ObjectId
from bson.errors import InvalidId

from app.utils.db import get_database


USERS_COLLECTION = "users"
POSTS_COLLECTION = "posts"


def get_user_stats(user_id: str) -> Dict[str, float]:
    db = get_database()
    users_collection = db[USERS_COLLECTION]
    posts_collection = db[POSTS_COLLECTION]

    total_posts = posts_collection.count_documents({"user_id": user_id})

    user = None
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except (InvalidId, TypeError):
        user = users_collection.find_one({"_id": user_id})

    total_points = 0
    total_co2_saved = 0.0
    if user:
        total_points = int(user.get("points", 0))
        total_co2_saved = float(user.get("co2_saved", 0.0))

    return {
        "total_posts": total_posts,
        "total_points": total_points,
        "total_co2_saved": total_co2_saved,
    }
