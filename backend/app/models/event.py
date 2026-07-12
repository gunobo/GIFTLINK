import enum

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EventStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    closed = "closed"


class Event(Base):
    __tablename__ = "event"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus), default=EventStatus.draft, nullable=False
    )
    created_at: Mapped["DateTime"] = mapped_column(DateTime, server_default=func.now())

    winners: Mapped[list["Winner"]] = relationship(back_populates="event", cascade="all, delete-orphan")
