import enum

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RedemptionStatus(str, enum.Enum):
    issued = "issued"
    redeemed = "redeemed"
    expired = "expired"


class Redemption(Base):
    __tablename__ = "redemption"

    id: Mapped[int] = mapped_column(primary_key=True)
    winner_id: Mapped[int] = mapped_column(ForeignKey("winner.id"), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    prize_name: Mapped[str] = mapped_column(String(200), nullable=False)
    gift_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[RedemptionStatus] = mapped_column(Enum(RedemptionStatus), default=RedemptionStatus.issued)
    issued_at: Mapped["DateTime"] = mapped_column(DateTime, nullable=True)
    redeemed_at: Mapped["DateTime"] = mapped_column(DateTime, nullable=True)
    redeemed_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    expires_at: Mapped["DateTime"] = mapped_column(DateTime, nullable=True)

    winner: Mapped["Winner"] = relationship(back_populates="redemption")
