# 프로젝트 작업 규칙

학교 축제 부스용 모바일 웹 주문 시스템 ("오늘 저녁은 치킨이닭!"). D-day 2026-05-20.

**현재 단계:** 구현 진입 직전. 사용자 "구현 시작" 신호 시 `docs/IMPLEMENTATION_PLAN.md` Task 0.1부터.

## 명령

- `npm run dev` 로컬 개발 / `npm test` 단위·통합 / `npm run test:e2e` Playwright
- `docker compose up -d` 운영 / `docker compose logs -f` / `docker compose restart`

## 규칙

- 자연어·주석·커밋 메시지·UI 카피는 **한국어**. 코드·명령어·고유명사는 원문.
- 모든 기획 문서는 `docs/`. 중요 결정은 `docs/DECISIONS.md`에 ADR로.
- 사용자 **"구현 시작"** 명시 전까지 코드 X — 기획·설계·검토만.
- `src/domain/*`는 **TDD strict + 100% 커버리지**. 다른 영역은 권장.

## 절대 깨지면 안 되는 것

- **ADR-020 Pattern B**: 서버가 menu_id·qty·coupon만 받아 가격 자체 계산. `tests/unit/pricing-adr020.test.js` 4 케이스 회귀 X.
- **ADR-019/021**: 학번 prefix `202637` + 이름 + used_coupons UNIQUE. 외부인은 "학번 없음" 체크박스 + 이름만 + token.
- **ADR-012**: 정산 마감은 진행 주문 0건일 때만 (강제 마감 X).
- **ADR-023**: 운영은 Docker compose + named volume.

## 도구

| 단계              | skill                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| 기획 검토         | gstack `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`   |
| 구현 계획         | `superpowers:writing-plans`                                                                   |
| 구현 실행         | `superpowers:subagent-driven-development` (권장) 또는 `:executing-plans`                    |
| TDD·디버깅·리뷰 | `superpowers:test-driven-development`, `:systematic-debugging`, `:requesting-code-review` |

## 상세는 docs/

- `IMPLEMENTATION_PLAN.md` — TDD task 39개 (구현 진입점)
- `DECISIONS.md` — ADR 1~26 (전체 결정 이력)
- `ARCHITECTURE.md` / `API_DRAFT.md` / `DB_DRAFT.md` / `TEST_PLAN.md`
- `DESIGN.md` / `UX_STRATEGY.md` / `SCREEN_STRUCTURE.md` / `COMPONENT_GUIDE.md`
- `order-system-plan.md` — 7차 기획서 (전체 SoT)

**우선순위:** 사용자 지시 > 이 CLAUDE.md > skill > 기본 시스템 동작.

# 개발 필수 지침

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

[](https://github.com/forrestchang/andrej-karpathy-skills/blob/main/CLAUDE.md#1-think-before-coding)

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

* State your assumptions explicitly. If uncertain, ask.
* If multiple interpretations exist, present them - don't pick silently.
* If a simpler approach exists, say so. Push back when warranted.
* If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

[](https://github.com/forrestchang/andrej-karpathy-skills/blob/main/CLAUDE.md#2-simplicity-first)

**Minimum code that solves the problem. Nothing speculative.**

* No features beyond what was asked.
* No abstractions for single-use code.
* No "flexibility" or "configurability" that wasn't requested.
* No error handling for impossible scenarios.
* If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

[](https://github.com/forrestchang/andrej-karpathy-skills/blob/main/CLAUDE.md#3-surgical-changes)

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

* Don't "improve" adjacent code, comments, or formatting.
* Don't refactor things that aren't broken.
* Match existing style, even if you'd do it differently.
* If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

* Remove imports/variables/functions that YOUR changes made unused.
* Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

[](https://github.com/forrestchang/andrej-karpathy-skills/blob/main/CLAUDE.md#4-goal-driven-execution)

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

* "Add validation" → "Write tests for invalid inputs, then make them pass"
* "Fix the bug" → "Write a test that reproduces it, then make it pass"
* "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
