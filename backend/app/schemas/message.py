from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.message_log import Channel, MessageStatus


class TemplateCreate(BaseModel):
    event_id: int
    channel: str
    name: str
    body: str


class TemplateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    channel: str
    name: str
    body: str
    created_at: datetime


class SendRequest(BaseModel):
    winner_ids: list[int]
    template_id: int


class SendResult(BaseModel):
    winner_id: int
    status: MessageStatus
    error_msg: str | None = None


class MessageLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    winner_id: int
    channel: Channel
    status: MessageStatus
    error_msg: str | None
    sent_at: datetime
