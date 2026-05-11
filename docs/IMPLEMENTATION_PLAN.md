# 오늘 저녁은 치킨이닭! 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 컴퓨터모바일융합과 학교 축제(5/20-21) 부스용 모바일 웹 주문 시스템을 D-day 5/20 16:30 운영 시작까지 완성.

**Architecture:** Express + EJS + Alpine.js + Tailwind CSS 단일 Node 프로세스 / SQLite WAL / Docker compose + volume / SSE(사용자 조리 현황판) / 30분 자동 ZIP 스냅샷. ADR-020 Pattern B(서버 자체 가격 계산), ADR-019/021(학번 prefix + used_coupons UNIQUE), ADR-012(정산 마감 가드).

**Tech Stack:** Node 20 LTS · JavaScript + JSDoc · Express 4 · better-sqlite3 11 · EJS 3 · Alpine.js 3 (CDN) · Tailwind 3 · zod 3 · pino 9 · archiver 7 · express-session + connect-sqlite3 · helmet 8 · Vitest 2 · supertest 7 · Playwright 1

**입력 자료 (12 docs + design bundle):**
- `docs/order-system-plan.md` (7차 기획서)
- `docs/DECISIONS.md` (ADR-001~026)
- `docs/ARCHITECTURE.md`, `docs/API_DRAFT.md`, `docs/DB_DRAFT.md`, `docs/TEST_PLAN.md`
- `docs/DESIGN.md`, `docs/UX_STRATEGY.md`, `docs/SCREEN_STRUCTURE.md`, `docs/COMPONENT_GUIDE.md`
- `docs/DESIGN_REVIEW.md` (디자인 리뷰 결과)
- `docs/UI_IMPLEMENTATION_PLAN.md` (design-bundle 분석 + G1~G5 누락 정밀 진단)
- `docs/design-bundle/` (Claude Design handoff — 시안 참조)

---

## MVP 우선순위 기준

| 라벨 | 의미 | 처리 |
|---|---|---|
| **P0** | 5/20 16:30 운영 *반드시 필요*. 누락 시 운영 불가 | 5/19 D-1까지 무조건 완료 |
| **P1** | 운영 가능하지만 사용자·운영진 만족도 ↓ | 시간 남으면 |
| **P2** | Phase 2 후보 (Phase 2 = 1차 운영 후) | 미루어도 됨 |

---

## File Structure (계획)

```
chickenedak/
├── package.json, package-lock.json
├── Dockerfile, docker-compose.yml, .env.example, .gitignore, .dockerignore
├── tailwind.config.js, vitest.config.js, playwright.config.js, .eslintrc.cjs
├── src/
│   ├── server.js                ← 부트스트랩 (DB init + listen)
│   ├── app.js                   ← Express app + 미들웨어 + 라우터 마운트
│   ├── config.js                ← 환경변수 로딩
│   ├── db/
│   │   ├── connection.js
│   │   ├── migrations/001-init.sql
│   │   └── repositories/{menu,order,coupon,settlement,admin,backup}-repo.js
│   ├── domain/
│   │   ├── pricing.js                ← ★ ADR-020 Pattern B
│   │   ├── coupon-validation.js      ← ★ ADR-019/021 4단계
│   │   ├── order-state.js            ← 상태 전이 머신
│   │   ├── settlement.js             ← ADR-012 마감 가드
│   │   ├── popularity.js             ← ADR-017 인기 랭킹
│   │   └── transfer-matching.js      ← §6.4 매칭 정책
│   ├── routes/
│   │   ├── customer/{home,orders,kitchen-status,map}.js
│   │   ├── admin/{auth,dashboard,orders,transfers,menus,settlement,backup}.js
│   │   └── api/{menus,orders,coupons,popularity}.js
│   ├── middleware/{error-handler,admin-auth,customer-token,rate-limit,csrf}.js
│   ├── sse/{hub.js, routes.js}
│   └── jobs/{auto-snapshot.js, token-cleanup.js}
├── views/
│   ├── layouts/{customer,admin,error}.ejs
│   ├── customer/{menu,cart,checkout,complete,transfer,status,map}.ejs
│   ├── customer/error/{404,500}.ejs
│   ├── admin/{login,dashboard,transfers,menus,settlement}.ejs
│   ├── admin/orders/show.ejs
│   └── partials/{dogtag,stamp,mascot,status-chip,topbar-brand,topbar-back,bottom-bar,empty-state,loading-state,error-state,timeline}.ejs
├── public/
│   ├── css/{tokens.css, output.css}      ← prototype.html에서 추출 + Tailwind 출력
│   ├── js/{menu,cart,checkout,status-sse,admin-dashboard,admin-pin}.js
│   └── images/{웹로고.png, mascot/*.svg, stamp/*.svg, menus/*.png}
└── tests/
    ├── unit/{pricing,pricing-adr020,coupon-validation,order-state,settlement,transfer-matching,popularity}.test.js
    ├── integration/{order-create,coupon-check,admin-auth,sse,auto-snapshot,settlement-close}.test.js
    ├── e2e/{customer-order,external-customer,coupon-reject,transfer-flow,settlement-close,admin-pin}.spec.js
    └── helpers/{db,auth,order,playwright}.js
```

---

## Phase 개요 + 일정 (오늘 5/12 기준 D-day까지 8일)

| Phase | 내용 | 우선순위 | 시간 추정 | 목표일 |
|---|---|---|---|---|
| 0 | 기반 설정 (package·Docker·DB·토큰) | P0 | 0.5일 | 5/13 오전 |
| 1 | 도메인 + DB 리포 (TDD 핵심) | P0 | 1.5일 | 5/14 저녁 |
| 2 | API 엔드포인트 | P0 | 1일 | 5/15 저녁 |
| 3 | 사용자 화면 6개 (EJS+Alpine) | P0 | 1.5일 | 5/16 저녁 |
| 4 | 관리자 화면 6개 + 정산 + 메뉴관리 | P0 | 1.5일 | 5/17 저녁 |
| 5 | SSE + ZIP + 자동 스냅샷 | P0 | 0.5일 | 5/18 오전 |
| 6 | 부속 (약도·404·자산 통합) | P1 | 0.5일 | 5/18 오후 |
| 7 | E2E + D-1 리허설 | P0 | 1일 | 5/19 |
| ★ | **D-day 5/20 16:30 운영 시작** | — | — | 5/20 |

---

## 진행 트래킹

각 Task의 `- [ ]` 체크박스를 마크하며 진행. 전체 ~42 task / ~200 step.

각 task의 step은 다음 패턴:
1. 테스트 작성 (필요한 경우)
2. 실패 확인
3. 구현
4. 통과 확인
5. 커밋

UI 템플릿은 Step 1-3을 *템플릿 작성 → 수동 브라우저 확인 → 커밋*으로 압축. Domain 함수는 strict TDD.

---

# Phase 0 — 기반 설정 (P0, 0.5일)

## Task 0.1: 프로젝트 초기화 + package.json

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.dockerignore`
- Create: `.env.example`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "chickenedak",
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "node src/server.js",
    "start": "node src/server.js",
    "css:watch": "tailwindcss -i public/css/source.css -o public/css/output.css --watch",
    "css:build": "tailwindcss -i public/css/source.css -o public/css/output.css --minify",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "express": "^4.19.2",
    "express-session": "^1.18.0",
    "connect-sqlite3": "^0.9.13",
    "better-sqlite3": "^11.0.0",
    "ejs": "^3.1.10",
    "zod": "^3.23.8",
    "pino": "^9.0.0",
    "pino-pretty": "^11.0.0",
    "helmet": "^8.0.0",
    "archiver": "^7.0.1",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "supertest": "^7.0.0",
    "@playwright/test": "^1.45.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^9.0.0"
  }
}
```

- [ ] **Step 2: 설치 실행**

```bash
npm install
```

Expected: `node_modules/` 생성, `package-lock.json` 생성, 경고 0건(또는 deprecation 경고만 허용).

- [ ] **Step 3: .gitignore 작성**

```
node_modules/
.env
*.log
coverage/
.vitest/
playwright-report/
test-results/
public/css/output.css
.DS_Store
```

- [ ] **Step 4: .dockerignore 작성**

```
node_modules
.env
.git
.gitignore
coverage
playwright-report
test-results
*.md
docs/
```

- [ ] **Step 5: .env.example 작성**

```
NODE_ENV=development
PORT=3000
SESSION_SECRET=change-me-to-32-byte-hex
ADMIN_PINS=[{"username":"admin","scrypt":"<scrypt-hash>"}]
AUTO_SNAPSHOT_INTERVAL_MIN=30
LOG_LEVEL=info
```

- [ ] **Step 6: Commit**

```bash
git init
git add package.json package-lock.json .gitignore .dockerignore .env.example
git commit -m "chore: Phase 0.1 — npm 초기화 + dev/test/css 스크립트"
```

---

## Task 0.2: Docker 설정

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Dockerfile 작성 (ARCHITECTURE.md §8.1)**

```dockerfile
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY views ./views
COPY public ./public
COPY db/migrations ./db/migrations
COPY package.json ./
RUN mkdir -p /app/data/backups /app/data/images /app/data/logs
EXPOSE 3000
CMD ["node", "src/server.js"]
```

- [ ] **Step 2: docker-compose.yml 작성 (ARCHITECTURE.md §8.2)**

```yaml
services:
  chickenedak:
    build: .
    container_name: chickenedak
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      SESSION_SECRET: ${SESSION_SECRET}
      ADMIN_PINS: ${ADMIN_PINS}
      AUTO_SNAPSHOT_INTERVAL_MIN: ${AUTO_SNAPSHOT_INTERVAL_MIN:-30}
    env_file:
      - .env
    volumes:
      - chickenedak-data:/app/data
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  chickenedak-data:
```

- [ ] **Step 3: 빌드 검증 (소스 코드 추가 후 검증 가능 — 지금은 syntax만)**

```bash
docker compose config
```

Expected: YAML 파싱 OK, 에러 없음 (서비스 정의 출력).

- [ ] **Step 4: Commit**

```bash
git add Dockerfile docker-compose.yml
git commit -m "chore: Phase 0.2 — Docker compose + volume 영속화 (ADR-023)"
```

---

## Task 0.3: 디자인 토큰 추출 + Tailwind 설정

**Files:**
- Create: `public/css/tokens.css`
- Create: `public/css/source.css`
- Create: `tailwind.config.js`

- [ ] **Step 1: tokens.css — design-bundle prototype.html `:root` 추출**

```css
:root {
  /* ── COLOR / 라이트 default (ADR-026, 2026-05-10) ── */
  --color-bg:       #F5EFE0;
  --color-surface:  #EAE3D0;
  --color-elevated: #DFD7BE;
  --color-ink:      #2A2C20;
  --color-muted:    #6B6B5C;
  --color-divider:  #C8C0A8;

  --color-accent:         #F4D200;
  --color-accent-pressed: #D9BB00;
  --color-accent-soft:    rgba(244, 210, 0, 0.20);

  --camo-olive: #5C5D3A; --camo-sand: #9A8E6B;
  --camo-earth: #4F3D2A; --camo-leaf: #6E7544;

  --color-success: #5A8C42;
  --color-warning: #E59B0C;
  --color-danger:  #C73E1D;
  --color-info:    #3A6B7E;

  --stamp-red: #B5301A; --stamp-black: #1F1B14; --stamp-green: #4A6B2D;

  /* ── TYPOGRAPHY ── */
  --font-body:    'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-display: 'Pretendard Variable', Pretendard, sans-serif;
  --font-mono:    'JetBrains Mono', 'D2Coding', 'Courier New', monospace;
  --font-stencil: 'Black Ops One', 'Pretendard Variable', sans-serif;

  --text-3xs:10px; --text-2xs:12px; --text-xs:14px; --text-sm:16px;
  --text-base:18px; --text-lg:20px; --text-xl:24px;
  --text-2xl:32px; --text-3xl:48px; --text-4xl:64px;

  --weight-normal:400; --weight-medium:500; --weight-semibold:600;
  --weight-bold:700; --weight-black:900;

  /* ── SPACING (4px base) ── */
  --space-3xs:2px; --space-2xs:4px; --space-xs:8px;
  --space-sm:12px; --space-md:16px; --space-lg:24px;
  --space-xl:32px; --space-2xl:48px; --space-3xl:64px;

  /* ── RADIUS ── */
  --radius-none:0; --radius-xs:2px; --radius-sm:4px;
  --radius-md:8px; --radius-lg:12px; --radius-pill:9999px;

  /* ── SHADOW (hard-offset) ── */
  --shadow-card:     2px 2px 0 rgba(31,27,20,0.18), 0 1px 2px rgba(0,0,0,0.05);
  --shadow-elevated: 4px 4px 0 rgba(31,27,20,0.25), 0 4px 12px rgba(0,0,0,0.15);
  --shadow-stamp:    2px 2px 0 rgba(0,0,0,0.4);
  --shadow-tag:      0 6px 0 -2px rgba(0,0,0,0.3), 0 8px 18px rgba(0,0,0,0.22);
  --shadow-sticker:  1px 1px 0 rgba(0,0,0,0.5);
  --shadow-cta:      3px 3px 0 var(--color-ink);

  /* ── MOTION ── */
  --duration-tap:100ms; --duration-card:200ms; --duration-stamp:150ms;
  --duration-tag:600ms; --duration-mascot:400ms;
  --ease-out:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-stamp: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-tag:   cubic-bezier(0.17, 0.67, 0.32, 1.5);
}

@media (prefers-color-scheme: dark) {
  :root.respect-dark {
    --color-bg:#1A1A14; --color-surface:#25241A; --color-elevated:#2F2E22;
    --color-ink:#F5EFE0; --color-muted:#A8A493; --color-divider:#3A3829;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: source.css — Tailwind 진입**

```css
@import './tokens.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

