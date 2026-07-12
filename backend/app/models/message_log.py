import enum

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Channel(str, enum.Enum):
    kakao = "kakao"
    sms = "sms"
    email = "email"
    webhook = "webhook"


class MessageStatus(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"


class MessageLog(Base):
    __tablename__ = "message_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    winner_id: Mapped[int] = mapped_column(ForeignKey("winner.id"), nullable=False)
    channel: Mapped[Channel] = mapped_column(Enum(Channel), nullable=False)
    status: Mapped[MessageStatus] = mapped_column(Enum(MessageStatus), default=MessageStatus.pending)
    error_msg: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped["DateTime"] = mapped_column(DateTime, server_default=func.now())

    winner: Mapped["Winner"] = relationship(back_populates="message_logs")
