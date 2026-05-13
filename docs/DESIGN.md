# 디자인 시스템 — 오늘 저녁은 치킨이닭!

**작성일:** 2026-05-07 (`/design-consultation` 1차)
**관련 문서:** `order-system-plan.md` (7차본), `DECISIONS.md` (ADR-011, ADR-013, ADR-026), `UX_STRATEGY.md`, `SCREEN_STRUCTURE.md`, `COMPONENT_GUIDE.md`
**상태:** DRAFT — 시안·코드 작성 전 디자인 정책 단계

---

## 0. 이 문서가 정하는 것 / 정하지 않는 것

**정하는 것**
- 시각 토큰 (컬러·타이포·간격·라디우스·그림자·모션)
- 마스코트 사용 규칙
- AI 디자인 슬롭 회피 원칙
- 접근성 기본선 (WCAG AA)

**정하지 않는 것 (다른 문서에서 다룸)**
- 화면 단위 레이아웃 → `SCREEN_STRUCTURE.md`
- UX 원칙·사용자 여정 → `UX_STRATEGY.md`
- 컴포넌트별 변형 상태 → `COMPONENT_GUIDE.md`
- 실제 화면 시안·코드 → 사용자 "구현 시작" 신호 후

---

## 1. Memorable thing

> **"주문번호를 받았을 때 도그태그를 받은 느낌."**

축제 부스에서 영수증 받는 느낌이 아니라, 임무를 부여받은 분대원 한 명이 된 느낌. 도그태그(`#17/100`)를 *받는 순간 + 기다리는 시간 + 호명 듣는 순간*이 모두 작은 의식처럼 느껴지게.

이 한 가지를 강화하는 결정은 **채택**, 무관한 결정은 **보류**, 약화하는 결정은 **거부**.

---

## 2. 디자인 정체성

### 2.1 컨셉 (ADR-013)

**"Battle Royale Cafeteria"** — 전투지의 *공식 발급* 느낌과 카페테리아의 *손맛·따스함*을 결합.

```
      배달의민족 (UX 차원)            PUBG (시각 차원)            자체 마스코트
      ───────────────────             ──────────────              ─────────────
      ▸ 모바일 폭 360-430px            ▸ 디지털 픽셀 카모          ▸ 군용 헬멧 곰
      ▸ 큰 카트 버튼·CTA               ▸ 도그태그·고무 도장        ▸ 단계별 표정 변화
      ▸ 상단 가로 분류 탭              ▸ 형광 옐로 포인트          ▸ 빈 슬롯 fallback
      ▸ 단계 최소화                    ▸ 거친 텍스처               ▸ "WINNER WINNER" 카피
              │                              │                            │
              └─────────────┬────────────────┴────────────────┬───────────┘
                            │                                 │
                          [균형]                             [톤]
                  UX는 빠르고 친근                  비주얼은 진지하고
                  손맛 있는 종이 메모              공식적 — 농담은
                  같이 따뜻하게                    *부 카피와 마스코트*에만
```

### 2.2 톤 가이드 (UX vs Visual의 분리)

| 영역 | UX 톤 | 비주얼 톤 |
|---|---|---|
| 메뉴 카드 | 빠른 스캔, 큰 가격 | 종이 영수증 질감 + 도장 배지 |
| CTA 버튼 | 손가락 겨냥, 한 손 조작 | 형광 옐로 + 두꺼운 검정 테두리 |
| 도그태그 | 즉시 식별, 큰 숫자 | 양각 모노스페이스 + 떨어지는 모션 |
| 본부 대시보드 | 정보 밀도, 키보드·마우스 | 군용 5단계 카드 + 진행 상태 표시 |

### 2.3 농담의 위치

**농담은 *부 카피·마스코트 카피*에만.** 다음 영역은 *단호하게 진지함*:
- ❌ 결제 금액·계좌번호·이체 정보 — 농담 X
- ❌ 에러 메시지 (실패한 작업) — 농담 X, 회복 경로만
- ❌ 운영진 화면 — 모든 영역 농담 X
- ✅ 조리 현황판 단계 카피 ("🔥 지금 치킨이 기름 속으로 입장했습니다!")
- ✅ 주문 완료 화면 부 카피 ("WINNER WINNER CHICKEN DINNER!")
- ✅ 마스코트 변형 (헬멧 쓰는 중·출동 중·도착)

> 핵심: 사용자 *돈*과 관련된 곳은 농담 안 함. 사용자 *시간(기다림)* 관련된 곳은 농담 OK.

---

## 3. 디자인 시스템 방향

### 3.1 토큰 기반 시스템

**모든 시각 결정 = CSS 변수.** 컴포넌트는 토큰만 참조. 토큰 변경 1줄로 전체 일관성 변경 가능.

```
:root {
  /* 컬러 */
  --color-bg, --color-surface, --color-ink, --color-muted, --color-accent, ...
  /* 타이포 */
  --font-body, --font-display, --font-mono, --font-stencil
  --text-xs, --text-sm, --text-base, --text-lg, --text-xl, --text-2xl, --text-3xl
  /* 간격 */
  --space-2xs ~ --space-3xl
  /* 라디우스 */
  --radius-none, --radius-sm, --radius-md, --radius-lg, --radius-tag
  /* 그림자 */
  --shadow-stamp, --shadow-card, --shadow-sticker
  /* 모션 */
  --duration-tap, --duration-card, --duration-stamp
  --ease-stamp, --ease-tag-drop
}
```

구체값은 §4-§9에 정의.

### 3.2 두 모드: 사용자 모바일 vs 운영진 PC