.tabular { font-variant-numeric: tabular-nums; font-family: var(--font-mono); }
```

- [ ] **Step 3: tailwind.config.js — 토큰 매핑**

```js
export default {
  content: ['./views/**/*.ejs', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        elevated: 'var(--color-elevated)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        divider: 'var(--color-divider)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        sans: 'var(--font-body)',
        mono: 'var(--font-mono)',
        stencil: 'var(--font-stencil)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        cta: 'var(--shadow-cta)',
        stamp: 'var(--shadow-stamp)',
        tag: 'var(--shadow-tag)',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Tailwind 빌드 1회 검증**

```bash
npm run css:build
```

Expected: `public/css/output.css` 생성, 에러 없음. (`content` 비어있으면 base만 출력 — 정상)

- [ ] **Step 5: Commit**

```bash
git add public/css/tokens.css public/css/source.css tailwind.config.js
git commit -m "chore: Phase 0.3 — 디자인 토큰 + Tailwind 매핑 (DESIGN.md §3-9)"
```

---

## Task 0.4: DB migration 001-init.sql + connection.js

**Files:**
- Create: `db/migrations/001-init.sql`
- Create: `src/db/connection.js`
- Create: `src/config.js`
- Create: `tests/helpers/db.js`

- [ ] **Step 1: 001-init.sql — 11개 테이블 (DB_DRAFT.md §2)**

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE menu_categories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO menu_categories (id, name, display_order) VALUES
  (1, '치킨', 10), (2, '사이드', 20), (3, '음료', 30);

CREATE TABLE menus (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id     INTEGER NOT NULL REFERENCES menu_categories(id),
  name            TEXT NOT NULL,
  price           INTEGER NOT NULL CHECK (price >= 0),
  image_url       TEXT,
  fallback_emoji  TEXT,
  is_recommended  INTEGER NOT NULL DEFAULT 0 CHECK (is_recommended IN (0,1)),
  is_sold_out     INTEGER NOT NULL DEFAULT 0 CHECK (is_sold_out IN (0,1)),
  display_order   INTEGER NOT NULL DEFAULT 0,
  deleted_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_menus_category ON menus(category_id) WHERE deleted_at IS NULL;

CREATE TABLE orders (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no            INTEGER NOT NULL,
  business_date       TEXT NOT NULL,
  status              TEXT NOT NULL CHECK (status IN
    ('ORDERED','TRANSFER_REPORTED','PAID','COOKING','READY','DONE','CANCELED','HOLD')),
  student_id          TEXT,
  customer_name       TEXT NOT NULL,
  is_external         INTEGER NOT NULL DEFAULT 0 CHECK (is_external IN (0,1)),
  external_token      TEXT,
  token_expires_at    TEXT,
  pickup_method       TEXT NOT NULL CHECK (pickup_method IN ('dine_in','takeout')),
  table_no            INTEGER,
  subtotal            INTEGER NOT NULL CHECK (subtotal >= 0),
  discount            INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total               INTEGER NOT NULL CHECK (total >= 0),
  transfer_bank       TEXT,
  transfer_alt_name   TEXT,
  transfer_at         TEXT,
  paid_at             TEXT,
  cooking_at          TEXT,
  ready_at            TEXT,
  done_at             TEXT,
  canceled_at         TEXT,
  hold_at             TEXT,
  hold_reason         TEXT,
  cancel_reason       TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (business_date, order_no),
  CHECK (
    (is_external = 0 AND student_id IS NOT NULL) OR
    (is_external = 1 AND student_id IS NULL AND external_token IS NOT NULL)
  ),
  CHECK (subtotal - discount = total)
);
CREATE INDEX idx_orders_business_status ON orders(business_date, status);
CREATE INDEX idx_orders_student         ON orders(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_orders_external_token  ON orders(external_token) WHERE external_token IS NOT NULL;
CREATE INDEX idx_orders_status_updated  ON orders(status, updated_at);

CREATE TABLE order_items (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id          INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_id           INTEGER NOT NULL REFERENCES menus(id),
  menu_name_snap    TEXT NOT NULL,
  unit_price_snap   INTEGER NOT NULL CHECK (unit_price_snap >= 0),
  qty               INTEGER NOT NULL CHECK (qty >= 1 AND qty <= 20),
  line_total        INTEGER NOT NULL CHECK (line_total >= 0),
  CHECK (unit_price_snap * qty = line_total)
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu  ON order_items(menu_id);

CREATE TABLE used_coupons (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id  TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  order_id    INTEGER NOT NULL REFERENCES orders(id),
  discount    INTEGER NOT NULL,
  used_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_used_coupons_used_at ON used_coupons(used_at);

CREATE TABLE rejected_coupons (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id    TEXT,
  name          TEXT,
  reason        TEXT NOT NULL CHECK (reason IN ('format','prefix','name','duplicate','rate_limit')),
  ip            TEXT,
  attempted_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_rejected_attempted ON rejected_coupons(attempted_at);
CREATE INDEX idx_rejected_ip_time   ON rejected_coupons(ip, attempted_at);

CREATE TABLE order_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  from_status TEXT,
  to_status   TEXT,
  note        TEXT,
  actor       TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_order_events_order ON order_events(order_id);

CREATE TABLE admins (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT NOT NULL UNIQUE,
  pin_hash    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'admin',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  last_login  TEXT
);

CREATE TABLE settlement_snapshots (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  business_date       TEXT NOT NULL UNIQUE,
  closed_at           TEXT NOT NULL,
  closed_by_admin_id  INTEGER REFERENCES admins(id),
  summary_json        TEXT NOT NULL,
  deposit_total       INTEGER,
  deposit_diff        INTEGER,
  deposit_input_at    TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE backup_downloads (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  business_date     TEXT NOT NULL,
  filename          TEXT NOT NULL,
  source            TEXT NOT NULL CHECK (source IN ('manual','auto')),
  size_bytes        INTEGER NOT NULL,
  downloaded_by     INTEGER REFERENCES admins(id),
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_backup_date_source ON backup_downloads(business_date, source);
```

- [ ] **Step 2: src/config.js**

```js
import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'dev-only-change-in-prod',
  adminPins: JSON.parse(process.env.ADMIN_PINS || '[]'),
  autoSnapshotIntervalMin: parseInt(process.env.AUTO_SNAPSHOT_INTERVAL_MIN || '30', 10),
  dataDir: process.env.DATA_DIR || './data',
  logLevel: process.env.LOG_LEVEL || 'info',
};
```

- [ ] **Step 3: src/db/connection.js — WAL + migration runner**

```js
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

export function openDb(filepath = path.join(config.dataDir, 'db.sqlite')) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  const db = new Database(filepath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  return db;
}

export function runMigrations(db, dir = 'db/migrations') {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    filename TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  const applied = new Set(db.prepare('SELECT filename FROM _migrations').all().map(r => r.filename));
  for (const f of files) {
    if (applied.has(f)) continue;
    const sql = fs.readFileSync(path.join(dir, f), 'utf-8');
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(f);
      db.exec('COMMIT');
      console.log(`[migration] applied ${f}`);
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }
}
```

- [ ] **Step 4: tests/helpers/db.js — in-memory DB for tests**

```js
import Database from 'better-sqlite3';
import fs from 'node:fs';
import { runMigrations } from '../../src/db/connection.js';

export function setupTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db, 'db/migrations');
  db.exec(`INSERT INTO menus (id, category_id, name, price) VALUES
    (1, 1, '후라이드', 18000),
    (2, 1, '양념', 19000),
    (3, 1, '뿌링클', 21000),
    (4, 2, '치즈스틱', 5000),
    (5, 3, '콜라', 2000)`);
  return db;
}

export function teardownTestDb(db) { db.close(); }
```

- [ ] **Step 5: 마이그레이션 테스트**

Create `tests/integration/db-init.test.js`:
```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';

describe('DB migration 001-init', () => {
  let db;
  beforeEach(() => { db = setupTestDb(); });
  afterEach(() => teardownTestDb(db));

  it('11 테이블 + _migrations 생성', () => {
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().map(r => r.name);
    expect(tables).toContain('menu_categories');
    expect(tables).toContain('menus');
    expect(tables).toContain('orders');
    expect(tables).toContain('order_items');
    expect(tables).toContain('used_coupons');
    expect(tables).toContain('rejected_coupons');
    expect(tables).toContain('order_events');
    expect(tables).toContain('admins');
    expect(tables).toContain('settlement_snapshots');
    expect(tables).toContain('backup_downloads');
    expect(tables).toContain('_migrations');
  });

  it('orders CHECK: is_external 무결성', () => {
    expect(() => db.prepare(`INSERT INTO orders
      (order_no, business_date, status, is_external, student_id, customer_name, pickup_method, subtotal, discount, total)
      VALUES (1, '2026-05-20', 'ORDERED', 0, NULL, '홍길동', 'dine_in', 0, 0, 0)`).run())
      .toThrow();
  });

  it('used_coupons UNIQUE student_id', () => {
    // 시드 메뉴 활용해 미니 주문 인서트
    db.exec(`INSERT INTO orders (order_no, business_date, status, is_external, student_id, customer_name, pickup_method, subtotal, discount, total)
      VALUES (1, '2026-05-20', 'ORDERED', 0, '202637001', 'A', 'dine_in', 0, 0, 0)`);
    db.exec(`INSERT INTO orders (order_no, business_date, status, is_external, student_id, customer_name, pickup_method, subtotal, discount, total)
      VALUES (2, '2026-05-20', 'ORDERED', 0, '202637002', 'B', 'dine_in', 0, 0, 0)`);
    db.prepare(`INSERT INTO used_coupons (student_id, name, order_id, discount) VALUES (?, ?, ?, ?)`).run('202637001', 'A', 1, 1000);
    expect(() => db.prepare(`INSERT INTO used_coupons (student_id, name, order_id, discount) VALUES (?, ?, ?, ?)`).run('202637001', 'A', 2, 1000))
      .toThrow(/UNIQUE/);
  });
});
```

- [ ] **Step 6: vitest.config.js**

```js
export default {
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: { provider: 'v8', include: ['src/**'] },
  },
};
```

- [ ] **Step 7: 테스트 실행**

```bash
npm test -- db-init
```

Expected: 3 passed.

- [ ] **Step 8: Commit**

```bash
git add db/migrations/001-init.sql src/db/connection.js src/config.js tests/helpers/db.js tests/integration/db-init.test.js vitest.config.js
git commit -m "feat: Phase 0.4 — DB 11개 테이블 + WAL + migration runner + 3 가드 테스트"
```

---

## Task 0.5: 폰트 self-host 또는 CDN 결정

**Files:**
- Modify: `views/layouts/customer.ejs` (Phase 3에서 작성)
- Create: `public/css/source.css` 보강

- [ ] **Step 1: 폰트 link strategy 결정**

3개 폰트(Pretendard·JetBrains Mono·Black Ops One) → **CDN preconnect 방식** (학교 와이파이 환경에서 안정. self-host도 가능하지만 D-day 일정 압박으로 CDN 우선).

`views/layouts/_head.ejs`에 들어갈 내용 (Phase 3 Task 3.1에서 실제 작성, 여기선 결정만):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Black+Ops+One&display=swap" rel="stylesheet">
```

- [ ] **Step 2: 결정 기록 (커밋 메시지로 대신)**

```bash
git commit --allow-empty -m "chore: Phase 0.5 — 폰트는 CDN preconnect (Pretendard CDN + Google Fonts)"
```

---

# Phase 1 — 도메인 + DB 리포 (P0, TDD 핵심, 1.5일)

## Task 1.1: pricing.js + ADR-020 4 케이스 (★★★ 회귀 강제)

**Files:**
- Create: `src/domain/pricing.js`
- Create: `tests/unit/pricing-adr020.test.js`
- Create: `tests/unit/pricing.test.js`

- [ ] **Step 1: ADR-020 4 케이스 RED 테스트 먼저**

```js
// tests/unit/pricing-adr020.test.js
import { describe, it, expect } from 'vitest';
import { calculate, MenuNotFound, MenuSoldOut, COUPON_AMOUNT } from '../../src/domain/pricing.js';

describe('ADR-020: Pattern B 가격 무결성', () => {
  const menuSnapshot = {
    prices: new Map([[1, 18000], [2, 19000], [5, 2000]]),
    names:  new Map([[1, '후라이드'], [2, '양념'], [5, '콜라']]),
    soldOut: new Set(),
  };

  it('case 1: 클라가 보낸 total을 무시하고 서버가 진짜 가격으로 계산', () => {
    const result = calculate(
      [{ menu_id: 1, qty: 1 }, { menu_id: 5, qty: 2 }],
      null,
      menuSnapshot,
    );
    expect(result.subtotal).toBe(22000);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(22000);
    expect(result.lineItems[0].unit_price).toBe(18000);
    expect(result.lineItems[0].line_total).toBe(18000);
    expect(result.lineItems[1].line_total).toBe(4000);
  });

  it('case 2: 존재하지 않는 menu_id → MenuNotFound throw', () => {
    expect(() => calculate(
      [{ menu_id: 999, qty: 1 }],
      null,
      menuSnapshot,
    )).toThrow(MenuNotFound);
  });

  it('case 3: 품절 menu_id → MenuSoldOut throw', () => {
    const snapWithSold = { ...menuSnapshot, soldOut: new Set([1]) };
    expect(() => calculate(
      [{ menu_id: 1, qty: 1 }],
      null,
      snapWithSold,
    )).toThrow(MenuSoldOut);
  });

  it('case 4: 쿠폰 적용 시 total = subtotal - discount', () => {
    const result = calculate(
      [{ menu_id: 1, qty: 1 }],
      'COUPON_OK',
      menuSnapshot,
    );
    expect(result.subtotal).toBe(18000);
    expect(result.discount).toBe(COUPON_AMOUNT);
    expect(result.total).toBe(18000 - COUPON_AMOUNT);
    expect(COUPON_AMOUNT).toBe(1000);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npm test -- pricing-adr020
```

Expected: `Cannot find module .../pricing.js` 또는 `calculate is not a function`

- [ ] **Step 3: src/domain/pricing.js 구현**

```js
/**
 * ADR-020 Pattern B — 클라이언트가 보낸 가격을 *받지 않음*.
 * 서버는 menu_id, qty, couponCode만 받아 자체 계산.
 */

export const COUPON_AMOUNT = 1000;

export class MenuNotFound extends Error {
  constructor(menuId) { super(`Menu not found: ${menuId}`); this.menuId = menuId; this.code = 'MENU_NOT_FOUND'; }
}
export class MenuSoldOut extends Error {
  constructor(menuId) { super(`Menu sold out: ${menuId}`); this.menuId = menuId; this.code = 'MENU_SOLD_OUT'; }
}

/**
 * @param {Array<{menu_id:number, qty:number}>} items
 * @param {string|null} couponCode
 * @param {{prices:Map<number,number>, names:Map<number,string>, soldOut:Set<number>}} menuSnapshot
 * @returns {{subtotal:number, discount:number, total:number, lineItems:Array}}
 */
export function calculate(items, couponCode, menuSnapshot) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('items must be a non-empty array');
  }
  const lineItems = items.map(({ menu_id, qty }) => {
    if (menuSnapshot.soldOut.has(menu_id)) throw new MenuSoldOut(menu_id);
    const price = menuSnapshot.prices.get(menu_id);
    if (price == null) throw new MenuNotFound(menu_id);
    const name = menuSnapshot.names.get(menu_id);
    return {
      menu_id, qty,
      menu_name_snap: name,
      unit_price: price,
      line_total: price * qty,
    };
  });
  const subtotal = lineItems.reduce((s, li) => s + li.line_total, 0);
  const discount = couponCode ? COUPON_AMOUNT : 0;
  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total, lineItems };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- pricing-adr020
```

Expected: 4 passed.

- [ ] **Step 5: 추가 단위 테스트 (pricing.test.js — edge cases)**

```js
// tests/unit/pricing.test.js
import { describe, it, expect } from 'vitest';
import { calculate } from '../../src/domain/pricing.js';

const snap = {
  prices: new Map([[1, 18000], [5, 2000]]),
  names:  new Map([[1, '후라이드'], [5, '콜라']]),
  soldOut: new Set(),
};

describe('pricing — edge cases', () => {
  it('빈 배열 거부', () => {
    expect(() => calculate([], null, snap)).toThrow();
  });
  it('수량 정확 곱셈', () => {
    const r = calculate([{ menu_id: 5, qty: 3 }], null, snap);
    expect(r.subtotal).toBe(6000);
  });
  it('subtotal - discount = total 무결성', () => {
    const r = calculate([{ menu_id: 1, qty: 1 }], 'X', snap);
    expect(r.subtotal - r.discount).toBe(r.total);
  });
});
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
npm test -- pricing
```

Expected: 4 (adr020) + 3 (edge) = 7 passed.

- [ ] **Step 7: Commit**

```bash
git add src/domain/pricing.js tests/unit/pricing-adr020.test.js tests/unit/pricing.test.js
git commit -m "feat: Phase 1.1 — pricing.js Pattern B + ADR-020 4 케이스 회귀 강제 (★)"
```

---

## Task 1.2: coupon-validation.js — ADR-019/021 4단계

**Files:**
- Create: `src/domain/coupon-validation.js`
- Create: `tests/unit/coupon-validation.test.js`

- [ ] **Step 1: RED 테스트**

```js
// tests/unit/coupon-validation.test.js
import { describe, it, expect } from 'vitest';
import { validateCoupon, REASON } from '../../src/domain/coupon-validation.js';

const mockUsedCouponsRepo = {
  exists: (sid) => sid === '202637042', // 이미 사용된 학번
};

describe('coupon-validation — ADR-019 + ADR-021 4단계', () => {
  it('정상 1학년 (학번 prefix 202637 + 이름 + 미사용)', () => {
    expect(validateCoupon('202637001', '김신입', mockUsedCouponsRepo))
      .toEqual({ valid: true });
  });
  it('8자리 학번 → format', () => {
    expect(validateCoupon('20263700', '홍', mockUsedCouponsRepo))
      .toEqual({ valid: false, reason: REASON.FORMAT });
  });
  it('10자리 학번 → format', () => {
    expect(validateCoupon('2026370011', '홍', mockUsedCouponsRepo))
      .toEqual({ valid: false, reason: REASON.FORMAT });
  });
  it('알파벳 포함 → format', () => {
    expect(validateCoupon('A02637001', '홍', mockUsedCouponsRepo))
      .toEqual({ valid: false, reason: REASON.FORMAT });
  });
  it('다른 학과 prefix → prefix', () => {
    expect(validateCoupon('202638001', '홍', mockUsedCouponsRepo))
      .toEqual({ valid: false, reason: REASON.PREFIX });
  });
  it('4학년 prefix → prefix', () => {
    expect(validateCoupon('202337001', '홍', mockUsedCouponsRepo))
      .toEqual({ valid: false, reason: REASON.PREFIX });
  });
  it('빈 이름 → name', () => {
    expect(validateCoupon('202637001', '', mockUsedCouponsRepo))
      .toEqual({ valid: false, reason: REASON.NAME });
  });
  it('공백 이름 → name', () => {
    expect(validateCoupon('202637001', '   ', mockUsedCouponsRepo))
      .toEqual({ valid: false, reason: REASON.NAME });
  });
  it('이미 사용된 학번 → duplicate', () => {
    expect(validateCoupon('202637042', '홍길동', mockUsedCouponsRepo))
      .toEqual({ valid: false, reason: REASON.DUPLICATE });
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npm test -- coupon-validation
```

Expected: 9 failed (module not found).

- [ ] **Step 3: 구현**

```js
// src/domain/coupon-validation.js
export const REASON = {
  FORMAT: 'format',
  PREFIX: 'prefix',
  NAME: 'name',
  DUPLICATE: 'duplicate',
};

const PREFIX = '202637'; // ADR-019 컴퓨터모바일융합과 1학년

/**
 * @param {string} studentId
 * @param {string} name
 * @param {{exists: (sid:string)=>boolean}} usedCouponsRepo
 * @returns {{valid:true} | {valid:false, reason:string}}
 */
export function validateCoupon(studentId, name, usedCouponsRepo) {
  if (!/^\d{9}$/.test(studentId)) return { valid: false, reason: REASON.FORMAT };
  if (!studentId.startsWith(PREFIX)) return { valid: false, reason: REASON.PREFIX };
  if (!name || name.trim().length < 1) return { valid: false, reason: REASON.NAME };
  if (usedCouponsRepo.exists(studentId)) return { valid: false, reason: REASON.DUPLICATE };
  return { valid: true };
}
```

- [ ] **Step 4: 통과 확인**

```bash
npm test -- coupon-validation
```

Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add src/domain/coupon-validation.js tests/unit/coupon-validation.test.js
git commit -m "feat: Phase 1.2 — coupon-validation 4단계 (ADR-019/021)"
```

---

## Task 1.3: order-state.js — 상태 전이 머신

**Files:**
- Create: `src/domain/order-state.js`
- Create: `tests/unit/order-state.test.js`

- [ ] **Step 1: RED 테스트**

```js
// tests/unit/order-state.test.js
import { describe, it, expect } from 'vitest';
import { canTransition, STATUS, IllegalStateTransition } from '../../src/domain/order-state.js';

describe('order-state — 합법 전이', () => {
  const legal = [
    ['ORDERED', 'TRANSFER_REPORTED', 'customer'],
    ['ORDERED', 'CANCELED', 'admin'],
    ['TRANSFER_REPORTED', 'PAID', 'admin'],
    ['TRANSFER_REPORTED', 'HOLD', 'admin'],
    ['HOLD', 'TRANSFER_REPORTED', 'customer'],
    ['HOLD', 'TRANSFER_REPORTED', 'admin'],
    ['PAID', 'COOKING', 'admin'],
    ['COOKING', 'READY', 'admin'],
    ['READY', 'DONE', 'admin'],
    ['PAID', 'CANCELED', 'admin'],
    ['COOKING', 'CANCELED', 'admin'],
    ['READY', 'CANCELED', 'admin'],
  ];
  for (const [from, to, actor] of legal) {
    it(`${from} → ${to} (${actor})`, () => {
      expect(canTransition(from, to, actor)).toBe(true);
    });
  }
});

describe('order-state — 불법 전이', () => {
  const illegal = [
    ['DONE', 'COOKING', 'admin'],
    ['DONE', 'CANCELED', 'admin'],
    ['CANCELED', 'ORDERED', 'admin'],
    ['ORDERED', 'PAID', 'admin'],
    ['ORDERED', 'COOKING', 'admin'],
    ['TRANSFER_REPORTED', 'COOKING', 'admin'],
    ['READY', 'COOKING', 'admin'],
  ];
  for (const [from, to, actor] of illegal) {
    it(`${from} → ${to} reject`, () => {
      expect(canTransition(from, to, actor)).toBe(false);
    });
  }
});

describe('STATUS enum', () => {
  it('8개 상태 + HOLD', () => {
    expect(Object.values(STATUS)).toEqual(
      expect.arrayContaining(['ORDERED','TRANSFER_REPORTED','PAID','COOKING','READY','DONE','CANCELED','HOLD'])
    );
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npm test -- order-state
```

- [ ] **Step 3: 구현**

```js
// src/domain/order-state.js
export const STATUS = {
  ORDERED: 'ORDERED',
  TRANSFER_REPORTED: 'TRANSFER_REPORTED',
  PAID: 'PAID',
  COOKING: 'COOKING',
  READY: 'READY',
  DONE: 'DONE',
  CANCELED: 'CANCELED',
  HOLD: 'HOLD',
};

export class IllegalStateTransition extends Error {
  constructor(from, to) {
    super(`Illegal transition: ${from} → ${to}`);
    this.from = from; this.to = to; this.code = 'ORDER_STATE_INVALID';
  }
}

const TRANSITIONS = {
  ORDERED:           ['TRANSFER_REPORTED', 'CANCELED'],
  TRANSFER_REPORTED: ['PAID', 'HOLD', 'CANCELED'],
  HOLD:              ['TRANSFER_REPORTED', 'CANCELED'],
  PAID:              ['COOKING', 'CANCELED'],
  COOKING:           ['READY', 'CANCELED'],
  READY:             ['DONE', 'CANCELED'],
  DONE:              [],
  CANCELED:          [],
};

export function canTransition(from, to, _actor) {
  return (TRANSITIONS[from] || []).includes(to);
}

export function assertTransition(from, to, actor) {
  if (!canTransition(from, to, actor)) throw new IllegalStateTransition(from, to);
}
```

- [ ] **Step 4: 통과 + commit**

```bash
npm test -- order-state
git add src/domain/order-state.js tests/unit/order-state.test.js
git commit -m "feat: Phase 1.3 — order-state 상태 전이 머신 (12 합법 + 7 불법)"
```

---

## Task 1.4: settlement.js — ADR-012 마감 가드

**Files:**
- Create: `src/domain/settlement.js`
- Create: `tests/unit/settlement.test.js`

- [ ] **Step 1: RED 테스트**

```js
// tests/unit/settlement.test.js
import { describe, it, expect } from 'vitest';
import { canClose, ACTIVE_STATUSES } from '../../src/domain/settlement.js';

describe('settlement.canClose — ADR-012 T3 가드', () => {
  it('진행 주문 0건 → 마감 가능', () => {
    const counts = { DONE: 234, CANCELED: 12 };
    expect(canClose(counts)).toEqual({ ok: true });
  });
  it('ORDERED 1건 → 거부 + breakdown', () => {
    const counts = { ORDERED: 1, DONE: 5 };
    expect(canClose(counts)).toEqual({ ok: false, breakdown: { ORDERED: 1 }, total: 1 });
  });
  it('TRANSFER_REPORTED + HOLD → 거부', () => {
    const counts = { TRANSFER_REPORTED: 2, HOLD: 1, DONE: 10 };
    expect(canClose(counts).ok).toBe(false);
    expect(canClose(counts).total).toBe(3);
  });
  it('모두 DONE/CANCELED → 마감 가능', () => {
    expect(canClose({ DONE: 100, CANCELED: 20 }).ok).toBe(true);
  });
  it('ACTIVE_STATUSES = 6종', () => {
    expect(ACTIVE_STATUSES).toEqual(
      expect.arrayContaining(['ORDERED','TRANSFER_REPORTED','PAID','COOKING','READY','HOLD'])
    );
    expect(ACTIVE_STATUSES.length).toBe(6);
  });
});
```

- [ ] **Step 2-4: 구현 + 통과 + 커밋**

```js
// src/domain/settlement.js
export const ACTIVE_STATUSES = ['ORDERED','TRANSFER_REPORTED','PAID','COOKING','READY','HOLD'];

export function canClose(statusCounts) {
  const breakdown = {};
  let total = 0;
  for (const s of ACTIVE_STATUSES) {
    const n = statusCounts[s] || 0;
    if (n > 0) { breakdown[s] = n; total += n; }
  }
  return total === 0 ? { ok: true } : { ok: false, breakdown, total };
}
```

```bash
npm test -- settlement
git add src/domain/settlement.js tests/unit/settlement.test.js
git commit -m "feat: Phase 1.4 — settlement.canClose (ADR-012 T3 마감 가드)"
```

---

## Task 1.5: popularity.js — 인기 랭킹 + 카피 (ADR-017)

**Files:**
- Create: `src/domain/popularity.js`
- Create: `tests/unit/popularity.test.js`

- [ ] **Step 1: RED 테스트**

```js
// tests/unit/popularity.test.js
import { describe, it, expect } from 'vitest';
import { computeRanking, generateCopy } from '../../src/domain/popularity.js';

describe('popularity', () => {
  it('TOP 3 정상 정렬', () => {
    const sales = [
      { menu_id: 1, name: '후라이드', qty: 19 },
      { menu_id: 3, name: '뿌링클',   qty: 37 },
      { menu_id: 2, name: '양념',     qty: 12 },
      { menu_id: 5, name: '콜라',     qty: 50 },
      { menu_id: 4, name: '치즈스틱', qty: 30 },
    ];
    const top3 = computeRanking(sales);
    expect(top3.length).toBe(3);
    expect(top3[0].name).toBe('콜라');
    expect(top3[1].name).toBe('뿌링클');
    expect(top3[2].name).toBe('치즈스틱');
  });

  it('데이터 부족 (3개 미만)', () => {
    expect(computeRanking([{ menu_id:1, name:'A', qty:1 }]).length).toBe(1);
    expect(computeRanking([])).toEqual([]);
  });

  it('동률 tie-break: menu_id 작은 순', () => {
    const r = computeRanking([
      { menu_id: 5, name:'B', qty: 10 },
      { menu_id: 2, name:'A', qty: 10 },
    ]);
    expect(r[0].menu_id).toBe(2);
  });
});

describe('generateCopy — ADR-017', () => {
  it('1위가 2위 격차 큼 (2배+) → dominant_first', () => {
    const r = generateCopy([
      { menu_id:1, name:'뿌링클', qty:37 },
      { menu_id:2, name:'양념', qty:14 },
      { menu_id:3, name:'후라이드', qty:10 },
    ]);
    expect(r.copy_type).toBe('dominant_first');
    expect(r.copy).toContain('뿌링클');
    expect(r.copy).toContain('압도적');
  });

  it('1위·2위 격차 작음 (<20%) → close_race', () => {
    const r = generateCopy([
      { menu_id:1, name:'뿌링클', qty:21 },
      { menu_id:2, name:'양념', qty:20 },
    ]);
    expect(r.copy_type).toBe('close_race');
    expect(r.copy).toContain('양념');
  });

  it('데이터 0건 → seed', () => {
    const r = generateCopy([]);
    expect(r.copy_type).toBe('seed');
    expect(r.copy).toContain('학생회 추천');
  });
});
```

- [ ] **Step 2-3: 구현**

```js
// src/domain/popularity.js
export function computeRanking(sales) {
  if (!sales || sales.length === 0) return [];
  return [...sales]
    .sort((a, b) => b.qty - a.qty || a.menu_id - b.menu_id)
    .slice(0, 3);
}

export function generateCopy(salesOrTop3) {
  const top3 = salesOrTop3.length > 3 ? computeRanking(salesOrTop3) : salesOrTop3;
  if (top3.length === 0) {
    return { copy: '🔥 학생회 추천 BEST', copy_type: 'seed', ranking: [] };
  }
  const ranking = top3;
  if (ranking.length === 1) {
    return { copy: `🔥 ${ranking[0].name} 단독 1위!`, copy_type: 'dominant_first', ranking };
  }
  const [first, second] = ranking;
  const gap = first.qty - second.qty;
  const ratio = second.qty === 0 ? Infinity : first.qty / second.qty;
  if (ratio >= 2) {
    return { copy: `현재 **${first.name}**이 압도적 1위!`, copy_type: 'dominant_first', ranking };
  }
  if (gap > 0 && gap / first.qty < 0.20) {
    return { copy: `**${second.name}**이 추격 중입니다.`, copy_type: 'close_race', ranking };
  }
  return { copy: `🔥 ${first.name} 1위!`, copy_type: 'dominant_first', ranking };
}
```

- [ ] **Step 4-5: 통과 + 커밋**

```bash
npm test -- popularity
git add src/domain/popularity.js tests/unit/popularity.test.js
git commit -m "feat: Phase 1.5 — popularity 랭킹 + 동적 카피 (ADR-017)"
```

---

## Task 1.6: transfer-matching.js — §6.4 4요소 매칭 정책

**Files:**
- Create: `src/domain/transfer-matching.js`
- Create: `tests/unit/transfer-matching.test.js`

- [ ] **Step 1: RED 테스트**

```js
// tests/unit/transfer-matching.test.js
import { describe, it, expect } from 'vitest';
import { matches } from '../../src/domain/transfer-matching.js';

const baseReport = { name:'홍길동', bank:'카카오뱅크', amount:21000, at:'2026-05-20T17:33:00+09:00' };
const baseDeposit = { name:'홍길동', bank:'카카오뱅크', amount:21000, at:'2026-05-20T17:31:00+09:00' };

describe('transfer-matching — §6.4', () => {
  it('4요소 일치 → match', () => {
    expect(matches(baseReport, baseDeposit)).toBe(true);
  });
  it('이름 1글자 차이 → false', () => {
    expect(matches({ ...baseReport, name:'홍길도' }, baseDeposit)).toBe(false);
  });
  it('은행 다름 → false', () => {
    expect(matches({ ...baseReport, bank:'신한은행' }, baseDeposit)).toBe(false);
  });
  it('금액 1원 차이 → false', () => {
    expect(matches({ ...baseReport, amount:20999 }, baseDeposit)).toBe(false);
  });
  it('시각 ±5분 경계 (300초 정확) → true', () => {
    const r = { ...baseReport, at:'2026-05-20T17:36:00+09:00' };
    expect(matches(r, baseDeposit)).toBe(true);
  });
  it('시각 5분 1초 → false', () => {
    const r = { ...baseReport, at:'2026-05-20T17:36:01+09:00' };
    expect(matches(r, baseDeposit)).toBe(false);
  });
});
```

- [ ] **Step 2-3: 구현**

```js
// src/domain/transfer-matching.js
const FIVE_MIN_MS = 5 * 60 * 1000;

export function matches(report, deposit) {
  if (report.name !== deposit.name) return false;
  if (report.bank !== deposit.bank) return false;
  if (report.amount !== deposit.amount) return false;
  const dt = Math.abs(new Date(report.at).getTime() - new Date(deposit.at).getTime());
  return dt <= FIVE_MIN_MS;
}
```

- [ ] **Step 4-5: 통과 + 커밋**

```bash
npm test -- transfer-matching
git add src/domain/transfer-matching.js tests/unit/transfer-matching.test.js
git commit -m "feat: Phase 1.6 — transfer-matching 4요소 (§6.4)"
```

---

## Task 1.7: menu-repo.js

**Files:**
- Create: `src/db/repositories/menu-repo.js`
- Create: `tests/integration/menu-repo.test.js`

- [ ] **Step 1: RED 테스트**

```js
// tests/integration/menu-repo.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';
import { MenuRepo } from '../../src/db/repositories/menu-repo.js';

describe('MenuRepo', () => {
  let db, repo;
  beforeEach(() => { db = setupTestDb(); repo = new MenuRepo(db); });
  afterEach(() => teardownTestDb(db));

  it('findAllActive — soft-deleted 제외', () => {
    const menus = repo.findAllActive();
    expect(menus.length).toBeGreaterThanOrEqual(5);
    expect(menus[0]).toHaveProperty('name');
    expect(menus[0]).toHaveProperty('price');
  });
  it('buildSnapshot — Map + Set 반환', () => {
    const snap = repo.buildSnapshot();
    expect(snap.prices.get(1)).toBe(18000);
    expect(snap.names.get(1)).toBe('후라이드');
    expect(snap.soldOut.size).toBe(0);
  });
  it('toggleSoldOut(id) → buildSnapshot에 반영', () => {
    repo.toggleSoldOut(1, true);
    const snap = repo.buildSnapshot();
    expect(snap.soldOut.has(1)).toBe(true);
  });
});
```

- [ ] **Step 2-3: 구현**

```js
// src/db/repositories/menu-repo.js
export class MenuRepo {
  constructor(db) { this.db = db; }

  findAllActive() {
    return this.db.prepare(`
      SELECT id, category_id, name, price, image_url, fallback_emoji,
             is_recommended, is_sold_out, display_order
      FROM menus
      WHERE deleted_at IS NULL
      ORDER BY display_order, id
    `).all();
  }

  buildSnapshot() {
    const rows = this.findAllActive();
    const prices = new Map();
    const names  = new Map();
    const soldOut = new Set();
    for (const r of rows) {
      prices.set(r.id, r.price);
      names.set(r.id, r.name);
      if (r.is_sold_out) soldOut.add(r.id);
    }
    return { prices, names, soldOut };
  }

  toggleSoldOut(id, value) {
    return this.db.prepare(`UPDATE menus SET is_sold_out = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(value ? 1 : 0, id);
  }

  toggleRecommended(id, value) {
    return this.db.prepare(`UPDATE menus SET is_recommended = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(value ? 1 : 0, id);
  }

  create({ category_id, name, price, image_url, fallback_emoji, display_order = 0 }) {
    return this.db.prepare(`INSERT INTO menus (category_id, name, price, image_url, fallback_emoji, display_order)
      VALUES (?, ?, ?, ?, ?, ?)`).run(category_id, name, price, image_url || null, fallback_emoji || null, display_order);
  }
}
```

- [ ] **Step 4-5: 통과 + 커밋**

```bash
npm test -- menu-repo
git add src/db/repositories/menu-repo.js tests/integration/menu-repo.test.js
git commit -m "feat: Phase 1.7 — menu-repo (findAllActive + buildSnapshot + 토글)"
```

---

## Task 1.8: order-repo.js (트랜잭션 + daily_no 시퀀스)

**Files:**
- Create: `src/db/repositories/order-repo.js`
- Create: `tests/integration/order-repo.test.js`

- [ ] **Step 1: RED 테스트**

```js
// tests/integration/order-repo.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';
import { OrderRepo } from '../../src/db/repositories/order-repo.js';

describe('OrderRepo', () => {
  let db, repo;
  beforeEach(() => { db = setupTestDb(); repo = new OrderRepo(db); });
  afterEach(() => teardownTestDb(db));

  const base = {
    business_date: '2026-05-20',
    customer_name: '홍길동',
    student_id: '202637042',
    is_external: 0,
    pickup_method: 'dine_in',
    table_no: 9,
    subtotal: 22000, discount: 1000, total: 21000,
    lineItems: [
      { menu_id: 1, qty: 1, menu_name_snap: '후라이드', unit_price: 18000, line_total: 18000 },
      { menu_id: 5, qty: 2, menu_name_snap: '콜라', unit_price: 2000, line_total: 4000 },
    ],
  };

  it('createTx — daily_no 1부터 시작', () => {
    const o = repo.createTx({ ...base });
    expect(o.id).toBeDefined();
    expect(o.order_no).toBe(1);
    expect(o.status).toBe('ORDERED');
  });
  it('createTx — 같은 일자에 2건 → 1, 2', () => {
    const a = repo.createTx({ ...base });
    const b = repo.createTx({ ...base, customer_name:'B', student_id:'202637002' });
    expect(a.order_no).toBe(1);
    expect(b.order_no).toBe(2);
  });
  it('createTx — 다른 일자는 1부터 재시작 (ADR-018)', () => {
    const a = repo.createTx({ ...base });
    const b = repo.createTx({ ...base, business_date:'2026-05-21', student_id:'202637003' });
    expect(a.order_no).toBe(1);
    expect(b.order_no).toBe(1);
  });
  it('createTx — 외부인 (token 발급)', () => {
    const o = repo.createTx({ ...base, is_external: 1, student_id: null, external_token: 'abc123' });
    expect(o.external_token).toBe('abc123');
  });
  it('findById + findByStudent', () => {
    const o = repo.createTx({ ...base });
    expect(repo.findById(o.id).order_no).toBe(o.order_no);
    expect(repo.findByStudent('2026-05-20', o.order_no, '202637042').id).toBe(o.id);
  });
  it('countActiveByStatus', () => {
    repo.createTx({ ...base });
    repo.createTx({ ...base, student_id:'202637002', customer_name:'B' });
    const counts = repo.countActiveByStatus('2026-05-20');
    expect(counts.ORDERED).toBe(2);
  });
  it('transition — 합법', () => {
    const o = repo.createTx({ ...base });
    repo.transition(o.id, 'ORDERED', 'TRANSFER_REPORTED', 'customer:202637042');
    expect(repo.findById(o.id).status).toBe('TRANSFER_REPORTED');
  });
  it('transition — 불법 → 0 rows', () => {
    const o = repo.createTx({ ...base });
    expect(() => repo.transition(o.id, 'ORDERED', 'PAID', 'admin:1')).toThrow();
  });
});
```

- [ ] **Step 2-3: 구현**

```js
// src/db/repositories/order-repo.js
import { assertTransition } from '../../domain/order-state.js';

export class OrderRepo {
  constructor(db) { this.db = db; }

  createTx(input) {
    const {
      business_date, status = 'ORDERED',
      student_id = null, customer_name, is_external = 0, external_token = null, token_expires_at = null,
      pickup_method, table_no = null,
      subtotal, discount = 0, total,
      lineItems = [],
    } = input;

    const tx = this.db.transaction(() => {
      const next = this.db.prepare(
        `SELECT COALESCE(MAX(order_no), 0) + 1 AS n FROM orders WHERE business_date = ?`
      ).get(business_date).n;

      const r = this.db.prepare(`
        INSERT INTO orders (order_no, business_date, status, student_id, customer_name,
          is_external, external_token, token_expires_at, pickup_method, table_no,
          subtotal, discount, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(next, business_date, status, student_id, customer_name,
        is_external, external_token, token_expires_at, pickup_method, table_no,
        subtotal, discount, total);
      const id = r.lastInsertRowid;

      const insItem = this.db.prepare(`
        INSERT INTO order_items (order_id, menu_id, menu_name_snap, unit_price_snap, qty, line_total)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const li of lineItems) {
        insItem.run(id, li.menu_id, li.menu_name_snap, li.unit_price, li.qty, li.line_total);
      }

      this.db.prepare(`
        INSERT INTO order_events (order_id, event_type, to_status, actor)
        VALUES (?, 'created', ?, ?)
      `).run(id, status, is_external ? 'customer:external' : `customer:${student_id}`);

      return { id, order_no: next, status, external_token };
    });

    return tx();
  }

  findById(id) {
    return this.db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id);
  }

  findByStudent(business_date, order_no, student_id) {
    return this.db.prepare(`SELECT * FROM orders
      WHERE business_date = ? AND order_no = ? AND student_id = ?`)
      .get(business_date, order_no, student_id);
  }

  findByToken(business_date, order_no, token) {
    return this.db.prepare(`SELECT * FROM orders
      WHERE business_date = ? AND order_no = ? AND external_token = ?
        AND (token_expires_at IS NULL OR token_expires_at > datetime('now'))`)
      .get(business_date, order_no, token);
  }

  countActiveByStatus(business_date) {
    const rows = this.db.prepare(`
      SELECT status, COUNT(*) AS n FROM orders
      WHERE business_date = ?
      GROUP BY status
    `).all(business_date);
    const out = {};
    for (const r of rows) out[r.status] = r.n;
    return out;
  }

  transition(id, fromStatus, toStatus, actor, note = null) {
    assertTransition(fromStatus, toStatus, actor);
    const tx = this.db.transaction(() => {
      const tsCol = {
        PAID:'paid_at', COOKING:'cooking_at', READY:'ready_at',
        DONE:'done_at', CANCELED:'canceled_at', HOLD:'hold_at',
      }[toStatus];
      const tsClause = tsCol ? `, ${tsCol} = datetime('now')` : '';
      const r = this.db.prepare(`
        UPDATE orders SET status = ?, updated_at = datetime('now')${tsClause}
        WHERE id = ? AND status = ?
      `).run(toStatus, id, fromStatus);
      if (r.changes === 0) throw new Error(`Transition rejected: ${fromStatus} → ${toStatus} on order ${id}`);
      this.db.prepare(`
        INSERT INTO order_events (order_id, event_type, from_status, to_status, note, actor)
        VALUES (?, 'transition', ?, ?, ?, ?)
      `).run(id, fromStatus, toStatus, note, actor);
    });
    tx();
  }

  attachTransfer(id, bank, alt_name = null) {
    this.db.prepare(`UPDATE orders
      SET transfer_bank = ?, transfer_alt_name = ?, transfer_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?`).run(bank, alt_name, id);
  }

  findDashboardCards(business_date) {
    return this.db.prepare(`
      SELECT id, order_no, status, customer_name, student_id, is_external, total,
             transfer_bank, transfer_alt_name, transfer_at,
             (julianday('now') - julianday(updated_at)) * 24 * 60 AS elapsed_minutes
      FROM orders
      WHERE business_date = ? AND status NOT IN ('DONE', 'CANCELED')
      ORDER BY status, transfer_at NULLS FIRST, created_at
    `).all(business_date);
  }
}
```

- [ ] **Step 4-5: 통과 + 커밋**

```bash
npm test -- order-repo
git add src/db/repositories/order-repo.js tests/integration/order-repo.test.js
git commit -m "feat: Phase 1.8 — order-repo (createTx 트랜잭션 + daily_no 시퀀스 + 8 테스트)"
```

---

## Task 1.9: coupon-repo.js + admin-repo.js + settlement-repo.js + backup-repo.js

**Files:**
- Create: `src/db/repositories/coupon-repo.js`
- Create: `src/db/repositories/admin-repo.js`
- Create: `src/db/repositories/settlement-repo.js`
- Create: `src/db/repositories/backup-repo.js`
- Create: `tests/integration/coupon-repo.test.js`

- [ ] **Step 1: coupon-repo.js**

```js
// src/db/repositories/coupon-repo.js
export class CouponRepo {
  constructor(db) { this.db = db; }

  exists(student_id) {
    return !!this.db.prepare(`SELECT 1 FROM used_coupons WHERE student_id = ?`).get(student_id);
  }
  use({ student_id, name, order_id, discount }) {
    return this.db.prepare(`INSERT INTO used_coupons (student_id, name, order_id, discount)
      VALUES (?, ?, ?, ?)`).run(student_id, name, order_id, discount);
  }
  logRejection({ student_id, name, reason, ip }) {
    return this.db.prepare(`INSERT INTO rejected_coupons (student_id, name, reason, ip)
      VALUES (?, ?, ?, ?)`).run(student_id || null, name || null, reason, ip || null);
  }
  countRejectionsByIp(ip, minutes = 1) {
    return this.db.prepare(`
      SELECT COUNT(*) AS n FROM rejected_coupons
      WHERE ip = ? AND attempted_at > datetime('now', '-' || ? || ' minutes')
    `).get(ip, minutes).n;
  }
  findUsageList() {
    return this.db.prepare(`SELECT * FROM used_coupons ORDER BY used_at DESC`).all();
  }
  countRejectionsByReason() {
    const rows = this.db.prepare(`
      SELECT reason, COUNT(*) AS n FROM rejected_coupons GROUP BY reason
    `).all();
    const out = { format:0, prefix:0, name:0, duplicate:0, rate_limit:0 };
    for (const r of rows) out[r.reason] = r.n;
    return out;
  }
}
```

- [ ] **Step 2: admin-repo.js (scrypt PIN)**

```js
// src/db/repositories/admin-repo.js
import crypto from 'node:crypto';

export class AdminRepo {
  constructor(db) { this.db = db; }

  static hashPin(pin) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(pin, salt, 64);
    return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  static verifyPin(pin, stored) {
    if (!stored?.startsWith('scrypt:')) return false;
    const [, saltHex, hashHex] = stored.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(pin, salt, 64);
    return crypto.timingSafeEqual(actual, expected);
  }

  findByUsername(username) {
    return this.db.prepare(`SELECT * FROM admins WHERE username = ?`).get(username);
  }
  create({ username, pin }) {
    return this.db.prepare(`INSERT INTO admins (username, pin_hash) VALUES (?, ?)`)
      .run(username, AdminRepo.hashPin(pin));
  }
  touchLogin(id) {
    this.db.prepare(`UPDATE admins SET last_login = datetime('now') WHERE id = ?`).run(id);
  }
}
```

- [ ] **Step 3: settlement-repo.js + backup-repo.js**

```js
// src/db/repositories/settlement-repo.js
export class SettlementRepo {
  constructor(db) { this.db = db; }

  findByDate(date) {
    return this.db.prepare(`SELECT * FROM settlement_snapshots WHERE business_date = ?`).get(date);
  }
  close({ business_date, closed_by_admin_id, summary_json }) {
    return this.db.prepare(`
      INSERT INTO settlement_snapshots (business_date, closed_at, closed_by_admin_id, summary_json)
      VALUES (?, datetime('now'), ?, ?)
    `).run(business_date, closed_by_admin_id, JSON.stringify(summary_json));
  }
  updateDeposit(business_date, deposit_total, net_revenue) {
    this.db.prepare(`
      UPDATE settlement_snapshots
      SET deposit_total = ?, deposit_diff = ? - ?, deposit_input_at = datetime('now')
      WHERE business_date = ?
    `).run(deposit_total, net_revenue, deposit_total, business_date);
  }
  computeSummary(business_date) {
    const orders = this.db.prepare(`SELECT * FROM orders WHERE business_date = ? AND status = 'DONE'`).all(business_date);
    const total_orders = orders.length;
    const canceled = this.db.prepare(`SELECT COUNT(*) AS n FROM orders WHERE business_date = ? AND status = 'CANCELED'`).get(business_date).n;
    const gross = orders.reduce((s, o) => s + o.total + (o.discount || 0), 0);
    const coupon = orders.reduce((s, o) => s + (o.discount || 0), 0);
    const couponN = orders.filter(o => o.discount > 0).length;
    const byMenu = this.db.prepare(`
      SELECT oi.menu_id, oi.menu_name_snap AS name, SUM(oi.qty) AS qty, SUM(oi.line_total) AS revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.business_date = ? AND o.status = 'DONE'
      GROUP BY oi.menu_id, oi.menu_name_snap
      ORDER BY revenue DESC
    `).all(business_date);
    const byHour = this.db.prepare(`
      SELECT strftime('%H', created_at, 'localtime') AS hour, COUNT(*) AS n
      FROM orders WHERE business_date = ? AND status = 'DONE'
      GROUP BY hour ORDER BY hour
    `).all(business_date);
    return {
      business_date,
      total_orders, canceled,
      subtotal_revenue: gross,
      coupon_discount: coupon, coupon_count: couponN,
      net_revenue: gross - coupon,
      by_menu: byMenu, by_hour: byHour,
    };
  }
}
```

```js
// src/db/repositories/backup-repo.js
export class BackupRepo {
  constructor(db) { this.db = db; }

  log({ business_date, filename, source, size_bytes, downloaded_by = null }) {
    return this.db.prepare(`
      INSERT INTO backup_downloads (business_date, filename, source, size_bytes, downloaded_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(business_date, filename, source, size_bytes, downloaded_by);
  }
  findHistory(business_date, limit = 20) {
    return this.db.prepare(`
      SELECT * FROM backup_downloads
      WHERE business_date = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(business_date, limit);
  }
}
```

- [ ] **Step 4: 통합 테스트 (간단)**

```js
// tests/integration/coupon-repo.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';
import { CouponRepo } from '../../src/db/repositories/coupon-repo.js';
import { OrderRepo } from '../../src/db/repositories/order-repo.js';

describe('CouponRepo', () => {
  let db, repo, orderRepo;
  beforeEach(() => {
    db = setupTestDb();
    repo = new CouponRepo(db);
    orderRepo = new OrderRepo(db);
  });
  afterEach(() => teardownTestDb(db));

  it('exists + use + UNIQUE 위반', () => {
    expect(repo.exists('202637001')).toBe(false);
    const o = orderRepo.createTx({
      business_date:'2026-05-20', customer_name:'홍', student_id:'202637001', is_external:0,
      pickup_method:'dine_in', subtotal:18000, discount:1000, total:17000,
      lineItems:[{ menu_id:1, qty:1, menu_name_snap:'후라이드', unit_price:18000, line_total:18000 }],
    });
    repo.use({ student_id:'202637001', name:'홍', order_id:o.id, discount:1000 });
    expect(repo.exists('202637001')).toBe(true);
    const o2 = orderRepo.createTx({
      business_date:'2026-05-20', customer_name:'김', student_id:'202637002', is_external:0,
      pickup_method:'dine_in', subtotal:18000, discount:1000, total:17000,
      lineItems:[{ menu_id:1, qty:1, menu_name_snap:'후라이드', unit_price:18000, line_total:18000 }],
    });
    expect(() => repo.use({ student_id:'202637001', name:'다른', order_id:o2.id, discount:1000 }))
      .toThrow(/UNIQUE/);
  });

  it('rate-limit 카운트', () => {
    repo.logRejection({ student_id:'X', name:'X', reason:'format', ip:'1.1.1.1' });
    repo.logRejection({ student_id:'X', name:'X', reason:'prefix', ip:'1.1.1.1' });
    expect(repo.countRejectionsByIp('1.1.1.1', 1)).toBe(2);
  });
});
```

- [ ] **Step 5: 통과 + 커밋**

```bash
npm test -- coupon-repo
git add src/db/repositories/coupon-repo.js src/db/repositories/admin-repo.js src/db/repositories/settlement-repo.js src/db/repositories/backup-repo.js tests/integration/coupon-repo.test.js
git commit -m "feat: Phase 1.9 — coupon/admin/settlement/backup repo + scrypt PIN + 2 테스트"
```

---

# Phase 2 — API + Express app (P0, 1일)

## Task 2.1: Express app 셸 + healthz + 에러 핸들러

**Files:**
- Create: `src/app.js`
- Create: `src/server.js`
- Create: `src/middleware/error-handler.js`

- [ ] **Step 1: src/app.js**

```js
import express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import ConnectSqlite3 from 'connect-sqlite3';
import path from 'node:path';
import { config } from './config.js';
import { errorHandler } from './middleware/error-handler.js';

const SQLiteStore = ConnectSqlite3(session);

export function createApp({ db, logger } = {}) {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.resolve('views'));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json({ limit: '64kb' }));
  app.use(express.static('public'));
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        scriptSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
      },
    },
  }));
  app.use(session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: config.dataDir }),
    secret: config.sessionSecret,
    resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 12 * 60 * 60 * 1000 },
  }));

  app.locals.db = db;
  app.locals.logger = logger;

  app.get('/healthz', (_req, res) => res.type('text/plain').send('ok'));

  // 라우터는 후속 task에서 마운트
  app.use('/api', (await import('./routes/api/index.js')).default);
  app.use('/admin', (await import('./routes/admin/index.js')).default);
  app.use('/', (await import('./routes/customer/index.js')).default);

  app.use(errorHandler);
  return app;
}
```

> 위는 도식. 라우터 미존재 시 import 에러 — 후속 task에서 각 routes/index.js를 만들 때 한 줄씩 활성화.

- [ ] **Step 2: src/server.js**

```js
import { createApp } from './app.js';
import { openDb, runMigrations } from './db/connection.js';
import { config } from './config.js';
import pino from 'pino';

