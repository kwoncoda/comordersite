# 2026-05-14 — 디자인 결정 9건 사용자 확정 + 일괄 반영

## 목표

`/plan-design-review` 2차에서 식별한 *9개 미정 디자인 결정*을 사용자에게 모두 질문하여 확정. 결정 결과를 4개 SoT 문서에 즉시 반영. 일부 결정(Claude 실측·메뉴 PUBG 매핑)은 *상세 명세*까지 한 번에 마무리.

## 사용자 결정 9건 (2026-05-14)

| # | 결정 | 사용자 선택 |
|---|---|---|
| **d** | 군복 톤 WCAG AA 대비 검증 방법 | **Claude가 즉시 실측** ✅ |
| **e** | 미니맵 모달 모바일 닫기 버튼 | **상단 X + 하단 큰 닫기 둘 다** ✅ |
| **f** | "줍기" CTA 클릭 영역 | **버튼만 = "줍기"** ✅ |
| **h** | 단발 모션 재생 정책 | **도그태그만 세션당 1회, 나머지 매번** ✅ |
| **i** | 정산 마감 redirect 전환 | **200ms fade + 컨텍스트 카피** ✅ |
| **a** | 약도 이미지 형식 | **PNG/JPG** ✅ |
| **b** | 메뉴 PUBG 매핑 강도 | **상세 매핑 8종** (사용자 직접 명시) |
| **c** | 마스코트 자산 출처 | **🪖 헬멧 이모지 fallback + 운영 중 교체** ✅ |
| **g** | "WINNER WINNER" 폰트 조합 | **Black Ops One 영문 + Pretendard 한글 (현행)** ✅ |

8개는 권장 옵션 수용, 1개(b)는 사용자 직접 매핑 명시.

## 메뉴 PUBG 매핑 8종 (결정 b)

사용자 직접 명시 (PUBG 인게임 회복 아이템 매핑):

| 메뉴 본명 (G10) | PUBG 인게임 아이템 |
|---|---|
| 후라이드 | 🩹 붕대 (Bandage) |
| 양념 | 🧰 구급상자 (First Aid Kit) |
| 뿌링클 | 💼 의료용 키트 (Medical Kit) |
| 감자튀김 | 💉 응급 지혈 주사 (Adrenaline Syringe) |
| 뿌링감자튀김 | ⚡ 자가제세동기 (Defibrillator) |
| 칠리스 | 💉 아드레날린 주사기 |
| 콜라 | 💊 진통제 (Painkiller) |
| 사이다 | 🥤 에너지 드링크 (Energy Drink) |

**핵심 원칙:**
- 메뉴 *이름은 본명 유지* (G10)
- 일러스트·시각만 PUBG 회복 아이템 매칭
- 사용자가 D-3 (5/17)에 PUBG 인게임 캡처 또는 일러스트 8종 직접 제공
- 미수령 시 분류 이모지 fallback (ADR-006)

## Claude 실측 결과 — 군복 톤 WCAG AA 대비 9 조합 (결정 d)

sRGB 상대 명도(WCAG 2.1 공식) 계산:

**페이지 베이스 5 조합:**
| # | 조합 | 대비 | 결과 |
|---|---|---|---|
| 1 | `--color-ink (#E8E0C8)` on `--color-bg (#2E3A26)` | **9.16:1** | ✅ AA·AAA |
| 2 | `--color-ink` on `--color-surface (#3A4A2E)` | **7.25:1** | ✅ AA·AAA |
| 3 | `--color-muted (#A8A48C)` on `--color-bg` | **4.84:1** | ✅ AA (경계 통과) |
| 4 | `--color-accent (#F4D200)` (검정 텍스트) | **14.08:1** | ✅ |
| 5 | `--color-danger (#C73E1D)` 텍스트 on `--color-bg` | **2.37:1** | ❌ 미달 |

