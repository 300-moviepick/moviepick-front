<div align="center">

# 🎬 MoviePick Frontend

**리뷰로 고르고, 커뮤니티로 나누고, AI로 발견하는 영화 추천 플랫폼 MoviePick의 화면입니다.**

<a href="https://www.moviepick.kr"><img src="https://img.shields.io/badge/서비스_바로가기-E50914?style=for-the-badge&logo=googlechrome&logoColor=white" alt="서비스 바로가기"/></a>
<a href="https://github.com/300-moviepick/moviepick"><img src="https://img.shields.io/badge/Backend_저장소-181717?style=for-the-badge&logo=github&logoColor=white" alt="Backend 저장소"/></a>

</div>

<br>

## 1. 화면 구성
`src/App.jsx` 라우트 기준입니다.

| 경로 | 화면 | 로그인 필요 |
|---|---|---|
| `/` | 홈 | 아니요 |
| `/movies` | 영화 탐색 | 아니요 |
| `/movies/:movieId` | 영화 상세·리뷰 | 아니요 (찜·리뷰 작성은 로그인 후) |
| `/community` | 커뮤니티 목록 | 아니요 |
| `/community/:postId` | 게시글 상세·댓글 | 아니요 |
| `/community/new` | 글쓰기 | 예 |
| `/community/:postId/edit` | 글 수정 | 예 |
| `/me/profile` | 프로필 | 예 |
| `/me/wishlist` | 찜 목록 | 예 |
| `/me/reviews` | 작성한 리뷰 | 예 |
| `/me/notifications` | 알림 센터 | 예 |
| `/ai` | AI 추천 | 아니요 (소개 화면 겸용, 추천은 화면 안에서 로그인 안내) |
| `/ai/credits` | AI 크레딧 충전소 | 아니요 (소개 화면 겸용, 충전은 화면 안에서 로그인 안내) |
| `/support` | 후원 | 아니요 |
| `/login`, `/signup` | 로그인, 회원가입 | 아니요 |
| `/oauth2/success`, `/oauth2/fail` | 소셜 로그인 결과 | 아니요 |
| `/admin` | 관리자 대시보드 | 관리자 |
| `/admin/members` | 회원 관리 | 관리자 |
| `/admin/reports` | 신고 관리 | 관리자 |
| `/admin/content` | 콘텐츠 관리 | 관리자 |
| `/admin/movies` | 영화 데이터 관리 | 관리자 |

<br>

## 2. 구현 포인트

| 포인트 | 내용 |
|---|---|
| Access 토큰 메모리 보관 | 로그인 응답의 Access 토큰을 메모리에만 두고 localStorage에 저장하지 않습니다. 새로고침하면 CSRF → refresh → 내 정보 순서로 로그인 상태를 복구합니다 (`src/api/client.js`, `src/auth/AuthProvider.jsx`) |
| Refresh 동시 요청 통합 | 401이 동시에 여러 개 와도 재발급 요청은 탭 안에서 하나로 합칩니다(`refreshPromise`). 탭 사이는 Web Locks(`navigator.locks`)로 순서를 맞춰, 서버의 Refresh Token 재사용 감지에 걸리지 않게 합니다 |
| CSRF 처리 | 앱 시작 시 받은 토큰을 GET이 아닌 모든 요청의 `X-XSRF-TOKEN` 헤더에 넣습니다. 403 `CSRF_INVALID`이면 토큰을 새로 받아 1번만 재시도하고, 권한 부족 같은 다른 403은 재시도하지 않습니다 |
| PortOne 결제 흐름·모바일 복귀 | 결제 생성 → PortOne 결제창 → 서버 confirm 순서로 진행하고, 브라우저가 보낸 결과는 믿지 않고 서버 조회 결과로 판단합니다. 모바일처럼 리다이렉트로 돌아오면 `?paymentId=…&code=…` 쿼리를 한 번만 처리하고 지운 뒤 결과를 확인합니다 (`src/hooks/usePortonePayment.js`) |

<br>

## 3. 기술 스택

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![React Router](https://img.shields.io/badge/React_Router_7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![CSS Modules](https://img.shields.io/badge/CSS_Modules-000000?style=flat-square&logo=cssmodules&logoColor=white)
![PortOne](https://img.shields.io/badge/PortOne_Browser_SDK_V2-0052FF?style=flat-square)
![ESLint](https://img.shields.io/badge/ESLint_10-4B32C3?style=flat-square&logo=eslint&logoColor=white)

<br>

## 4. 폴더 구조

```
src/
├─ main.jsx        Router + AuthProvider 연결
├─ App.jsx         라우트 (사용자 / 인증 / 마이페이지 / 관리자)
├─ api/            fetch 래퍼(CSRF·JWT·refresh·재시도), 백엔드 API 함수
├─ auth/           로그인 상태, 시작 시 복구
├─ hooks/          useAsync, 찜·알림 수, PortOne 결제 흐름 등
├─ layouts/        사용자 / 인증 / 마이페이지 / 관리자 레이아웃
├─ lib/            형식 변환, API 오류 문구, 로그인 후 돌아갈 주소
├─ screens/        화면 (home, movies, community, ai, support, auth, me, admin)
├─ styles/         디자인 토큰, 기본 스타일
└─ ui/             공통 컴포넌트 (Button, Modal, Tabs, 토스트 등)
```

<br>

## 5. 더 보기

- 전체 구조·트러블슈팅·성능: [백엔드 README](https://github.com/300-moviepick/moviepick)
- 로컬 실행·환경변수·배포·API 연결 규칙: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
