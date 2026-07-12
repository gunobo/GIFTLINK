from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.models.winner import Winner


@dataclass
class SendResult:
    success: bool
    error_msg: str | None = None


class BaseSender(ABC):
    """모든 발송 채널 어댑터의 공통 인터페이스.

    라우팅(/send/{channel})은 이 인터페이스에만 의존하므로,
    채널 추가/교체는 구현체 추가만으로 끝난다 (기존 코드 수정 불필요).
    """

    @abstractmethod
    async def send(self, winner: Winner, message: str, kakao_template_id: str | None = None) -> SendResult:
        """kakao_template_id는 KakaoSender만 사용한다 (Solapi 알림톡은 사전 승인된
        템플릿 ID + 변수로만 발송 가능해 자유 텍스트를 못 보낸다). 다른 채널은 무시한다."""
        ...
