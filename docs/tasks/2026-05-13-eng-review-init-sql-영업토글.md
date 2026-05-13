# 2026-05-13 — /plan-eng-review 결과 반영 + init.sql·어드민 자동 생성·영업 토글 명세

## 목표

사용자 `/plan-eng-review` 요청을 받아 4개 엔지니어링 문서를 *최신 결정사항*으로 갱신:
- 영업 토글 (G13) 시스템 명세
- init.sql + 어드민 자동 생성 (사용자 신규 요구)
- 쿠폰 학과 코드 37 (ADR-019 변경) 반영
- 자동 ZIP 30분 → 2시간 (ADR-022 변경) 반영
- 인기 랭킹 정적 BEST (ADR-017 변경) 반영
- 부스 미니맵 모달 (G12) 화면 반영
- 일회성 서비스 (G14) 가중치 반영

## 사용자 신규 요구 (2026-05-13)

> "db는 docker volume으로 저장해서 할거야"
> "서버 시작을 하게 되면 init.sql이 작동을 해서 db 구성이 되면 돼"
> "db 구성이 될때 어드민 계정이 자동 생성되야돼"

이 3가지를 *기존 결정과 정합되게* 명세하여 4개 문서에 반영.

## 만든 것 / 수정한 것

| 파일 | Edit 수 | 핵심 변경 |
|---|---:|---|
| `docs/ARCHITECTURE.md` | 7 | §5.4 영업 상태·§6.5 어드민 자동·§7 실패 #14-#16·§8.2/§8.4 환경변수·§8.5 init.sql·§12 변경 |
| `docs/DB_DRAFT.md` | 7 | §2.5 쿠폰·§2.8 어드민·§2.13 business_state·§2.14 system_settings·§5.1-§5.2 부팅·§5.5 init.sql 본문·§9 변경 |
| `docs/API_DRAFT.md` | 7 | §0.3 BUSINESS_CLOSED·§1.4 정적 BEST·§1.11 미니맵·§1.12 /closed·§2.18 자동 CLOSED·§2.23 삭제·§2.25/§2.26 business/open·state·§6 변경 |
| `docs/TEST_PLAN.md` | 6 | §5.2 학과 코드·§5.5 정적 BEST·§5.7 business-state 신규·§5.8 bootstrap 신규·E2E-11~14·§12 실패 #14-#16·§15 변경 |
| `docs/tasks/2026-05-13-eng-review-init-sql-영업토글.md` | (이 파일) | 작업 로그 |

총 27 Edit + 1 신규 파일.

## 사용자 요구 명세 (4개 문서에 일관)

### init.sql 흐름 (ARCHITECTURE §8.5 + DB_DRAFT §5.5)

```
서버 부팅 (server.js)
   │
   ▼
db/bootstrap.js
   │
   │ ① _migrations 테이블 존재 확인
   │
   ├─[없음 = 신규 DB]──▶ init.sql 일괄 실행
   │                       (CREATE TABLE + 인덱스 + 시드)
   │                       business_state INSERT (status='CLOSED')
   │                       system_settings 시드
   │                       _migrations INSERT '001-init.sql'
   │                          │
   │                          ▼
   │                       seedAdmin() — scrypt 해시 후 admins INSERT
   │                       (DEFAULT_ADMIN_PIN env 또는 6자리 랜덤 + stdout)
   │
   └─[있음 = 기존 DB]──▶ migrations/ 미적용분만 실행
```

**Docker volume 보존:**
- `chickenedak-data` named volume에 `db.sqlite` 저장
- 첫 부팅: volume 비어있음 → init.sql 실행
- 재부팅: volume에 db.sqlite 존재 → init.sql skip
- `docker compose down -v` 또는 volume 삭제 시 init.sql 재실행

### 어드민 자동 생성 (ARCHITECTURE §6.5 + DB_DRAFT §2.8)

| `.env` 설정 | 동작 |
|---|---|
| `DEFAULT_ADMIN_PIN=482917` | 명시 PIN을 scrypt 해시로 admins INSERT (username='admin', role='super_admin') |
| 미설정 | 6자리 랜덤 PIN 생성 + scrypt + admins INSERT + **stdout 1회 출력** (`[INIT] Generated admin PIN: ...`) |

**보안 고려:**
- 평문 PIN은 scrypt 해시 후 즉시 GC
- 랜덤 PIN stdout 출력은 첫 부팅 1회만 (admins 1행 시 skip)
- 운영진은 D-1 리허설 시 PIN 변경 권장 (Phase 2 UI 또는 SQL UPDATE)

### 영업 상태 토글 (G13) 명세

**테이블 (DB_DRAFT §2.13):**
```sql
CREATE TABLE business_state (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  status          TEXT NOT NULL CHECK (status IN ('CLOSED', 'OPEN')),
  operating_date  TEXT,
  opened_at       TEXT,
  closed_at       TEXT,
  opened_by       INTEGER REFERENCES admins(id),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO business_state (id, status) VALUES (1, 'CLOSED');
```

