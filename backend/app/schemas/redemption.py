from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.redemption import RedemptionStatus


class RedemptionIssueRequest(BaseModel):
    winner_id: int
    prize_name: str
    gift_url: str | None = None
    gift_code: str | None = None
    expires_at: datetime | None = None


class RedemptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    winner_id: int
    code: str
    token: str
    prize_name: str
    gift_url: str | None
    gift_code: str | None
    status: RedemptionStatus
    issued_at: datetime | None
    redeemed_at: datetime | None
    redeemed_by: str | None
    expires_at: datetime | None


class GiftInfoUpdateRequest(BaseModel):
    gift_url: str | None = None
    gift_code: str | None = None


class RedeemPageOut(BaseModel):
    """당첨자용 교환 페이지 데이터"""

    code: str
    prize_name: str
    gift_url: str | None
    gift_code: str | None
    status: RedemptionStatus
    qr_data_url: str
    expires_at: datetime | None


class RedeemUseRequest(BaseModel):
    redeemed_by: str


class RedeemConfirmRequest(BaseModel):
    redeemed_by: str = "온라인(QR) 확정"
