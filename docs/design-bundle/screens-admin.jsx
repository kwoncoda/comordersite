/* ============================================================
   Admin — A-2 본부 / A-5 메뉴 관리 / A-6 정산
   - 내부 탭 라우터 (useState)
   - 메뉴 가격은 window.MENUS 직접 mutating, 사용자 화면도 즉시 반영
   ============================================================ */

const { useState: useStateA, useEffect: useEffectA } = React;
const fmtA = n => n.toLocaleString('ko-KR');

/* ===== Top container — tab router + PIN 게이트 ===== */
function AdminApp({ businessState, openBusiness, onPriceChange }) {
  const [authed, setAuthed] = useStateA(false);
  const [tab, setTab] = useStateA('dashboard');
  // 주문 상태를 admin-level state로 보관 — 카드 액션이 실제 작동하도록
  const [orders, setOrders] = useStateA(() => window.MOCK_ADMIN_ORDERS.map(o => ({ ...o })));
  // ───────────────────────────────────────────────────────────
  // Audit log — 모든 상태 변경·관리자 액션 추적
  // 실제 구현 시: orders_audit 테이블 + INSERT 트리거 (ADR-025 회귀)
  // ───────────────────────────────────────────────────────────
  const [logs, setLogs] = useStateA(() => seedLogs(orders));
  const logSeq = React.useRef(1000);

  function pushLog(entry) {
    const id = ++logSeq.current;
    setLogs(ls => [{ id, ts: new Date(), ...entry }, ...ls]);
  }

  function transitionOrder(id, nextStatus, opts = {}) {
    const prev = orders.find(o => o.id === id);
    setOrders(os => os.map(o => o.id === id
      ? { ...o, status: nextStatus, ago: 0, warn: undefined, note: opts.note }
      : o));
    if (prev) pushLog({
      orderId: id, who: prev.who, amount: prev.amount,
      action: nextStatus, from: prev.status, to: nextStatus,
      actor: 'admin1',
    });
  }

  if (!authed) {
    return <AdminLogin onAuth={() => {
      setAuthed(true);
      pushLog({ action: 'LOGIN', actor: 'admin1' });
    }}/>;
  }

  return (
    <div className="admin-shell">
      <div className="admin-topnav">
        <div className="logo">치킨이닭 · 본부</div>
        <div className="nav">
          {[
            ['dashboard', '본부'],
            ['menus',     '메뉴'],
            ['history',   '내역'],
            ['settlement','정산'],
            ['coupons',   '쿠폰'],
          ].map(([k, label]) => (
            <button key={k}
              className={'nav-link ' + (tab === k ? 'active' : '')}
              onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
        <div className="right">
          <span className={'biz-badge ' + (businessState === 'OPEN' ? 'open' : 'closed')}>
            <span>{businessState === 'OPEN' ? '🟢' : '🔴'}</span>
            {businessState}
          </span>
          <span>5/20 (수) 17:38</span>
          <span>admin1</span>
          <button className="nav-link" onClick={() => {
            pushLog({ action: 'LOGOUT', actor: 'admin1' });
            setAuthed(false);
          }} style={{color:'var(--color-muted)'}}>로그아웃</button>
        </div>
      </div>

      {tab === 'dashboard'  && <AdminDashboardBody businessState={businessState}
                                  openBusiness={() => { openBusiness(); pushLog({ action:'BUSINESS_OPEN', actor:'admin1' }); }}
                                  orders={orders} transitionOrder={transitionOrder}/>}
      {tab === 'menus'      && <AdminMenus onPriceChange={onPriceChange} pushLog={pushLog}/>}
      {tab === 'history'    && <AdminHistory logs={logs}/>}
      {tab === 'settlement' && <AdminSettlement orders={orders}/>}
      {tab === 'coupons'    && <AdminCoupons/>}
    </div>
  );
}

/* ── 시연용 로그 시드 — 운영 시작 ~ 현재까지 가상 이력 ── */
function seedLogs(orders) {
  const now = Date.now();
  const m = (mins) => new Date(now - mins * 60_000);
  const logs = [];
  let id = 1;
  // 시스템 시작
  logs.push({ id: id++, ts: m(85), action: 'SYSTEM_START', actor: 'system' });
  logs.push({ id: id++, ts: m(82), action: 'LOGIN', actor: 'admin1' });
  logs.push({ id: id++, ts: m(80), action: 'BUSINESS_OPEN', actor: 'admin1' });
  // 메뉴 등록 / 가격 조정
  logs.push({ id: id++, ts: m(78), action: 'PRICE_CHANGED', actor: 'admin1', menuId: 'm3', menuName: '뿌링클', from: 22000, to: 21000 });
  logs.push({ id: id++, ts: m(60), action: 'SOLDOUT_ON', actor: 'admin1', menuId: 'm5', menuName: '뿌링감자튀김' });
  // 주문 이력 — 각 주문의 발자취
  orders.forEach((o, idx) => {
    const start = 65 - idx * 3;
    logs.push({ id: id++, ts: m(start), orderId: o.id, who: o.who, amount: o.amount,
                action: 'CREATED', actor: 'customer', from: null, to: 'ORDERED' });
    if (['TRANSFER_REPORTED','PAID','COOKING','READY','DONE','HOLD'].includes(o.status)) {
      logs.push({ id: id++, ts: m(start - 1), orderId: o.id, who: o.who, amount: o.amount,
                  action: 'TRANSFER_REPORTED', actor: 'customer', from: 'ORDERED', to: 'TRANSFER_REPORTED' });
    }
    if (['PAID','COOKING','READY','DONE'].includes(o.status)) {
      logs.push({ id: id++, ts: m(start - 2), orderId: o.id, who: o.who, amount: o.amount,
                  action: 'PAID', actor: 'admin1', from: 'TRANSFER_REPORTED', to: 'PAID' });
    }
    if (['COOKING','READY','DONE'].includes(o.status)) {
      logs.push({ id: id++, ts: m(start - 3), orderId: o.id, who: o.who, amount: o.amount,
                  action: 'COOKING', actor: 'admin1', from: 'PAID', to: 'COOKING' });
    }
    if (['READY','DONE'].includes(o.status)) {
      logs.push({ id: id++, ts: m(start - 8), orderId: o.id, who: o.who, amount: o.amount,
                  action: 'READY', actor: 'admin1', from: 'COOKING', to: 'READY' });
    }
    if (o.status === 'DONE') {
      logs.push({ id: id++, ts: m(start - 10), orderId: o.id, who: o.who, amount: o.amount,
                  action: 'DONE', actor: 'admin1', from: 'READY', to: 'DONE' });
    }
    if (o.status === 'HOLD') {
      logs.push({ id: id++, ts: m(start - 2), orderId: o.id, who: o.who, amount: o.amount,
                  action: 'HOLD', actor: 'admin1', from: 'TRANSFER_REPORTED', to: 'HOLD',
                  note: o.note });
    }
  });
  // 자동 ZIP 스냅샷
  logs.push({ id: id++, ts: m(8), action: 'AUTO_BACKUP', actor: 'system', meta: 'orders-1730.zip' });
  return logs.sort((a,b) => b.ts - a.ts);
}

/* ===== A-1 PIN 로그인 ===== */
function AdminLogin({ onAuth }) {
  const [pin, setPin] = useStateA('');
  const [error, setError] = useStateA(false);
  const [loading, setLoading] = useStateA(false);

  function press(d) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setLoading(true);
      setTimeout(() => {
        if (next === '7842') {
          onAuth();
        } else {
          setError(true);
          setPin('');
          setLoading(false);
        }
      }, 400);
    }
  }
  function back() { setPin(p => p.slice(0,-1)); setError(false); }

  return (
    <div className="login-shell">
      <div className="login-box">
        <div className="login-mark">
          <div className="brand-mark" style={{width:48, height:48}}/>
        </div>
        <div className="login-title">관리자 로그인</div>
        <div className="login-sub">PIN 4자리를 입력하세요</div>

        <div className={'pin-row ' + (error ? 'shake' : '') + (loading ? ' busy' : '')}>
          {[0,1,2,3].map(i => (
            <div key={i}
              className={'pin-cell ' + (pin.length > i ? 'filled' : '') + (error ? ' error' : '')}>
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>

        {error && <div className="login-err">PIN이 일치하지 않아요. 다시 시도해 주세요.</div>}
        {!error && <div className="login-hint">힌트: <code>7842</code> (시연용)</div>}

        <div className="pin-pad">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button key={d} className="pin-key" onClick={() => press(d)} disabled={loading}>{d}</button>
          ))}
          <button className="pin-key empty" disabled>·</button>
          <button className="pin-key" onClick={() => press('0')} disabled={loading}>0</button>
          <button className="pin-key" onClick={back} disabled={loading}>⌫</button>
        </div>
      </div>
    </div>
  );
}

/* ===== A-2 본부 대시보드 ===== */
function AdminDashboardBody({ businessState, openBusiness, orders, transitionOrder }) {
  const cols = [
    { key: 'ORDERED',           label: '주문 중',        warn: false },
    { key: 'TRANSFER_REPORTED', label: '이체 확인 요청', warn: true  },
    { key: 'PAID',              label: '이체 완료',      warn: false },
    { key: 'COOKING',           label: '조리 중',        warn: false },
    { key: 'READY',             label: '수령 대기',      warn: false },
    { key: 'HOLD',              label: '보류',           warn: false },
  ];
  // 최근 상태 변경 toast
  const [toast, setToast] = useStateA(null);
  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  }

  function act(id, next, label) {
    transitionOrder(id, next);
    flash(`#${id} → ${window.STATE_LABEL[next]}`);
  }

  return (
    <>
      {businessState === 'CLOSED' ? (
        <div className="start-cta urgent">
          <div className="cta-mascot"><div className="mascot mascot-sm"/></div>
          <div className="left">
            <div className="cta-eyebrow">🔴 CLOSED · 사용자 주문 차단 중</div>
            <h2>🚀 장사 시작</h2>
            <p>버튼을 누르면 사용자 주문이 즉시 활성화됩니다. (오픈 예정 16:30)</p>
          </div>
          <Button variant="primary" size="lg" onClick={openBusiness}>
            장사 시작 →
          </Button>
        </div>
      ) : (
        <div className="open-status">
          <div className="open-dot"><span className="pulse"/>🟢</div>
          <div className="open-text">
            <b>영업 중</b> · 16:32 시작 · 사용자 주문 가능
          </div>
          <span className="open-hint">영업 종료는 <b>정산 탭 → 오늘 정산 마감</b> 에서</span>
        </div>
      )}
      <div className="admin-board">
        {cols.map(col => {
          const items = orders.filter(o => o.status === col.key);
          const overdue = items.some(o => o.ago >= 10);
          const warn = items.some(o => o.ago >= 5);
          const cls = overdue ? 'col-head danger' : (col.warn && warn ? 'col-head warn' : 'col-head');
          return (
            <div className="col" key={col.key}>
              <div className={cls}>
                <span>{col.label}</span>
                <span className="count">{items.length}</span>
              </div>
              <div className="col-body">
                {items.length === 0 ? (
                  <div style={{textAlign:'center', color:'var(--color-muted)',
                               fontSize:11, padding:'12px 4px'}}>— 비어있음 —</div>
                ) : items.map(o => <AdminOrderCard key={o.id} o={o} col={col.key} act={act}/>)}
              </div>
            </div>
          );
        })}
      </div>
      {toast && <div className="admin-toast">✓ {toast}</div>}
    </>
  );
}

