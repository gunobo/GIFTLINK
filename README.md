# GIFTLINK

경품 당첨자를 집계하고 카카오/SMS/이메일/웹훅 멀티채널로 당첨 메시지를 발송하며, 쿠폰코드+교환링크가 통합된 방식으로 실물 경품 교환까지 처리하는 웹 서비스.

상세 명세는 [agent/start.md](agent/start.md), 아키텍처 원칙은 [.claude/claude.md](.claude/claude.md) 참고.

## 구조

```
backend/    FastAPI (SQLAlchemy + MySQL, BaseSender 채널 어댑터, Redemption 상태기계)
frontend/   React + Vite + TypeScript + Tailwind (관리자 대시보드 + 공개 교환 페이지)
```

## 로컬 개발

### 1. 백엔드

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 필요 시 값 수정 (DATABASE_URL, ADMIN_PASSWORD 등)
uvicorn app.main:app --reload
```

MySQL 없이 빠르게 띄워보려면 `.env`의 `DATABASE_URL`을 `sqlite:///./dev.db`로 바꿔도 동작합니다 (프로덕션은 MySQL 전제).

최초 기동 시 `.env`의 `ADMIN_USERNAME` / `ADMIN_PASSWORD`로 관리자 계정이 자동 시드됩니다.

API 문서: http://localhost:8000/docs

### 2. 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

http://localhost:5173 — `/api`로 오는 요청은 Vite 프록시를 통해 백엔드(`:8000`)로 전달됩니다.

### 3. 전체 스택 (Docker Compose)

```bash
cp .env.example .env                   # MySQL 자격 증명 — 반드시 change-me 값 교체
cp backend/.env.example backend/.env   # JWT_SECRET, ADMIN_PASSWORD 등 — 반드시 change-me 값 교체
docker compose up --build
```

두 `.env` 파일 모두 git에 커밋되지 않습니다 (`.gitignore`). `docker-compose.yml`에는 자격 증명이 하드코딩되어 있지 않고 루트 `.env`의 `MYSQL_*` 값을 읽어서 사용합니다.

- 프론트엔드: http://localhost:5102
- 백엔드 API: http://localhost:8004

Raspberry Pi + Cloudflare Tunnel 배포도 동일한 `docker-compose.yml`을 기준으로 합니다. 호스트 포트(`5102`, `8004`)는 같은 서버에서 돌아가는 다른 프로젝트들과 겹치지 않게 고른 값이라, 다른 스택을 늘릴 때는 `docker-compose.yml`의 `ports`만 비어있는 번호로 바꿔주면 됩니다.

## 화면 구성

1. 로그인 (`/login`)
2. 이벤트 관리 (`/events`)
3. 이벤트 상세 — 탭으로 당첨자 / 메시지 템플릿 / 발송 결과 / 경품 교환 관리 (`/events/:id/*`)
4. QR 스캔 처리 화면, 모바일 최적화 (`/scan`)
5. 당첨자용 공개 교환 페이지 (`/redeem/:token`)

## 현재 상태 (기초 틀)

- DB 스키마·API·화면은 명세서 기준으로 골격이 잡혀 있고, 이벤트/당첨자/CSV업로드/템플릿/발송로그/Redemption 발급·조회·원자적 교환까지 실제로 동작합니다 (SQLite로 end-to-end 스모크 테스트 완료).
- 카카오 알림톡·SMS(Solapi) 연동은 `app/senders/kakao.py`, `app/senders/sms.py`에 스텁만 있고 Phase 3에서 실제 API 연동이 필요합니다.
- 이메일(SMTP)·웹훅(Discord/Slack) 발송은 실제로 동작합니다 (SMTP/웹훅 URL 설정 시).
- QR 스캔 화면은 카메라 인식 없이 수동 입력/붙여넣기 기반입니다. 카메라 스캔은 이후 `BarcodeDetector` 등으로 확장 가능합니다.
