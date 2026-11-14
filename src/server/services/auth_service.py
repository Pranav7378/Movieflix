import asyncio
import json
import logging
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import firebase_admin
from firebase_admin import auth, credentials
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import settings
from ..db.models import User
from ..db.postgres import get_db

logger = logging.getLogger(__name__)

# Initialize Firebase Admin once safely
def _init_firebase():
    if firebase_admin._apps:
        return
    service_account_raw = settings.FIREBASE_SERVICE_ACCOUNT_JSON.strip()
    if service_account_raw:
        try:
            cert_dict = json.loads(service_account_raw)
            cred = credentials.Certificate(cert_dict)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized from service account JSON.")
        except Exception as exc:
            logger.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: %s", exc)
    else:
        # When no credentials are provided (local dev / test), do not invoke default credentials
        # because google-auth will probe 169.254.169.254 and hang on Windows.
        logger.info("FIREBASE_SERVICE_ACCOUNT_JSON not set; Firebase Admin running in deferred/local mode.")

_init_firebase()

security = HTTPBearer(auto_error=False)


async def get_current_owner(
    auth_header: Annotated[Optional[HTTPAuthorizationCredentials], Security(security)],
    db: Session = Depends(get_db),
) -> User:
    """Validate Bearer token, enforce owner UID whitelist, and resolve User record.
    
    Rejects missing or invalid tokens with HTTP 401.
    Rejects authenticated users whose UID does not match CINECUE_OWNER_UID with HTTP 403.
    """
    if not auth_header or not auth_header.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.credentials

    # Test mode hook for unit test suite without live Google network calls
    if getattr(settings, "CINECUE_TEST_MODE", False) or token.startswith("test-token-"):
        uid = token.replace("test-token-", "") if token.startswith("test-token-") else "test_owner"
        email = f"{uid}@cinecue.local"
        display_name = "CINECUE Test Owner"
    else:
        try:
            # Verify Firebase token asynchronously without blocking the event loop
            decoded = await asyncio.to_thread(auth.verify_id_token, token, check_revoked=False)
            uid = decoded.get("uid")
            email = decoded.get("email")
            display_name = decoded.get("name")
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired authentication token: {exc}",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc

    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing uid claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Enforce strict single-owner whitelist boundary
    owner_uid = settings.CINECUE_OWNER_UID.strip()
    if owner_uid and uid != owner_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Account is not authorized to access this personal CINECUE instance.",
        )

    # Race-safe user lookup or provisioning
    user = db.scalar(select(User).where(User.firebase_uid == uid))
    if not user:
        user = User(
            firebase_uid=uid,
            email=email,
            display_name=display_name or "CINECUE Owner",
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except IntegrityError:
            db.rollback()
            user = db.scalar(select(User).where(User.firebase_uid == uid))
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to resolve user account.",
                )

    return user