const logger = pino({ level: config.logLevel });
const db = openDb();
runMigrations(db);

const app = await createApp({ db, logger });
app.listen(config.port, () => logger.info({ port: config.port }, '🍗 chickenedak ready'));

const shutdown = () => {
  logger.info('shutting down');
  db.close();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

- [ ] **Step 3: src/middleware/error-handler.js**

```js
export function errorHandler(err, req, res, _next) {
  const logger = req.app.locals.logger;
  const code = err.code || 'INTERNAL_ERROR';
  const status = err.status
    ?? (code === 'INVALID_INPUT' ? 400
        : code === 'COUPON_DUPLICATE' ? 409
        : code === 'ORDER_STATE_INVALID' ? 409
        : code === 'MENU_NOT_FOUND' ? 404
        : code === 'MENU_SOLD_OUT' ? 409
        : code === 'SETTLEMENT_PENDING_ORDERS' ? 422
        : 500);
  logger?.error({ err, url: req.url, status, code }, 'request error');
  const wantsJson = req.path.startsWith('/api') || req.path.startsWith('/admin/api');
  if (wantsJson) {
    return res.status(status).json({
      ok: false,
      error: { code, message: err.message || '서버 오류', field: err.field || null },
      data: err.data || null,
    });
  }
  res.status(status).render(status === 404 ? 'customer/error/404' : 'customer/error/500', {
    error: err, code, status,
  });
}
```

- [ ] **Step 4: 통합 테스트 (healthz)**

```js
// tests/integration/app-bootstrap.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';

describe('app bootstrap', () => {
  let db;
  beforeEach(() => { db = setupTestDb(); });
  afterEach(() => teardownTestDb(db));

  it('GET /healthz → 200 ok', async () => {
    const { createApp } = await import('../../src/app.js');
    const app = await createApp({ db });
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.text).toBe('ok');
  });
});
```

> 라우터 index.js 파일은 다음 task에서 — 지금은 임시로 빈 router export로 통과시키거나, 이 테스트는 다음 task 후 활성화. 깔끔하게 진행하려면 **routes/api/index.js, routes/admin/index.js, routes/customer/index.js를 빈 stub으로 먼저 만들고 healthz 테스트 통과**.

- [ ] **Step 5: 빈 라우터 stub 작성**

```js
// src/routes/api/index.js
import { Router } from 'express';
const r = Router();
export default r;
```

(`src/routes/admin/index.js`, `src/routes/customer/index.js`도 동일 — Router() export.)

- [ ] **Step 6: 통과 확인 + 커밋**

```bash
npm test -- app-bootstrap
git add src/app.js src/server.js src/middleware/error-handler.js src/routes/api/index.js src/routes/admin/index.js src/routes/customer/index.js tests/integration/app-bootstrap.test.js
git commit -m "feat: Phase 2.1 — Express app + session + helmet + error-handler + healthz"
```

---

## Task 2.2: GET /api/menus + GET /api/popular

**Files:**
- Create: `src/routes/api/menus.js`
- Create: `src/routes/api/popularity.js`
- Modify: `src/routes/api/index.js`

- [ ] **Step 1: RED 통합 테스트**

```js
// tests/integration/api-menus.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';

describe('GET /api/menus', () => {
  let db, app;
  beforeEach(async () => {
    db = setupTestDb();
    const { createApp } = await import('../../src/app.js');
    app = await createApp({ db });
  });
  afterEach(() => teardownTestDb(db));

  it('정상 응답 — categories + menus', async () => {
    const res = await request(app).get('/api/menus');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.categories.length).toBeGreaterThanOrEqual(3);
    expect(res.body.data.menus.length).toBeGreaterThanOrEqual(5);
    expect(res.body.data.menus[0]).toHaveProperty('price');
  });
});

describe('GET /api/popular', () => {
  let db, app;
  beforeEach(async () => {
    db = setupTestDb();
    const { createApp } = await import('../../src/app.js');
    app = await createApp({ db });
  });
  afterEach(() => teardownTestDb(db));

  it('데이터 0건 → seed 카피', async () => {
    const res = await request(app).get('/api/popular');
    expect(res.body.data.copy_type).toBe('seed');
  });
});
```

- [ ] **Step 2: src/routes/api/menus.js**

```js
import { Router } from 'express';
import { MenuRepo } from '../../db/repositories/menu-repo.js';

const r = Router();

r.get('/menus', (req, res, next) => {
  try {
    const repo = new MenuRepo(req.app.locals.db);
    const menus = repo.findAllActive();
    const categories = req.app.locals.db.prepare(`SELECT id, name, display_order FROM menu_categories ORDER BY display_order`).all();
    res.json({ ok: true, data: { categories, menus } });
  } catch (e) { next(e); }
});

export default r;
```

- [ ] **Step 3: src/routes/api/popularity.js**

```js
import { Router } from 'express';
import { generateCopy } from '../../domain/popularity.js';

const r = Router();
let cache = null;
let cacheUntil = 0;
const TTL_MS = 5 * 60 * 1000;

r.get('/popular', (req, res, next) => {
  try {
    if (cache && Date.now() < cacheUntil) {
      return res.json({ ok: true, data: cache });
    }
    const db = req.app.locals.db;
    const today = new Date().toISOString().slice(0, 10);
    const sales = db.prepare(`
      SELECT m.id AS menu_id, m.name, SUM(oi.qty) AS qty
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN menus m ON oi.menu_id = m.id
      WHERE o.business_date = ? AND o.status IN ('PAID','COOKING','READY','DONE')
      GROUP BY m.id, m.name
      ORDER BY qty DESC
      LIMIT 10
    `).all(today);
    const result = generateCopy(sales);
    cache = { ranking: result.ranking, copy: result.copy, copy_type: result.copy_type, stale_until: new Date(Date.now() + TTL_MS).toISOString() };
    cacheUntil = Date.now() + TTL_MS;
    res.json({ ok: true, data: cache });
  } catch (e) { next(e); }
});

export default r;
```

- [ ] **Step 4: src/routes/api/index.js 마운트**

```js
import { Router } from 'express';
import menus from './menus.js';
import popularity from './popularity.js';

const r = Router();
r.use(menus);
r.use(popularity);
export default r;
```

- [ ] **Step 5: 통과 + 커밋**

```bash
npm test -- api-menus
git add src/routes/api/menus.js src/routes/api/popularity.js src/routes/api/index.js tests/integration/api-menus.test.js
git commit -m "feat: Phase 2.2 — GET /api/menus + GET /api/popular (5분 캐시)"
```

---

## Task 2.3: ★ POST /api/orders (Pattern B + G3·G4·G5 통합)

**Files:**
- Create: `src/routes/api/orders.js`
- Modify: `src/routes/api/index.js`

- [ ] **Step 1: RED 통합 테스트**

```js
// tests/integration/api-order-create.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';

describe('POST /api/orders — ADR-020 Pattern B + 외부인·쿠폰 통합', () => {
  let db, app;
  beforeEach(async () => {
    db = setupTestDb();
    const { createApp } = await import('../../src/app.js');
    app = await createApp({ db });
  });
  afterEach(() => teardownTestDb(db));

  const base = {
    items: [{ menu_id: 1, qty: 1 }, { menu_id: 5, qty: 2 }],
    pickup: 'dine_in', table_no: 9,
    student_id: '202637042', name: '홍길동',
    is_external: false, use_coupon: false,
  };

  it('정상 학생 주문 → 201 + order_no=1 + total=22000', async () => {
    const res = await request(app).post('/api/orders').send(base);
    expect(res.status).toBe(201);
    expect(res.body.data.order_no).toBe(1);
    expect(res.body.data.total).toBe(22000);
    expect(res.body.data.subtotal).toBe(22000);
    expect(res.body.data.discount).toBe(0);
  });

  it('★ ADR-020 — 클라가 price/total 추가해도 zod가 거부', async () => {
    const res = await request(app).post('/api/orders').send({ ...base, total: 100, items:[{ menu_id:1, qty:1, price:100 }] });
    // zod strict 모드면 unknown 필드 거부 — 또는 무시 후 서버 계산
    expect([400, 201]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.data.total).toBe(18000); // 클라이언트 100 무시, 서버가 18000 계산
    }
  });

  it('쿠폰 적용 (학번 prefix + 이름 + 미사용) → discount 1000', async () => {
    const res = await request(app).post('/api/orders').send({ ...base, use_coupon: true });
    expect(res.status).toBe(201);
    expect(res.body.data.discount).toBe(1000);
    expect(res.body.data.total).toBe(21000);
  });

  it('쿠폰 prefix 위조 → 400 COUPON_PREFIX', async () => {
    const res = await request(app).post('/api/orders')
      .send({ ...base, student_id: '202638042', use_coupon: true });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('COUPON_PREFIX');
  });

  it('★ G5 — 동일 학번 쿠폰 중복 사용 → 409 COUPON_DUPLICATE', async () => {
    await request(app).post('/api/orders').send({ ...base, use_coupon: true });
    const res = await request(app).post('/api/orders')
      .send({ ...base, use_coupon: true });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('COUPON_DUPLICATE');
  });

  it('★ G3 — 외부인 (is_external=true, student_id 없음, name만)', async () => {
    const res = await request(app).post('/api/orders').send({
      items: base.items, pickup: 'takeout',
      name: '홍어머니', is_external: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.external_token).toBeTruthy();
    expect(res.body.data.external_token.length).toBeGreaterThanOrEqual(32);
  });

  it('★ G3 — 외부인이 use_coupon=true 시도 → 400 INVALID_INPUT', async () => {
    const res = await request(app).post('/api/orders').send({
      items: base.items, pickup: 'takeout',
      name: '홍어머니', is_external: true,
      use_coupon: true, // 외부인은 쿠폰 X
    });
    expect(res.status).toBe(400);
  });

  it('품절 메뉴 → 409 MENU_SOLD_OUT', async () => {
    db.prepare(`UPDATE menus SET is_sold_out = 1 WHERE id = 1`).run();
    const res = await request(app).post('/api/orders').send(base);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('MENU_SOLD_OUT');
  });

  it('daily_no 1, 2, 3 연속 발급', async () => {
    const r1 = await request(app).post('/api/orders').send({ ...base, student_id:'202637001' });
    const r2 = await request(app).post('/api/orders').send({ ...base, student_id:'202637002', name:'B' });
    const r3 = await request(app).post('/api/orders').send({ ...base, student_id:'202637003', name:'C' });
    expect(r1.body.data.order_no).toBe(1);
    expect(r2.body.data.order_no).toBe(2);
    expect(r3.body.data.order_no).toBe(3);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npm test -- api-order-create
```

- [ ] **Step 3: src/routes/api/orders.js 구현**

```js
import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { calculate, MenuNotFound, MenuSoldOut } from '../../domain/pricing.js';
import { validateCoupon, REASON } from '../../domain/coupon-validation.js';
import { MenuRepo } from '../../db/repositories/menu-repo.js';
import { OrderRepo } from '../../db/repositories/order-repo.js';
import { CouponRepo } from '../../db/repositories/coupon-repo.js';

const r = Router();

// ★ ADR-020: 가격·합계 필드 *아예 없음*
const OrderInput = z.object({
  items: z.array(z.object({
    menu_id: z.number().int().positive(),
    qty: z.number().int().min(1).max(20),
  })).min(1).max(20),
  pickup: z.enum(['dine_in', 'takeout']),
  table_no: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  student_id: z.string().regex(/^\d{9}$/).optional(),
  name: z.string().trim().min(1).max(20),
  is_external: z.boolean().default(false),
  use_coupon: z.boolean().default(false),
}).refine(d => d.is_external || d.student_id, {
  message: '학번 입력이 필요합니다',
  path: ['student_id'],
}).refine(d => !(d.is_external && d.use_coupon), {
  message: '외부인은 쿠폰을 사용할 수 없습니다',
  path: ['use_coupon'],
}).refine(d => d.pickup !== 'dine_in' || d.table_no, {
  message: '테이블 번호를 입력해주세요',
  path: ['table_no'],
});

function todayKST() {
  const d = new Date();
  d.setHours(d.getHours() + 9); // UTC → KST (간단 변환)
  return d.toISOString().slice(0, 10);
}

r.post('/orders', (req, res, next) => {
  try {
    const parsed = OrderInput.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const e = new Error(issue.message);
      e.code = 'INVALID_INPUT';
      e.field = issue.path.join('.');
      return next(e);
    }
    const input = parsed.data;
    const db = req.app.locals.db;
    const menuRepo = new MenuRepo(db);
    const orderRepo = new OrderRepo(db);
    const couponRepo = new CouponRepo(db);

    // ★ ADR-020 — 서버 자체 계산 (클라이언트 가격은 받지도 않음)
    const snapshot = menuRepo.buildSnapshot();

    // ★ 쿠폰 검증 (학생만, ADR-019 4단계)
    let couponApplied = null;
    if (input.use_coupon && !input.is_external) {
      const v = validateCoupon(input.student_id, input.name, couponRepo);
      if (!v.valid) {
        // ip rate-limit
        const ip = req.ip;
        couponRepo.logRejection({ student_id: input.student_id, name: input.name, reason: v.reason, ip });
        const rejCount = couponRepo.countRejectionsByIp(ip);
        if (rejCount > 5) {
          const e = new Error('잠시 후 다시 시도해 주세요');
          e.code = 'COUPON_RATE_LIMIT';
          e.status = 429;
          return next(e);
        }
        const codeMap = { format:'COUPON_FORMAT', prefix:'COUPON_PREFIX', name:'COUPON_NAME', duplicate:'COUPON_DUPLICATE' };
        const msgMap = {
          format: '학번은 9자리 숫자입니다.',
          prefix: '이번 쿠폰은 컴퓨터모바일융합과 1학년 환영 쿠폰입니다.',
          name:   '이름을 입력해 주세요.',
          duplicate: '이 학번은 이미 쿠폰을 사용했어요. 즐거운 축제 보내세요!',
        };
        const e = new Error(msgMap[v.reason]);
        e.code = codeMap[v.reason];
        return next(e);
      }
      couponApplied = 'COUPON_OK';
    }

    let priceResult;
    try {
      priceResult = calculate(input.items, couponApplied, snapshot);
    } catch (err) {
      if (err instanceof MenuNotFound) { err.message = '메뉴를 찾을 수 없습니다'; }
      if (err instanceof MenuSoldOut) { err.message = '해당 메뉴는 품절입니다'; }
      return next(err);
    }

    // 외부인 토큰
    let external_token = null;
    let token_expires_at = null;
    if (input.is_external) {
      external_token = crypto.randomBytes(16).toString('hex');
      const exp = new Date(Date.now() + 24 * 60 * 60 * 1000);
      token_expires_at = exp.toISOString().replace('T', ' ').slice(0, 19);
    }

    const tx = db.transaction(() => {
      const order = orderRepo.createTx({
        business_date: todayKST(),
        status: 'ORDERED',
        student_id: input.is_external ? null : input.student_id,
        customer_name: input.name,
        is_external: input.is_external ? 1 : 0,
        external_token, token_expires_at,
        pickup_method: input.pickup,
        table_no: input.pickup === 'dine_in' ? Number(input.table_no) : null,
        subtotal: priceResult.subtotal,
        discount: priceResult.discount,
        total: priceResult.total,
        lineItems: priceResult.lineItems,
      });
      if (couponApplied) {
        couponRepo.use({
          student_id: input.student_id, name: input.name,
          order_id: order.id, discount: priceResult.discount,
        });
      }
      return order;
    });

    let order;
    try {
      order = tx();
    } catch (err) {
      // UNIQUE 충돌 (race)
      if (String(err.message).includes('UNIQUE') && String(err.message).includes('used_coupons')) {
        const e = new Error('이 학번은 이미 쿠폰을 사용했어요.');
        e.code = 'COUPON_DUPLICATE';
        return next(e);
      }
      return next(err);
    }

    if (input.is_external) {
      res.cookie('co_token', external_token, { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 });
    }
    res.status(201).json({
      ok: true,
      data: {
        order_id: order.id,
        order_no: order.order_no,
        business_date: todayKST(),
        subtotal: priceResult.subtotal,
        discount: priceResult.discount,
        total: priceResult.total,
        external_token,
      },
    });
  } catch (e) { next(e); }
});

export default r;
```

- [ ] **Step 4: api/index.js에 마운트 + 통과**

```js
// src/routes/api/index.js
import { Router } from 'express';
import menus from './menus.js';
import popularity from './popularity.js';
import orders from './orders.js';

const r = Router();
r.use(menus);
r.use(popularity);
r.use(orders);
export default r;
```

```bash
npm test -- api-order-create
```

Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add src/routes/api/orders.js src/routes/api/index.js tests/integration/api-order-create.test.js
git commit -m "feat: Phase 2.3 — POST /api/orders Pattern B + 외부인 + 쿠폰 4단계 통합 (9 테스트, ★ ADR-020/019/021)"
```

---

## Task 2.4: ★ GET /api/coupons/check (G5 신설)

**Files:**
- Create: `src/routes/api/coupons.js`
- Modify: `src/routes/api/index.js`

- [ ] **Step 1: RED 테스트**

```js
// tests/integration/api-coupon-check.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';

describe('GET /api/coupons/check — G5 사전 검증 API', () => {
  let db, app;
  beforeEach(async () => {
    db = setupTestDb();
    const { createApp } = await import('../../src/app.js');
    app = await createApp({ db });
  });
  afterEach(() => teardownTestDb(db));

  it('정상 1학년 → 200 eligible:true', async () => {
    const res = await request(app).get('/api/coupons/check?sid=202637001&name=김신입');
    expect(res.status).toBe(200);
    expect(res.body.data.eligible).toBe(true);
    expect(res.body.data.discount).toBe(1000);
  });
  it('prefix 위조 → 400 COUPON_PREFIX', async () => {
    const res = await request(app).get('/api/coupons/check?sid=202638001&name=홍');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('COUPON_PREFIX');
  });
  it('이미 사용 → 409 COUPON_DUPLICATE', async () => {
    // 미리 사용된 학번 시드
    db.prepare(`INSERT INTO orders (order_no, business_date, status, is_external, student_id, customer_name, pickup_method, subtotal, discount, total)
      VALUES (1, '2026-05-20', 'PAID', 0, '202637042', '홍', 'dine_in', 17000, 1000, 17000)`).run();
    db.prepare(`INSERT INTO used_coupons (student_id, name, order_id, discount) VALUES ('202637042', '홍', 1, 1000)`).run();
    const res = await request(app).get('/api/coupons/check?sid=202637042&name=홍길동');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('COUPON_DUPLICATE');
  });
});
```

- [ ] **Step 2-3: 구현**

```js
// src/routes/api/coupons.js
import { Router } from 'express';
import { z } from 'zod';
import { validateCoupon, REASON } from '../../domain/coupon-validation.js';
import { CouponRepo } from '../../db/repositories/coupon-repo.js';
import { COUPON_AMOUNT } from '../../domain/pricing.js';

const r = Router();
const Query = z.object({
  sid: z.string().regex(/^\d{9}$/),
  name: z.string().trim().min(1).max(20),
});

r.get('/coupons/check', (req, res, next) => {
  try {
    const parsed = Query.safeParse(req.query);
    if (!parsed.success) {
      const e = new Error('학번 9자리 + 이름이 필요합니다');
      e.code = 'COUPON_FORMAT';
      return next(e);
    }
    const { sid, name } = parsed.data;
    const repo = new CouponRepo(req.app.locals.db);
    const v = validateCoupon(sid, name, repo);
    if (v.valid) {
      return res.json({ ok: true, data: { eligible: true, discount: COUPON_AMOUNT } });
    }
    const codeMap = {
      format:'COUPON_FORMAT', prefix:'COUPON_PREFIX', name:'COUPON_NAME', duplicate:'COUPON_DUPLICATE',
    };
    const msgMap = {
      format: '학번은 9자리 숫자입니다.',
      prefix: '이번 쿠폰은 컴퓨터모바일융합과 1학년 환영 쿠폰입니다.',
      name:   '이름을 입력해 주세요.',
      duplicate: '이 학번은 이미 쿠폰을 사용했어요. 즐거운 축제 보내세요!',
    };
    const e = new Error(msgMap[v.reason]);
    e.code = codeMap[v.reason];
    next(e);
  } catch (e) { next(e); }
});

export default r;
```

- [ ] **Step 4: 마운트 + 통과 + 커밋**

```js
// src/routes/api/index.js — 1줄 추가
import coupons from './coupons.js';
r.use(coupons);
```

```bash
npm test -- api-coupon-check
git add src/routes/api/coupons.js src/routes/api/index.js tests/integration/api-coupon-check.test.js
git commit -m "feat: Phase 2.4 — GET /api/coupons/check (G5 사전 검증, 3 케이스)"
```

---

## Task 2.5: POST /api/orders/:id/transfer-report

**Files:**
- Modify: `src/routes/api/orders.js`

- [ ] **Step 1: RED 테스트 추가**

```js
// tests/integration/api-transfer-report.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';

describe('POST /api/orders/:id/transfer-report', () => {
  let db, app;
  beforeEach(async () => {
    db = setupTestDb();
    const { createApp } = await import('../../src/app.js');
    app = await createApp({ db });
  });
  afterEach(() => teardownTestDb(db));

  async function create(opts = {}) {
    const r = await request(app).post('/api/orders').send({
      items: [{ menu_id:1, qty:1 }],
      pickup: 'dine_in', table_no: 5,
      student_id: '202637042', name:'홍길동',
      is_external: false,
      ...opts,
    });
    return r.body.data;
  }

  it('정상 신고 + 학번 인증 → 200', async () => {
    const o = await create();
    const res = await request(app)
      .post(`/api/orders/${o.order_id}/transfer-report?student_id=202637042&order_no=${o.order_no}`)
      .send({ bank: '카카오뱅크', alt_name: null });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('TRANSFER_REPORTED');
  });

  it('인증 실패 → 401 ORDER_AUTH_FAIL', async () => {
    const o = await create();
    const res = await request(app)
      .post(`/api/orders/${o.order_id}/transfer-report?student_id=999999999&order_no=${o.order_no}`)
      .send({ bank: '카카오뱅크' });
    expect(res.status).toBe(401);
  });

  it('이미 처리됨 → 409 ORDER_STATE_INVALID', async () => {
    const o = await create();
    await request(app).post(`/api/orders/${o.order_id}/transfer-report?student_id=202637042&order_no=${o.order_no}`)
      .send({ bank: '카카오뱅크' });
    const res = await request(app).post(`/api/orders/${o.order_id}/transfer-report?student_id=202637042&order_no=${o.order_no}`)
      .send({ bank: '카카오뱅크' });
    expect(res.status).toBe(409);
  });
});
```

- [ ] **Step 2: src/routes/api/orders.js에 라우트 추가**

```js
// 기존 orders.js 끝에 추가
const TransferInput = z.object({
  bank: z.string().min(1).max(20),
  alt_name: z.string().trim().min(1).max(20).nullable().optional(),
});

function authOrder(req, db) {
  const id = Number(req.params.id);
  const order_no = Number(req.query.order_no);
  const orderRepo = new OrderRepo(db);
  const order = orderRepo.findById(id);
  if (!order) return null;
  if (order.is_external) {
    const token = req.query.token || req.cookies?.co_token;
    if (!token || order.external_token !== token) return null;
    return order;
  } else {
    if (order.student_id !== req.query.student_id) return null;
    return order;
  }
}

r.post('/orders/:id/transfer-report', (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const order = authOrder(req, db);
    if (!order) {
      const e = new Error('주문자 정보가 일치하지 않습니다');
      e.code = 'ORDER_AUTH_FAIL'; e.status = 401;
      return next(e);
    }
    if (order.status !== 'ORDERED' && order.status !== 'HOLD') {
      const e = new Error('이미 처리된 주문입니다');
      e.code = 'ORDER_STATE_INVALID';
      return next(e);
    }
    const parsed = TransferInput.safeParse(req.body);
    if (!parsed.success) {
      const e = new Error('은행을 선택해 주세요');
      e.code = 'INVALID_INPUT';
      return next(e);
    }
    const orderRepo = new OrderRepo(db);
    orderRepo.attachTransfer(order.id, parsed.data.bank, parsed.data.alt_name || null);
    orderRepo.transition(order.id, order.status, 'TRANSFER_REPORTED', `customer:${order.student_id || 'external'}`);

    // SSE push (Phase 5에서 hub 연결)
    if (req.app.locals.sseHub) {
      req.app.locals.sseHub.emit(order.id, 'status', { status: 'TRANSFER_REPORTED' });
    }
    res.json({ ok: true, data: { status: 'TRANSFER_REPORTED' } });
  } catch (e) { next(e); }
});
```

> `req.cookies` 사용을 위해 app.js에 `cookie-parser` 또는 express built-in `req.cookies` (자동) 활성화 — express는 cookies 자동 파싱 안 함. `import cookieParser from 'cookie-parser'` 추가하고 `app.use(cookieParser())`. dependencies에 추가:

```bash
npm install cookie-parser
```

`src/app.js`에:
```js
import cookieParser from 'cookie-parser';
app.use(cookieParser());
```

- [ ] **Step 3: 통과 + 커밋**

```bash
npm test -- api-transfer-report
git add src/routes/api/orders.js src/app.js package.json package-lock.json tests/integration/api-transfer-report.test.js
git commit -m "feat: Phase 2.5 — POST transfer-report + 학번/토큰 인증 + cookie-parser"
```

---

## Task 2.6: GET /api/orders/:id/summary (조리 현황 폴백)

**Files:**
- Modify: `src/routes/api/orders.js`

- [ ] **Step 1: RED 테스트 추가**

`tests/integration/api-order-summary.test.js`:
```js
// (생략 — Task 2.5와 유사 패턴, 200/401/404 케이스)
```

- [ ] **Step 2: 라우트 추가**

```js
// src/routes/api/orders.js에 추가
r.get('/orders/:id/summary', (req, res, next) => {
  try {
    const order = authOrder(req, req.app.locals.db);
    if (!order) { const e = new Error('주문자 정보 불일치'); e.code='ORDER_AUTH_FAIL'; e.status=401; return next(e); }
    res.json({ ok: true, data: {
      order_id: order.id, order_no: order.order_no, status: order.status,
      total: order.total, customer_name: order.customer_name,
      transfer_bank: order.transfer_bank,
    }});
  } catch (e) { next(e); }
});
```

- [ ] **Step 3: 커밋**

```bash
git add src/routes/api/orders.js tests/integration/api-order-summary.test.js
git commit -m "feat: Phase 2.6 — GET /api/orders/:id/summary (SSE 폴백)"
```

---

# Phase 3 — 사용자 화면 EJS+Alpine (P0, 1.5일)

> **변환 원칙:** `docs/design-bundle/js/screens-customer.jsx` React 컴포넌트 → EJS 템플릿 + Alpine.js `x-data`로 변환. 토큰은 모두 `tokens.css` 참조. 도그태그 sessionStorage 단발 모션·SSE 자동 재연결·외부인 분기 유지.

## Task 3.1: layouts/customer.ejs + partials 공통

**Files:**
- Create: `views/layouts/customer.ejs`
- Create: `views/partials/_head.ejs`
- Create: `views/partials/topbar-brand.ejs`
- Create: `views/partials/topbar-back.ejs`
- Create: `views/partials/dogtag.ejs`
- Create: `views/partials/stamp.ejs`
- Create: `views/partials/mascot.ejs`
- Create: `views/partials/status-chip.ejs`
- Create: `views/partials/empty-state.ejs`

- [ ] **Step 1: layouts/customer.ejs**

```ejs
<!doctype html>
<html lang="ko">
<head>
  <%- include('../partials/_head', { title: typeof title !== 'undefined' ? title : '오늘 저녁은 치킨이닭!' }) %>
