# 디자인 리뷰 보고서 — 오늘 저녁은 치킨이닭!

**작성일:** 2026-05-10 (`/plan-design-review` 1차)
**리뷰자:** Claude Code (Senior Product Designer 관점)
**리뷰 대상:** `docs/DESIGN.md`, `docs/UX_STRATEGY.md`, `docs/SCREEN_STRUCTURE.md`, ~~`docs/USER_FLOW.md`~~ (없음 → `UX_STRATEGY.md §5` + `SCREEN_STRUCTURE.md §4`로 대체)
**보조 참조:** `docs/COMPONENT_GUIDE.md`, `docs/DECISIONS.md` (ADR-001~026), `docs/order-system-plan.md` (7차본)

---

## 0. 리뷰 요약 (Executive Summary)

```
+============================================================================+
|       DESIGN PLAN REVIEW — COMPLETION SUMMARY                              |
+============================================================================+
| System Audit         | DESIGN.md + UX_STRATEGY.md + SCREEN_STRUCTURE.md   |
|                      | COMPONENT_GUIDE.md 모두 존재. UI scope 13 P0 화면 |
| Step 0               | 종합 7.7/10 — Pass 7(미해결)이 가장 약함            |
| Pass 1  (Info Arch)  | 8/10 → 8/10 (변경 X)                                |
| Pass 2  (States)     | 7/10 → 8/10 (자동 진입·외부인 공유 명시)            |
| Pass 3  (Journey)    | 7/10 → 8/10 (자동 진입·운영진 단축키 매핑)          |
| Pass 4  (AI Slop)    | 9/10 → 9/10 (이미 강함)                             |
| Pass 5  (Design Sys) | 9/10 → 10/10 (라이트 default·체크박스 위계 정리)    |
| Pass 6  (Responsive) | 8/10 → 9/10 (WINNER 줄바꿈·도그태그 단발성 명시)    |
| Pass 7  (Decisions)  | 6/10 → 9/10 (8개 결정 / 2개 의식적 skip)            |
+----------------------------------------------------------------------------+
| HARD REJECTION 검증  | 7/7 모두 PASS ✅                                    |
| Litmus 7 검증        | 7/7 모두 PASS ✅                                    |
| AI 슬롭 패턴 (DESIGN.md §11에 20개 명시)                                    |
| NOT in scope         | 6 항목 (마스코트 자산·도장 자산·카모 패턴 등)        |
| What already exists  | DESIGN.md §3.1 토큰 시스템 + 4 docs 일관 참조       |
| Approved Mockups     | 0 (사용자 요청에 따라 시안·코드 작성 X)              |
| Decisions made       | 8 added to plan (A·B·D·E·F·H·I·J)                   |
| Decisions deferred   | 2 skip (C 본부 폴링 트리거·G 마스코트 5→4종)        |
| Overall design score | 7.7/10 → 9.0/10                                     |
+============================================================================+
```

**한 줄 평가:** 디자인 정체성·AI 슬롭 회피·시스템 토큰화는 *상위 1% 수준*. 약점은 *구현 전 미해결 결정 사항*이었으며 이번 리뷰로 8건 닫음. **이제 구현 시작 신호 받을 수 있는 상태**.

---

## 1. 사용자 7가지 검토 기준 vs 7 Pass 매핑

| 사용자 기준 | 매핑 Pass | 점수 | 판정 |
|---|---|:---:|---|
| ① 이 제품만의 디자인 방향이 있는가 | Pass 4 + Pass 5 | 9.5/10 | ✅ 강함 |
| ② 사용자 여정·감정 흐름이 명확한가 | Pass 3 + Pass 2 | 8/10 | ✅ 강화됨 |
| ③ 화면별 역할·우선순위 명확한가 | Pass 1 | 8/10 | ✅ 강함 |
| ④ SaaS·앱 템플릿 위험 | Pass 4 (AI Slop) | 9/10 | ✅ 강함 |
| ⑤ 모바일 UX 자연스러운가 | Pass 6 + Pass 1 | 8/10 | ✅ 강화됨 |
| ⑥ 접근성 기준 충분한가 | Pass 6 (A11y) | 9/10 | ✅ 강함 |
| ⑦ 구현 전 결정 필요 이슈 | Pass 7 | 9/10 | ✅ 강화됨 |