같은 토큰을 *밀도 변형*으로 사용:

| 측면 | 사용자 (모바일 360-430px) | 운영진 (PC 1024+) |
|---|---|---|
| 기본 폰트 크기 | 16px | 14px |
| 행간 | 1.6 | 1.4 |
| 버튼 높이 | 56px (한 손 터치) | 36px (마우스) |
| 카드 패딩 | 16-24px | 12-16px |
| 정보 밀도 | 1화면 1주제 | 1화면 5단계 카드 |

### 3.3 군복 톤 하이브리드 (default) — *2026-05-13 변경*

**컬러 베이스 = 짙은 군복 톤 + 메뉴 카드 영역만 밝은 흙색** (PUBG 인벤토리 패러다임).

사용자 결정 (2026-05-13): "배틀그라운드의 컨셉에 맞게 군복 느낌, 짙은 초록색과 국방색, 군대색." 라이트 default(이전 §3.3, 2026-05-10)는 *부스 조명 가독성* 이유로 결정됐으나, 사용자가 *PUBG 톤 강도*를 키우는 방향으로 변경. *하이브리드*로 양쪽 다 잡음:

```
[페이지 베이스]                       [메뉴 카드 영역]
짙은 군복 (어두운 영역)               흙색·종이 톤 (밝은 영역)
─────────────────────                ─────────────────────
배경: 짙은 카키그린 #2E3A26            카드 배경: 따뜻한 흙색 #C8B894
표면: 어두운 올리브 #3A4A2E            카드 호버: #B8A684
잉크 (밝은 텍스트): #E8E0C8            카드 잉크 (어두운): #2A2820
경계: #4F5A3B
```

> **변경 근거:** ADR-026 §3.3을 *덮어씀*. 사용자가 *PUBG 인벤토리 톤*을 명시적으로 채택. 베이스를 군복 톤으로 두되 *메뉴 카드 영역만* 밝은 흙색으로 처리하면: ① PUBG 인벤토리 UI (어두운 사이드바 + 밝은 아이템 카드) 패러다임 정합 ② 부스 조명 환경의 *카드 영역 가독성* 보존 (본문 대비 4.5:1 이상) ③ 사용자가 보낸 배틀그라운드 인게임 이미지의 톤과 일치.

**컬러 베이스 결정 이력 (3차 변경):**

