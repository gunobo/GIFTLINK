import enum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WinnerSource(str, enum.Enum):
    csv = "csv"
    manual = "manual"


class Winner(Base):
    """이벤트 참여자 명단. 업로드/입력 시점에는 전원 참여자이고,
    관리자가 `is_winner`를 True로 지정한 사람만 실제 당첨자로 취급한다
    (발송/교환 대상은 항상 is_winner=True로 필터링)."""

    __tablename__ = "winner"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("event.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    discord_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    slack_webhook: Mapped[str | None] = mapped_column(String(200), nullable=True)
    source: Mapped[WinnerSource] = mapped_column(Enum(WinnerSource), default=WinnerSource.manual)
    is_winner: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    selected_at: Mapped["DateTime"] = mapped_column(DateTime, nullable=True)
    created_at: Mapped["DateTime"] = mapped_column(DateTime, server_default=func.now())

    event: Mapped["Event"] = relationship(back_populates="winners")
    message_logs: Mapped[list["MessageLog"]] = relationship(back_populates="winner", cascade="all, delete-orphan")
    redemption: Mapped["Redemption"] = relationship(back_populates="winner", uselist=False, cascade="all, delete-orphan")