**모든 7개 기준 8/10 이상 통과.**

---

## 2. Pass 1 — Information Architecture (정보 구조)

### 점수: 8/10 → 8/10 (변경 없음)

**강점:**
- `SCREEN_STRUCTURE.md §1` 사이트맵 명확 (사용자 트리 + 관리자 트리 분리)
- `§2` 화면 우선순위 P0/P1/P2 19개 화면 분류
- `§3` 화면별 ASCII 와이어프레임 (메뉴·카트·주문폼·도그태그·이체·조리현황·본부·정산 등 12개)
- 각 와이어프레임에 *1순위·2순위·3순위* 정보 위계 명시
- "constraint worship" — *3가지만 보여줄 수 있다면 무엇*이 사실상 답이 되어 있음 (예: 도그태그·계좌·확인 요청 CTA가 주문 완료 화면 우선)

**경미 약점 (점수 안 깎음):**
- "constraint worship" 명시적 문구는 없음 — 사실상 충족하지만 *원칙 명시*로 강화 가능
- §3.7 본부 대시보드 = 5단계 카드 동시 표시. 폭주 시 카드 30개 동시면 *세로 스크롤 필수* → 명시되지 않음 (작은 트레이드오프)

**판정:** 추가 수정 필요 없음.

---

## 3. Pass 2 — Interaction State Coverage (상호작용 상태)

### 점수: 7/10 → 8/10 (Finding B로 보강)

**강점:**
- `UX_STRATEGY.md §6` 빈/로딩/오류/성공 4 상태 *원칙* 명시
- `COMPONENT_GUIDE.md §5` 빈 상태·로딩·오류 컴포넌트 변형 5종+

**약점 → 수정됨:**
- ⚠️ **Finding B (수정됨):** "확인 요청" 클릭 직후 *어디로 가는지* 미명시였음. UX_STRATEGY §5.1에 *자동 조리 현황판 진입* 명시 추가. SCREEN_STRUCTURE §4.1과 동기화 필요 (다음 패스에서).

**남은 경미 약점 (점수 9 안 가는 이유):**
- 13개 P0 화면 × 5개 상태 = *65 셀 매트릭스* 부재. 컴포넌트 단위 상태는 있지만 *화면 단위 매트릭스*가 없음. 구현 시 누락 위험. → COPY_DRAFT.md (Finding I)로 부분 흡수 가능.

---

## 4. Pass 3 — User Journey & Emotional Arc (사용자 여정·감정)

### 점수: 7/10 → 8/10 (Finding B + Finding J로 보강)

**강점:**
- `UX_STRATEGY.md §3` 감정 곡선 그래프 (학생 페르소나 기준, 9 시점)
- `§5.1` 학생 사용자 여정 14 시점 (17:25-17:49)
- `§5.2` 외부인 분기 여정
- `§5.3` 본부 담당자 여정
- 시간순·감정 라벨 모두 명시

**약점 → 수정됨:**
- ⚠️ **Finding B (수정됨):** §3 감정 곡선의 -2 구간 ("이체 후~확인 전") UX 처치 명시 추가 — 자동 조리 현황판 진입.
- ⚠️ **Finding J (수정됨):** UX-8 운영진 키보드 매핑 12종 구체화 — 본부 담당자 30건 폭주 흐름이 *키보드만으로* 가능해짐.

**남은 경미 약점:**
- 페르소나 ④ 조리·수령 담당자 ⑤ 정산 담당자의 *시간순 여정*은 없음 (페르소나만 있음). 1차 운영 후 회고로 보강 가능.
- 시간 horizon design (5초·5분·5년) 명시 없음 — 단발성 축제라 5년은 N/A이지만 5초(첫 인상)·5분(주문 완료까지) 명시 가치.

---

## 5. Pass 4 — AI Slop Risk (AI 디자인 슬롭 위험)

