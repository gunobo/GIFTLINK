import smtplib
from email.mime.text import MIMEText

from app.config import settings
from app.models.winner import Winner
from app.senders.base import BaseSender, SendResult


class EmailSender(BaseSender):
    """SMTP를 통한 이메일 발송."""

    async def send(self, winner: Winner, message: str) -> SendResult:
        if not winner.email:
            return SendResult(success=False, error_msg="이메일 주소가 없어 발송할 수 없습니다.")
        if not settings.smtp_host:
            return SendResult(success=False, error_msg="SMTP 설정이 되어 있지 않습니다.")

        try:
            mime = MIMEText(message, "plain", "utf-8")
            mime["Subject"] = "[GIFTLINK] 당첨을 축하드립니다"
            mime["From"] = settings.smtp_from or settings.smtp_user
            mime["To"] = winner.email

            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.starttls()
                if settings.smtp_user:
                    server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(mime["From"], [winner.email], mime.as_string())
            return SendResult(success=True)
        except Exception as exc:  # noqa: BLE001 - 발송 실패는 message_log에 기록하고 관리자가 판단
            return SendResult(success=False, error_msg=str(exc))
