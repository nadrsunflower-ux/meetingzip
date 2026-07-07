# 회의록 아카이브 (Meeting Records)

주간 회의록을 **연도 · 월 폴더** 형식으로 관리하는 웹사이트입니다. 관리자만 업로드/편집하고, 팀은 링크로 열람합니다.

- 📁 **폴더 UI** — 왼쪽 사이드바에서 `연도 > 월 > 회의록` 트리로 탐색 (토글 아님)
- 🔒 **권한 분리** — 업로드·편집은 관리자 로그인, 열람은 누구나
- 🔍 **전체 검색** — 모든 회의록 본문·요약·태그·액션아이템에서 키워드 검색
- 🤖 **AI 자동 요약** — 본문을 붙여넣고 버튼 한 번으로 Claude가 요약 + 액션아이템 추출
- 📎 **첨부파일** — PDF·이미지 등 업로드
- ✅ **액션 아이템 체크리스트** — 회의별 할 일을 체크박스로 추적, 홈에서 미완료 항목 모아보기

**스택:** Next.js 16 (App Router) · Firebase (Firestore + Storage + Auth) · Anthropic Claude · Vercel

---

## 1. 사전 준비 (Firebase 콘솔, 약 5분)

이미 `.env.local`에 Firebase 설정값(`meetingzip-c2850`)이 채워져 있습니다. 콘솔에서 아래 3가지만 켜면 됩니다.

