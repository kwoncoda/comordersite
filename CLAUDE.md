# 프로젝트 작업 규칙

학교 축제 부스용 모바일 웹 주문 시스템 ("오늘 저녁은 치킨이닭!"). D-day 2026-05-20.

**현재 단계:** 구현 진입 직전. 사용자 "구현 시작" 신호 시 `docs/IMPLEMENTATION_PLAN.md` Task 0.1부터.

## 명령

- `npm run dev` 로컬 개발 / `npm test` 단위·통합 / `npm run test:e2e` Playwright
- `docker compose up -d` 운영 / `docker compose logs -f` / `docker compose restart`

## 규칙

- **모든 응답·md 파일·커밋 메시지·UI 카피·주석 = 한국어.** 코드·명령어·고유명사는 원문.
- 모든 기획 문서는 `docs/`. 중요 결정은 `docs/DECISIONS.md`에 ADR로.
- 사용자 **"구현 시작"** 명시 전까지 코드 X — 기획·설계·검토만.
- `src/domain/*`는 **TDD strict + 100% 커버리지**. 다른 영역은 권장.

## 작업 절차 (필수)

작업(task) 단위마다 *반드시* 다음 4단계 흐름을 지킨다:

1. **작업 실행** — 사용자가 지정한 기능·수정 작업을 수행
2. **테스트 검증** — 해당 작업이 의도대로 동작하는지 확인 (단위·통합·E2E·수동 — 작업 성격에 맞게)
3. **커밋** — 작업 내용을 *한국어 메시지*로 `git commit` (1 작업 = 1 커밋)
4. **작업 로그 기록** — `docs/tasks/YYYY-MM-DD-<작업명>.md`에 다음 항목 작성:
   - **목표** — 이 작업으로 달성하려 한 것
   - **만든 것** — 추가한 기능·파일 목록
   - **한 일** — 구체 변경 사항 (파일·라인·결정 근거)
   - **테스트 결과** — 통과·실패·수동 검증 내용
   - **다음에 할 것** (선택) — 후속 작업 메모

## 절대 깨지면 안 되는 것

- **ADR-020 Pattern B**: 서버가 menu_id·qty·coupon만 받아 가격 자체 계산. `tests/unit/pricing-adr020.test.js` 4 케이스 회귀 X.
- **ADR-019/021**: 학번 prefix `202637` + 이름 + used_coupons UNIQUE. 외부인은 "학번 없음" 체크박스 + 이름만 + token.
- **ADR-012**: 정산 마감은 진행 주문 0건일 때만 (강제 마감 X).
- **ADR-023**: 운영은 Docker compose + named volume.

## 도구

| 단계 | skill |
|---|---|
| 기획 검토 | gstack `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review` |
| 구현 계획 | `superpowers:writing-plans` |
| 구현 실행 | `superpowers:subagent-driven-development` (권장) 또는 `:executing-plans` |
| TDD·디버깅·리뷰 | `superpowers:test-driven-development`, `:systematic-debugging`, `:requesting-code-review` |

## 상세는 docs/

- `IMPLEMENTATION_PLAN.md` — TDD task 39개 (구현 진입점)
- `DECISIONS.md` — ADR 1~26 (전체 결정 이력)
- `ARCHITECTURE.md` / `API_DRAFT.md` / `DB_DRAFT.md` / `TEST_PLAN.md`
- `DESIGN.md` / `UX_STRATEGY.md` / `SCREEN_STRUCTURE.md` / `COMPONENT_GUIDE.md`
- `order-system-plan.md` — 7차 기획서 (전체 SoT)

**우선순위:** 사용자 지시 > 이 CLAUDE.md > skill > 기본 시스템 동작.
