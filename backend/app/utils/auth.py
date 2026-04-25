import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError


JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "60"))


class AuthTokenError(Exception):
    pass


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed_password.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(
    payload: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    data = payload.copy()
    expire_at = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=JWT_EXPIRES_MINUTES)
    )
    data.update({"exp": expire_at})
    return jwt.encode(data, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        decoded_payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
        return decoded_payload
    except (ExpiredSignatureError, InvalidTokenError):
        return None


def decode_access_token_strict(token: str) -> Dict[str, Any]:
    if not token:
        raise AuthTokenError("Token missing or invalid")

    try:
        return jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
    except ExpiredSignatureError as exc:
        raise AuthTokenError("Token expired") from exc
    except InvalidTokenError as exc:
        raise AuthTokenError("Token missing or invalid") from exc