| 날짜 | 베이스 | 근거 |
|---|---|---|
| 2026-05-07 | 다크 default (#1A1A14) | 축제 저녁 환경 가정 |
| 2026-05-10 | 라이트 default (#F5EFE0) | 부스 조명 많아 밝음 (사용자 검증) |
| **2026-05-13** | **군복 톤 하이브리드 (베이스 #2E3A26 + 카드 #C8B894)** | **PUBG 인벤토리 톤 명시 채택 + 가독성 보존** |

---

## 4. 컬러

### 4.1 코어 팔레트

```
─── 베이스 (페이지 = 군복 톤, 2026-05-13 변경) ───────────────────
--color-bg:        #2E3A26   짙은 카키그린 (페이지 배경, 사이드바)
--color-surface:   #3A4A2E   어두운 올리브 (헤더·sticky bar)
--color-elevated:  #485B38   호버·강조 영역
--color-ink:       #E8E0C8   본문 텍스트 (밝은 종이톤 — 베이스에 올라감)
--color-muted:     #A8A48C   보조 텍스트
--color-divider:   #4F5A3B   구분선·테두리

─── 카드 영역 (메뉴·주문폼·도그태그 = 밝은 흙색, 2026-05-13 신규) ──
--color-card-bg:      #C8B894   따뜻한 흙색 (PUBG 아이템 카드 톤)
--color-card-surface: #B8A684   카드 중첩
--color-card-ink:     #2A2820   카드 내부 텍스트 (어두운 갈색)
--color-card-muted:   #5C5040   카드 내부 보조 텍스트
--color-card-divider: #9C8C68   카드 내부 구분선

─── 베이스 (보조 라이트 — 운영진 PC, 1차 운영 후 검토) ──────────
--color-bg-light:     #F5EFE0   기존 따뜻한 크림 (운영진 PC 데이터 밀도)
--color-surface-light:#EAE3D0
--color-ink-light:    #2A2C20

  적용: 사용자 사이드 = 군복 톤 하이브리드 (default).
        운영진 사이드(`/admin/*`) = 라이트 가능 — PC 데이터 밀도 필요시 1차 운영 후 검토.

─── 포인트: 형광 옐로 ────────────────────────────────────────────
--color-accent:        #F4D200   메인 CTA, 도그태그 액센트, 호명 알림
--color-accent-pressed:#D9BB00   눌림 상태
--color-accent-soft:   #F4D200/20  반투명 배경 (호버·하이라이트)

  근거: 축제장 저녁·부스 형광등 환경에서 *비상 신호처럼 빠르게 인식*.
        배민 빨강은 식욕 자극용 — 우리는 *호명 신호*가 더 중요.

─── 카모 액센트 (장식 — 5-10% 투명도까지만) ────────────────────────
--camo-olive:   #5C5D3A   올리브 그린
--camo-sand:    #9A8E6B   사막 베이지
--camo-earth:   #4F3D2A   어두운 흙갈색
--camo-leaf:    #6E7544   잎녹

  사용 규칙: 디지털 픽셀 카모 패턴 (10×10px 블록)을 5% 투명도로 배경 텍스처에만.
            *단색 영역으로 사용 금지* (살벌해 보임).

─── 시맨틱 ───────────────────────────────────────────────────────
--color-success:  #5A8C42   진청록 그린  ✅ 이체 확인 / 조리 완료
--color-warning:  #E59B0C   호박 옐로    ⚠️ 5분 경과 / 보류
--color-danger:   #C73E1D   진한 적색    ❌ 취소 / 거부 / 도장 빨강
--color-info:     #3A6B7E   슬레이트 블루 ℹ️ 안내

  근거: PUBG 톤이라 채도를 약간 낮춤. 일반 SaaS 빨강 #FF0000은 너무 디지털.
        도장 빨강(#C73E1D)은 진짜 잉크 도장 색에 가깝게.

─── 학생회 도장 컬러 (Risk 1) ─────────────────────────────────────
--stamp-red:      #B5301A   학생회·"PAID" 도장 빨강
--stamp-black:    #1F1B14   "RECOMMENDED"·"DONE" 도장 검정
--stamp-green:    #4A6B2D   "READY" 도장 (선택)

  사용: 도장 SVG에 채움색으로. 약간 회전(-3°~+3°), 약간 흐릿(0.3 opacity 외곽).
```

### 4.2 컬러 사용 매트릭스

| 상황 | 컬러 |
|---|---|
| 메인 CTA ("주문하기", "이체했어요") | `--color-accent` (형광 옐로) + `--color-ink` 검정 텍스트 |
| 보조 CTA ("취소", "뒤로") | `--color-surface` + `--color-divider` 테두리 |
| 도그태그 텍스트 | `--color-accent` (배경 검정) |
| "SOLD OUT" 도장 | `--stamp-red` |
| "RECOMMENDED" 도장 | `--stamp-black` |
| 진행 단계 progress bar 채움 | `--color-success` |
| 5분 경고 | `--color-warning` |
| 10분 경고·에러 | `--color-danger` |
| 카모 배경 텍스처 | `--camo-olive` 5% opacity |
| **"학번 없음" 체크박스 (외부인 분기)** | `--color-accent` **외곽선 2px 만** (배경 transparent), 체크 시 채움. *위계*: CTA가 *채움형 형광 옐로*라 체크박스는 *선형*으로 분리 (UX-2 정보 위계 보호) |

### 4.3 대비 검증 (WCAG AA) — *2026-05-14 군복 톤 재검증 필요*

> **🔴 시급 (D-7 이번 주)**: 2026-05-13 군복 톤 하이브리드 컬러 베이스 변경 후 대비 검증 재실행 미완. 디자이너·개발자가 *온라인 대비 검사기* (WebAIM Contrast Checker 등)로 실측 후 본 표 갱신 필요.

**페이지 베이스 (군복 톤) — 실측 대상:**

| 조합 | 추정 대비 | 검증 결과 |
|---|---|---|
| `--color-ink (#E8E0C8)` on `--color-bg (#2E3A26)` | ~9:1 (추정) | ⏳ 실측 필요 |
| `--color-ink` on `--color-surface (#3A4A2E)` | ~7:1 (추정) | ⏳ 실측 필요 |
| `--color-muted (#A8A48C)` on `--color-bg` | ~4.5:1 (경계 추정) | ⏳ 실측 필요 — 미달 시 명도 ↑ |
| `--color-accent (#F4D200)` on `--color-bg` (검정 텍스트) | ~10:1 (추정) | ⏳ 실측 필요 |
| `--color-danger (#C73E1D)` on `--color-bg` | ~3:1 (경계 추정) | ⏳ 실측 필요 — 미달 시 큰 텍스트만 사용 |

**카드 영역 (밝은 흙색) — 실측 대상:**

| 조합 | 추정 대비 | 검증 결과 |
|---|---|---|
| `--color-card-ink (#2A2820)` on `--color-card-bg (#C8B894)` | ~10:1 (추정) | ⏳ 실측 필요 |
| `--color-card-muted (#5C5040)` on `--color-card-bg` | ~4.5:1 (경계 추정) | ⏳ 실측 필요 |
| `--color-accent (#F4D200)` on `--color-card-bg` (검정 텍스트) | ~7:1 (추정) | ⏳ 실측 필요 |
| `--stamp-red (#B5301A)` on `--color-card-bg` | ~5:1 (추정) | ⏳ 실측 필요 |

**검증 절차:**
1. 디자이너 또는 개발자가 WebAIM Contrast Checker 또는 Chrome DevTools "검색 → 색상 대비" 사용
2. 각 조합에 대해 실제 hex 값 입력 → 대비비 확인
3. 4.5:1 미달 시 *명도 조정* (예: ink를 더 밝게, muted를 더 어둡게)
4. 본 표의 ⏳를 ✅/⚠️로 갱신
5. 미달 조합은 *대안 컬러* 명시 (예: 큰 텍스트만 허용, 또는 배경 변경)

**기존 라이트 default 기준 (2026-05-10, 보조 모드 검토용):**
- `--color-ink-light (#2A2C20)` on `--color-bg-light (#F5EFE0)`: ~14:1 ✅
- 본 라이트 모드는 *운영진 사이드 PC 데이터 밀도용 검토* (1차 운영 후, §4.1 참조)

---

## 5. 타이포그래피

### 5.1 폰트 스택

```css
--font-body: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont,
             system-ui, sans-serif;          /* 한글 본문 */
--font-display: 'Pretendard Variable', Pretendard, sans-serif;  /* 헤더 (Bold/Black) */
--font-mono: 'JetBrains Mono', 'D2Coding', 'Courier New', monospace; /* 도그태그·금액·학번 */
--font-stencil: 'Black Ops One', 'Pretendard Variable', sans-serif; /* "WINNER WINNER" 같은 강조 영문 */
```

**근거:**
- **Pretendard** — 한국 웹 표준 무료 폰트. Inter의 한국어 대응. *system-ui보다 강한 선택*.
- **JetBrains Mono** — 도그태그 양각 새김 느낌. tabular-nums 보장 → 메뉴 가격·금액 정렬 정확.
- **Black Ops One** — Google Fonts 무료 스텐실 폰트. "WINNER WINNER" 등 *영문 강조 1-2 곳에만*. 한글에 사용 X.
- ❌ Inter / Roboto / Noto Sans CJK — 게으름 신호.
- ❌ 시스템 default — `--font-body` fallback에만, 메인 사용 X.

### 5.2 타입 스케일 (모바일 기준)

```
--text-3xs:  10px   라벨 / "#1/100" 부제
--text-2xs:  12px   캡션 / 메뉴 분류
--text-xs:   14px   본문 보조 / 힌트
--text-sm:   16px   본문 default ★ 모바일 최소 권장
--text-base: 18px   강조 본문
--text-lg:   20px   카드 헤더
--text-xl:   24px   섹션 제목
--text-2xl:  32px   페이지 제목
--text-3xl:  48px   주문번호 (도그태그)
--text-4xl:  64px   "WINNER WINNER" 카피 (주문 완료 화면 1회)

* "WINNER WINNER CHICKEN DINNER!" 카피는 **항상 2줄 강제**:
   1줄: "WINNER WINNER"
   2줄: "CHICKEN DINNER!"
  HTML: <h1>WINNER WINNER<br>CHICKEN DINNER!</h1>
  CSS:  display: block; line-height: 1.0;
  근거: 360px 모바일에서도 "WOW" 임팩트 유지, 자동 줄바꿈에 맡기면
        "WINNER WINNER CHICKEN" / "DINNER!" 등 어색 위치 방지.
        PC에서도 동일 2줄 (도그태그·축하 의식 톤 일관).

행간 (line-height):
  본문 (sm/base): 1.6
  헤더 (lg+):    1.3
  도그태그:      1.0
```

### 5.3 폰트 굵기

```
--weight-normal:   400   본문
--weight-medium:   500   강조 본문
--weight-semibold: 600   라벨·UI
--weight-bold:     700   섹션 제목·CTA
--weight-black:    900   도그태그·"WINNER WINNER"
```

Pretendard Variable은 100-900 모두 지원. 다른 weight 사용 권장 X.

### 5.4 카피 스타일 가이드

| 상황 | 가이드 |
|---|---|
| 헤더 | 명령형·짧음 ("주문하기", "이체 확인 요청") |
| CTA 버튼 | 동사 + 명확한 결과 ("이체했어요, 확인 요청") |
| 카드 헤더 | 명사 (메뉴명·주문번호 등) |
| 안내 문장 | 친근체 ("~해주세요") |
| 마스코트 카피 | 농담 OK ("🔥 지금 치킨이 기름 속으로 입장했습니다!") |
| 에러 | 사실 + 회복 경로 ("입금 정보가 안 맞아요. 정보 수정 후 다시 보내주세요.") |
| 결제 금액 | 숫자 + "원" + 콤마 ("21,000원") + tabular-nums |

---

## 6. 간격 (Spacing)

### 6.1 4px base — 8-step scale

```
--space-3xs: 2px    아이콘 내부 micro
--space-2xs: 4px    배지·도장 내부 / 가까운 요소
--space-xs:  8px    버튼 내부 / 카드 항목
--space-sm:  12px   카드 패딩 (모바일)
--space-md:  16px   섹션 내부 간격 ★ default
--space-lg:  24px   섹션 사이
--space-xl:  32px   페이지 섹션 사이
--space-2xl: 48px   화면 세로 여유
--space-3xl: 64px   페이지 시작·끝 여유
```

### 6.2 컴포넌트 간격 규칙

| 영역 | 권장 |
|---|---|
| 메뉴 카드 사이 | `--space-sm` (12px) |
| 섹션 헤더 → 콘텐츠 | `--space-md` (16px) |
| CTA 버튼 위아래 여백 | `--space-lg` (24px) |
| 화면 좌우 패딩 (모바일) | `--space-md` (16px) |
| 화면 좌우 패딩 (PC) | `--space-2xl` (48px) |
| 본부 대시보드 카드 사이 | `--space-xs` (8px) — 정보 밀도 우선 |

### 6.3 한 손 조작 안전 영역

모바일 하단 80px는 *터치 hitbox 충돌 영역* — 메인 CTA가 fold 안에 있으면 sticky bottom bar로:
- bottom bar 높이: 72px
- 안전 영역(safe-area-inset-bottom) 추가
- bar 위 여백: `--space-md`

---

## 7. 라디우스 (Border Radius)

### 7.1 계층

```
--radius-none:  0px      도장 / 사진 / 스텐실 영역 (각진 군용 톤)
--radius-xs:    2px      배지 / 작은 칩
--radius-sm:    4px      입력 필드 / 보조 버튼
--radius-md:    8px      카드 default ★
--radius-lg:    12px     주요 모달 / 큰 카드
--radius-tag:   8px 8px 4px 4px   도그태그 (위는 더 둥글, 아래 약간)
--radius-pill:  9999px   상태 칩 (예: "조리 중")
```

### 7.2 사용 규칙

- **8px가 default.** 모르겠으면 8px.
- **24px 이상 금지** (둥글둥글 bubble = SaaS 슬롭).
- **각진 0px**는 *도장·사진·스텐실 영역*에만 의도적으로.
- **pill (9999px)** 은 *상태 표시 칩*에만 (CTA 버튼은 8px).

---

## 8. 그림자·텍스처

### 8.1 그림자 토큰

```
--shadow-card:    0 2px 4px rgba(0,0,0,0.15);
                  카드 default. 약하지만 분리감 확보.

--shadow-elevated: 0 4px 12px rgba(0,0,0,0.25);
                  모달 / 호버된 카드.

--shadow-stamp:   2px 2px 0 rgba(0,0,0,0.4);
                  도장 효과. blur 0 — 진짜 도장처럼 *오프셋만*.
                  *2026-05-13 결정 (ADR-026 §8.1 보강 / C 수용)*:
                  SVG 5종 → CSS stamp. transform: rotate(-3deg)
                  + Black Ops One 폰트 + border 2px + box-shadow
                  + `--stamp-red/black/green` 색상. SVG 외주 X.

--shadow-tag:     0 6px 0 -2px rgba(0,0,0,0.3),
                  0 8px 16px rgba(0,0,0,0.2);
                  도그태그 떨어진 직후 자국 + 부드러운 그림자.

--shadow-sticker: 1px 1px 0 rgba(0,0,0,0.5);
                  배지 / 칩 — 종이 스티커 붙인 느낌.
```

> **금지:** Tailwind default `shadow-md` 등 *블러 큰 부드러운 그림자* — SaaS 슬롭 신호. 그림자는 *오프셋 강조*가 더 PUBG/도장 톤에 맞음.

### 8.2 텍스처 (의도적·드물게) — *2026-05-13 갱신*

- **디지털 픽셀 카모** — *2026-05-13 결정 (F 수용)*: SVG → **CSS gradient 기본**. `linear-gradient` 3색 mix (`--camo-olive` + `--camo-sand` + `--camo-earth`, 5-10% opacity). 헤더·sticky bar 배경에. 본문 영역 X. SVG 외주 X.
- **종이 그레인 (noise.png):** 메뉴 카드 영역 (밝은 흙색) 배경 3% opacity. 사용자 약도 미수령 시 미니맵 모달 CSS 그리드 fallback에도 미세 적용.
- **도장 잉크 외곽** — *CSS stamp의 일부*: `box-shadow: 2px 2px 0 var(--stamp-red)` + `border: 2px solid var(--stamp-red)` + 살짝 회전(-3deg). SVG `feTurbulence` 미사용 (외주 X).

> 텍스처는 *분위기 신호*. 인식 부담을 늘리지 않을 정도로만. 군복 톤 베이스에 *카모 gradient* + 카드 영역에 *종이 그레인* = 두 영역의 톤 대비 강화.

---

## 9. 모션

### 9.1 듀레이션

```
--duration-tap:    100ms    터치 피드백
--duration-card:   200ms    카드 호버·등장
--duration-stamp:  150ms    도장 찍힘 (빠르게)
--duration-tag:    600ms    도그태그 떨어짐 (의식적으로 길게)
--duration-mascot: 400ms    마스코트 표정 변화
```

### 9.2 이징

```
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);     기본 등장
--ease-stamp:  cubic-bezier(0.34, 1.56, 0.64, 1); 도장 찍힘 (살짝 오버슛)
--ease-tag:    cubic-bezier(0.17, 0.67, 0.32, 1.5); 도그태그 떨어짐 (착지 살짝 튐)
```

### 9.3 모션 원칙

| 상황 | 모션 |
|---|---|
| 페이지 전환 | 200ms fade + 8px 슬라이드 (`--ease-out`) |
| 카트 담기 | 50ms 살짝 scale(0.96) → 100ms scale(1.04) → 50ms scale(1) — *살아있는 손* 느낌 |
| 도그태그 받음 | 위에서 40px 떨어지면서 -3° → +2° → 0° 회전 (`--ease-tag`, 600ms). **단발성** — 새로고침해도 반복 X. **구현:** `sessionStorage['dogtag-shown-{orderId}']` 플래그로 *세션당 1회만 재생*. 페이지 새로고침·뒤로가기·재방문 시 정적 표시. |
| 도장 찍힘 | scale(1.4, opacity 0) → scale(1, opacity 1) (`--ease-stamp`, 150ms). 음향 효과 X. |
| 마스코트 표정 변화 | 200ms cross-fade + 작은 흔들림 |
| 진행 단계 progress bar 채움 | 800ms ease-out, 부드럽게 |
| SSE 상태 변경 (조리 현황판) | 카드 0.5초 형광 옐로 깜박 → 새 카피로 전환 |

### 9.4 모션 금지

- ❌ 자동 carousel·자동 회전 (사용자 통제권 X)
- ❌ 무한 루프 애니메이션 (마스코트 idle 빼고)
- ❌ 페이지 진입 시 1초+ 화려한 인트로
- ❌ 호버 시 카드 8px+ 들리는 효과 (배민 톤 X)
- ❌ scroll-driven 애니메이션 (모바일 멀미)

### 9.5 reduced motion 지원 — *2026-05-14 신규 모션 5종 명시*

```css
@media (prefers-reduced-motion: reduce) {
  /* 기존 모션 */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* 도그태그 모션 제거 (떨어짐·회전 X) */
  .dog-tag { animation: none; transform: none; }

  /* 마스코트 cross-fade 없이 즉시 변형 */
  .mascot-state { transition: none; }

  /* 마스코트 idle 흔들 제거 (조리 중) */
  .mascot-cooking-idle { animation: none; }

  /* 2026-05-14 신규 — 본 검토 식별 */

  /* 본인 테이블 펄스 (미니맵, COMPONENT §4.12) */
  /* → static box-shadow + 형광 옐로 강조만 (animation X) */
  .table-mine { animation: none; box-shadow: 0 0 0 3px var(--color-accent); }

  /* StartBusinessCTA 빨간 깜박 (CLOSED + 16:30 이후 5분+) */
  /* → static 빨간 border 강조만 */
  .start-business-cta--urgent { animation: none; border-color: var(--color-danger); }

  /* 모달 진입 fade + slide 200ms */
  /* → 즉시 표시 (0.01ms) */
  .modal-enter { transition: none; }

  /* 도장 찍힘 모션 (StampBadge) */
  /* → 정적 표시 (scale·rotate 없음, 색상만) */
  .stamp { animation: none; transform: rotate(0); }
}
```

**철학:** 멀미·VR 어지러움 사용자를 위해 *animation·transition만 제거*하되 *시각 강조 (border·box-shadow·색상)는 보존*. 정보 손실 없이 *동적 요소만* 정적으로.

---

## 10. 마스코트 사용 가이드

### 10.1 5종 변형 (필요 자산) — *2026-05-13 B 거부 결정으로 5종 유지*

```
[기본]            [출동 준비]         [조리 중]            [도착]              [취소]
헬멧 곰 정면      손 들고 출발         치킨 들고 달림       엄지 척              X 표시 표정
default·완료      이체 확인 직후       COOKING 단계         READY·DONE 단계      CANCELED 단계
```

**축소 후보 B (마스코트 5종 → 2종 + 이모지) 거부 결정:** 2026-05-13 사용자가 5종 유지 선택. Memorable thing(도그태그)을 *마스코트와 함께* 보강하는 방향. fallback은 🪖 헬멧 이모지 (D-3 미수령 시 5단계 동일 이미지로 시작).

### 10.2 사용 위치

| 위치 | 변형 |
|---|---|
| 메뉴 화면 빈 카드 (이미지 없음) | 기본 |
| 카트 비어있을 때 | 기본 + "치킨이 기다려요!" 카피 |
| 주문 완료 화면 | 출동 준비 (도그태그 옆) |
| 조리 현황판 PAID 단계 | 출동 준비 |
| 조리 현황판 COOKING 단계 | 조리 중 |
| 조리 현황판 READY/DONE 단계 | 도착 |
| 조리 현황판 CANCELED 단계 | 취소 |
| 404·500 에러 화면 | 취소 + "임무 실패!" 카피 |
| **C-9 영업 외 안내 화면 (G13 신규, 2026-05-14)** | **기본 변형** + "🔒 영업 시간이 아니에요" 카피 |
| 운영진 화면 (대시보드 등) | **사용 금지** (정보 밀도 우선 — StartBusinessCTA·BusinessStateBadge에 마스코트 X) |

### 10.3 크기

- 빈 슬롯 fallback: 80×80px
- 조리 현황판: 160×160px (모바일) / 200×200px (PC 보조)
- 주문 완료 화면: 120×120px (도그태그 옆)
- 에러 화면: 200×200px
- **이외 위치 사용 금지** — 마스코트가 노이즈가 되지 않도록.

### 10.4 마스코트 카피 톤

- 짧음 (10자 이내 권장, 최대 20자)
- 액션·의성어 중심 ("출동!", "🔥 입장!", "🎉 도착!")
- 농담 OK
- ❌ 사과·해명·설명 금지 (그건 시스템 메시지가)

---

## 11. 피해야 할 AI 디자인 패턴 (이 프로젝트 특화)

각 항목은 **이 프로젝트에서 왜 잘못된지** 명시. 일반 SaaS에선 OK일 수도 있음.

| # | 패턴 | 이 프로젝트에서 왜 잘못된가 |
|---|---|---|
| 1 | 보라/바이올렛 그라데이션 | 그라데이션 자체가 SaaS 슬롭 신호 + 보라는 음식·전투 톤 어디에도 안 맞음 |
| 2 | 둥글둥글 24px+ border-radius | 군용·도장 톤 정면 충돌. 8-12px가 한계. |
| 3 | system-ui / -apple-system 본문 | 한국어 환경에서 *디자이너가 게으르다*는 신호. Pretendard 1줄 추가가 끝 |
| 4 | Inter / Roboto 본문 | "AI가 고른 폰트" — 한국 사용자 대상이라 Pretendard가 자연 |
| 5 | 진짜 위장 무늬 배경 | 살벌함. *디지털 픽셀 카모* 5% opacity까지만 |
| 6 | 3-column 아이콘 그리드 ("Fast / Reliable / Secure") | 학교 축제 부스 왜? 마케팅 사이트 슬롭 |
| 7 | 그라데이션 CTA 버튼 | 배민 톤 X, PUBG 톤 X. 단색 형광 옐로가 정답 |
| 8 | 중앙 정렬 모든 것 | 모바일 한 손 스캔은 *좌측 정렬*이 자연 |
| 9 | 라이트/다크 토글 버튼 | 운영 중 토글 부담. *2026-05-13: 군복 톤 하이브리드 single mode* (사용자 사이드만) — 토글 자체 X |
| 10 | "Built for Korean Students" 영어 카피 | 사용자가 한국 학생인데 영어로 자기소개? 슬롭 |
| 11 | 부드러운 큰 그림자 (`shadow-md` 등) | SaaS 신호. 하드 오프셋 그림자가 도장 톤에 맞음 |
| 12 | 페이지 진입 1초 인트로 애니메이션 | 부스 환경 = 대기 줄. 즉각 표시가 정답 |
| 13 | 자동 carousel | 사용자 통제권 박탈. 메뉴는 *세로 스크롤*만 |
| 14 | 호버 시 카드 8px+ 떠오름 | 모바일에서 호버 X. 데스크탑도 PUBG 톤 X |
| 15 | placeholder text를 라벨처럼 사용 | 접근성 X — 명시적 `<label>` 사용 |
| 16 | 토스트 알림 (페이지 우상단 슬라이드) | 부스 환경 즉시 인식 우선 — 인라인 메시지가 정답 |
| 17 | 스켈레톤 로더 | 30 동시·SQLite + SSE면 로딩 자체가 짧음. 단순 spinner나 텍스트면 충분 |
| 18 | 모달 안에 모달 | 모바일 절대 금지. 화면 하나는 한 임무 |
| 19 | "Powered by [framework]" 푸터 | 학생회 운영 웹에 왜? |
| 20 | 자동 다국어 토글 (i18n switcher) | 한국어 전용 — UI 노이즈만 |
| **21** | **PUBG 공식 로고·캐릭터 직접 사용** | *2026-05-13 G11 디자인 톤 갱신*: 컨셉/색감/패턴만 차용. PUBG 텍스트 폰트·UI 직접 복제도 저작권 위험 — *자체 마스코트 + Black Ops One* 조합으로 충분 |
| **22** | **메뉴 이름을 PUBG 아이템으로 *완전 리스킨*** | 2026-05-13 사용자 결정으로 *본명 유지* (콜라·사이다). PUBG 시각 매칭만 (콜라 = 에너지 드링크 일러스트). 이름까지 바꾸면 주문/이체 매칭 혼란 |
| **23** | **모달 안에 카운트다운 자동 닫힘** | 부스 환경 = 사용자가 *직접 통제* 우선. 자동 닫힘은 정보 놓침 |
| **24** | **인기 랭킹에 "🔥 압도적 1위!" 동적 카피** | *2026-05-13 E 결정으로 제거*: 검증 안 된 social proof. 정적 "🔥 학생회 추천 BEST" 단일 카피 |
| **25** | **PUBG 미니맵을 *자동 등장*하게** | G12 미니맵 모달은 *사용자 클릭으로만* 진입 (우상단 🗺️ 아이콘). 자동 등장 시 한 손 조작 방해 |

### 11.1 자체 검증 질문 (시안 만들 때마다)

> "이 화면을 *진짜 디자이너*가 자기 이름 걸고 보여줄 수 있나?"

YES면 진행. NO면 위 20가지 중 어느 것을 밟았는지 점검.

---

## 12. 접근성 기준 (WCAG AA + 모바일·축제 환경 보강)

### 12.1 색

- 본문 텍스트 대비비 **4.5:1 이상** (§4.3 검증)
- 큰 텍스트(18px+ Bold, 24px+) 대비비 3:1 이상
- 컬러만으로 의미 전달 금지 — 시맨틱 컬러는 *아이콘/텍스트와 함께*
- 다크 모드에서도 동일 기준

### 12.2 터치 타겟

- 모바일 최소 **44×44px** (Apple HIG)
- 사용자 화면 CTA: **56×56px 이상** (한 손·축제 환경)
- 인접 타겟 사이 최소 **8px** (오터치 방지)

### 12.3 포커스

- `:focus-visible`로 키보드 포커스 명시 — 형광 옐로 2px 외곽 + 2px 오프셋
- 마우스 클릭 시에는 포커스 링 X (`:focus`만 X)

### 12.4 ARIA·시맨틱

- 의미 있는 HTML 우선 (`<button>`, `<nav>`, `<main>` 등)
- ARIA는 시맨틱 HTML로 안 되는 경우만
- 라이브 영역 (live regions) — SSE 단계 변경에 `aria-live="polite"`로 스크린리더 안내
- 도그태그 = `<output role="status">` (즉시 발표)

### 12.5 폼

- 모든 input에 `<label>` 명시 (placeholder 라벨로 사용 X)
- 에러 메시지는 input 바로 아래 + `aria-describedby` 연결
- 학번 input은 `inputmode="numeric"` + `pattern="\d{9}"`로 모바일 키패드 자동
- 학번 9자리·이름 한글 등 *진행 표시* (예: 학번 7/9자리)

### 12.6 한국어 특화

- `lang="ko"` 명시
- 한글 자모 분리 검색 X (학번 검증과 무관하지만 메뉴 검색은 정확 매칭만 — Phase 2)
- 띄어쓰기 자유로운 검색 X — 학번은 *9자리 연속*만

### 12.7 모바일 특화

- viewport: `width=device-width, initial-scale=1, maximum-scale=5` (확대 가능)
- 텍스트 줌 200%까지 레이아웃 깨지지 않게 (`em`/`rem` 단위 사용)
- 가로 스크롤 발생 X — 컨테이너 `overflow-x: hidden` + 내부 컴포넌트 max-width 100%

### 12.8 스크린리더 시나리오 4가지 (직접 검증)

1. 메뉴 → 카트 → 주문 완료 → 도그태그 — 텍스트만으로 흐름 이해 가능
2. 조리 현황판 단계 변화 — `aria-live`로 자동 안내
3. 본부 대시보드 — 5단계 카드 명확히 구분 (heading + role)
4. 에러 — 입력 후 에러 메시지가 자동 발표

---

## 13. 결정 기록 (Design Decisions Log)

| 날짜 | 결정 | 근거 |
|---|---|---|
| 2026-04-29 | 컨셉 = 배민 UX + PUBG 비주얼 + 자체 마스코트 | ADR-013 |
| 2026-05-02 | 마스코트 = 군용 헬멧 곰 (`웹 로고.png`) | ADR-011 |
| 2026-05-07 | Memorable thing = "도그태그 받은 느낌" | `/design-consultation` 1차 |
| 2026-05-07 | 컬러 베이스 = 다크 default (#1A1A14) + 따뜻한 카키 | 축제 저녁 환경 (가정) |
| **2026-05-10** | **컬러 베이스 = 라이트 default (#F5EFE0) + 따뜻한 카키. 다크는 prefers-color-scheme 보조** | **사용자 검증: 부스 조명 많아 밝음. /plan-design-review Finding A** |
| 2026-05-07 | 포인트 컬러 = 형광 옐로 #F4D200 | 부스 형광등에서 호명 신호 인식 |
| 2026-05-07 | 본문 폰트 = Pretendard, 모노 = JetBrains Mono | 한국어 자연 + 도그태그 양각감 |
| 2026-05-07 | Risk 1 = 진짜 도장 (회전·blur 외곽) | 학교 축제 손맛 |
| 2026-05-07 | Risk 2 = 진짜 도그태그 모양 + 떨어지는 모션 | Memorable thing 강화 |
| 2026-05-07 | 라이트 모드는 보조, 토글 버튼 X | 운영 단순화 |
| 2026-05-07 | AI 슬롭 패턴 20개 명시 | 시안 자체 검증 가이드 |
| **2026-05-13** | **컬러 베이스 = 군복 톤 하이브리드 (베이스 #2E3A26 + 카드 #C8B894)** | **사용자 결정 — PUBG 인벤토리 톤 강화. §3.3 갱신** |
| **2026-05-13** | **도장 5종 = CSS stamp 기본 (SVG 외주 X)** | **축소 후보 C 수용 — rotate + Black Ops One + border** |
| **2026-05-13** | **카모 패턴 = CSS gradient 기본 (SVG 외주 X)** | **축소 후보 F 수용 — olive+sand+earth 3색 mix** |
| **2026-05-13** | **마스코트 5종 유지 (B 거부)** | **사용자 결정 — fallback은 🪖 헬멧 이모지** |
| **2026-05-13** | **인기 랭킹 정적 BEST (동적 카피 제거)** | **축소 후보 E 수용 — ADR-017 변경** |
| **2026-05-13** | **카트 라벨 "줍기·인벤토리"** | **G11 PUBG 인벤토리 패러다임 명시** |
| **2026-05-13** | **메뉴 본명 유지 + 일러스트만 PUBG 매칭** | **G10 8개 메뉴 본명. 콜라·사이다 이름 리스킨 X** |
| **2026-05-13** | **부스 미니맵 모달 신규 (G12)** | **PUBG 미니맵 톤 풀스크린 모달. 메뉴·완료 화면 🗺️ 진입** |
| **2026-05-13** | **영업 외 안내 화면 신규 (G13 /closed)** | **CLOSED 상태 풀스크린 안내. 마스코트 + 운영 일정** |
| **2026-05-13** | **AI 슬롭 패턴 25개로 확장 (PUBG 톤 특화 5개 추가)** | **PUBG 직접 복제·메뉴 리스킨 과잉·자동 모달 등** |
| **2026-05-14** | **§4.3 대비 검증 플레이스홀더 표 — 군복 톤 하이브리드 기준 실측 필요 (D-7 시급)** | `/plan-design-review` 2차 |
| **2026-05-14** | **§9.5 reduced motion 신규 모션 5종 처리 명시** (본인 테이블 펄스·StartBusinessCTA 깜박·모달 fade·도장 찍힘·마스코트 idle) | `/plan-design-review` 2차 |
| **2026-05-14** | **§10.2 마스코트 사용 위치 — C-9 영업 외 안내 추가** | `/plan-design-review` 2차 |
| **2026-05-14** | **4건 시급 미정 결정 식별** — (d) 군복 톤 대비 / (e) 미니맵 모바일 하단 닫기 / (f) "줍기" 클릭 영역 / (h) sessionStorage 규약 | `/plan-design-review` 2차 DESIGN_REVIEW.md §2-5 |

---

## 14. 후속 (다음 단계로 deferred)

- **실제 화면 시안 (Figma 또는 HTML wireframe)** — 사용자 "구현 시작" 신호 후
- **SVG 자산 (수령 필요):** ~~도장 5종~~ (✅ CSS stamp 결정, 2026-05-13 C), 도그태그 frame (HTML+CSS 기본), 마스코트 변형 5종 (B 거부로 유지), ~~카모 패턴~~ (✅ CSS gradient 결정, 2026-05-13 F), **부스 약도 1장 (G12 미니맵 모달용, D-1 마감)**, 메뉴 일러스트 8종 (PUBG 톤)
- **Tailwind config:** 위 토큰을 `tailwind.config.js`로 변환. *군복 톤 하이브리드 컬러* 변수 정의 우선
- ~~다이내믹 카피 룰~~ — *2026-05-13 E 결정으로 정적 BEST 단일 카피. 룰 코드 X*
- **운영진 사이드 라이트 모드 검토** — 1차 운영 후 회고. 현재는 단일 군복 톤 하이브리드
- **음향 효과:** 도장 찍힘·도그태그 떨어짐 — Phase 2 검토 (모바일 음소거 default 고려)
