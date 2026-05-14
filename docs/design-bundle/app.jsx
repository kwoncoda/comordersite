/* ============================================================
   App Shell — 라우터 state + Tweaks 패널 + 모바일 프레임
   ============================================================ */

const { useState, useEffect, useRef } = React;

/* ---------- TWEAK 기본값 (HOST 직접 편집 가능) ---------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "device": "phone",
  "accent": "#F4D200",
  "showMinimap": false,
  "sseDisconnected": false,
  "loading": false,
  "businessState": "CLOSED"
}/*EDITMODE-END*/;

function App() {
  /* router */
  const [screen, setScreen] = useState('menu');
  /* mock state */
  const [cart, setCart] = useState([]);
  const [order, setOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [minimap, setMinimap] = useState(false);
  const [sseDown, setSseDown] = useState(false);

  /* tweak state — useTweaks returns [values, setTweak] */
  const [tweaks, setTweak] = window.useTweaks
    ? window.useTweaks(TWEAK_DEFAULTS)
    : [TWEAK_DEFAULTS, () => {}];

  /* expose for tweaks panel */
  useEffect(() => {
    window.__proto = { screen, setScreen, order, setOrder, setCart, setSseDown };
  });

  /* accent override */
  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', tweaks.accent || '#F4D200');
  }, [tweaks.accent]);

  /* ---------- 액션 ---------- */
  function addToCart(menu) {
    setCart(c => {
      const ex = c.find(it => it.id === menu.id);
      if (ex) return c.map(it => it.id === menu.id ? { ...it, qty: it.qty + 1 } : it);
      return [...c, { ...menu, qty: 1 }];
    });
  }

  function submitOrder(form) {
    setSubmitting(true);
    setTimeout(() => {
      const id = 17 + Math.floor(Math.random() * 30);
      setOrder({
        id, ...form, cart, status: 'ORDERED',
        total: cart.reduce((a,b) => a + b.price * b.qty, 0) - (form.coupon ? 1000 : 0),
      });
      setSubmitting(false);
      setScreen('complete');
    }, 700);
  }

  function submitTransfer(payload) {
    setSubmitting(true);
    setTimeout(() => {
      setOrder(o => ({ ...o, status: 'TRANSFER_REPORTED', transfer: payload }));
      setSubmitting(false);
      setScreen('status');
      // SSE 시뮬레이션: 자동 진행
      autoAdvance();
    }, 700);
  }

  /* SSE 자동 진행 (TRANSFER_REPORTED → PAID → COOKING → READY) */
  const advanceTimer = useRef(null);
  function autoAdvance() {
    clearTimeout(advanceTimer.current);
    const seq = ['PAID', 'COOKING', 'READY'];
    let i = 0;
    function step() {
      if (i >= seq.length) return;
      const next = seq[i++];
      advanceTimer.current = setTimeout(() => {
        setOrder(o => o ? { ...o, status: next } : o);
        step();
      }, i === 1 ? 1800 : 3500);
    }
    step();
  }

  /* business state — middleware redirect 시뮬 */
  const businessState = tweaks.businessState || 'OPEN';

  /* keyboard shortcuts (USER_FLOW §4.3, 운영진 단축키 4종) */
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (minimap) setMinimap(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [minimap]);

  /* ---------- 화면 라우팅 ---------- */
  let body;
  if (businessState === 'CLOSED' && screen !== 'admin' && screen !== 'closed-demo') {
    body = <ScreenClosed refresh={() => setTweak('businessState', 'OPEN')}/>;
  } else if (tweaks.loading) {
    body = (
      <>
        <header className="app-header camo-gradient">
          <div className="brand">
            <div className="brand-mark"/>
            <div>
              <div className="brand-name">오늘 저녁은 치킨이닭!</div>
              <span className="brand-subname">LOADING · STATE</span>
            </div>
          </div>
        </header>
        <div className="app-body"><LoadingState label="메뉴 가져오는 중..."/></div>
      </>
    );
  } else if (screen === 'menu') {
    body = <ScreenMenu go={setScreen} cart={cart} addToCart={addToCart} openMap={() => setMinimap(true)} loading={false}/>;
  } else if (screen === 'cart') {
    body = <ScreenCart go={setScreen} cart={cart} setCart={setCart}/>;
  } else if (screen === 'checkout') {
    body = <ScreenCheckout go={setScreen} cart={cart} submitOrder={submitOrder} submitting={submitting}/>;
  } else if (screen === 'complete' && order) {
    body = <ScreenComplete go={setScreen} order={order} openMap={() => setMinimap(true)}/>;
  } else if (screen === 'transfer' && order) {
    body = <ScreenTransfer go={setScreen} order={order} submitTransfer={submitTransfer} submitting={submitting}/>;
  } else if (screen === 'status' && order) {
    body = <ScreenStatus go={setScreen} order={order} sseDisconnected={sseDown || tweaks.sseDisconnected}
                         retrySSE={() => setSseDown(false)} openMap={() => setMinimap(true)}/>;
  } else if (screen === 'error-404') {
    body = <ScreenError code="404" go={setScreen}/>;
  } else if (screen === 'error-500') {
    body = <ScreenError code="500" go={setScreen}/>;
  } else if (screen === 'closed-demo') {
    body = <ScreenClosed refresh={() => setScreen('menu')}/>;
  } else {
    // fallback when state is missing
    body = <ScreenMenu go={setScreen} cart={cart} addToCart={addToCart} openMap={() => setMinimap(true)}/>;
  }

  return (
    <>
      <div className="canvas">
        <div className="canvas-title">
          오늘 저녁은 치킨이닭! — Clickable Prototype
          <b>WINNER · WINNER · CHICKEN · DINNER</b>
        </div>

        {/* 모바일 프레임 (사용자) */}
        <div data-screen-label={`Customer · ${screen}`}>
          <div style={{textAlign:'center', marginBottom:8, fontFamily:'var(--font-mono)',
                       fontSize:11, color:'var(--color-muted)', letterSpacing:'0.1em'}}>
            📱 CUSTOMER · {screen.toUpperCase()}
          </div>
          <div className="phone">
            <PhoneChrome time="17:48"/>
            <div className="phone-screen" style={{paddingTop:44}}>
              {screen === 'admin' ? (
                <ScreenMenu go={setScreen} cart={cart} addToCart={addToCart} openMap={() => setMinimap(true)}/>
              ) : body}
              {minimap && (
                <MinimapModal close={() => setMinimap(false)} order={order}/>
              )}
            </div>
          </div>
        </div>

        {/* 관리자 PC (A-2) — 절대 흐름의 인간 병목 (PRD §11.1) */}
        <div data-screen-label="Admin · Dashboard">
          <div style={{textAlign:'center', marginBottom:8, fontFamily:'var(--font-mono)',
                       fontSize:11, color:'var(--color-muted)', letterSpacing:'0.1em'}}>
            🖥️ ADMIN · DASHBOARD (A-2)
          </div>
          <div className="desktop">
            <div className="desktop-chrome">
              <span/><span/><span/>
              <span className="url">치킨이닭.local/admin/dashboard</span>
            </div>
            <AdminApp
              businessState={businessState}
              openBusiness={() => setTweak('businessState', 'OPEN')}
              onPriceChange={() => setCart(c => c.map(it => {
                const m = window.MENUS.find(x => x.id === it.id);
                return m ? { ...it, price: m.price } : it;
              }))}/>
          </div>
        </div>
      </div>

      <TweaksHost screen={screen} setScreen={setScreen}
                  tweaks={tweaks} setTweak={setTweak}
                  setOrder={setOrder} setCart={setCart} order={order}
                  setSseDown={setSseDown}/>
    </>
  );
}

