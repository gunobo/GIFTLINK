from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.winner import WinnerSource


class WinnerCreate(BaseModel):
    event_id: int
    name: str
    phone: str | None = None
    email: str | None = None
    discord_id: str | None = None
    slack_webhook: str | None = None


class WinnerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    discord_id: str | None = None
    slack_webhook: str | None = None


class WinnerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    name: str
    phone: str | None
    email: str | None
    discord_id: str | None
    slack_webhook: str | None
    source: WinnerSource
    created_at: datetime


class CsvColumnMapping(BaseModel):
    """CSV 헤더 -> 모델 필드 매핑 (예: {"이름": "name", "연락처": "phone"})"""

    name: str
    phone: str | None = None
    email: str | None = None
    discord_id: str | None = None
    slack_webhook: str | None = None


class CsvUploadResult(BaseModel):
    created: int
    skipped: int
    errors: list[str] = []