function AdminOrderCard({ o, col, act }) {
  const cls = o.warn === 'danger' ? 'order-card danger'
            : o.warn === 'warn' ? 'order-card warn' : 'order-card';
  return (
    <div className={cls}>
      <div className="row">
        <span className="id">#{o.id}</span>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:10,
          color: o.warn === 'danger' ? 'var(--color-danger)' :
                 o.warn === 'warn'   ? 'var(--color-warning)' : 'var(--color-muted)'
        }}>
          {o.ago}분 전 {o.warn === 'danger' ? '🔴' : o.warn === 'warn' ? '⚠️' : ''}
        </span>
      </div>
      <div className="who">{o.who} {o.external && <span style={{
        fontSize:9, color:'var(--color-muted)', marginLeft:4
      }}>외부인</span>}</div>
      <div className="meta">
        {o.bank} {o.sid && `· ${o.sid}`}
        {o.note && <div style={{color:'var(--color-danger)', marginTop:2}}>※ {o.note}</div>}
      </div>
      <div className="row"><span className="amount">{fmtA(o.amount)}원</span></div>
      {col === 'ORDERED' && (
        <div className="actions">
          <button onClick={() => act(o.id, 'CANCELED')}>취소</button>
        </div>
      )}
      {col === 'TRANSFER_REPORTED' && (
        <div className="actions">
          <button className="primary" onClick={() => act(o.id, 'PAID')}>✓ 확인</button>
          <button onClick={() => act(o.id, 'HOLD')}>보류</button>
        </div>
      )}
      {col === 'PAID' && (
        <div className="actions">
          <button className="primary" onClick={() => act(o.id, 'COOKING')}>조리 시작</button>
        </div>
      )}
      {col === 'COOKING' && (
        <div className="actions">
          <button className="primary" onClick={() => act(o.id, 'READY')}>조리 완료</button>
        </div>
      )}
      {col === 'READY' && (
        <div className="actions">
          <button className="primary" onClick={() => act(o.id, 'DONE')}>전달 완료</button>
        </div>
      )}
      {col === 'HOLD' && (
        <div className="actions">
          <button onClick={() => act(o.id, 'TRANSFER_REPORTED')}>재확인</button>
          <button onClick={() => act(o.id, 'CANCELED')}>취소</button>
        </div>
      )}
    </div>
  );
}