### 점수: 9/10 → 9/10 (변경 없음)

**강점:**
- `DESIGN.md §11` AI 슬롭 회피 *20개 패턴* 명시 (각 패턴마다 *이 프로젝트에서* 왜 잘못된지 1줄 근거)
- 자체 검증 질문: "진짜 디자이너가 자기 이름 걸고 보여줄 수 있나?"
- ADR-026 Risk 1 (진짜 도장)·Risk 2 (진짜 도그태그) — *의도된 차별화*

**HARD REJECTION 검증 (7/7 PASS):**
- ✅ 일반 SaaS 카드 그리드 첫인상 X — 배민 톤 메뉴 그리드는 *카테고리 분류* 목적
- ✅ 헤로 안 강력한 헤드라인 + 명확한 액션 → "WINNER WINNER" + 도그태그 + 형광 옐로 CTA
- ✅ 캐러셀 X (명시 금지)
- ✅ 아이콘 in colored circle 3-column 그리드 X (학교 축제 부스 왜?)
- ✅ Beautiful image with weak brand X — 마스코트 + 헤더 + 이름이 강력한 brand
- ✅ 동일 mood 반복 X — 단계마다 마스코트 변형 + 카피 변화
- ✅ App UI made of stacked cards X — 본부 대시보드는 5단계 컬럼 레이아웃

**Litmus 7 (7/7 PASS):**
| # | 체크 | 통과 |
|---|---|:---:|
| 1 | 첫 화면 brand unmistakable | ✅ |
| 2 | 강한 visual anchor 1개 | ✅ (도그태그) |
| 3 | 헤드라인 스캔만으로 이해 | ✅ |
| 4 | 각 섹션 한 가지 일 | ✅ |
| 5 | 카드가 진짜 필요한가 | ✅ (메뉴 카드만, 장식 X) |
| 6 | 모션이 hierarchy 도움 | ✅ (도그태그 떨어짐 = 의식) |
| 7 | 그림자 다 빼도 premium 느낌 | ✅ (타이포·컬러로 hierarchy) |

**판정:** **상위 5% 디자인 시스템.** AI가 만든 "또 그 SaaS"가 아니라 *학교 축제만의 정체성*이 살아있음.

---

## 6. Pass 5 — Design System Alignment (디자인 시스템 정합성)

### 점수: 9/10 → 10/10 (Finding A + Finding H로 완성)

**강점:**
- `DESIGN.md §3.1` CSS 변수 토큰 시스템 — 컬러·타이포·간격·라디우스·그림자·모션 모두
- ADR-026이 토큰 결정을 ADR로 굳혔음
- 4개 디자인 docs가 *서로 참조*하며 모순 없음 (4번 cross-reference 완료)
- COMPONENT_GUIDE.md 23개 컴포넌트 모두 토큰 참조 명시

**약점 → 수정됨:**
- ⚠️ **Finding A (수정됨):** 다크 default가 *부스 어두움 가정* 위에 세워졌으나 가정이 틀림 (사용자 5/10 검증). 라이트 default로 재결정 → DESIGN.md §2.3·§4.1·ADR-026 갱신.
- ⚠️ **Finding H (수정됨):** "학번 없음" 체크박스와 메인 CTA가 같은 형광 옐로 충돌. 외곽선·채움 분리 규칙 §4.2에 추가.

**판정:** 이제 **10/10**. 시스템 토큰만으로 *모든 시각 결정*이 표현 가능하며, 토큰 변경 1줄로 일관 변경 가능.

---

## 7. Pass 6 — Responsive & Accessibility (반응형·접근성)

### 점수: 8/10 → 9/10 (Finding D + Finding E로 보강)

**강점:**
- `DESIGN.md §3.2` 모바일 vs PC 밀도 변형 명시
- `§12` WCAG AA + 터치 타겟 44px (사용자 56px) + ARIA + 한국어 lang + reduced-motion
- `UX_STRATEGY.md §8` 5가지 접근성 시나리오 (스크린리더·키보드·저시력·시끄러움·한 손)
- 다크/라이트 모두 대비 검증

