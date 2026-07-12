import base64
import io
import secrets
import string
from datetime import datetime

import qrcode
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import get_current_admin
from app.database import get_db
from app.models.redemption import Redemption, RedemptionStatus
from app.models.winner import Winner
from app.schemas.redemption import (
    RedeemConfirmRequest,
    RedeemPageOut,
    RedeemUseRequest,
    RedemptionIssueRequest,
    RedemptionOut,
)

router = APIRouter(tags=["redemption"])

CODE_ALPHABET = string.ascii_uppercase + string.digits


def _generate_code() -> str:
    part1 = "".join(secrets.choice(CODE_ALPHABET) for _ in range(4))
    part2 = "".join(secrets.choice(CODE_ALPHABET) for _ in range(4))
    return f"{part1}-{part2}"


def _generate_token() -> str:
    return secrets.token_urlsafe(48)[:64]


def _qr_data_url(token: str) -> str:
    url = f"{settings.public_base_url}/redeem/{token}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{encoded}"


@router.post("/redemption/issue", response_model=RedemptionOut, dependencies=[Depends(get_current_admin)])
def issue_redemption(payload: RedemptionIssueRequest, db: Session = Depends(get_db)):
    winner = db.get(Winner, payload.winner_id)
    if not winner:
        raise HTTPException(status_code=404, detail="당첨자를 찾을 수 없습니다.")
    if winner.redemption:
        raise HTTPException(status_code=409, detail="이미 교환 코드가 발급된 당첨자입니다.")

    redemption = Redemption(
        winner_id=payload.winner_id,
        code=_generate_code(),
        token=_generate_token(),
        prize_name=payload.prize_name,
        status=RedemptionStatus.issued,
        issued_at=datetime.utcnow(),
        expires_at=payload.expires_at,
    )
    db.add(redemption)
    db.commit()
    db.refresh(redemption)
    return redemption


@router.get("/redemption", response_model=list[RedemptionOut], dependencies=[Depends(get_current_admin)])
def list_redemptions(event_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Redemption)
        .join(Winner, Redemption.winner_id == Winner.id)
        .filter(Winner.event_id == event_id)
        .order_by(Redemption.issued_at.desc())
        .all()
    )


def _maybe_expire(db: Session, redemption: Redemption) -> Redemption:
    """issued 상태인데 expires_at이 지났으면 expired로 조건부 전이한다.

    조회 시점에 지연 평가하는 방식이라 별도 배치/스케줄러 없이도
    만료 시각이 지난 코드는 이후 교환 시도에서 항상 차단된다.
    """
    if (
        redemption.status == RedemptionStatus.issued
        and redemption.expires_at is not None
        and datetime.utcnow() > redemption.expires_at
    ):
        db.execute(
            update(Redemption)
            .where(Redemption.id == redemption.id, Redemption.status == RedemptionStatus.issued)
            .values(status=RedemptionStatus.expired)
        )
        db.commit()
        db.refresh(redemption)
    return redemption


@router.get("/redeem/{token}", response_model=RedeemPageOut)
def get_redeem_page(token: str, db: Session = Depends(get_db)):
    """당첨자용 교환 페이지 데이터. 코드+QR+상태를 노출한다."""
    redemption = db.query(Redemption).filter(Redemption.token == token).first()
    if not redemption:
        raise HTTPException(status_code=404, detail="유효하지 않은 교환 링크입니다.")
    redemption = _maybe_expire(db, redemption)

    return RedeemPageOut(
        code=redemption.code,
        prize_name=redemption.prize_name,
        status=redemption.status,
        qr_data_url=_qr_data_url(redemption.token),
        expires_at=redemption.expires_at,
    )


@router.get("/redemption/token/{token}", response_model=RedemptionOut, dependencies=[Depends(get_current_admin)])
def get_redemption_by_token(token: str, db: Session = Depends(get_db)):
    """온라인 QR 스캔 조회 (관리자 현장 스캔용)."""
    redemption = db.query(Redemption).filter(Redemption.token == token).first()
    if not redemption:
        raise HTTPException(status_code=404, detail="유효하지 않은 QR입니다.")
    return _maybe_expire(db, redemption)


def _atomic_redeem(db: Session, redemption: Redemption, redeemed_by: str) -> Redemption:
    """issued -> redeemed 전이를 조건부 UPDATE로 원자적으로 처리한다.

    동시 이중 사용을 막기 위해 애플리케이션 락 대신 WHERE status='issued' 조건으로 방어한다.
    """
    redemption = _maybe_expire(db, redemption)
    if redemption.status != RedemptionStatus.issued:
        raise HTTPException(status_code=409, detail="이미 사용되었거나 만료된 코드입니다.")

    result = db.execute(
        update(Redemption)
        .where(Redemption.id == redemption.id, Redemption.status == RedemptionStatus.issued)
        .values(status=RedemptionStatus.redeemed, redeemed_at=datetime.utcnow(), redeemed_by=redeemed_by)
    )
    if result.rowcount == 0:
        db.rollback()
        raise HTTPException(status_code=409, detail="이미 사용되었거나 만료된 코드입니다.")
    db.commit()
    db.refresh(redemption)
    return redemption


@router.patch(
    "/redemption/{code}/use", response_model=RedemptionOut, dependencies=[Depends(get_current_admin)]
)
def use_redemption(code: str, payload: RedeemUseRequest, db: Session = Depends(get_db)):
    """오프라인 처리: 관리자가 코드를 직접 입력해 확정."""
    redemption = db.query(Redemption).filter(Redemption.code == code).first()
    if not redemption:
        raise HTTPException(status_code=404, detail="존재하지 않는 코드입니다.")
    return _atomic_redeem(db, redemption, payload.redeemed_by)


@router.post("/redemption/{code}/confirm", response_model=RedemptionOut, dependencies=[Depends(get_current_admin)])
def confirm_redemption(code: str, payload: RedeemConfirmRequest, db: Session = Depends(get_db)):
    """온라인 QR 스캔 후 원터치 확정."""
    redemption = db.query(Redemption).filter(Redemption.code == code).first()
    if not redemption:
        raise HTTPException(status_code=404, detail="존재하지 않는 코드입니다.")
    return _atomic_redeem(db, redemption, payload.redeemed_by)
