/* ============================================================
   app.jsx — Router + state + Stage shell + Tweaks
   ============================================================ */
const { useState, useEffect, useReducer } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "boothName": "치킨이닭!",
  "accent": "#F4D200",
  "mascotEnabled": true,
  "showStamps": true,
  "density": "comfortable",
  "demoMode": "customer"
}/*EDITMODE-END*/;

function reducer(state, action) {
  switch (action.type) {
    case 'firstLoadDone': return { ...state, firstLoad: false };
    case 'nav': return { ...state, screen: action.to };
    case 'addToCart': {
      const exists = state.cart.find(([id]) => id === action.id);
      const cart = exists
        ? state.cart.map(([id, q]) => id === action.id ? [id, q + 1] : [id, q])
        : [...state.cart, [action.id, 1]];
      return { ...state, cart };
    }
    case 'qty': {
      const cart = state.cart
        .map(([id, q]) => id === action.id ? [id, Math.max(0, q + action.delta)] : [id, q])
        .filter(([, q]) => q > 0);
      return { ...state, cart };
    }
    case 'remove':
      return { ...state, cart: state.cart.filter(([id]) => id !== action.id) };
    case 'submitOrder': {
      const o = action.payload;
      return {
        ...state,
        screen: 'complete',
        order: { id: state.nextOrderId, status: 'ORDERED', ...o, items: o.items.map(i => ({ ...i })) },
        nextOrderId: state.nextOrderId + 1,
        cart: [],
      };
    }
    case 'transferReported':
      return {
        ...state,
        screen: 'status',
        order: { ...state.order, status: 'TRANSFER_REPORTED', bank: action.bank, altName: action.altName },
      };
    case 'setOrderStatus':
      return { ...state, order: { ...state.order, status: action.status } };
    case 'reset':
      return INITIAL_STATE;
    default:
      return state;
  }
}

const INITIAL_STATE = {
  firstLoad: true,
  screen: 'menu',
  cart: [],
  nextOrderId: 17,
  order: null,
  sseDisconnected: false,
};

