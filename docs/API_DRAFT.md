# API 초안 — 오늘 저녁은 치킨이닭!

**작성일:** 2026-05-04 (`/plan-eng-review` 1차)
**관련 문서:** `ARCHITECTURE.md`, `DB_DRAFT.md`, `order-system-plan.md` §3-§12, `DECISIONS.md`
**상태:** DRAFT

---

## 0. 규약

### 0.1 URL 컨벤션

| 카테고리 | 베이스 경로 | 응답 타입 |
|---|---|---|
| 사용자 페이지 (서버 렌더) | `/` | text/html (EJS) |
| 사용자 JSON API (Alpine fetch) | `/api/*` | application/json |
| 사용자 SSE | `/api/orders/:id/stream` | text/event-stream |
| 관리자 페이지 (서버 렌더) | `/admin/*` | text/html |
| 관리자 JSON API | `/admin/api/*` | application/json |
| 헬스체크 | `/healthz` | text/plain |

### 0.2 표준 응답 포맷 (JSON API)

**성공:**
```json
{ "ok": true, "data": <payload> }
```

**실패:**
```json
{ "ok": false, "error": { "code": "<CODE>", "message": "<사용자용 메시지>", "field": "<선택, 필드명>" } }
```

**HTTP 상태:**
- 200 정상
- 201 생성됨 (POST 후)
- 400 입력 검증 실패
- 401 인증 실패
- 403 권한 부족
- 404 리소스 없음
- 409 상태 충돌 (e.g., 중복 쿠폰, 잘못된 상태 전이)
- 422 비즈니스 규칙 위반 (e.g., 정산 마감 가드)
- 429 rate limit 초과
- 500 서버 오류

### 0.3 에러 코드 표

