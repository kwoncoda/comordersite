# 컴퓨터모바일융합과 축제 주문 시스템 — 시안 핸드오프

> 모바일 브라우저(사용자) + PC 브라우저(관리자) 웹앱.
> **앱이 아닌 모바일 웹**이지만 사용감은 네이티브에 가깝게.
> 본 문서는 `prototype.html` 시안과 짝을 이루는 디자인 의사결정 + 화면별 컴포넌트 구조 + Claude Code 핸드오프 가이드입니다.

---

## 0. 프로젝트 구조

```
prototype.html               ← 진입점 + 디자인 토큰(CSS variables) + Stage 셸
js/
  components.jsx             ← Atoms / Molecules (Button, Field, StatusChip, DogTag, Mascot 등)
  screens-customer.jsx       ← C-1 ~ C-6 사용자 화면
  screens-admin.jsx          ← A-1 ~ A-4 관리자 화면
  tweaks-panel.jsx           ← 시안 검토용 Tweaks 패널 (Claude Code 이관 시 제거)
  app.jsx                    ← Router + 상태(reducer) + Stage 래퍼
HANDOFF.md                   ← (본 문서)
```

`prototype.html`은 React + Babel을 CDN으로 로드. 실제 코드베이스에서는 Vite/Next + TypeScript로 옮기는 것을 권장.

---

## 1. 디자인 의사결정 — Why this looks this way