**API (API_DRAFT §2.25/§2.26):**
- `POST /admin/api/business/open` — CLOSED → OPEN (관리자 클릭)
- `GET /admin/api/business/state` — 현재 상태 + should_be_open 계산

**Middleware (API_DRAFT §1.12):**
```javascript
// 사용자 경로 (/menu, /cart, /checkout, /orders/:id/*)
if (state.status === 'CLOSED') {
  if (GET) redirect(/closed);
  else POST → HTTP 423 { error: 'BUSINESS_CLOSED' };
}
// /admin/* 경로는 영향 X
```

**자동 CLOSED (API_DRAFT §2.18):**
정산 마감 트랜잭션 내에서 `business_state.status='CLOSED'` UPDATE. 같은 트랜잭션 보장.

**테스트 (TEST_PLAN §5.7 + E2E-11/E2E-12):**
- 11 단위 케이스 (상태 전이·shouldBeOpen·CHECK 위반)
- E2E-11: 장사 시작 흐름
- E2E-12: 정산 마감 자동 CLOSED
- E2E-14: init.sql 첫 부팅

## 한 일 (4개 문서)

### ARCHITECTURE.md (7 Edit)

- **§5.3 쿠폰 검증 함수** 정규식 갱신 — `prefix '202637'` → `\d{2}\d{2}37\d{3}` (학과 코드 37)
- **§5.4 영업 상태 (BusinessState) 신규** — G13 도메인 모델 + 상태 머신 + 불변식
- **§6.5 어드민 자동 생성 신규** — DEFAULT_ADMIN_PIN env + 랜덤 6자리 + scrypt 해시
- **§7 실패 시나리오** — #14 장사 시작 누락 / #15 init.sql 실패 / #16 트랜잭션 부분 실패 추가
- **§8.2 docker-compose.yml** — AUTO_SNAPSHOT 30 → 120, DEFAULT_ADMIN_PIN, OPERATING_DATES, BUSINESS_OPEN_TIME
- **§8.4 .env** — 동일 갱신
- **§8.5 init.sql 부팅 흐름 신규** — bootstrap.js의 신규/기존 DB 분기, seedAdmin() 의사 코드
- **§12 후속 작업·변경 영향 추적** — 변경 사항 명시

### DB_DRAFT.md (7 Edit)

- **§2.5 used_coupons** — 학과 코드 37 검증 정규식 코멘트 (CHECK 제약 X, 애플리케이션 검증)
- **§2.8 admins** — 어드민 자동 시드 정책 (DEFAULT_ADMIN_PIN env or 랜덤 6자리)
- **§2.13 business_state 신규** — 단일 행 강제 (CHECK id=1), CLOSED/OPEN, opened_by FK
- **§2.14 system_settings 신규** — key-value 런타임 설정 (operating_dates·business_open_time·auto_snapshot)
- **§5.1 파일 구조** — `src/db/init.sql` + `src/db/bootstrap.js` 분리, init.sql vs migrations 정책
- **§5.2 부팅 흐름** — bootstrap.js 의사 코드 (신규 DB 분기 + seedAdmin)
- **§5.5 init.sql 본문 신규** — 전체 스키마 + 메뉴 8개 + business_state·system_settings 시드 SQL

### API_DRAFT.md (7 Edit)

- **§0.3 에러 코드** — COUPON_PREFIX → COUPON_DEPARTMENT 갱신, BUSINESS_CLOSED 423 신규
- **§1.4 GET /api/popular** — 정적 BEST 응답 (copy_type 필드 제거, 동적 규칙 제거)
- **§1.11 GET /map** — 부스 미니맵 모달로 갱신 (G12)
- **§1.12 GET /closed 신규** — 영업 외 안내 화면 + middleware 의사 코드
- **§2.18 정산 마감** — 응답에 `business_state: 'CLOSED'` 추가, 트랜잭션 명시
- **§2.23 POPULARITY 토글** — 삭제 표시 (E 결정)
- **§2.25/§2.26 신규** — POST /admin/api/business/open + GET /admin/api/business/state
- **§6 변경 영향 추적** — 8개 변경 라인 추가

### TEST_PLAN.md (6 Edit)

- **§5.2 coupon-validation** — 학과 코드 37 12 케이스로 갱신 (학년 무관 컴모융 매칭)
- **§5.5 popularity** — 정적 BEST 5 케이스 (동적 카피 케이스 삭제)
- **§5.7 business-state 신규** — 11 단위 테스트 케이스 (CHECK 위반·shouldBeOpen·ROLLBACK)
- **§5.8 bootstrap 신규** — 7 단위 테스트 케이스 (init.sql·어드민 시드·트랜잭션)
- **§8.2 E2E 시나리오** — E2E-10 시간 갱신·E2E-11 장사 시작·E2E-12 자동 CLOSED·E2E-13 미니맵 모달·E2E-14 init.sql 부팅
- **§12 실패 모드** — #14 장사 시작 누락 / #15 init.sql 실패 / #16 트랜잭션 부분 실패
- **§15 변경 영향 추적** — 갱신

