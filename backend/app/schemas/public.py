from pydantic import BaseModel


class PublicEventOut(BaseModel):
    id: int
    name: str


class LookupResult(BaseModel):
    event_name: str
    prize_name: str | None
    status: str  # "pending" | RedemptionStatus 값 (issued/redeemed/expired)
    token: str | None
