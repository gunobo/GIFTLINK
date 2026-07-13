import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.event import Event, EventStatus
from app.models.winner import Winner
from app.routers.redemption import _maybe_expire
from app.schemas.public import LookupResult, PublicEventOut

router = APIRouter(prefix="/public", tags=["public"])


def _normalize_phone(phone: str) -> str:
    return re.sub(r"\D", "", phone)


@router.get("/events", response_model=list[PublicEventOut])
def list_active_events(db: Session = Depends(get_db)):
    """랜딩 페이지에 노출할 진행 중인 이벤트 목록. 비공개 상태(draft/closed)는 제외한다."""
    return db.query(Event).filter(Event.status == EventStatus.active).order_by(Event.created_at.desc()).all()


@router.get("/lookup", response_model=list[LookupResult])
def lookup_my_prizes(name: str, phone: str, db: Session = Depends(get_db)):
    """비밀번호 없이 이름+연락처 일치로만 본인 당첨 현황을 조회한다.

    관리자가 발송하는 메시지에 담기는 정보와 동일한 수준(코드/링크)만 노출하므로,
    이름+연락처를 아는 것 자체가 이미 메시지를 받을 수 있는 사람과 동등한 신뢰 수준이다.
    """
    target_name = name.strip()
    target_phone = _normalize_phone(phone)
    if not target_name or not target_phone:
        raise HTTPException(status_code=400, detail="이름과 연락처를 입력해주세요.")

    candidates = db.query(Winner).filter(Winner.name == target_name).all()
    matches = [w for w in candidates if w.phone and _normalize_phone(w.phone) == target_phone]

    results: list[LookupResult] = []
    for winner in matches:
        event = db.get(Event, winner.event_id)
        if not event:
            continue
        if winner.redemption:
            redemption = _maybe_expire(db, winner.redemption)
            results.append(
                LookupResult(
                    event_name=event.name,
                    prize_name=redemption.prize_name,
                    status=redemption.status.value,
                    token=redemption.token,
                )
            )
        else:
            results.append(LookupResult(event_name=event.name, prize_name=None, status="pending", token=None))

    return results