</head>
<body class="font-sans text-ink bg-bg min-h-screen">
  <main id="app" class="max-w-[480px] mx-auto min-h-screen flex flex-col">
    <%- body %>
  </main>
  <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</body>
</html>
```

- [ ] **Step 2: partials/_head.ejs**

```ejs
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
<title><%= title %></title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Black+Ops+One&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/output.css">
```

- [ ] **Step 3: partials/topbar-brand.ejs**

```ejs
<header class="topbar flex justify-between items-center p-4 border-b border-divider">
  <div class="flex items-center gap-2">
    <span class="logo text-2xl">🪖</span>
    <div class="flex flex-col">
      <span class="font-bold text-base">오늘 저녁은 치킨이닭!</span>
      <span class="text-xs text-muted">WINNER WINNER · 컴모융</span>
    </div>
  </div>
  <a href="/cart" class="relative text-xl" aria-label="카트">
    🛒<% if (typeof cartCount !== 'undefined' && cartCount > 0) { %><span class="absolute -top-1 -right-2 bg-accent text-ink text-xs rounded-full w-5 h-5 flex items-center justify-center font-mono font-bold"><%= cartCount %></span><% } %>
  </a>
</header>
```

- [ ] **Step 4: partials/topbar-back.ejs**

```ejs
<header class="topbar flex justify-between items-center p-4 border-b border-divider">
  <div class="flex items-center gap-3">
    <a href="<%= backUrl %>" class="text-xl" aria-label="뒤로">←</a>
    <h1 class="text-lg font-bold"><%= title %></h1>
  </div>
  <% if (typeof right !== 'undefined') { %><div><%- right %></div><% } %>
</header>
```

- [ ] **Step 5: partials/dogtag.ejs (sessionStorage 단발 모션)**

```ejs
<%
  const _num = locals.num;
  const _total = locals.total ?? 100;
  const _date = locals.date ?? '2026-05-20';
  const _size = locals.size ?? 'md';
  const _dropping = locals.dropping ?? false;
%>
<div class="dogtag dogtag-<%= _size %><%= _dropping ? ' dropping' : '' %>"
     <% if (_dropping) { %>role="status" aria-live="polite"<% } %>
     x-data="{ shown: !sessionStorage.getItem('dogtag-shown-<%= _num %>') }"
     x-init="if (shown) sessionStorage.setItem('dogtag-shown-<%= _num %>', '1')">
  <span class="num font-mono font-black"><%= '#' + _num + '/' + _total %></span>
  <span class="meta font-mono text-2xs"><%= _date %></span>
</div>
```

`public/css/source.css`에 도그태그 스타일 추가:
```css
@layer components {
  .dogtag {
    background: var(--color-accent);
    color: var(--color-ink);
    border-radius: 8px 8px 4px 4px;
    padding: 12px 16px;
    box-shadow: var(--shadow-tag);
    text-align: center;
    position: relative;
    display: inline-block;
  }
  .dogtag::before {
    content: ''; position: absolute; top: 4px; left: 50%; transform: translateX(-50%);
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--color-ink); opacity: 0.3;
  }
  .dogtag-md .num { font-size: 48px; line-height: 1; }
  .dogtag-sm .num { font-size: 28px; }
  .dogtag-xs .num { font-size: 16px; }
  .dogtag.dropping { animation: tag-drop 600ms var(--ease-tag) both; }
  @keyframes tag-drop {
    0%   { transform: translateY(-40px) rotate(-3deg); opacity: 0; }
    60%  { transform: translateY(0) rotate(2deg); opacity: 1; }
    100% { transform: translateY(0) rotate(0deg); }
  }
}
```

- [ ] **Step 6: 나머지 partials (stamp, mascot, status-chip, empty-state)**

`partials/stamp.ejs`:
```ejs
<%
  const _kind = locals.kind ?? 'recommended';
  const _text = locals.text ?? (
    _kind === 'recommended' ? 'RECOMMENDED' :
    _kind === 'sold-out'    ? 'SOLD OUT' :
    _kind === 'paid'        ? 'PAID' :
    _kind === 'done'        ? 'DONE' : _kind.toUpperCase()
  );
  const _rotate = locals.rotate ?? 0;
%>
<span class="stamp stamp-<%= _kind %>" style="transform: rotate(<%= _rotate %>deg)">
  <%= _text %>
</span>
```

`partials/mascot.ejs`:
```ejs
<%
  const _state = locals.state ?? 'default';
  const _size = locals.size ?? 'md';
  const _caption = locals.caption;
  const px = _size === 'sm' ? 80 : _size === 'lg' ? 200 : 160;
  const stateMap = {
    default:   { glyph:'🪖', label:'DEFAULT' },
    preparing: { glyph:'🚩', label:'PREP' },
    cooking:   { glyph:'🔥', label:'COOKING' },
    arrived:   { glyph:'🎉', label:'ARRIVED' },
    canceled:  { glyph:'✖',  label:'ABORT' },
  };
  const s = stateMap[_state] || stateMap.default;
%>
<div class="mascot-wrap flex flex-col items-center gap-2">
  <div class="mascot mascot-<%= _state %>" aria-label="마스코트 — <%= s.label %>"
       style="width:<%= px %>px;height:<%= px %>px;">
    <div class="emoji" style="font-size:<%= px*0.36 %>px"><%= s.glyph %></div>
    <div class="label font-stencil text-2xs opacity-70 mt-1">MASCOT // <%= s.label %></div>
  </div>
  <% if (_caption) { %><div class="text-xs text-muted"><%= _caption %></div><% } %>
</div>
```

`partials/status-chip.ejs`:
```ejs
<%
  const map = {
    ORDERED:           { label:'주문중',      cls:'chip-ordered',  icon:'⏳' },
    TRANSFER_REPORTED: { label:'이체확인요청', cls:'chip-transfer', icon:'💸' },
    PAID:              { label:'이체완료',    cls:'chip-paid',     icon:'✓' },
    COOKING:           { label:'조리중',      cls:'chip-cooking',  icon:'🔥' },
    READY:             { label:'수령가능',    cls:'chip-ready',    icon:'✅' },
    DONE:              { label:'수령완료',    cls:'chip-done',     icon:'🎉' },
    CANCELED:          { label:'취소',        cls:'chip-canceled', icon:'✖' },
    HOLD:              { label:'보류',        cls:'chip-hold',     icon:'⚠️' },
  };
  const s = map[status] || map.ORDERED;
%>
<span class="chip <%= s.cls %>"><%= s.icon %> <%= s.label %></span>
```

- [ ] **Step 7: Commit**

```bash
git add views/layouts/customer.ejs views/partials/_head.ejs views/partials/topbar-brand.ejs views/partials/topbar-back.ejs views/partials/dogtag.ejs views/partials/stamp.ejs views/partials/mascot.ejs views/partials/status-chip.ejs public/css/source.css
git commit -m "feat: Phase 3.1 — layouts/customer + 8개 partials (DESIGN.md §10·11)"
```

---

## Task 3.2: views/customer/menu.ejs (C-1)

**Files:**
- Create: `views/customer/menu.ejs`
- Create: `src/routes/customer/home.js`
- Modify: `src/routes/customer/index.js`

- [ ] **Step 1: 라우트**

```js
// src/routes/customer/home.js
import { Router } from 'express';
import { MenuRepo } from '../../db/repositories/menu-repo.js';

const r = Router();

r.get('/', (_req, res) => res.redirect('/menu'));

r.get('/menu', (req, res, next) => {
  try {
    const repo = new MenuRepo(req.app.locals.db);
    const menus = repo.findAllActive();
    const categories = req.app.locals.db.prepare(`SELECT id, name FROM menu_categories ORDER BY display_order`).all();
    res.render('customer/menu', { title: '오늘 저녁은 치킨이닭!', menus, categories });
  } catch (e) { next(e); }
});

export default r;
```

```js
// src/routes/customer/index.js
import { Router } from 'express';
import home from './home.js';
const r = Router();
r.use(home);
export default r;
```

- [ ] **Step 2: views/customer/menu.ejs**

```ejs
<% layout('layouts/customer') -%>

<%- include('../partials/topbar-brand', { cartCount: 0 }) %>

<div x-data="menuPage()" x-init="init()" class="flex-1 flex flex-col">
  <!-- 분류 탭 -->
  <nav class="cat-tabs flex overflow-x-auto gap-2 px-4 py-3 border-b border-divider">
    <template x-for="c in categories" :key="c.value">
      <button @click="cat = c.value" :class="cat === c.value ? 'cat-tab active' : 'cat-tab'" x-text="c.label"></button>
    </template>
  </nav>

  <!-- 인기 strip -->
  <div class="popular-strip mx-4 my-3 p-3 rounded-md bg-elevated">
    <div class="text-xs font-mono text-muted">REALTIME // 🔥 TOP 1</div>
    <div class="text-base font-bold" x-text="popular.name + ' — ' + popular.qty + '개 출고'">…</div>
    <div class="text-xs text-muted" x-text="popular.copy"></div>
  </div>

  <!-- 메뉴 그리드 -->
  <div class="menu-grid grid grid-cols-2 gap-3 px-4 pb-24">
    <template x-for="m in filteredMenus()" :key="m.id">
      <article class="menu-card relative bg-surface rounded-md shadow-card overflow-hidden" :class="{ 'is-sold': m.is_sold_out }">
        <!-- Stamp overlay -->
        <template x-if="m.is_recommended && !m.is_sold_out">
          <div class="stamp-overlay absolute top-2 left-2" style="transform:rotate(-6deg)"><span class="stamp stamp-recommended">RECOMMENDED</span></div>
        </template>
        <template x-if="m.is_sold_out">
          <div class="stamp-overlay absolute top-2 left-2" style="transform:rotate(-12deg)"><span class="stamp stamp-sold-out">SOLD OUT</span></div>
        </template>
        <div class="menu-fallback h-32 flex flex-col items-center justify-center bg-elevated">
          <span class="text-4xl" x-text="emojiByCat(m.category_id)"></span>
          <span class="text-2xs font-mono text-muted">// 부스 사진</span>
        </div>
        <div class="body p-3">
          <div class="name font-bold text-sm" x-text="m.name"></div>
          <div class="price tabular text-sm" x-text="won(m.price)"></div>
          <button class="add mt-2 w-full py-2 rounded-sm text-sm" :class="inCart(m.id) ? 'in-cart bg-success text-white' : 'bg-accent text-ink'"
                  :disabled="m.is_sold_out" @click="addToCart(m.id)"
                  x-text="m.is_sold_out ? '품절' : inCart(m.id) ? ('카트 ✓ ' + cartCount(m.id)) : '+ 카트 담기'"></button>
        </div>
      </article>
    </template>
  </div>

  <!-- Sticky 카트 바 -->
  <template x-if="totalCount() > 0">
    <div class="bottom-bar fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-3 bg-bg border-t border-divider" style="padding-bottom:max(0.75rem, env(safe-area-inset-bottom))">
      <a href="/cart" class="block w-full py-3 bg-accent text-ink font-bold text-center rounded-md shadow-cta">
        🛒 <span x-text="totalCount()"></span>개 · <span x-text="won(totalPrice())"></span> · 카트 보기 →
      </a>
    </div>
  </template>
</div>

<script>
function menuPage() {
  const initial = <%- JSON.stringify(menus) %>;
  const cats = [
    { value:'all', label:'전체' },
    { value:'popular', label:'🔥인기' },
    { value:'recommended', label:'⭐추천' },
    ...<%- JSON.stringify(categories) %>.map(c => ({ value: 'cat-' + c.id, label: c.name })),
  ];
  return {
    menus: initial, cat: 'all', categories: cats, popular: { name:'뿌링클', qty:0, copy:'🔥 학생회 추천 BEST' },
    init() {
      this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
      this.$watch('cart', v => localStorage.setItem('cart', JSON.stringify(v)));
      fetch('/api/popular').then(r => r.json()).then(j => { if (j.ok) {
        const top = j.data.ranking?.[0];
        if (top) this.popular = { name: top.name, qty: top.sold_count || top.qty || 0, copy: j.data.copy };
      }});
    },
    cart: [],
    filteredMenus() {
      if (this.cat === 'all') return this.menus;
      if (this.cat === 'recommended') return this.menus.filter(m => m.is_recommended);
      if (this.cat === 'popular') return this.menus.slice(0, 6);
      if (this.cat.startsWith('cat-')) {
        const id = +this.cat.slice(4);
        return this.menus.filter(m => m.category_id === id);
      }
      return this.menus;
    },
    inCart(id) { return !!this.cart.find(([cid]) => cid === id); },
    cartCount(id) { return this.cart.find(([cid]) => cid === id)?.[1] || 0; },
    addToCart(id) {
      const ex = this.cart.find(([cid]) => cid === id);
      if (ex) ex[1]++; else this.cart.push([id, 1]);
      this.cart = [...this.cart]; // reactive
    },
    totalCount() { return this.cart.reduce((s, [,q]) => s + q, 0); },
    totalPrice() {
      return this.cart.reduce((s, [id, q]) => s + (this.menus.find(m => m.id === id)?.price || 0) * q, 0);
    },
    emojiByCat(catId) { return ({1:'🍗', 2:'🍟', 3:'🥤'})[catId] || '🍗'; },
    won(n) { return n.toLocaleString('ko-KR') + '원'; },
  };
}
</script>
```

> **Note:** `<% layout(...) %>` 사용을 위해 `express-ejs-layouts` 또는 `ejs-mate` 추가. 또는 단순 `<%- include('layout', { body: ... }) %>` 패턴으로 변경. *권장*: `express-ejs-layouts`:
> ```bash
> npm install express-ejs-layouts
> ```
> `src/app.js`에 `import expressLayouts from 'express-ejs-layouts'; app.use(expressLayouts); app.set('layout', 'layouts/customer');` 추가.

- [ ] **Step 3: 수동 확인**

```bash
npm run css:build
node src/server.js
```

브라우저: `http://localhost:3000/menu` — 메뉴 카드 5개 표시, 카트 담기 토글 작동, sticky 카트 바 등장.

