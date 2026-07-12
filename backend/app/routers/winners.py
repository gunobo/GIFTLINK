import csv
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.database import get_db
from app.models.winner import Winner, WinnerSource
from app.schemas.winner import CsvUploadResult, WinnerCreate, WinnerOut, WinnerUpdate

router = APIRouter(prefix="/winners", tags=["winners"], dependencies=[Depends(get_current_admin)])

MAX_CSV_BYTES = 2 * 1024 * 1024  # 이벤트당 당첨자 수백 명 규모 기준 넉넉한 상한선


@router.get("", response_model=list[WinnerOut])
def list_winners(event_id: int, db: Session = Depends(get_db)):
    return db.query(Winner).filter(Winner.event_id == event_id).order_by(Winner.created_at.desc()).all()


@router.post("", response_model=WinnerOut)
def create_winner(payload: WinnerCreate, db: Session = Depends(get_db)):
    winner = Winner(**payload.model_dump(), source=WinnerSource.manual)
    db.add(winner)
    db.commit()
    db.refresh(winner)
    return winner


@router.patch("/{winner_id}", response_model=WinnerOut)
def update_winner(winner_id: int, payload: WinnerUpdate, db: Session = Depends(get_db)):
    winner = db.get(Winner, winner_id)
    if not winner:
        raise HTTPException(status_code=404, detail="당첨자를 찾을 수 없습니다.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(winner, field, value)
    db.commit()
    db.refresh(winner)
    return winner


@router.post("/upload", response_model=CsvUploadResult)
async def upload_csv(
    event_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
):
    """CSV 업로드. 헤더는 name/phone/email/discord_id/slack_webhook 컬럼명을 그대로 사용한다.

    관리자 비개발자 사용자를 고려해, 프론트엔드에서 업로드 전 컬럼 매핑 미리보기를 제공한다.
    """
    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_CSV_BYTES:
        raise HTTPException(status_code=413, detail="CSV 파일이 너무 큽니다 (최대 2MB).")

    raw = raw_bytes.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(raw))

    created, skipped, errors = 0, 0, []
    for i, row in enumerate(reader, start=2):
        name = (row.get("name") or "").strip()
        if not name:
            skipped += 1
            errors.append(f"{i}행: 이름이 비어 있어 건너뜀")
            continue
        winner = Winner(
            event_id=event_id,
            name=name,
            phone=(row.get("phone") or "").strip() or None,
            email=(row.get("email") or "").strip() or None,
            discord_id=(row.get("discord_id") or "").strip() or None,
            slack_webhook=(row.get("slack_webhook") or "").strip() or None,
            source=WinnerSource.csv,
        )
        db.add(winner)
        created += 1

    db.commit()
    return CsvUploadResult(created=created, skipped=skipped, errors=errors)
