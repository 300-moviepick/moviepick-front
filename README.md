# moviepick-front

MoviePick 백엔드(`../moviepick`)와 연동하는 프론트엔드입니다. 사용자 화면(영화 탐색·상세·리뷰, 커뮤니티, AI 추천·크레딧, 후원), 인증 화면, 마이페이지, 관리자 화면을 제공합니다.
AI 추천·크레딧 화면은 아직 백엔드 API와 연결하지 않아 "준비 중"으로 표시합니다.

- Vite + React (JavaScript), react-router-dom
- 스타일: 디자인 토큰(`src/styles/tokens.css`) + 기본 스타일(`src/styles/base.css`) + 컴포넌트별 CSS Module
- 결제: `@portone/browser-sdk` (V2)
- 개발 서버에서만 `/__ui`에서 공통 컴포넌트 미리보기를 볼 수 있습니다(운영 빌드에서는 빠짐)

## 실행 방법

필요: Node.js `^20.19.0` 또는 `>=22.12.0` (Vite 8 요구 사항)

1. **백엔드를 먼저 실행**합니다. (`../moviepick`, 기본 `http://localhost:8080`)
2. 의존성 설치
   ```bash
   npm install
   ```
3. 개발 서버 실행 (포트 5173 고정, 사용 중이면 실패)
   ```bash
   npm run dev
   ```
4. 브라우저에서 http://localhost:5173 접속

## 환경변수

| 변수 | 내용 |
| --- | --- |
| `VITE_API_BASE_URL` | 백엔드 주소. `.env.development`에 로컬 백엔드 주소가 들어 있습니다. 값이 없으면 개발 서버는 `http://localhost:8080`, 운영 빌드는 빈 값(같은 주소, 상대 경로)을 씁니다. 운영에서는 `vercel.json`이 `/api`, `/oauth2/authorization`, `/login/oauth2` 요청을 백엔드로 중계합니다 |

- **`VITE_*` 변수에는 공개해도 되는 값만 넣습니다.** 빌드 결과 JS에 그대로 들어가 누구나 볼 수 있습니다. API 키, 비밀번호, 시크릿은 백엔드 환경변수에만 둡니다.

## 필요한 백엔드 설정

| 항목 | 내용 |
| --- | --- |
| CORS | 허용 주소는 백엔드 설정값 `APP_FRONTEND_ALLOWED_ORIGINS`(없으면 `APP_FRONTEND_URL`, 기본 `http://localhost:5173`). `allowCredentials(true)`, 허용 헤더 `Authorization`, `Content-Type`, `X-XSRF-TOKEN` |
| 카카오·Google 로그인 | `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET` 등. 성공 시 `{APP_FRONTEND_URL}/oauth2/success`, 실패 시 `{APP_FRONTEND_URL}/oauth2/fail?reason=…`으로 리다이렉트(백엔드 설정값 `app.frontend.url`) |
| TMDB | `TMDB_ACCESS_TOKEN` (관리자 "영화 불러오기"에 필요) |
| PortOne | `PORTONE_STORE_ID`, `PORTONE_CHANNEL_KEY`(결제창), `PORTONE_API_SECRET`(결제 확인). storeId/channelKey가 비어 있으면 후원 화면에 안내 문구만 나옵니다 |
| JWT | `JWT_SECRET` |
| 관리자 계정 | DB에서 회원의 `role`을 `ADMIN`으로 바꿔야 관리자 화면·영화 불러오기가 보입니다 |

## API 연결부 (`src/api/client.js`)

- 모든 요청에 `credentials: 'include'`
- 응답 본문에 `data`가 있으면 `data`를, 없으면 본문 전체를 결과로 사용 (ApiResponse로 감싼 응답과 감싸지 않은 응답 모두 지원)
- **CSRF**: 앱 시작 시 `GET /api/auth/csrf`로 받은 `token`(또는 `data.token`)을 GET이 아닌 모든 요청의 `X-XSRF-TOKEN` 헤더에 넣음. GET이 아닌 요청이 403 `CSRF_INVALID`이면 CSRF를 새로 받아 1회 재시도(권한 부족 등 다른 403은 재시도하지 않음)
- **JWT**: 로그인 응답의 `data.accessToken`을 메모리에만 저장(localStorage 사용 안 함), `Authorization: Bearer ...`
- **401**: `POST /api/auth/refresh`로 새 accessToken을 받아 1회 재시도. refresh도 실패하면 로그아웃 상태로 전환
- **공개 GET이 401**: Authorization 없이 1회 재시도하고, 뒤에서 refresh를 시도 (만료 토큰에 401을 주는 백엔드 문제 우회)
- 회원가입·로그인·로그아웃·CSRF·refresh 요청에는 Authorization을 붙이지 않음
- 새로고침 시 CSRF → refresh → `GET /api/members/me`로 로그인 상태 복구
- 목록 응답은 백엔드 `PageResponse { content, page, size, totalElements, totalPages }`를 그대로 사용

## 화면별 확인 순서

요청 순서는 브라우저 개발자 도구의 네트워크 탭에서 확인합니다.