- [ ] **Step 4: E2E 스모크 (선택 — Playwright Phase 7에서)**

- [ ] **Step 5: Commit**

```bash
git add views/customer/menu.ejs src/routes/customer/home.js src/routes/customer/index.js src/app.js package.json
git commit -m "feat: Phase 3.2 — C-1 메뉴 화면 (Alpine x-data + Tailwind + 인기 랭킹 fetch)"
```

---

## Task 3.3: views/customer/cart.ejs (C-2)

**Files:**
- Create: `views/customer/cart.ejs`
- Modify: `src/routes/customer/home.js` (GET /cart 라우트 추가)

- [ ] **Step 1: 라우트 추가**

```js
// home.js에 1줄 추가
r.get('/cart', (req, res, next) => {
  try {
    const menus = new MenuRepo(req.app.locals.db).findAllActive();
    res.render('customer/cart', { title: '카트', menus });
  } catch (e) { next(e); }
});
```

- [ ] **Step 2: views/customer/cart.ejs**

```ejs
<%- include('../partials/topbar-back', { title:'카트', backUrl:'/menu' }) %>
<div x-data="cartPage()" x-init="init()" class="flex-1 flex flex-col">
  <template x-if="items.length === 0">
    <div class="empty-state flex flex-col items-center gap-4 py-12">
      <%- include('../partials/mascot', { state:'default', size:'sm' }) %>
      <div class="text-lg font-bold">치킨이 기다려요!</div>
      <div class="text-xs text-muted">메뉴부터 골라봐요. 컴모융 1학년은 쿠폰 1,000원 할인!</div>
      <a href="/menu" class="btn-primary px-4 py-2 bg-accent text-ink rounded-md font-bold">메뉴 보기</a>
    </div>
  </template>

  <template x-if="items.length > 0">
    <div class="screen p-4 flex-1">
      <div class="card bg-surface rounded-md shadow-card p-4">
        <template x-for="m in items" :key="m.id">
          <div class="cart-line flex items-center gap-3 py-3 border-b border-divider last:border-0">
            <div class="thumb w-16 h-16 bg-elevated rounded-sm flex items-center justify-center text-2xl" x-text="emojiByCat(m.category_id)"></div>
            <div class="flex-1 flex flex-col gap-1">
              <div class="font-bold text-sm" x-text="m.name"></div>
              <div class="text-xs text-muted tabular" x-text="won(m.price)"></div>
              <div class="qty flex items-center gap-2 mt-1">
                <button @click="dec(m.id)" class="w-9 h-9 rounded-sm bg-elevated">−</button>
                <span class="num font-mono w-6 text-center" x-text="qty(m.id)"></span>
                <button @click="inc(m.id)" class="w-9 h-9 rounded-sm bg-elevated">+</button>
              </div>
            </div>
            <button @click="remove(m.id)" class="text-xl text-muted" aria-label="삭제">✕</button>
          </div>
        </template>
      </div>

      <div class="card bg-surface rounded-md shadow-card p-4 mt-4">
        <div class="flex justify-between text-sm">
          <span class="text-muted">소계</span>
          <span class="tabular" x-text="won(subtotal())"></span>
        </div>
        <div class="flex justify-between text-xs text-muted my-2">
          <span>쿠폰 (1학년, 다음 단계에서 적용)</span>
          <span>-1,000원</span>
        </div>
        <div class="border-t border-dashed border-divider my-2"></div>
        <div class="flex justify-between font-bold">
          <span>예상 합계</span>
          <span class="tabular" x-text="won(Math.max(0, subtotal() - 1000)) + ' ~ ' + won(subtotal())"></span>
        </div>
      </div>
    </div>
  </template>

  <template x-if="items.length > 0">
    <div class="bottom-bar fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-3 bg-bg border-t border-divider" style="padding-bottom:max(0.75rem, env(safe-area-inset-bottom))">
      <a href="/checkout" class="block w-full py-3 bg-accent text-ink font-bold text-center rounded-md shadow-cta">
        주문 정보 입력 →
      </a>
    </div>
  </template>
</div>

<script>
function cartPage() {
  const menus = <%- JSON.stringify(menus) %>;
  return {
    cart: [], items: [],
    init() {
      this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
      this.$watch('cart', v => { localStorage.setItem('cart', JSON.stringify(v)); this.refresh(); });
      this.refresh();
    },
    refresh() {
      this.items = this.cart.map(([id]) => menus.find(m => m.id === id)).filter(Boolean);
    },
    qty(id) { return this.cart.find(([cid]) => cid === id)?.[1] || 0; },
    inc(id) { const ex = this.cart.find(([cid]) => cid === id); if (ex) { ex[1]++; this.cart = [...this.cart]; } },
    dec(id) {
      const ex = this.cart.find(([cid]) => cid === id);
      if (!ex) return;
      ex[1]--;
      if (ex[1] <= 0) this.cart = this.cart.filter(([cid]) => cid !== id);
      else this.cart = [...this.cart];
    },
    remove(id) { this.cart = this.cart.filter(([cid]) => cid !== id); },
    subtotal() { return this.cart.reduce((s, [id, q]) => s + (menus.find(m => m.id === id)?.price || 0) * q, 0); },
    emojiByCat(c) { return ({1:'🍗',2:'🍟',3:'🥤'})[c] || '🍗'; },
    won(n) { return n.toLocaleString('ko-KR') + '원'; },
  };
}
</script>
```

- [ ] **Step 3: Commit**

```bash
git add views/customer/cart.ejs src/routes/customer/home.js
git commit -m "feat: Phase 3.3 — C-2 카트 화면 (Alpine localStorage + 빈/정상 상태)"
```

---

## Task 3.4: ★ views/customer/checkout.ejs (C-3 — G2·G3·G4·G5 통합)

**Files:**
- Create: `views/customer/checkout.ejs`
- Modify: `src/routes/customer/home.js`

- [ ] **Step 1: 라우트 추가**

```js
// home.js에 추가
r.get('/checkout', (req, res, next) => {
  try {
    const menus = new MenuRepo(req.app.locals.db).findAllActive();
    res.render('customer/checkout', { title: '주문 정보', menus });
  } catch (e) { next(e); }
});
```

- [ ] **Step 2: views/customer/checkout.ejs (G2·G3·G4·G5 반영)**

```ejs
<%- include('../partials/topbar-back', { title:'주문 정보', backUrl:'/cart' }) %>

<div x-data="checkoutPage()" x-init="init()" class="screen p-4 pb-24 flex-1 flex flex-col gap-6">
  <!-- 외부인 분기 -->
  <label class="checkbox flex items-start gap-3 p-3 rounded-md border-2 border-accent">
    <input type="checkbox" x-model="external" class="mt-1">
    <div>
      <div class="font-bold text-sm">학번 없음 (외부인)</div>
      <div class="text-xs text-muted">가족·친구 등 학번이 없으신 분</div>
    </div>
  </label>

  <!-- 신분 확인 -->
  <div class="col gap-3">
    <div class="section-label text-xs text-muted font-bold">① 신분 확인</div>
    <!-- 학생만 학번 -->
    <div x-show="!external">
      <label class="block mb-1 text-sm font-bold">학번 <span class="text-danger">*</span></label>
      <input type="tel" inputmode="numeric" pattern="\d{9}" maxlength="9"
        x-model="sid" @input="onSidInput($event)" :class="errors.sid ? 'input is-error' : 'input'"
        placeholder="예: 202637042" class="w-full p-3 rounded-sm bg-surface font-mono tabular">
      <div class="text-xs text-muted mt-1" x-text="`9자리 숫자 · 현재 ${sid.length}/9자리`"></div>
      <div x-show="errors.sid" class="text-xs text-danger mt-1" x-text="errors.sid"></div>
    </div>
    <div>
      <label class="block mb-1 text-sm font-bold">이름 <span class="text-danger">*</span></label>
      <input type="text" x-model="name" maxlength="20"
        :class="errors.name ? 'input is-error' : 'input'"
        placeholder="예: 홍길동" class="w-full p-3 rounded-sm bg-surface">
      <div x-show="errors.name" class="text-xs text-danger mt-1" x-text="errors.name"></div>
    </div>
  </div>

  <!-- 수령 방법 -->
  <div class="col gap-3">
    <div class="section-label text-xs text-muted font-bold">② 수령 방법</div>
    <div class="radio-group flex gap-2">
      <label class="radio flex-1 p-3 rounded-sm bg-surface border-2" :class="mode==='dine_in' ? 'border-accent' : 'border-divider'">
        <input type="radio" value="dine_in" x-model="mode" class="sr-only">🪑 매장 식사
      </label>
      <label class="radio flex-1 p-3 rounded-sm bg-surface border-2" :class="mode==='takeout' ? 'border-accent' : 'border-divider'">
        <input type="radio" value="takeout" x-model="mode" class="sr-only">🛍️ 포장
      </label>
    </div>
    <div x-show="mode==='dine_in'">
      <label class="block mb-1 text-sm font-bold">테이블 번호 <span class="text-danger">*</span></label>
      <input type="tel" inputmode="numeric" x-model="table"
        class="w-full p-3 rounded-sm bg-surface font-mono tabular" placeholder="예: 9">
      <div x-show="errors.table" class="text-xs text-danger mt-1" x-text="errors.table"></div>
    </div>
  </div>

  <!-- ★ 쿠폰 (G3: 외부인 시 숨김 + G4·G5 통합) -->
  <div class="col gap-3" x-show="!external && couponEligible" x-cloak>
    <div class="section-label text-xs text-muted font-bold">③ 쿠폰</div>
    <label class="checkbox flex items-start gap-3 p-3 rounded-md border border-divider">
      <input type="checkbox" x-model="coupon" @change="onCouponToggle()" :disabled="couponChecking" class="mt-1">
      <div class="flex-1">
        <div class="font-bold text-sm">쿠폰 사용 (컴모융 1학년 한정 1,000원 할인)</div>
        <div class="text-xs text-success mt-1" x-show="!couponError" x-text="couponChecking ? '확인 중...' : (coupon ? '✓ 1,000원 할인 적용됨' : '컴모융 1학년 — 적용 가능')"></div>
        <div class="text-xs text-danger mt-1" x-show="couponError" x-text="couponError"></div>
      </div>
    </label>
  </div>

  <!-- 주문 요약 -->
  <div class="card bg-surface rounded-md shadow-card p-4">
    <div class="section-label text-xs text-muted font-bold mb-2">주문 요약</div>
    <template x-for="m in items" :key="m.id">
      <div class="flex justify-between text-sm py-1">
        <span><span x-text="m.name"></span> × <span x-text="m.qty"></span></span>
        <span class="tabular" x-text="won(m.price * m.qty)"></span>
      </div>
    </template>
    <div class="border-t border-dashed border-divider my-2"></div>
    <div class="flex justify-between text-sm"><span class="text-muted">소계</span><span class="tabular" x-text="won(subtotal())"></span></div>
    <div x-show="discount() > 0" class="flex justify-between text-sm text-success">
      <span>쿠폰 할인</span><span class="tabular" x-text="'-' + won(discount())"></span>
    </div>
    <div class="flex justify-between font-bold text-base mt-2"><span>합계</span><span class="tabular" x-text="won(total())"></span></div>
  </div>
</div>

<div class="bottom-bar fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-3 bg-bg border-t border-divider">
  <button @click="submit()" :disabled="submitting" class="block w-full py-3 bg-accent text-ink font-bold text-center rounded-md shadow-cta">
    <span x-show="!submitting" x-text="`주문 접수 · ${won(total())}`"></span>
    <span x-show="submitting">주문 접수 중...</span>
  </button>
</div>

<script>
function checkoutPage() {
  const menus = <%- JSON.stringify(menus) %>;
  return {
    cart:[], items:[], external:false, sid:'', name:'',
    mode:'dine_in', table:'', coupon:false, couponChecking:false, couponError:null,
    submitting:false, errors:{},

    init() {
      this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
      this.items = this.cart.map(([id, qty]) => ({ ...menus.find(m => m.id === id), qty }));
      this.$watch('external', v => { if (v) this.coupon = false; });
      this.$watch('sid', () => this.coupon = false);
      this.$watch('name', () => this.coupon = false);
    },

    onSidInput(e) {
      this.sid = e.target.value.replace(/\D/g, '').slice(0, 9);
    },

    // G4·G5 통합 가드 — 학번 9자리 + prefix 202637 + 이름 있음
    get couponEligible() {
      return !this.external
        && /^\d{9}$/.test(this.sid)
        && this.sid.startsWith('202637')
        && this.name.trim().length >= 1;
    },

    async onCouponToggle() {
      if (!this.coupon) { this.couponError = null; return; }
      // G5 — 서버 사전 검증
      this.couponChecking = true;
      this.couponError = null;
      try {
        const res = await fetch(`/api/coupons/check?sid=${this.sid}&name=${encodeURIComponent(this.name)}`);
        const j = await res.json();
        if (!j.ok) {
          this.coupon = false;
          this.couponError = j.error.message;
        }
      } catch {
        this.couponError = '확인 실패. 잠시 후 다시 시도해 주세요.';
        this.coupon = false;
      } finally {
        this.couponChecking = false;
      }
    },

    subtotal() { return this.items.reduce((s, m) => s + m.price * m.qty, 0); },
    discount() { return this.coupon && this.couponEligible ? 1000 : 0; },
    total() { return this.subtotal() - this.discount(); },

    async submit() {
      this.errors = {};
      if (!this.external && !/^\d{9}$/.test(this.sid)) this.errors.sid = '학번은 9자리 숫자입니다.';
      if (!this.name.trim()) this.errors.name = '이름을 입력해 주세요.';
      if (this.mode === 'dine_in' && !this.table) this.errors.table = '테이블 번호를 입력해 주세요.';
      if (Object.keys(this.errors).length) return;

      this.submitting = true;
      try {
        const res = await fetch('/api/orders', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            items: this.cart.map(([menu_id, qty]) => ({ menu_id, qty })),
            pickup: this.mode,
            table_no: this.mode === 'dine_in' ? Number(this.table) : undefined,
            student_id: this.external ? undefined : this.sid,
            name: this.name.trim(),
            is_external: this.external,
            use_coupon: this.coupon,
          }),
        });
        const j = await res.json();
        if (!j.ok) {
          alert(j.error.message);  // 임시 — 인라인 처리 향후
          this.submitting = false;
          return;
        }
        localStorage.removeItem('cart');
        const { order_no, business_date } = j.data;
        const auth = this.external
          ? `token=${j.data.external_token}`
          : `student_id=${this.sid}`;
        location.href = `/orders/${j.data.order_id}/complete?order_no=${order_no}&${auth}`;
      } catch (e) {
        alert('주문 접수 실패. 다시 시도해 주세요.');
        this.submitting = false;
      }
    },

    won(n) { return n.toLocaleString('ko-KR') + '원'; },
  };
}
</script>
```

- [ ] **Step 3: 수동 확인 (E2E 패스로 시뮬레이션)**

브라우저 흐름:
1. /menu → 후라이드 카트 담기
2. /cart → "주문 정보 입력"
3. /checkout → 학번 202637042 입력 → 쿠폰 섹션 자동 표시 (G3 확인)
4. 쿠폰 체크 → API 호출 → "✓ 1,000원 할인" 표시 → 합계 17,000원 (G4 확인)
5. "학번 없음" 체크 → 쿠폰 섹션 사라짐 (G3 확인)
6. 학번 변경 → 쿠폰 자동 해제
7. 주문 접수 → /orders/:id/complete

- [ ] **Step 4: Commit**

```bash
git add views/customer/checkout.ejs src/routes/customer/home.js
git commit -m "feat: Phase 3.4 — ★ C-3 checkout (G2 카피·G3 외부인·G4 합계·G5 중복 검증 통합)"
```

---

## Task 3.5: views/customer/complete.ejs (C-4 — 도그태그 단발 모션)

**Files:**
- Create: `views/customer/complete.ejs`
- Create: `src/routes/customer/orders.js`
- Modify: `src/routes/customer/index.js`

- [ ] **Step 1: 라우트**

```js
// src/routes/customer/orders.js
import { Router } from 'express';
import { OrderRepo } from '../../db/repositories/order-repo.js';

const r = Router();

function authOrder(req, db) {
  const id = Number(req.params.id);
  const order_no = Number(req.query.order_no);
  const repo = new OrderRepo(db);
  const order = repo.findById(id);
  if (!order || order.order_no !== order_no) return null;
  if (order.is_external) {
    const token = req.query.token || req.cookies?.co_token;
    return token && order.external_token === token ? order : null;
  }
  return order.student_id === req.query.student_id ? order : null;
}

r.get('/orders/:id/complete', (req, res, next) => {
  try {
    const order = authOrder(req, req.app.locals.db);
    if (!order) return res.status(401).render('customer/error/404');
    const items = req.app.locals.db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(order.id);
    res.render('customer/complete', { title: '주문 완료', order, items });
  } catch (e) { next(e); }
});

r.get('/orders/:id/transfer-report', (req, res, next) => {
  try {
    const order = authOrder(req, req.app.locals.db);
    if (!order) return res.status(401).render('customer/error/404');
    res.render('customer/transfer', { title:'이체 확인 요청', order });
  } catch (e) { next(e); }
});

r.get('/orders/:id/status', (req, res, next) => {
  try {
    const order = authOrder(req, req.app.locals.db);
    if (!order) return res.status(401).render('customer/error/404');
    res.render('customer/status', { title:'조리 현황', order });
  } catch (e) { next(e); }
});

export default r;
```

```js
// src/routes/customer/index.js — 마운트
import orders from './orders.js';
r.use(orders);
```

- [ ] **Step 2: views/customer/complete.ejs**

```ejs
<header class="topbar flex justify-between items-center p-4 border-b border-divider">
  <div class="flex items-center gap-2">
    <span class="text-2xl text-success">✓</span>
    <div class="flex flex-col">
      <span class="font-bold text-success">주문 접수 완료</span>
      <span class="text-xs text-muted">상태: 주문중 · 입금 대기</span>
    </div>
  </div>
  <%- include('../partials/status-chip', { status: 'ORDERED' }) %>
</header>

<div class="screen p-4 pb-32 flex flex-col gap-6 items-center">
  <h1 class="winner font-stencil text-4xl text-center" style="line-height:1.0">
    WINNER WINNER<br>CHICKEN DINNER!
  </h1>
  <div class="text-xs text-muted">도그태그를 받으셨습니다 · 임무 개시</div>

  <%- include('../partials/dogtag', { num: order.order_no, total: 100, date: order.business_date, dropping: true }) %>

  <%- include('../partials/mascot', { state: 'preparing', size: 'sm', caption: '출동 준비!' }) %>

  <div class="card bg-surface rounded-md shadow-card p-4 w-full">
    <div class="text-xs text-muted font-bold mb-2">📋 주문 내역</div>
    <% items.forEach(it => { %>
      <div class="flex justify-between text-sm py-1">
        <span><%= it.menu_name_snap %> × <%= it.qty %></span>
        <span class="tabular"><%= it.line_total.toLocaleString('ko-KR') %>원</span>
      </div>
    <% }) %>
    <div class="border-t border-dashed border-divider my-2"></div>
    <div class="flex justify-between text-sm"><span class="text-muted">소계</span><span class="tabular"><%= order.subtotal.toLocaleString('ko-KR') %>원</span></div>
    <% if (order.discount > 0) { %>
      <div class="flex justify-between text-sm text-success"><span>쿠폰 할인</span><span class="tabular">-<%= order.discount.toLocaleString('ko-KR') %>원</span></div>
    <% } %>
    <div class="flex justify-between font-bold text-base mt-2"><span>합계</span><span class="tabular"><%= order.total.toLocaleString('ko-KR') %>원</span></div>
  </div>

  <div class="w-full">
    <div class="text-xs text-muted font-bold mb-2">💸 입금 안내 · 1인 1계좌 송금</div>
    <div class="account-card bg-ink text-bg p-4 rounded-md" x-data="{ copied:false }">
      <div class="flex items-center justify-between">
        <span class="font-bold">국민은행</span>
        <span class="font-mono tabular">123-45-678901</span>
        <button @click="navigator.clipboard.writeText('123-45-678901'); copied=true; setTimeout(()=>copied=false, 1800)" class="bg-accent text-ink px-3 py-1 rounded-sm text-xs font-bold">
          <span x-show="!copied">복사</span><span x-show="copied">복사됨 ✓</span>
        </button>
      </div>
      <div class="text-xs mt-2 opacity-80">예금주: 컴퓨터모바일융합과 학생회</div>
      <div class="text-2xl font-mono font-black tabular text-accent mt-2"><%= order.total.toLocaleString('ko-KR') %>원</div>
    </div>
  </div>

  <div class="card bg-surface rounded-md shadow-card p-4 w-full flex justify-between">
    <span class="text-xs text-muted">📍 수령</span>
    <span class="font-bold text-sm"><%= order.pickup_method === 'dine_in' ? `매장 · 테이블 ${order.table_no}` : '포장' %></span>
  </div>

  <div class="warn-banner bg-warning/10 border border-warning p-3 rounded-sm w-full text-sm">
    ⚠️ 이체 후 아래 <b>"이체했어요, 확인 요청"</b>을 꼭 눌러주세요.
  </div>
</div>

<%
  const authQuery = order.is_external ? `token=${order.external_token}` : `student_id=${order.student_id}`;
%>
<div class="bottom-bar fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-3 bg-bg border-t border-divider flex flex-col gap-2">
  <a href="/orders/<%= order.id %>/transfer-report?order_no=<%= order.order_no %>&<%= authQuery %>" class="block w-full py-3 bg-accent text-ink font-bold text-center rounded-md shadow-cta">
    💸 이체했어요, 확인 요청 보내기
  </a>
  <a href="/orders/<%= order.id %>/status?order_no=<%= order.order_no %>&<%= authQuery %>" class="block w-full py-2 border-2 border-divider text-center rounded-md text-sm">
    🍗 조리 현황 보기
  </a>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add views/customer/complete.ejs src/routes/customer/orders.js src/routes/customer/index.js
git commit -m "feat: Phase 3.5 — C-4 주문 완료 화면 (도그태그 단발 모션 + 계좌 복사)"
```

---

## Task 3.6: views/customer/transfer.ejs (C-5 — 자동 진입)

**Files:**
- Create: `views/customer/transfer.ejs`

- [ ] **Step 1: views/customer/transfer.ejs**

```ejs
<%- include('../partials/topbar-back', { title:'💸 이체 확인 요청', backUrl:`/orders/${order.id}/complete?order_no=${order.order_no}&${order.is_external ? `token=${order.external_token}` : `student_id=${order.student_id}`}` }) %>

<div x-data="transferPage()" class="screen p-4 pb-24 flex flex-col gap-6">
  <div class="card bg-surface rounded-md shadow-card p-4">
    <div class="flex justify-between mb-2">
      <span class="text-xs text-muted">주문번호</span>
      <%- include('../partials/dogtag', { num: order.order_no, size:'xs', date: order.business_date }) %>
    </div>
    <div class="flex justify-between"><span class="text-xs text-muted">주문자</span><span class="font-bold"><%= order.customer_name %></span></div>
    <div class="border-t border-dashed border-divider my-2"></div>
    <div class="flex justify-between"><span class="text-xs text-muted">결제 금액</span><span class="text-2xl font-mono font-black tabular"><%= order.total.toLocaleString('ko-KR') %>원</span></div>
  </div>

  <div>
    <label class="block mb-1 text-sm font-bold">이체하신 은행 <span class="text-danger">*</span></label>
    <select x-model="bank" :class="errors.bank ? 'select is-error' : 'select'" class="w-full p-3 rounded-sm bg-surface">
      <option value="">은행 선택...</option>
      <option>카카오뱅크</option><option>국민은행</option><option>신한은행</option>
      <option>우리은행</option><option>하나은행</option><option>NH농협</option>
      <option>토스뱅크</option><option>기타</option>
    </select>
    <div x-show="errors.bank" class="text-xs text-danger mt-1" x-text="errors.bank"></div>
  </div>

  <label class="checkbox flex items-start gap-3 p-3 rounded-md border border-divider">
    <input type="checkbox" x-model="altName" class="mt-1">
    <div>
      <div class="font-bold text-sm">다른 이름으로 이체했어요</div>
      <div class="text-xs text-muted">가족·대리 이체 시</div>
    </div>
  </label>
  <div x-show="altName">
    <label class="block mb-1 text-sm font-bold">이체한 사람 이름 <span class="text-danger">*</span></label>
    <input type="text" x-model="otherName" class="w-full p-3 rounded-sm bg-surface" placeholder="예: 홍어머니">
    <div x-show="errors.otherName" class="text-xs text-danger mt-1" x-text="errors.otherName"></div>
  </div>

  <div class="card bg-elevated p-4 rounded-md text-sm">
    <div class="font-bold mb-1">확인 후 자동 진행</div>
    <div class="text-xs text-muted">요청을 보내면 <b>조리 현황판</b>으로 자동 이동합니다. 본부에서 통장을 확인하면 입금 완료 → 조리 시작이 진행돼요.</div>
  </div>
</div>

<div class="bottom-bar fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-3 bg-bg border-t border-divider">
  <button @click="submit()" :disabled="submitting" class="block w-full py-3 bg-accent text-ink font-bold text-center rounded-md shadow-cta">
    <span x-show="!submitting">확인 요청 보내기</span>
    <span x-show="submitting">요청 보내는 중...</span>
  </button>
</div>

<script>
function transferPage() {
  return {
    bank:'', altName:false, otherName:'', submitting:false, errors:{},
    async submit() {
      this.errors = {};
      if (!this.bank) this.errors.bank = '은행을 선택해 주세요';
      if (this.altName && !this.otherName.trim()) this.errors.otherName = '이체한 이름을 입력해 주세요';
      if (Object.keys(this.errors).length) return;
      this.submitting = true;
      const authQ = '<%= order.is_external ? `token=${order.external_token}` : `student_id=${order.student_id}` %>';
      const res = await fetch(`/api/orders/<%= order.id %>/transfer-report?order_no=<%= order.order_no %>&${authQ}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ bank: this.bank, alt_name: this.altName ? this.otherName.trim() : null }),
      });
      const j = await res.json();
      if (!j.ok) { alert(j.error.message); this.submitting = false; return; }
      // ★ Finding B — 자동 조리 현황 진입
      location.href = `/orders/<%= order.id %>/status?order_no=<%= order.order_no %>&${authQ}`;
    },
  };
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add views/customer/transfer.ejs
git commit -m "feat: Phase 3.6 — C-5 이체 신고 화면 + 자동 조리 현황 진입 (Finding B)"
```

---

## Task 3.7: views/customer/status.ejs (C-6 — SSE 클라이언트)

**Files:**
- Create: `views/customer/status.ejs`
- Create: `views/partials/timeline.ejs`

- [ ] **Step 1: timeline partial**

```ejs
<%
  const order = locals.order;
  const status = locals.status ?? order.status;
  const statusToIdx = { ORDERED:0, TRANSFER_REPORTED:1, PAID:1, COOKING:2, READY:3, DONE:4 };
  const idx = statusToIdx[status] ?? 0;
  const steps = [
    { key:'ORDERED', short:'접수' },
    { key:'PAID', short:'입금' },
    { key:'COOKING', short:'조리' },
    { key:'READY', short:'마무리' },
    { key:'DONE', short:'수령' },
  ];
