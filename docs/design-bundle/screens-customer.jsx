/* ============================================================
   사용자 화면 — SCREEN_STRUCTURE §3.1 ~ §3.14
   ★ 모바일 360-430px / 한 손 조작 / 하단 sticky CTA (UX-1)
   ============================================================ */

const fmt = n => n.toLocaleString('ko-KR');

/* ===== Header (공통) ===== */
function CustomerHeader({ go, cart, onMap, onClosedDemo, screen }) {
  const cartCount = cart.reduce((a,b) => a + b.qty, 0);
  return (
    <header className="app-header camo-gradient">
      <div className="brand" onClick={() => go('menu')} style={{cursor:'pointer'}}>
        <div className="brand-mark"/>
        <div>
          <div className="brand-name">오늘 저녁은 치킨이닭!</div>
          <span className="brand-subname">WINNER · WINNER · CHICKEN · DINNER</span>
        </div>
      </div>
      <div className="head-actions">
        <button className="icon-btn" onClick={onMap} aria-label="부스 미니맵">🗺️</button>
        <button className="icon-btn" onClick={() => go('cart')} aria-label="인벤토리">
          🎒
          {cartCount > 0 && <span className="count-badge">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}

/* ===== C-1 메뉴 목록 ===== */
function ScreenMenu({ go, cart, addToCart, openMap, loading }) {
  const [cat, setCat] = useState('전체');
  const filtered = useMemo(() => {
    if (cat === '추천') return window.MENUS.filter(m => m.recommended);
    if (cat === '전체') return window.MENUS;
    return window.MENUS.filter(m => m.cat === cat);
  }, [cat]);

  const subtotal = cart.reduce((a,b) => a + b.price * b.qty, 0);
  const cartCount = cart.reduce((a,b) => a + b.qty, 0);

  return (
    <>
      <CustomerHeader go={go} cart={cart} onMap={openMap} screen="menu"/>
      <nav className="cat-tabs" role="tablist">
        {window.CATEGORIES.map(c => (
          <button key={c} className={'cat-tab ' + (c === cat ? 'active' : '')}
                  onClick={() => setCat(c)} role="tab" aria-selected={c === cat}>
            {c}
          </button>
        ))}
      </nav>

      <div className="app-body">
        {loading ? (
          <LoadingState label="메뉴 가져오는 중..."/>
        ) : (
          <>
            {/* 추천 BEST — 2026-05-13 E: 정적 카피.
                🍗 = WINNER WINNER CHICKEN DINNER 직접 인용 (브랜드 정체성) */}
            <div className="best-banner">
              <div className="airdrop-icon" aria-hidden><span className="airdrop-grade">★</span></div>
              <div className="airdrop-body">
                <div className="airdrop-label">학생회 추천 BEST</div>
                <div className="airdrop-sub">뿌링클 · 후라이드</div>
              </div>
              <div className="airdrop-stencil" aria-hidden>WINNER WINNER<br/>CHICKEN DINNER</div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                title="이 분류엔 아직 없어요"
                body="다른 분류를 살펴보세요."
                actionLabel="전체 보기"
                onAction={() => setCat('전체')}/>
            ) : (
              <div className="menu-grid">
                {filtered.map(m => {
                  const inCart = cart.find(c => c.id === m.id);
                  return (
                    <article className={'menu-card ' + (m.sold ? 'sold-out' : '')} key={m.id}>
                      <div className="menu-illust">
                        <img className="menu-img" src={m.img} alt={m.name + ' — ' + m.tag} loading="lazy"/>
                        <span className="ammo-tag" aria-hidden>{m.tag}</span>
                        {m.recommended && !m.sold && (
                          <Stamp kind="recommended" style={{
                            position:'absolute', top: 8, left: 8, fontSize: 9, padding:'2px 6px'
                          }}>RECOMMENDED</Stamp>
                        )}
                        {m.sold && (
                          <Stamp kind="sold-out" style={{
                            position:'absolute', top:'50%', left:'50%',
                            transform:'translate(-50%,-50%) rotate(-12deg)', fontSize: 14, padding:'4px 10px'
                          }}>SOLD OUT</Stamp>
                        )}
                      </div>
                      <div className="menu-body">
                        <div className="menu-name">{m.name}</div>
                        <div className="menu-sub">{m.sub}</div>
                        <div className="price menu-price">{fmt(m.price)}원</div>
                        <button
                          className="pick-btn"
                          disabled={m.sold}
                          data-incart={inCart || undefined}
                          onClick={() => addToCart(m)}>
                          {m.sold ? 'SOLD OUT'
                            : inCart ? `✓ 인벤토리 ${inCart.qty}`
                            : '＋ 줍기'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <div style={{height: cartCount > 0 ? 80 : 24}}/>
          </>
        )}
      </div>

      {/* sticky cart bar — 카트에 1개+ 있을 때만 (UX-1) */}
      {cartCount > 0 && (
        <div className="sticky-bar">
          <Button variant="primary" size="lg" block onClick={() => go('cart')}>
            🎒 인벤토리 {cartCount}개 · {fmt(subtotal)}원 보기 →
          </Button>
        </div>
      )}
    </>
  );
}

/* ===== C-2 카트 (인벤토리) ===== */
function ScreenCart({ go, cart, setCart }) {
  const subtotal = cart.reduce((a,b) => a + b.price * b.qty, 0);
  const updateQty = (id, d) => setCart(c =>
    c.map(it => it.id === id ? { ...it, qty: Math.max(0, it.qty + d) } : it).filter(it => it.qty > 0)
  );
  const remove = id => setCart(c => c.filter(it => it.id !== id));

  return (
    <>
      <div className="back-bar">
        <button onClick={() => go('menu')} aria-label="뒤로">←</button>
        <h1>🎒 인벤토리</h1>
        <span className="meta">{cart.length} ITEMS</span>
      </div>
      <div className="app-body">
        {cart.length === 0 ? (
          <EmptyState
            title="아직 비어있어요"
            body="치킨이 기다려요! 메뉴부터 골라봐요."
            actionLabel="메뉴 보러 가기"
            onAction={() => go('menu')}
            mascotState="default"/>
        ) : (
          <>
            <div className="cart-list">
              {cart.map(it => (
                <div className="cart-line" key={it.id}>
                  <div className="thumb" aria-hidden>
                    <img src={it.img} alt={it.name}/>
                  </div>
                  <div>
                    <div className="name">{it.name}</div>
                    <div className="name-sub">{it.tag} · {it.sub}</div>
                    <div className="qty">
                      <button onClick={() => updateQty(it.id, -1)} aria-label="수량 감소">−</button>
                      <span>{it.qty}</span>
                      <button onClick={() => updateQty(it.id, +1)} aria-label="수량 증가">＋</button>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <button className="remove" onClick={() => remove(it.id)} aria-label="삭제">×</button>
                    <div className="price" style={{marginTop:4}}>{fmt(it.price * it.qty)}원</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="receipt">
              <div className="line">
                <span className="label">소계</span>
                <span className="price">{fmt(subtotal)}원</span>
              </div>
              <div className="line">
                <span className="label">쿠폰 할인 (다음 단계에서 적용)</span>
                <span style={{color:'var(--color-muted)', fontSize:12}}>—</span>
              </div>
              <div className="line total">
                <span className="label">합계</span>
                <span className="price price-lg" style={{color:'var(--color-accent)'}}>{fmt(subtotal)}원</span>
              </div>
            </div>
            <div style={{height: 80}}/>
          </>
        )}
      </div>
      {cart.length > 0 && (
        <div className="sticky-bar">
          <Button variant="primary" size="lg" block onClick={() => go('checkout')}>
            주문하기 · {fmt(subtotal)}원
          </Button>
        </div>
      )}
    </>
  );
}

/* ===== C-3 주문 폼 ===== */
function ScreenCheckout({ go, cart, submitOrder, submitting }) {
  const [external, setExternal] = useState(false);
  const [sid, setSid] = useState('');
  const [name, setName] = useState('');
  const [method, setMethod] = useState('dine-in');
  const [tableNo, setTableNo] = useState('');
  const [coupon, setCoupon] = useState(false);
  const [errors, setErrors] = useState({});

  /* G2-G5 통합 가드 (학과 코드 37, ADR-019 2026-05-13) */
  const sidIs9 = /^\d{9}$/.test(sid);
  const sidDeptOK = /^\d{2}\d{2}37\d{3}$/.test(sid);
  const nameValid = name.trim().length >= 1;
  // G3: 외부인 체크 시 쿠폰 자동 false
  useEffect(() => { if (external && coupon) setCoupon(false); }, [external]);
  const couponEligible = !external && sidIs9 && sidDeptOK && nameValid;
  const showCouponSection = !external && couponEligible;

  const subtotal = cart.reduce((a,b) => a + b.price * b.qty, 0);
  const discount = (coupon && couponEligible) ? 1000 : 0;
  const total = subtotal - discount;

  const onSubmit = () => {
    const e = {};
    if (!external) {
      if (!sidIs9) e.sid = '학번은 9자리 숫자입니다.';
      else if (!sidDeptOK) e.sid = '학번이 컴퓨터모바일융합과(코드 37)와 일치하지 않아요.';
    }
    if (!nameValid) e.name = '이름을 입력해 주세요.';
    if (method === 'dine-in' && !tableNo) e.table = '테이블 번호를 선택해 주세요.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    submitOrder({ external, sid, name: name.trim(), method, tableNo, coupon: coupon && couponEligible, total });
  };

  return (
    <>
      <div className="back-bar">
        <button onClick={() => go('cart')} aria-label="뒤로">←</button>
        <h1>주문 정보</h1>
      </div>
      <div className="app-body">
        {/* ① 외부인 분기 + 학번·이름 */}
        <div className="section">
          <div className="section-label">① 신원 확인</div>
          <div
            className={'checkbox-row emphatic ' + (external ? 'checked' : '')}
            onClick={() => setExternal(v => !v)}
            role="checkbox"
            aria-checked={external}>
            <span className="box">{external ? '✓' : ''}</span>
            <div>
              <div className="label">학번 없음 (외부인)</div>
              <div className="sub">가족·친구 등 학번이 없으신 분</div>
            </div>
          </div>

          <div className="field" style={{marginTop:12}}>
            <label>학번 <span className="req">*</span></label>
            <input
              className={'input mono ' + (errors.sid ? 'error' : '')}
              value={sid}
              onChange={e => setSid(e.target.value.replace(/\D/g,'').slice(0,9))}
              placeholder="예: 202637042"
              inputMode="numeric"
              pattern="\d{9}"
              maxLength={9}
              disabled={external}
              aria-invalid={!!errors.sid}/>
            <div className="hint">{external ? '학번 없음 체크 — 입력 안 함' : `${sid.length}/9자리`}</div>
            {errors.sid && <div className="err">{errors.sid}</div>}
          </div>

          <div className="field">
            <label>이름 <span className="req">*</span></label>
            <input
              className={'input ' + (errors.name ? 'error' : '')}
              value={name}
              onChange={e => setName(e.target.value.slice(0, 20))}
              placeholder="이체할 때 사용한 이름"
              aria-invalid={!!errors.name}/>
            {errors.name && <div className="err">{errors.name}</div>}
          </div>
        </div>

        {/* ② 수령 방법 */}
        <div className="section">
          <div className="section-label">② 수령 방법</div>
          <div className="radio-group">
            <div className={'radio-cell ' + (method === 'dine-in' ? 'active' : '')}
                 onClick={() => setMethod('dine-in')} role="radio" aria-checked={method==='dine-in'}>
              🍽️ 매장 식사
            </div>
            <div className={'radio-cell ' + (method === 'takeout' ? 'active' : '')}
                 onClick={() => setMethod('takeout')} role="radio" aria-checked={method==='takeout'}>
              📦 포장
            </div>
          </div>
          {method === 'dine-in' && (
            <div className="field" style={{marginTop:12}}>
              <label>테이블 번호 <span className="req">*</span></label>
              <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:6}}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                  <button key={n}
                    className={'radio-cell ' + (String(n) === tableNo ? 'active' : '')}
                    style={{padding:'10px 0', fontSize:14}}
                    onClick={() => setTableNo(String(n))}>
                    {n}
                  </button>
                ))}
              </div>
              {errors.table && <div className="err" style={{marginTop:6}}>{errors.table}</div>}
            </div>
          )}
        </div>

        {/* ③ 쿠폰 (G3: 외부인일 때 숨김) */}
        {!external && (
          <div className="section">
            <div className="section-label">③ 쿠폰</div>
            <div
              className={'checkbox-row ' + (coupon ? 'checked' : '') + (!couponEligible ? '' : '')}
              onClick={() => couponEligible && setCoupon(v => !v)}
              role="checkbox"
              aria-checked={coupon}
              aria-disabled={!couponEligible}
              style={{opacity: couponEligible ? 1 : 0.55, cursor: couponEligible ? 'pointer':'default'}}>
              <span className="box">{coupon ? '✓' : ''}</span>
              <div>
                <div className="label">쿠폰 사용 (컴모융 학생 한정 1,000원 할인)</div>
                <div className="sub">
                  {couponEligible
                    ? '✓ 학번 확인 완료 — 1,000원 할인 적용 가능'
                    : '※ 학번 9자리 + 이름 입력 시 활성화됩니다. (학과 코드 37 매칭)'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 영수증 미리보기 */}
        <div className="receipt">
          {cart.map(it => (
            <div key={it.id} className="line">
              <span className="label">{it.name} × {it.qty}</span>
              <span className="price">{fmt(it.price * it.qty)}원</span>
            </div>
          ))}
          {discount > 0 && (
            <div className="line">
              <span className="label">쿠폰 할인</span>
              <span className="price price-discount">−{fmt(discount)}원</span>
            </div>
          )}
          <div className="line total">
            <span className="label">합계</span>
            <span className="price price-lg" style={{color:'var(--color-accent)'}}>{fmt(total)}원</span>
          </div>
        </div>

        <div style={{height: 80}}/>
      </div>

      <div className="sticky-bar">
        <Button variant="primary" size="lg" block onClick={onSubmit} loading={submitting}>
          📋 주문 접수 · {fmt(total)}원
        </Button>
      </div>
    </>
  );
}

/* ===== C-4 주문 완료 (도그태그 절정) ===== */
function ScreenComplete({ go, order, openMap }) {
  return (
    <>
      <header className="app-header camo-gradient">
        <div className="brand">
          <div className="brand-mark"/>
          <div>
            <div className="brand-name">주문 접수 완료</div>
            <span className="brand-subname">ORDER · ISSUED</span>
          </div>
        </div>
        <button className="icon-btn" onClick={openMap} aria-label="부스 미니맵">🗺️</button>
      </header>

      <div className="app-body">
        <div className="dogtag-stage">
          <DogTag no={order.id} dropping pulse/>
          <h1 className="winner-copy">
            WINNER WINNER<br/>CHICKEN DINNER!
            <small>주문이 접수되었습니다 · 상태: {window.STATE_LABEL[order.status]}</small>
          </h1>
        </div>

        {/* 입금 안내 (1순위 다음 액션) */}
        <div className="account-card">
          <div className="acc-label">💸 입금 안내</div>
          <div className="acc-bank">국민은행 · 예금주 박동빈</div>
          <div className="acc-no">233001-04-403536</div>
          <div className="acc-amount">{fmt(order.total)} 원</div>
          <div className="acc-actions">
            <Button variant="secondary" size="sm" block onClick={() => navigator.clipboard?.writeText('23300104403536')}>
              📋 계좌번호 복사
            </Button>
            <Button variant="secondary" size="sm" block onClick={() => navigator.clipboard?.writeText(String(order.total))}>
              📋 금액 복사
            </Button>
          </div>
        </div>

        {/* 주문 내역 미니 */}
        <div className="receipt">
          {order.cart.map(it => (
            <div key={it.id} className="line">
              <span className="label">{it.name} × {it.qty}</span>
              <span className="price">{fmt(it.price * it.qty)}원</span>
            </div>
          ))}
          {order.coupon && (
            <div className="line">
              <span className="label">쿠폰 할인</span>
              <span className="price price-discount">−1,000원</span>
            </div>
          )}
          <div className="line total">
            <span className="label">총 결제</span>
            <span className="price price-lg" style={{color:'var(--color-accent)'}}>{fmt(order.total)}원</span>
          </div>
        </div>

        {/* 수령 정보 */}
        <div className="warn-banner info">
          📍 <span><b>{order.method === 'dine-in' ? `매장 식사 · 테이블 ${order.tableNo}` : '포장'}</b>
                  {order.method === 'dine-in' && <> · 미니맵에서 위치 확인</>}</span>
        </div>

        <div className="warn-banner danger">
          ⚠️ <span><b>이체 후 "확인 요청" 버튼을 꼭 눌러주세요.</b><br/>
            누르지 않으면 본부가 조리를 시작하지 못해요.</span>
        </div>

        <div style={{height: 100}}/>
      </div>

      <div className="sticky-bar" style={{flexDirection:'column', gap:6}}>
        <Button variant="primary" size="lg" block onClick={() => go('transfer')}>
          💸 이체했어요 · 확인 요청 보내기
        </Button>
        <Button variant="ghost" block onClick={() => go('status')}>
          🍗 조리 현황 보기
        </Button>
      </div>
    </>
  );
}

/* ===== C-5 이체 확인 요청 ===== */
function ScreenTransfer({ go, order, submitTransfer, submitting }) {
  const [bank, setBank] = useState('');
  const [altName, setAltName] = useState(false);
  const [altText, setAltText] = useState('');
  const [errors, setErrors] = useState({});
  const onSubmit = () => {
    const e = {};
    if (!bank) e.bank = '이체하신 은행을 선택해 주세요.';
    if (altName && !altText.trim()) e.alt = '이체자 이름을 입력해 주세요.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    submitTransfer({ bank, altName: altName ? altText.trim() : null });
  };
  return (
    <>
      <div className="back-bar">
        <button onClick={() => go('complete')} aria-label="뒤로">←</button>
        <h1>💸 이체 확인 요청</h1>
        <span className="meta">#{order.id}</span>
      </div>
      <div className="app-body">
        <div className="section">
          <div className="section-label">결제 정보 확인</div>
          <div className="receipt" style={{margin:0, background:'transparent', border:'none', padding:0}}>
            <div className="line">
              <span className="label">주문번호</span>
              <span className="price" style={{color:'var(--color-accent)'}}>#{order.id}</span>
            </div>
            <div className="line">
              <span className="label">주문자</span>
              <span>{order.name}</span>
            </div>
            <div className="line total">
              <span className="label">결제 금액</span>
              <span className="price price-lg" style={{color:'var(--color-accent)'}}>{fmt(order.total)}원</span>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-label">이체하신 은행</div>
          <div className="field">
            <select
              className={'select ' + (errors.bank ? 'error' : '')}
              value={bank}
              onChange={e => setBank(e.target.value)}
              aria-invalid={!!errors.bank}>
              <option value="">은행 선택...</option>
              <option>카카오뱅크</option>
              <option>국민은행</option>
              <option>신한은행</option>
              <option>우리은행</option>
              <option>농협</option>
              <option>토스뱅크</option>
              <option>기타</option>
            </select>
            {errors.bank && <div className="err">{errors.bank}</div>}
          </div>

          <div
            className={'checkbox-row ' + (altName ? 'checked' : '')}
            onClick={() => setAltName(v => !v)}
            role="checkbox" aria-checked={altName}>
            <span className="box">{altName ? '✓' : ''}</span>
            <div>
              <div className="label">다른 이름으로 이체했어요</div>
              <div className="sub">가족·대리 이체 시 체크</div>
            </div>
          </div>
          {altName && (
            <div className="field" style={{marginTop:12}}>
              <label>이체자 이름</label>
              <input
                className={'input ' + (errors.alt ? 'error' : '')}
                value={altText}
                onChange={e => setAltText(e.target.value.slice(0,20))}
                placeholder="통장에 찍힌 이름"/>
              {errors.alt && <div className="err">{errors.alt}</div>}
            </div>
          )}
        </div>

        <div className="warn-banner info">
          ℹ️ <span>본부가 통장 입금을 확인하면 자동으로 조리가 시작돼요. <b>이름·은행·금액·시각</b> 4가지가 일치해야 해요.</span>
        </div>
        <div style={{height: 80}}/>
      </div>
      <div className="sticky-bar">
        <Button variant="primary" size="lg" block onClick={onSubmit} loading={submitting}>
          확인 요청 보내기
        </Button>
      </div>
    </>
  );
}

/* ===== C-6 조리 현황판 (SSE 시뮬레이션) ===== */
function ScreenStatus({ go, order, sseDisconnected, retrySSE, openMap }) {
  const copy = window.STAGE_COPY[order.status] || window.STAGE_COPY.ORDERED;
  const mascotState = order.status === 'COOKING' ? 'cooking' :
                      order.status === 'READY' || order.status === 'DONE' ? 'arrived' : 'default';
  return (
    <>
      <header className="app-header camo-gradient">
        <div className="brand">
          <div className="brand-mark"/>
          <div>
            <div className="brand-name">🍗 조리 현황</div>
            <span className="brand-subname">ORDER #{order.id} · LIVE</span>
          </div>
        </div>
        <button className="icon-btn" onClick={openMap} aria-label="부스 미니맵">🗺️</button>
      </header>

      {sseDisconnected && (
        <BannerTop>연결이 잠시 끊겼어요. 다시 연결 중...
          <button style={{marginLeft:6, background:'transparent', border:'none', color:'#fff', textDecoration:'underline'}}
                  onClick={retrySSE}>재시도</button>
        </BannerTop>
      )}

      <div className="app-body">
        <Timeline current={order.status}/>

        <div style={{display:'flex', justifyContent:'center', padding:'8px 16px'}}>
          <Mascot size="md" state={mascotState}/>
        </div>

        {order.status === 'READY' ? (
          <div className="ready-banner" role="alert">
            <div className="big">✅ #{order.id}번<br/>수령 가능해요!</div>
            <div className="sub">부스에서 호명을 들어주세요.<br/>도그태그를 보여주세요.</div>
          </div>
        ) : (
          <div className="stage-copy">
            <div className="big">{copy.big.split('\n').map((l,i) => <span key={i}>{l}<br/></span>)}</div>
            <div className="sub">{copy.sub}</div>
          </div>
        )}

        <div style={{display:'flex', justifyContent:'center', padding:'8px 16px 16px'}}>
          <DogTag no={order.id} size="sm" pulse={order.status === 'READY'}/>
        </div>

        {/* HOLD 분기 — UX-9 회복 가능 */}
        {order.status === 'HOLD' && (
          <div className="warn-banner danger">
            ⚠️ <span><b>이체 정보가 일치하지 않아요.</b><br/>
              은행·이름을 다시 확인하고 재제출해 주세요.</span>
          </div>
        )}

        {/* 호명 후 안내 */}
        {order.status === 'DONE' && (
          <div className="warn-banner info">
            🎉 <span>맛있게 드세요! 정산은 종료 후 처리됩니다.</span>
          </div>
        )}

        <div style={{height: 60}}/>
      </div>

      <div className="sticky-bar" style={{flexDirection:'column', gap:6}}>
        <div style={{display:'flex', gap:8, justifyContent:'space-between',
                     fontSize:12, color:'var(--color-muted)', padding:'0 4px'}}>
          <span>현재 상태</span>
          <StatusChip status={order.status}/>
        </div>
        {order.status === 'HOLD' && (
          <Button variant="primary" size="lg" block onClick={() => go('transfer')}>
            이체 정보 다시 보내기
          </Button>
        )}
      </div>
    </>
  );
}

/* ===== C-7 부스 미니맵 모달 ===== */
function MinimapModal({ close, order }) {
  const myTable = order?.method === 'dine-in' ? order.tableNo : null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-head">
        <h2>🗺️ 부스 미니맵</h2>
        <button className="icon-btn" onClick={close} aria-label="닫기">✕</button>
      </div>
      <div className="modal-body">
        <div className="minimap">
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:10, color:'var(--color-muted)',
            letterSpacing:'0.1em', display:'flex', justifyContent:'space-between'
          }}>
            <span>BOOTH · A-12</span>
            <span>NORTH ↑</span>
          </div>
          <div className="grid">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
              <div key={n} className={'table ' + (String(n) === String(myTable) ? 'mine' : '')}>
                T{n}
              </div>
            ))}
          </div>
          <div className="entrance">🚪 ENTRANCE</div>
        </div>
        <div className="minimap-legend">
          <div>내 테이블: <strong>{myTable ? '#' + myTable : '— (포장)'}</strong></div>
          <div style={{color:'var(--color-muted)', fontSize:12}}>
            {myTable ? '형광 옐로 박스가 본인 자리예요.' : '포장 주문은 카운터에서 받으세요.'}
          </div>
        </div>
      </div>
      <div className="modal-foot">
        <Button variant="primary" size="lg" block onClick={close}>닫기</Button>
      </div>
    </div>
  );
}

/* ===== C-9 영업 외 안내 ===== */
function ScreenClosed({ refresh }) {
  return (
    <>
      <header className="app-header camo-gradient">
        <div className="brand">
          <div className="brand-mark"/>
          <div>
            <div className="brand-name">오늘 저녁은 치킨이닭!</div>
            <span className="brand-subname">CLOSED</span>
          </div>
        </div>
      </header>
      <div className="app-body">
        <div className="closed-screen">
          <div className="icon">🔒</div>
          <h1>영업 시간이 아니에요</h1>
          <Mascot size="md"/>
          <div className="schedule">
            <div className="label">운영 일정</div>
            <div className="item"><span>5/20 (수)</span><span>16:30 오픈</span></div>
            <div className="item"><span>5/21 (목)</span><span>16:30 오픈</span></div>
          </div>
          <p style={{color:'var(--color-muted)', maxWidth:280, textAlign:'center'}}>
            영업 시작 후 다시 방문해 주세요.
          </p>
          <Button variant="secondary" onClick={refresh}>🔄 새로고침</Button>
        </div>
      </div>
    </>
  );
}

/* ===== C-8 풀스크린 에러 (404/500) ===== */
function ScreenError({ code='404', go }) {
  return (
    <>
      <div className="back-bar">
        <button onClick={() => go('menu')} aria-label="뒤로">←</button>
        <h1>오류</h1>
      </div>
      <div className="app-body">
        <div className="error-state">
          <div className="code">{code}</div>
          <Mascot size="md"/>
          <h3>
            {code === '404' ? '이 페이지는 임무에서 사라졌어요' : '잠시 시스템에 문제가 생겼어요'}
          </h3>
          <p>
            {code === '404'
              ? '주소가 잘못됐거나 주문번호를 찾을 수 없어요.'
              : '곧 복구됩니다. 문제가 계속되면 부스에 직접 문의해 주세요.'}
          </p>
          <Button variant="primary" onClick={() => go('menu')}>홈으로</Button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, {
  ScreenMenu, ScreenCart, ScreenCheckout, ScreenComplete, ScreenTransfer,
  ScreenStatus, MinimapModal, ScreenClosed, ScreenError,
});