/* ============================================================
   Tweaks panel — 화면 점프 + 상태 강제 천이 + 빈/로딩/오류 토글
   ============================================================ */
function TweaksHost({ screen, setScreen, tweaks, setTweak, setOrder, setCart, order, setSseDown }) {
  if (!window.TweaksPanel) return null;
  const { TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakToggle, TweakButton, TweakSelect } = window;

  const jumpToOrder = (status) => {
    setOrder(o => o || {
      id: 17, name: '데모',
      method: 'dine-in', tableNo: '7',
      cart: [
        { ...window.MENUS[0], qty: 1 },
        { ...window.MENUS[6], qty: 2 },
      ],
      total: 22000,
      coupon: true,
      status,
    });
    setOrder(o => o ? { ...o, status } : o);
    setScreen('status');
  };

  const jumpButtons = [
    { label: 'C-1 메뉴',    onClick: () => setScreen('menu') },
    { label: 'C-2 카트',    onClick: () => setScreen('cart') },
    { label: 'C-3 주문폼',  onClick: () => setScreen('checkout') },
    { label: 'C-4 도그태그', onClick: () => {
        setOrder({
          id: 17, name: '홍길동',
          method: 'dine-in', tableNo: '7',
          cart: [{ ...window.MENUS[2], qty: 1 }, { ...window.MENUS[6], qty: 2 }],
          total: 24000, coupon: true, status: 'ORDERED',
        });
        sessionStorage.removeItem('dogtag-shown-17');
        setScreen('complete');
      } },
    { label: 'C-5 이체',    onClick: () => setScreen('transfer') },
    { label: 'C-6 현황',    onClick: () => setScreen('status') },
  ];

  return (
    <TweaksPanel title="Tweaks · 시연용">
      <TweakSection label="화면 점프 (사용자)">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
          {jumpButtons.map(b => (
            <TweakButton key={b.label} label={b.label} onClick={b.onClick}/>
          ))}
        </div>
      </TweakSection>

      <TweakSection label="조리 단계 강제 천이 (SSE 시뮬)">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
          {['ORDERED','TRANSFER_REPORTED','PAID','COOKING','READY','DONE','HOLD'].map(s => (
            <TweakButton key={s} label={s} onClick={() => jumpToOrder(s)}/>
          ))}
        </div>
      </TweakSection>

      <TweakSection label="에러·빈·로딩 상태">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
          <TweakButton label="빈 카트" onClick={() => { setCart([]); setScreen('cart'); }}/>
          <TweakButton label="404" onClick={() => setScreen('error-404')}/>
          <TweakButton label="500" onClick={() => setScreen('error-500')}/>
          <TweakButton label="영업 외" onClick={() => setScreen('closed-demo')}/>
        </div>
        <TweakToggle label="메뉴 로딩 상태" value={tweaks.loading}
                     onChange={v => setTweak('loading', v)}/>
        <TweakToggle label="SSE 끊김 배너" value={tweaks.sseDisconnected}
                     onChange={v => setTweak('sseDisconnected', v)}/>
      </TweakSection>

      <TweakSection label="영업 상태 (G13)">
        <TweakRadio label="시스템"
          options={['OPEN', 'CLOSED']}
          value={tweaks.businessState}
          onChange={v => setTweak('businessState', v)}/>
      </TweakSection>

      <TweakSection label="브랜드 액센트">
        <TweakColor label="액센트"
          options={['#F4D200', '#FF6B35', '#5A8C42', '#3A6B7E']}
          value={tweaks.accent}
          onChange={v => setTweak('accent', v)}/>
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