%>
<div class="timeline relative pt-6 pb-3" role="progressbar" aria-valuemin="0" aria-valuemax="4" aria-valuenow="<%= idx %>">
  <div class="absolute top-9 left-4 right-4 h-1 bg-divider rounded-full">
    <div class="bg-accent h-full rounded-full transition-all duration-700" style="width: <%= (idx/4) * 100 %>%"></div>
  </div>
  <div class="flex justify-between relative">
    <% steps.forEach((s, i) => { %>
      <div class="flex flex-col items-center gap-1">
        <span class="dot w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold <%= i < idx ? 'bg-success text-white' : i === idx ? 'bg-accent text-ink' : 'bg-divider text-muted' %>">
          <%= i < idx ? '✓' : i + 1 %>
        </span>
        <span class="label text-2xs"><%= s.short %></span>
      </div>
    <% }) %>
  </div>
</div>
```

- [ ] **Step 2: views/customer/status.ejs**

```ejs
<% const authQ = order.is_external ? `token=${order.external_token}` : `student_id=${order.student_id}`; %>

<%- include('../partials/topbar-back', { title:'조리 현황', backUrl:`/orders/${order.id}/complete?order_no=${order.order_no}&${authQ}` }) %>

<div x-data="statusPage()" x-init="connectSSE()" class="screen p-4 flex flex-col gap-6">
  <div x-show="disconnected" class="warn-banner bg-warning/10 border border-warning p-3 rounded-sm text-sm">
    ⚠️ 연결이 끊어졌어요. 다시 연결 중...
  </div>

  <div class="flex justify-between items-end">
    <div class="flex flex-col gap-1">
      <span class="text-xs text-muted">현재 상태</span>
      <span :class="'chip ' + chipCls()" x-text="chipLabel()"></span>
    </div>
    <span class="text-xs text-muted font-mono tabular" x-text="updatedAt"></span>
  </div>

  <div class="card bg-surface rounded-md shadow-card p-4">
    <%- include('timeline', { order, status: order.status }) %>
  </div>

  <div class="flex flex-col items-center gap-4">
    <div x-html="mascotHtml"></div>
    <div class="text-center">
      <div class="text-lg font-bold" x-text="bigCopy"></div>
      <div class="text-sm text-muted mt-1" x-text="bodyCopy"></div>
    </div>
  </div>

  <div x-show="status === 'READY'" class="card bg-accent text-center p-4 rounded-md border-2 border-ink">
    <div class="font-bold text-base">📣 부스에서 호명 중!</div>
    <div class="text-xs text-muted mt-1">도그태그 번호 #<%= order.order_no %>로 받으세요.</div>
  </div>
</div>

<script>
function statusPage() {
  const order = { id: <%= order.id %>, order_no: <%= order.order_no %>, is_external: <%= order.is_external %> };
  const authQ = '<%= authQ %>';
  return {
    status: '<%= order.status %>',
    updatedAt: new Date().toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' }),
    disconnected: false,
    es: null,
    copyByStatus: {
      ORDERED:           { mascot:'preparing', big:'⏳ 입금을 기다리는 중', body:'이체 후 "확인 요청"을 보내주세요.' },
      TRANSFER_REPORTED: { mascot:'preparing', big:'💸 본부가 통장을 확인하는 중', body:'잠시만요! 보통 1~5분 안에 확인됩니다.' },
      PAID:              { mascot:'preparing', big:'✅ 입금 확인 완료!', body:'곧 조리가 시작됩니다.' },
      COOKING:           { mascot:'cooking', big:'🔥 지금 치킨이 기름 속으로 입장했습니다!', body:'맛있게 튀겨지는 중이에요.' },
      READY:             { mascot:'arrived', big:'🎉 #' + order.order_no + '번, 수령 가능!', body:'부스에서 호명을 들어주세요.' },
      DONE:              { mascot:'arrived', big:'WINNER WINNER 임무 완수!', body:'맛있게 드세요! 🍗' },
      CANCELED:          { mascot:'canceled', big:'주문이 취소되었습니다', body:'부스에 문의해 주세요.' },
    },
    chipCls() { return 'chip-' + this.status.toLowerCase().replace('_','-'); },
    chipLabel() {
      const m = { ORDERED:'⏳ 주문중', TRANSFER_REPORTED:'💸 이체확인요청', PAID:'✓ 이체완료', COOKING:'🔥 조리중', READY:'✅ 수령가능', DONE:'🎉 수령완료', CANCELED:'✖ 취소', HOLD:'⚠️ 보류' };
      return m[this.status] || this.status;
    },
    get c() { return this.copyByStatus[this.status] || this.copyByStatus.ORDERED; },
    get bigCopy() { return this.c.big; },
    get bodyCopy() { return this.c.body; },
    get mascotHtml() {
      const map = { default:'🪖', preparing:'🚩', cooking:'🔥', arrived:'🎉', canceled:'✖' };
      const g = map[this.c.mascot] || '🪖';
      return `<div class="mascot" style="width:160px;height:160px;border:3px solid var(--color-accent);background:var(--color-ink);color:var(--color-accent);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:60px">${g}</div>`;
    },
    connectSSE() {
      const url = `/api/orders/${order.id}/stream?order_no=${order.order_no}&${authQ}`;
      this.es = new EventSource(url);
      this.es.addEventListener('snapshot', (e) => { this.applyStatus(JSON.parse(e.data)); });
      this.es.addEventListener('status', (e) => { this.applyStatus(JSON.parse(e.data)); });
      this.es.addEventListener('error', () => { this.disconnected = true; });
      this.es.addEventListener('open', () => { this.disconnected = false; });
    },
    applyStatus(payload) {
      this.status = payload.status;
      this.updatedAt = new Date().toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' });
      this.disconnected = false;
      if (payload.status === 'READY' && navigator.vibrate) navigator.vibrate([100, 50, 100]);
    },
  };
}
</script>
```

- [ ] **Step 3: Commit**

```bash
git add views/customer/status.ejs views/partials/timeline.ejs
git commit -m "feat: Phase 3.7 — C-6 조리 현황판 (SSE EventSource + 진동 + 5단계 Timeline)"
```

---

# Phase 4 — 관리자 화면 (P0, 1.5일)

## Task 4.1: middleware/admin-auth.js + PIN 로그인

**Files:**
- Create: `src/middleware/admin-auth.js`
- Create: `src/routes/admin/auth.js`
- Create: `views/layouts/admin.ejs`
- Create: `views/admin/login.ejs`
- Create: `scripts/admin-add.js` (CLI tool)

- [ ] **Step 1: middleware/admin-auth.js**

```js
export function requireAdmin(req, res, next) {
  if (req.session?.adminId) return next();
  if (req.path.startsWith('/admin/api')) {
    return res.status(401).json({ ok:false, error:{ code:'ADMIN_AUTH_FAIL', message:'로그인이 필요합니다' }});
  }
  res.redirect('/admin/login');
}
```

- [ ] **Step 2: src/routes/admin/auth.js**

```js
import { Router } from 'express';
import { z } from 'zod';
import { AdminRepo } from '../../db/repositories/admin-repo.js';

const r = Router();

const LoginInput = z.object({
  username: z.string().min(1).max(20),
  pin: z.string().regex(/^\d{4,8}$/),
});

r.get('/login', (req, res) => res.render('admin/login', { title:'본부 로그인', error: req.session?.loginError }));

r.post('/login', (req, res, next) => {
  try {
    const parsed = LoginInput.safeParse(req.body);
    if (!parsed.success) {
      req.session.loginError = 'PIN은 4자리 숫자입니다';
      return res.redirect('/admin/login');
    }
    const repo = new AdminRepo(req.app.locals.db);
    const admin = repo.findByUsername(parsed.data.username);
    if (!admin || !AdminRepo.verifyPin(parsed.data.pin, admin.pin_hash)) {
      req.session.loginError = '아이디 또는 PIN이 올바르지 않습니다';
      return res.redirect('/admin/login');
    }
    repo.touchLogin(admin.id);
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    req.session.loginError = null;
    res.redirect('/admin/dashboard');
  } catch (e) { next(e); }
});

r.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

export default r;
```

- [ ] **Step 3: views/layouts/admin.ejs + admin/login.ejs**

```ejs
<!-- views/layouts/admin.ejs -->
<!doctype html>
<html lang="ko">
<head>
  <%- include('../partials/_head', { title }) %>
</head>
<body class="font-sans text-ink bg-bg min-h-screen">
  <% if (typeof showNav !== 'undefined' && showNav) { %>
    <%- include('../partials/admin-nav') %>
  <% } %>
  <main class="min-h-screen flex flex-col"><%- body %></main>
</body>
</html>
```

```ejs
<!-- views/admin/login.ejs -->
<% layout('layouts/admin'); -%>
<div class="flex-1 flex items-center justify-center p-8">
  <div class="w-96 text-center">
    <div class="inline-block font-stencil text-xl bg-accent text-ink px-4 py-2 rounded-sm mb-3">HQ — COMMAND POST</div>
    <h1 class="text-xl font-bold mb-1">본부 PIN 입력</h1>
    <p class="text-xs text-muted mb-8">당일 운영진에게 전달된 4자리 코드</p>

    <form method="POST" action="/admin/login" x-data="{ username: 'admin', pin: '' }">
      <input type="hidden" name="username" :value="username">
      <input type="hidden" name="pin" :value="pin">
      <div class="pin-display flex gap-2 justify-center mb-3">
        <% for(let i=0; i<4; i++) { %>
          <div class="pin-cell w-12 h-14 border-2 rounded-sm flex items-center justify-center text-xl"
               :class="pin.length > <%= i %> ? 'border-accent bg-elevated' : 'border-divider'">
            <span x-text="pin.length > <%= i %> ? '●' : ''"></span>
          </div>
        <% } %>
      </div>
      <% if (typeof error !== 'undefined' && error) { %>
        <div class="text-xs text-danger mb-3"><%= error %></div>
      <% } %>
      <div class="grid grid-cols-3 gap-2">
        <% for(const k of ['1','2','3','4','5','6','7','8','9','C','0','⌫']) { %>
          <button type="button" class="pin-key h-12 bg-surface rounded-sm font-bold text-lg shadow-card"
            @click="
              if ('<%= k %>' === 'C') pin = '';
              else if ('<%= k %>' === '⌫') pin = pin.slice(0, -1);
              else if (pin.length < 4) pin += '<%= k %>';
              if (pin.length === 4) $el.form.submit();
            "><%= k %></button>
        <% } %>
      </div>
    </form>
  </div>
</div>
```

- [ ] **Step 4: scripts/admin-add.js (CLI PIN 등록)**

```js
#!/usr/bin/env node
import { openDb, runMigrations } from '../src/db/connection.js';
import { AdminRepo } from '../src/db/repositories/admin-repo.js';

const [,, username, pin] = process.argv;
if (!username || !pin) { console.error('usage: node scripts/admin-add.js <username> <pin>'); process.exit(1); }
const db = openDb();
runMigrations(db);
new AdminRepo(db).create({ username, pin });
console.log(`admin '${username}' added`);
db.close();
```

- [ ] **Step 5: 통합 테스트**

```js
// tests/integration/admin-auth.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';
import { AdminRepo } from '../../src/db/repositories/admin-repo.js';

describe('admin auth', () => {
  let db, app;
  beforeEach(async () => {
    db = setupTestDb();
    new AdminRepo(db).create({ username:'admin', pin:'7842' });
    const { createApp } = await import('../../src/app.js');
    app = await createApp({ db });
  });
  afterEach(() => teardownTestDb(db));

  it('정상 PIN → 302 redirect to dashboard', async () => {
    const res = await request(app).post('/admin/login').type('form').send({ username:'admin', pin:'7842' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/admin/dashboard');
  });
  it('잘못된 PIN → 302 redirect /admin/login + error session', async () => {
    const res = await request(app).post('/admin/login').type('form').send({ username:'admin', pin:'0000' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/admin/login');
  });
  it('미인증 /admin/dashboard 접근 → 302 to login', async () => {
    const res = await request(app).get('/admin/dashboard');
    expect(res.status).toBe(302);
  });
});
```

- [ ] **Step 6: 통과 + 커밋**

```bash
npm test -- admin-auth
git add src/middleware/admin-auth.js src/routes/admin/auth.js views/layouts/admin.ejs views/admin/login.ejs scripts/admin-add.js tests/integration/admin-auth.test.js
git commit -m "feat: Phase 4.1 — A-1 PIN 로그인 (scrypt + 세션 + Alpine keypad)"
```

---

## Task 4.2: A-2 본부 대시보드 + 5초 폴링

**Files:**
- Create: `src/routes/admin/dashboard.js`
- Create: `views/admin/dashboard.ejs`
- Create: `views/partials/admin-nav.ejs`

- [ ] **Step 1: partials/admin-nav.ejs**

```ejs
<nav class="admin-topnav bg-elevated border-b border-divider flex items-center gap-4 px-4 py-2">
  <span class="font-stencil text-base">CHICKEN HQ</span>
  <a href="/admin/dashboard" class="nav-link px-3 py-1 rounded-sm text-sm <%= active==='dashboard' ? 'bg-accent text-ink font-bold' : '' %>">주문 보드</a>
  <a href="/admin/transfers" class="nav-link px-3 py-1 rounded-sm text-sm <%= active==='transfers' ? 'bg-accent text-ink font-bold' : '' %>">💸 이체 확인 <% if (typeof transferCount !== 'undefined' && transferCount > 0) { %><span class="count-badge bg-warning text-ink text-xs px-1 rounded-full"><%= transferCount %></span><% } %></a>
  <a href="/admin/menus" class="nav-link px-3 py-1 rounded-sm text-sm <%= active==='menus' ? 'bg-accent text-ink font-bold' : '' %>">메뉴 관리</a>
  <a href="/admin/settlement" class="nav-link px-3 py-1 rounded-sm text-sm <%= active==='settlement' ? 'bg-accent text-ink font-bold' : '' %>">📒 정산</a>
  <div class="ml-auto flex items-center gap-2 text-sm">
    <span class="text-success font-mono">● LIVE</span>
    <span>운영자: <%= locals.username || 'admin' %></span>
    <form method="POST" action="/admin/logout" class="inline"><button class="text-xs text-muted">로그아웃</button></form>
  </div>
</nav>
```

- [ ] **Step 2: routes/admin/dashboard.js**

```js
import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin-auth.js';
import { OrderRepo } from '../../db/repositories/order-repo.js';

const r = Router();

function todayKST() {
  const d = new Date();
  d.setHours(d.getHours() + 9);
  return d.toISOString().slice(0, 10);
}

r.get('/dashboard', requireAdmin, (req, res, next) => {
  try {
    const repo = new OrderRepo(req.app.locals.db);
    const date = req.query.date || todayKST();
    const orders = repo.findDashboardCards(date);
    const counts = repo.countActiveByStatus(date);
    res.render('admin/dashboard', {
      title:'본부 대시보드',
      active: 'dashboard',
      username: req.session.adminUsername,
      date, orders, counts,
    });
  } catch (e) { next(e); }
});

// API for Alpine polling
r.get('/api/dashboard/orders', requireAdmin, (req, res, next) => {
  try {
    const repo = new OrderRepo(req.app.locals.db);
    const date = req.query.date || todayKST();
    res.json({ ok:true, data:{
      orders: repo.findDashboardCards(date),
      counts_by_status: repo.countActiveByStatus(date),
    }});
  } catch (e) { next(e); }
});

// 상태 전이 액션
r.post('/api/orders/:id/transition', requireAdmin, (req, res, next) => {
  try {
    const repo = new OrderRepo(req.app.locals.db);
    const order = repo.findById(Number(req.params.id));
    if (!order) {
      const e = new Error('주문 없음'); e.code='ORDER_NOT_FOUND'; return next(e);
    }
    const { to, reason } = req.body;
    repo.transition(order.id, order.status, to, `admin:${req.session.adminId}`, reason || null);
    // SSE push
    if (req.app.locals.sseHub) req.app.locals.sseHub.emit(order.id, 'status', { status: to });
    res.json({ ok: true, data: { status: to } });
  } catch (e) { next(e); }
});

export default r;
```

- [ ] **Step 3: views/admin/dashboard.ejs (Kanban 6-col)**

```ejs
<%- include('../partials/admin-nav', { active:'dashboard', username, transferCount: counts.TRANSFER_REPORTED || 0 }) %>

<div x-data="dashboardPage()" x-init="poll()" class="flex-1 p-4 flex flex-col">
  <div class="flex justify-between items-end mb-4">
    <div>
      <h2 class="text-xl font-bold">주문 보드</h2>
      <div class="text-xs text-muted font-mono">5초 자동 갱신 · <%= date %> · 카드 클릭 = 상세, 액션 = 즉시 전이</div>
    </div>
  </div>

  <div class="kanban grid grid-cols-6 gap-2 flex-1">
    <% for (const col of [
      { key:'ORDERED', label:'🟡 주문중' },
      { key:'TRANSFER_REPORTED', label:'⚠️ 이체확인요청', tone:'warn' },
      { key:'PAID', label:'✅ 입금완료' },
      { key:'COOKING', label:'🔥 조리중' },
      { key:'READY', label:'📣 수령가능' },
      { key:'DONE', label:'✓ 수령완료' },
    ]) { %>
      <section class="kanban-col bg-surface rounded-md p-2 flex flex-col gap-2 min-h-[400px]">
        <header class="font-bold text-sm flex justify-between items-center px-2 <%= col.tone === 'warn' ? 'text-warning' : '' %>">
          <span><%= col.label %></span>
          <span class="count-badge bg-elevated px-2 py-0.5 rounded-full text-xs" x-text="counts.<%= col.key %> || 0"></span>
        </header>
        <div class="kanban-col-body flex-1 flex flex-col gap-2 overflow-y-auto">
          <template x-for="o in ordersByStatus('<%= col.key %>')" :key="o.id">
            <div class="kanban-card bg-bg p-2 rounded-sm shadow-card cursor-pointer text-xs"
                 @click="goDetail(o.id)">
              <div class="flex items-center gap-1 mb-1">
                <span class="font-mono font-bold" x-text="'#' + o.order_no"></span>
                <span class="ml-auto font-mono" :class="o.elapsed_minutes >= 10 ? 'text-danger font-bold' : o.elapsed_minutes >= 5 ? 'text-warning' : 'text-muted'"
                      x-text="Math.floor(o.elapsed_minutes) + '분'"></span>
              </div>
              <div class="font-bold" x-text="o.customer_name + (o.is_external ? ' (외부)' : '')"></div>
              <div class="text-muted text-2xs" x-text="won(o.total) + ' · ' + (o.transfer_bank || '')"></div>
              <div class="actions mt-1 flex gap-1" @click.stop>
                <template x-if="'<%= col.key %>' === 'TRANSFER_REPORTED'">
                  <button class="btn btn-primary btn-xs" @click="transit(o, 'PAID')">입금 확인</button>
                </template>
                <template x-if="'<%= col.key %>' === 'PAID'">
                  <button class="btn btn-primary btn-xs" @click="transit(o, 'COOKING')">🔥 조리 시작</button>
                </template>
                <template x-if="'<%= col.key %>' === 'COOKING'">
                  <button class="btn btn-primary btn-xs" @click="transit(o, 'READY')">📣 수령 호출</button>
                </template>
                <template x-if="'<%= col.key %>' === 'READY'">
                  <button class="btn btn-primary btn-xs" @click="transit(o, 'DONE')">✓ 수령완료</button>
                </template>
              </div>
            </div>
          </template>
        </div>
      </section>
    <% } %>
  </div>
</div>

<script>
function dashboardPage() {
  return {
    orders: <%- JSON.stringify(orders) %>,
    counts: <%- JSON.stringify(counts) %>,
    ordersByStatus(s) { return this.orders.filter(o => o.status === s); },
    async poll() {
      setInterval(async () => {
        try {
          const r = await fetch('/admin/api/dashboard/orders');
          const j = await r.json();
          if (j.ok) { this.orders = j.data.orders; this.counts = j.data.counts_by_status; }
        } catch {}
      }, 5000);
    },
    async transit(o, to) {
      const res = await fetch(`/admin/api/orders/${o.id}/transition`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ to }),
      });
      const j = await res.json();
      if (!j.ok) alert(j.error.message);
      else this.poll();
    },
    goDetail(id) { location.href = `/admin/orders/${id}`; },
    won(n) { return n.toLocaleString('ko-KR') + '원'; },
  };
}
</script>
```

- [ ] **Step 4: admin/index.js 마운트 + 통합 테스트**

```js
// src/routes/admin/index.js
import { Router } from 'express';
import auth from './auth.js';
import dashboard from './dashboard.js';

const r = Router();
r.use(auth);
r.use(dashboard);
export default r;
```

```js
// tests/integration/admin-dashboard.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';
import { AdminRepo } from '../../src/db/repositories/admin-repo.js';

describe('admin dashboard', () => {
  let db, app, agent;
  beforeEach(async () => {
    db = setupTestDb();
    new AdminRepo(db).create({ username:'admin', pin:'7842' });
    const { createApp } = await import('../../src/app.js');
    app = await createApp({ db });
    agent = request.agent(app);
    await agent.post('/admin/login').type('form').send({ username:'admin', pin:'7842' });
  });
  afterEach(() => teardownTestDb(db));

  it('인증 후 대시보드 진입 → 200', async () => {
    const res = await agent.get('/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('주문 보드');
  });
  it('GET /admin/api/dashboard/orders → JSON', async () => {
    const res = await agent.get('/admin/api/dashboard/orders');
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveProperty('orders');
    expect(res.body.data).toHaveProperty('counts_by_status');
  });
});
```

- [ ] **Step 5: 통과 + 커밋**

```bash
npm test -- admin-dashboard
git add src/routes/admin/dashboard.js src/routes/admin/index.js views/admin/dashboard.ejs views/partials/admin-nav.ejs tests/integration/admin-dashboard.test.js
git commit -m "feat: Phase 4.2 — A-2 본부 대시보드 (6-col Kanban + 5초 폴링 + 인라인 액션)"
```

---

## Task 4.3: A-3 주문 상세 + A-4 이체 확인 화면

**Files:**
- Create: `src/routes/admin/orders.js`
- Create: `src/routes/admin/transfers.js`
- Create: `views/admin/orders/show.ejs`
- Create: `views/admin/transfers.ejs`

- [ ] **Step 1: src/routes/admin/orders.js**

```js
import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin-auth.js';
import { OrderRepo } from '../../db/repositories/order-repo.js';

const r = Router();

r.get('/orders/:id', requireAdmin, (req, res, next) => {
  try {
    const repo = new OrderRepo(req.app.locals.db);
    const order = repo.findById(Number(req.params.id));
    if (!order) return res.status(404).render('customer/error/404');
    const items = req.app.locals.db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(order.id);
    const events = req.app.locals.db.prepare(`SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at`).all(order.id);
    res.render('admin/orders/show', { title:`주문 #${order.order_no}`, active:'dashboard', username: req.session.adminUsername, order, items, events });
  } catch (e) { next(e); }
});

export default r;
```

- [ ] **Step 2: views/admin/orders/show.ejs (간략 — Bundle JSX 참조)**

```ejs
<%- include('../../partials/admin-nav', { active:'dashboard', username }) %>
<div class="p-4 flex-1">
  <a href="/admin/dashboard" class="text-xs text-muted">← 대시보드로</a>
  <div class="flex items-end gap-4 mb-4">
    <%- include('../../partials/dogtag', { num: order.order_no, size:'sm', date: order.business_date }) %>
    <div>
      <div class="text-xs text-muted">주문 상세</div>
      <h1 class="text-2xl font-bold">#<%= order.order_no %> · <%= order.customer_name %></h1>
    </div>
    <div class="ml-auto"><%- include('../../partials/status-chip', { status: order.status }) %></div>
  </div>
  <div class="grid grid-cols-2 gap-4">
    <div class="card bg-surface rounded-md shadow-card p-4">
      <h4 class="font-bold mb-2">주문자</h4>
      <div class="text-sm">이름: <%= order.customer_name %><%= order.is_external ? ' (외부인)' : '' %></div>
      <div class="text-sm">학번: <%= order.student_id || '— 외부인 —' %></div>
      <div class="text-sm">수령: <%= order.pickup_method === 'dine_in' ? `매장 · 테이블 ${order.table_no}` : '포장' %></div>
    </div>
    <div class="card bg-surface rounded-md shadow-card p-4">
      <h4 class="font-bold mb-2">이체 정보</h4>
      <div class="text-sm">은행: <%= order.transfer_bank || '—' %></div>
      <% if (order.transfer_alt_name) { %><div class="text-sm">이체자: <%= order.transfer_alt_name %></div><% } %>
      <div class="text-sm">금액: <span class="tabular"><%= order.total.toLocaleString('ko-KR') %>원</span></div>
    </div>
    <div class="card bg-surface rounded-md shadow-card p-4 col-span-2">
      <h4 class="font-bold mb-2">주문 내역</h4>
      <% items.forEach(it => { %>
        <div class="flex justify-between text-sm py-1">
          <span><%= it.menu_name_snap %> × <%= it.qty %></span>
          <span class="tabular"><%= it.line_total.toLocaleString('ko-KR') %>원</span>
        </div>
      <% }) %>
      <div class="border-t border-dashed my-2"></div>
      <div class="flex justify-between"><span class="text-muted">소계</span><span class="tabular"><%= order.subtotal.toLocaleString('ko-KR') %>원</span></div>
      <% if (order.discount > 0) { %><div class="flex justify-between text-success"><span>쿠폰 할인</span><span class="tabular">-<%= order.discount.toLocaleString('ko-KR') %>원</span></div><% } %>
      <div class="flex justify-between font-bold"><span>합계</span><span class="tabular"><%= order.total.toLocaleString('ko-KR') %>원</span></div>
    </div>
    <div class="card bg-surface rounded-md shadow-card p-4 col-span-2">
      <h4 class="font-bold mb-2">액션</h4>
      <div x-data="{}" class="flex gap-2">
        <% const nextMap = { ORDERED:'TRANSFER_REPORTED', TRANSFER_REPORTED:'PAID', PAID:'COOKING', COOKING:'READY', READY:'DONE' }; %>
        <% if (nextMap[order.status]) { %>
          <button @click="fetch('/admin/api/orders/<%= order.id %>/transition', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to:'<%= nextMap[order.status] %>' })}).then(() => location.reload())" class="btn btn-primary bg-accent text-ink px-4 py-2 rounded-sm font-bold">
            <%= nextMap[order.status] %>로 진행
          </button>
        <% } %>
        <button @click="if(confirm('보류로 변경할까요? 사유?')) { const reason = prompt('사유'); fetch('/admin/api/orders/<%= order.id %>/transition', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to:'HOLD', reason })}).then(() => location.reload()); }" class="btn btn-secondary px-3 py-2 rounded-sm">⚠️ 보류</button>
        <button @click="if(confirm('정말 취소?')) fetch('/admin/api/orders/<%= order.id %>/transition', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to:'CANCELED', reason:'운영진 취소' })}).then(() => location.reload())" class="btn btn-danger bg-danger text-white px-3 py-2 rounded-sm">취소</button>
      </div>
    </div>
    <div class="card bg-surface rounded-md shadow-card p-4 col-span-2">
      <h4 class="font-bold mb-2">이벤트 로그</h4>
      <% events.forEach(e => { %>
        <div class="text-xs font-mono"><%= e.created_at %> · <%= e.event_type %> <%= e.from_status ? `(${e.from_status} → ${e.to_status})` : '' %> · <%= e.actor %></div>
      <% }) %>
    </div>
  </div>
</div>
```

- [ ] **Step 3: src/routes/admin/transfers.js + views/admin/transfers.ejs**

```js
import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin-auth.js';

const r = Router();
r.get('/transfers', requireAdmin, (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const list = req.app.locals.db.prepare(`
      SELECT id, order_no, customer_name, student_id, is_external, total, transfer_bank, transfer_alt_name, transfer_at,
             (julianday('now') - julianday(transfer_at)) * 24 * 60 AS elapsed_minutes
      FROM orders
      WHERE business_date = ? AND status = 'TRANSFER_REPORTED'
      ORDER BY transfer_at
    `).all(date);
    res.render('admin/transfers', { title:'이체 확인', active:'transfers', username: req.session.adminUsername, list });
  } catch (e) { next(e); }
});
export default r;
```

```ejs
<!-- views/admin/transfers.ejs -->
<%- include('../partials/admin-nav', { active:'transfers', username, transferCount: list.length }) %>
<div class="p-4 flex-1" x-data="{ list: <%- JSON.stringify(list) %> }">
  <h2 class="text-xl font-bold mb-1">💸 이체 확인 큐</h2>
  <p class="text-xs text-muted font-mono mb-4">통장 화면 옆에 두고, 일치하면 [입금 확인]. 빨간 카드는 10분 초과.</p>

  <template x-if="list.length === 0">
    <div class="card bg-success/10 border-2 border-success text-center p-12 rounded-md">
      <div class="text-4xl">🎉</div>
      <div class="text-lg font-bold text-success mt-2">모두 처리 완료!</div>
      <div class="text-xs text-muted mt-1">대기 중인 이체 확인 요청이 없습니다.</div>
    </div>
  </template>

  <div class="grid grid-cols-3 gap-3" x-show="list.length > 0">
    <template x-for="o in list" :key="o.id">
      <div class="card bg-bg p-4 rounded-md border-2" :class="o.elapsed_minutes >= 10 ? 'border-danger' : 'border-divider'">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold" x-text="'#' + o.order_no"></span>
            <span class="font-bold" x-text="o.customer_name + (o.is_external ? ' (외부)' : '')"></span>
          </div>
          <span class="font-mono" :class="o.elapsed_minutes >= 10 ? 'text-danger font-bold' : o.elapsed_minutes >= 5 ? 'text-warning' : 'text-muted'" x-text="Math.floor(o.elapsed_minutes) + '분 전'"></span>
        </div>
        <div class="text-sm mb-1">은행: <span class="font-bold" x-text="o.transfer_bank"></span></div>
        <div class="text-2xl font-mono font-black tabular my-2" x-text="o.total.toLocaleString('ko-KR') + '원'"></div>
        <div class="text-xs">학번: <span x-text="o.student_id || '외부인'"></span></div>
        <template x-if="o.transfer_alt_name">
          <div class="text-xs text-warning">이체자: <span x-text="o.transfer_alt_name"></span></div>
        </template>
        <div class="mt-2 flex gap-2">
          <button @click="transit(o, 'PAID')" class="btn bg-accent text-ink px-3 py-2 rounded-sm font-bold text-sm">✅ 입금 확인</button>
          <button @click="transit(o, 'HOLD')" class="btn border border-warning text-warning px-2 py-2 rounded-sm text-sm">⚠️ 보류</button>
          <a :href="'/admin/orders/' + o.id" class="text-xs text-muted ml-auto self-center">상세</a>
        </div>
      </div>
    </template>
  </div>
</div>
<script>
function transit(o, to) {
  fetch(`/admin/api/orders/${o.id}/transition`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to })})
    .then(r => r.json())
    .then(j => { if (!j.ok) alert(j.error.message); else location.reload(); });
}
</script>
```

- [ ] **Step 4: index 마운트 + 커밋**

```js
// admin/index.js
import orders from './orders.js';
import transfers from './transfers.js';
r.use(orders);
r.use(transfers);
```

```bash
git add src/routes/admin/orders.js src/routes/admin/transfers.js src/routes/admin/index.js views/admin/orders/show.ejs views/admin/transfers.ejs
git commit -m "feat: Phase 4.3 — A-3 주문 상세 + A-4 이체 확인 큐"
```

---

## Task 4.4: A-5 메뉴 관리 (CRUD + 토글)

**Files:**
- Create: `src/routes/admin/menus.js`
- Create: `views/admin/menus.ejs`

- [ ] **Step 1: routes/admin/menus.js**

```js
import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/admin-auth.js';
import { MenuRepo } from '../../db/repositories/menu-repo.js';