**카드 영역 4 조합:**
| # | 조합 | 대비 | 결과 |
|---|---|---|---|
| 6 | `--color-card-ink (#2A2820)` on `--color-card-bg (#C8B894)` | **7.60:1** | ✅ AA·AAA |
| 7 | `--color-card-muted (#5C5040)` on `--color-card-bg` | **4.02:1** | ⚠️ 미달 |
| 8 | `--color-accent` 텍스트 on `--color-card-bg` | **1.31:1** | ❌ 금지 |
| 9 | `--stamp-red (#B5301A)` on `--color-card-bg` | **3.16:1** | ⚠️ 큰 텍스트만 |

**조정 3건 적용:**
1. **#5 `--color-danger` 텍스트** → 군복 베이스 위에 *텍스트 X*. 빨간 배경 + 흰 텍스트 패턴 강제. 또는 24px+ Bold만.
2. **#7 `--color-card-muted` 명도 조정** → `#5C5040` → **`#48402C`** (대비 5.0:1 통과)
3. **#8-B 카드 내 형광 옐로 텍스트 금지** → AI 슬롭 #26 추가. 카드 위에는 *옐로 배경 + 검정 텍스트* 패턴만.

## 만든 것 / 수정한 것

| 파일 | Edit 수 | 핵심 변경 |
|---|---:|---|
| `docs/DESIGN.md` | 7 | §4.3 실측 결과 9 조합·§4.1 색상 3 조정·§9.6 sessionStorage 규약·§10.5 메뉴 PUBG 매핑·§11 슬롭 #26·§13 결정 로그 |
| `docs/COMPONENT_GUIDE.md` | 3 | §4.1 "줍기" 클릭 영역 = 버튼만·§4.12 미니맵 하단 닫기 + 접근성 강화 |
| `docs/PRD.md` | 1 | §9 G10 메뉴 PUBG 매핑 8종 명시 |
| `docs/DB_DRAFT.md` | 1 | §5.5 init.sql 메뉴 시드에 PUBG 일러스트 매핑 코멘트 8개 |
| `docs/tasks/2026-05-14-design-decisions-9건-반영.md` | (이 파일) | 작업 로그 |

총 12 Edit + 1 신규.

## 한 일

### 1. DESIGN.md (7 Edit)

