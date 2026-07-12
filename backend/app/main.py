import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models.admin import Admin
from app.routers import auth, events, messages, redemption, winners

logger = logging.getLogger("giftlink")

_DEFAULT_SECRETS = {
    "jwt_secret": "change-me-to-a-long-random-string",
    "admin_password": "change-me",
}


def _warn_if_default_secrets() -> None:
    """배포 시 .env를 안 채우고 예시 기본값 그대로 뜬 경우를 눈에 띄게 경고한다."""
    for field, default in _DEFAULT_SECRETS.items():
        if getattr(settings, field) == default:
            logger.warning(
                "⚠️  %s가 예시 기본값(%s)입니다. 프로덕션 배포 전 반드시 .env에서 값을 변경하세요.",
                field.upper(),
                default,
            )


def _seed_admin() -> None:
    db = SessionLocal()
    try:
        if not db.query(Admin).filter(Admin.username == settings.admin_username).first():
            db.add(Admin(username=settings.admin_username, password_hash=hash_password(settings.admin_password)))
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _warn_if_default_secrets()
    Base.metadata.create_all(bind=engine)
    _seed_admin()
    yield


app = FastAPI(title="GIFTLINK API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.public_base_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(winners.router)
app.include_router(messages.router)
app.include_router(redemption.router)


@app.get("/health")
def health():
    return {"status": "ok"}
