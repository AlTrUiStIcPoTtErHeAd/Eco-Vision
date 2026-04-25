from datetime import datetime, timedelta, timezone
from typing import Dict, List

from bson import ObjectId
from bson.errors import InvalidId

from app.utils.db import get_database


USERS_COLLECTION = "users"
POSTS_COLLECTION = "posts"


def get_users_count() -> Dict[str, int]:
    db = get_database()
    users_collection = db[USERS_COLLECTION]
    return {"users_count": users_collection.count_documents({})}


def get_total_co2_saved() -> Dict[str, float]:
    db = get_database()
    users_collection = db[USERS_COLLECTION]

    pipeline = [
        {
            "$group": {
                "_id": None,
                "total_co2_saved": {"$sum": {"$ifNull": ["$co2_saved", 0]}},
            }
        }
    ]
    result = list(users_collection.aggregate(pipeline))
    total = float(result[0]["total_co2_saved"]) if result else 0.0
    return {"total_co2_saved": total}


def get_activity() -> Dict[str, int]:
    db = get_database()
    posts_collection = db[POSTS_COLLECTION]

    total_posts = posts_collection.count_documents({})

    recent_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    recent_posts = posts_collection.count_documents({"timestamp": {"$gte": recent_cutoff}})

    return {
        "total_posts": total_posts,
        "recent_posts": recent_posts,
    }


def delete_post_by_id(post_id: str) -> Dict[str, str]:
    db = get_database()
    posts_collection = db[POSTS_COLLECTION]

    try:
        object_id = ObjectId(post_id)
    except (InvalidId, TypeError) as exc:
        raise ValueError("Invalid post id.") from exc

    result = posts_collection.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise ValueError("Post not found.")

    return {"message": "Post deleted successfully."}


def list_users() -> List[Dict[str, object]]:
    db = get_database()
    users_collection = db[USERS_COLLECTION]

    users: List[Dict[str, object]] = []
    for record in users_collection.find().sort("_id", -1):
        users.append(
            {
                "id": str(record.get("_id")),
                "email": record.get("email", ""),
                "name": record.get("name", ""),
                "is_admin": bool(record.get("is_admin", False)),
                "created_at": record.get("created_at"),
            }
        )
    return users


def delete_user_by_id(user_id: str) -> Dict[str, str]:
    db = get_database()
    users_collection = db[USERS_COLLECTION]

    try:
        object_id = ObjectId(user_id)
        query = {"_id": object_id}
    except (InvalidId, TypeError):
        query = {"_id": user_id}

    result = users_collection.delete_one(query)
    if result.deleted_count == 0:
        raise ValueError("User not found.")

    return {"message": "User deleted successfully."}