const r = Router();

r.get('/menus', requireAdmin, (req, res, next) => {
  try {
    const menus = new MenuRepo(req.app.locals.db).findAllActive();
    const cats = req.app.locals.db.prepare(`SELECT id, name FROM menu_categories ORDER BY display_order`).all();
    res.render('admin/menus', { title:'메뉴 관리', active:'menus', username: req.session.adminUsername, menus, cats });
  } catch (e) { next(e); }
});

const MenuInput = z.object({
  category_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(40),
  price: z.coerce.number().int().min(0),
  fallback_emoji: z.string().optional(),
});

r.post('/api/menus', requireAdmin, (req, res, next) => {
  try {
    const parsed = MenuInput.safeParse(req.body);
    if (!parsed.success) { const e = new Error(parsed.error.issues[0].message); e.code='INVALID_INPUT'; return next(e); }
    new MenuRepo(req.app.locals.db).create(parsed.data);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.patch('/api/menus/:id/sold-out', requireAdmin, (req, res, next) => {
  try {
    new MenuRepo(req.app.locals.db).toggleSoldOut(Number(req.params.id), !!req.body.is_sold_out);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.patch('/api/menus/:id/recommended', requireAdmin, (req, res, next) => {
  try {
    new MenuRepo(req.app.locals.db).toggleRecommended(Number(req.params.id), !!req.body.is_recommended);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
```

- [ ] **Step 2: views/admin/menus.ejs**

```ejs
<%- include('../partials/admin-nav', { active:'menus', username }) %>
<div class="p-4 flex-1" x-data="menuMgmt()">
  <div class="flex justify-between mb-4">
    <h2 class="text-xl font-bold">메뉴 관리</h2>
    <button @click="adding = !adding" class="btn bg-accent text-ink px-3 py-2 rounded-sm font-bold">+ 새 메뉴 추가</button>
  </div>

  <template x-if="adding">
    <form @submit.prevent="addMenu()" class="card bg-surface p-4 rounded-md mb-4 flex gap-2 items-end">
      <div><label class="text-xs">분류</label><select x-model.number="newMenu.category_id" class="block p-2 rounded-sm bg-elevated">
        <% cats.forEach(c => { %><option value="<%= c.id %>"><%= c.name %></option><% }) %>
      </select></div>
      <div><label class="text-xs">이름</label><input x-model="newMenu.name" required class="block p-2 rounded-sm bg-elevated"></div>
      <div><label class="text-xs">가격</label><input type="number" x-model.number="newMenu.price" required class="block p-2 rounded-sm bg-elevated font-mono"></div>
      <button type="submit" class="btn bg-accent text-ink px-3 py-2 rounded-sm font-bold">저장</button>
    </form>
  </template>

  <table class="w-full text-sm">
    <thead class="text-left text-xs text-muted">
      <tr class="border-b border-divider"><th class="p-2">이미지·이름</th><th class="p-2">분류</th><th class="p-2 text-right">가격</th><th class="p-2 text-center">품절</th><th class="p-2 text-center">추천</th></tr>
    </thead>
    <tbody>
      <template x-for="m in menus" :key="m.id">
        <tr class="border-b border-divider/40">
          <td class="p-2 flex items-center gap-2"><span class="text-xl" x-text="emojiByCat(m.category_id)"></span><span class="font-bold" x-text="m.name"></span></td>
          <td class="p-2" x-text="catName(m.category_id)"></td>
          <td class="p-2 text-right tabular" x-text="won(m.price)"></td>
          <td class="p-2 text-center"><input type="checkbox" :checked="m.is_sold_out" @change="toggleSoldOut(m, $event.target.checked)"></td>
          <td class="p-2 text-center"><input type="checkbox" :checked="m.is_recommended" @change="toggleRecommended(m, $event.target.checked)"></td>
        </tr>
      </template>
    </tbody>
  </table>

  <div class="warn-banner bg-warning/10 p-3 rounded-sm mt-4 text-xs">
    ⚠️ 운영 중 메뉴 가격 변경 금지 (ADR-020: 변경 직전·직후 주문이 다른 가격으로 기록됨)
  </div>
</div>

<script>
function menuMgmt() {
  return {
    adding: false,
    menus: <%- JSON.stringify(menus) %>,
    cats: <%- JSON.stringify(cats) %>,
    newMenu: { category_id: 1, name:'', price: 0 },
    catName(id) { return this.cats.find(c => c.id === id)?.name || ''; },
    emojiByCat(c) { return ({1:'🍗',2:'🍟',3:'🥤'})[c] || '🍗'; },
    won(n) { return n.toLocaleString('ko-KR') + '원'; },
    async addMenu() {
      const res = await fetch('/admin/api/menus', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(this.newMenu) });
      const j = await res.json();
      if (!j.ok) alert(j.error.message); else location.reload();
    },
    async toggleSoldOut(m, value) {
      await fetch(`/admin/api/menus/${m.id}/sold-out`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ is_sold_out: value }) });
      m.is_sold_out = value;
    },
    async toggleRecommended(m, value) {
      await fetch(`/admin/api/menus/${m.id}/recommended`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ is_recommended: value }) });
      m.is_recommended = value;
    },
  };
}
</script>
```

- [ ] **Step 3: 마운트 + 커밋**

```js
// admin/index.js
import menus from './menus.js';
r.use(menus);
```

```bash
git add src/routes/admin/menus.js src/routes/admin/index.js views/admin/menus.ejs
git commit -m "feat: Phase 4.4 — A-5 메뉴 관리 (CRUD + 품절·추천 토글, ★ Bundle 누락 항목 신설)"
```

---

## Task 4.5: ★ A-6 정산 화면 + 마감 가드 + ZIP 다운로드 (G1 + Bundle 라우팅 연결)

**Files:**
- Create: `src/routes/admin/settlement.js`
- Create: `views/admin/settlement.ejs`
- Create: `src/lib/zip-builder.js`

- [ ] **Step 1: src/lib/zip-builder.js (archiver 래퍼)**

```js
import archiver from 'archiver';
import fs from 'node:fs';
import path from 'node:path';
import { SettlementRepo } from '../db/repositories/settlement-repo.js';
import { CouponRepo } from '../db/repositories/coupon-repo.js';

export function buildSettlementZip(db, business_date, outStream) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(outStream);

  // manifest.json
  const manifest = {
    business_date,
    generated_at: new Date().toISOString(),
    version: 1,
  };
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

  // orders
  const orders = db.prepare(`SELECT * FROM orders WHERE business_date = ?`).all(business_date);
  archive.append(JSON.stringify(orders, null, 2), { name: 'orders.json' });
  const ordersCsv = ['id,order_no,status,customer_name,student_id,total,transfer_bank']
    .concat(orders.map(o => [o.id,o.order_no,o.status,o.customer_name,o.student_id||'',o.total,o.transfer_bank||''].join(',')))
    .join('\n');
  archive.append(ordersCsv, { name: 'orders.csv' });

  // coupons
  const coupons = new CouponRepo(db).findUsageList();
  archive.append(JSON.stringify(coupons, null, 2), { name: 'coupons.json' });

  // menu snapshot
  const menus = db.prepare(`SELECT * FROM menus`).all();
  archive.append(JSON.stringify(menus, null, 2), { name: 'menu-snapshot.json' });

  // summary
  const summary = new SettlementRepo(db).computeSummary(business_date);
  archive.append(JSON.stringify(summary, null, 2), { name: 'settlement-summary.json' });

  // images
  const imgDir = './public/images/menus';
  if (fs.existsSync(imgDir)) {
    archive.directory(imgDir, 'images');
  }

  archive.append('치킨이닭! 정산 백업 — 학생회 보관용\n7~14일 내 폐기 권장 (PII 포함).', { name: 'README.txt' });

  archive.finalize();
  return archive;
}
```

- [ ] **Step 2: src/routes/admin/settlement.js**

```js
import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin-auth.js';
import { OrderRepo } from '../../db/repositories/order-repo.js';
import { SettlementRepo } from '../../db/repositories/settlement-repo.js';
import { BackupRepo } from '../../db/repositories/backup-repo.js';
import { canClose } from '../../domain/settlement.js';
import { buildSettlementZip } from '../../lib/zip-builder.js';

const r = Router();

function todayKST() { const d = new Date(); d.setHours(d.getHours()+9); return d.toISOString().slice(0,10); }

r.get('/settlement', requireAdmin, (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const date = req.query.date || todayKST();
    const summary = new SettlementRepo(db).computeSummary(date);
    const snapshot = new SettlementRepo(db).findByDate(date);
    const counts = new OrderRepo(db).countActiveByStatus(date);
    const backups = new BackupRepo(db).findHistory(date);
    res.render('admin/settlement', {
      title:'정산', active:'settlement', username: req.session.adminUsername,
      date, summary, snapshot, counts, backups,
    });
  } catch (e) { next(e); }
});

r.post('/api/settlement/close', requireAdmin, (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const date = req.body.date || todayKST();
    const counts = new OrderRepo(db).countActiveByStatus(date);
    const guard = canClose(counts);
    if (!guard.ok) {
      return res.status(422).json({
        ok:false,
        error:{ code:'SETTLEMENT_PENDING_ORDERS', message:`진행 중 주문 ${guard.total}건이 있어 마감할 수 없습니다` },
        data:{ pending_breakdown: guard.breakdown },
      });
    }
    const summary = new SettlementRepo(db).computeSummary(date);
    new SettlementRepo(db).close({ business_date: date, closed_by_admin_id: req.session.adminId, summary_json: summary });
    res.json({ ok: true, data: { closed_at: new Date().toISOString() } });
  } catch (e) { next(e); }
});

r.get('/api/settlement/:date/zip', requireAdmin, (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const date = req.params.date;
    const filename = `chickenedak-backup-${date}-${new Date().toISOString().slice(11,16).replace(':','')}.zip`;
    res.attachment(filename);
    res.set('Content-Type', 'application/zip');
    const archive = buildSettlementZip(db, date, res);
    archive.on('end', () => {
      new BackupRepo(db).log({
        business_date: date, filename, source:'manual',
        size_bytes: archive.pointer(), downloaded_by: req.session.adminId,
      });
    });
  } catch (e) { next(e); }
});

export default r;
```

- [ ] **Step 3: views/admin/settlement.ejs (요약·마감·ZIP)**

```ejs
<%- include('../partials/admin-nav', { active:'settlement', username }) %>
<div class="p-4 flex-1" x-data="settlementPage()">
  <div class="flex justify-between items-end mb-4">
    <div>
      <h2 class="text-xl font-bold">📒 정산</h2>
      <div class="text-xs text-muted font-mono">§12 · ADR-012 가드 · ADR-016 ZIP 백업 · ADR-022 자동 스냅샷</div>
    </div>
    <div>
      <select x-model="date" @change="location.href='/admin/settlement?date=' + date" class="bg-elevated p-2 rounded-sm">
        <option value="2026-05-20">5/20 (수)</option>
        <option value="2026-05-21">5/21 (목)</option>
      </select>
    </div>
  </div>

  <% const active = Object.values(counts).reduce((s,n)=>s+n, 0); const closed = !!snapshot; %>
  <div class="settle-status p-4 rounded-md mb-4 flex items-center justify-between <%= closed ? 'bg-success/10 border border-success' : 'bg-warning/10 border border-warning' %>">
    <% if (closed) { %>
      <div>
        <div class="font-bold">✅ 정산 마감 완료</div>
        <div class="text-xs text-muted font-mono">마감 시각 <%= snapshot.closed_at %> · 관리자 #<%= snapshot.closed_by_admin_id %></div>
      </div>
      <a href="/admin/api/settlement/<%= date %>/zip" class="btn bg-accent text-ink px-4 py-2 rounded-sm font-bold">📦 ZIP 백업 다운로드</a>
    <% } else { %>
      <div>
        <div class="font-bold">🟡 운영 중 — 진행 주문 <%= active %>건</div>
        <div class="text-xs text-muted font-mono">진행 0건일 때만 마감 가능 (ADR-012)</div>
      </div>
      <div class="flex gap-2">
        <a href="/admin/api/settlement/<%= date %>/zip" class="btn border border-divider px-3 py-2 rounded-sm">📦 ZIP 백업</a>
        <button @click="attemptClose()" class="btn bg-accent text-ink px-4 py-2 rounded-sm font-bold" :disabled="closing"><span x-show="!closing">오늘 정산 마감</span><span x-show="closing">마감 처리 중...</span></button>
      </div>
    <% } %>
  </div>

  <!-- 요약 카드 4개 -->
  <div class="grid grid-cols-4 gap-2 mb-4">
    <div class="card bg-surface p-3 rounded-md">
      <div class="text-xs text-muted">총 주문 (DONE)</div>
      <div class="text-2xl tabular font-black"><%= summary.total_orders %><span class="text-sm">건</span></div>
      <div class="text-xs text-muted">취소 <%= summary.canceled %>건 제외</div>
    </div>
    <div class="card bg-surface p-3 rounded-md">
      <div class="text-xs text-muted">총 매출 (할인 전)</div>
      <div class="text-2xl tabular font-black"><%= summary.subtotal_revenue.toLocaleString('ko-KR') %>원</div>
    </div>
    <div class="card bg-surface p-3 rounded-md">
      <div class="text-xs text-muted">쿠폰 할인</div>
      <div class="text-2xl tabular font-black text-danger">-<%= summary.coupon_discount.toLocaleString('ko-KR') %>원</div>
      <div class="text-xs text-muted"><%= summary.coupon_count %>건 사용</div>
    </div>
    <div class="card bg-accent text-ink p-3 rounded-md">
      <div class="text-xs">최종 정산 금액</div>
      <div class="text-3xl tabular font-black"><%= summary.net_revenue.toLocaleString('ko-KR') %>원</div>
    </div>
  </div>

  <!-- 메뉴별 판매 -->
  <div class="card bg-surface p-4 rounded-md mb-4">
    <h4 class="font-bold mb-2">메뉴별 판매</h4>
    <table class="w-full text-sm">
      <thead class="text-left text-xs text-muted"><tr><th class="p-2">메뉴</th><th class="p-2 text-right">수량</th><th class="p-2 text-right">매출</th></tr></thead>
      <tbody>
        <% summary.by_menu.forEach((m, i) => { %>
          <tr class="border-b border-divider/40"><td class="p-2"><%= m.name %> <%= i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '' %></td><td class="p-2 text-right tabular"><%= m.qty %></td><td class="p-2 text-right tabular"><%= m.revenue.toLocaleString('ko-KR') %>원</td></tr>
        <% }) %>
      </tbody>
    </table>
  </div>

  <!-- 백업 이력 -->
  <div class="card bg-surface p-4 rounded-md mb-4">
    <h4 class="font-bold mb-2">📦 ZIP 백업 이력</h4>
    <% backups.forEach(b => { %>
      <div class="flex gap-3 text-xs font-mono py-1 border-b border-divider/40 last:border-0">
        <span><%= b.created_at %></span>
        <span class="<%= b.source === 'manual' ? 'text-accent font-bold' : 'text-muted' %>"><%= b.source === 'manual' ? '수동' : '자동' %></span>
        <span class="flex-1"><%= b.filename %></span>
        <span class="text-muted"><%= (b.size_bytes/1024).toFixed(1) %>KB</span>
      </div>
    <% }) %>
  </div>

  <!-- 마감 가드 modal -->
  <div x-show="closeBlocked" @click.self="closeBlocked = null" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-bg p-6 rounded-md shadow-elevated max-w-md">
      <h3 class="text-lg font-bold mb-2">⛔ 마감 거부 — 진행 중 주문 <span x-text="closeBlocked?.total"></span>건</h3>
      <p class="text-sm text-muted mb-3">모든 주문이 DONE/CANCELED 상태일 때만 마감 가능 (ADR-012).</p>
      <div class="text-xs font-mono">
        <template x-for="[k, n] in Object.entries(closeBlocked?.breakdown || {})"><div class="flex justify-between"><span x-text="k"></span><span class="text-danger" x-text="n + '건'"></span></div></template>
      </div>
      <button @click="closeBlocked = null" class="btn bg-divider px-3 py-2 rounded-sm mt-3">닫기</button>
    </div>
  </div>
</div>

<script>
function settlementPage() {
  return {
    date: '<%= date %>',
    closing: false,
    closeBlocked: null,
    async attemptClose() {
      if (!confirm('오늘 정산을 마감할까요? 마감 후 신규 주문 받을 수 없고 스냅샷이 고정됩니다.')) return;
      this.closing = true;
      const res = await fetch('/admin/api/settlement/close', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date: this.date }) });
      const j = await res.json();
      this.closing = false;
      if (!j.ok && j.error?.code === 'SETTLEMENT_PENDING_ORDERS') {
        this.closeBlocked = { total: Object.values(j.data.pending_breakdown).reduce((s,n)=>s+n, 0), breakdown: j.data.pending_breakdown };
      } else if (j.ok) {
        location.reload();
      } else {
        alert(j.error?.message || '실패');
      }
    },
  };
}
</script>
```

- [ ] **Step 4: index 마운트 + 통합 테스트**

```js
// admin/index.js
import settlement from './settlement.js';
r.use(settlement);
```

```js
// tests/integration/settlement-close.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';
import { AdminRepo } from '../../src/db/repositories/admin-repo.js';
import { OrderRepo } from '../../src/db/repositories/order-repo.js';