function App() {
  const [state, dispatch] = React.useReducer(reducer, INITIAL_STATE);
  const [adminState, setAdmin] = useState({
    loggedIn: false,
    page: 'login',
    selectedId: null,
    orders: MOCK_ORDERS_SEED.map(o => ({ ...o })),
  });
  const [view, setView] = useState('customer'); // customer | admin | both
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // Tweaks host protocol
  useEffect(() => {
    function onMsg(e) {
      if (e.data?.type === '__activate_edit_mode')   setTweaksOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    }
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  function setTweak(keyOrObj, value) {
    const patch = typeof keyOrObj === 'string' ? { [keyOrObj]: value } : keyOrObj;
    setTweaks(t => ({ ...t, ...patch }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
  }

  // Apply accent override
  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', tweaks.accent);
  }, [tweaks.accent]);

  // Quick-jump screen helpers
  function jumpCustomer(screen) {
    if (screen === 'complete' || screen === 'transfer' || screen === 'status') {
      // ensure order exists
      if (!state.order) {
        dispatch({ type: 'submitOrder', payload: {
          items: [
            { ...MENUS.find(m => m.id === 'm1'), qty: 1 },
            { ...MENUS.find(m => m.id === 'm7'), qty: 2 },
          ],
          subtotal: 22000, discount: 1000, total: 21000,
          name: '홍길동', sid: '202637042', external: false,
          mode: '매장', table: '9', coupon: true,
        }});
        setTimeout(() => dispatch({ type: 'nav', to: screen }), 0);
      } else {
        dispatch({ type: 'nav', to: screen });
      }
    } else if (screen === 'cart-empty') {
      dispatch({ type: 'reset' });
      dispatch({ type: 'nav', to: 'cart' });
    } else if (screen === 'status-cooking') {
      jumpCustomer('status');
      setTimeout(() => dispatch({ type: 'setOrderStatus', status: 'COOKING' }), 10);
    } else if (screen === 'status-ready') {
      jumpCustomer('status');
      setTimeout(() => dispatch({ type: 'setOrderStatus', status: 'READY' }), 10);
    } else if (screen === 'status-done') {
      jumpCustomer('status');
      setTimeout(() => dispatch({ type: 'setOrderStatus', status: 'DONE' }), 10);
    } else {
      dispatch({ type: 'nav', to: screen });
    }
  }

  // Customer screen render
  function renderCustomer() {
    if (state.screen === 'menu')     return <ScreenMenu state={state} dispatch={dispatch} />;
    if (state.screen === 'cart')     return <ScreenCart state={state} dispatch={dispatch} />;
    if (state.screen === 'checkout') return <ScreenCheckout state={state} dispatch={dispatch} />;
    if (state.screen === 'complete') return state.order
      ? <ScreenComplete state={state} dispatch={dispatch} />
      : <EmptyState mascot="default" title="진행 중인 주문이 없어요" body="메뉴부터 주문해 주세요." ctaLabel="메뉴 보기" onCta={() => dispatch({type:'nav', to:'menu'})} />;
    if (state.screen === 'transfer') return state.order
      ? <ScreenTransfer state={state} dispatch={dispatch} />
      : <EmptyState mascot="default" title="진행 중인 주문이 없어요" ctaLabel="메뉴 보기" onCta={() => dispatch({type:'nav', to:'menu'})} />;
    if (state.screen === 'status')   return state.order
      ? <ScreenStatus state={state} dispatch={dispatch} />
      : <EmptyState mascot="default" title="진행 중인 주문이 없어요" ctaLabel="메뉴 보기" onCta={() => dispatch({type:'nav', to:'menu'})} />;
    return null;
  }

  // Admin render
  function renderAdmin() {
    if (!adminState.loggedIn) return <AdminLogin adminState={adminState} setAdmin={setAdmin} />;
    return (
      <>
        <AdminTopNav adminState={adminState} setAdmin={setAdmin} />
        {adminState.page === 'dashboard' && <AdminDashboard adminState={adminState} setAdmin={setAdmin} />}
        {adminState.page === 'detail'    && <AdminOrderDetail adminState={adminState} setAdmin={setAdmin} />}
        {adminState.page === 'transfers' && <AdminTransfers adminState={adminState} setAdmin={setAdmin} />}
      </>
    );
  }

  return (
    <div className="stage" data-screen-label={view === 'customer' ? 'Customer' : 'Admin'}>
      <header className="stage-header">
        <span className="crumb">
          COMORDER <b>// 시안 프로토타입</b> · DESIGN.md · UX_STRATEGY.md
        </span>
        <div className="stage-modes" role="tablist">
          <button className={view === 'customer' ? 'active' : ''} onClick={() => setView('customer')}>CUSTOMER</button>
          <button className={view === 'admin'    ? 'active' : ''} onClick={() => setView('admin')}>ADMIN</button>
          <button className={view === 'both'     ? 'active' : ''} onClick={() => setView('both')}>BOTH</button>
        </div>
        <span className="crumb" style={{ textAlign: 'right' }}>
          v0.1 · 2026-05-12
        </span>
      </header>

      <div style={{
        display: 'flex', gap: 24,
        flexDirection: view === 'both' ? 'row' : 'column',
        alignItems: view === 'both' ? 'flex-start' : 'center',
        justifyContent: 'center',
        width: '100%', maxWidth: 1400,
      }}>
        {(view === 'customer' || view === 'both') && (
          <CustomerStage state={state} render={renderCustomer} />
        )}
        {(view === 'admin' || view === 'both') && (
          <AdminStage adminState={adminState} render={renderAdmin} />
        )}
      </div>

      {tweaksOpen && (
        <TweaksPanel onClose={() => { setTweaksOpen(false); window.parent.postMessage({type:'__edit_mode_dismissed'},'*'); }}>
          <TweakSection title="현재 보기">
            <TweakRadio
              label="시연 모드"
              value={view}
              onChange={setView}
              options={[
                { value: 'customer', label: '사용자' },
                { value: 'admin',    label: '관리자' },
              ]}
            />
          </TweakSection>

          {view !== 'admin' && (
            <TweakSection title="사용자 빠른 이동">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 6 }}>
                {[
                  ['C-1 메뉴', 'menu'],
                  ['C-1 첫로딩', 'first-load'],
                  ['C-2 카트', 'cart'],
                  ['C-2 빈카트', 'cart-empty'],
                  ['C-3 폼', 'checkout'],
                  ['C-4 완료', 'complete'],
                  ['C-5 이체', 'transfer'],
                  ['C-6 입금대기', 'status'],
                  ['C-6 조리중', 'status-cooking'],
                  ['C-6 수령가능', 'status-ready'],
                  ['C-6 수령완료', 'status-done'],
                ].map(([label, screen]) => (
                  <TweakButton key={screen} onClick={() => {
                    if (screen === 'first-load') { dispatch({ type:'reset' }); }
                    else jumpCustomer(screen);
                  }}>{label}</TweakButton>
                ))}
              </div>
            </TweakSection>
          )}

          {view !== 'customer' && (
            <TweakSection title="관리자 빠른 이동">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 6 }}>
                <TweakButton onClick={() => setAdmin({...adminState, loggedIn: false, page: 'login'})}>A-1 PIN 로그인</TweakButton>
                <TweakButton onClick={() => setAdmin({...adminState, loggedIn: true, page: 'dashboard'})}>A-2 대시보드</TweakButton>
                <TweakButton onClick={() => setAdmin({...adminState, loggedIn: true, page: 'detail', selectedId: 17})}>A-3 주문 상세</TweakButton>
                <TweakButton onClick={() => setAdmin({...adminState, loggedIn: true, page: 'transfers'})}>A-4 이체 확인</TweakButton>
              </div>
            </TweakSection>
          )}

          <TweakSection title="비주얼">
            <TweakColor
              label="액센트 색상"
              value={tweaks.accent}
              onChange={(v) => setTweak('accent', v)}
              options={['#F4D200', '#E59B0C', '#5A8C42', '#3A6B7E', '#C73E1D']}
            />
          </TweakSection>

          <TweakSection title="상태 시뮬레이션 (C-6)">
            <div style={{ display:'flex', flexDirection:'column', gap: 4 }}>
              {['ORDERED','TRANSFER_REPORTED','PAID','COOKING','READY','DONE','CANCELED'].map(s => (
                <TweakButton key={s} onClick={() => {
                  if (!state.order) jumpCustomer('complete');
                  setTimeout(() => dispatch({ type:'setOrderStatus', status: s }), 5);
                  setTimeout(() => dispatch({ type:'nav', to: 'status' }), 10);
                }}>{STATUS_LABELS[s]?.label || s}</TweakButton>
              ))}
            </div>
          </TweakSection>
        </TweaksPanel>
      )}
    </div>
  );
}

function CustomerStage({ state, render }) {
  return (
    <div className="phone" data-screen-label="01 Customer mobile">
      <div className="phone-statusbar">
        <span className="tabular">19:32</span>
        <span className="right">
          <span>●●●●</span>
          <span>📶</span>
          <span style={{ display:'inline-block', width: 18, height: 9, border: '1.5px solid currentColor', borderRadius: 2, padding: 1, boxSizing:'content-box' }}>
            <span style={{ display:'block', width: '70%', height: '100%', background:'currentColor' }} />
          </span>
        </span>
      </div>
      <div className="phone-browserbar">
        <span className="lock">🔒</span>
        <span className="url">order.cm-fest.kr/menu</span>
        <span>⋯</span>
      </div>
      <div className="phone-screen" data-screen-label="phone">
        {render()}
      </div>
    </div>
  );
}

function AdminStage({ adminState, render }) {
  return (
    <div className="admin-frame" data-screen-label="02 Admin desktop">
      <div className="admin-chrome">
        <span className="dot r"/><span className="dot y"/><span className="dot g"/>
        <span className="label">CHICKEN HQ — Command Post · admin.cm-fest.kr</span>
      </div>
      {render()}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
