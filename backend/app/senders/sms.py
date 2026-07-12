from app.models.winner import Winner
from app.senders.base import BaseSender, SendResult


class SmsSender(BaseSender):
    """Solapi/알리고 SMS 연동 (Phase 3). 알림톡 실패 시 폴백으로도 활용 가능.

    TODO: Solapi SDK/HTTP 연동 구현.
    """

    async def send(self, winner: Winner, message: str) -> SendResult:
        if not winner.phone:
            return SendResult(success=False, error_msg="전화번호가 없어 SMS를 보낼 수 없습니다.")
        # TODO: SMS API 호출
        return SendResult(success=False, error_msg="SMS 연동이 아직 구현되지 않았습니다.")