**약점 → 수정됨:**
- ⚠️ **Finding D (수정됨):** 도그태그 단발성 모션 = `sessionStorage` 명시 추가 (DESIGN.md §9.3). 새로고침·재방문 시 멀미 방지.
- ⚠️ **Finding E (수정됨):** "WINNER WINNER" 64px가 360px 폭에서 줄바꿈 방식 명시 추가 — 항상 2줄 강제 (DESIGN.md §5.2).

**남은 경미 약점:**
- 768-1024px 태블릿 viewport는 *"best-effort"*로 처리됨 (SCREEN_STRUCTURE §5.3). 운영 가이드에 "PC 또는 폰만" 권장 명시되어 있어 의도된 결정. 1차 운영 후 디바이스 분포 보고 결정.

---

## 8. Pass 7 — Unresolved Design Decisions (미해결 결정)

### 점수: 6/10 → 9/10 (8건 결정 / 2건 의식적 skip)

이 패스가 *가장 큰 보강*. 10개 발견 사항을 다 처리.

**해결됨 (8건 plan에 적용):**
| ID | 결정 | 적용 위치 |
|---|---|---|
| **A** | 컬러 default = 라이트 (다크는 보조) | DESIGN.md §2.3·§4.1, ADR-026 |
| **B** | "확인 요청" 직후 자동 조리 현황 진입 | UX_STRATEGY §5.1 |
| **D** | 도그태그 모션 sessionStorage 단발성 | DESIGN.md §9.3 |
| **E** | "WINNER WINNER" 항상 2줄 강제 | DESIGN.md §5.2 |
| **F** | 외부인 토큰 URL 공유 = 의도된 동작 명시 | UX_STRATEGY §8.6 신설 |
| **H** | 체크박스=외곽선만 / CTA=채움 분리 | DESIGN.md §4.2 |
| **I** | 카피 작성 일정 (5/10-13) + COPY_DRAFT.md 예약 | UX_STRATEGY §7.5 신설 |
| **J** | 운영진 단축키 12종 매핑 (Enter/Esc/1-9/g d/h/?) | UX_STRATEGY §4 UX-8 |

**의식적 skip (2건):**
| ID | 결정 | 근거 |
|---|---|---|
| **C** | 본부 폴링 → SSE 승격 트리거 명시 X | 사용자 결정: 1차 운영 후 구두 판단 |
| **G** | 마스코트 5종 유지 (4종 압축 X) | 사용자 결정: 변화 표현력 풍부 우선 |

---

## 9. NOT in scope (의식적 deferred)

| 항목 | 근거 |
|---|---|
| 실제 화면 시안 (Figma/HTML wireframe) | 사용자 명시 — "구현 시작" 신호 후 |
| 마스코트 5종 SVG 자산 제작 | 디자이너·외주 작업 (개발 외) |
| 도장 5종 SVG 자산 제작 | 디자이너·외주 작업 |
| 카모 패턴 SVG | 자산 작업 (5% opacity 텍스처용) |
| 알림음 자산 | Phase 2 (모바일 음소거 default 고려) |
| 부스 약도 페이지 (`/map`) 구체 디자인 | 사용자 약도 이미지 수령 후 |
| 본부 SSE 승격 (관리자 5초 폴링 → SSE) | Finding C 의식적 skip — 1차 운영 후 |
| 마스코트 4종 압축 | Finding G 의식적 skip — 표현력 우선 |
| 다국어 (i18n) | ADR-008·기획서 §14.3 명시 X |
| 다크 모드 토글 버튼 (운영 중) | 시스템 prefers-color-scheme 따름 |
| Service Worker / PWA / 푸시 알림 | 1회용 단발 시스템, 가치 없음 |

---

## 10. What already exists (재사용·정합성)

