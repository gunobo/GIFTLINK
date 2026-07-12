from app.senders.base import BaseSender, SendResult
from app.senders.kakao import KakaoSender
from app.senders.sms import SmsSender
from app.senders.email import EmailSender
from app.senders.webhook import WebhookSender

SENDER_REGISTRY: dict[str, type[BaseSender]] = {
    "kakao": KakaoSender,
    "sms": SmsSender,
    "email": EmailSender,
    "webhook": WebhookSender,
}


def get_sender(channel: str) -> BaseSender:
    """channel 문자열로 어댑터 인스턴스를 조회한다.

    새 채널 추가 시 이 레지스트리에 구현체만 등록하면 되고,
    /send/{channel} 라우팅 로직은 변경할 필요가 없다.
    """
    sender_cls = SENDER_REGISTRY.get(channel)
    if sender_cls is None:
        raise ValueError(f"지원하지 않는 채널입니다: {channel}")
    return sender_cls()


__all__ = ["BaseSender", "SendResult", "get_sender", "SENDER_REGISTRY"]
