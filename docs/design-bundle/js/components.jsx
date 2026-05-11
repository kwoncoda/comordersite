/* ============================================================
   components.jsx — Atoms / Molecules / shared bits
   Token mapping: see DESIGN.md §3–§9
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;

/* ─────────── Utility ─────────── */
const won = (n) => n.toLocaleString('ko-KR') + '원';
const pad = (n, len = 2) => String(n).padStart(len, '0');

/* ─────────── Mascot — placeholder, stencil silhouette ───────────
   The real asset = 5 variants of a military-helmet bear.
   In design system this is reserved for a designer — we render a
   placeholder block tagged with the variant + caption so we don't
   commit to an "AI-drawn cute bear" (slop pattern). */
function Mascot({ state = 'default', size = 'md', caption }) {
  const px = size === 'sm' ? 80 : size === 'lg' ? 200 : 160;
  const stateMap = {
    default:   { glyph: '🪖', label: 'DEFAULT' },
    preparing: { glyph: '🚩', label: 'PREP' },
    cooking:   { glyph: '🔥', label: 'COOKING' },
    arrived:   { glyph: '🎉', label: 'ARRIVED' },
    canceled:  { glyph: '✖',  label: 'ABORT' },
  };
  const s = stateMap[state] || stateMap.default;
  const idle = state === 'cooking';
  return (
    <div className="mascot-wrap" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 8 }}>
      <div
        aria-label={`마스코트 — ${s.label}`}
        style={{
          width: px, height: px,
          background: 'var(--color-ink)',
          border: '3px solid var(--color-accent)',
          borderRadius: 16,
          display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          color: 'var(--color-accent)',
          position: 'relative',
          boxShadow: 'var(--shadow-card)',
          animation: idle ? 'pulse-mascot 2.4s ease-in-out infinite' : 'none',
          overflow: 'hidden',
        }}>
        {/* digital camo overlay */}
        <div style={{
          position:'absolute', inset:0, opacity:0.18, pointerEvents:'none',
          background:
            'repeating-linear-gradient(0deg, rgba(244,210,0,0.4) 0 6px, transparent 6px 14px),' +
            'repeating-linear-gradient(90deg, rgba(154,142,107,0.4) 0 6px, transparent 6px 14px)',
        }}/>
        <div style={{ fontSize: px * 0.36, lineHeight: 1, filter:'grayscale(0.1)' }}>{s.glyph}</div>
        <div style={{
          fontFamily: 'var(--font-stencil)',
          letterSpacing: '0.12em',
          fontSize: 10,
          marginTop: 6,
          opacity: 0.7,
        }}>MASCOT // {s.label}</div>
      </div>
      {caption && <div className="mascot-caption">{caption}</div>}
      <style>{`@keyframes pulse-mascot {0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-3px) rotate(-1deg)}}`}</style>
    </div>
  );
}

/* ─────────── Button ─────────── */
function Button({
  variant = 'primary', size = 'md',
  loading, disabled, onClick, children, block, type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'btn',
        'btn-' + variant,
        'btn-' + size,
        block && 'btn-block',
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {loading && <span className="spinner sm" />}
      {!loading && children}
    </button>
  );
}

