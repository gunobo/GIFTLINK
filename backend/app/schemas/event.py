from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.event import EventStatus


class EventCreate(BaseModel):
    name: str


class EventUpdate(BaseModel):
    name: str | None = None
    status: EventStatus | None = None


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    status: EventStatus
    created_at: datetime
