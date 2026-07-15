import httpx

from app.config import settings
from app.models.winner import Winner
from app.senders.base import BaseSender, SendResult
from app.senders.solapi_client import send_message


class SmsSender(BaseSender):
    """Solapi SMS/LMS 연동. 90자를 넘으면 Solapi가 자동으로 LMS로 전환해 보낸다.

    알림톡 발송이 실패한 당첨자만 골라 이 채널로 수동 재발송하는 폴백 용도로도 쓸 수 있다.
    """

    async def send(self, winner: Winner, message: str, kakao_template_id: str | None = None) -> SendResult:
        if not winner.phone:
            return SendResult(success=False, error_msg="전화번호가 없어 SMS를 보낼 수 없습니다.")
        if not settings.solapi_api_key or not settings.solapi_api_secret:
            return SendResult(success=False, error_msg="Solapi API 키가 설정되어 있지 않습니다.")
        if not settings.solapi_sender_phone:
            return SendResult(success=False, error_msg="발신번호(SOLAPI_SENDER_PHONE)가 설정되어 있지 않습니다.")

        payload = {
            "to": winner.phone.replace("-", ""),
            "from": settings.solapi_sender_phone.replace("-", ""),
            "text": message,
        }

        try:
            await send_message(payload)
            return SendResult(success=True)
        except httpx.HTTPStatusError as exc:
            return SendResult(success=False, error_msg=f"Solapi 오류({exc.response.status_code}): {exc.response.text}")
        except Exception as exc:  # noqa: BLE001
            return SendResult(success=False, error_msg=str(exc))
