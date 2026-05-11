/* ============================================================
   screens-admin.jsx — A-1 ~ A-4 관리자(PC) 화면들
   ============================================================ */
const { useState, useEffect } = React;

/* ─────────── A-1 PIN 로그인 ─────────── */
function AdminLogin({ adminState, setAdmin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  function press(k) {
    setError(false);
    if (k === 'C') { setPin(''); return; }
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      setLoading(true);
      setTimeout(() => {
        if (next === '7842') {
          setAdmin({ ...adminState, loggedIn: true, page: 'dashboard' });
        } else {
          setError(true);
          setPin('');
          setLoading(false);
        }
      }, 500);
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: 'var(--color-bg)' }}>
      <div style={{ width: 380, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-stencil)', letterSpacing: '0.06em',
          fontSize: 22, color: 'var(--color-ink)',
          padding: '8px 16px', display: 'inline-block',
          background: 'var(--color-accent)', borderRadius: 4, marginBottom: 12,
        }}>HQ — COMMAND POST</div>
        <h1 className="h1" style={{ fontSize: 22, marginBottom: 4 }}>본부 PIN 입력</h1>
        <p className="muted" style={{ fontSize: 13, marginBottom: 28 }}>당일 운영진에게 전달된 4자리 코드</p>

        <div className="pin-display">
          {[0,1,2,3].map(i => (
            <div key={i} className={'pin-cell' + (pin.length > i ? ' filled' : '') + (error ? ' error' : '')}>
              {pin[i] ? '●' : ''}
            </div>
          ))}
        </div>

        {error && <div className="fld-error mb-2">PIN이 일치하지 않습니다. (힌트: 7842)</div>}
        {loading && !error && <div className="muted mb-2" style={{ fontSize: 12 }}><span className="spinner sm" /> 확인 중...</div>}

        <div className="pin-keypad">
          {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(k => (
            <button key={k} className="pin-key" onClick={() => press(k)} disabled={loading}>{k}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Admin Top Nav ─────────── */
function AdminTopNav({ adminState, setAdmin }) {
  const transferCount = adminState.orders.filter(o => o.status === 'TRANSFER_REPORTED').length;
  return (
    <div className="admin-topnav">
      <span className="brand">CHICKEN HQ</span>
      <button className={'nav-link' + (adminState.page === 'dashboard' ? ' active' : '')}
        onClick={() => setAdmin({ ...adminState, page: 'dashboard' })}>주문 보드</button>
      <button className={'nav-link' + (adminState.page === 'transfers' ? ' active' : '')}
        onClick={() => setAdmin({ ...adminState, page: 'transfers' })}>
        💸 이체 확인 {transferCount > 0 && <CountBadge value={transferCount} variant={transferCount > 1 ? 'danger' : 'warn'} />}
      </button>
      <button className="nav-link">메뉴 관리</button>
      <button className="nav-link">통계</button>
      <div className="right">
        <span className="live">● LIVE</span>
        <span>운영자: 정주영</span>
        <button className="btn btn-ghost btn-xs" onClick={() => setAdmin({ ...adminState, loggedIn: false })}>로그아웃</button>
      </div>
    </div>
  );
}

function AdminSidebar({ adminState }) {
  const counts = ['ORDERED','TRANSFER_REPORTED','PAID','COOKING','READY','DONE']
    .reduce((acc, k) => { acc[k] = adminState.orders.filter(o => o.status === k).length; return acc; }, {});
  const oldest = adminState.orders.filter(o => o.status === 'TRANSFER_REPORTED').reduce((m, o) => Math.max(m, o.ageMin), 0);
  return (
    <aside className="admin-side">
      <h4>오늘 운영</h4>
      <div className="row-between" style={{ fontSize: 13, marginBottom: 4 }}>
        <span>접수</span><span className="tabular bold">{adminState.orders.length}</span>
      </div>
      <div className="row-between" style={{ fontSize: 13, marginBottom: 4 }}>
        <span>매출(예상)</span><span className="tabular bold">{won(adminState.orders.reduce((s, o) => s + o.total, 0))}</span>
      </div>

      <h4 style={{ marginTop: 16 }}>상태별</h4>
      <ul>
        <li className="row"><span style={{ flex: 1, fontSize: 12 }}>주문중</span><CountBadge value={counts.ORDERED} /></li>
        <li className={'row' + (oldest >= 10 ? ' alert' : counts.TRANSFER_REPORTED > 0 ? ' warn' : '')}>
          <span style={{ flex: 1, fontSize: 12 }}>이체확인요청</span>
          <CountBadge value={counts.TRANSFER_REPORTED}
            variant={oldest >= 10 ? 'danger' : counts.TRANSFER_REPORTED > 0 ? 'warn' : 'default'} />
        </li>
        <li className="row"><span style={{ flex: 1, fontSize: 12 }}>입금완료</span><CountBadge value={counts.PAID} /></li>
        <li className="row"><span style={{ flex: 1, fontSize: 12 }}>조리중</span><CountBadge value={counts.COOKING} /></li>
        <li className="row"><span style={{ flex: 1, fontSize: 12 }}>수령가능</span><CountBadge value={counts.READY} /></li>
        <li className="row"><span style={{ flex: 1, fontSize: 12 }}>수령완료</span><CountBadge value={counts.DONE} /></li>
      </ul>

      <h4 style={{ marginTop: 16 }}>인기 메뉴 TOP3</h4>
      <ol style={{ fontSize: 12, paddingLeft: 18, margin: 0 }}>
        <li>뿌링클 — 37</li>
        <li>후라이드 — 19</li>
        <li>양념 — 12</li>
      </ol>
    </aside>
  );
}

/* ─────────── A-2 Dashboard (6-column Kanban) ─────────── */
function AdminDashboard({ adminState, setAdmin }) {
  const cols = [
    { key: 'ORDERED',           label: '🟡 주문중',       tone: '' },
    { key: 'TRANSFER_REPORTED', label: '⚠️ 이체확인요청', tone: 'warn' },
    { key: 'PAID',              label: '✅ 입금완료',     tone: '' },
    { key: 'COOKING',           label: '🔥 조리중',       tone: '' },
    { key: 'READY',             label: '📣 수령가능',     tone: '' },
    { key: 'DONE',              label: '✓ 수령완료',      tone: '' },
  ];

  function advance(o) {
    const next = {
      ORDERED:'TRANSFER_REPORTED', TRANSFER_REPORTED:'PAID', PAID:'COOKING',
      COOKING:'READY', READY:'DONE', DONE:'DONE',
    }[o.status];
    setAdmin({ ...adminState, orders: adminState.orders.map(x => x.id === o.id ? { ...x, status: next } : x) });
  }

  function open(o) {
    setAdmin({ ...adminState, page: 'detail', selectedId: o.id });
  }

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      <div className="admin-body" style={{ flex: 1 }}>
        <AdminSidebar adminState={adminState} />
        <main className="admin-content">
          <div className="row-between mb-4">
            <div>
              <h2 className="h2" style={{ marginBottom: 2 }}>주문 보드</h2>
              <div className="muted" style={{ fontSize: 12, fontFamily:'var(--font-mono)' }}>
                실시간 갱신 · 2026-05-20 · 카드 클릭 = 상세, 액션 버튼 = 즉시 상태 변경
              </div>
            </div>
            <div className="row gap-2">
              <button className="btn btn-secondary btn-sm">검색</button>
              <button className="btn btn-secondary btn-sm">필터</button>
            </div>
          </div>

          <div className="kanban">
            {cols.map(col => {
              const list = adminState.orders.filter(o => o.status === col.key);
              const isUrgent = col.key === 'TRANSFER_REPORTED' && list.some(o => o.ageMin >= 10);
              const headerCls = isUrgent ? 'urgent' : col.tone === 'warn' ? 'warn' : '';
              return (
                <section key={col.key} className="kanban-col" aria-label={col.label}>
                  <header className={'kanban-col-header ' + headerCls}>
                    <span>{col.label}</span>
                    <CountBadge value={list.length}
                      variant={isUrgent ? 'danger' : col.tone === 'warn' && list.length ? 'warn' : 'default'} />
                  </header>
                  <div className="kanban-col-body">
                    {list.length === 0 ? (
                      <div className="kanban-empty">— 비어있음 —</div>
                    ) : list.map(o => (
                      <div key={o.id} className="kanban-card" onClick={() => open(o)}>
                        <div className="head">
                          <DogTag num={o.id} size="xs" />
                          <span className="ordno tabular">#{o.id}</span>
                          <span className={'age tabular' + (o.ageMin >= 10 ? ' danger' : o.ageMin >= 5 ? ' warn' : '')}>
                            {o.ageMin}분
                          </span>
                        </div>
                        <div className="who">{o.who}{o.external && ' (외부)'}</div>
                        <div className="meta">
                          <span className="price tabular">{won(o.total)}</span>
                          <span>·</span>
                          <span>{o.mode}{o.table ? ` T${o.table}` : ''}</span>
                          {o.bank && <><span>·</span><span>{o.bank}</span></>}
                        </div>
                        {(col.key === 'TRANSFER_REPORTED' || col.key === 'PAID' || col.key === 'COOKING' || col.key === 'READY') && (
                          <div className="actions" onClick={e => e.stopPropagation()}>
                            {col.key === 'TRANSFER_REPORTED' && (
                              <button className="btn btn-primary btn-xs" onClick={() => advance(o)}>입금 확인</button>
                            )}
                            {col.key === 'PAID' && (
                              <button className="btn btn-primary btn-xs" onClick={() => advance(o)}>🔥 조리 시작</button>
                            )}
                            {col.key === 'COOKING' && (
                              <button className="btn btn-primary btn-xs" onClick={() => advance(o)}>📣 수령 호출</button>
                            )}
                            {col.key === 'READY' && (
                              <button className="btn btn-primary btn-xs" onClick={() => advance(o)}>✓ 수령완료</button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─────────── A-3 Order Detail ─────────── */
function AdminOrderDetail({ adminState, setAdmin }) {
  const o = adminState.orders.find(x => x.id === adminState.selectedId);
  if (!o) {
    return (
      <ErrorState
        title="주문을 찾을 수 없습니다"
        body={`#${adminState.selectedId} 주문이 존재하지 않거나 삭제되었습니다.`}
        ctaLabel="대시보드로"
        onCta={() => setAdmin({ ...adminState, page: 'dashboard' })}
      />
    );
  }

  function update(patch) {
    setAdmin({ ...adminState, orders: adminState.orders.map(x => x.id === o.id ? { ...x, ...patch } : x) });
  }

  const items = o.items.map(([id, q]) => ({ ...MENUS.find(m => m.id === id), qty: q }));

  return (
    <div style={{ display:'flex', flex: 1, minHeight: 0 }}>
      <div className="admin-body" style={{ flex: 1 }}>
        <AdminSidebar adminState={adminState} />
        <main className="admin-content">
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => setAdmin({ ...adminState, page: 'dashboard' })}>
            ← 대시보드로
          </button>

          <div className="row gap-4 mb-4" style={{ alignItems:'flex-end' }}>
            <DogTag num={o.id} size="sm" />
            <div className="col">
              <div className="muted" style={{ fontSize: 12 }}>주문 상세</div>
              <h2 className="h1">#{o.id} · {o.who}</h2>
            </div>
            <div style={{ marginLeft:'auto' }}><StatusChip status={o.status} /></div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div className="detail-block">
                <h4>주문자</h4>
                <div className="kv">
                  <span className="k">이름</span><span className="v" style={{ fontFamily:'var(--font-body)' }}>{o.who}{o.external && ' (외부인)'}</span>
                  <span className="k">학번</span><span className="v">{o.sid || '— 외부인 —'}</span>
                  <span className="k">수령</span><span className="v" style={{ fontFamily:'var(--font-body)' }}>{o.mode}{o.table ? ` · 테이블 ${o.table}` : ''}</span>
                </div>
              </div>

              <div className="detail-block">
                <h4>이체 정보</h4>
                <div className="kv">
                  <span className="k">은행</span><span className="v" style={{ fontFamily:'var(--font-body)' }}>{o.bank || '—'}</span>
                  <span className="k">금액</span><span className="v">{won(o.total)}</span>
                  <span className="k">경과</span>
                  <span className={'v' + (o.ageMin >= 10 ? ' danger-text' : o.ageMin >= 5 ? ' warning-text' : '')}>
                    {o.ageMin}분 전
                  </span>
                </div>
              </div>

              <div className="detail-block">
                <h4>이벤트 로그</h4>
                <div className="timeline-events">
                  <div><span className="t">19:32:01</span> ORDERED — 주문 접수</div>
                  {o.bank && <div><span className="t">19:33:42</span> TRANSFER_REPORTED — {o.bank}</div>}
                  {['PAID','COOKING','READY','DONE'].includes(o.status) && <div><span className="t">19:35:11</span> PAID — 정주영 확인</div>}
                  {['COOKING','READY','DONE'].includes(o.status) && <div><span className="t">19:35:30</span> COOKING — 조리 시작</div>}
                  {['READY','DONE'].includes(o.status) && <div><span className="t">19:42:50</span> READY — 수령 호출</div>}
                  {o.status === 'DONE' && <div><span className="t">19:44:02</span> DONE — 수령 완료</div>}
                </div>
              </div>
            </div>

            <div>
              <div className="detail-block">
                <h4>주문 내역</h4>
                {items.map(m => (
                  <div className="receipt-line" key={m.id}>
                    <span>{m.name} × {m.qty}</span>
                    <span className="val tabular">{won(m.price * m.qty)}</span>
                  </div>
                ))}
                <div className="divider-dashed" />
                <div className="receipt-line"><span className="label">소계</span><span className="val tabular">{won(o.total + (o.couponDiscount || 0))}</span></div>
                {o.couponDiscount && (
                  <div className="receipt-line discount"><span className="label">쿠폰 할인</span><span className="val tabular">-{won(o.couponDiscount)}</span></div>
                )}
                <div className="receipt-line total"><span>합계</span><span className="val tabular">{won(o.total)}</span></div>
              </div>

              <div className="detail-block">
                <h4>액션</h4>
                <div className="admin-actions">
                  {o.status === 'ORDERED' && (
                    <Button variant="secondary" size="sm" onClick={() => update({ status: 'TRANSFER_REPORTED', bank: '카카오뱅크' })}>
                      이체 보고로 표시
                    </Button>
                  )}
                  {o.status === 'TRANSFER_REPORTED' && (
                    <Button variant="primary" size="md" onClick={() => update({ status: 'PAID' })}>
                      ✅ 입금 확인
                    </Button>
                  )}
                  {o.status === 'PAID' && (
                    <Button variant="primary" size="md" onClick={() => update({ status: 'COOKING' })}>
                      🔥 조리 시작
                    </Button>
                  )}
                  {o.status === 'COOKING' && (
                    <Button variant="primary" size="md" onClick={() => update({ status: 'READY' })}>
                      📣 수령 호출 (READY)
                    </Button>
                  )}
                  {o.status === 'READY' && (
                    <Button variant="primary" size="md" onClick={() => update({ status: 'DONE' })}>
                      ✓ 수령 완료
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => update({ status: 'HOLD' })}>⚠️ 보류</Button>
                  <Button variant="danger" size="sm" onClick={() => update({ status: 'CANCELED' })}>주문 취소</Button>
                </div>
                <div className="muted mt-3" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  ※ 위험 액션은 한 번 더 확인 (실 운영) · 현재는 데모용 즉시 반영
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─────────── A-4 Transfers (이체 확인 큐) ─────────── */
function AdminTransfers({ adminState, setAdmin }) {
  const list = adminState.orders.filter(o => o.status === 'TRANSFER_REPORTED');

  function update(o, patch) {
    setAdmin({ ...adminState, orders: adminState.orders.map(x => x.id === o.id ? { ...x, ...patch } : x) });
  }

  return (
    <div style={{ display:'flex', flex:1, minHeight:0 }}>
      <div className="admin-body" style={{ flex: 1 }}>
        <AdminSidebar adminState={adminState} />
        <main className="admin-content">
          <div className="row-between mb-4">
            <div>
              <h2 className="h2">💸 이체 확인 큐</h2>
              <div className="muted" style={{ fontSize: 12, fontFamily:'var(--font-mono)' }}>
                통장 화면을 옆에 두고, 일치하면 [입금 확인]. 빨간 카드는 10분 초과.
              </div>
            </div>
          </div>

          {list.length === 0 ? (
            <div className="card" style={{ background:'rgba(90,140,66,0.10)', borderColor:'var(--color-success)', textAlign:'center', padding: 40 }}>
              <div style={{ fontSize: 36 }}>🎉</div>
              <div className="h3 success-text mt-2">모두 처리 완료!</div>
              <div className="muted mt-2" style={{ fontSize: 13 }}>대기 중인 이체 확인 요청이 없습니다.</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
              {list.map(o => (
                <div key={o.id} className="card" style={{
                  background: 'white',
                  borderColor: o.ageMin >= 10 ? 'var(--color-danger)' : 'var(--color-divider)',
                  borderWidth: o.ageMin >= 10 ? 2 : 1.5,
                }}>
                  <div className="row-between mb-2">
                    <div className="row gap-2">
                      <DogTag num={o.id} size="xs" />
                      <span className="bold" style={{ fontSize: 16 }}>{o.who}{o.external && ' (외부)'}</span>
                    </div>
                    <span className={'tabular' + (o.ageMin >= 10 ? ' danger-text bold' : o.ageMin >= 5 ? ' warning-text bold' : ' muted')}>
                      {o.ageMin}분 전
                    </span>
                  </div>

                  <div className="kv" style={{ fontSize: 13, marginBottom: 12 }}>
                    <span className="k">은행</span><span className="v" style={{ fontFamily:'var(--font-body)', fontWeight:700 }}>{o.bank}</span>
                    <span className="k">금액</span><span className="v" style={{ fontSize: 18, fontWeight: 800 }}>{won(o.total)}</span>
                    <span className="k">학번</span><span className="v">{o.sid || '외부인'}</span>
                  </div>

                  {o.ageMin >= 10 && (
                    <div className="warn-banner mb-2" style={{ borderColor:'var(--color-danger)', color:'var(--color-danger)', background:'rgba(199,62,29,0.08)' }}>
                      <span>🚨</span><span>10분 초과! 본인 확인 필요</span>
                    </div>
                  )}

                  <div className="row gap-2">
                    <Button variant="primary" size="md" onClick={() => update(o, { status: 'PAID' })}>✅ 입금 확인</Button>
                    <Button variant="secondary" size="sm" onClick={() => update(o, { status: 'HOLD' })}>⚠️ 보류</Button>
                    <button className="btn btn-ghost btn-xs"
                      onClick={() => setAdmin({ ...adminState, page: 'detail', selectedId: o.id })}>상세</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ─────────── A-5 Settlement (정산 화면) ───────────
   §12 정산 기획 — 마감 가드 (ADR-012) + ZIP 백업 (ADR-016) + 자동 스냅샷 이력 (ADR-022)
*/
function AdminSettlement({ adminState, setAdmin }) {
  const [date, setDate] = useState('2026-05-20');
  const [view, setView]   = useState('day');   // 'day' | 'all'
  const [confirming, setConfirming] = useState(false);
  const [closing, setClosing]       = useState(false);
  const [closeBlocked, setCloseBlocked] = useState(null);
  const [zipState, setZipState] = useState('idle'); // idle | preparing | done | error
  const [zipHistory, setZipHistory] = useState([
    { time:'21:30:00', kind:'auto', label:'자동 스냅샷 (ADR-022)', size:'2.1MB' },
    { time:'21:00:00', kind:'auto', label:'자동 스냅샷',           size:'2.0MB' },
    { time:'20:30:00', kind:'auto', label:'자동 스냅샷',           size:'1.8MB' },
    { time:'20:00:00', kind:'auto', label:'자동 스냅샷',           size:'1.6MB' },
  ]);

  // 진행 중 주문 = ADR-012 가드 대상
  const ACTIVE = ['ORDERED','TRANSFER_REPORTED','PAID','COOKING','READY','HOLD'];
  const active = adminState.orders.filter(o => ACTIVE.includes(o.status));
  const activeBy = active.reduce((a, o) => { a[o.status] = (a[o.status]||0)+1; return a; }, {});
  const closed = !!adminState.settlementClosed;

  // 정산 숫자 — DONE 주문 + 누적 베이스라인 (시안용)
  const liveDone = adminState.orders.filter(o => o.status === 'DONE');
  const baseDone = view === 'all' ? 412 : 234;
  const baseRevenue = view === 'all' ? 6080000 : 3456000;
  const baseCoupon  = view === 'all' ? 184000  : 127000;
  const baseCouponN = view === 'all' ? 184     : 127;
  const orderCount = baseDone + liveDone.length;
  const grossRevenue = baseRevenue + liveDone.reduce((s,o) => s + o.total + (o.couponDiscount||0), 0);
  const couponTotal = baseCoupon;
  const couponCount = baseCouponN;
  const netRevenue = grossRevenue - couponTotal;
  const canceledCount = view === 'all' ? 19 : 12;

  // 메뉴별 판매 (시안용 — 합리적 수치)
  const menuSales = [
    { id:'m3', name:'뿌링클',         qty: view==='all'?71:37, revenue:(view==='all'?71:37)*21000 },
    { id:'m1', name:'후라이드 치킨',  qty: view==='all'?42:19, revenue:(view==='all'?42:19)*18000 },
    { id:'m2', name:'양념 치킨',      qty: view==='all'?28:12, revenue:(view==='all'?28:12)*19000 },
    { id:'m6', name:'치즈스틱',       qty: view==='all'?54:31, revenue:(view==='all'?54:31)*5000 },
    { id:'m5', name:'감자튀김',       qty: view==='all'?47:25, revenue:(view==='all'?47:25)*4000 },
    { id:'m7', name:'콜라',           qty: view==='all'?98:54, revenue:(view==='all'?98:54)*2000 },
    { id:'m8', name:'사이다',         qty: view==='all'?42:23, revenue:(view==='all'?42:23)*2000 },
    { id:'m9', name:'제로콜라',       qty: view==='all'?38:21, revenue:(view==='all'?38:21)*2000 },
    { id:'m4', name:'간장 치킨',      qty: 0, revenue: 0, soldOut: true },
  ].sort((a,b) => b.revenue - a.revenue);

  // 시간대별 (16:30 ~ 21:30)
  const hourly = [
    { h:'16-17', n: 8 },
    { h:'17-18', n: 24 },
    { h:'18-19', n: 56 },
    { h:'19-20', n: 78 },  // peak
    { h:'20-21', n: 49 },
    { h:'21-22', n: 19 },
  ];
  const peakN = Math.max(...hourly.map(x => x.n));

  function attemptClose() {
    if (active.length > 0) {
      setCloseBlocked({ count: active.length, by: activeBy });
      return;
    }
    setConfirming(true);
  }
  function doClose() {
    setConfirming(false);
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setAdmin({ ...adminState, settlementClosed: true, closedAt: '21:42' });
    }, 1200);
  }
  function downloadZip() {
    setZipState('preparing');
    setTimeout(() => {
      // 5% 확률 에러 시뮬은 무리 — 항상 성공
      setZipState('done');
      setZipHistory(h => [
        { time:'21:43:18', kind:'manual', label:'정산 ZIP 다운로드 — 정주영', size:'3.4MB' },
        ...h,
      ]);
      setTimeout(() => setZipState('idle'), 2200);
    }, 1800);
  }

  return (
    <div style={{ display:'flex', flex:1, minHeight:0 }}>
      <div className="admin-body" style={{ flex: 1 }}>
        <AdminSidebar adminState={adminState} />
        <main className="admin-content">
          {/* Header row */}
          <div className="row-between mb-4" style={{ alignItems:'flex-end', flexWrap:'wrap', gap: 12 }}>
            <div>
              <h2 className="h2" style={{ marginBottom: 2 }}>📒 정산</h2>
              <div className="muted" style={{ fontSize: 12, fontFamily:'var(--font-mono)' }}>
                §12 · ADR-012 가드 · ADR-016 ZIP 백업 · ADR-022 자동 스냅샷
              </div>
            </div>
            <div className="row gap-2" style={{ alignItems:'center' }}>
              <div className="seg-toggle">
                <button className={view==='day'?'on':''} onClick={()=>setView('day')}>📅 일자별</button>
                <button className={view==='all'?'on':''} onClick={()=>setView('all')}>Σ 전체 합산</button>
              </div>
              {view==='day' && (
                <select className="date-pick" value={date} onChange={e=>setDate(e.target.value)}>
                  <option value="2026-05-20">5/20 (수)</option>
                  <option value="2026-05-21">5/21 (목)</option>
                </select>
              )}
            </div>
          </div>

          {/* Close-state banner */}
          <div className={'settle-status ' + (closed ? 'closed' : 'open')}>
            {closed ? (
              <>
                <div className="row gap-3" style={{ alignItems:'center' }}>
                  <div className="stamp-mini">CLOSED</div>
                  <div className="col">
                    <div className="bold" style={{ fontSize: 16 }}>✅ 정산 마감 완료</div>
                    <div className="muted" style={{ fontSize: 12, fontFamily:'var(--font-mono)' }}>
                      마감 시각 21:42:08 · 관리자: 정주영 · 스냅샷 ID `S-20260520-2142`
                    </div>
                  </div>
                </div>
                <div style={{ marginLeft:'auto' }}>
                  <Button variant="primary" size="md" loading={zipState==='preparing'}
                    onClick={downloadZip}>
                    {zipState === 'done' ? '✓ 다운로드 완료' : '📦 ZIP 백업 다운로드'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="row gap-3" style={{ alignItems:'center' }}>
                  <div className="pulse-dot" />
                  <div className="col">
                    <div className="bold" style={{ fontSize: 16 }}>
                      🟡 운영 중 — 진행 주문 <span className="tabular">{active.length}</span>건
                    </div>
                    <div className="muted" style={{ fontSize: 12, fontFamily:'var(--font-mono)' }}>
                      진행 0건일 때만 마감 가능 (ADR-012). 강제 마감 없음.
                    </div>
                  </div>
                </div>
                <div style={{ marginLeft:'auto' }} className="row gap-2">
                  <Button variant="secondary" size="md" loading={zipState==='preparing'}
                    onClick={downloadZip}>📦 ZIP 백업</Button>
                  <Button variant="primary" size="md" loading={closing}
                    onClick={attemptClose}>오늘 정산 마감</Button>
                </div>
              </>
            )}
          </div>

          {/* Summary + Hourly */}
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 12, marginTop: 12 }}>
            {/* Summary */}
            <div className="detail-block" style={{ marginBottom: 0 }}>
              <h4>정산 요약 — {view==='all' ? '5/20 + 5/21 합산' : (date === '2026-05-20' ? '5/20 (수)' : '5/21 (목)')}</h4>
              {!closed && (
                <div className="muted mb-2" style={{ fontSize: 11, fontFamily:'var(--font-mono)' }}>
                  ※ 실시간 추정치 — 마감 시점 스냅샷이 최종값
                </div>
              )}
              <div className="settle-grid">
                <div className="cell">
                  <div className="lbl">총 주문 (DONE)</div>
                  <div className="num tabular">{orderCount}<span className="unit">건</span></div>
                  <div className="sub">취소 {canceledCount} 제외</div>
                </div>
                <div className="cell">
                  <div className="lbl">총 매출 (할인 전)</div>
                  <div className="num tabular">{won(grossRevenue)}</div>
                  <div className="sub">평균 {won(Math.round(grossRevenue/orderCount))}/건</div>
                </div>
                <div className="cell">
                  <div className="lbl">쿠폰 할인</div>
                  <div className="num tabular danger-text">−{won(couponTotal)}</div>
                  <div className="sub">{couponCount}건 사용</div>
                </div>
                <div className="cell highlight">
                  <div className="lbl">최종 정산 금액</div>
                  <div className="num tabular bigger">{won(netRevenue)}</div>
                  <div className="sub">실수령 = 매출 − 쿠폰</div>
                </div>
              </div>
            </div>

            {/* Hourly bar chart */}
            <div className="detail-block" style={{ marginBottom: 0 }}>
              <h4>시간대별 주문량</h4>
              <div className="hourly">
                {hourly.map(b => (
                  <div className="bar-row" key={b.h}>
                    <span className="lbl tabular">{b.h}</span>
                    <div className="bar-track">
                      <div className={'bar-fill' + (b.n === peakN ? ' peak' : '')}
                           style={{ width: `${(b.n/peakN)*100}%` }} />
                    </div>
                    <span className="val tabular">{b.n}</span>
                  </div>
                ))}
              </div>
              <div className="muted mt-2" style={{ fontSize: 11, fontFamily:'var(--font-mono)' }}>
                피크 19:00–20:00 · 본부 매칭 병목 시간대
              </div>
            </div>
          </div>

          {/* Menu-by-menu sales */}
          <div className="detail-block" style={{ marginTop: 12, marginBottom: 0 }}>
            <h4>메뉴별 판매</h4>
            <div className="menu-sales-grid">
              <div className="head">메뉴</div>
              <div className="head r">판매 수량</div>
              <div className="head r">매출</div>
              <div className="head">비고</div>
              {menuSales.map(m => (
                <React.Fragment key={m.id}>
                  <div className="cell">{m.name}</div>
                  <div className="cell r tabular">{m.qty}</div>
                  <div className="cell r tabular">{won(m.revenue)}</div>
                  <div className="cell muted" style={{ fontSize: 11 }}>
                    {m.qty === 0 ? '— 품절 또는 미판매 —' :
                     m === menuSales[0] ? '🥇 1위' :
                     m === menuSales[1] ? '🥈 2위' :
                     m === menuSales[2] ? '🥉 3위' : ''}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Backup history */}
          <div className="detail-block" style={{ marginTop: 12, marginBottom: 0 }}>
            <h4>📦 ZIP 백업 이력</h4>
            <div className="muted mb-2" style={{ fontSize: 11, fontFamily:'var(--font-mono)' }}>
              수동 다운로드 = 학생회 USB 보관 · 자동 = `backups/` (30분 회전, 마지막 24개 유지)
            </div>
            <div className="zip-list">
              {zipHistory.map((z, i) => (
                <div className={'zip-row ' + z.kind} key={i}>
                  <span className="time tabular">{z.time}</span>
                  <span className={'kind ' + z.kind}>{z.kind === 'manual' ? '수동' : '자동'}</span>
                  <span className="label">{z.label}</span>
                  <span className="size tabular muted">{z.size}</span>
                  <button className="btn btn-ghost btn-xs">⬇ 재다운로드</button>
                </div>
              ))}
            </div>
            <div className="warn-banner mt-3" style={{ background:'rgba(229,155,12,0.10)', borderColor:'var(--color-warning)', color:'#8C5F00' }}>
              <span>🔐</span>
              <span>ZIP에 학번·이름·이체 정보 포함. 다운로드 즉시 USB 보관 후 7~14일 내 사본 폐기.</span>
            </div>
          </div>

          <div className="muted mt-3" style={{ fontSize: 11, fontFamily:'var(--font-mono)', textAlign:'center' }}>
            CSV/PDF 별도 내보내기는 ZIP에 포함됨 (orders.csv · transfers.csv · coupons.csv · settlement-summary.pdf · menu-snapshot.json)
          </div>
        </main>
      </div>

      {/* Close-guard modal (ADR-012) */}
      {closeBlocked && (
        <div className="modal-backdrop" onClick={() => setCloseBlocked(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="row gap-2 mb-2" style={{ alignItems:'center' }}>
              <span style={{ fontSize: 24 }}>⛔</span>
              <h3 className="h3" style={{ margin:0 }}>마감 거부 — 진행 중 주문 {closeBlocked.count}건</h3>
            </div>
            <p className="muted mb-3" style={{ fontSize: 13 }}>
              모든 주문이 <b>완료(DONE)</b> 또는 <b>취소(CANCELED)</b> 상태일 때만 마감할 수 있습니다.
              <br/>강제 마감·"마감 후 보류" 상태는 도입되지 않습니다 (ADR-012).
            </p>
            <div className="block-breakdown">
              {[
                ['ORDERED','주문중'],
                ['TRANSFER_REPORTED','이체확인요청'],
                ['PAID','이체완료'],
                ['COOKING','조리중'],
                ['READY','수령대기'],
                ['HOLD','보류'],
              ].filter(([k]) => closeBlocked.by[k]).map(([k, label]) => (
                <div className="row-between" key={k}>
                  <span>{label}</span>
                  <span className="tabular bold danger-text">{closeBlocked.by[k]}건</span>
                </div>
              ))}
            </div>
            <div className="row gap-2 mt-3" style={{ justifyContent:'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={() => setCloseBlocked(null)}>닫기</Button>
              <Button variant="primary" size="sm" onClick={() => {
                setCloseBlocked(null);
                setAdmin({ ...adminState, page: 'dashboard' });
              }}>주문 보드로</Button>
            </div>
          </div>
        </div>
      )}

      {/* Close confirm modal */}
      {confirming && (
        <div className="modal-backdrop" onClick={() => setConfirming(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="row gap-2 mb-2" style={{ alignItems:'center' }}>
              <span style={{ fontSize: 24 }}>📒</span>
              <h3 className="h3" style={{ margin:0 }}>오늘 정산을 마감할까요?</h3>
            </div>
            <p className="muted mb-3" style={{ fontSize: 13 }}>
              마감 후에는 <b>신규 주문을 받을 수 없으며</b> 정산 스냅샷이 고정됩니다.
              마감 직후 <b>ZIP 백업 다운로드</b>를 권장합니다.
            </p>
            <div className="settle-grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
              <div className="cell"><div className="lbl">총 주문</div><div className="num tabular" style={{fontSize:22}}>{orderCount}건</div></div>
              <div className="cell highlight"><div className="lbl">최종 정산</div><div className="num tabular" style={{fontSize:22}}>{won(netRevenue)}</div></div>
            </div>
            <div className="row gap-2 mt-3" style={{ justifyContent:'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>취소</Button>
              <Button variant="primary" size="md" onClick={doClose}>마감하기</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  AdminLogin, AdminTopNav, AdminSidebar,
  AdminDashboard, AdminOrderDetail, AdminTransfers, AdminSettlement,
});