### ① Firestore 데이터베이스 생성
[Firebase 콘솔](https://console.firebase.google.com/) → 프로젝트 → **빌드 > Firestore Database** → **데이터베이스 만들기** → 위치 선택 → **프로덕션 모드**로 시작.

### ② Storage 활성화
**빌드 > Storage** → **시작하기** → 기본값으로 진행.

### ③ 이메일/비밀번호 로그인 사용 설정
**빌드 > Authentication** → **시작하기** → **로그인 방법** 탭 → **이메일/비밀번호** → **사용 설정**.

### ④ 보안 규칙 붙여넣기 (읽기=모두, 쓰기=**지정된 관리자 1명만**)
- **Firestore Database > 규칙** 탭에 이 저장소의 [`firestore.rules`](firestore.rules) 내용을 붙여넣고 **게시**.
- **Storage > 규칙** 탭에 [`storage.rules`](storage.rules) 내용을 붙여넣고 **게시**.

> 이 규칙은 쓰기 권한을 **관리자 UID 한 명**으로 고정합니다(현재 프로젝트 관리자 UID가 이미 박혀 있음). 그래서 누군가 몰래 회원가입해도 회의록을 수정/삭제할 수 없습니다. 첨부는 파일당 25MB로 제한됩니다.
>
> ⚠️ **관리자 계정을 새로 만들면**(다른 이메일/비밀번호로 재생성) UID가 바뀌므로, 두 규칙 파일의 `EYkwU0xfP4cfQaWYl8UHqJiTxyt1` 부분을 새 UID로 바꿔 다시 게시해야 합니다. (UID는 Firebase 콘솔 Authentication 사용자 목록에서 확인)
>
> Firebase CLI가 있다면 `firebase deploy --only firestore:rules,storage` 로도 배포할 수 있습니다.

---

## 2. 관리자 계정 만들기 (최초 1회)

로그인은 **비밀번호만** 입력하는 방식입니다(이메일은 `.env.local`의 `NEXT_PUBLIC_ADMIN_EMAIL` 값을 내부적으로 자동 사용). `.env.local`이 채워진 상태에서 비밀번호만 정해 계정을 생성합니다:

```bash
node --env-file=.env.local scripts/create-admin.mjs "원하는비밀번호"
```

`✅ 관리자 계정 생성 완료`가 뜨면 사이트 `/login`에서 **이 비밀번호만** 입력해 로그인합니다.

> 비밀번호를 바꾸려면 Firebase 콘솔 > Authentication 에서 해당 계정을 삭제한 뒤 위 명령을 다시 실행하세요.

---

## 3. AI 요약 키 (선택)

AI 요약 기능을 쓰려면 [Anthropic 콘솔](https://console.anthropic.com/)에서 API 키를 발급해 `.env.local`의 `ANTHROPIC_API_KEY=` 뒤에 붙여넣으세요. 비워두면 AI 요약 버튼만 비활성화되고 나머지는 정상 동작합니다.

---

## 4. 로컬 실행

```bash
npm install          # 최초 1회
npm run dev          # 개발 서버 → http://localhost:3000
```

빌드 확인:

```bash
npm run build && npm run start
```

---

## 5. Vercel 배포

1. 이 폴더를 GitHub 저장소로 올립니다. (`.env.local`은 커밋되지 않음 — 정상)
2. [Vercel](https://vercel.com/)에서 **New Project** → 저장소 선택.
3. **Environment Variables**에 `.env.local`의 모든 값을 그대로 등록:
   - `NEXT_PUBLIC_FIREBASE_*` (7개)
   - `NEXT_PUBLIC_ADMIN_EMAIL` (로그인용 고정 이메일)
   - `ANTHROPIC_API_KEY` (AI 요약을 쓸 경우)
4. **Deploy**. 이후 회의록 업로드는 재배포 없이 사이트에서 바로 됩니다.

> 배포 후 Firebase 콘솔 **Authentication > 설정 > 승인된 도메인**에 Vercel 도메인(`your-app.vercel.app`)을 추가하면 로그인 오류를 예방할 수 있습니다.

---

## 사용법

- **열람(팀):** 로그인 없이 사이트 접속 → 왼쪽 폴더에서 회의록 클릭. 상단 검색창으로 검색.
- **업로드(관리자):** 우측 상단 **관리자 로그인** → 사이드바 **+ 새 회의록** → 제목·날짜·본문(마크다운) 작성 → 필요 시 **AI 요약** 버튼 → **저장**.
- 회의 날짜(`YYYY-MM-DD`) 기준으로 자동으로 `연도 > 월` 폴더에 정리됩니다.

---

## 프로젝트 구조

```
src/
  lib/
    firebase.ts      Firebase 초기화 (auth · db · storage)
    types.ts         Meeting / ActionItem / Attachment 타입
    meetings.ts      Firestore/Storage 데이터 액세스 (CRUD · 구독 · 업로드)
    useAuth.tsx      로그인 상태 컨텍스트 (관리자 = 로그인 사용자)
    useMeetings.ts   실시간 구독 훅
    format.ts        날짜 포맷 · 연/월 폴더 그룹화
  components/        Sidebar · Header · MeetingView · MeetingForm · ActionItems · Attachments · Markdown 등
  app/
    page.tsx                     홈(통계 · 최근 회의록 · 미완료 액션아이템)
    login/                       관리자 로그인
    search/                      검색 결과
    meetings/new                 새 회의록 (관리자)
    meetings/[id]                회의록 상세
    meetings/[id]/edit           편집 (관리자)
    api/summarize/route.ts       AI 요약 (Claude, 서버 전용)
firestore.rules · storage.rules  보안 규칙 (콘솔에 붙여넣기)
scripts/create-admin.mjs         관리자 계정 생성 스크립트
```

## 참고 / 한계

- **검색**은 클라이언트에서 전체 회의록을 불러와 부분 문자열로 매칭합니다(한국어 부분검색에 유리). 회의록이 수천 건 이상으로 커지면 Algolia 등 외부 검색 인덱스를 붙이는 편이 좋습니다.
- **폴더**는 실제 파일시스템이 아니라 회의 날짜에서 파생한 `연/월` 분류를 폴더 UI로 보여주는 방식입니다.
- Firebase 웹 `apiKey`는 비밀키가 아니라 프로젝트 식별자로, 클라이언트 노출이 정상입니다. 실제 보안은 위의 **보안 규칙 + 로그인**으로 강제됩니다.