| 결정 | 근거 (참고 문서) |
|---|---|
| **라이트 모드를 기본**으로 채택. 다크 보조 모드는 `@media (prefers-color-scheme: dark)`에서만 호출. | DESIGN_REVIEW Finding C. 야간 운영 시 가시성, 광고/홍보물 통일감, 입금 안내 가독성 모두 라이트가 우세. |
| **카본 옐로(#F4D200) 단일 CTA 컬러**. 다른 액션은 모두 secondary/ghost. | DESIGN.md §3 단일 액센트. "최고가 무엇인지 확실히". |
| **도그태그(#17/100 형식)가 모든 화면의 주문 식별자**. 모달, 카드, 토스트, 헤더 어디서든 동일한 시각 자산. | UX_STRATEGY §7 도그태그 메타포. DESIGN.md §7.3. |
| **Pretendard + JetBrains Mono + Black Ops One(스텐실)** 3-font. 본문은 가독성, 가격/도그태그는 모노스페이스(자릿수 일정), 헤더 일부만 스텐실. | DESIGN.md §5. Inter/Roboto 등 흔한 폰트 회피. |
| **하드 오프셋 그림자(2~4px 단색)**만 사용. blur 그림자 = SaaS 슬롭 → 금지. | DESIGN.md §8. 도장처럼 "찍힌 느낌". |
| **마스코트는 SVG 플레이스홀더**. 실제 군용 헬멧 곰 5종은 디자이너 작업 슬롯. | 시스템 프롬프트 — placeholder가 bad attempt보다 낫다. |
| **음식 사진도 카테고리 색 + 줄무늬 placeholder**. 실 사진은 운영 1주일 전 촬영. | UX_STRATEGY §10 1-week-out 체크리스트. |

---

## 2. 디자인 토큰 (Single Source of Truth)

`prototype.html` `<style>` 블록 상단에 CSS 변수로 정의되어 있습니다. Claude Code로 이관 시:
- `tokens.css`로 분리 → Tailwind config의 `theme.extend` 또는 CSS-in-JS theme에 1:1 매핑.
- `oklch()`로 재정의해서 다크 모드 대응 시 동일한 채도/명도 유지.

핵심 그룹: Color / Camo / Status / Typography / Spacing / Radius / Shadow / Motion. (자세한 매핑은 DESIGN.md §3-§9 참조)

---

## 3. 화면별 컴포넌트 구조

> 표기: ⬆ = 상위 컨테이너, ▶ = 자식 컴포넌트, ⓢ = 상태(state). 모든 컴포넌트는 `js/components.jsx`에 atoms로 정의되어 있고, 화면은 그것들을 조립한 컨테이너입니다.

### C-1 `/menu` — 메뉴 목록 (`ScreenMenu`)
```
PhoneStage
  ⬆ TopbarBrand               ← 로고+이름+카트 아이콘+CountBadge
  ⬆ CatTabs (Pill x 6)        ← 전체 / 🔥인기 / ⭐추천 / 치킨 / 사이드 / 음료
  ⬆ PopularStrip              ← 다크 카드: 실시간 1위 + 부제
  ⬆ MenuGrid (2 columns)
     ▶ MenuCard × N
        ▶ MenuFallback (cat 색 + 줄무늬)
        ▶ Stamp(kind="recommended" | "sold-out")  ← 회전 도장
        ▶ AddButton (in-cart 상태 시 초록 + 수량 표시)
  ⬆ BottomBar (sticky)        ← "🛒 N개 · ₩ · 카트 보기 →" CTA
```
**상태 처리:** 첫 진입 시 700ms `LoadingState`(스피너 + 카피). 빈 카테고리 → `EmptyState`(전체 보기 CTA). 네트워크 실패 → `ErrorState` 풀스크린.
**터치 영역:** AddButton 38×card-width(≥160px), CatTab h≥36, BottomCTA h=56.

### C-2 `/cart` — 카트 (`ScreenCart`)
```
TopbarBack ("카트 (N)") · CartLines (card) · ReceiptCard (소계/할인 안내/합계) · BottomBar(다음 →)
EmptyState (카트 비었을 때, 마스코트 default + "치킨이 기다려요!")
```
QtyStepper는 36×36 버튼 + 모노 숫자. 0 도달 시 자동 제거(혹은 X로 명시 삭제).

### C-3 `/checkout` — 주문 정보 (`ScreenCheckout`)
```
TopbarBack
Section ① 신분 확인
  ▶ Checkbox (학번 없음 / 외부인) — 외곽선 옐로, 채움 X (DESIGN §4.2)
  ▶ Field "학번" (mono, 9자리 카운터 hint)
  ▶ Field "이름"
Section ② 수령
  ▶ RadioGroup (매장 / 포장)
  ▶ Field "테이블 번호" (매장 선택 시만)
Section ③ 쿠폰
  ▶ Checkbox (자동 판정 시 "✓ 1학년 — 적용 가능" 안내)
ReceiptCard
BottomBar (submitting=true 시 spinner + "주문 접수 중...")
```
**검증:** `^2026\d{5}$`로 1학년 자동 판정 → coupon 활성화 안내. 실패 시 Field error.

### C-4 `/complete` — 주문 완료 + 도그태그 (`ScreenComplete`)
```
Topbar ("주문 접수 완료" + StatusChip "ORDERED")
"WINNER WINNER CHICKEN DINNER!" 스텐실 헤드라인
DogTag (#17/100) — sessionStorage flag로 첫 진입에만 dropping 애니메이션 (DESIGN §9.3)
Mascot state="preparing"
ReceiptCard
AccountCard (검정 카드, 은행/계좌 노란색, 복사 버튼)
WarnBanner "이체 후 ‘확인 요청’ 꼭 눌러주세요"
BottomBar (2버튼: 1차 = 이체 확인 요청, 2차 = 조리 현황 보기)
```

### C-5 `/transfer-report` — 이체 확인 요청 (`ScreenTransfer`)
```
TopbarBack
OrderSummaryCard (도그태그 xs + 금액)
Field Select "이체하신 은행" (8개 옵션)
Checkbox "다른 이름으로 이체"  ← 체크 시 추가 Field
InfoCard "확인 후 자동으로 조리 현황판으로 이동"
BottomBar ("확인 요청 보내기")
```
**제출 후:** 곧바로 C-6 `/status`로 라우팅 (DESIGN_REVIEW Finding B).

### C-6 `/status` — 조리 현황판 (`ScreenStatus`)
```
TopbarBack + DogTag xs
ErrorState(kind="banner-top") ← SSE 끊김 시
StatusChip + 갱신 시각
Timeline (5-step: 접수→입금→조리→마무리→수령, 현재 단계 pulse)
Mascot (state별 5종)
CookingCopy (대형 카피 + 부연)
ReadyCallout (READY 상태에서만 노란 카드)
```
**상태→카피 매핑:** `ORDERED → "⏳ 입금을 기다리는 중"`, `TRANSFER_REPORTED → "💸 본부가 통장을 확인하는 중"`, `PAID → "✅ 입금 확인 완료!"`, `COOKING → "🔥 지금 치킨이 기름 속으로 입장!"`, `READY → "🎉 #17번, 수령 가능!"`, `DONE → "WINNER WINNER 임무 완수!"`.

### A-1 `/admin/login` — PIN (`AdminLogin`)
```
중앙 카드
  ▶ HQ stencil tag
  ▶ PinDisplay (4 cell)
  ▶ PinKeypad (3×4: 1-9, C, 0, ⌫)
```
**힌트:** 시안에서는 `7842`. 실제는 환경변수.

### A-2 `/admin/dashboard` — 주문 보드 (`AdminDashboard`)
```
AdminTopNav (브랜드 + 주문보드/이체확인(badge)/메뉴/통계 + LIVE 표시)
AdminBody (2col grid: AdminSidebar 200px + Content)
  AdminSidebar
    ▶ 오늘 운영 (접수/매출)
    ▶ 상태별 (CountBadge — 10분 초과 시 danger)
    ▶ 인기 메뉴 TOP3
  Content
    ▶ Kanban (6 columns)
      각 col: header(상태 라벨 + Count badge) + body(KanbanCards)
      KanbanCard: DogTag xs · 주문번호 · 경과시간(색상) · 이름 · 금액·수령방식·은행 · 빠른액션버튼
```
**Empty state:** 컬럼 비었을 때 "— 비어있음 —" 회색 안내. **Urgent:** 이체확인 컬럼 헤더가 10분 초과 카드 있으면 빨강 톤.

### A-3 `/admin/orders/:id` — 주문 상세 (`AdminOrderDetail`)
```
좌측: 주문자 / 이체 정보 / 이벤트 로그 (mono 타임라인)
우측: 주문 내역 + 액션 버튼 (현재 상태에 맞는 1차 액션 강조 + 보류/취소)
```
**Error state:** 잘못된 ID 진입 시 `ErrorState` + 대시보드 복귀.

### A-4 `/admin/transfers` — 이체 확인 큐 (`AdminTransfers`)
```
3-column responsive grid
TransferCard: DogTag · 이름 · 은행 · 금액(대형) · 학번 · 경과(색상) · 10분 초과 경고 배너 · [입금 확인 / 보류 / 상세]
EmptyState (모두 처리 완료, 초록 카드 + 🎉)
```

---

## 4. 빈/로딩/오류 상태 카탈로그

| 상태 | 컴포넌트 | 등장 화면 | 트리거 |
|---|---|---|---|
| Empty — 카트 | `EmptyState` 마스코트 default | C-2 | `state.cart.length === 0` |
| Empty — 카테고리 | `EmptyState` | C-1 | filtered=0 |
| Empty — 이체 큐 | inline 초록 카드 | A-4 | 큐 0건 |
| Loading — 첫 진입 | `LoadingState size="lg"` | C-1 | `state.firstLoad` |
| Loading — 제출 중 | `Button loading` spinner | C-3, C-5, A-1 | submit 후 |
| Error — 네트워크 풀스크린 | `ErrorState` | C-1 | fetch fail |
| Error — SSE 끊김 | `ErrorState kind="banner-top"` | C-6 | sse disconnect |
| Error — 잘못된 주문 | `ErrorState` | A-3 | order not found |
| Error — PIN 불일치 | `pin-cell.error` + shake | A-1 | wrong pin |

---

## 5. Tweaks 패널 (시연/검토 전용)

`Tweaks` 토글로 다음을 제어:
- **시연 모드** — Customer / Admin / Both (양분할)
- **빠른 이동** — 11개 사용자 상태 + 4개 관리자 페이지 직접 점프
- **액센트 색상** — 옐로 외 4종(오렌지/그린/블루/레드) 즉시 테마 스와프
- **상태 시뮬레이션** — 주문 상태 7종 강제 천이 (C-6 카피/마스코트 확인용)

`tweaks-panel.jsx`는 핸드오프 시 제거. 디자인 토큰만 가지고 가세요.

---

## 6. Claude Code 핸드오프 체크리스트

### 6.1 즉시 옮길 것
- [ ] `prototype.html` 상단 `<style>` 토큰 → `tokens.css` 또는 Tailwind config.
- [ ] `js/components.jsx` 9개 atoms/molecules → `/components/ui/*` 폴더로 1:1 분리.
- [ ] 각 Screen 파일을 라우트 페이지로 매핑 (예: `app/menu/page.tsx`).
- [ ] `reducer` (app.jsx) → 서버 상태로 옮길 부분(주문/카트)과 UI 상태(currentStep) 분리. TanStack Query + Zustand 권장.

### 6.2 API 슬롯 (서버 결정 필요)
| 슬롯 | 시안 위치 | 예상 형태 |
|---|---|---|
| 메뉴 fetch | C-1 첫로딩 | `GET /api/menus` → `MENUS[]` |
| 주문 생성 | C-3 submit | `POST /api/orders` → `{ id, dogtag }` |
| 이체 보고 | C-5 submit | `POST /api/orders/:id/transfer` |
| 상태 푸시 | C-6 | **SSE** `/api/orders/:id/events` (재연결 + 백오프) |
| 관리자 상태 변경 | A-2/A-3/A-4 | `PATCH /api/orders/:id` `{ status }` |
| 관리자 보드 푸시 | A-2 | **SSE** `/api/admin/events` |

### 6.3 운영 1주일 전 — 디자인 슬롯 채우기
- [ ] 마스코트 5종 (default/prep/cooking/arrived/abort) — 디자이너 또는 외주
- [ ] 메뉴 실 사진 9장 (1:1, 720px, 줄무늬 fallback과 동일 비율)
- [ ] 부스 위치 지도 placeholder → 캠퍼스 일러스트 1장
- [ ] 입금용 실계좌·예금주
- [ ] 운영 PIN 4자리

### 6.4 누락 방지 (DESIGN_REVIEW 정합성)
- Finding A 단일 액센트 ✓ — Tweaks 색상 변경도 액센트 한 변수만 건드림
- Finding B 자동 진입 ✓ — C-5 submit → 즉시 C-6
- Finding C 라이트 기본 ✓ — `:root` 라이트, `respect-dark` 클래스 시에만 다크
- Finding D 마스코트 placeholder ✓ — 디자이너 작업 슬롯 명시
- Finding E 5단계 타임라인 + 펄스 ✓

---

## 7. 접근성 / 모바일 대응

- 터치 영역: **모든 액션 ≥ 44px**. CTA는 56px.
- 색 대비: 텍스트/배경 4.5:1 이상 (옐로 위 잉크 = 10:1+).
- `prefers-reduced-motion` 시 모든 transition 0.01ms (도그태그 드롭, 펄스 포함).
- 키보드: 모든 input에 `inputMode` 지정 (학번/테이블/PIN = numeric).
- 스크롤: 하단 sticky CTA는 `safe-area-inset-bottom` 보정.

---

문서 끝.