**디자인 자산이 *이미* 정합:**
- `DESIGN.md` 23개 토큰 + 9개 컴포넌트 사용 매트릭스 + 5종 마스코트
- `UX_STRATEGY.md` 5개 페르소나 + 10 UX 원칙 + 3개 여정 + 8 접근성 시나리오 + 톤 매트릭스
- `SCREEN_STRUCTURE.md` 19개 화면 우선순위 + 12개 와이어프레임 + 흐름도
- `COMPONENT_GUIDE.md` 23개 컴포넌트 명세 + 사용 매트릭스 + 빈/로딩/오류 변형

**중복 제거 필요 없음:** 4 docs가 *상호 참조*하며 (예: 컴포넌트 토큰은 DESIGN.md 참조, 화면 위계는 SCREEN_STRUCTURE 참조) 같은 정보가 *두 곳에 적힘 X*. 이미 잘 정리됨.

**ADR-013·ADR-026 정합:** ADR-013 (배민 UX + PUBG 비주얼 + 마스코트) 위에 ADR-026 (구체 토큰)이 붙음. ADR-024 (기술 스택: Tailwind + Alpine + EJS)과도 일치.

---

## 11. TODOS.md 업데이트 제안

이번 리뷰에서 surface된 *deferred 항목*:

| # | What | Why | Pros | Cons | Priority |
|---|---|---|---|---|:---:|
| T1 | 부스 약도 이미지 수령 + `/map` 디자인 | 사용자 페르소나 ②(외부인) 진입 가이드 | 새 사용자 안심 | 학생회 자료 받아야 | P1 |
| T2 | 마스코트 5종 SVG·도장 5종 SVG 자산 제작 | 1차 운영 시각 자산 필수 | 디자인 시스템 작동 | 외주·디자이너 시간 | P0 |
| T3 | 5/19 D-1 통합 리허설 | 운영 안전 (이미 TODOS) | 첫 실전 사고 ↓ | 운영진 90분 | P1 |
| T4 | 라이트 default 부스 환경 검증 | Finding A 사용자 확인됐으나 5/19 한 번 더 폰 들고 검증 권장 | 가정 100% 검증 | 5분 작업 | P2 |
| T5 | docs/COPY_DRAFT.md 작성 (5/10-12) | Finding I 처리 | 13개 화면 카피 일관 | 3일 투자 | P0 |
| T6 | 본부 폴링 vs SSE 1차 운영 후 측정 | Finding C skip 결정 후 측정 기준 | Phase 2 결정 근거 | 운영 데이터 1번 분석 | P2 |

> 이 6개는 *제안* — 사용자가 별도로 TODOS.md 만들지 결정.

---

## 12. Cross-Doc Consistency Check (4 docs 일관성)

리뷰 후 *문서 간 모순 없음* 검증:

| 결정 | DESIGN.md | UX_STRATEGY.md | SCREEN_STRUCTURE.md | COMPONENT_GUIDE.md |
|---|:---:|:---:|:---:|:---:|
| 라이트 default | ✅ §2.3·§4.1 | (영향 X) | (영향 X) | (참조됨) |
| "확인 요청" → 자동 조리 현황 | (영향 X) | ✅ §5.1 | ⚠️ §4.1 갱신 권장 | (영향 X) |
| 도그태그 sessionStorage | ✅ §9.3 | (영향 X) | (영향 X) | (참조됨) |
| WINNER WINNER 2줄 | ✅ §5.2 | (영향 X) | (영향 X) | (참조됨) |
| 외부인 토큰 공유 | (영향 X) | ✅ §8.6 | (영향 X) | (영향 X) |
| 체크박스 vs CTA 분리 | ✅ §4.2 | (영향 X) | (영향 X) | ⚠️ §2.4 보강 권장 |
| 카피 일정 | (영향 X) | ✅ §7.5 | (영향 X) | (영향 X) |
| 단축키 12종 | (영향 X) | ✅ §4 UX-8 | (영향 X) | (영향 X) |

**경미 갱신 권장 (다음 패스):**
1. SCREEN_STRUCTURE.md §4.1에 "이체 확인 요청 → 자동 조리 현황" redirect 명시 (현재 "→ /orders/:id/status (자동 redirect — 또는 사용자 수동)" 부분을 "→ /orders/:id/status (자동 redirect)"로 단순화)
2. COMPONENT_GUIDE.md §2.4 Checkbox에 "학번 없음" 변형 = 외곽선만 명시 (DESIGN.md §4.2 참조)

