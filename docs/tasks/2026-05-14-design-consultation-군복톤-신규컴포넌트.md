# 2026-05-14 — /design-consultation 결과 반영 + 군복 톤 컬러 베이스 + 신규 컴포넌트 4종

## 목표

사용자 `/design-consultation` 요청으로 4개 디자인 문서를 *최신 결정사항*으로 갱신:
- 군복 톤 하이브리드 컬러 베이스 (라이트 default → 군복 + 카드 흙색)
- 도장 5종 SVG → CSS stamp (C 수용)
- 카모 패턴 SVG → CSS gradient (F 수용)
- 마스코트 5종 유지 (B 거부)
- 키보드 단축키 12 → 4 (D 수용)
- 인기 랭킹 정적 BEST (E 수용)
- 부스 미니맵 모달 신규 (G12)
- 영업 외 안내 화면 신규 (G13 C-9)
- 영업 상태 배지 + 장사 시작 CTA 신규 (G13)

## 만든 것 / 수정한 것

| 파일 | Edit 수 | 핵심 변경 |
|---|---:|---|
| `docs/DESIGN.md` | 8 | §3.3 군복 톤 하이브리드·§4.1 팔레트 재정의·§8.1 CSS stamp·§8.2 CSS gradient·§10.1 마스코트 유지·§11 AI 슬롭 +5개·§13 결정 로그·§14 후속 갱신 |
| `docs/UX_STRATEGY.md` | 5 | §UX-8 단축키 4종·§6.1 빈 상태 영업 외·§6.3 오류 BUSINESS_CLOSED·§7.4 마스코트 카피·§10 Phase 2 후보 + §11 변경 이력 |
| `docs/COMPONENT_GUIDE.md` | 5 | §3.1 CSS stamp 구현·§4.1 "줍기" CTA + 흙색·§4.4 마스코트 fallback·§4.9-4.12 신규 4 컴포넌트·§9 미정 + §10 변경 이력 |
| `docs/SCREEN_STRUCTURE.md` | 2 | §9 ON/OFF 토글 삭제 표시 + §10 변경 이력 + §11 변경 영향 추적 신규 |
| `docs/tasks/2026-05-14-design-consultation-군복톤-신규컴포넌트.md` | (이 파일) | 작업 로그 |

총 20 Edit + 1 신규 파일.

## 핵심 결정 — 군복 톤 하이브리드 컬러 베이스

**3차 변경 (2026-05-07 다크 → 2026-05-10 라이트 → 2026-05-13 군복 하이브리드):**

```
[페이지 베이스 = 군복 톤]              [메뉴 카드 영역 = 흙색]
배경: 짙은 카키그린 #2E3A26            카드 배경: 따뜻한 흙색 #C8B894
표면: 어두운 올리브 #3A4A2E            카드 호버: #B8A684
잉크 (밝은 텍스트): #E8E0C8            카드 잉크 (어두운): #2A2820
경계: #4F5A3B                         카드 보조 텍스트: #5C5040
```

**이유 (사용자 결정):**
- "배틀그라운드의 컨셉에 맞게 군복 느낌, 짙은 초록색과 국방색"
- *베이스는 군복 톤* + *메뉴 카드 영역만 밝은 흙색*으로 처리하면:
  1. PUBG 인벤토리 UI (어두운 사이드바 + 밝은 아이템 카드) 패러다임 정합
  2. 부스 조명 환경의 *카드 영역 가독성* 보존 (본문 대비 4.5:1 이상)
  3. 사용자 제공 배틀그라운드 인게임 이미지 톤 일치

**향후 결정 가중치:**
- 운영진 사이드 (`/admin/*`) 라이트 모드 검토는 1차 운영 후 (현재 단일 군복 톤)
- G14 일회성 서비스: 향후 *내년 학생회 인수인계* 가중치 X

## 신규 컴포넌트 4종 (G13/G12)

### §4.9 BusinessStateBadge (G13)
- 본부 대시보드 헤더 영업 상태 배지
- 변형: 🟢 OPEN / 🔴 CLOSED / 🔴 CLOSED + ⚠️ (장사 시작 누락)
- `aria-live="polite"` 스크린리더 안내

### §4.10 StartBusinessCTA (G13)
- CLOSED 상태 시 본부 대시보드 상단 큰 형광 옐로 CTA
- 클릭 → `POST /admin/api/business/open` (API_DRAFT §2.25)
- `shouldBeOpen=true + status=CLOSED` 시 1초 주기 빨간 깜박