/* ===== A-5 메뉴 관리 — 가격 편집 ===== */
function AdminMenus({ onPriceChange, pushLog }) {
  // window.MENUS를 mutable source로 사용 — 사용자 화면도 즉시 반영
  const [menus, setMenus] = useStateA(() => window.MENUS.map(m => ({ ...m })));
  const [editingId, setEditingId] = useStateA(null);
  const [draftPrice, setDraftPrice] = useStateA('');
  const [saved, setSaved] = useStateA(null);

  function persistMenus(next) {
    setMenus(next);
    // sync to global so customer screens see the new price
    window.MENUS.splice(0, window.MENUS.length, ...next);
    onPriceChange?.();
  }

  function startEdit(m) {
    setEditingId(m.id);
    setDraftPrice(String(m.price));
  }
  function commitEdit(m) {
    const n = parseInt(draftPrice.replace(/[^\d]/g,''), 10);
    if (isNaN(n) || n < 0) { setEditingId(null); return; }
    if (n !== m.price) {
      const next = menus.map(x => x.id === m.id ? { ...x, price: n } : x);
      persistMenus(next);
      pushLog?.({ action: 'PRICE_CHANGED', actor: 'admin1',
                  menuId: m.id, menuName: m.name, from: m.price, to: n });
    }
    setEditingId(null);
    setSaved(m.id);
    setTimeout(() => setSaved(null), 1400);
  }
  function bump(m, delta) {
    const newPrice = Math.max(0, m.price + delta);
    const next = menus.map(x => x.id === m.id ? { ...x, price: newPrice } : x);
    persistMenus(next);
    pushLog?.({ action: 'PRICE_CHANGED', actor: 'admin1',
                menuId: m.id, menuName: m.name, from: m.price, to: newPrice });
    setSaved(m.id);
    setTimeout(() => setSaved(null), 700);
  }
  function toggleSold(m) {
    const next = menus.map(x => x.id === m.id ? { ...x, sold: !x.sold } : x);
    persistMenus(next);
    pushLog?.({ action: m.sold ? 'SOLDOUT_OFF' : 'SOLDOUT_ON', actor: 'admin1',
                menuId: m.id, menuName: m.name });
  }
  function toggleRec(m) {
    const next = menus.map(x => x.id === m.id ? { ...x, recommended: !x.recommended } : x);
    persistMenus(next);
    pushLog?.({ action: m.recommended ? 'RECOMMEND_OFF' : 'RECOMMEND_ON', actor: 'admin1',
                menuId: m.id, menuName: m.name });
  }

  const cats = ['전체','치킨','사이드','음료'];
  const [cat, setCat] = useStateA('전체');
  const filtered = cat === '전체' ? menus : menus.filter(m => m.cat === cat);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>메뉴 관리</h1>
        <div style={{display:'flex', gap:6, marginLeft:'auto'}}>
          {cats.map(c => (
            <button key={c}
              className={'admin-tab ' + (c === cat ? 'active':'')}
              onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="admin-info-bar">
        <span>💡 가격을 클릭하면 직접 편집할 수 있어요.</span>
        <span style={{marginLeft:'auto', color:'var(--color-muted)'}}>
          가격 변경은 사용자 화면에 <b style={{color:'var(--color-accent)'}}>즉시 반영</b>됩니다.
        </span>
      </div>

      <div className="admin-table">
        <div className="admin-table-head">
          <div>이미지·이름</div>
          <div>태그</div>
          <div>효과</div>
          <div>분류</div>
          <div className="num">가격</div>
          <div>품절</div>
          <div>추천</div>
        </div>

        {filtered.map(m => (
          <div className={'admin-table-row ' + (m.sold ? 'sold' : '')} key={m.id}>
            <div className="cell-name">
              <div className="tbl-thumb"><img src={m.img} alt={m.name}/></div>
              <div>
                <div className="tbl-name">{m.name}</div>
                <div className="tbl-id">{m.id.toUpperCase()}</div>
              </div>
            </div>
            <div><code className="ammo">{m.tag}</code></div>
            <div className="muted">{m.sub}</div>
            <div className="muted">{m.cat}</div>

            {/* 가격 편집 셀 */}
            <div className="num">
              {editingId === m.id ? (
                <div className="price-edit">
                  <input
                    autoFocus
                    className="input mono"
                    value={draftPrice}
                    onChange={e => setDraftPrice(e.target.value.replace(/[^\d]/g,'').slice(0,7))}
                    onBlur={() => commitEdit(m)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit(m);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    inputMode="numeric"
                    style={{width:90, height:32, padding:'0 8px', textAlign:'right'}}/>
                  <span style={{marginLeft:4, color:'var(--color-muted)'}}>원</span>
                </div>
              ) : (
                <div className="price-cell">
                  <button className="bump-btn" onClick={() => bump(m, -500)} aria-label="500원 감소">−</button>
                  <button className="price-display" onClick={() => startEdit(m)}>
                    {fmtA(m.price)}<span>원</span>
                    {saved === m.id && <span className="saved-tick">✓</span>}
                  </button>
                  <button className="bump-btn" onClick={() => bump(m, +500)} aria-label="500원 증가">＋</button>
                </div>
              )}
            </div>

            <div>
              <button
                className={'pill-toggle ' + (m.sold ? 'on danger' : '')}
                onClick={() => toggleSold(m)}
                aria-pressed={m.sold}>
                {m.sold ? '품절' : '판매중'}
              </button>
            </div>
            <div>
              <button
                className={'pill-toggle ' + (m.recommended ? 'on accent' : '')}
                onClick={() => toggleRec(m)}
                aria-pressed={m.recommended}>
                {m.recommended ? '⭐ 추천' : '—'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-foot-tip">
        ※ 실제 구현 시: <code>POST /admin/api/menus/:id</code> 호출 →
        Pattern B(ADR-020)이므로 가격 계산은 서버 권위. 클라이언트는 표시만.
      </div>
    </div>
  );
}

/* ===== A-7 주문 내역 / 감사 로그 ===== */
function AdminHistory({ logs }) {
  const [filter, setFilter] = useStateA('all'); // all | orders | menus | system
  const [query, setQuery] = useStateA('');
  const fmtT = ts => {
    const pad = n => String(n).padStart(2,'0');
    return `${pad(ts.getHours())}:${pad(ts.getMinutes())}:${pad(ts.getSeconds())}`;
  };
  const filtered = logs.filter(l => {
    if (filter === 'orders' && !l.orderId) return false;
    if (filter === 'menus'  && !l.menuId)  return false;
    if (filter === 'system' && !['SYSTEM_START','LOGIN','LOGOUT','BUSINESS_OPEN','BUSINESS_CLOSED','AUTO_BACKUP'].includes(l.action)) return false;
    if (query) {
      const q = query.toLowerCase();
      return JSON.stringify(l).toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    all: logs.length,
    orders: logs.filter(l => l.orderId).length,
    menus:  logs.filter(l => l.menuId).length,
    system: logs.filter(l => ['SYSTEM_START','LOGIN','LOGOUT','BUSINESS_OPEN','BUSINESS_CLOSED','AUTO_BACKUP'].includes(l.action)).length,
  };

  function exportCSV() {
    const head = ['ts','actor','action','orderId','who','amount','from','to','menuId','menuName','note','meta'];
    const rows = logs.map(l => head.map(k =>
      k === 'ts' ? l.ts.toISOString() : (l[k] ?? '')
    ).join(','));
    const csv = head.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `order-history-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>내역</h1>
        <div style={{display:'flex', gap:6, marginLeft:'auto', alignItems:'center'}}>
          <input className="input" placeholder="검색 (이름·주문번호·메뉴...)"
                 value={query} onChange={e => setQuery(e.target.value)}
                 style={{width:240, height:36}}/>
          <Button variant="secondary" size="sm" onClick={exportCSV}>📥 CSV 내보내기</Button>
        </div>
      </div>

      <div style={{display:'flex', gap:6}}>
        {[
          ['all',    `전체 (${counts.all})`],
          ['orders', `주문 (${counts.orders})`],
          ['menus',  `메뉴 (${counts.menus})`],
          ['system', `시스템 (${counts.system})`],
        ].map(([k, label]) => (
          <button key={k}
            className={'admin-tab ' + (filter === k ? 'active' : '')}
            onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>

      <div className="admin-info-bar">
        <span>📜 모든 상태 변경·관리자 액션 추적 (ADR-025).</span>
        <span style={{marginLeft:'auto', color:'var(--color-muted)'}}>
          최신 순 · 마감 후 ZIP 백업에 함께 포함됩니다
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{padding:'40px 16px'}}>
          <h3>해당 조건의 내역이 없어요</h3>
          <p>다른 필터를 선택하거나 검색어를 비워보세요.</p>
        </div>
      ) : (
        <div className="log-feed">
          {filtered.map(l => <LogRow key={l.id} l={l} fmtT={fmtT}/>)}
        </div>
      )}

      <div className="admin-foot-tip">
        ※ 실제 구현: <code>orders_audit</code> + <code>menu_audit</code> 테이블 INSERT 트리거.
        조회: <code>GET /admin/api/history?since=YYYY-MM-DD&type=orders</code>
      </div>
    </div>
  );
}

function LogRow({ l, fmtT }) {
  const meta = LOG_META[l.action] || { label: l.action, icon: '·', color: 'var(--color-muted)' };
  return (
    <div className="log-row">
      <div className="log-time">{fmtT(l.ts)}</div>
      <div className="log-icon" style={{color: meta.color, borderColor: meta.color}}>
        {meta.icon}
      </div>
      <div className="log-body">
        <div className="log-line">
          <span className="log-action" style={{color: meta.color}}>{meta.label}</span>
          {l.orderId && <span className="log-order">#{l.orderId}</span>}
          {l.who && <span className="log-who">{l.who}</span>}
          {l.amount && <span className="log-amount">{fmtA(l.amount)}원</span>}
          {l.menuName && <span className="log-menu">{l.menuName}</span>}
          {l.from != null && l.to != null && (
            <span className="log-transition">
              <code>{l.from || '—'}</code> → <code>{l.to || '—'}</code>
            </span>
          )}
        </div>
        {(l.note || l.meta) && (
          <div className="log-sub">{l.note || l.meta}</div>
        )}
      </div>
      <div className="log-actor">{l.actor}</div>
    </div>
  );
}

const LOG_META = {
  // 주문 상태 전이
  CREATED:           { label: '주문 접수',       icon: '📋', color: 'var(--color-ink)' },
  TRANSFER_REPORTED: { label: '이체 확인 요청',  icon: '💸', color: 'var(--color-warning)' },
  PAID:              { label: '이체 확인',       icon: '✓',  color: 'var(--color-success)' },
  COOKING:           { label: '조리 시작',       icon: '🔥', color: 'var(--color-accent)' },
  READY:             { label: '조리 완료',       icon: '✅', color: 'var(--color-accent)' },
  DONE:              { label: '전달 완료',       icon: '🎉', color: 'var(--color-success)' },
  HOLD:              { label: '보류',           icon: '⚠️', color: 'var(--color-warning)' },
  CANCELED:          { label: '취소',           icon: '✕',  color: 'var(--color-danger)' },
  // 메뉴 관리
  PRICE_CHANGED:     { label: '가격 변경',       icon: '￦',  color: 'var(--color-accent)' },
  SOLDOUT_ON:        { label: '품절 처리',       icon: '🚫', color: 'var(--color-danger)' },
  SOLDOUT_OFF:       { label: '판매 재개',       icon: '↻',  color: 'var(--color-success)' },
  RECOMMEND_ON:      { label: '추천 등록',       icon: '⭐', color: 'var(--color-accent)' },
  RECOMMEND_OFF:     { label: '추천 해제',       icon: '☆',  color: 'var(--color-muted)' },
  // 시스템
  SYSTEM_START:      { label: '시스템 시작',     icon: '⚙️', color: 'var(--color-muted)' },
  LOGIN:             { label: '관리자 로그인',   icon: '🔑', color: 'var(--color-muted)' },
  LOGOUT:            { label: '관리자 로그아웃', icon: '🚪', color: 'var(--color-muted)' },
  BUSINESS_OPEN:     { label: '장사 시작',       icon: '🚀', color: 'var(--color-success)' },
  BUSINESS_CLOSED:   { label: '영업 종료',       icon: '🔒', color: 'var(--color-danger)' },
  AUTO_BACKUP:       { label: '자동 백업',       icon: '📦', color: 'var(--color-muted)' },
  MANUAL_BACKUP:     { label: '수동 백업',       icon: '📥', color: 'var(--color-accent)' },
  SETTLEMENT_CLOSE:  { label: '정산 마감',       icon: '🏁', color: 'var(--color-success)' },
};

/* ===== A-6 정산 화면 ===== */
function AdminSettlement({ orders = window.MOCK_ADMIN_ORDERS }) {
  const inProgress = orders.filter(o => !['DONE','CANCELED'].includes(o.status)).length;
  const done = orders.filter(o => o.status === 'DONE');
  const total = orders.reduce((a,b) => a + b.amount, 0);
  const couponDiscount = 45000;
  const expected = total - couponDiscount;
  const [bankInput, setBankInput] = useStateA('');
  const bankNum = parseInt(bankInput.replace(/[^\d]/g,''), 10) || 0;
  const diff = bankNum ? bankNum - expected : null;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>정산</h1>
        <div style={{display:'flex', gap:6, marginLeft:'auto', alignItems:'center'}}>
          <span style={{fontFamily:'var(--font-mono)', fontSize:13, color:'var(--color-muted)'}}>
            일자
          </span>
          <select className="select" style={{width:140, height:36}} defaultValue="2026-05-20">
            <option value="2026-05-20">5/20 (수)</option>
            <option value="2026-05-21">5/21 (목)</option>
            <option value="all">전체 합산</option>
          </select>
        </div>
      </div>

      {/* 마감 가드 */}
      <div className={'admin-info-bar ' + (inProgress > 0 ? 'warn' : 'ok')}>
        {inProgress > 0
          ? <><span>⚠️</span><span>진행 중 주문 <b>{inProgress}건</b>이 있어요. 모두 종결되면 마감 가능합니다. (ADR-012)</span></>
          : <><span>✅</span><span>진행 중 주문 0건 — 마감 가능</span></>}
        <Button variant={inProgress > 0 ? 'secondary' : 'primary'} size="sm" disabled={inProgress > 0}
                style={{marginLeft:'auto'}}>
          오늘 정산 마감
        </Button>
      </div>

      <div className="settle-grid">
        {/* 요약 */}
        <div className="settle-card">
          <div className="section-label" style={{color:'var(--color-accent)'}}>정산 요약</div>
          <div className="settle-line"><span>마감 시각</span><span className="mono">— (대기 중)</span></div>
          <div className="settle-line"><span>총 주문</span><span className="mono">{orders.length}건</span></div>
          <div className="settle-line"><span>총 매출</span><span className="mono">{fmtA(total)}원</span></div>
          <div className="settle-line"><span>쿠폰 할인</span><span className="mono" style={{color:'var(--color-success)'}}>−{fmtA(couponDiscount)}원</span></div>
          <div className="settle-line strong">
            <span>실수령 예상</span>
            <span className="mono" style={{color:'var(--color-accent)', fontSize:18}}>{fmtA(expected)}원</span>
          </div>
          <div style={{marginTop:14}}>
            <label style={{fontSize:12, color:'var(--color-muted)'}}>통장 입금 합계 (수동 입력)</label>
            <input className="input mono" style={{marginTop:6, textAlign:'right'}}
                   value={bankInput} onChange={e => setBankInput(e.target.value.replace(/[^\d]/g,'').slice(0,9))}
                   placeholder="0"/>
            {bankNum > 0 && (
              <div className="settle-line strong" style={{marginTop:8,
                color: diff === 0 ? 'var(--color-success)' :
                       Math.abs(diff) < 1000 ? 'var(--color-warning)' : 'var(--color-danger)'}}>
                <span>차이</span>
                <span className="mono">{diff > 0 ? '+' : ''}{fmtA(diff)}원</span>
              </div>
            )}
          </div>
        </div>

        {/* ZIP 다운로드 */}
        <div className="settle-card">
          <div className="section-label" style={{color:'var(--color-accent)'}}>📦 ZIP 백업</div>
          <p style={{fontSize:13, color:'var(--color-muted)', margin:'6px 0 14px'}}>
            마지막 자동 백업: <b style={{color:'var(--color-ink)'}}>17:30 (8분 전)</b><br/>
            2시간 주기로 자동 스냅샷 6개 회전 (ADR-022)
          </p>
          <Button variant="primary" block>📥 수동 백업 다운로드</Button>
          <div style={{marginTop:14, fontSize:12, color:'var(--color-muted)'}}>
            <div style={{display:'flex', justifyContent:'space-between', padding:'4px 0', borderTop:'1px dashed var(--color-divider)'}}>
              <span className="mono">17:30 auto</span><span>2.1 MB</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', padding:'4px 0', borderTop:'1px dashed var(--color-divider)'}}>
              <span className="mono">15:30 auto</span><span>1.8 MB</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', padding:'4px 0', borderTop:'1px dashed var(--color-divider)'}}>
              <span className="mono">13:30 auto</span><span>1.4 MB</span>
            </div>
          </div>
        </div>

        {/* 메뉴별 판매 */}
        <div className="settle-card wide">
          <div className="section-label" style={{color:'var(--color-accent)'}}>메뉴별 판매</div>
          {window.MENUS.map((m, i) => {
            const count = [42, 38, 51, 28, 0, 14, 33, 28][i] || 0;
            const revenue = m.price * count;
            const pct = (revenue / (window.MENUS[2].price * 51)) * 100;
            return (
              <div key={m.id} className="bar-row">
                <div className="bar-name">
                  <img src={m.img} alt="" style={{width:24,height:24,objectFit:'contain'}}/>
                  <span>{m.name}</span>
                </div>
                <div className="bar-track"><div className="bar-fill" style={{width:pct + '%'}}/></div>
                <div className="bar-meta mono">{count}건 · {fmtA(revenue)}원</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ===== A-8 쿠폰 (간단 placeholder) ===== */
function AdminCoupons() {
  return (
    <div className="admin-page">
      <div className="admin-page-head"><h1>쿠폰 사용 내역</h1></div>
      <div className="admin-info-bar">
        <span>📊 사용 <b>23명</b> · 총 할인 <b>23,000원</b> · 거부 시도 <b>16건</b></span>
      </div>
      <div className="settle-grid">
        <div className="settle-card wide">
          <div className="section-label" style={{color:'var(--color-accent)'}}>최근 사용 (P1 — Phase 2 구현)</div>
          <div className="bar-row" style={{gridTemplateColumns:'120px 1fr 100px 120px', gap:12}}>
            <span className="mono" style={{fontSize:13, color:'var(--color-muted)'}}>학번</span>
            <span style={{fontSize:13, color:'var(--color-muted)'}}>이름</span>
            <span style={{fontSize:13, color:'var(--color-muted)'}} className="mono">시각</span>
            <span style={{fontSize:13, color:'var(--color-muted)', textAlign:'right'}}>주문</span>
          </div>
          {[
            ['202637042','홍길동','17:30','#17'],
            ['202637088','박서연','17:32','#18'],
            ['202637015','김철수','17:25','#15'],
            ['202637072','이슬기','17:35','#19'],
            ['202637101','이영희','17:36','#14'],
          ].map(([sid,name,t,o]) => (
            <div key={sid} className="bar-row" style={{gridTemplateColumns:'120px 1fr 100px 120px', gap:12, alignItems:'center', borderTop:'1px dashed var(--color-divider)'}}>
              <span className="mono" style={{fontSize:13}}>{sid}</span>
              <span style={{fontSize:13}}>{name}</span>
              <span className="mono" style={{fontSize:12, color:'var(--color-muted)'}}>{t}</span>
              <span className="mono" style={{fontSize:13, color:'var(--color-accent)', textAlign:'right'}}>{o}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AdminApp, AdminDashboard: AdminApp });