1. **/signup → /login** — 회원가입(이메일, 비밀번호 8자 이상, 닉네임) → 로그인. 헤더에 닉네임이 보이는지, 요청이 `csrf → login → members/me` 순서인지 확인
2. **새로고침** — 로그인 상태가 유지되는지(`csrf → refresh → members/me`)
3. **카카오·Google로 로그인** — `/oauth2/success`에서 보안 토큰 준비 → 로그인 세션 확인 → 회원 정보 불러오기 단계가 차례로 표시되고 원래 화면으로 돌아가는지
4. **/movies** — 목록·검색·페이지 이동
5. **/movies/:id** — 로그아웃 상태에서도 상세·리뷰 목록이 보이는지. 로그인 후 출연진·OTT, 찜, 리뷰 작성(평점 0.5~5.0)·수정·삭제·공감, 정렬 변경
6. **/community** — 목록·검색·정렬, 글쓰기(`/community/new`)
7. **/community/:id** — 수정, 삭제, 좋아요, 신고, 댓글 작성·수정·삭제·좋아요·신고. 버튼은 작성자 여부에 따라 보임
8. **/me/** — 프로필(닉네임 변경·회원 탈퇴), 찜 목록, 작성한 리뷰, 알림 센터
9. **/admin** (관리자) — 대시보드, 회원 관리(정지 해제), 신고 관리(승인/거절), 콘텐츠 관리(숨김·삭제), 영화 데이터 관리(TMDB 영화 수집)
10. **/support** — 3000/6000/9000원 선택 → 후원 생성 → PortOne 결제창(테스트 채널, 실제 청구 없음) → 결제 확인 결과(COMPLETED/FAILED/PENDING)
11. **토큰 만료 확인** — 30분 뒤(또는 백엔드에서 access 만료 시간을 줄여) 요청하면 `401 → refresh → 재시도` 순서로 요청이 나가는지

## 파일 구조

```
moviepick-front/
├─ index.html              title, description, og 메타, favicon 연결
├─ public/favicon.svg      로고 모양 favicon
├─ package.json
├─ vite.config.js          포트 5173 고정 (strictPort)
├─ vercel.json             운영 중계(/api, /oauth2/authorization, /login/oauth2)와 SPA 새로고침 대체 경로
├─ .env.development        VITE_API_BASE_URL
├─ .gitignore
└─ src/
   ├─ main.jsx             Router + AuthProvider 연결
   ├─ App.jsx              라우트 (사용자 / 인증 / 마이페이지 / 관리자)
   ├─ api/
   │  ├─ client.js         fetch 래퍼: CSRF, JWT, refresh, 재시도, 응답 unwrap
   │  └─ moviepick.js      백엔드 API 함수 (인증·회원·영화·리뷰·찜·알림·커뮤니티·후원·관리자)
   ├─ auth/
   │  ├─ AuthProvider.jsx  로그인 사용자 상태, 시작 시 복구, 로그인/로그아웃
   │  ├─ authContext.js    AuthContext
   │  └─ useAuth.js        useAuth 훅
   ├─ hooks/               useAsync, 찜 목록, 안 읽은 알림 수, 로그인 이동, 로그아웃
   ├─ layouts/             사용자(헤더·푸터) / 인증 / 마이페이지 / 관리자 레이아웃
   ├─ lib/                 형식 변환, API 오류 판단·문구, 로그인 후 돌아갈 주소
   ├─ screens/             화면 (home, movies, community, ai, support, auth, me, admin, dev)
   ├─ styles/
   │  ├─ tokens.css        디자인 토큰 (--mp- 변수)
   │  └─ base.css          문서·.mp 기본 스타일
   └─ ui/                  공통 컴포넌트 (Button, Badge, Field, Modal, Tabs, 카드, 상태 표시, 토스트 등)
```

## 개선 예정

| 항목 | 내용 |
| --- | --- |
| 이용약관·개인정보처리방침 | 페이지를 만들고 푸터 링크를 연결합니다(지금은 푸터에 텍스트만 있음) |
| 관리자 화면 제목 | 영어로 된 메뉴 구역 이름과 부제를 한국어로 바꿉니다 |
| AI 추천 피드백 | 추천 결과에 좋아요·싫어요(`PUT`·`DELETE /api/ai/feedback/{movieId}`)를 연결합니다 |
| 공통 검색 폼 | 여러 화면에 반복된 검색 폼 처리를 정리합니다 |
| 영화 장르·연도 필터 | 백엔드 필터 API가 생기면 영화 탐색 화면에 다시 추가합니다 |
| 커뮤니티 카테고리 | 게시글 카테고리 필드가 생기면 목록·작성 화면에 추가합니다 |
| 알림 설정 | 알림 종류별 수신 설정 API가 생기면 마이페이지에 화면을 추가합니다 |
| 관리자 통합 검색·회원 검색 | 검색 API가 생기면 관리자 상단과 회원 관리 화면에 추가합니다 |
| 신고 유형 필터 | 신고 목록 유형(게시글·댓글·리뷰) 필터 API가 생기면 신고 관리 화면에 추가합니다 |
