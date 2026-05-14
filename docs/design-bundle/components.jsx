/* ============================================================
   Atoms / Molecules — COMPONENT_GUIDE.md §2-§3
   ============================================================ */

const { useState, useEffect, useRef, useMemo } = React;

/* ── Button ── */
function Button({ variant='primary', size='md', block, loading, disabled, children, ...rest }) {
  const cls = [
    'btn',
    'btn-' + variant,
    size !== 'md' ? 'btn-' + size : '',
    block ? 'btn-block' : '',
  ].filter(Boolean).join(' ');
  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="spinner" style={{ width:16, height:16, borderWidth:2 }}/> : children}
    </button>
  );
}

/* ── StatusChip — COMPONENT §3.4 ── */
function StatusChip({ status }) {
  const map = {
    ORDERED:           { cls:'chip-ordered',  icon:'⏳' },
    TRANSFER_REPORTED: { cls:'chip-transfer', icon:'💸' },
    PAID:              { cls:'chip-paid',     icon:'✓'  },
    COOKING:           { cls:'chip-cooking',  icon:'🔥' },
    READY:             { cls:'chip-ready',    icon:'✅' },
    DONE:              { cls:'chip-done',     icon:'🎉' },
    HOLD:              { cls:'chip-hold',     icon:'⚠️' },
    CANCELED:          { cls:'chip-canceled', icon:'❌' },
  };
  const m = map[status] || map.ORDERED;
  return (
    <span className={'chip ' + m.cls}>
      <span aria-hidden>{m.icon}</span>
      {window.STATE_LABEL[status] || status}
    </span>
  );
}

/* ── Stamp — CSS stamp (2026-05-13 C) ── */
function Stamp({ kind='recommended', children, style }) {
  return <span className={'stamp stamp-' + kind} style={style}>{children}</span>;
}

/* ── DogTag — ★ Memorable thing ── */
function DogTag({ no, total = 100, date = '2026-05-20', size='md', dropping, pulse }) {
  // 단발 모션: sessionStorage 키로 1회만 재생 (DESIGN §9.6)
  const stored = useRef(false);
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    if (!dropping || !no) return;
    const key = 'dogtag-shown-' + no;
    if (!sessionStorage.getItem(key)) {
      setAnimate(true);
      sessionStorage.setItem(key, '1');
    }
  }, [dropping, no]);

  const cls = [
    'dogtag',
    size === 'sm' ? 'dogtag-sm' : '',
    animate ? 'dogtag-drop' : '',
    pulse ? 'dogtag-pulse' : '',
  ].filter(Boolean).join(' ');
  return (
    <div className={cls} role="status" aria-live="polite">
      <div className="tag-label">ORDER NO</div>
      <div className="tag-no">#{no}<span className="small">/{total}</span></div>
      <div className="tag-date">{date}</div>
    </div>
  );
}

/* ── Mascot — 업로드 로고 ── */
function Mascot({ size='md', className='', state='default' }) {
  const cls = ['mascot', 'mascot-' + size,
    state === 'cooking' ? 'mascot-cooking-idle' : '',
    className].filter(Boolean).join(' ');
  return <div className={cls} role="img" aria-label="치킨이닭 마스코트"/>;
}

/* ── Timeline — 5-step ── */
function Timeline({ current }) {
  const steps = [
    { key: 'ORDERED',           short: '접수'   },
    { key: 'TRANSFER_REPORTED', short: '입금'   },
    { key: 'PAID',              short: '확인'   },
    { key: 'COOKING',           short: '조리'   },
    { key: 'READY',             short: '수령'   },
  ];
  const idx = steps.findIndex(s => s.key === current);
  const doneCount = current === 'DONE' ? steps.length : (idx >= 0 ? idx : 0);
  const fillPct = Math.min(100, (doneCount / (steps.length - 1)) * 100);
  return (
    <div className="timeline" role="progressbar"
         aria-valuemin="0" aria-valuemax={steps.length} aria-valuenow={doneCount + 1}>
      <div className="tl-fill" style={{ width: `calc((100% - 56px) * ${fillPct/100})` }}/>
      {steps.map((s, i) => {
        const state = i < doneCount ? 'done' : i === doneCount ? 'current' : 'future';
        return (
          <div className={'timeline-step ' + state} key={s.key}>
            <div className="timeline-dot">{i < doneCount ? '✓' : i + 1}</div>
            <div className="tl-label">{s.short}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── EmptyState ── */
function EmptyState({ title, body, actionLabel, onAction, mascotState='default' }) {
  return (
    <div className="empty-state">
      <Mascot size="md" state={mascotState}/>
      <h3>{title}</h3>
      <p>{body}</p>
      {actionLabel && <Button onClick={onAction} variant="primary">{actionLabel}</Button>}
    </div>
  );
}

/* ── LoadingState ── */
function LoadingState({ label='불러오는 중...' }) {
  return (
    <div className="loading-state">
      <div className="spinner"/>
      <p>{label}</p>
    </div>
  );
}

/* ── ErrorState — 풀스크린 또는 카드 ── */
function ErrorState({ code='OFFLINE', title='연결이 끊어졌어요', body='네트워크를 확인하고 다시 시도해 주세요.', actionLabel='다시 시도', onAction }) {
  return (
    <div className="error-state">
      {code && <div className="code">{code}</div>}
      <h3>{title}</h3>
      <p>{body}</p>
      {actionLabel && <Button onClick={onAction} variant="primary">{actionLabel}</Button>}
    </div>
  );
}

/* ── BannerTop — SSE 끊김 등 ── */
function BannerTop({ children, kind='warn' }) {
  return <div className="banner-top">⚠️ {children}</div>;
}

/* ── PhoneChrome — iOS-like status bar ── */
function PhoneChrome({ time = '17:48' }) {
  return (
    <>
      <div className="phone-notch"/>
      <div className="phone-status">
        <span>{time}</span>
        <span className="right">
          <span>●●●●</span>
          <span style={{ marginLeft:6 }}>5G</span>
          <span style={{ marginLeft:6 }}>▮▮▮</span>
        </span>
      </div>
    </>
  );
}

Object.assign(window, {
  Button, StatusChip, Stamp, DogTag, Mascot, Timeline,
  EmptyState, LoadingState, ErrorState, BannerTop, PhoneChrome,
});
