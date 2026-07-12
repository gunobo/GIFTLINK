import httpx

from app.config import settings
from app.models.winner import Winner
from app.senders.base import BaseSender, SendResult
from app.senders.solapi_client import send_message


class KakaoSender(BaseSender):
    """Solapi 알림톡(카카오 비즈메시지) 연동.

    알림톡은 자유 텍스트를 보낼 수 없고, Solapi 콘솔에서 사전 승인받은
    채널(pfId)+템플릿(templateId)에 변수만 채워서 보내는 구조다. 템플릿 승인은
    Solapi 콘솔에서 별도로 진행해야 하며, 여기서는 시스템에서 쓰는 세 변수
    (이름/경품명/redeem_link)를 항상 채워 보낸다. `disableSms=False`로 두면
    알림톡 실패 시 Solapi가 자동으로 SMS로 대체 발송한다.
    """

    async def send(self, winner: Winner, message: str, kakao_template_id: str | None = None) -> SendResult:
        if not winner.phone:
            return SendResult(success=False, error_msg="전화번호가 없어 알림톡을 보낼 수 없습니다.")
        if not settings.solapi_api_key or not settings.solapi_api_secret:
            return SendResult(success=False, error_msg="Solapi API 키가 설정되어 있지 않습니다.")
        if not settings.solapi_sender_phone:
            return SendResult(success=False, error_msg="발신번호(SOLAPI_SENDER_PHONE)가 설정되어 있지 않습니다.")
        if not settings.solapi_kakao_pf_id or not kakao_template_id:
            return SendResult(
                success=False,
                error_msg="카카오 채널(pfId) 또는 템플릿을 이 발송 템플릿에서 찾을 수 없습니다. "
                "템플릿 작성 시 '카카오 알림톡 템플릿 ID'를 입력했는지 확인하세요.",
            )

        redeem_link = f"{settings.public_base_url}/redeem/{winner.redemption.token}" if winner.redemption else ""
        prize_name = winner.redemption.prize_name if winner.redemption else ""

        payload = {
            "to": winner.phone.replace("-", ""),
            "from": settings.solapi_sender_phone,
            "text": message,
            "kakaoOptions": {
                "pfId": settings.solapi_kakao_pf_id,
                "templateId": kakao_template_id,
                "variables": {
                    "#{이름}": winner.name,
                    "#{경품명}": prize_name,
                    "#{redeem_link}": redeem_link,
                },
                "disableSms": False,
            },
        }

        try:
            await send_message(payload)
            return SendResult(success=True)
        except httpx.HTTPStatusError as exc:
            return SendResult(success=False, error_msg=f"Solapi 오류({exc.response.status_code}): {exc.response.text}")
        except Exception as exc:  # noqa: BLE001 - 발송 실패는 message_log에 기록하고 관리자가 판단
            return SendResult(success=False, error_msg=str(exc))
