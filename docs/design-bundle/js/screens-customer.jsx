/* ============================================================
   screens-customer.jsx — C-1 ~ C-6 사용자 모바일 화면들
   ============================================================ */
const { useState, useEffect, useMemo, useRef } = React;

/* ───────────────────────── C-1 메뉴 목록 ───────────────────────── */
function ScreenMenu({ state, dispatch }) {
  const [cat, setCat] = useState('전체');
  const [loading, setLoading] = useState(state.firstLoad);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (state.firstLoad) {
      const t = setTimeout(() => {
        setLoading(false);
        dispatch({ type: 'firstLoadDone' });
      }, 700);
      return () => clearTimeout(t);
    }
  }, []);

  const filtered = useMemo(() => {
    if (cat === '전체')   return MENUS;
    if (cat === '🔥인기') return MENUS.filter(m => m.popular).concat(MENUS.filter(m => !m.popular).slice(0, 3));
    if (cat === '⭐추천') return MENUS.filter(m => m.recommended);
    return MENUS.filter(m => m.cat === cat);
  }, [cat]);

  const cartCount = state.cart.reduce((a, [, q]) => a + q, 0);
  const cartTotal = state.cart.reduce((sum, [mid, q]) =>
    sum + (MENUS.find(m => m.id === mid)?.price || 0) * q, 0);

  if (loading) {
    return (
      <>
        <TopbarBrand state={state} dispatch={dispatch} />
        <LoadingState label="오늘의 메뉴를 불러오는 중..." size="lg" />
      </>
    );
  }
  if (error) {
    return (
      <>
        <TopbarBrand state={state} dispatch={dispatch} />
        <ErrorState
          title="메뉴를 불러올 수 없어요"
          body="네트워크를 확인하고 다시 시도하거나, 부스에 직접 문의해 주세요."
          ctaLabel="다시 시도"
          onCta={() => setError(false)}
        />
      </>
    );
  }

  return (
    <>
      <TopbarBrand state={state} dispatch={dispatch} />
      <div className="cat-tabs">
        {CATEGORIES.map(c => (
          <button key={c} className={'cat-tab' + (c === cat ? ' active' : '')} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {/* 🔥 popular strip */}
      <div className="popular-strip" role="region" aria-label="실시간 인기 메뉴">
        <div>
          <div className="rank">REALTIME // 🔥 TOP 1</div>
          <div className="name">뿌링클 — 37개 출고</div>
          <div className="copy">"압도적 1위! 후라이드와 18개 차이"</div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          mascot="default"
          title="이 분류에 메뉴가 없어요"
          body="다른 분류를 골라보세요."
          ctaLabel="전체 보기"
          onCta={() => setCat('전체')}
        />
      ) : (
        <div className="menu-grid" style={{ padding: '12px 16px 16px' }}>
          {filtered.map(m => {
            const inCart = state.cart.find(([id]) => id === m.id);
            return (
              <article key={m.id} className={'menu-card' + (m.soldOut ? ' is-sold' : '')}>
                {m.recommended && !m.soldOut && (
                  <div className="stamp-overlay"><Stamp kind="recommended" rotate={-6} /></div>
                )}
                {m.soldOut && (
                  <div className="stamp-overlay sold"><Stamp kind="sold-out" rotate={-12} /></div>
                )}
                <MenuFallback category={m.cat} />
                <div className="body">
                  <div className="name">{m.name}</div>
                  <div className="price tabular">{won(m.price)}</div>
                  <button
                    className={'add' + (inCart ? ' in-cart' : '')}
                    disabled={m.soldOut}
                    onClick={() => dispatch({ type: 'addToCart', id: m.id })}
                  >
                    {m.soldOut ? '품절' : inCart ? `카트 ✓ ${inCart[1]}` : '+ 카트 담기'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {cartCount > 0 && (
        <div className="bottom-bar">
          <Button variant="primary" size="lg" block onClick={() => dispatch({ type: 'nav', to: 'cart' })}>
            <span>🛒</span>
            <span>{cartCount}개 · {won(cartTotal)} · 카트 보기 →</span>
          </Button>
        </div>
      )}
    </>
  );
}

function TopbarBrand({ state, dispatch }) {
  const cartCount = state.cart.reduce((a, [, q]) => a + q, 0);
  return (
    <div className="topbar">
      <div className="brand">
        <span className="logo">🪖</span>
        <div className="col">
          <span className="title">오늘 저녁은 치킨이닭!</span>
          <span className="sub">WINNER WINNER · 컴모융</span>
        </div>
      </div>
      <button className="back" aria-label="카트" onClick={() => dispatch({ type: 'nav', to: 'cart' })}>
        🛒{cartCount > 0 && <span style={{ marginLeft: 4 }}><CountBadge value={cartCount} /></span>}
      </button>
    </div>
  );
}

function TopbarBack({ title, onBack, right }) {
  return (
    <div className="topbar">
      <div className="row gap-3">
        <button className="back" aria-label="뒤로" onClick={onBack}>←</button>
        <div className="h3">{title}</div>
      </div>
      <div>{right}</div>
    </div>
  );
}

/* ───────────────────────── C-2 카트 ───────────────────────── */
function ScreenCart({ state, dispatch }) {
  const items = state.cart.map(([id, q]) => ({ ...MENUS.find(m => m.id === id), qty: q }));
  const total = items.reduce((s, m) => s + m.price * m.qty, 0);
  const count = items.reduce((s, m) => s + m.qty, 0);

  if (count === 0) {
    return (
      <>
        <TopbarBack title="카트" onBack={() => dispatch({ type: 'nav', to: 'menu' })} />
        <EmptyState
          mascot="default"
          title="치킨이 기다려요!"
          body="메뉴부터 골라봐요. 오늘 1학년은 쿠폰 1,000원 할인!"
          ctaLabel="메뉴 보기"
          onCta={() => dispatch({ type: 'nav', to: 'menu' })}
        />
      </>
    );
  }

  return (
    <>
      <TopbarBack title={`카트 (${count})`} onBack={() => dispatch({ type: 'nav', to: 'menu' })} />
      <div className="screen screen-pad-lg">
        <div className="card">
          {items.map(m => (
            <div className="cart-line" key={m.id}>
              <div className="thumb"><MenuFallback category={m.cat} /></div>
              <div className="col gap-2">
                <div className="bold" style={{ fontSize: 15 }}>{m.name}</div>
                <div className="muted tabular" style={{ fontSize: 13 }}>{won(m.price)}</div>
                <div className="qty" role="group" aria-label={`${m.name} 수량`}>
                  <button aria-label="줄이기" onClick={() => dispatch({ type: 'qty', id: m.id, delta: -1 })}>−</button>
                  <span className="num">{m.qty}</span>
                  <button aria-label="늘리기" onClick={() => dispatch({ type: 'qty', id: m.id, delta: +1 })}>＋</button>
                </div>
              </div>
              <button
                aria-label={`${m.name} 삭제`}
                onClick={() => dispatch({ type: 'remove', id: m.id })}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize: 20, color:'var(--color-muted)' }}>
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="card mt-4">
          <div className="receipt-line">
            <span className="label">소계</span>
            <span className="val tabular">{won(total)}</span>
          </div>
          <div className="receipt-line muted">
            <span>쿠폰 (1학년, 다음 단계 적용)</span>
            <span>-1,000원</span>
          </div>
          <div className="divider-dashed" />
          <div className="receipt-line total">
            <span>합계</span>
            <span className="val tabular">{won(total - 1000)}</span>
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <Button variant="primary" size="lg" block onClick={() => dispatch({ type: 'nav', to: 'checkout' })}>
          주문 정보 입력 →
        </Button>
      </div>
    </>
  );
}

/* ───────────────────────── C-3 주문 폼 ───────────────────────── */
function ScreenCheckout({ state, dispatch }) {
  const items = state.cart.map(([id, q]) => ({ ...MENUS.find(m => m.id === id), qty: q }));
  const subtotal = items.reduce((s, m) => s + m.price * m.qty, 0);

  const [external, setExternal] = useState(false);
  const [sid, setSid] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('매장');
  const [table, setTable] = useState('');
  const [coupon, setCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // 쿠폰: 1학년 (학번 prefix 2026)
  const couponEligible = !external && /^2026\d{5}$/.test(sid);
  const discount = coupon && couponEligible ? 1000 : 0;
  const total = subtotal - discount;

  function submit() {
    const e = {};
    if (!external && !/^\d{9}$/.test(sid)) e.sid = '학번은 9자리 숫자입니다.';
    if (!name.trim()) e.name = '이름을 입력해 주세요.';
    if (mode === '매장' && !table) e.table = '테이블 번호를 입력해 주세요.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    setTimeout(() => {
      dispatch({ type: 'submitOrder', payload: {
        items, subtotal, discount, total,
        name, sid: external ? '' : sid, external,
        mode, table: mode === '매장' ? table : null,
        coupon: discount > 0,
      }});
    }, 800);
  }

  return (
    <>
      <TopbarBack title="주문 정보" onBack={() => dispatch({ type: 'nav', to: 'cart' })} />
      <div className="screen screen-pad-lg col gap-6">
        {/* 외부인 분기 */}
        <Checkbox
          checked={external}
          onChange={setExternal}
          sub="가족·친구 등 학번이 없으신 분"
        >학번 없음 (외부인)</Checkbox>

        {/* 학번 + 이름 */}
        <div className="col gap-3">
          <div className="section-label">① 신분 확인</div>
          {!external && (
            <Field
              label="학번"
              required
              hint={`9자리 숫자 · 현재 ${sid.length}/9자리`}
              error={errors.sid}
              htmlFor="sid"
            >
              <Input
                id="sid"
                type="tel"
                inputMode="numeric"
                pattern="\d{9}"
                maxLength={9}
                value={sid}
                onChange={(e) => setSid(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="예: 202637042"
                className="mono"
                error={errors.sid}
              />
            </Field>
          )}
          <Field label="이름" required error={errors.name} htmlFor="name">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
              error={errors.name}
            />
          </Field>
        </div>

        {/* 수령 방법 */}
        <div className="col gap-3">
          <div className="section-label">② 수령 방법</div>
          <RadioGroup
            value={mode}
            onChange={setMode}
            options={[
              { value: '매장', label: '🪑 매장 식사' },
              { value: '포장', label: '🛍️ 포장' },
            ]}
          />
          {mode === '매장' && (
            <Field label="테이블 번호" required error={errors.table} htmlFor="table">
              <Input
                id="table"
                type="tel"
                inputMode="numeric"
                value={table}
                onChange={(e) => setTable(e.target.value.replace(/\D/g, ''))}
                placeholder="예: 9"
                className="mono"
                error={errors.table}
              />
            </Field>
          )}
        </div>

        {/* 쿠폰 */}
        <div className="col gap-3">
          <div className="section-label">③ 쿠폰</div>
          <Checkbox
            checked={coupon}
            onChange={setCoupon}
            sub={couponEligible
              ? '✓ 1학년 (2026학번) — 1,000원 할인 적용 가능'
              : '※ 1학년(2026 학번)만 사용 가능. 학번 입력 시 자동 판정.'}
          >쿠폰 사용 (1학년 한정 1,000원 할인)</Checkbox>
        </div>

        {/* 주문 요약 */}
        <div className="card">
          <div className="section-label" style={{ marginBottom: 8 }}>주문 요약</div>
          {items.map(m => (
            <div className="receipt-line" key={m.id}>
              <span>{m.name} × {m.qty}</span>
              <span className="val tabular">{won(m.price * m.qty)}</span>
            </div>
          ))}
          <div className="divider-dashed" />
          <div className="receipt-line"><span className="label">소계</span><span className="val tabular">{won(subtotal)}</span></div>
          {discount > 0 && (
            <div className="receipt-line discount"><span className="label">쿠폰 할인</span><span className="val tabular">-{won(discount)}</span></div>
          )}
          <div className="receipt-line total"><span>합계</span><span className="val tabular">{won(total)}</span></div>
        </div>
      </div>

      <div className="bottom-bar">
        <Button variant="primary" size="lg" block loading={submitting} onClick={submit}>
          {submitting ? '주문 접수 중...' : `주문 접수 · ${won(total)}`}
        </Button>
      </div>
    </>
  );
}

/* ───────────────────────── C-4 주문 완료 (도그태그) ───────────────────────── */
function ScreenComplete({ state, dispatch }) {
  const o = state.order;
  // sessionStorage flag for dogtag drop (per DESIGN §9.3)
  const dropKey = 'dogtag-shown-' + o.id;
  const [drop, setDrop] = useState(() => !sessionStorage.getItem(dropKey));
  useEffect(() => {
    if (drop) sessionStorage.setItem(dropKey, '1');
  }, []);

  const [copied, setCopied] = useState(false);
  function copyAcct() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <span className="logo">✓</span>
          <div className="col">
            <span className="title" style={{ color: 'var(--color-success)' }}>주문 접수 완료</span>
            <span className="sub">상태: 주문중 · 입금 대기</span>
          </div>
        </div>
        <StatusChip status="ORDERED" />
      </div>
      <div className="screen screen-pad-lg col gap-6" style={{ alignItems: 'center' }}>
        {/* WINNER + DogTag — the absolute center of attention */}
        <div className="col gap-4 center" style={{ alignItems: 'center', marginTop: 8 }}>
          <h1 className="winner">
            WINNER WINNER<br />CHICKEN DINNER!
          </h1>
          <div className="muted" style={{ fontSize: 12 }}>도그태그를 받으셨습니다 · 임무 개시</div>
          <div style={{ marginTop: 12 }}>
            <DogTag num={o.id} total={100} date="2026-05-20" dropping={drop} />
          </div>
          <div style={{ marginTop: 8 }}>
            <Mascot state="preparing" size="sm" caption="출동 준비!" />
          </div>
        </div>

        {/* 주문 내역 */}
        <div className="card" style={{ width: '100%' }}>
          <div className="section-label">📋 주문 내역</div>
          {o.items.map(m => (
            <div className="receipt-line" key={m.id}>
              <span>{m.name} × {m.qty}</span>
              <span className="val tabular">{won(m.price * m.qty)}</span>
            </div>
          ))}
          <div className="divider-dashed" />
          <div className="receipt-line"><span className="label">소계</span><span className="val tabular">{won(o.subtotal)}</span></div>
          {o.discount > 0 && (
            <div className="receipt-line discount"><span className="label">쿠폰 할인</span><span className="val tabular">-{won(o.discount)}</span></div>
          )}
          <div className="receipt-line total"><span>합계</span><span className="val tabular">{won(o.total)}</span></div>
        </div>

        {/* 입금 안내 */}
        <div className="col gap-2" style={{ width: '100%' }}>
          <div className="section-label">💸 입금 안내 · 1인 1계좌 송금</div>
          <div className="account-card">
            <div className="bank-row">
              <span>국민은행</span>
              <span className="acct-num">123-45-678901</span>
              <button className="copy-btn" onClick={copyAcct}>{copied ? '복사됨 ✓' : '복사'}</button>
            </div>
            <div className="row2">예금주: 컴퓨터모바일융합과 학생회</div>
            <div className="row2 tabular" style={{ marginTop: 6, color: 'var(--color-accent)', fontSize: 18, fontWeight: 800 }}>
              {won(o.total)}
            </div>
          </div>
        </div>

        {/* 수령 정보 */}
        <div className="card" style={{ width: '100%' }}>
          <div className="row-between">
            <span className="muted" style={{ fontSize: 13 }}>📍 수령 방법</span>
            <span className="bold" style={{ fontSize: 15 }}>
              {o.mode}{o.table ? ` · 테이블 ${o.table}` : ''}
            </span>
          </div>
        </div>

        <div className="warn-banner" style={{ width: '100%' }}>
          <span>⚠️</span>
          <span>이체 후 아래 <b>"이체했어요, 확인 요청"</b>을 꼭 눌러주세요.</span>
        </div>
      </div>

      <div className="bottom-bar">
        <Button variant="primary" size="lg" block onClick={() => dispatch({ type: 'nav', to: 'transfer' })}>
          💸 이체했어요, 확인 요청 보내기
        </Button>
        <Button variant="secondary" size="md" block onClick={() => dispatch({ type: 'nav', to: 'status' })}>
          🍗 조리 현황 보기
        </Button>
      </div>
    </>
  );
}

/* ───────────────────────── C-5 이체 확인 요청 ───────────────────────── */
function ScreenTransfer({ state, dispatch }) {
  const o = state.order;
  const [bank, setBank] = useState('');
  const [altName, setAltName] = useState(false);
  const [otherName, setOtherName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function submit() {
    const e = {};
    if (!bank) e.bank = '이체하신 은행을 선택해 주세요.';
    if (altName && !otherName.trim()) e.otherName = '이체한 이름을 입력해 주세요.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    setTimeout(() => {
      // 자동 진입: 확인 요청 후 → 조리 현황판으로 (DESIGN_REVIEW Finding B)
      dispatch({ type: 'transferReported', bank, altName: altName ? otherName : null });
    }, 700);
  }

  return (
    <>
      <TopbarBack title="💸 이체 확인 요청" onBack={() => dispatch({ type: 'nav', to: 'complete' })} />
      <div className="screen screen-pad-lg col gap-6">
        <div className="card">
          <div className="row-between mb-2">
            <span className="muted" style={{ fontSize: 12 }}>주문번호</span>
            <DogTag num={o.id} total={100} size="xs" />
          </div>
          <div className="row-between"><span className="muted" style={{ fontSize: 13 }}>주문자</span><span className="bold">{o.name}</span></div>
          <div className="divider-dashed" />
          <div className="row-between">
            <span className="muted" style={{ fontSize: 13 }}>결제 금액</span>
            <span className="tabular bold" style={{ fontSize: 22, color: 'var(--color-ink)' }}>{won(o.total)}</span>
          </div>
        </div>

        <Field label="이체하신 은행" required error={errors.bank} htmlFor="bank">
          <Select id="bank" value={bank} onChange={(e) => setBank(e.target.value)} error={errors.bank}>
            <option value="">은행 선택...</option>
            <option>카카오뱅크</option>
            <option>국민은행</option>
            <option>신한은행</option>
            <option>우리은행</option>
            <option>하나은행</option>
            <option>NH농협</option>
            <option>토스뱅크</option>
            <option>기타</option>
          </Select>
        </Field>

        <div className="col gap-3">
          <Checkbox checked={altName} onChange={setAltName} sub="가족·대리 이체 시">
            다른 이름으로 이체했어요
          </Checkbox>
          {altName && (
            <Field label="이체한 사람 이름" required error={errors.otherName} htmlFor="oname">
              <Input id="oname" value={otherName} onChange={(e) => setOtherName(e.target.value)} placeholder="예: 홍어머니" />
            </Field>
          )}
        </div>

        <div className="card" style={{ background: 'var(--color-elevated)' }}>
          <div className="section-label">확인 후 자동 진행</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-muted)' }}>
            요청을 보내면 <b>조리 현황판</b>으로 자동 이동합니다. 본부에서 통장을 확인하면 입금 완료 → 조리 시작이 진행돼요.
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <Button variant="primary" size="lg" block loading={submitting} onClick={submit}>
          {submitting ? '요청 보내는 중...' : '확인 요청 보내기'}
        </Button>
      </div>
    </>
  );
}

/* ───────────────────────── C-6 조리 현황판 ───────────────────────── */
function ScreenStatus({ state, dispatch }) {
  const o = state.order;
  const status = o.status;
  const meta = STATUS_LABELS[status] || STATUS_LABELS.ORDERED;

  const copyByStatus = {
    ORDERED:           { mascot:'preparing', big:'⏳ 입금을 기다리는 중', body:'이체 후 "확인 요청"을 보내주세요.' },
    TRANSFER_REPORTED: { mascot:'preparing', big:'💸 본부가 통장을 확인하는 중', body:'잠시만요! 보통 1~5분 안에 확인됩니다.' },
    PAID:              { mascot:'preparing', big:'✅ 입금 확인 완료!',           body:'곧 조리가 시작됩니다.' },
    COOKING:           { mascot:'cooking',   big:'🔥 지금 치킨이 기름 속으로 입장했습니다!', body:'맛있게 튀겨지는 중이에요.' },
    READY:             { mascot:'arrived',   big:'🎉 #' + o.id + '번, 수령 가능!', body:'부스에서 호명을 들어주세요.' },
    DONE:              { mascot:'arrived',   big:'WINNER WINNER 임무 완수!',     body:'맛있게 드세요! 🍗' },
    CANCELED:          { mascot:'canceled',  big:'주문이 취소되었습니다',         body:'부스에 문의해 주세요.' },
  };
  const c = copyByStatus[status] || copyByStatus.ORDERED;

  return (
    <>
      <TopbarBack
        title={`조리 현황`}
        onBack={() => dispatch({ type: 'nav', to: 'complete' })}
        right={<DogTag num={o.id} size="xs" />}
      />

      {state.sseDisconnected && (
        <div style={{ padding: '8px 16px 0' }}>
          <ErrorState kind="banner-top" title="연결이 끊어졌어요. 다시 연결 중..." />
        </div>
      )}

      <div className="screen screen-pad-lg col gap-6">
        <div className="row-between">
          <div className="col">
            <div className="section-label">현재 상태</div>
            <StatusChip status={status} />
          </div>
          <div className="muted tabular" style={{ fontSize: 12 }}>
            {pad(new Date().getHours())}:{pad(new Date().getMinutes())} 갱신
          </div>
        </div>

        <div className="card" style={{ paddingTop: 22, paddingBottom: 16 }}>
          <Timeline status={status} />
        </div>

        <div className="col gap-4" style={{ alignItems: 'center' }}>
          <Mascot state={c.mascot} size="md" />
          <div className="cooking-copy center">
            <div className="bold" style={{ fontSize: 18, marginBottom: 4 }}>{c.big}</div>
            <div className="muted" style={{ fontSize: 14 }}>{c.body}</div>
          </div>
        </div>

        {status === 'READY' && (
          <div className="card" style={{ background: 'var(--color-accent)', borderColor: 'var(--color-ink)', textAlign: 'center' }}>
            <div className="bold" style={{ fontSize: 16 }}>📣 부스에서 호명 중!</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>도그태그 번호 #{o.id}로 받으세요.</div>
          </div>
        )}

        <div className="row gap-2" style={{ justifyContent: 'center' }}>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => dispatch({ type: 'nav', to: 'complete' })}
          >
            ← 주문 정보 다시 보기
          </button>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => dispatch({ type: 'nav', to: 'menu' })}
          >
            다른 메뉴 보기
          </button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, {
  ScreenMenu, ScreenCart, ScreenCheckout, ScreenComplete, ScreenTransfer, ScreenStatus,
  TopbarBrand, TopbarBack,
});
