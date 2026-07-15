import logging
from contextlib import asynccontextmanager
from pathlib import Path

from alembic.config import Config as AlembicConfig
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.security import hash_password
from app.database import SessionLocal, engine
from app.models.admin import Admin
from app.routers import auth, events, messages, public, redemption, winners

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


def _warn_if_pending_migrations() -> None:
    """DB 스키마 관리는 alembic이 전담한다 (create_all 안 씀).

    git pull 이후 `alembic upgrade head`를 깜빡하면 컬럼 누락으로 500이 터지는데,
    그 원인을 바로 알 수 있게 기동 시점에 눈에 띄게 경고한다.
    """
    try:
        alembic_cfg = AlembicConfig(str(Path(__file__).resolve().parent.parent / "alembic.ini"))
        head = ScriptDirectory.from_config(alembic_cfg).get_current_head()
        with engine.connect() as conn:
            current = MigrationContext.configure(conn).get_current_revision()
        if current != head:
            logger.warning(
                "⚠️  DB 마이그레이션이 최신이 아닙니다 (현재: %s / 최신: %s). "
                "`docker compose exec backend alembic upgrade head`를 실행하세요.",
                current,
                head,
            )
    except Exception as exc:  # noqa: BLE001 - 상태 확인 실패는 기동을 막지 않는다
        logger.warning("⚠️  마이그레이션 상태 확인에 실패했습니다: %s", exc)


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
    _warn_if_pending_migrations()
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
app.include_router(public.router)


@app.get("/health")
def health():
    return {"status": "ok"}
