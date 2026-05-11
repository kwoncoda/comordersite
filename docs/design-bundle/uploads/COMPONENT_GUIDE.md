# 컴포넌트 가이드 — 오늘 저녁은 치킨이닭!

**작성일:** 2026-05-07 (`/design-consultation` 1차)
**관련 문서:** `DESIGN.md`, `UX_STRATEGY.md`, `SCREEN_STRUCTURE.md`, `ARCHITECTURE.md` §3
**상태:** DRAFT

---

## 0. 이 문서가 정하는 것

- 컴포넌트 분류 + 전체 목록
- 기본 컴포넌트 명세 (역할·상태 변형·접근성)
- 합성 컴포넌트 (도그태그·메뉴 카드·5단계 카드 등)
- 빈 / 로딩 / 오류 상태 컴포넌트
- 컴포넌트 사용 규칙 (어디 사용, 어디 사용 X)

**정하지 않는 것:**
- 컬러/폰트/간격 토큰 → `DESIGN.md`
- 화면 레이아웃 → `SCREEN_STRUCTURE.md`
- 실제 코드 — 사용자 "구현 시작" 신호 후

---

## 1. 컴포넌트 분류

```
Atoms (기본)              Molecules (조합)        Organisms (블록)
─────────────             ───────────────         ────────────────
Button                    StampBadge               MenuCard
Input                     PriceTag                 OrderTimeline (5단계 progress)
Select                    DogTagFrame              CartItem
Checkbox                  StatusChip               TransferReportForm
Radio                     CountBadge               AdminCardColumn (5단계)
Label                     IconLabel                MascotState
Icon                      MenuFallback             EmptyState / LoadingState / ErrorState
Spinner                   Toast (X — 미사용)       SettlementSummary
Divider                                            ZipDownloadCard

Templates (페이지 셸)
──────────────────────
CustomerLayout (모바일, 헤더 + 콘텐츠 + sticky CTA)
AdminLayout (PC, 가로 nav + 사이드바 + 본문)
ErrorLayout (마스코트 중심)
```

---

## 2. Atoms (기본 컴포넌트)

### 2.1 `Button`

**역할:** 사용자/운영진 액션 트리거.

