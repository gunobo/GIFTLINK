from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.database import SessionLocal, get_db
from app.models.message_log import Channel, MessageLog, MessageStatus
from app.models.message_template import MessageTemplate
from app.models.winner import Winner
from app.schemas.message import MessageLogOut, SendRequest, TemplateCreate, TemplateOut
from app.senders import get_sender

router = APIRouter(tags=["messages"], dependencies=[Depends(get_current_admin)])


def render_template(body: str, winner: Winner) -> str:
    redeem_link = ""
    if winner.redemption:
        redeem_link = f"/redeem/{winner.redemption.token}"
    return (
        body.replace("{이름}", winner.name)
        .replace("{경품명}", winner.redemption.prize_name if winner.redemption else "")
        .replace("{redeem_link}", redeem_link)
    )


async def _send_one(winner_id: int, channel: str, template_body: str, kakao_template_id: str | None) -> None:
    """BackgroundTasks에서 실행되는 개별 발송 작업. 결과는 message_log에 기록한다.

    분당 수백 건 이상으로 커지기 전까지는 Celery/Redis 없이 이 정도로 충분하다.
    """
    db = SessionLocal()
    try:
        winner = db.get(Winner, winner_id)
        if not winner:
            return
        sender = get_sender(channel)
        message = render_template(template_body, winner)
        result = await sender.send(winner, message, kakao_template_id)
        db.add(
            MessageLog(
                winner_id=winner_id,
                channel=Channel(channel),
                status=MessageStatus.success if result.success else MessageStatus.failed,
                error_msg=result.error_msg,
            )
        )
        db.commit()
    finally:
        db.close()


@router.post("/messages/template", response_model=TemplateOut)
def create_template(payload: TemplateCreate, db: Session = Depends(get_db)):
    template = MessageTemplate(**payload.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/messages/template", response_model=list[TemplateOut])
def list_templates(event_id: int, db: Session = Depends(get_db)):
    return db.query(MessageTemplate).filter(MessageTemplate.event_id == event_id).all()


@router.post("/send/{channel}")
def send_messages(
    channel: str,
    payload: SendRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if channel not in ("kakao", "sms", "email", "webhook"):
        raise HTTPException(status_code=400, detail=f"지원하지 않는 채널입니다: {channel}")

    template = db.get(MessageTemplate, payload.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다.")

    for winner_id in payload.winner_ids:
        background_tasks.add_task(_send_one, winner_id, channel, template.body, template.kakao_template_id)

    return {"queued": len(payload.winner_ids)}


@router.get("/messages/logs", response_model=list[MessageLogOut])
def get_logs(event_id: int, db: Session = Depends(get_db)):
    return (
        db.query(MessageLog)
        .join(Winner, MessageLog.winner_id == Winner.id)
        .filter(Winner.event_id == event_id)
        .order_by(MessageLog.sent_at.desc())
        .all()
    )