| code | 발생 위치 | HTTP | 사용자 메시지 |
|---|---|---|---|
| `INVALID_INPUT` | 모든 입력 검증 | 400 | "입력값을 확인해주세요" |
| `MENU_NOT_FOUND` | POST /api/orders | 404 | "메뉴를 찾을 수 없습니다" |
| `MENU_SOLD_OUT` | POST /api/orders | 409 | "{메뉴명}은(는) 품절입니다" |
| `COUPON_FORMAT` | POST /api/orders | 400 | "학번은 9자리 숫자입니다" |
| `COUPON_PREFIX` | POST /api/orders | 400 | "이번 쿠폰은 컴퓨터모바일융합과 1학년 환영 쿠폰입니다" |
| `COUPON_NAME` | POST /api/orders | 400 | "이름을 입력해 주세요" |
| `COUPON_DUPLICATE` | POST /api/orders | 409 | "이 학번은 이미 쿠폰을 사용했어요" |
| `COUPON_RATE_LIMIT` | POST /api/orders | 429 | "잠시 후 다시 시도해 주세요" |
| `ORDER_NOT_FOUND` | GET /api/orders/* | 404 | "주문을 찾을 수 없습니다" |
| `ORDER_AUTH_FAIL` | GET /api/orders/* | 401 | "주문자 정보가 일치하지 않습니다" |
| `ORDER_STATE_INVALID` | 상태 변경 | 409 | "이미 처리된 주문입니다" |
| `SETTLEMENT_PENDING_ORDERS` | POST /admin/api/settlement/close | 422 | "진행 중 주문 N건이 있어 마감할 수 없습니다" |
| `ADMIN_AUTH_FAIL` | POST /admin/login | 401 | "아이디 또는 PIN이 올바르지 않습니다" |
| `CSRF_FAIL` | 관리자 POST | 403 | "보안 토큰이 만료되었습니다. 새로고침 후 다시 시도하세요." |
| `INTERNAL_ERROR` | 예상치 못한 에러 | 500 | "잠시 후 다시 시도해 주세요" |

### 0.4 입력 검증

모든 JSON API 입력은 `zod` 스키마로 검증. 검증 실패는 `INVALID_INPUT` + `field`에 실패 필드명 포함.

### 0.5 인증

| 라우트 그룹 | 인증 방식 |
|---|---|
| `/`, `/api/menus`, `/api/popular` 등 사용자 GET | 무인증 |
| `POST /api/orders` | 무인증 (input 자체에 student_id+name) |
| `GET /api/orders/:id/*`, SSE | 학번+order_no 또는 토큰+order_no |
| `/admin/login` | 무인증 (PIN 입력 자체) |
| `/admin/*` 그 외 | express-session 쿠키 검증 |
| `/admin/api/*` POST | session + CSRF 토큰 |

---

## 1. 사용자 (Customer) API

### 1.1 GET `/`
랜딩 화면. 상태 OK 시 `/menu`로 리다이렉트.

### 1.2 GET `/menu`
메뉴 목록 페이지 (서버 렌더 EJS). 분류 탭, 인기 랭킹, 추천, 품절 표시. Alpine로 카트 상태 관리.

### 1.3 GET `/api/menus`
메뉴 데이터 JSON.

**응답 200:**
```json
{
  "ok": true,
  "data": {
    "categories": [
      { "id": 1, "name": "치킨" },
      { "id": 2, "name": "사이드" },
      { "id": 3, "name": "음료" }
    ],
    "menus": [
      {
        "id": 1,
        "category_id": 1,
        "name": "후라이드 치킨",
        "price": 18000,
        "image_url": "/images/menus/fried.png",
        "fallback_emoji": "🍗",
        "is_recommended": true,
        "is_sold_out": false
      }
    ]
  }
}
```

### 1.4 GET `/api/popular`
실시간 인기 랭킹 (ADR-017). 5분 캐시.

**응답 200:**
```json
{
  "ok": true,
  "data": {
    "ranking": [
      { "rank": 1, "menu_id": 1, "name": "뿌링클", "sold_count": 37 },
      { "rank": 2, "menu_id": 2, "name": "양념치킨", "sold_count": 29 },
      { "rank": 3, "menu_id": 5, "name": "감자튀김", "sold_count": 21 }
    ],
    "copy": "현재 뿌링클이 압도적 1위!",
    "copy_type": "dominant_first",
    "stale_until": "2026-05-20T16:35:00+09:00"
  }
}
```

`copy_type`: `dominant_first` | `close_race` | `seed` | `rising` (ADR-017 분기 규칙).
운영진 OFF 토글 시: `copy: "🔥 학생회 추천 BEST"`, `copy_type: "seed"`.

### 1.5 POST `/api/orders` ★ ADR-020 (Pattern B)

**요청:**
```json
{
  "items": [
    { "menu_id": 1, "qty": 1 },
    { "menu_id": 5, "qty": 2 }
  ],
  "pickup": "dine_in",
  "table_no": 9,
  "student_id": "202637042",
  "name": "홍길동",
  "is_external": false,
  "use_coupon": true
}
```

> 외부인: `is_external: true`, `student_id` 생략 가능.
> 클라이언트 가격·합계는 받지 않음 (서버 자체 계산).

**zod 스키마:**
```js
const OrderInput = z.object({
  items: z.array(z.object({
    menu_id: z.number().int().positive(),
    qty: z.number().int().min(1).max(20)
  })).min(1).max(20),
  pickup: z.enum(['dine_in', 'takeout']),
  table_no: z.number().int().positive().optional(),
  student_id: z.string().regex(/^\d{9}$/).optional(),
  name: z.string().min(1).max(20),
  is_external: z.boolean().default(false),
  use_coupon: z.boolean().default(false)
}).refine(d => d.is_external || d.student_id, {
  message: "학번 입력이 필요합니다",
  path: ["student_id"]
}).refine(d => d.pickup !== 'dine_in' || d.table_no, {
  message: "테이블 번호를 입력해주세요",
  path: ["table_no"]
});
```

**응답 201:**
```json
{
  "ok": true,
  "data": {
    "order_id": 42,
    "order_no": 17,
    "business_date": "2026-05-20",
    "subtotal": 22000,
    "discount": 1000,
    "total": 21000,
    "external_token": null,
    "stream_url": "/api/orders/42/stream?student_id=202637042&order_no=17"
  }
}
```

> 외부인: `external_token`에 32자 hex. 쿠키 `co_token`에도 저장.

**가능 에러:** `INVALID_INPUT`, `MENU_NOT_FOUND`, `MENU_SOLD_OUT`, `COUPON_*`.

### 1.6 GET `/orders/:id/complete`
주문 완료 페이지 (서버 렌더). 도그태그·계좌·확인 요청 버튼.

쿼리: `?student_id=...&order_no=...` 또는 쿠키 `co_token`로 인증.

### 1.7 POST `/api/orders/:id/transfer-report`

**요청:**
```json
{
  "bank": "카카오뱅크",
  "alt_name": null
}
```

`alt_name`은 가족 대리 이체 등 *주문자 이름과 다른 이름으로 이체*했을 때만 입력.

**응답 200:**
```json
{ "ok": true, "data": { "status": "TRANSFER_REPORTED" } }
```

**가능 에러:** `ORDER_NOT_FOUND`, `ORDER_AUTH_FAIL`, `ORDER_STATE_INVALID` (이미 PAID 등).

### 1.8 GET `/orders/:id/status`
조리 현황판 페이지 (서버 렌더 + Alpine + EventSource).

쿼리: `?student_id=...&order_no=...` 또는 쿠키 토큰.

페이지가 EventSource로 `/api/orders/:id/stream`에 연결.

### 1.9 GET `/api/orders/:id/stream` ★ SSE (ADR-015)

**요청 헤더:**
```
Accept: text/event-stream
```

쿼리: `?student_id=...&order_no=...` 또는 쿠키 토큰.

**응답 200 (스트림):**
```
event: snapshot
data: {"status":"COOKING","stage":"cooking","copy":"🔥 지금 치킨이 기름 속으로 입장했습니다!","ts":"2026-05-20T17:23:00+09:00"}

event: status
data: {"status":"READY","stage":"ready","copy":"✅ #17번, 수령 가능해요!","ts":"2026-05-20T17:35:00+09:00"}

: keepalive

event: status
data: {"status":"DONE","stage":"done","copy":"🎉 WINNER WINNER CHICKEN DINNER! 맛있게 드세요.","ts":"2026-05-20T17:38:00+09:00"}
```

**키-events:** `snapshot` (연결 직후 1회), `status` (상태 변경 시), `keepalive` (15초 주기 빈 코멘트로 연결 유지).

**가능 에러:** 401 (`ORDER_AUTH_FAIL`)은 SSE 시작 전 HTTP 응답으로 반환.

### 1.10 GET `/api/orders/:id/summary`
조리 현황판 폴백용 (SSE 안 되는 환경): 현재 상태 1회 조회.

### 1.11 GET `/locations` (또는 `/map`)
부스 약도 페이지 (정적 이미지 + 안내).

---

## 2. 관리자 (Admin) API

### 2.1 GET `/admin/login`
로그인 폼 (EJS).

### 2.2 POST `/admin/login`

**요청 (form-urlencoded):**
```
username=admin&pin=1234&_csrf=...
```

**응답 302:** 성공 시 `/admin/dashboard`로 리다이렉트, 세션 쿠키 발급.
**가능 에러:** `ADMIN_AUTH_FAIL` (로그인 폼 다시 표시).

### 2.3 POST `/admin/logout`
세션 destroy + 리다이렉트.

### 2.4 GET `/admin/dashboard`
본부 대시보드 (ORDERED / TRANSFER_REPORTED / PAID / COOKING / READY 5단계 카드).

### 2.5 GET `/admin/api/orders`

**쿼리:** `?date=2026-05-20&status=TRANSFER_REPORTED`

**응답 200:**
```json
{
  "ok": true,
  "data": {
    "orders": [
      {
        "id": 42,
        "order_no": 17,
        "status": "TRANSFER_REPORTED",
        "customer_name": "홍길동",
        "student_id": "202637042",
        "total": 21000,
        "transfer_bank": "카카오뱅크",
        "transfer_alt_name": null,
        "transfer_at": "2026-05-20T17:08:00+09:00",
        "elapsed_minutes": 3
      }
    ],
    "counts_by_status": {
      "ORDERED": 2, "TRANSFER_REPORTED": 5, "PAID": 3, "COOKING": 1, "READY": 0, "HOLD": 0
    }
  }
}
```

`elapsed_minutes`는 같은 상태에서 머문 시간 (5분/10분 경고 트리거).

### 2.6 GET `/admin/orders/:id`
주문 상세 페이지 (메뉴·금액·쿠폰·테이블·이체정보·상태·취소 사유).

### 2.7 POST `/admin/api/orders/:id/transition`

**요청:**
```json
{ "to": "PAID", "reason": null }
```

지원 전이:
- `TRANSFER_REPORTED` → `PAID` (이체 확인)
- `TRANSFER_REPORTED` → `HOLD` (`reason` 필수)
- `HOLD` → `TRANSFER_REPORTED` (사용자 재시도가 정상이지만 운영진 강제 복귀도 허용)
- `PAID` → `COOKING`
- `COOKING` → `READY`
- `READY` → `DONE`
- 어느 상태에서든 → `CANCELED` (`reason` 필수)

서버는 `domain/order-state.js`로 검증.

**응답 200:**
```json
{ "ok": true, "data": { "status": "PAID", "transitioned_at": "2026-05-20T17:10:00+09:00" } }
```

**가능 에러:** `ORDER_STATE_INVALID`, `ORDER_NOT_FOUND`.

상태 변경 시 `sse/hub.js`로 해당 주문 SSE 구독자에게 push.

### 2.8 GET `/admin/transfers`
"이체 확인 요청" 카드 전용 화면 (TRANSFER_REPORTED만 필터링, 통장 대조 안내 + 이체정보 표시).

### 2.9 GET `/admin/menus`
메뉴 관리 페이지 (CRUD + 품절 토글 + 추천 토글).

### 2.10 POST `/admin/api/menus`
메뉴 신규.
**요청:** `{ name, price, category_id, image_url?, is_recommended }`

### 2.11 PATCH `/admin/api/menus/:id`
메뉴 수정.
**요청:** 부분 업데이트 (`name?`, `price?`, `image_url?`, `is_recommended?`, `is_sold_out?`).

### 2.12 DELETE `/admin/api/menus/:id`
메뉴 삭제 (soft delete = `deleted_at` 컬럼 set).

> ⚠️ 운영 가이드: **운영 중 가격 변경 금지** (ADR-020 해설 — 변경 직전 주문과 직후 주문이 다른 가격이 될 수 있음). 메뉴 삭제도 운영 중 권장 안 함 (품절 토글 사용).

### 2.13 POST `/admin/api/menus/:id/sold-out`

**요청:** `{ is_sold_out: true }`

빠른 토글용. SSE로 사용자 메뉴 화면에도 push (ADR-017 인기 랭킹 갱신과 동일 채널).

### 2.14 GET `/admin/coupons`
쿠폰 사용 내역 + 거부 시도 로그 (ADR-019).

### 2.15 GET `/admin/api/coupons/usage`

**응답 200:**
```json
{
  "ok": true,
  "data": {
    "used": [
      { "student_id": "202637042", "name": "홍길동", "order_no": 17, "used_at": "...", "discount": 1000 }
    ],
    "rejected": {
      "format": 2,
      "prefix": 8,
      "name": 1,
      "duplicate": 5
    },
    "total_used": 23,
    "total_discount": 23000
  }
}
```

### 2.16 GET `/admin/settlement`
정산 화면 (일자 선택, 요약, 메뉴별, 시간대별).

### 2.17 GET `/admin/api/settlement/:date`

**응답 200:**
```json
{
  "ok": true,
  "data": {
    "date": "2026-05-20",
    "closed_at": null,
    "summary": {
      "total_orders": 234,
      "total_canceled": 12,
      "subtotal_revenue": 1295000,
      "coupon_discount": 45000,
      "net_revenue": 1250000,
      "deposit_total_input": null,
      "diff": null
    },
    "by_menu": [
      { "menu_id": 1, "name": "후라이드", "qty": 87, "revenue": 783000 }
    ],
    "by_hour": [
      { "hour": "16", "count": 8 }, { "hour": "17", "count": 14 }
    ],
    "coupons": { "used": 23, "rejected_breakdown": { "format": 2, "prefix": 8, ... } },
    "pending_orders": 0,
    "backups": [
      { "type": "manual", "filename": "manual-20260520-2142.zip", "size_bytes": 524288, "created_at": "..." },
      { "type": "auto", "filename": "auto-20260520-2130.zip", "size_bytes": 510000, "created_at": "..." }
    ]
  }
}
```

### 2.18 POST `/admin/api/settlement/close` ★ ADR-012

**요청:** `{ "date": "2026-05-20" }`

**응답 200:**
```json
{ "ok": true, "data": { "snapshot_id": 1, "closed_at": "2026-05-20T21:42:00+09:00" } }
```

**가능 에러 422 `SETTLEMENT_PENDING_ORDERS`:**
```json
{
  "ok": false,
  "error": {
    "code": "SETTLEMENT_PENDING_ORDERS",
    "message": "진행 중 주문 5건이 있어 마감할 수 없습니다",
    "field": null
  },
  "data": {
    "pending_breakdown": { "ORDERED": 1, "TRANSFER_REPORTED": 2, "PAID": 1, "COOKING": 1, "READY": 0, "HOLD": 0 }
  }
}
```

(에러여도 `data` 필드에 분해 정보 포함 — 사용자에게 무엇이 남았는지 알리기 위함.)

### 2.19 POST `/admin/api/settlement/:date/deposit-total`

**요청:** `{ "deposit_total": 1205000 }`

통장 합계 수동 입력. `diff = net_revenue - deposit_total` 자동 계산.

### 2.20 GET `/admin/api/settlement/:date/zip` ★ §12.5

**응답 200:**
- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename="chickenedak-backup-2026-05-20-2142.zip"`
- 본문: 스트리밍 ZIP (archiver 출력)

서버는 다운로드 이력을 `backup_downloads` 테이블에 기록 (누가/언제).

### 2.21 GET `/admin/api/settlement/:date/csv`
정산 요약 CSV 다운로드 (ZIP 안에도 동일 포함).

### 2.22 GET `/admin/api/popularity`
관리자 인기 랭킹 + 동적 카피 ON/OFF 상태.

### 2.23 POST `/admin/api/popularity/copy-toggle`

**요청:** `{ "copy_enabled": false }`

ADR-017 카피 룰 ON/OFF.

### 2.24 GET `/admin/api/orders/:id/timeline`
주문 단일 변경 이력 (created → states → done/canceled). 디버깅·인계용.

---

## 3. 헬스체크

### 3.1 GET `/healthz`

**응답 200:**
```
ok
```

Docker `healthcheck`가 호출. DB 연결 + WAL 상태 + 디스크 free space 체크.

### 3.2 GET `/admin/api/system-status` (관리자 전용)

**응답 200:**
```json
{
  "ok": true,
  "data": {
    "uptime_seconds": 12345,
    "active_sse_connections": 14,
    "last_auto_snapshot_at": "2026-05-20T17:30:00+09:00",
    "next_auto_snapshot_at": "2026-05-20T18:00:00+09:00",
    "disk_free_mb": 4500,
    "process_memory_mb": 89
  }
}
```

운영 중 본부가 시스템 건강 상태 확인용 (Phase 2 모니터링 대시보드 후보).

---

## 4. SSE 채널 명세 (요약)

| URL | 이벤트 | 트리거 | 수신자 |
|---|---|---|---|
| `/api/orders/:id/stream` | `snapshot` | 연결 직후 1회 | 사용자 (해당 주문) |
| `/api/orders/:id/stream` | `status` | 주문 상태 변경 | 사용자 (해당 주문) |
| `/api/orders/:id/stream` | `keepalive` | 15초 주기 | 사용자 |
| `/admin/api/dashboard/stream` | `order_new` | 신규 주문 INSERT | 관리자 (Phase 2 후보) |
| `/admin/api/dashboard/stream` | `order_transition` | 상태 변경 | 관리자 (Phase 2 후보) |

> **MVP는 사용자 전용 SSE만 구현.** 관리자 대시보드는 Alpine `setInterval`로 5초 폴링 (단순 구현 우선). 부담 시 Phase 2에서 SSE로 승격.

---

## 5. Rate limit / 보안

| 엔드포인트 | 정책 |
|---|---|
| `POST /api/orders` (쿠폰 거부) | IP당 5회/분 거부 시 1분 잠금 (§13.5) |
| `POST /admin/login` | IP당 10회/분 + username당 5회 실패 시 30초 잠금 |
| `GET /api/orders/:id/stream` | 주문 ID 1개당 최대 3 동시 연결 |
| 그 외 | 무제한 (학교 와이파이 환경 특성상) |

---

## 6. 변경 영향 추적

| 결정 (ADR) | 영향받은 엔드포인트 |
|---|---|
| ADR-015 (조리 현황판 SSE) | 1.8, 1.9, 1.10 |
| ADR-019 (학번 prefix 검증) | 1.5 (validate at insert) |
| ADR-020 (Pattern B 가격) | 1.5 (zod 스키마에 가격 필드 없음) |
| ADR-021 (학번+이름 필수) | 1.5, 1.7, 1.8, 1.9 |
| ADR-022 (자동 ZIP) | 2.17 backups 배열 |
| ADR-023 (Docker) | 3.1 healthz, 3.2 system-status |
| ADR-018 (다일 운영) | 1.5 business_date 자동 산출 |

---

## 7. 미정·후속 검토

- **CSRF 토큰 발급 방식**: cookie + form hidden vs header. 구현 시 결정.
- **메뉴 이미지 업로드**: `/admin/api/menus/:id/image` POST multipart — MVP 포함 여부 결정 필요. 포함이면 multer + 서버 측 리사이즈.
- **관리자 PIN 변경**: `/admin/api/admins/:id/pin` PATCH — Phase 2 권장.
- **외부인 토큰 갱신**: 토큰 만료 24h 후 사용자가 다시 조회 가능하게 할지 — ADR-021 세부 결정 필요.
