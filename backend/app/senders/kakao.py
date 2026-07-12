from app.models.winner import Winner
from app.senders.base import BaseSender, SendResult


class KakaoSender(BaseSender):
    """Solapi 알림톡 API 연동 (Phase 3).

    TODO: Solapi SDK/HTTP 연동 구현. 지금은 스텁으로 winner.phone 유무만 검증한다.
    """

    async def send(self, winner: Winner, message: str) -> SendResult:
        if not winner.phone:
            return SendResult(success=False, error_msg="전화번호가 없어 알림톡을 보낼 수 없습니다.")
        # TODO: Solapi 알림톡 API 호출
        return SendResult(success=False, error_msg="카카오 알림톡 연동이 아직 구현되지 않았습니다.")