## 테스트 결과

문서 편집 27 Edit + 신규 1. 수동 검증:

| 검증 항목 | 결과 |
|---|---|
| ARCHITECTURE.md 7 Edit | ✅ |
| DB_DRAFT.md 7 Edit | ✅ |
| API_DRAFT.md 7 Edit | ✅ |
| TEST_PLAN.md 6 Edit | ✅ |
| init.sql 흐름 4개 문서 cross-reference 일관성 | ✅ ARCHITECTURE §8.5 ↔ DB_DRAFT §5.5 ↔ TEST_PLAN §5.8 |
| 어드민 자동 생성 명세 일관성 | ✅ ARCHITECTURE §6.5 ↔ DB_DRAFT §2.8 ↔ TEST_PLAN §5.8 |
| business_state 테이블 + API + 테스트 일관성 | ✅ DB_DRAFT §2.13 ↔ API_DRAFT §2.25/§2.26 ↔ TEST_PLAN §5.7 |
| 쿠폰 학과 코드 37 일관성 | ✅ ARCHITECTURE §5.3 ↔ DB_DRAFT §2.5 ↔ API_DRAFT §0.3 ↔ TEST_PLAN §5.2 |
| 자동 ZIP 30분 → 2시간 일관성 | ✅ ARCHITECTURE §8.2/§8.4 ↔ DB_DRAFT §2.14 ↔ TEST_PLAN E2E-10 |
| 정적 BEST 일관성 | ✅ API_DRAFT §1.4/§2.23 ↔ TEST_PLAN §5.5 |
| G13 영업 토글 일관성 | ✅ 4개 문서 모두 |
| 구현 코드 변경 0 | ✅ |

## 사용자 요청 10가지 매핑

| # | 요청 | 위치 |
|---|---|---|
| 1 | 추천 기술 스택 | ARCHITECTURE §2 (ADR-024 기반 보존) |
| 2 | 전체 아키텍처 | ARCHITECTURE §1·§3·§4 (영업 상태 + 미니맵 통합) |
| 3 | 핵심 도메인 모델 | ARCHITECTURE §5 (Order·Menu·Coupon·BusinessState 신규) |
| 4 | DB 테이블 후보 | DB_DRAFT §2 (14개 — business_state·system_settings 신규) |
| 5 | API 목록 | API_DRAFT (사용자 12개 + 관리자 26개 + 헬스 2개) |
| 6 | 인증/권한 흐름 | ARCHITECTURE §6 (어드민 자동 생성 §6.5 추가) |
| 7 | 실패 시나리오 | ARCHITECTURE §7 (16개 — #14-#16 신규) |
| 8 | 테스트 전략 | TEST_PLAN (모든 영역 + 영업 토글 회귀) |
| 9 | 배포 구조 | ARCHITECTURE §8 (Docker compose + init.sql §8.5) |
| 10 | MVP에서 제외할 과한 기술 | ARCHITECTURE §9 (ADR-024 명시) |

## 다음에 할 것

### 즉시 (자료 수집 + ADR 정식 개정)

1. **메뉴 8개 가격** — D-3 (2026-05-17). init.sql 시드값 갱신 필요
2. **메뉴 이미지·마스코트 5종·부스 약도** — D-3·D-1
3. **`.env` 작성** — SESSION_SECRET·DEFAULT_ADMIN_PIN (사용자 호스트에서)

### ADR 정식 개정 (누적 10건)

| ADR | 상태 | 내용 |
|---|---|---|
| ADR-012 | 보강 | 정산 마감 → 영업 자동 종료 트랜잭션 |
| ADR-017 | 변경 | 인기 랭킹 정적 BEST |
| ADR-019 | 변경 | 학번 prefix → 학과 코드 37 |
| ADR-022 | 변경 | 자동 ZIP 30분 → 2시간 |
| ADR-026 | 보강 | 군복 톤·도장 CSS·카모 CSS·키보드 4종 |
| ADR-027 | 신규 | 메뉴 8개 고정 (G10) |
| ADR-028 | 신규 | 계좌 정보 박동빈 (G9) |
| ADR-029 | 신규 | 부스 미니맵 모달 (G12) |
| ADR-030 | 신규 | 영업 상태 토글 머신 (G13) |
| ADR-031 | 신규 | 일회성 서비스 명시 (G14) |

### 다음 검토 단계

- **`/plan-design-review`** — 군복 톤 + PUBG 인벤토리 UI + 미니맵 모달 시각 검토 (강한 추천)

### 구현 단계

- 사용자 "구현 시작" 신호 → `docs/IMPLEMENTATION_PLAN.md` Task 0.1
  - 영업 토글 관련 Task +3-5 추가 예상 (DB 테이블·middleware·관리자 UI·사용자 안내 화면 + 회귀 테스트)
  - init.sql + bootstrap.js Task +1-2