/* ─────────── Field / Input / Select ─────────── */
function Field({ label, hint, error, required, htmlFor, children }) {
  return (
    <div className="fld">
      {label && (
        <label className="fld-label" htmlFor={htmlFor}>
          {label}{required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <div className="fld-hint">{hint}</div>}
      {error && <div className="fld-error" role="alert">⚠️ {error}</div>}
    </div>
  );
}
function Input({ error, className = '', ...rest }) {
  return <input className={['input', error && 'is-error', className].filter(Boolean).join(' ')} {...rest} />;
}
function Select({ error, children, className = '', ...rest }) {
  return (
    <select className={['select', error && 'is-error', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </select>
  );
}

/* ─────────── Checkbox (outline-only, follows DESIGN §4.2) ─────────── */
function Checkbox({ checked, onChange, children, sub }) {
  return (
    <label className={'checkbox' + (checked ? ' is-checked' : '')}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="box" aria-hidden="true" />
      <span className="meta">
        <span>{children}</span>
        {sub && <span className="sub">{sub}</span>}
      </span>
    </label>
  );
}

/* ─────────── Radio (segmented) ─────────── */
function RadioGroup({ value, onChange, options }) {
  return (
    <div className="radio-group" role="radiogroup">
      {options.map((opt) => (
        <label key={opt.value} className={'radio' + (value === opt.value ? ' is-checked' : '')}>
          <input type="radio" checked={value === opt.value} onChange={() => onChange(opt.value)} />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

/* ─────────── Stamp ─────────── */
function Stamp({ kind = 'recommended', children, animating, rotate }) {
  const text = children ||
    (kind === 'recommended' ? 'RECOMMENDED' :
     kind === 'sold-out'    ? 'SOLD OUT' :
     kind === 'paid'        ? 'PAID' :
     kind === 'done'        ? 'DONE' :
     kind === 'canceled'    ? 'CANCELED' : kind);
  const style = rotate != null ? { '--rot': rotate + 'deg', transform: `rotate(${rotate}deg)` } : {};
  return (
    <span
      className={['stamp', 'stamp-' + kind, animating && 'stamping'].filter(Boolean).join(' ')}
      style={style}
    >
      {text}
    </span>
  );
}

/* ─────────── DogTag ─────────── */
function DogTag({ num, total = 100, date = '2026-05-20', size = 'md', dropping }) {
  return (
    <div
      className={['dogtag', size !== 'md' && size, dropping && 'dropping'].filter(Boolean).join(' ')}
      role={dropping ? 'status' : undefined}
      aria-live={dropping ? 'polite' : undefined}
    >
      <span className="num">#{num}/{total}</span>
      <span className="meta">{date}</span>
    </div>
  );
}

/* ─────────── StatusChip ─────────── */
const STATUS_LABELS = {
  ORDERED:           { label: '주문중',      cls: 'chip-ordered',  icon: '⏳' },
  TRANSFER_REPORTED: { label: '이체확인요청', cls: 'chip-transfer', icon: '💸' },
  PAID:              { label: '이체완료',    cls: 'chip-paid',     icon: '✓' },
  COOKING:           { label: '조리중',      cls: 'chip-cooking',  icon: '🔥' },
  READY:             { label: '수령가능',    cls: 'chip-ready',    icon: '✅' },
  DONE:              { label: '수령완료',    cls: 'chip-done',     icon: '🎉' },
  CANCELED:          { label: '취소',        cls: 'chip-canceled', icon: '✖' },
  HOLD:              { label: '보류',        cls: 'chip-hold',     icon: '⚠️' },
};
function StatusChip({ status }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.ORDERED;
  return <span className={'chip ' + s.cls}>{s.icon} {s.label}</span>;
}

/* ─────────── CountBadge ─────────── */
function CountBadge({ value, variant = 'default' }) {
  return <span className={'count-badge' + (variant !== 'default' ? ' ' + variant : '')}>{value}</span>;
}

/* ─────────── Menu fallback (no real photo) ─────────── */
function MenuFallback({ category }) {
  const map = {
    치킨:   { emoji: '🍗', color: 'rgba(244,210,0,0.18)' },
    사이드: { emoji: '🍟', color: 'rgba(229,155,12,0.18)' },
    음료:   { emoji: '🥤', color: 'rgba(58,107,126,0.18)' },
  };
  const c = map[category] || map.치킨;
  return (
    <div className="menu-fallback" style={{ '--cat-color': c.color }}>
      <span className="emoji">{c.emoji}</span>
      <span className="label">// 부스 사진</span>
    </div>
  );
}

/* ─────────── EmptyState / LoadingState / ErrorState ─────────── */
function EmptyState({ mascot = 'default', title, body, ctaLabel, onCta }) {
  return (
    <div className="col gap-4 center" style={{ padding: '48px 24px', alignItems:'center' }}>
      <Mascot state={mascot} size="sm" />
      <div className="col gap-2" style={{ alignItems:'center' }}>
        <div className="h2">{title}</div>
        {body && <div className="muted" style={{ fontSize: 14 }}>{body}</div>}
      </div>
      {ctaLabel && <Button variant="primary" size="md" onClick={onCta}>{ctaLabel}</Button>}
    </div>
  );
}

function LoadingState({ label = '불러오는 중...', size = 'md' }) {
  return (
    <div className="col gap-3 center" style={{ alignItems:'center', padding: '32px 24px' }}>
      <span className={'spinner ' + size} />
      <div className="muted" style={{ fontSize: 13 }}>{label}</div>
    </div>
  );
}

function ErrorState({ kind = 'inline-card', title, body, ctaLabel, onCta }) {
  if (kind === 'banner-top') {
    return (
      <div className="warn-banner" role="alert">
        <span>⚠️</span>
        <span>{title}</span>
        {onCta && <button className="btn btn-ghost btn-xs" onClick={onCta} style={{ marginLeft:'auto' }}>{ctaLabel || '재시도'}</button>}
      </div>
    );
  }
  return (
    <div className="col gap-3 center" style={{ padding: '32px 24px', alignItems:'center' }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <div className="h3">{title}</div>
      {body && <div className="muted" style={{ fontSize: 13, textAlign: 'center', maxWidth: 280 }}>{body}</div>}
      {onCta && <Button variant="secondary" size="md" onClick={onCta}>{ctaLabel || '다시 시도'}</Button>}
    </div>
  );
}

/* ─────────── Timeline (5-step cooking progress) ─────────── */
const TIMELINE_STEPS = [
  { key: 'ORDERED',  short: '접수' },
  { key: 'PAID',     short: '입금' },
  { key: 'COOKING',  short: '조리' },
  { key: 'READY',    short: '마무리' },
  { key: 'DONE',     short: '수령' },
];
function Timeline({ status }) {
  // map current status to step index
  const idx = (() => {
    switch (status) {
      case 'ORDERED':           return 0;
      case 'TRANSFER_REPORTED': return 1; // mid-step "spinner"
      case 'PAID':              return 1;
      case 'COOKING':           return 2;
      case 'READY':             return 3;
      case 'DONE':              return 4;
      default:                  return 0;
    }
  })();
  const fillPct = (idx / 4) * 72 + (idx === 0 ? 0 : 0);
  return (
    <div className="timeline" role="progressbar"
      aria-valuemin="0" aria-valuemax="4" aria-valuenow={idx}>
      <div className="fill" style={{ width: (idx === 0 ? 0 : (idx / 4) * 72) + '%' }} />
      {TIMELINE_STEPS.map((s, i) => (
        <div key={s.key} className={'node ' + (i < idx ? 'done' : i === idx ? 'current' : '')}>
          <span className="dot">{i < idx ? '✓' : i + 1}</span>
          <span className="label">{s.short}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────── Mock data ─────────── */
const MENUS = [
  { id:'m1', name:'후라이드 치킨', cat:'치킨', price:18000, recommended:true },
  { id:'m2', name:'양념 치킨',     cat:'치킨', price:19000 },
  { id:'m3', name:'뿌링클',        cat:'치킨', price:21000, recommended:true, popular:1 },
  { id:'m4', name:'간장 치킨',     cat:'치킨', price:20000, soldOut:true },
  { id:'m5', name:'감자튀김',      cat:'사이드', price:4000 },
  { id:'m6', name:'치즈스틱',      cat:'사이드', price:5000 },
  { id:'m7', name:'콜라',          cat:'음료', price:2000 },
  { id:'m8', name:'사이다',        cat:'음료', price:2000 },
  { id:'m9', name:'제로콜라',      cat:'음료', price:2000 },
];

const CATEGORIES = ['전체', '🔥인기', '⭐추천', '치킨', '사이드', '음료'];

/* mock admin orders pool (used by dashboard, detail, transfers) */
const MOCK_ORDERS_SEED = [
  { id:13, who:'박민수', sid:'202637038', items:[['m1',1],['m7',1]], total:20000, table:5, mode:'매장', status:'COOKING',  bank:'카카오뱅크', ageMin:3 },
  { id:14, who:'이영희', sid:'202637041', items:[['m2',1],['m6',1]], total:24000, table:null, mode:'포장', status:'PAID',     bank:'국민', ageMin:2 },
  { id:15, who:'김철수', sid:'202637039', items:[['m3',1]],          total:18000, table:7, mode:'매장', status:'TRANSFER_REPORTED', bank:'카카오뱅크', ageMin:5, warn:'warn' },
  { id:16, who:'정수민', sid:'',          items:[['m1',1],['m7',2]], total:22000, table:null, mode:'포장', status:'TRANSFER_REPORTED', bank:'신한', ageMin:11, warn:'danger', external:true },
  { id:17, who:'홍길동', sid:'202637042', items:[['m1',1],['m7',2]], total:22000, table:9, mode:'매장', status:'ORDERED',   bank:null, ageMin:1, couponDiscount:1000 },
  { id:18, who:'송지원', sid:'202637044', items:[['m5',1]],          total:4000,  table:3, mode:'매장', status:'ORDERED',   bank:null, ageMin:0 },
];

/* Expose to window so other Babel scripts can use */
Object.assign(window, {
  won, pad,
  Mascot, Button, Field, Input, Select, Checkbox, RadioGroup,
  Stamp, DogTag, StatusChip, CountBadge, MenuFallback,
  EmptyState, LoadingState, ErrorState,
  Timeline, TIMELINE_STEPS, STATUS_LABELS,
  MENUS, CATEGORIES, MOCK_ORDERS_SEED,
});