- **§4.3 대비 검증** — 플레이스홀더 표 → *실측 결과 표* (9 조합 정확값 + 미달 3건 조정 권장)
- **§4.1 코어 팔레트** — `--color-card-muted` #5C5040 → **#48402C** (실측 #7 미달 조정)
- **§4.1 시맨틱** — `--color-danger` 사용 규칙 추가 (군복 베이스 위 텍스트 X, 배경+큰 텍스트만)
- **§4.1 카드 영역** — *카드 내 형광 옐로 텍스트 금지* 규칙 추가 (#8-B 실측 1.31:1)
- **§9.6 sessionStorage 모션 재생 규약** 신규 섹션 — 도그태그 1회·펄스·깜박·idle·도장은 매번
- **§10.5 메뉴 일러스트 PUBG 매핑** 신규 섹션 — 8종 매핑 표 + 자산 정책 + 저작권 가드
- **§11 AI 슬롭 #26** 신규 — 카드 내 형광 옐로 텍스트 (총 26개)
- **§13 결정 로그** — 2026-05-14 결정 4 라인 추가

### 2. COMPONENT_GUIDE.md (3 Edit)

- **§4.1 MenuCard** — "줍기" 클릭 영역 = **버튼만** 명시 (카드 전체 X, 모바일 실수 터치 방지)
- **§4.12 BoothMinimapModal 구조** — 하단 큰 "닫기" 버튼 추가 (상단 X와 둘 다)
- **§4.12 BoothMinimapModal 모션·접근성** — 닫기 4가지(하단 큰 닫기 주 경로/상단 X 부/외부 클릭/Esc) + 포커스 트랩·복귀·reduced motion 명시

### 3. PRD.md (1 Edit)

- **§9 G10** — 메뉴 8종 PUBG 회복 아이템 매핑 8개 명시 (붕대·구급상자·의료 키트·응급 지혈·자가제세동기·아드레날린·진통제·에너지 드링크)

### 4. DB_DRAFT.md (1 Edit)

- **§5.5 init.sql 메뉴 시드** — 각 INSERT INTO menus 줄에 PUBG 매핑 일러스트 코멘트 8개 추가
- 일러스트 경로 정책 명시 (`menus.image_url` 컬럼, D-3 수령 시 UPDATE, 미수령 시 ADR-006 분류 이모지 fallback)

## 테스트 결과

문서 편집 12 Edit + 신규 1. 수동 검증:

| 검증 항목 | 결과 |
|---|---|
| DESIGN.md 7 Edit | ✅ |
| COMPONENT_GUIDE.md 3 Edit | ✅ |
| PRD.md 1 Edit | ✅ |
| DB_DRAFT.md 1 Edit | ✅ |
| 대비 실측 일관성 — §4.3 ↔ §4.1 색상 조정 ↔ §11 #26 | ✅ |
| 메뉴 매핑 일관성 — DESIGN §10.5 ↔ PRD G10 ↔ DB_DRAFT §5.5 | ✅ |
| 미니맵 닫기 일관성 — COMPONENT §4.12 ↔ DESIGN_REVIEW §2-6 (e) | ✅ |
| "줍기" 영역 일관성 — COMPONENT §4.1 ↔ DESIGN_REVIEW §2-6 (f) | ✅ |
| sessionStorage 일관성 — DESIGN §9.6 ↔ COMPONENT §4.12 (펄스 매번) | ✅ |
| 사용자 메모리 정합 (project_one_time_service.md) | ✅ — 1차 운영 가치 보존 |
| 구현 코드 변경 0 | ✅ |

## 사용자 메모리 정합성

- `feedback_no_scope_pressure.md` ✅ — 사용자 명시 결정만 반영, 압박 X
- `project_one_time_service.md` ✅ — 메뉴 일러스트 D-3 미수령 시 분류 이모지 fallback이 *지금 운영*에 OK

## 다음에 할 것

### 시급 마감 (D-5 ~ D-7)

본 작업으로 *DESIGN_REVIEW.md §2-5 시급 결정 5건 (d·e·f·h·i) 모두 해결*. 남은 시급 결정 X.

### 자산 수령 (D-3, 5/17)

1. 메뉴 가격 8개 (G10) — DB_DRAFT §5.5 init.sql `menus.price` UPDATE
2. **메뉴 PUBG 일러스트 8종** (붕대·구급상자·의료 키트·응급 지혈·자가제세동기·아드레날린·진통제·에너지 드링크) — `menus.image_url` UPDATE
3. 마스코트 5종 (선택, 운영 중 교체 OK)
4. 부스 약도 PNG/JPG (G12 미니맵) — D-1 (5/19) 마감

### ADR 정식 개정 (별도 작업)

누적 12건 (변경 5: ADR-012/017/019/022/026 + 신규 7: 027~031 + 메뉴 매핑 + 컬러 조정)

### 구현 단계

사용자 "구현 시작" 신호 → `docs/IMPLEMENTATION_PLAN.md` Task 0.1
- 컬러 토큰 갱신 (`--color-card-muted` #48402C, danger 사용 규칙)
- sessionStorage 도그태그 키 구현
- 미니맵 모달 하단 닫기 버튼
- "줍기" 버튼만 클릭 영역
- 정산 마감 200ms fade redirect
- 메뉴 일러스트 fallback 시스템 (PUBG 이미지 미수령 시 분류 이모지)
- 카드 내 형광 옐로 텍스트 검출 회귀 (linter rule 또는 회귀 테스트)