### §4.11 ClosedScreen (G13, C-9 화면)
- CLOSED 상태 사용자 진입 시 풀스크린 안내
- 마스코트 (기본 변형) + "🔒 영업 시간이 아니에요" + 운영 일정
- 상태별 변형 (16:30 이전·이후·정산 후·양일 종료)

### §4.12 BoothMinimapModal (G12, C-7 화면)
- PUBG 미니맵 톤 풀스크린 모달
- 메뉴(C-1)·주문 완료(C-4) 화면 우상단 🗺️ 진입
- 본인 테이블 형광 옐로 펄스 (1초 주기 idle)
- 약도 이미지 미수령 시 CSS 그리드 4×3 fallback (D-1 수령 후 런타임 교체)
- 닫기: X 버튼 / 외부 클릭 / Esc 3가지

## 한 일 (4개 SoT 문서)

### DESIGN.md (8 Edit)

- **§3.3 컬러 베이스 갱신** — 라이트 default → 군복 톤 하이브리드 (변경 이력 3차)
- **§4.1 코어 팔레트 재정의** — 베이스 군복 + 카드 흙색 + 보조 라이트 (운영진 PC 검토)
- **§8.1 그림자 토큰** — `--shadow-stamp`에 CSS stamp 결정 명시
- **§8.2 텍스처** — 카모 SVG → CSS gradient 결정 명시
- **§10.1 마스코트 5종 유지** — B 거부 결정 + fallback 정책
- **§11 AI 슬롭 패턴 +5개** — PUBG 직접 복제·메뉴 리스킨 과잉·자동 모달 등 (총 25개)
- **§13 결정 로그 +9 라인** — 2026-05-13 누적 변경 명시
- **§14 후속 갱신** — 도장·카모 자산 작업 제거 (CSS 결정으로)

### UX_STRATEGY.md (5 Edit)

- **§UX-8 단축키 표 4종으로** — chord/숫자/HOLD는 Phase 2 후보 (D 결정)
- **§6.1 빈 상태에 영업 외 + 본부 CLOSED 행 추가** — G13 신규
- **§6.3 오류 상태에 BUSINESS_CLOSED 423 + 쿠폰 학과 코드 행 추가** — G13 + ADR-019
- **§7.4 마스코트 카피에 영업 외·본부 CLOSED 카피 추가** — G13
- **§10 Phase 2 후보 + §11 변경 이력 신규** — 단축키 chord·미니맵 줌·점유 상태 등

### COMPONENT_GUIDE.md (5 Edit)

- **§3.1 StampBadge — CSS stamp 구현 본문** — SVG `feTurbulence` 제거, `box-shadow` + `border` + `rotate` 기본
- **§4.1 MenuCard — "줍기" CTA + 흙색 카드** — G11 PUBG 인벤토리 라벨 + 본명 메뉴 명시
- **§4.4 MascotState — 5종 유지 + fallback 정책** — B 거부 명시, 🪖 이모지 fallback
- **§4.9~§4.12 신규 4 컴포넌트** — BusinessStateBadge·StartBusinessCTA·ClosedScreen·BoothMinimapModal
- **§9 미정 갱신 + §10 변경 이력 신규** — 도장/카모 CSS 결정 / 신규 컴포넌트 명시 / G14 인수인계 가치 X

### SCREEN_STRUCTURE.md (2 Edit)

- **§9 인기 랭킹 ON/OFF 토글 항목 삭제 표시** — E 결정으로 의미 없음
- **§10 변경 이력 + §11 변경 영향 추적 신규** — G9-G14 + ADR 변경 5건의 화면 영향 매트릭스

## 사용자 메모리 정합성

- 메모리 `feedback_no_scope_pressure.md`: 범위 축소 압박 자제 ✅
- 메모리 `project_one_time_service.md`: 일회성 서비스, 인수인계 가중치 X ✅
- COMPONENT_GUIDE §9 "컴포넌트 카탈로그 페이지" *후속 가치 X* 명시 (G14 반영)
- DESIGN §14 "운영진 사이드 라이트 모드 검토" *1차 운영 후* 명시 (Phase 2 가치)

## 테스트 결과

문서 편집 20 Edit + 신규 1. 수동 검증:

| 검증 항목 | 결과 |
|---|---|
| DESIGN.md 8 Edit | ✅ |
| UX_STRATEGY.md 5 Edit | ✅ |
| COMPONENT_GUIDE.md 5 Edit | ✅ |
| SCREEN_STRUCTURE.md 2 Edit | ✅ |
| 군복 톤 컬러 4개 문서 일관성 | ✅ DESIGN §3.3/§4.1 ↔ COMPONENT_GUIDE §4.1 |
| 도장 CSS stamp 일관성 | ✅ DESIGN §8.1 ↔ COMPONENT_GUIDE §3.1 |
| 카모 CSS gradient 일관성 | ✅ DESIGN §8.2 ↔ DESIGN §4.1 카모 액센트 |
| 영업 토글 (G13) 컴포넌트 ↔ 화면 ↔ UX 일관성 | ✅ COMPONENT §4.9-4.11 ↔ SCREEN §3.7/§3.14 ↔ UX §6.1/§6.3/§7.4 |
| 미니맵 모달 (G12) 일관성 | ✅ COMPONENT §4.12 ↔ SCREEN §3.13 |
| 단축키 4종 일관성 | ✅ UX-8 ↔ SCREEN §5.2 |
| 정적 BEST 일관성 | ✅ DESIGN §11 #24 ↔ UX §6.1·§7.4 ↔ SCREEN §3.1·§9 |
| 마스코트 5종 유지 일관성 | ✅ DESIGN §10.1 ↔ COMPONENT §4.4 |
| 구현 코드 변경 0 | ✅ |

## 사용자 요청 11가지 매핑

| # | 요청 | 위치 |
|---|---|---|
| 1 | 제품의 디자인 방향성 | DESIGN §1-2 (Memorable thing + Battle Royale Cafeteria 컨셉) |
| 2 | 타겟 사용자의 감정과 사용 상황 | UX_STRATEGY §1-2 (페르소나 5종 + 맥락) |
| 3 | 핵심 UX 원칙 | UX_STRATEGY §4 (UX-1 ~ UX-10) |
| 4 | 정보 구조 | SCREEN_STRUCTURE §1.1 사이트맵 + §3 정보 위계 |
| 5 | 화면 우선순위 | SCREEN_STRUCTURE §2 P0/P1/P2 + §8 일정 |
| 6 | 디자인 시스템 방향 | DESIGN §2-3 (정체성 + 시스템 방향) |
| 7 | 컬러·타이포·간격·모션 | DESIGN §4-9 |
| 8 | 주요 컴포넌트 목록 | COMPONENT_GUIDE §2-§4 (Atoms·Molecules·Organisms, 신규 4종 포함) |
| 9 | 빈/로딩/오류 상태 | UX_STRATEGY §6 + COMPONENT_GUIDE §5 |
| 10 | 접근성 기준 | DESIGN §12 + UX_STRATEGY §8 |
| 11 | 피해야 할 AI 디자인 패턴 | DESIGN §11 (25개, PUBG 톤 특화 5개 추가) |

## 다음에 할 것

### 자료 수집 (D-3 ~ D-1)

1. **메뉴 8개 가격** — D-3 (5/17)
2. **메뉴 일러스트 8종 (PUBG 톤)** — D-3 / 미수령 시 분류 이모지 fallback
3. **마스코트 SVG 5종** — D-3 (B 거부로 유지) / 미수령 시 🪖 헬멧 이모지
4. **부스 약도 1장 (G12 미니맵용)** — D-1 (5/19) / 미수령 시 CSS 그리드 fallback

### 검토 단계

5. **`/plan-design-review`** — 본 디자인 시스템 시각 검토 (강한 추천)
   - 군복 톤 하이브리드 정합성
   - 신규 컴포넌트 4종 (G13/G12) 시각 명세
   - AI 슬롭 25개 회피 검증

### ADR 정식 개정

6. ADR 정식 개정 (누적 10건) — 별도 작업

### 구현 단계

7. 사용자 "구현 시작" 신호 → `docs/IMPLEMENTATION_PLAN.md` Task 0.1
   - 영업 토글 (G13) 관련 +3-5 Task
   - 미니맵 모달 (G12) 관련 +2-3 Task
   - init.sql + bootstrap.js +1-2 Task
   - 컴포넌트 4종 신규 구현
