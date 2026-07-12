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

## 라즈베리파이 배포

기존에 돌아가고 있는 다른 프로젝트들(meistertrack, my_homepage 등)과 같은 방식입니다.

### 1. 파이에서 저장소 clone

```bash
cd ~/  # 다른 프로젝트들과 같은 위치
git clone https://github.com/<your-username>/GIFTLINK.git
cd GIFTLINK
```

### 2. .env 두 개 채우기

```bash
cp .env.example .env
cp backend/.env.example backend/.env
nano .env            # MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD 실제 값으로
nano backend/.env    # JWT_SECRET(랜덤 문자열), ADMIN_PASSWORD, PUBLIC_BASE_URL 등
```

`backend/.env`의 `PUBLIC_BASE_URL`은 실제 서비스 도메인으로 넣어야 합니다 (예: `https://giftlink.imjemin.co.kr`) — 교환 QR/링크와 CORS 허용 origin이 여기서 나옵니다.

`JWT_SECRET`은 아래처럼 랜덤 값으로 생성해서 넣으면 됩니다:

```bash
openssl rand -hex 32
```

### 3. 빌드 및 기동

```bash
docker compose up --build -d
docker compose logs -f backend   # 정상 기동 확인 (⚠️ 경고 로그가 없어야 함 — 있으면 .env 값이 기본값 그대로라는 뜻)
docker compose ps
```

- 프론트엔드 컨테이너: 호스트 `5102`번 → 내부 nginx `80`
- 백엔드 컨테이너: 호스트 `8004`번 → 내부 uvicorn `8000`

기존에 떠 있는 컨테이너들(`docker ps`로 확인한 8001,8002,8888,8090 / 5100,5101 / 3305,3310,3311,3312)과 겹치지 않는 포트라 그대로 떠도 충돌 없습니다.

### 4. Cloudflare Tunnel에 호스트 추가

이미 파이에 떠 있는 `cloudflared` 터널을 그대로 씁니다 (컨테이너를 새로 안 띄워도 됨). Cloudflare Zero Trust 대시보드에서:

1. **Networks → Tunnels** → 기존에 쓰던 터널 선택
2. **Public Hostname 추가**
   - Subdomain: `giftlink` (원하는 이름)
   - Domain: `imjemin.co.kr`
   - Service: `HTTP` / `localhost:5102` (프론트엔드 컨테이너의 호스트 포트)
3. 저장하면 몇 초 안에 `https://giftlink.imjemin.co.kr`로 접속 가능

터널을 `config.yml`로 직접 관리하는 방식이라면, ingress 규칙에 아래처럼 한 줄만 추가하고 `cloudflared` 컨테이너를 재시작하면 됩니다:

```yaml
- hostname: giftlink.imjemin.co.kr
  service: http://localhost:5102
```

### 5. 배포 후 확인

- `https://giftlink.imjemin.co.kr/login` 접속 → `backend/.env`에 설정한 `ADMIN_USERNAME`/`ADMIN_PASSWORD`로 로그인
- 첫 로그인 후 실사용 전에 비밀번호를 바꾸고 싶다면, 현재는 변경 API가 없으니 `ADMIN_PASSWORD`를 바꾸고 `docker compose up -d --build backend`로 재기동 (기존 admin 레코드는 이미 있으므로 DB에서 해당 row를 지우거나 직접 갱신해야 재시드됨 — 이 부분은 아직 스캐폴딩 단계라 관리자 비밀번호 변경 기능은 없습니다)

## 화면 구성

1. 로그인 (`/login`)
2. 이벤트 관리 (`/events`)
3. 이벤트 상세 — 탭으로 당첨자 / 메시지 템플릿 / 발송 결과 / 경품 교환 관리 (`/events/:id/*`)
4. QR 스캔 처리 화면, 모바일 최적화 (`/scan`)
5. 당첨자용 공개 교환 페이지 (`/redeem/:token`)

## 현재 상태 (기초 틀)

- DB 스키마·API·화면은 명세서 기준으로 골격이 잡혀 있고, 이벤트/당첨자/CSV업로드/템플릿/발송로그/Redemption 발급·조회·원자적 교환까지 실제로 동작합니다 (SQLite로 end-to-end 스모크 테스트 완료).
- **카카오 알림톡·SMS(Solapi) 연동 완료** — `SOLAPI_API_KEY`/`SOLAPI_API_SECRET`/`SOLAPI_SENDER_PHONE`(+ 알림톡은 `SOLAPI_KAKAO_PF_ID`, 템플릿별 승인된 템플릿 ID)를 채우면 실제 발송됩니다. 알림톡은 자유 텍스트가 아니라 Solapi 콘솔에서 사전 승인된 템플릿에 이름/경품명/교환링크 변수를 채워 보내는 구조라, 관리자 페이지의 메시지 템플릿 작성 화면에서 카카오 채널 선택 시 템플릿 ID를 별도로 입력해야 합니다.
- 이메일(SMTP)·웹훅(Discord/Slack) 발송은 실제로 동작합니다 (SMTP/웹훅 URL 설정 시).
- **관리자 비밀번호 변경 가능** — 로그인 후 사이드바 "설정"에서 변경. 최초 비밀번호는 여전히 `backend/.env`의 `ADMIN_PASSWORD`로 시드됩니다.
- QR 스캔 화면은 카메라 인식 없이 수동 입력/붙여넣기 기반입니다. 카메라 스캔은 이후 `BarcodeDetector` 등으로 확장 가능합니다.
- `MessageTemplate` 테이블에 `kakao_template_id` 컬럼이 추가됐습니다. 마이그레이션 도구 없이 `Base.metadata.create_all`만 쓰고 있어서, **이미 배포해서 DB가 만들어진 상태라면** 새 컬럼이 자동으로 추가되지 않습니다 — `ALTER TABLE message_template ADD COLUMN kakao_template_id VARCHAR(100);`를 직접 실행하거나 아직 DB를 새로 만드는 단계라면 무시해도 됩니다.