> 이 두 항목은 작은 경미 갱신 — 사용자 결정에 따라 *지금 적용* or *구현 단계 일치 시점*.

---

## 13. Plan File Review Report

```
## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | /plan-ceo-review | Scope & strategy | 2 | CLEAR | 6 cherry-picks, 4 accepted |
| Eng Review | /plan-eng-review | Architecture & tests | 1 | CLEAR | ADR-024+025 신규 |
| Design Review | /plan-design-review | UI/UX gaps | 1 | CLEAR | score 7.7→9.0, 8 decisions |
```

- **VERDICT:** ENG + DESIGN CLEARED — 구현 시작 준비 완료
- **UNRESOLVED:** 2 (Finding C·G — 의식적 skip, 1차 운영 후 재검토)

---

## 14. Next Steps — Review Chaining

다음 단계 (사용자 결정):

| 옵션 | 비고 |
|---|---|
| **A) 구현 시작** | 사용자 "구현 시작" 신호 → `/superpowers:writing-plans` |
| B) /plan-ceo-review 재실행 | 디자인 변경이 *제품 방향* 영향이면. **권장 안 함** — 변경은 기존 ADR 보강 수준 |
| C) /design-shotgun (시각 변형) | 사용자 명시: "시안·코드 작성 X" — 권장 안 함 |
| D) /design-html (Pretext-native HTML 생성) | 사용자 명시: "구현 안 함" — 권장 안 함 |
| **E) 카피 작성 (T5 — Finding I)** | 구현 시작 직전 우선 작업 |

**최우선 권장:** **E → A** — 5/10-12 카피 작성 → 5/13 검토 → 5/14+ 구현 시작.

---

## 15. 결론

**디자인 종합 점수: 9.0/10 (시작 7.7 → 보강 후 9.0)**

이 디자인 기획안의 *상위 5%* 강점:
1. **명확한 정체성** — "도그태그 받은 느낌" memorable thing이 모든 결정 정렬
2. **AI 슬롭 회피** — 20개 안티패턴 + 자체 검증 질문 + 2개 의식적 risks
3. **시스템 토큰화** — 모든 시각 결정이 CSS 변수로, 일관 변경 가능
4. **사용자 맥락 깊이** — 5종 페르소나 + 8 접근성 시나리오 + 부스 환경 고려
5. **명시적 트레이드오프** — 운영진 vs 사용자, 진지 vs 농담, 모바일 vs PC 모두 의식적

*보강된* 약점:
1. ✅ 다크 default 가정 → 라이트로 정정
2. ✅ "확인 요청" 후 화면 멈춤 → 자동 조리 현황
3. ✅ 도그태그 모션 단발성 명시 (sessionStorage)
4. ✅ "WINNER WINNER" 줄바꿈 명시
5. ✅ 외부인 토큰 공유 의도 명시
6. ✅ 체크박스 vs CTA 컬러 충돌 해결
7. ✅ 카피 작성 일정·위치 명시
8. ✅ 운영진 단축키 12종 매핑

**의식적 deferred (2건):** 본부 폴링 SSE 승격 트리거(C), 마스코트 5→4종 압축(G).

**판정:** 구현 단계 *진입 준비 완료*. 사용자 "구현 시작" 신호를 기다립니다.

---

**STATUS:** DONE
**REASON:** 7개 사용자 검토 기준 모두 8/10 이상 통과. 10건 발견 중 8건 plan 적용, 2건 의식적 skip.
**ATTEMPTED:** 4 docs 리뷰 + 7 차원 점수화 + 10개 발견 → 8개 plan 수정 적용 (DESIGN.md, UX_STRATEGY.md, DECISIONS.md ADR-026).
**RECOMMENDATION:** docs/COPY_DRAFT.md 작성 (5/10-12) 후 사용자 "구현 시작" 신호 → `/superpowers:writing-plans`.
