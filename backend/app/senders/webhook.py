import httpx

from app.models.winner import Winner
from app.senders.base import BaseSender, SendResult


class WebhookSender(BaseSender):
    """Discord/Slack 웹훅 POST 발송."""

    async def send(self, winner: Winner, message: str) -> SendResult:
        webhook_url = winner.slack_webhook
        if not webhook_url:
            return SendResult(success=False, error_msg="웹훅 URL이 없어 발송할 수 없습니다.")

        payload = {"content": message} if "discord.com" in webhook_url else {"text": message}

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(webhook_url, json=payload)
                resp.raise_for_status()
            return SendResult(success=True)
        except Exception as exc:  # noqa: BLE001
            return SendResult(success=False, error_msg=str(exc))