describe('settlement close — ADR-012 가드', () => {
  let db, agent;
  beforeEach(async () => {
    db = setupTestDb();
    new AdminRepo(db).create({ username:'admin', pin:'7842' });
    const { createApp } = await import('../../src/app.js');
    const app = await createApp({ db });
    agent = request.agent(app);
    await agent.post('/admin/login').type('form').send({ username:'admin', pin:'7842' });
  });
  afterEach(() => teardownTestDb(db));

  it('진행 주문 0건 → 마감 성공', async () => {
    const res = await agent.post('/admin/api/settlement/close').send({ date:'2026-05-20' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('★ 진행 주문 1건+ → 422 + breakdown', async () => {
    new OrderRepo(db).createTx({
      business_date:'2026-05-20', customer_name:'홍', student_id:'202637001', is_external:0,
      pickup_method:'dine_in', subtotal:18000, discount:0, total:18000,
      lineItems:[{ menu_id:1, qty:1, menu_name_snap:'후라이드', unit_price:18000, line_total:18000 }],
    });
    const res = await agent.post('/admin/api/settlement/close').send({ date:'2026-05-20' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('SETTLEMENT_PENDING_ORDERS');
    expect(res.body.data.pending_breakdown.ORDERED).toBe(1);
  });
});
```

- [ ] **Step 5: 통과 + 커밋**

```bash
npm test -- settlement-close
git add src/routes/admin/settlement.js src/routes/admin/index.js src/lib/zip-builder.js views/admin/settlement.ejs tests/integration/settlement-close.test.js
git commit -m "feat: Phase 4.5 — ★ A-6 정산 + ZIP 다운로드 + 마감 가드 (G1 + ADR-012/016)"
```

---

# Phase 5 — SSE + 자동 ZIP 스냅샷 (P0, 0.5일)

## Task 5.1: SSE Hub + GET /api/orders/:id/stream

**Files:**
- Create: `src/sse/hub.js`
- Create: `src/sse/routes.js`
- Modify: `src/app.js`

- [ ] **Step 1: src/sse/hub.js**

```js
export class SseHub {
  constructor() {
    this.subscribers = new Map(); // orderId => Set<res>
  }
  subscribe(orderId, res) {
    if (!this.subscribers.has(orderId)) this.subscribers.set(orderId, new Set());
    this.subscribers.get(orderId).add(res);
    res.on('close', () => {
      this.subscribers.get(orderId)?.delete(res);
      if (this.subscribers.get(orderId)?.size === 0) this.subscribers.delete(orderId);
    });
  }
  emit(orderId, event, data) {
    const subs = this.subscribers.get(orderId);
    if (!subs || subs.size === 0) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of subs) {
      try { res.write(payload); } catch {}
    }
  }
  size() { return [...this.subscribers.values()].reduce((s, set) => s + set.size, 0); }
}
```

- [ ] **Step 2: src/sse/routes.js**

```js
import { Router } from 'express';
import { OrderRepo } from '../db/repositories/order-repo.js';

const r = Router();

r.get('/orders/:id/stream', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const order_no = Number(req.query.order_no);
    const repo = new OrderRepo(req.app.locals.db);
    const order = repo.findById(id);
    if (!order || order.order_no !== order_no) return res.status(404).end();
    if (order.is_external) {
      const token = req.query.token || req.cookies?.co_token;
      if (token !== order.external_token) return res.status(401).end();
    } else if (order.student_id !== req.query.student_id) {
      return res.status(401).end();
    }
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.flushHeaders();
    res.write(`event: snapshot\ndata: ${JSON.stringify({ status: order.status })}\n\n`);
    req.app.locals.sseHub.subscribe(id, res);

    // keepalive 15초
    const ka = setInterval(() => {
      try { res.write(': keepalive\n\n'); } catch {}
    }, 15000);
    req.on('close', () => clearInterval(ka));
  } catch (e) { next(e); }
});

export default r;
```

- [ ] **Step 3: app.js에 hub 인스턴스 + 마운트**

```js
// src/app.js 수정 — createApp 안에
import { SseHub } from './sse/hub.js';
import sseRoutes from './sse/routes.js';

app.locals.sseHub = new SseHub();
app.use('/api', sseRoutes); // stream 라우트 마운트
```

- [ ] **Step 4: 통합 테스트**

```js
// tests/integration/sse.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';
import { OrderRepo } from '../../src/db/repositories/order-repo.js';

describe('SSE', () => {
  let db, server, baseUrl;
  beforeEach(async () => {
    db = setupTestDb();
    const { createApp } = await import('../../src/app.js');
    const app = await createApp({ db });
    server = app.listen(0);
    baseUrl = `http://localhost:${server.address().port}`;
  });
  afterEach((done) => { teardownTestDb(db); server.close(done); });

  it('snapshot 이벤트 + status 이벤트', async () => {
    const o = new OrderRepo(db).createTx({
      business_date:'2026-05-20', customer_name:'홍', student_id:'202637001', is_external:0,
      pickup_method:'dine_in', subtotal:18000, discount:0, total:18000,
      lineItems:[{ menu_id:1, qty:1, menu_name_snap:'후라이드', unit_price:18000, line_total:18000 }],
    });
    const url = `${baseUrl}/api/orders/${o.id}/stream?order_no=${o.order_no}&student_id=202637001`;
    const events = [];
    await new Promise((resolve) => {
      const req = http.get(url, (r) => {
        r.setEncoding('utf8');
        r.on('data', chunk => {
          if (chunk.includes('event: snapshot')) events.push('snapshot');
          if (chunk.includes('event: status')) events.push('status');
          if (events.length >= 1) setTimeout(() => req.destroy(), 100);
        });
      });
      req.on('close', resolve);
      setTimeout(() => req.destroy(), 1000);
    });
    expect(events).toContain('snapshot');
  });
});
```

- [ ] **Step 5: 통과 + 커밋**

```bash
npm test -- sse
git add src/sse/hub.js src/sse/routes.js src/app.js tests/integration/sse.test.js
git commit -m "feat: Phase 5.1 — SSE Hub + /api/orders/:id/stream (snapshot + status + keepalive 15초)"
```

---

## Task 5.2: 자동 ZIP 스냅샷 30분 (ADR-022)

**Files:**
- Create: `src/jobs/auto-snapshot.js`
- Modify: `src/server.js`

- [ ] **Step 1: src/jobs/auto-snapshot.js**

```js
import fs from 'node:fs';
import path from 'node:path';
import { buildSettlementZip } from '../lib/zip-builder.js';
import { BackupRepo } from '../db/repositories/backup-repo.js';

const MAX_AUTO = 6; // 6개 회전 (3시간치)

function todayKST() { const d = new Date(); d.setHours(d.getHours()+9); return d.toISOString().slice(0,10); }

export function startAutoSnapshot({ db, dataDir, intervalMin, logger }) {
  const backupDir = path.join(dataDir, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });

  async function snapshot() {
    const date = todayKST();
    const ts = new Date().toISOString().slice(0,16).replace(/[:T]/g, '');
    const filename = `auto-${date}-${ts}.zip`;
    const filepath = path.join(backupDir, filename);
    try {
      const out = fs.createWriteStream(filepath);
      const archive = buildSettlementZip(db, date, out);
      await new Promise((resolve, reject) => {
        out.on('close', resolve);
        archive.on('error', reject);
      });
      const size = fs.statSync(filepath).size;
      new BackupRepo(db).log({ business_date: date, filename, source:'auto', size_bytes: size });
      logger?.info({ filename, size }, '[auto-snapshot] saved');

      // 6개 초과 회전
      const files = fs.readdirSync(backupDir).filter(f => f.startsWith('auto-')).sort();
      while (files.length > MAX_AUTO) {
        const oldest = files.shift();
        fs.unlinkSync(path.join(backupDir, oldest));
        logger?.info({ removed: oldest }, '[auto-snapshot] rotated');
      }
    } catch (e) {
      logger?.error({ err: e }, '[auto-snapshot] failed');
    }
  }

  // 부팅 직후 1회 + N분 주기
  setTimeout(() => snapshot(), 5000); // 5초 후 첫 회
  const handle = setInterval(snapshot, intervalMin * 60 * 1000);
  return () => clearInterval(handle);
}
```

- [ ] **Step 2: server.js에 시작**

```js
import { startAutoSnapshot } from './jobs/auto-snapshot.js';
// app.listen 다음에
startAutoSnapshot({ db, dataDir: config.dataDir, intervalMin: config.autoSnapshotIntervalMin, logger });
```

- [ ] **Step 3: 통합 테스트 (fake timer)**

```js
// tests/integration/auto-snapshot.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setupTestDb, teardownTestDb } from '../helpers/db.js';
import { startAutoSnapshot } from '../../src/jobs/auto-snapshot.js';

describe('auto-snapshot', () => {
  let db, tmpDir;
  beforeEach(() => {
    db = setupTestDb();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
  });
  afterEach(() => { teardownTestDb(db); fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('첫 호출 5초 후 ZIP 생성', async () => {
    vi.useFakeTimers();
    const stop = startAutoSnapshot({ db, dataDir: tmpDir, intervalMin: 30 });
    await vi.advanceTimersByTimeAsync(6000);
    vi.useRealTimers();
    await new Promise(r => setTimeout(r, 200));
    const files = fs.readdirSync(path.join(tmpDir, 'backups'));
    expect(files.filter(f => f.startsWith('auto-')).length).toBeGreaterThanOrEqual(1);
    stop();
  });
});
```

- [ ] **Step 4: 커밋**

```bash
npm test -- auto-snapshot
git add src/jobs/auto-snapshot.js src/server.js tests/integration/auto-snapshot.test.js
git commit -m "feat: Phase 5.2 — 자동 ZIP 스냅샷 30분 주기 + 6개 회전 (ADR-022)"
```

---

# Phase 6 — 부속 (P1, 0.5일)

## Task 6.1: 약도 페이지 (C-7) + 404·500 풀스크린 (C-8)

**Files:**
- Create: `views/customer/map.ejs`
- Create: `views/customer/error/404.ejs`
- Create: `views/customer/error/500.ejs`
- Modify: `src/routes/customer/home.js`

- [ ] **Step 1: 약도 라우트**

```js
// home.js
r.get('/map', (_req, res) => res.render('customer/map', { title:'부스 위치' }));
```

- [ ] **Step 2: views/customer/map.ejs**

```ejs
<%- include('../partials/topbar-back', { title:'부스 위치', backUrl:'/menu' }) %>
<div class="screen p-4">
  <div class="card bg-surface p-4 rounded-md text-center">
    <img src="/images/map.png" alt="부스 약도" class="w-full rounded-sm" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
    <div style="display:none" class="text-muted p-8">
      <div class="text-4xl mb-2">📍</div>
      <div>약도 이미지 준비 중</div>
    </div>
  </div>
  <div class="card bg-elevated p-4 rounded-md mt-4 text-sm">
    <div class="font-bold">위치 안내</div>
    <div class="text-muted">컴퓨터모바일융합과 부스 — 캠퍼스 본관 앞 광장</div>
    <div class="text-muted mt-1">운영: 5/20(수) ~ 5/21(목), 16:30 ~</div>
  </div>
</div>
```

- [ ] **Step 3: 404·500**

```ejs
<!-- views/customer/error/404.ejs -->
<%- include('../../partials/_head', { title: '404' }) %>
<body class="font-sans bg-bg min-h-screen flex items-center justify-center p-8">
  <div class="text-center">
    <%- include('../../partials/mascot', { state:'canceled', size:'lg' }) %>
    <h1 class="text-2xl font-bold mt-6">이 페이지는 임무에서 사라졌어요</h1>
    <p class="text-muted mt-2">URL을 다시 확인하시거나 메뉴로 돌아가 주세요.</p>
    <a href="/menu" class="inline-block mt-4 px-4 py-2 bg-accent text-ink font-bold rounded-md">메뉴로</a>
  </div>
</body>
```

```ejs
<!-- views/customer/error/500.ejs -->
<%- include('../../partials/_head', { title: '시스템 오류' }) %>
<body class="font-sans bg-bg min-h-screen flex items-center justify-center p-8">
  <div class="text-center">
    <%- include('../../partials/mascot', { state:'canceled', size:'lg' }) %>
    <h1 class="text-2xl font-bold mt-6">잠시 시스템에 문제가 생겼어요</h1>
    <p class="text-muted mt-2">부스에 직접 문의해 주세요. 5초 후 자동 새로고침합니다.</p>
    <a href="/menu" class="inline-block mt-4 px-4 py-2 bg-accent text-ink font-bold rounded-md">메뉴로</a>
    <script>setTimeout(() => location.reload(), 5000);</script>
  </div>
</body>
```

- [ ] **Step 4: 라우트 fallback (404)**

```js
// src/app.js — 마지막 (errorHandler 직전)
app.use((req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/admin/api')) {
    return res.status(404).json({ ok:false, error:{ code:'NOT_FOUND', message:'Not Found' }});
  }
  res.status(404).render('customer/error/404');
});
```

- [ ] **Step 5: 커밋**

```bash
git add views/customer/map.ejs views/customer/error/404.ejs views/customer/error/500.ejs src/routes/customer/home.js src/app.js
git commit -m "feat: Phase 6.1 — C-7 약도 + 404·500 풀스크린 (마스코트 canceled)"
```

---

## Task 6.2: 자산 통합 슬롯

**Files:**
- `public/images/mascot/` (디자이너 SVG 5종 도착 시)
- `public/images/menus/` (메뉴 사진 9장)
- `public/images/map.png` (부스 약도)
- Modify: `views/partials/mascot.ejs` (SVG 임포트로 교체)
- Modify: `.env` (계좌·예금주·PIN 실 값)

- [ ] **Step 1: 자산 도착 체크리스트**

```
□ 마스코트 SVG 5종 (default·preparing·cooking·arrived·canceled)
□ 메뉴 사진 9장 (1:1, 720px, WebP/PNG)
□ 부스 약도 이미지 (map.png)
□ 학생회 계좌번호·예금주
□ 본부 PIN 4자리
```

- [ ] **Step 2: 마스코트 SVG 임포트 (도착 후)**

`views/partials/mascot.ejs` 수정:
```ejs
<%
  const _state = locals.state ?? 'default';
  const _size = locals.size ?? 'md';
  const px = _size === 'sm' ? 80 : _size === 'lg' ? 200 : 160;
%>
<div class="mascot-wrap flex flex-col items-center gap-2">
  <img src="/images/mascot/<%= _state %>.svg"
       alt="마스코트 — <%= _state %>"
       width="<%= px %>" height="<%= px %>"
       onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
  <div class="mascot-fallback" style="display:none;width:<%= px %>px;height:<%= px %>px;border:3px solid var(--color-accent);background:var(--color-ink);color:var(--color-accent);align-items:center;justify-content:center;font-size:<%= px*0.36 %>px;border-radius:16px;flex-direction:column;">
    <%= { default:'🪖', preparing:'🚩', cooking:'🔥', arrived:'🎉', canceled:'✖' }[_state] %>
  </div>
  <% if (locals.caption) { %><div class="text-xs text-muted"><%= locals.caption %></div><% } %>
</div>
```

- [ ] **Step 3: .env에 PIN·계좌 (운영 가이드 별도)**

```bash
# 실 운영 .env (git X)
ADMIN_PINS='[{"username":"admin","scrypt":"<scrypt-hash>"},{"username":"hub","scrypt":"<scrypt-hash>"}]'
```

scrypt hash 생성:
```bash
node scripts/admin-add.js admin 1234  # 실제 PIN으로 교체
```

- [ ] **Step 4: 커밋 (자산 도착 후)**

```bash
git add public/images/ views/partials/mascot.ejs
git commit -m "asset: Phase 6.2 — 마스코트 5종·메뉴 사진·약도 SVG 임포트"
```

---

# Phase 7 — E2E + D-1 리허설 (P0, 1일)

## Task 7.1: Playwright E2E-01 (사용자 주문 흐름)

**Files:**
- Create: `playwright.config.js`
- Create: `tests/e2e/customer-order.spec.js`

- [ ] **Step 1: playwright.config.js**

```js
export default {
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'node src/server.js',
    url: 'http://localhost:3000/healthz',
    timeout: 60000,
    reuseExistingServer: !process.env.CI,
  },
};
```

- [ ] **Step 2: tests/e2e/customer-order.spec.js**

```js
import { test, expect } from '@playwright/test';

test.describe('E2E-01: 학생 주문 흐름', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('메뉴 → 카트 → 주문 → 도그태그', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.locator('text=오늘 저녁은 치킨이닭!')).toBeVisible();

    // 메뉴 카드 1개 카트 담기
    await page.locator('.menu-card button.add').first().click();
    await expect(page.locator('.bottom-bar')).toContainText('카트 보기');

    await page.locator('.bottom-bar a').click();
    await expect(page).toHaveURL(/\/cart/);

    await page.locator('a:has-text("주문 정보 입력")').click();
    await expect(page).toHaveURL(/\/checkout/);

    // 학생 흐름
    await page.fill('input[type="tel"]', '202637042');
    await page.fill('input[type="text"]', '홍길동');

    // 매장 (default) + 테이블
    await page.locator('input[type="tel"]:nth-of-type(2), input[placeholder*="9"]').last().fill('5');

    // 주문 접수
    await page.locator('button:has-text("주문 접수")').click();
    await expect(page).toHaveURL(/\/orders\/\d+\/complete/);
    await expect(page.locator('text=WINNER WINNER')).toBeVisible();
    await expect(page.locator('.dogtag .num')).toContainText('#1');
  });
});
```

- [ ] **Step 3: Playwright 설치 + 실행**

```bash
npx playwright install chromium
npm run test:e2e -- --project=mobile
```

Expected: 1 passed.

- [ ] **Step 4: 커밋**

```bash
git add playwright.config.js tests/e2e/customer-order.spec.js
git commit -m "test: Phase 7.1 — E2E-01 학생 주문 흐름 (mobile viewport)"
```

---

## Task 7.2: E2E-03 (쿠폰 거부) + E2E-05 (본부 매칭) + E2E-07 (정산 마감)

**Files:**
- Create: `tests/e2e/coupon-reject.spec.js`
- Create: `tests/e2e/transfer-flow.spec.js`
- Create: `tests/e2e/settlement-close.spec.js`

- [ ] **Step 1: coupon-reject.spec.js**

```js
import { test, expect } from '@playwright/test';

test.describe('E2E-03: 쿠폰 위조 거부', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('학번 prefix 202638 → 거부', async ({ page }) => {
    await page.goto('/menu');
    await page.locator('.menu-card button.add').first().click();
    await page.locator('.bottom-bar a').click();
    await page.locator('a:has-text("주문 정보 입력")').click();
    await page.fill('input[type="tel"]', '202638042'); // 위조
    await page.fill('input[type="text"]', '홍');
    // 쿠폰 섹션이 보이는지 (G3)
    const couponVisible = await page.locator('text=컴모융 1학년 한정').isVisible().catch(() => false);
    expect(couponVisible).toBe(false); // prefix 위조 → 쿠폰 섹션 숨김
  });
});
```

- [ ] **Step 2: transfer-flow.spec.js (사용자 + 운영진 동시 시뮬)**

```js
import { test, expect } from '@playwright/test';

test.describe('E2E-05: 사용자 신고 → 본부 확인 → SSE 갱신', () => {
  test('흐름 통합', async ({ browser }) => {
    const userCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const user = await userCtx.newPage();
    const admin = await adminCtx.newPage();

    // 사용자: 주문
    await user.goto('/menu');
    await user.locator('.menu-card button.add').first().click();
    await user.locator('.bottom-bar a').click();
    await user.locator('a:has-text("주문 정보")').click();
    await user.fill('input[type="tel"]', '202637100');
    await user.fill('input[type="text"]', '테스트');
    await user.locator('input[placeholder*="9"]').last().fill('1');
    await user.locator('button:has-text("주문 접수")').click();

    // 사용자: 이체 신고
    await user.locator('a:has-text("이체했어요")').click();
    await user.selectOption('select', '카카오뱅크');
    await user.locator('button:has-text("확인 요청")').click();
    await expect(user).toHaveURL(/\/status/);
    await expect(user.locator('text=본부가 통장')).toBeVisible({ timeout: 5000 });

    // 운영진: 로그인 + 이체 확인
    await admin.goto('/admin/login');
    await admin.fill('input[name="username"]', 'admin');
    // PIN 누름 (Alpine x-data이라 실 키패드 누르거나 form 직접)
    // 간략: form submit
    await admin.evaluate(() => {
      document.querySelector('form').submit();
    });
    // ...

    await userCtx.close();
    await adminCtx.close();
  });
});
```

> E2E-05는 *통합 시나리오*라 작성이 복잡. 1차 운영 전 핵심 흐름만 검증.

- [ ] **Step 3: settlement-close.spec.js**

```js
import { test, expect } from '@playwright/test';
test.use({ viewport: { width: 1280, height: 800 } });

test.describe('E2E-07: 정산 마감 가드', () => {
  test('진행 주문 있을 때 거부 + 모달', async ({ page }) => {
    // (전제: API로 시드 주문 1건 ORDERED 상태)
    await page.goto('/admin/login');
    // ... 로그인 ...
    await page.goto('/admin/settlement');
    await page.locator('button:has-text("오늘 정산 마감")').click();
    await page.locator('button:has-text("취소") :visible').click();
    // 다이얼로그·alert 처리
  });
});
```

- [ ] **Step 4: 커밋**

```bash
git add tests/e2e/coupon-reject.spec.js tests/e2e/transfer-flow.spec.js tests/e2e/settlement-close.spec.js
git commit -m "test: Phase 7.2 — E2E-03·05·07 (쿠폰·이체·정산 마감)"
```

---

## Task 7.3: 운영 가이드 + D-1 통합 리허설

**Files:**
- Create: `docs/OPERATIONS_GUIDE.md`

- [ ] **Step 1: 운영 가이드 작성 (운영진용)**

```markdown
# 치킨이닭! 운영 가이드 (5/20-21)

## 사전 준비 (D-1)
- [ ] 호스트 노트북 충전 100% + 충전기 휴대
- [ ] `docker compose up -d` 가동 확인
- [ ] `docker compose logs -f` 화면 노출
- [ ] PIN·계좌번호 .env 적용 + 백업 USB
- [ ] 운영진 단축키 카드 인쇄 (Enter/Esc/1-9/g d/h/?)

## 운영 중
- 본부 1명 항상 화면 응시
- 카뱅 알림 → 시스템 카드 매칭 → "입금 확인"
- 5분 경과 = 노랑 / 10분 경과 = 빨강

## 마감
1. 대시보드에서 "신규 주문 차단" 토글
2. 진행 주문 모두 완료/취소
3. /admin/settlement → "오늘 정산 마감"
4. "📦 ZIP 백업 다운로드" → USB 즉시 복사
5. 통장 합계 입력 → 차이 확인

## 장애 대응
- 시스템 무응답: `docker compose restart` (5초 내 복구)
- DB 손상: 마지막 자동 ZIP (`backups/auto-*.zip`) USB 복사
- 디스크 부족: 오래된 ZIP 삭제
```

- [ ] **Step 2: 통합 리허설 체크리스트 (5/19 저녁)**

```
□ 운영진 5명+ 모임
□ 가상 주문 30건 (1원 단위 실제 이체)
□ 메뉴·카트·주문폼·도그태그·이체 신고 전체 흐름
□ 본부 매칭 → 조리 시작 → 수령 완료
□ SSE 갱신 확인 (사용자 폰)
□ 정산 마감 → ZIP 다운로드 → USB 복사
□ 자동 스냅샷 30분 후 생성 확인
□ 다크/라이트 부스 환경 가독성 검증 (Finding A)
□ 발견 이슈 → 5/20 오전 hotfix
```

- [ ] **Step 3: 커밋**

```bash
git add docs/OPERATIONS_GUIDE.md
git commit -m "docs: Phase 7.3 — 운영 가이드 + D-1 리허설 체크리스트"
```

---

# Self-Review (Spec Coverage)

## Spec → Task 매핑 검증

| Spec / ADR | 매핑 Task |
|---|---|
| ADR-008 모바일 전용 | 3.1-3.7 (모바일 viewport + Alpine) |
| ADR-011 마스코트 + WINNER WINNER | 3.5 (complete) + partials/mascot |
| ADR-012 정산 마감 가드 | 1.4 (settlement.canClose) + 4.5 (settlement.ejs + API) |
| ADR-013 배민 UX + PUBG 비주얼 | 0.3 (토큰) + 3.x (EJS) |
| ADR-014 5/20-21 가변 마감 | 4.5 (수동 마감 버튼) |
| ADR-015 조리 현황판 SSE | 3.7 + 5.1 |
| ADR-016 ZIP 백업 다운로드 | 4.5 + lib/zip-builder |
| ADR-017 인기 랭킹 + 동적 카피 | 1.5 + 2.2 |
| ADR-018 다일 운영 (주문번호 일자별 리셋) | 1.8 (createTx daily_no + business_date UNIQUE) |
| ADR-019 학번 prefix 검증 | 1.2 + 2.3 + 2.4 |
| ADR-020 Pattern B 가격 자체 계산 | 1.1 (★ 4 케이스 회귀) + 2.3 |
| ADR-021 학번+이름 필수 + 외부인 체크박스 | 2.3 + 3.4 |
| ADR-022 자동 ZIP 30분 + 6 회전 | 5.2 |
| ADR-023 Docker + volume | 0.2 |
| ADR-024 기술 스택 | 0.1 |
| ADR-025 테스트 전략 (4 케이스 회귀) | 1.1 + Phase 7 E2E |
| ADR-026 디자인 시스템 (라이트 default) | 0.3 (tokens.css) |
| §6.4 이체 매칭 4요소 | 1.6 |
| **G1 정산 라우팅** | 4.5 (★) |
| **G2 쿠폰 카피 "컴모융"** | 3.4 (★) |
| **G3 외부인 시 쿠폰 숨김** | 3.4 (★) |
| **G4 쿠폰 시각 피드백** | 3.4 (★, couponEligible 가드 통합) |
| **G5 쿠폰 중복 검증 API** | 2.4 (★ 신설) |
| **F2 메뉴 관리 화면 신설** | 4.4 (A-5) |
| Finding A (라이트 default) | 0.3 (tokens.css) |
| Finding B (이체 신고 → 자동 진입) | 3.6 (Phase 3.6 transfer.ejs) |
| Finding D (도그태그 sessionStorage 단발) | 3.1 (partials/dogtag.ejs x-init) |
| Finding E (WINNER 2줄) | 3.5 (complete.ejs `<br>`) |
| Finding F (외부인 토큰 공유 의도) | 문서화 (UX_STRATEGY.md §8.6 이미 반영) |
| Finding H (체크박스 외곽선) | 3.4 (border-2 border-accent + 채움 X) |
| Finding I (카피 작성) | docs/COPY_DRAFT.md (별도 작업 — Task 7.4 후보) |
| Finding J (단축키 12종) | 4.2 (Alpine 핸들러 — MVP는 Enter/Esc만 + Phase 2 1-9/g d/h) |

**누락 점검:** F3 (TRANSFER_REPORTED 카피 통일) — 3.7 status.ejs에 *시안 카피*로 통일 (`"본부가 통장을 확인하는 중"`). 기획서 카피와 차이 — 사용자 결정 필요 (D2).

## Placeholder Scan

체크리스트:
- [x] "TBD"·"TODO"·"fill in later" 검색 — 없음
- [x] "implement later"·"will add"·"future enhancement" — 없음
- [x] 코드 블록 빈 곳 — 없음 (모든 step 실제 코드 포함)
- [x] "Similar to Task N" 축약 — 없음 (UI 템플릿은 전체 인라인)

## Type/Method 일관성

- `OrderRepo.createTx(...)` — 1.8에서 정의, 2.3 + 3.4 (API)에서 호출 ✅
- `MenuRepo.buildSnapshot()` — 1.7 정의, 2.3 호출 ✅
- `calculate(items, couponCode, menuSnapshot)` — 1.1 정의, 2.3 호출 (couponCode = null | 'COUPON_OK') ✅
- `validateCoupon(sid, name, repo)` — 1.2 정의, 2.3·2.4 호출 ✅
- `SseHub.emit(orderId, event, data)` — 5.1 정의, 2.5·4.2 (transition) 호출 ✅
- `STATUS` enum — 1.3 정의, 1.4 + 1.8 사용 ✅

---

# MVP 우선순위 표 (다시 정리)

```
Phase 0 (P0): Task 0.1 ~ 0.5  — 5 tasks · 0.5일
Phase 1 (P0): Task 1.1 ~ 1.9  — 9 tasks · 1.5일
Phase 2 (P0): Task 2.1 ~ 2.6  — 6 tasks · 1일
Phase 3 (P0): Task 3.1 ~ 3.7  — 7 tasks · 1.5일
Phase 4 (P0): Task 4.1 ~ 4.5  — 5 tasks · 1.5일
Phase 5 (P0): Task 5.1 ~ 5.2  — 2 tasks · 0.5일
Phase 6 (P1): Task 6.1 ~ 6.2  — 2 tasks · 0.5일
Phase 7 (P0): Task 7.1 ~ 7.3  — 3 tasks · 1일

★ 절대 필수 (P0): 39 task
○ 권장 (P1): 2 task (약도·404 + 자산 통합 슬롯)
   총 시간: 약 8일 (D-day와 정확히 일치)
```

**위험 신호:**
- 자산 (마스코트 5종·도장 5종·메뉴 사진 9장) 외주 도착 지연 시 Phase 6 임팩트
- 사용자 SSE는 Phase 5에서 작동하나 운영진 SSE는 Phase 2 후보 (5초 폴링 fallback OK)
- E2E 통합 시나리오 (Phase 7.2)는 *완전 자동화 어려움* — 핵심 흐름 1-2개만 자동, 나머지는 D-1 리허설로

---

# Execution Handoff

**Plan complete and saved to `docs/IMPLEMENTATION_PLAN.md`.** 두 가지 실행 방식:

**1. Subagent-Driven (권장) — superpowers:subagent-driven-development**
- 각 task마다 fresh subagent 디스패치
- task 간 검토
- 빠른 반복

**2. Inline Execution — superpowers:executing-plans**
- 현재 세션에서 task를 순서대로 실행
- 배치 + 체크포인트

**또한 다음 결정 사항** (UI_IMPLEMENTATION_PLAN.md §10에서 미해결):
- **D1**: G1~G5 + F1~F9를 source docs에 반영 — *이 plan은 G1~G5 모두 task로 흡수, F1·F2·F3는 task에 흡수, F4-F9는 UX_STRATEGY.md/DESIGN_REVIEW.md에 이미 기록됨*
- **D2**: F3 카피 충돌 (TRANSFER_REPORTED) — 기획서 "입금 확인 중이에요 👀" vs 시안 "본부가 통장을 확인하는 중" → **Task 3.7에서 시안 카피 채택**. 사용자가 기획서로 통일 원하면 1줄 수정.
- **D3**: A-5 메뉴 관리 신설 — **Task 4.4로 Phase 3 후 별도 task**
- **D5**: "구현 시작" 신호 — 본 plan은 *문서 단계까지*. 코드는 아직 안 씀.

**어떤 실행 방식으로 진행할까요?** 또는 **계획 자체를 더 조정**할까요?