**변형 (variant):**
- `primary` — 메인 CTA (형광 옐로 #F4D200 + 검정 텍스트)
- `secondary` — 보조 (배경 transparent + 테두리 + 잉크 텍스트)
- `danger` — 위험 액션 (`--color-danger` 배경 + 흰 텍스트)
- `ghost` — 최소 강조 (배경 X, 텍스트만)

**크기 (size):**
- `lg` — 사용자 모바일 메인 CTA (height 56px, font-size 18px)
- `md` — 일반 (height 44px, font-size 16px)
- `sm` — 운영진 화면 (height 36px, font-size 14px)

**상태:**
| 상태 | 시각 |
|---|---|
| `default` | 베이스 컬러 |
| `hover` (PC만) | 약간 어두워짐 (-5%) |
| `active` | scale(0.97) + 그림자 제거 |
| `disabled` | opacity 0.5 + cursor not-allowed |
| `loading` | 텍스트 hidden + 내부 spinner + disabled |

**접근성:**
- `<button>` 시맨틱 사용 (`<div onClick>` 금지)
- `:focus-visible` = 형광 옐로 2px ring + 2px offset
- `aria-busy="true"` (loading 시)
- 터치 hitbox 최소 44x44px (모바일 `lg`/`md`)

**사용 규칙:**
- 한 화면 메인 CTA 1개만 `primary`
- "취소·뒤로"는 `secondary`
- "취소(주문 취소)" 같은 *돌이킬 수 없는 액션*은 `danger`
- 텍스트 동사형 ("주문하기", "이체 확인", "삭제")

---

### 2.2 `Input`

**역할:** 한 줄 텍스트 입력.

**유형:**
- `text` (이름)
- `tel` (학번 — 숫자 키패드 자동, `inputmode="numeric"`)
- `password` (PIN)
- `number` (테이블 번호)

**상태:**
| 상태 | 시각 |
|---|---|
| `default` | 회색 테두리 (`--color-divider`) |
| `focus` | 형광 옐로 테두리 2px |
| `filled` | 테두리 잉크 색 |
| `error` | 빨간 테두리 + 하단 에러 메시지 |
| `disabled` | 배경 회색 + 입력 X |

**접근성:**
- 항상 `<label>` 명시 (placeholder 라벨 X)
- 에러 시 `aria-invalid="true"` + `aria-describedby` 연결
- 학번: `inputmode="numeric"`, `pattern="\d{9}"`, `maxlength="9"`, 진행 표시 ("7/9자리")

**사용 규칙:**
- placeholder는 *예시*만 ("예: 202637042"), 라벨 대체 X
- 한국어 입력 시 IME 충돌 주의 (한글 컨버전 중 keypress 핸들러 X)

---

### 2.3 `Select`

**역할:** 드롭다운 선택 (은행, 분류 등).

**구현:** native `<select>` 우선. 커스텀 드롭다운은 모바일 UX 안 좋아 미사용.

**상태:** `default`, `focus`, `disabled` (Input과 동일)

**사용 사례:**
- 이체 확인 화면 - 은행 선택 (카카오뱅크·신한·국민·기타 등)
- 메뉴 관리 - 분류 선택

---

### 2.4 `Checkbox` / `Radio`

**역할:** 다중·단일 선택.

**상태:** `default`, `checked`, `disabled`, `focus`, `error`

**시각:**
- 24×24px (모바일 한 손)
- 체크 시 형광 옐로 배경 + 검정 ✓
- 라벨 클릭 가능 (label hitbox 확장)

**접근성:**
- 라벨과 input 명시적 연결 (`<label htmlFor>`)
- 그룹은 `<fieldset><legend>`로 묶음

**핵심 사용 사례:**
- "□ 학번 없음 (외부인)" — UX-7 강조 → 외곽 형광 옐로 + 큰 hitbox (48px)
- "□ 다른 이름으로 이체" — 이체 확인 폼
- "□ 쿠폰 사용" — 주문 폼

---

### 2.5 `Label`

**역할:** input·checkbox 등에 의미 부여.

**변형:**
- `default` — 입력 위 (16px, 잉크)
- `compact` — 인라인 (14px)
- `required` — 빨간 별표 (`*`) 추가

**사용 규칙:**
- 모든 input에 1:1 대응
- 필수 필드는 `required` 변형 사용

---

### 2.6 `Icon`

**역할:** 시각 신호 (장식 X).

**라이브러리:** [Lucide Icons](https://lucide.dev) (오픈소스, 일관된 24px stroke 디자인)

**크기:** 16 / 20 / 24 / 32 / 48px

**컬러:** 부모 텍스트 색 상속 (`currentColor`)

**사용 규칙:**
- 의미 있는 아이콘만 (장식용 아이콘 추가 X)
- 텍스트 옆 보조용 (text-only도 OK면 제거)
- 아이콘만 있는 버튼은 `aria-label` 필수
- 마스코트는 *Icon 아님* — 별도 SVG

**핵심 사용:**
- 카트 아이콘 (헤더)
- 플러스/마이너스 (수량)
- 화살표 (뒤로, 다음)
- ✓ ⚠️ ❌ ℹ️ (시맨틱 — 컬러와 함께)

---

### 2.7 `Spinner`

**역할:** 로딩 상태 표시.

**변형:**
- `sm` (16px) — 버튼 내부
- `md` (24px) — 카드 내부
- `lg` (48px) — 풀 스크린

**시각:** 형광 옐로 회전 (1초 1바퀴, linear)

**사용 규칙:**
- *500ms 미만* 작업엔 표시 X (깜박만 됨)
- 단독 spinner X — 항상 *컨텍스트 라벨*과 함께 ("이체 확인 중...")
- 무한 spinner X — 30초+ 작업은 progress bar 또는 단계 표시

---

### 2.8 `Divider`

**역할:** 섹션·아이템 구분.

**변형:**
- `solid` — 실선 1px `--color-divider`
- `dashed` — 점선 (메뉴 카드 내부 가격·라벨 구분)
- `stamp` — 거친 실선 (도장 톤, 운영진 화면 헤더)

---

## 3. Molecules (조합 컴포넌트)

### 3.1 `StampBadge` ★ Risk 1

**역할:** 메뉴·주문에 *진짜 도장 찍힌 듯한* 배지.

**시각:**
```
┌─────────────────────┐
│   ╔═══════════╗     │  약간 회전 (-3° ~ +3°)
│   ║ SOLD OUT  ║     │  외곽 거칠게 (SVG turbulence filter)
│   ╚═══════════╝     │  중심에서 약간 어긋남 (도장 손맛)
└─────────────────────┘
```

**변형:**
| 종류 | 컬러 | 사용처 |
|---|---|---|
| `recommended` | `--stamp-black` | 메뉴 "RECOMMENDED" |
| `sold-out` | `--stamp-red` | 메뉴 "SOLD OUT" |
| `paid` | `--stamp-red` | 주문 상세 "PAID" |
| `done` | `--stamp-black` | 주문 상세 "DONE" |
| `canceled` | `--stamp-red` | 주문 상세 "CANCELED" |

**구현:**
- SVG 1개로 만들고 `<use>` 재사용
- 텍스트는 `<text>` 요소 (`font-stencil` 또는 Black weight)
- 외곽선: `stroke-dasharray` + `feTurbulence` filter
- 약간 회전: `transform: rotate(N deg)` (각 인스턴스 다른 각도)

**모션:**
- 등장 시 *도장 찍힘* 애니메이션 (scale 1.4 → 1, opacity 0 → 1, 150ms `--ease-stamp`)
- 한 번만 (재방문 시 정적 표시)

**접근성:**
- `<img alt="추천 메뉴">` 또는 `aria-label` 명시

---

### 3.2 `PriceTag`

**역할:** 가격·금액 표시.

**시각:**
- 폰트 = `--font-mono` (tabular-nums) — 자릿수 정렬
- 가격 옆 "원" 단위 (영문 "₩" X — 한국 사용자)
- 천 단위 콤마 ("21,000원")

**변형:**
- `default` — 본문 가격
- `large` — 합계·결제 금액 (24px+, Bold)
- `discount` — 취소선 + 할인된 금액 (회색 → 빨강)
- `discount-amount` — 할인 절약액 ("-1,000원", `--color-success`)

**사용 규칙:**
- 메뉴 카드, 카트, 주문 완료 화면, 정산 모두
- 모노스페이스라 자릿수 다른 가격이 *정렬*됨

---

### 3.3 `DogTagFrame` ★★ Risk 2 (Memorable thing)

**역할:** 주문번호 표시 — 진짜 도그태그 모양 + 양각 새김 폰트.

**시각:**
```
       ▼  (작은 구멍)
   ╔═══════════════╗
   ║               ║
   ║   #17 / 100   ║   ← JetBrains Mono Black 48px
   ║   2026-05-20  ║   ← Mono 14px 보조
   ║               ║
   ╚═══════════════╝
```

**구조:**
- 직사각형 (160x80 등 비율)
- `border-radius: 8px 8px 4px 4px` (위가 더 둥글)
- 위쪽 중앙에 작은 구멍 (`<circle>` 6x6)
- 배경 = 형광 옐로 (`--color-accent`) 또는 다크 모드 짙은 메탈 (`--color-elevated`)
- 텍스트 = 검정 양각 (text-shadow로 1px 위/왼쪽 살짝 밝게)
- 그림자 = `--shadow-tag` (위 자국 + 부드러운 아래 그림자)

**변형:**
- `default` — 정적 표시 (조리 현황판, 카드)
- `dropping` — 등장 모션 (주문 완료 화면 1회) — `--ease-tag` 600ms

**모션:**
- 등장: 위에서 40px 떨어지면서 `-3° → +2° → 0°` 회전 (`--ease-tag`)
- 정적: idle 시 모션 X (반복하면 멀미)
- READY 단계: 형광 옐로 깜박 (1초 2회) — 사용자 알림

**사용 위치:**
- C-4 주문 완료 (메인) — `dropping`
- C-6 조리 현황판 (READY 시 강조 표시) — `default`
- A-3 주문 상세 (헤더) — `default` (작은 크기)
- A-2 본부 대시보드 카드 (작은 크기) — `default`

**접근성:**
- `<output role="status" aria-live="polite">17번 주문 발급되었습니다</output>`

---

### 3.4 `StatusChip`

**역할:** 주문 상태·시스템 상태 표시 (작은 칩).

**시각:**
- 높이 24px, 둥근 모서리 (`--radius-pill`)
- 배경 + 텍스트 컬러 페어
- 작은 아이콘 + 짧은 텍스트

**변형:**
| 상태 | 배경 | 텍스트 | 아이콘 |
|---|---|---|---|
| `ordered` | `--color-elevated` | `--color-ink` | ⏳ |
| `transfer-reported` | `--color-warning` 20% | `--color-warning` | 💸 |
| `paid` | `--color-success` 20% | `--color-success` | ✓ |
| `cooking` | `--color-accent` 20% | `--color-ink` | 🔥 |
| `ready` | `--color-accent` | `--color-ink` (검정) | ✅ |
| `done` | `--color-success` | white | 🎉 |
| `canceled` | `--color-danger` 20% | `--color-danger` | ❌ |
| `hold` | `--color-warning` 20% | `--color-warning` | ⚠️ |

**사용:** 본부 대시보드 카드, 주문 상세 헤더, 정산 보고서.

---

### 3.5 `CountBadge`

**역할:** 숫자 카운트 (카트 개수, 컬럼 카드 수, 미해결 알림 등).

**시각:**
- 작은 원 또는 둥근 사각형 (24px 정도)
- 폰트 모노스페이스 + Bold
- 배경 = 컨텍스트 컬러 (위험 = `--color-danger`, 정보 = `--color-accent`)

**변형:**
- `default` — 정보 (카트 개수)
- `warning` — 경고 (5분 경과)
- `danger` — 위험 (10분 경과, 미해결 다수)

---

### 3.6 `IconLabel`

**역할:** 아이콘 + 텍스트 1세트.

**구조:**
```
[icon] 텍스트
```

**사용:**
- 메뉴 카드 부정보 ("매장 식사 / 9번 테이블")
- 본부 카드 메타 ("17:30 주문")
- 정산 화면 항목

---

### 3.7 `MenuFallback`

**역할:** 메뉴 사진 없을 때 fallback (ADR-006 + DESIGN §10).

**구조:**
```
┌───────────────┐
│               │
│   🍗 (대형)   │  ← 분류별 이모지 (치킨🍗, 사이드🍟, 음료🥤)
│               │  ← 또는 마스코트 곰 80px
│               │
└───────────────┘
배경: 분류별 컬러 약하게 (치킨=옐로 5%, 사이드=오렌지 5%, 음료=블루 5%)
```

**사용:** 메뉴 카드, 카트 항목, 주문 상세.

---

## 4. Organisms (블록 컴포넌트)

### 4.1 `MenuCard`

**역할:** 메뉴 1개 카드 (메뉴 목록 화면).

**구조:**
```
┌─────────────────────────┐
│  [이미지 또는 fallback]  │  4:3 비율, 라디우스 8px
│                          │  ─ Recommended/Sold-out 도장 (overlay)
├─────────────────────────┤
│ 후라이드 치킨            │  메뉴명 (16px Bold)
│ 18,000원                 │  PriceTag (16px Mono)
├─────────────────────────┤
│ [+ 카트 담기]            │  Button (sm primary 또는 disabled)
└─────────────────────────┘
```

**상태 변형:**
| 상태 | 시각 |
|---|---|
| `default` | 기본 |
| `recommended` | 도장 RECOMMENDED 좌상단 |
| `sold-out` | 카드 흐림 (opacity 0.6) + SOLD OUT 도장 + 버튼 disabled |
| `selected` | (카트 추가 후) 카운트 표시 + 버튼 "카트 ✓" |

**접근성:**
- 카드 전체가 `<article>` 시맨틱
- 도장은 `<img alt>` 명시
- "카트 담기" 버튼은 별도 (전체 카드 클릭 X)

---

### 4.2 `CartItem`

**역할:** 카트 화면 1줄.

**구조:**
```
┌──────┬────────────────────┬────────┐
│ [작은]│ 후라이드 치킨        │ X 삭제 │
│이미지 │ 18,000원             │        │
│      │ [-] 1 [+]            │        │  ← 수량 컨트롤 (큰 hitbox)
└──────┴────────────────────┴────────┘
```

**상태:**
| 상태 | 시각 |
|---|---|
| `default` | 기본 |
| `editing` | 수량 변경 중 (펄스 피드백) |
| `removing` | 삭제 모션 (slide out + opacity 0) |

---

### 4.3 `OrderTimeline` (5단계 progress)

**역할:** 조리 현황판 진행 단계 표시.

**구조:**
```
[●─────●─────●─────○─────○]
 접수  입금  조리  마무리 수령
   ★현재 단계 형광 옐로 채움
```

**시각:**
- 5개 노드 + 4개 연결선
- 채움: 현재 단계까지 형광 옐로
- 미래 단계: 회색
- 라벨: 노드 아래 짧은 텍스트 (10px)

**상태 변형:**
- ORDERED: 1단계 채움 (접수만)
- TRANSFER_REPORTED: 2단계 진행 중 (회전 spinner)
- PAID: 2단계 채움
- COOKING: 3단계 진행 중
- READY: 4단계 채움 + 5단계 강조
- DONE: 모두 채움

**모션:** 단계 변경 시 800ms ease-out으로 채워짐.

**접근성:** `<progress>` 요소 또는 `aria-valuenow` 명시.

---

### 4.4 `MascotState`

**역할:** 마스코트 5종 변형 표시 (`DESIGN.md` §10.1).

**props:**
- `state`: `default | preparing | cooking | arrived | canceled`
- `size`: `sm (80px) | md (160px) | lg (200px)`
- `caption`: 카피 텍스트

**모션:**
- 변형 전환: cross-fade 200ms + 살짝 흔들 (rotate ±2°)
- idle: COOKING 변형만 살짝 흔들 (3초 사이클, ±1°)
- 다른 상태는 정적

**사용 위치 + 변형 매핑:** `DESIGN.md` §10.2 표 참조.

---

### 4.5 `TransferReportForm`

**역할:** 이체 확인 요청 폼 (C-5 화면 메인).

**구조:** `SCREEN_STRUCTURE.md` §3.5 참조.

**필드:**
- 은행 (Select 필수)
- "다른 이름으로 이체" (Checkbox)
- 다른 이름 (Input — 체크박스 활성화 시만)
- 제출 (Button primary)

**검증:**
- 은행 선택 필수
- "다른 이름" 체크 시 이름 input 필수

---

### 4.6 `AdminCardColumn` (5단계 카드 컬럼)

**역할:** 본부 대시보드 5단계 (또는 6단계 + HOLD) 컬럼.

**구조:**
```
┌──────────────────────┐
│ [컬럼 헤더]           │
│ 이체확인요청 (5) ⚠️    │ ← 카운트 + 경고 표시
├──────────────────────┤
│ [Card #17 ⚠️5분]      │ ← 카드 정렬: 오래된 게 위
│ ...                  │
│ [Card #18 🔴10분]     │
│ ...                  │
└──────────────────────┘
```

**카드 내부:**
- 주문번호 + 경과시간
- 이름·은행·금액
- 액션 버튼 (인라인)

**상태 변형:**
- 정상: 회색 헤더
- 경고 (5분+ 카드 1개+ 있음): 노랑 헤더
- 위험 (10분+ 카드 1개+ 있음): 빨강 헤더 + 진동 알림 (Phase 2)

**모션:**
- 새 카드 등장: 위에서 슬라이드 (200ms)
- 카드 다음 컬럼 이동 (상태 전이): 슬라이드 (300ms)

---

### 4.7 `SettlementSummary`

**역할:** 정산 요약 표시 (A-6 화면).

**구조:**
```
┌────────────────────────────┐
│ 5/20 정산 요약              │
├────────────────────────────┤
│ 마감 시각:    21:42         │
│ 총 주문:      234건          │  ← 큰 숫자 (Mono Bold)
│ 총 매출:      1,250,000원   │
│ 쿠폰 할인:   -45,000원      │
│ 실수령 예상: 1,205,000원    │  ← 강조 (큰 숫자)
│ 통장 입금:   [_______] 원    │  ← 수동 입력 Input
│ 차이:        _________      │  ← 자동 계산 (강조 시 빨강)
└────────────────────────────┘
```

**상태:**
- `pending` — 마감 전 (실시간 합계, "(임시)" 라벨)
- `closed` — 마감 후 (불변 스냅샷)
- `mismatch` — 통장 차이 100원+ → 빨간 경고

---

### 4.8 `ZipDownloadCard`

**역할:** ZIP 백업 다운로드 카드 (정산 화면 내).

**구조:**
```
┌────────────────────────────┐
│ 📦 전체 데이터 ZIP 백업      │
├────────────────────────────┤
│ 마지막 자동: 21:30 (12분 전)│
│                              │
│ [📥 수동 백업 다운로드]      │  ← Button primary
│                              │
│ 백업 이력:                   │
│ - 21:42 manual (admin1)     │
│ - 21:30 auto                 │
│ - 21:00 auto                 │
└────────────────────────────┘
```

**상태:**
- `default` — 다운로드 가능
- `downloading` — Spinner + "백업 만드는 중..." (3-30초)
- `success` — 다운로드 완료 알림 ("USB 보관 잊지 마세요!")
- `error` — 디스크 부족 등 → 사유 + 재시도

---

## 5. 빈 / 로딩 / 오류 상태 컴포넌트

### 5.1 `EmptyState`

**역할:** 데이터 없음 화면.

**구조:**
```
┌────────────────────────────┐
│                              │
│       [마스코트 80px]         │  ← 컨텍스트별 변형
│                              │
│   "치킨이 기다려요!"           │  ← 친근 카피
│   "메뉴부터 골라봐요."         │  ← 다음 액션
│                              │
│       [메뉴 보기]              │  ← CTA Button
│                              │
└────────────────────────────┘
```

**변형 by 컨텍스트:** `UX_STRATEGY.md` §6.1 표 참조.

**사용 규칙:**
- 마스코트 + 카피 + CTA 3요소 필수
- 빈 사각형·"No data"·영문 X

---

### 5.2 `LoadingState`

**역할:** 로딩 중 표시.

**3가지 변형:**

**(a) `inline-button`** — 버튼 내부 Spinner
```
[ ⟳ 처리 중... ]   ← Button loading 상태
```

**(b) `inline-card`** — 카드 안 로딩
```
┌────────────┐
│   ⟳        │
│ 불러오는 중 │
└────────────┘
```

**(c) `modal`** — ZIP 다운로드 같은 큰 작업
```
┌────────────────────┐
│  📦                 │
│  백업 만드는 중...   │
│  ▓▓▓▓░░░░░░ 40%     │
│  닫지 마세요         │
└────────────────────┘
```

**사용 규칙:** `UX_STRATEGY.md` §6.2 표 참조 (500ms 미만 표시 X).

---

### 5.3 `ErrorState`

**역할:** 오류 표시.

**5가지 변형:**

**(a) `inline-field`** — input 아래 에러 메시지
```
학번: [202637____]  ⚠️
"학번은 9자리 숫자입니다."  ← 빨강 14px
```

**(b) `inline-card`** — 카드 안 오류
```
┌─────────────────────┐
│ ⚠️ 메뉴를 불러올 수    │
│   없어요.            │
│ [다시 시도]          │
└─────────────────────┘
```

**(c) `banner-top`** — 화면 상단 알림
```
[⚠️ 연결이 끊어졌어요. 다시 연결 중...] (자동 재연결)
```

**(d) `page-404`** — 404 풀 스크린
```
┌────────────────────────────┐
│                              │
│       [마스코트 — canceled]   │
│                              │
│   "이 페이지는 임무에서        │
│    사라졌어요."                │
│                              │
│       [홈으로]                 │
│                              │
└────────────────────────────┘
```

**(e) `page-500`** — 시스템 오류 풀 스크린
```
┌────────────────────────────┐
│                              │
│       [마스코트 — canceled]   │
│                              │
│   "잠시 시스템에 문제가         │
│    생겼어요."                  │
│   "부스에 직접 문의해 주세요." │
│                              │
│       [재시도]                 │
│                              │
└────────────────────────────┘
```

**사용 규칙:** `UX_STRATEGY.md` §6.3 표 참조 (사용자 책임처럼 들리는 카피 X).

---

## 6. Templates (페이지 셸)

### 6.1 `CustomerLayout`

```
┌────────────────────────────┐
│ [로고]            [카트 N]  │ Header (sticky top, 56px)
├────────────────────────────┤
│                              │
│        본문 (콘텐츠)          │ flex-1, padding 16px
│                              │
│                              │
│                              │
├────────────────────────────┤
│  [메인 CTA Button]            │ Sticky bottom (있으면)
│                              │ + safe-area-inset-bottom
└────────────────────────────┘
```

**사용:** `/menu`, `/cart`, `/checkout`, `/orders/:id/*`

---

### 6.2 `AdminLayout`

```
┌──────────────────────────────────────────────────────┐
│ [로고] 본부/메뉴/정산/쿠폰/시스템   [admin1] [logout] │ Top nav
├──────┬───────────────────────────────────────────────┤
│ 카드  │                                                │
│ 5단계 │             본문 (콘텐츠)                       │
│ 카운터│                                                │
│       │                                                │
│       │                                                │
└──────┴───────────────────────────────────────────────┘
```

**사용:** `/admin/dashboard`, `/admin/orders/:id`, `/admin/menus`, `/admin/settlement` 등

---

### 6.3 `ErrorLayout`

```
┌────────────────────────────┐
│                              │
│        [중앙 정렬]            │
│        마스코트                │
│        카피                   │
│        CTA                    │
│                              │
└────────────────────────────┘
```

**사용:** 404, 500

---

## 7. 컴포넌트 사용 매트릭스 (어떤 컴포넌트가 어디 사용?)

| 컴포넌트 | C-1 | C-2 | C-3 | C-4 | C-5 | C-6 | A-2 | A-3 | A-4 | A-5 | A-6 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Button | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Input | | | ✓ | | ✓ | | ✓ | | | ✓ | ✓ |
| Select | | | | | ✓ | | | | | ✓ | |
| Checkbox | | | ✓ | | ✓ | | | | | | |
| StampBadge | ✓ | | | | | | | ✓ | | ✓ | |
| PriceTag | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | ✓ |
| DogTagFrame | | | | ✓★ | | ✓ | ✓ | ✓ | ✓ | | |
| StatusChip | | | | | | | ✓ | ✓ | ✓ | | ✓ |
| CountBadge | ✓ | ✓ | | | | | ✓ | | ✓ | | |
| MenuFallback | ✓ | ✓ | | ✓ | | | | ✓ | | ✓ | |
| MenuCard | ✓ | | | | | | | | | | |
| CartItem | | ✓ | | | | | | | | | |
| OrderTimeline | | | | | | ✓★ | | | | | |
| MascotState | ✓ (빈) | ✓ (빈) | | ✓ | | ✓★ | | | | | |
| TransferReportForm | | | | | ✓★ | | | | | | |
| AdminCardColumn | | | | | | | ✓★ | | | | |
| SettlementSummary | | | | | | | | | | | ✓★ |
| ZipDownloadCard | | | | | | | | | | | ✓ |
| EmptyState | ✓ | ✓ | | | | | ✓ | | | | ✓ |
| LoadingState | ✓ | | ✓ | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ErrorState | ✓ | | ✓ | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

★ = 핵심 컴포넌트

---

## 8. 컴포넌트 구현 체크리스트 (각 컴포넌트 만들 때)

```
□ 시맨틱 HTML 사용 (button, label, input, fieldset 등)
□ 토큰만 사용 (DESIGN.md), 하드코딩 0
□ 상태 변형 모두 정의 (default, hover, active, focus, disabled, loading, error)
□ 접근성:
  □ aria-* 필요한 곳 명시
  □ 포커스 가능 (키보드)
  □ 색만으로 의미 전달 X
  □ 터치 hitbox ≥ 44px (모바일)
□ 모션:
  □ prefers-reduced-motion 지원
  □ 200ms 안에 피드백
□ 한국어 + 영어 검증 (Pretendard 폰트 적용)
□ 다크 default + 라이트 fallback 모두 검증
□ 모바일 360-430px viewport에서 깨지지 않음
```

---

## 9. 미정·후속

- **컴포넌트 코드 위치:** EJS partial (`views/_partials/`)? Alpine.js 컴포넌트? — 구현 단계 결정.
- **마스코트 SVG 자산:** 5종 변형 — 디자이너 제작 (사용자 또는 외주). 1차 운영 전 필수.
- **도장 SVG:** RECOMMENDED·SOLD OUT·PAID·DONE·CANCELED 5종. 1회 제작 후 색·텍스트만 변형.
- **카모 패턴 SVG:** 헤더 배경용. 10x10 픽셀 블록 패턴.
- **알림음 자산:** 본부 대시보드용 (Phase 2).
- **컴포넌트 카탈로그 페이지** (`/admin/components` 같은 dev 페이지) — 1차 운영 후 인수인계 자산화.
