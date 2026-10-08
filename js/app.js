/* =====================================================================
 * app.js — Application controller: views, events, rendering
 * ===================================================================== */
(function (global) {
  'use strict';

  const MD = global.MarketData;
  const Store = global.Store;
  const I18N = global.I18N;
  const t = I18N.t;

  // ------------------------- App state -------------------------
  const state = {
    selected: { type: null, symbol: null, depositId: null },
    orderSide: 'BUY', // BUY | SELL | SHORT | COVER
    orderPrice: '',
    priceEdited: false,
    orderQty: '',
    activeTab: 'tx',
    detailTab: 'profile',
    chartRange: '1D',
    search: '',
    gameOverShown: false,
    currentView: 'trade',
    leaderboardPeriod: 'year',
    hotPeriod: 'today',
    pendingOtp: null, // { email, verificationId, isExistingUser }
    _authRestoreTried: false,
    displayCurrency: 'HKD',
    screener: { region: '', industry: '', need: '' },
  };

  const $ = function (id) { return document.getElementById(id); };
  const L = function () { return I18N.getLang() === 'zh-TW' ? 'zh-TW' : 'en'; };

  function fmtMoney(v, currency) { return MD.fmtMoney(v, currency, L()); }

  function fmtLarge(v, currency) {
    const lang = L();
    const sym = currency === 'HKD' ? 'HK$' : 'US$';
    const abs = Math.abs(v);
    if (lang === 'zh-TW') {
      if (abs >= 1e8) return sym + (v / 1e8).toFixed(2) + ' 億';
      if (abs >= 1e4) return sym + (v / 1e4).toFixed(2) + ' 萬';
    } else {
      if (abs >= 1e9) return sym + (v / 1e9).toFixed(2) + 'B';
      if (abs >= 1e6) return sym + (v / 1e6).toFixed(2) + 'M';
      if (abs >= 1e3) return sym + (v / 1e3).toFixed(1) + 'K';
    }
    return fmtMoney(v, currency);
  }

  function baseToNative(amountBase, nativeCurrency, baseCurrency) {
    return MD.baseToNative(amountBase, nativeCurrency, baseCurrency);
  }

  function fmtPrice(symbol, value) {
    const a = MD.getAsset(symbol);
    return value.toFixed(a ? a.decimals : 2);
  }

  // Display-currency money formatting (converts native -> chosen display currency).
  function fmtDisplay(value, nativeCurrency) {
    const dc = state.displayCurrency;
    return MD.fmtMoney(MD.convertToBase(value, nativeCurrency, dc), dc);
  }
  // Display-currency price (2 dp).
  function fmtPriceD(symbol, value) {
    const a = MD.getAsset(symbol);
    const dc = state.displayCurrency;
    return MD.convertToBase(value, a ? a.currency : dc, dc).toFixed(2);
  }
  function fmtDisplaySigned(value, nativeCurrency) {
    const dc = state.displayCurrency;
    const v = MD.convertToBase(value, nativeCurrency, dc);
    return (v > 0 ? '+' : '') + MD.fmtMoney(v, dc);
  }

  function pnlClass(v) { return v > 0 ? 'c-up' : (v < 0 ? 'c-down' : 'c-muted'); }
  function signed(v, suffix) { return (v > 0 ? '+' : '') + v + (suffix || ''); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

  /* ------------------------- Favorites (自選) ------------------------- */
  function getFavorites() {
    try { return JSON.parse(localStorage.getItem('pt_favorites') || '[]'); } catch (e) { return []; }
  }
  function saveFavorites(arr) { localStorage.setItem('pt_favorites', JSON.stringify(arr)); }
  function isFavorite(sym) { return getFavorites().indexOf(sym) >= 0; }
  function toggleFavorite(sym) {
    const arr = getFavorites();
    const i = arr.indexOf(sym);
    if (i >= 0) arr.splice(i, 1); else arr.unshift(sym);
    saveFavorites(arr);
    renderWatchlist();
    return i < 0; // true if now favorited
  }

  /* ---------------------------- Toast ---------------------------- */
  let toastTimer = null;
  function toast(msg, cls) {
    const el = $('toast');
    el.textContent = msg;
    el.className = 'toast show' + (cls ? ' ' + cls : '');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 2200);
  }

  /* -------------------------- Modal -------------------------- */
  function showModal(title, bodyHTML) {
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = bodyHTML;
    $('modalBackdrop').style.display = 'flex';
  }
  function closeModal() { $('modalBackdrop').style.display = 'none'; }

  /* ------------------------- i18n apply ------------------------- */
  function applyLanguage() {
    const lang = L();
    document.documentElement.lang = lang === 'zh-TW' ? 'zh-TW' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    $('langToggle').textContent = t('lang.toggle');
    renderAll();
  }

  /* ------------------------- Initialization ------------------------- */
  function init() {
    Store.load();
    I18N.setLang(Store.getLanguage());
    Cloud.init();
    initAuth();
    initTheme();
    initDisplayCurrency();

    // First run: default 100,000 HKD account.
    if (!Store.listSimulations().length) {
      const today = new Date();
      const nextYear = new Date(Date.now() + 365 * 86400000);
      Store.createSimulation({
        name: t('sim.defaultName'),
        playerName: t('sim.defaultPlayer'),
        baseCurrency: 'HKD',
        startingCapital: 100000,
        startDate: today.toISOString().slice(0, 10),
        endDate: nextYear.toISOString().slice(0, 10),
      });
    }

    MD.startTick(2200);
    MD.onTick(onTick);
    PriceChart.init($('priceChart'));

    renderSimSelector();
    renderWatchlist();
    renderRangeSelector();
    bindEvents();

    if (!state.selected.symbol && MD.ASSETS.length) {
      selectAsset(MD.ASSETS[0].symbol);
    }
    applyLanguage();
    updateConnStatus();
    updateLastUpdated();
    switchView('trade');
  }

  /* -------------------------- Tick handler -------------------------- */
  function onTick() {
    const sim = Store.getSelected();
    updateWatchlistPrices();
    updateLastUpdated();
    updateConnStatus();
    if (state.selected.type === 'asset' && state.selected.symbol) {
      updateQuoteHeader();
      updateQuoteStats();
      if (!state.priceEdited) {
        state.orderPrice = fmtPrice(state.selected.symbol, MD.getPrice(state.selected.symbol));
        $('orderPrice').value = state.orderPrice;
      }
      updateOrderEstimate();
      renderChart();
      if (state.detailTab === 'performance') renderAssetDetail();
    }
    if (sim) {
      Store.updateEquityStats(sim);
      Store.snapshotEquity(sim);
      if (Store.checkBankruptcy(sim)) {
        onBankrupt(sim);
      }
      renderAccount();
      renderHoldings();
      renderShorts();
      if (state.activeTab === 'tx') renderTransactions();
      if (state.activeTab === 'deposits') renderDeposits();
    }
    if (state.currentView !== 'trade') {
      const now = Date.now();
      if (!state._lastPageRender || now - state._lastPageRender > 5000) {
        state._lastPageRender = now;
        renderPageView(state.currentView);
      }
    }
  }

  /* --------------------- Bankruptcy / game over --------------------- */
  function onBankrupt(sim) {
    if (state.gameOverShown) return;
    state.gameOverShown = true;
    renderAccount();
    renderOrderDisabled();
    renderReport(sim, true);
  }

  function renderOrderDisabled() {
    const sim = Store.getSelected();
    const ended = sim && Store.isEnded(sim);
    const btn = $('btnSubmitOrder');
    const msg = $('orderMsg');
    if (ended && sim) {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      msg.className = 'order-msg err';
      msg.textContent = sim.bankrupt ? t('account.bankrupt') : t('sim.ended');
    } else if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }

  /* ---------------------- Connection & timestamp ---------------------- */
  function updateConnStatus() {
    const live = MD.getProviderState() === 'live';
    const dot = $('connDot');
    const text = $('connText');
    dot.className = 'conn-dot ' + (live ? 'live' : 'offline');
    text.textContent = t(live ? 'conn.connected' : 'conn.offline');
  }

  function updateLastUpdated() {
    const lu = MD.getLastUpdated();
    $('lastUpdatedTime').textContent = lu ? new Date(lu).toLocaleTimeString(L() === 'zh-TW' ? 'zh-HK' : 'en-US', { hour12: false }) : '--:--:--';
  }

  /* ------------------------- Sim selector ------------------------- */
  function renderSimSelector() {
    const sel = $('simSelect');
    const sims = Store.listSimulations();
    sel.innerHTML = '';
    if (!sims.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = t('sim.noData');
      sel.appendChild(opt);
      return;
    }
    sims.forEach(function (s) {
      const opt = document.createElement('option');
      opt.value = s.id;
      let status = '';
      if (s.bankrupt) status = ' (' + t('sim.ended') + ')';
      else if (Store.isEnded(s)) status = ' (' + t('sim.ended') + ')';
      opt.textContent = s.name + status;
      opt.selected = s.id === Store.getSelected().id;
      sel.appendChild(opt);
    });
  }

  /* --------------------------- Watchlist --------------------------- */
  function assetItemHtml(a) {
    const sym = a.symbol;
    const name = L() === 'zh-TW' ? a.nameZh : a.name;
    const active = state.selected.type === 'asset' && state.selected.symbol === sym;
    const p = MD.getPrice(sym);
    const pc = MD.getPrevClose(sym);
    const chg = p - pc;
    const chgPct = pc ? (chg / pc) * 100 : 0;
    const fav = isFavorite(sym);
    return '<div class="watch-item' + (active ? ' active' : '') + '" data-watch="asset" data-symbol="' + esc(sym) + '">' +
      '<div class="wi-left"><div class="wi-sym">' + esc(sym) + '</div><div class="wi-name">' + esc(name) + '</div></div>' +
      '<div class="wi-right"><div class="wi-price">' + fmtPrice(sym, p) + '</div><div class="wi-chg ' + pnlClass(chg) + '">' + signed(chgPct.toFixed(2), '%') + '</div></div>' +
      '<button class="fav-btn' + (fav ? ' on' : '') + '" data-fav="' + esc(sym) + '">' + (fav ? '★' : '☆') + '</button>' +
      '</div>';
  }

  function renderWatchlist() {
    const host = $('watchlist');
    const q = state.search.trim().toLowerCase();
    let html = '';
    let total = 0;

    function matches(a) {
      if (!q) return true;
      const name = L() === 'zh-TW' ? a.nameZh : a.name;
      return a.symbol.toLowerCase().indexOf(q) >= 0 || (name || '').toLowerCase().indexOf(q) >= 0;
    }

    // Favorites group
    const favAssets = getFavorites().map(function (s) { return MD.getAsset(s); }).filter(Boolean).filter(matches);
    if (favAssets.length) {
      html += '<div class="watch-group-title">' + esc(t('watchlist.favorites')) + ' ★</div>';
      favAssets.forEach(function (a) { html += assetItemHtml(a); total++; });
    }

    const groups = [
      { key: 'US', title: t('watchlist.us'), items: MD.ASSETS.filter(function (a) { return a.market === 'US'; }) },
      { key: 'HK', title: t('watchlist.hk'), items: MD.ASSETS.filter(function (a) { return a.market === 'HK'; }) },
      { key: 'EU', title: t('watchlist.eu'), items: MD.ASSETS.filter(function (a) { return a.market === 'EU'; }) },
      { key: 'FX', title: t('watchlist.fx'), items: MD.ASSETS.filter(function (a) { return a.market === 'FX'; }) },
      { key: 'CRYPTO', title: t('watchlist.crypto'), items: MD.ASSETS.filter(function (a) { return a.market === 'CRYPTO'; }) },
      { key: 'DEPOSIT', title: t('watchlist.deposits'), items: MD.getDeposits() },
    ];

    groups.forEach(function (g) {
      const filtered = g.items.filter(function (it) {
        if (!q) return true;
        const name = L() === 'zh-TW' ? it.nameZh : it.name;
        return (it.symbol || it.id).toLowerCase().indexOf(q) >= 0 || (name || '').toLowerCase().indexOf(q) >= 0;
      });
      if (!filtered.length) return;
      html += '<div class="watch-group-title">' + esc(g.title) + '</div>';
      filtered.forEach(function (it) {
        if (g.key === 'DEPOSIT') {
          const d = it;
          const active = state.selected.type === 'deposit' && state.selected.depositId === d.id;
          html += '<div class="watch-item' + (active ? ' active' : '') + '" data-watch="deposit" data-symbol="' + esc(d.id) + '">' +
            '<div class="wi-left"><div class="wi-sym">' + esc(d.id) + '</div><div class="wi-name">' + esc(L() === 'zh-TW' ? d.nameZh : d.name) + '</div></div>' +
            '<div class="wi-right"><div class="wi-price c-muted">' + (d.rate * 100).toFixed(1) + '%</div><div class="wi-type">' + t('type.deposit') + '</div></div></div>';
        } else {
          html += assetItemHtml(it);
        }
        total++;
      });
    });

    if (!total) html = '<div class="empty-state">' + esc(t('watchlist.noResult')) + '</div>';
    host.innerHTML = html;
  }

  function updateWatchlistPrices() {
    document.querySelectorAll('.watch-item[data-watch="asset"]').forEach(function (el) {
      const sym = el.getAttribute('data-symbol');
      const p = MD.getPrice(sym);
      const pc = MD.getPrevClose(sym);
      const chg = p - pc;
      const chgPct = pc ? (chg / pc) * 100 : 0;
      const priceEl = el.querySelector('.wi-price');
      const chgEl = el.querySelector('.wi-chg');
      if (priceEl) priceEl.textContent = fmtPriceD(sym, p);
      if (chgEl) { chgEl.textContent = signed(chgPct.toFixed(2), '%'); chgEl.className = 'wi-chg ' + pnlClass(chg); }
    });
  }

  /* ------------------------- Selection ------------------------- */
  function selectAsset(symbol) {
    state.selected = { type: 'asset', symbol: symbol, depositId: null };
    state.orderSide = 'BUY';
    state.priceEdited = false;
    state.orderQty = '';
    state.orderPrice = fmtPrice(symbol, MD.getPrice(symbol));
    state.detailTab = 'profile';
    renderWatchlist();
    renderQuoteView();
    renderOrderTicket();
    renderChart();
    renderAssetDetail();
  }

  function selectDeposit(depositId) {
    state.selected = { type: 'deposit', symbol: null, depositId: depositId };
    renderWatchlist();
    renderDepositView();
  }

  /* ------------------------- Quote view ------------------------- */
  function renderQuoteView() {
    const sym = state.selected.symbol;
    const a = MD.getAsset(sym);
    $('quoteEmpty').style.display = 'none';
    $('quoteContent').style.display = 'block';
    $('depositContent').style.display = 'none';
    $('orderPanel').style.display = 'block';

    $('quoteSymbol').textContent = sym;
    $('quoteName').textContent = L() === 'zh-TW' ? a.nameZh : a.name;
    $('quoteTypeTag').textContent = t('type.' + a.type);
    $('quoteMarketTag').textContent = t('market.' + a.market.toLowerCase());
    updateQuoteHeader();
    updateQuoteStats();
    renderOrderDisabled();
  }

  function updateQuoteHeader() {
    const sym = state.selected.symbol;
    if (!sym) return;
    const p = MD.getPrice(sym);
    const pc = MD.getPrevClose(sym);
    const chg = p - pc;
    const chgPct = pc ? (chg / pc) * 100 : 0;
    const a = MD.getAsset(sym);
    $('quotePrice').textContent = fmtPriceD(sym, p);
    $('quoteChange').textContent = signed(fmtDisplay(chg, a.currency), '') + '  ' + signed(chgPct.toFixed(2), '%');
    $('quoteChange').className = 'quote-change ' + pnlClass(chg);
  }

  function updateQuoteStats() {
    const sym = state.selected.symbol;
    const a = MD.getAsset(sym);
    const hist = MD.getHistory(sym, '1D');
    const pts = hist.points;
    const pc = hist.prevClose;
    let high = -Infinity, low = Infinity, open = pc;
    pts.forEach(function (pt) { if (pt.price > high) high = pt.price; if (pt.price < low) low = pt.price; });
    if (pts.length) open = pts[0].price;

    const turnover = synthesizeTurnover(sym, MD.getPrice(sym));
    const stats = [
      { label: t('quote.prevClose'), value: fmtPriceD(sym, pc) },
      { label: t('quote.open'), value: fmtPriceD(sym, open) },
      { label: t('quote.high'), value: fmtPriceD(sym, high) },
      { label: t('quote.low'), value: fmtPriceD(sym, low) },
      { label: t('quote.volume'), value: fmtDisplay(turnover, a.currency) },
      { label: t('quote.currency'), value: state.displayCurrency },
    ];
    $('quoteStats').innerHTML = stats.map(function (s) {
      return '<div class="quote-stat"><span class="qs-label">' + esc(s.label) + '</span><span class="qs-value">' + esc(s.value) + '</span></div>';
    }).join('');
  }

  function synthesizeTurnover(symbol, price) {
    let h = 0;
    for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) >>> 0;
    const vol = 500000 + (h % 9000000);
    return vol * price;
  }

  /* ------------------------- Deposit view ------------------------- */
  function renderDepositView() {
    const d = MD.getDeposit(state.selected.depositId);
    if (!d) return;
    $('quoteEmpty').style.display = 'none';
    $('quoteContent').style.display = 'none';
    $('depositContent').style.display = 'block';
    $('orderPanel').style.display = 'none';

    $('depositSymbol').textContent = d.id;
    $('depositName').textContent = L() === 'zh-TW' ? d.nameZh : d.name;
    $('depositTypeTag').textContent = t('type.deposit');

    $('depositMeta').innerHTML = [
      { label: t('deposit.term'), value: t('deposit.months', { n: d.term }) },
      { label: t('deposit.rate'), value: (d.rate * 100).toFixed(1) + '% p.a.' },
      { label: t('quote.currency'), value: d.currency },
    ].map(function (s) {
      return '<div class="quote-stat"><span class="qs-label">' + esc(s.label) + '</span><span class="qs-value">' + esc(s.value) + '</span></div>';
    }).join('');

    const sim = Store.getSelected();
    $('depositOpenForm').innerHTML = sim
      ? '<div class="form-field"><label>' + esc(t('deposit.principal')) + ' (' + d.currency + ')</label>' +
        '<input type="number" id="depositPrincipal" step="any" min="0" placeholder="0" /></div>' +
        '<button class="btn btn-primary btn-block" id="btnOpenDeposit">' + esc(t('deposit.open')) + '</button>' +
        '<div class="order-msg" id="depositMsg"></div>'
      : '<div class="empty-state">' + esc(t('sim.noData')) + '</div>';

    const btn = $('btnOpenDeposit');
    if (btn) btn.addEventListener('click', function () { submitOpenDeposit(d); });
  }

  function submitOpenDeposit(d) {
    const sim = Store.getSelected();
    const msg = $('depositMsg');
    if (!sim) { msg.className = 'order-msg err'; msg.textContent = t('sim.noData'); return; }
    if (Store.isEnded(sim)) { msg.className = 'order-msg err'; msg.textContent = t('order.ended'); return; }
    const principal = Number($('depositPrincipal').value);
    const res = Store.openDeposit(sim, d.id, principal);
    if (res.ok) {
      msg.className = 'order-msg ok';
      msg.textContent = t('deposit.success');
      $('depositPrincipal').value = '';
      renderAccount(); renderHoldings(); renderShorts(); renderDeposits(); renderTransactions();
    } else {
      msg.className = 'order-msg err';
      msg.textContent = t(res.msg);
    }
  }

  /* ------------------------- Range selector ------------------------- */
  const RANGES = ['1D', '5D', '1M', '3M', '1Y', '5Y'];
  function renderRangeSelector() {
    $('rangeSelector').innerHTML = RANGES.map(function (r) {
      return '<button class="range-btn' + (state.chartRange === r ? ' active' : '') + '" data-range="' + r + '">' + esc(t('chart.' + r)) + '</button>';
    }).join('');
  }

  function renderChart() {
    const sym = state.selected.symbol;
    if (!sym || state.selected.type !== 'asset') return;
    const hist = MD.getHistory(sym, state.chartRange);
    PriceChart.setData({ points: hist.points, prevClose: hist.prevClose });
  }

  /* ------------------------- Order ticket ------------------------- */
  function renderOrderTicket() {
    const sym = state.selected.symbol;
    const a = MD.getAsset(sym);
    $('orderCurrency').textContent = a.currency;
    $('orderPrice').value = state.orderPrice;
    setOrderSide(state.orderSide);
    updateOrderEstimate();
    renderOrderDisabled();
  }

  function setOrderSide(side) {
    state.orderSide = side;
    ['Buy', 'Sell', 'Short', 'Cover'].forEach(function (s) {
      $('tab' + s).className = 'order-tab' + (side === s.toUpperCase() ? ' active ' + s.toLowerCase() : ' ' + s.toLowerCase());
    });
    const submit = $('btnSubmitOrder');
    if (side === 'BUY') { submit.textContent = t('order.submitBuy'); submit.className = 'btn btn-primary btn-block'; }
    else if (side === 'SELL') { submit.textContent = t('order.submitSell'); submit.className = 'btn btn-block btn-danger'; }
    else if (side === 'SHORT') { submit.textContent = t('order.submitShort'); submit.className = 'btn btn-block btn-short'; }
    else { submit.textContent = t('order.submitCover'); submit.className = 'btn btn-block btn-cover'; }
    updateOrderEstimate();
  }

  function updateOrderEstimate() {
    const sym = state.selected.symbol;
    const sim = Store.getSelected();
    if (!sym || !sim) return;
    const a = MD.getAsset(sym);
    const price = Number($('orderPrice').value) || 0;
    const qty = Number(state.orderQty) || 0;
    const notional = qty * price;
    const fee = qty > 0 ? Store.calcFee(a.currency) : 0;
    const side = state.orderSide;
    const summary = Store.getAccountSummary(sim);
    const buyPowerNative = baseToNative(summary.buyingPower, a.currency, sim.baseCurrency);
    const longQty = sim.holdings[sym] ? sim.holdings[sym].qty : 0;
    const shortQty = sim.shorts[sym] ? sim.shorts[sym].qty : 0;
    const total = (side === 'BUY' || side === 'COVER') ? notional + fee : notional - fee;

    function row(label, value, cls) {
      return '<div class="oe-row' + (cls ? ' ' + cls : '') + '"><span>' + esc(label) + '</span><span>' + value + '</span></div>';
    }
    let rows = '';
    if (side === 'BUY' || side === 'SHORT') rows += row(t('account.buyingPower'), fmtDisplay(buyPowerNative, a.currency));
    if (side === 'SELL') rows += row(t('order.holdQty'), longQty.toLocaleString());
    if (side === 'COVER') rows += row(t('order.shortQty'), shortQty.toLocaleString());
    rows += row(t('order.estAmount'), fmtDisplay(notional, a.currency));
    rows += row(t('order.fee'), fmtDisplay(fee, a.currency));
    rows += row(t('order.total'), fmtDisplay(total, a.currency), 'total');
    $('orderEst').innerHTML = rows;
  }

  function submitOrder() {
    const sym = state.selected.symbol;
    const sim = Store.getSelected();
    const msg = $('orderMsg');
    if (!sim) { msg.className = 'order-msg err'; msg.textContent = t('sim.noData'); return; }
    if (Store.isEnded(sim)) { msg.className = 'order-msg err'; msg.textContent = sim.bankrupt ? t('account.bankrupt') : t('order.ended'); return; }
    const price = Number($('orderPrice').value);
    const qty = Number(state.orderQty);
    let res;
    if (state.orderSide === 'BUY') res = Store.buy(sim, sym, qty, price);
    else if (state.orderSide === 'SELL') res = Store.sell(sim, sym, qty, price);
    else if (state.orderSide === 'SHORT') res = Store.openShort(sim, sym, qty, price);
    else res = Store.closeShort(sim, sym, qty, price);

    if (res.ok) {
      msg.className = 'order-msg ok';
      msg.textContent = t('order.success');
      state.orderQty = '';
      $('orderQty').value = '';
      renderAccount(); renderHoldings(); renderShorts(); renderTransactions();
      Store.snapshotEquity(sim, true);
      if (Cloud.getCurrentUser()) syncMyRanking();
      if (Store.isEnded(sim)) { renderOrderDisabled(); if (sim.bankrupt) onBankrupt(sim); }
    } else {
      msg.className = 'order-msg err';
      msg.textContent = t(res.msg);
    }
  }

  function handleMax() {
    const sim = Store.getSelected();
    const sym = state.selected.symbol;
    if (!sim || !sym) return;
    const a = MD.getAsset(sym);
    const price = Number($('orderPrice').value) || 0;
    if (price <= 0) return;
    const side = state.orderSide;
    if (side === 'SELL') {
      const hold = sim.holdings[sym] ? sim.holdings[sym].qty : 0;
      state.orderQty = hold.toString();
    } else if (side === 'COVER') {
      const short = sim.shorts[sym] ? sim.shorts[sym].qty : 0;
      state.orderQty = short.toString();
    } else {
      const summary = Store.getAccountSummary(sim);
      const buyPowerNative = baseToNative(summary.buyingPower, a.currency, sim.baseCurrency);
      const maxQty = Math.floor(buyPowerNative / (price * 1.001));
      state.orderQty = Math.max(0, maxQty).toString();
    }
    $('orderQty').value = state.orderQty;
    updateOrderEstimate();
  }

  /* ------------------------- Account summary ------------------------- */
  function renderAccount() {
    const sim = Store.getSelected();
    const banner = $('bankruptBanner');
    if (!sim) {
      ['acctTotalAssets', 'acctCash', 'acctDayPnl', 'acctTotalReturn', 'acctUnrealized', 'acctLeverage', 'acctBuyingPower'].forEach(function (id) { $(id).textContent = '--'; });
      $('acctDepositsLine').innerHTML = '';
      banner.style.display = 'none';
      return;
    }
    const s = Store.getAccountSummary(sim);
    const cur = sim.baseCurrency;
    $('acctTotalAssets').textContent = fmtDisplay(s.totalAssets, cur);
    $('acctCash').textContent = fmtDisplay(s.cash, cur);

    const dayEl = $('acctDayPnl');
    dayEl.textContent = signed(fmtDisplay(s.dayPnl, cur), '');
    dayEl.className = 'account-value ' + pnlClass(s.dayPnl);

    const retEl = $('acctTotalReturn');
    retEl.textContent = signed(s.totalReturn.toFixed(2), '%');
    retEl.className = 'account-value ' + pnlClass(s.totalReturn);

    const unrEl = $('acctUnrealized');
    unrEl.textContent = signed(fmtDisplay(s.unrealized, cur), '');
    unrEl.className = 'account-value ' + pnlClass(s.unrealized);

    // leverage + buying power
    const levEl = $('acctLeverage');
    const lev = s.leverage === Infinity ? 0 : s.leverage;
    levEl.textContent = lev.toFixed(2) + '×';
    levEl.className = 'account-value ' + (lev > s.maxLeverage ? 'leverage-danger' : (lev > 1.2 ? 'leverage-warn' : ''));
    $('acctBuyingPower').textContent = fmtDisplay(s.buyingPower, cur);

    // realized + deposits + short value
    const depCount = sim.deposits.length;
    $('acctDepositsLine').innerHTML =
      '<span>' + esc(t('account.realized')) + ': ' + esc(signed(fmtDisplay(s.realized, cur), '')) + '</span>' +
      '<span>' + esc(t('account.deposits')) + ': ' + fmtDisplay(s.depositsValue, cur) + (depCount ? ' (' + depCount + ')' : '') + '</span>' +
      '<span>' + esc(t('account.shortValue')) + ': ' + fmtDisplay(s.shortValue, cur) + '</span>';

    // bankrupt banner
    banner.style.display = sim.bankrupt ? 'block' : 'none';
    renderOrderDisabled();
  }

  /* --------------------------- Holdings --------------------------- */
  function renderHoldings() {
    const sim = Store.getSelected();
    const host = $('holdings');
    if (!sim || !Object.keys(sim.holdings).length) {
      host.innerHTML = '<div class="empty-state">' + esc(t('account.empty')) + '</div>';
      return;
    }
    host.innerHTML = Object.keys(sim.holdings).map(function (sym) {
      const h = sim.holdings[sym];
      const price = MD.getPrice(sym) || 0;
      const value = price * h.qty;
      const pnl = (price - h.avgCost) * h.qty;
      const pnlPct = h.avgCost ? ((price - h.avgCost) / h.avgCost) * 100 : 0;
      const a = MD.getAsset(sym);
      return '<div class="holding-item" data-hold="' + esc(sym) + '">' +
        '<div class="hi-left"><div class="hi-sym">' + esc(sym) + '</div><div class="hi-qty">' + h.qty.toLocaleString() + ' × ' + fmtPriceD(sym, h.avgCost) + '</div></div>' +
        '<div class="hi-right"><div class="hi-value">' + fmtDisplay(value, a.currency) + '</div>' +
        '<div class="hi-pnl ' + pnlClass(pnl) + '">' + signed(pnlPct.toFixed(2), '%') + '</div></div>' +
        '<button class="btn btn-sm btn-ghost hi-sell" data-sell="' + esc(sym) + '">' + esc(t('holdings.sell')) + '</button>' +
        '</div>';
    }).join('');
  }

  function renderShorts() {
    const sim = Store.getSelected();
    const host = $('shorts');
    if (!sim || !Object.keys(sim.shorts).length) {
      host.innerHTML = '<div class="empty-state">' + esc(t('holdings.emptyShort')) + '</div>';
      return;
    }
    host.innerHTML = Object.keys(sim.shorts).map(function (sym) {
      const s = sim.shorts[sym];
      const price = MD.getPrice(sym) || 0;
      const value = price * s.qty;
      const pnl = (s.avgPrice - price) * s.qty;
      const pnlPct = s.avgPrice ? ((s.avgPrice - price) / s.avgPrice) * 100 : 0;
      const a = MD.getAsset(sym);
      return '<div class="holding-item" data-hold="' + esc(sym) + '">' +
        '<div class="hi-left"><div class="hi-sym">' + esc(sym) + '</div><div class="hi-qty">' + s.qty.toLocaleString() + ' @ ' + fmtPriceD(sym, s.avgPrice) + '</div></div>' +
        '<div class="hi-right"><div class="hi-value c-muted">' + fmtDisplay(value, a.currency) + '</div>' +
        '<div class="hi-pnl ' + pnlClass(pnl) + '">' + signed(pnlPct.toFixed(2), '%') + '</div></div>' +
        '<button class="btn btn-sm btn-ghost hi-sell" data-cover="' + esc(sym) + '">' + esc(t('holdings.cover')) + '</button>' +
        '</div>';
    }).join('');
  }

  /* ------------------------- Transactions ------------------------- */
  function renderTransactions() {
    const sim = Store.getSelected();
    if (!sim || !sim.transactions.length) {
      $('tabContent').innerHTML = '<div class="empty-state">' + esc(t('tx.empty')) + '</div>';
      return;
    }
    const locale = L() === 'zh-TW' ? 'zh-HK' : 'en-US';
    let html = '<table class="tbl"><thead><tr>' +
      '<th>' + esc(t('tx.time')) + '</th><th>' + esc(t('tx.type')) + '</th><th>' + esc(t('tx.symbol')) + '</th>' +
      '<th class="t-num">' + esc(t('tx.qty')) + '</th><th class="t-num">' + esc(t('tx.price')) + '</th>' +
      '<th class="t-num">' + esc(t('tx.amount')) + '</th><th class="t-num">' + esc(t('tx.fee')) + '</th></tr></thead><tbody>';
    sim.transactions.slice(0, 200).forEach(function (tx) {
      const isBuy = tx.type === 'BUY' || tx.type === 'DEPOSIT';
      const isSell = tx.type === 'SELL' || tx.type === 'REDEEM';
      const cls = tx.type === 'INTEREST' ? 't-pos' : (isBuy ? 't-pos' : 't-neg');
      html += '<tr><td>' + new Date(tx.ts).toLocaleString(locale, { hour12: false }) + '</td>' +
        '<td class="' + cls + '">' + esc(t('tx.type.' + tx.type.toLowerCase())) + '</td>' +
        '<td>' + esc(tx.symbol) + '</td>' +
        '<td class="t-num">' + (tx.qty ? tx.qty.toLocaleString() : '—') + '</td>' +
        '<td class="t-num">' + fmtDisplay(tx.price, tx.currency) + '</td>' +
        '<td class="t-num">' + fmtDisplay(tx.amount, tx.currency) + '</td>' +
        '<td class="t-num c-muted">' + fmtDisplay(tx.fee, tx.currency) + '</td></tr>';
    });
    html += '</tbody></table>';
    $('tabContent').innerHTML = html;
  }

  /* --------------------------- Deposits --------------------------- */
  function renderDeposits() {
    const sim = Store.getSelected();
    if (!sim || !sim.deposits.length) {
      $('tabContent').innerHTML = '<div class="empty-state">' + esc(t('deposit.empty')) + '</div>';
      return;
    }
    let html = '<table class="tbl"><thead><tr>' +
      '<th>' + esc(t('deposit.product')) + '</th><th>' + esc(t('deposit.term')) + '</th>' +
      '<th class="t-num">' + esc(t('deposit.principal')) + '</th><th class="t-num">' + esc(t('deposit.rate')) + '</th>' +
      '<th class="t-num">' + esc(t('deposit.accrued')) + '</th><th class="t-num">' + esc(t('deposit.total')) + '</th>' +
      '<th></th></tr></thead><tbody>';
    sim.deposits.forEach(function (d) {
      const dMeta = MD.getDeposit(d.depositId);
      const term = dMeta ? dMeta.term : 0;
      const interest = Store.accruedInterest(d);
      const name = L() === 'zh-TW' ? d.nameZh : d.name;
      html += '<tr>' +
        '<td>' + esc(name) + ' <span class="c-muted">' + d.currency + '</span></td>' +
        '<td>' + esc(t('deposit.months', { n: term })) + '</td>' +
        '<td class="t-num">' + fmtMoney(d.principal, d.currency) + '</td>' +
        '<td class="t-num">' + (d.rate * 100).toFixed(1) + '%</td>' +
        '<td class="t-num t-pos">' + fmtMoney(interest, d.currency) + '</td>' +
        '<td class="t-num">' + fmtMoney(d.principal + interest, d.currency) + '</td>' +
        '<td><button class="btn btn-sm btn-ghost" data-redeem="' + esc(d.id) + '">' + esc(t('deposit.redeem')) + '</button></td>' +
        '</tr>';
    });
    html += '</tbody></table>';
    $('tabContent').innerHTML = html;
  }

  /* ------------------------- Market movers ------------------------- */
  function renderMovers() {
    const m = MD.getTopMovers();
    const lang = L();
    function name(it) { return lang === 'zh-TW' ? it.nameZh : it.name; }
    function card(title, items) {
      let h = '<div class="movers-card"><div class="movers-card-title">' + esc(title) + '</div>';
      items.forEach(function (it, i) {
        h += '<div class="mover-row" data-symbol="' + esc(it.symbol) + '">' +
          '<span class="mover-rank">' + (i + 1) + '</span>' +
          '<span class="mover-sym">' + esc(it.symbol) + '</span>' +
          '<span class="mover-name">' + esc(name(it)) + ' <span class="mover-market">' + it.market + '</span></span>' +
          '<span class="mover-price">' + it.price.toFixed(it.decimals) + '</span>' +
          '<span class="mover-chg ' + pnlClass(it.chgPct) + '">' + signed(it.chgPct.toFixed(2), '%') + '</span>' +
          '</div>';
      });
      return h + '</div>';
    }
    const html = '<div class="c-muted" style="padding:10px 14px 0;">' + esc(t('movers.hint')) + '</div>' +
      '<div class="movers-grid">' +
      card(t('movers.todayGainers'), m.todayGainers) +
      card(t('movers.todayLosers'), m.todayLosers) +
      card(t('movers.ytdEtf'), m.ytdEtfGainers) +
      card(t('movers.ytdEtfLosers'), m.ytdEtfLosers) +
      '</div>';
    $('tabContent').innerHTML = html;
  }

  /* ------------------------ Famous investors ------------------------ */
  function donutGradient(weights, palette) {
    let total = 0; weights.forEach(function (w) { total += w; });
    let acc = 0;
    const segs = weights.map(function (w, i) {
      const start = acc / total * 100;
      acc += w;
      const end = acc / total * 100;
      return palette[i % palette.length] + ' ' + start.toFixed(2) + '% ' + end.toFixed(2) + '%';
    });
    return 'conic-gradient(' + segs.join(', ') + ')';
  }

  function renderInvestors() {
    const invs = MD.getInvestors();
    const lang = L();
    const palette = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#e5484d', '#8b5cf6', '#14b8a6', '#f43f5e'];
    let html = '<div class="investors-list">';
    invs.forEach(function (inv) {
      const name = lang === 'zh-TW' ? inv.nameZh : inv.name;
      const firm = lang === 'zh-TW' ? inv.firmZh : inv.firm;
      const strategy = lang === 'zh-TW' ? inv.strategyZh : inv.strategyEn;
      const note = lang === 'zh-TW' ? inv.noteZh : inv.noteEn;
      const avatarColor = palette[hash(inv.id) % palette.length];
      const initial = name.charAt(0);
      const photo = inv.photo || '';
      const weights = inv.holdings.map(function (h) { return h.weight; });
      html += '<div class="investor-card">';
      html += '<div class="investor-head">' +
        '<div class="investor-avatar" style="background:' + avatarColor + ';"><span class="av-mono">' + esc(initial) + '</span>' +
        (photo ? '<img class="av-photo" src="' + esc(photo) + '" loading="lazy" onerror="this.remove()" alt="" />' : '') +
        '</div>' +
        '<div><div class="ih-name">' + esc(name) + '</div><div class="ih-firm">' + esc(firm) + '</div></div>' +
        '<div class="ih-strategy">' + esc(strategy) + '</div></div>';
      html += '<div class="investor-body">';
      // holdings: donut chart + table side by side
      html += '<div class="holdings-flex">' +
        '<div class="donut" style="background:' + donutGradient(weights, palette) + ';"><div class="donut-hole">' + esc(t('investors.holdings')) + '</div></div>' +
        '<div class="holdings-table-wrap"><table class="fin-table"><thead><tr><th style="width:24px;">#</th><th>' + esc(t('holdings.symbol')) + '</th><th class="num">' + esc(t('investors.weight')) + '</th></tr></thead><tbody>';
      inv.holdings.forEach(function (h, i) {
        const a = MD.getAsset(h.symbol);
        const hn = a ? (lang === 'zh-TW' ? a.nameZh : a.name) : h.symbol;
        html += '<tr data-symbol="' + esc(h.symbol) + '" style="cursor:pointer;"><td>' + (i + 1) + '</td><td>' + esc(h.symbol) + ' · ' + esc(hn) + '</td><td class="num">' + (h.weight * 100).toFixed(0) + '%</td></tr>';
      });
      html += '</tbody></table></div></div>';
      // asset allocation
      html += '<div><strong style="font-size:12px;">' + esc(t('investors.allocation')) + '</strong>' +
        '<div class="alloc-bar">' + inv.allocation.map(function (al, i) {
          return '<div class="alloc-seg" style="width:' + (al.pct * 100) + '%;background:' + palette[i % palette.length] + ';">' + (al.pct * 100).toFixed(0) + '%</div>';
        }).join('') + '</div>' +
        '<div class="alloc-legend">' + inv.allocation.map(function (al, i) {
          return '<span class="alloc-legend-item"><span class="alloc-dot" style="background:' + palette[i % palette.length] + ';"></span>' + esc(lang === 'zh-TW' ? al.labelZh : al.label) + ' ' + (al.pct * 100).toFixed(0) + '%</span>';
        }).join('') + '</div></div>';
      html += '<div class="investor-note">' + esc(note) + '</div>';
      html += '</div></div>';
    });
    html += '</div>';
    return html;
  }

  function renderInvestorsView() {
    $('pageView').innerHTML = pageHeader(t('investors.title'), t('portfolio.subtitle')) + renderInvestors();
  }

  /* ------------------------- Competition ------------------------- */
  function renderCompetition() {
    const board = Store.getLeaderboard();
    if (!board.length) {
      $('tabContent').innerHTML = '<div class="empty-state">' + esc(t('competition.empty')) + '</div>';
      return;
    }
    const maxRet = Math.max.apply(null, board.map(function (b) { return Math.abs(b.totalReturn); })) || 1;
    let html = '<div class="c-muted" style="padding:10px 14px;">' + esc(t('competition.hint')) + '</div>';
    html += '<table class="tbl"><thead><tr>' +
      '<th>' + esc(t('competition.rank')) + '</th><th>' + esc(t('competition.player')) + '</th><th>' + esc(t('competition.sim')) + '</th>' +
      '<th class="t-num">' + esc(t('competition.start')) + '</th><th class="t-num">' + esc(t('competition.assets')) + '</th>' +
      '<th class="t-num">' + esc(t('competition.dayPnl')) + '</th><th>' + esc(t('competition.return')) + '</th></tr></thead><tbody>';
    board.forEach(function (b, i) {
      const cls = pnlClass(b.totalReturn);
      html += '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + esc(b.playerName || b.name) + '</td>' +
        '<td>' + esc(b.name) + (b.bankrupt ? ' <span class="c-muted">(' + esc(t('account.bankrupt')) + ')</span>' : '') + '</td>' +
        '<td class="t-num">' + fmtMoney(b.startingCapital, b.baseCurrency) + '</td>' +
        '<td class="t-num">' + fmtMoney(b.totalAssets, b.baseCurrency) + '</td>' +
        '<td class="t-num ' + pnlClass(b.dayPnl) + '">' + signed(fmtMoney(b.dayPnl, b.baseCurrency), '') + '</td>' +
        '<td><span class="' + cls + '" style="font-weight:700;">' + signed(b.totalReturn.toFixed(2), '%') + '</span>' +
        '<div class="comp-bar"><div class="comp-bar-fill ' + cls + '" style="width:' + Math.max(4, Math.abs(b.totalReturn) / maxRet * 100) + '%"></div></div></td>' +
        '</tr>';
    });
    html += '</tbody></table>';
    $('tabContent').innerHTML = html;
  }

  /* ------------------------- Report modal ------------------------- */
  function renderReport(sim, isGameOver) {
    const r = Store.getPerformanceReport(sim);
    const cur = sim.baseCurrency;
    function repRow(label, value) {
      return '<div class="report-row"><span class="rr-label">' + esc(label) + '</span><span class="rr-value">' + value + '</span></div>';
    }
    let html = '';
    html += '<div class="report-hero">' +
      '<div><div class="rh-value ' + pnlClass(r.totalReturn) + '">' + signed(r.totalReturn.toFixed(2), '%') + '</div><div class="rh-label">' + esc(t('report.totalReturn')) + '</div></div>' +
      '<div><div class="rh-value">' + fmtMoney(r.finalAssets, cur) + '</div><div class="rh-label">' + esc(t('report.final')) + '</div></div>' +
      '</div>';

    if (r.bankrupt) html += '<div class="bankrupt-banner" style="margin:0 0 14px;">' + esc(t('report.bankrupt')) + '</div>';
    else if (r.ended) html += '<div class="c-muted" style="margin:0 0 14px;">' + esc(t('report.ended')) + '</div>';
    else html += '<div class="c-muted" style="margin:0 0 14px;">' + esc(t('report.notEnded')) + '</div>';

    html += '<div class="report-section"><h4>' + esc(t('report.summary')) + '</h4><div class="report-grid">' +
      repRow(t('report.start'), fmtMoney(r.startingCapital, cur)) +
      repRow(t('report.final'), fmtMoney(r.finalAssets, cur)) +
      repRow(t('report.realized'), signed(fmtMoney(r.realized, cur), '')) +
      repRow(t('report.unrealized'), signed(fmtMoney(r.unrealized, cur), '')) +
      repRow(t('report.peakNav'), fmtMoney(r.peakNav, cur)) +
      repRow(t('report.maxDrawdown'), '-' + r.maxDrawdown.toFixed(2) + '%') +
      repRow(t('report.days'), r.days.toFixed(1)) +
      repRow(t('report.maxLeverage'), r.maxLeverageUsed.toFixed(2) + '×') +
      '</div></div>';

    html += '<div class="report-section"><h4>' + esc(t('report.trading')) + '</h4><div class="report-grid">' +
      repRow(t('report.totalTrades'), r.totalTrades) +
      repRow(t('report.winRate'), r.winRate.toFixed(1) + '%') +
      repRow(t('report.wins'), r.wins) +
      repRow(t('report.losses'), r.losses) +
      repRow(t('report.profitFactor'), (r.profitFactor === Infinity ? '∞' : r.profitFactor.toFixed(2))) +
      repRow(t('report.buyCount'), r.buyCount) +
      repRow(t('report.sellCount'), r.sellCount) +
      repRow(t('report.shortCount'), r.shortCount) +
      repRow(t('report.coverCount'), r.coverCount) +
      repRow(t('report.depositCount'), r.depositCount) +
      repRow(t('report.interest'), fmtMoney(r.interestEarned, cur)) +
      repRow(t('report.bestTrade'), r.bestTrade ? esc(r.bestTrade.symbol) + ' ' + signed(fmtMoney(r.bestTrade.pnl, cur), '') : '—') +
      repRow(t('report.worstTrade'), r.worstTrade ? esc(r.worstTrade.symbol) + ' ' + signed(fmtMoney(r.worstTrade.pnl, cur), '') : '—') +
      '</div></div>';

    html += '<div class="form-actions"><button class="btn btn-primary" id="btnReportClose">' + esc(t('report.close')) + '</button></div>';
    showModal(t('report.title'), html);
    $('btnReportClose').addEventListener('click', closeModal);
  }

  /* ------------------------- Asset detail ------------------------- */
  function kv(label, value) {
    return '<div class="kv-item"><span class="kv-label">' + esc(label) + '</span><span class="kv-value">' + value + '</span></div>';
  }

  function renderAssetDetail() {
    const sym = state.selected.symbol;
    if (!sym || state.selected.type !== 'asset') return;
    const a = MD.getAsset(sym);
    const tab = state.detailTab;
    const host = $('detailContent');

    if (tab === 'profile') host.innerHTML = renderProfile(sym);
    else if (tab === 'financials') {
      if (a.type === 'etf') host.innerHTML = renderEtfProfile(sym);
      else if (a.type === 'bond') host.innerHTML = renderBondInfo(sym);
      else host.innerHTML = renderFinancials(sym);
    } else if (tab === 'dividends') host.innerHTML = renderDividends(sym);
    else if (tab === 'performance') host.innerHTML = renderPerformance(sym);

    document.querySelectorAll('.detail-tab').forEach(function (el) {
      el.className = 'detail-tab' + (el.getAttribute('data-detail') === tab ? ' active' : '');
    });
  }

  function renderProfile(sym) {
    const a = MD.getAsset(sym);
    const cur = a.currency;
    const f = MD.getFundamentals(sym);
    const sector = L() === 'zh-TW' ? f.sectorZh : f.sector;
    const desc = L() === 'zh-TW' ? f.descriptionZh : f.description;
    let html = '<div class="kv-grid">' +
      kv(t('type.' + a.type), t('market.' + a.market.toLowerCase())) +
      kv(t('fin.sector'), esc(sector)) +
      kv(t('quote.currency'), cur) +
      kv(t('fin.high52'), fmtPrice(sym, f.high52)) +
      kv(t('fin.low52'), fmtPrice(sym, f.low52)) +
      kv(t('fin.beta'), f.beta.toFixed(2)) +
      kv(t('fin.dividendYield'), (f.dividendYield * 100).toFixed(2) + '%');
    if (a.type === 'etf') {
      const p = MD.getEtfProfile(sym);
      html += kv(t('etf.provider'), esc(p.provider)) + kv(t('etf.aum'), fmtLarge(p.aum, cur));
    } else {
      html += kv(t('fin.marketCap'), fmtLarge(f.marketCap, cur));
    }
    html += '</div>';
    html += '<h4 style="font-size:12px;margin:14px 0 6px;">' + esc(t('fin.description')) + '</h4>';
    html += '<p style="font-size:12px;color:var(--text-2);line-height:1.6;">' + esc(desc) + '</p>';
    html += '<div class="fin-note">' + esc(t('fin.simulated')) + '</div>';
    return html;
  }

  function renderFinancials(sym) {
    const f = MD.getFundamentals(sym);
    const a = MD.getAsset(sym);
    const cur = a.currency;
    let html = '<div class="fin-note">' + esc(t('fin.simulated')) + '</div>';
    html += '<h4 style="font-size:12px;margin:10px 0 6px;">' + esc(t('fin.ratios')) + '</h4>';
    html += '<div class="kv-grid">' +
      kv(t('fin.marketCap'), fmtLarge(f.marketCap, cur)) +
      kv(t('fin.pe'), f.pe.toFixed(2)) +
      kv(t('fin.pb'), f.pb.toFixed(2)) +
      kv(t('fin.ps'), f.ps.toFixed(2)) +
      kv(t('fin.eps'), fmtPrice(sym, f.eps)) +
      kv(t('fin.roe'), (f.roe * 100).toFixed(1) + '%') +
      kv(t('fin.grossMargin'), (f.grossMargin * 100).toFixed(1) + '%') +
      kv(t('fin.netMargin'), (f.netMargin * 100).toFixed(1) + '%') +
      kv(t('fin.dividendYield'), (f.dividendYield * 100).toFixed(2) + '%') +
      kv(t('fin.beta'), f.beta.toFixed(2)) +
      kv(t('fin.high52'), fmtPrice(sym, f.high52)) +
      kv(t('fin.low52'), fmtPrice(sym, f.low52)) +
      '</div>';

    html += '<h4 style="font-size:12px;margin:14px 0 6px;">' + esc(t('fin.income')) + '</h4>';
    html += '<table class="fin-table"><thead><tr><th></th>' +
      f.income.years.map(function (y) { return '<th class="num">' + y + '</th>'; }).join('') + '</tr></thead><tbody>' +
      '<tr><td>' + esc(t('fin.revenue')) + '</td>' + f.income.revenue.map(function (v) { return '<td class="num">' + fmtLarge(v, cur) + '</td>'; }).join('') + '</tr>' +
      '<tr><td>' + esc(t('fin.netIncome')) + '</td>' + f.income.netIncome.map(function (v) { return '<td class="num">' + fmtLarge(v, cur) + '</td>'; }).join('') + '</tr>' +
      '<tr><td>' + esc(t('fin.eps')) + '</td>' + f.income.eps.map(function (v) { return '<td class="num">' + fmtPrice(sym, v) + '</td>'; }).join('') + '</tr>' +
      '</tbody></table>';

    html += '<h4 style="font-size:12px;margin:14px 0 6px;">' + esc(t('fin.balance')) + '</h4>';
    html += '<div class="kv-grid">' +
      kv(t('fin.totalAssets'), fmtLarge(f.totalAssets, cur)) +
      kv(t('fin.totalLiabilities'), fmtLarge(f.totalLiabilities, cur)) +
      kv(t('fin.equity'), fmtLarge(f.equity, cur)) +
      kv(t('fin.debtToEquity'), f.debtToEquity.toFixed(2)) +
      kv(t('fin.ocf'), fmtLarge(f.operatingCashFlow, cur)) +
      kv(t('fin.fcf'), fmtLarge(f.freeCashFlow, cur)) +
      '</div>';

    // shareholders
    let holderSum = 0;
    f.shareholders.forEach(function (h) { holderSum += h.pct; });
    html += '<h4 style="font-size:12px;margin:14px 0 6px;">' + esc(t('shareholders.title')) + '</h4>';
    html += '<table class="fin-table"><thead><tr><th>' + esc(t('shareholders.holder')) + '</th><th class="num">' + esc(t('shareholders.pct')) + '</th></tr></thead><tbody>';
    f.shareholders.forEach(function (h) {
      const hn = L() === 'zh-TW' ? h.nameZh : h.name;
      html += '<tr><td>' + esc(hn) + '</td><td class="num">' + h.pct.toFixed(2) + '%</td></tr>';
    });
    html += '<tr><td class="c-muted">' + esc(t('shareholders.others')) + '</td><td class="num c-muted">' + Math.max(0, 100 - holderSum).toFixed(2) + '%</td></tr>';
    html += '</tbody></table>';
    return html;
  }

  function renderEtfProfile(sym) {
    const p = MD.getEtfProfile(sym);
    const a = MD.getAsset(sym);
    const cur = a.currency;
    let html = '<div class="kv-grid">' +
      kv(t('etf.provider'), esc(p.provider)) +
      kv(t('etf.index'), esc(p.index)) +
      kv(t('etf.expense'), p.expenseRatio.toFixed(2) + '%') +
      kv(t('etf.aum'), fmtLarge(p.aum, cur)) +
      kv(t('etf.inception'), p.inception) +
      kv(t('fin.dividendYield'), p.dividendYield.toFixed(2) + '%') +
      '</div>';
    html += '<h4 style="font-size:12px;margin:14px 0 6px;">' + esc(t('etf.topHoldings')) + '</h4>';
    html += '<table class="fin-table"><thead><tr><th style="width:30px;">#</th><th></th></tr></thead><tbody>';
    p.topHoldings.forEach(function (h, i) { html += '<tr><td>' + (i + 1) + '</td><td>' + esc(h) + '</td></tr>'; });
    html += '</tbody></table>';
    html += '<div class="fin-note">' + esc(t('fin.simulated')) + '</div>';
    return html;
  }

  function renderBondInfo(sym) {
    const a = MD.getAsset(sym);
    const d = MD.getDividends(sym);
    const cur = a.currency;
    let html = '<div class="kv-grid">' +
      kv(t('div.annualized'), d.annualized.toFixed(2) + '%') +
      kv(t('div.freq'), esc(d.freq)) +
      kv(t('quote.currency'), cur) +
      kv(t('quote.prevClose'), fmtPrice(sym, MD.getPrevClose(sym))) +
      '</div><div class="fin-note">' + esc(t('fin.simulated')) + '</div>';
    return html;
  }

  function renderDividends(sym) {
    const d = MD.getDividends(sym);
    if (!d.pays) return '<div class="empty-state">' + esc(t('div.none')) + '</div>';
    let html = '<div class="kv-grid">' +
      kv(t('div.annualized'), d.annualized.toFixed(2) + '%') +
      kv(t('div.freq'), esc(d.freq)) +
      '</div>';
    html += '<table class="fin-table"><thead><tr><th>' + esc(t('div.exDate')) + '</th><th>' + esc(t('div.payDate')) + '</th><th class="num">' + esc(t('div.amount')) + '</th></tr></thead><tbody>';
    d.rows.forEach(function (r) {
      html += '<tr><td>' + esc(r.exDate) + '</td><td>' + esc(r.payDate) + '</td><td class="num">' + fmtPrice(sym, r.amount) + '</td></tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function renderPerformance(sym) {
    const p = MD.getPerformance(sym);
    const keys = ['1M', '3M', '1Y', '3Y', '5Y', 'YTD'];
    let html = '<div class="perf-grid">';
    keys.forEach(function (k) {
      const v = p[k];
      html += '<div class="perf-card"><div class="pc-label">' + esc(t('etf.' + k)) + '</div><div class="pc-value ' + pnlClass(v) + '">' + signed(v.toFixed(2), '%') + '</div></div>';
    });
    html += '</div><div class="fin-note">' + esc(t('fin.simulated')) + '</div>';
    return html;
  }

  /* ------------------------- Tabs switch ------------------------- */
  function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll('.main-tab').forEach(function (el) {
      el.className = 'main-tab' + (el.getAttribute('data-tab') === tab ? ' active' : '');
    });
    if (tab === 'tx') renderTransactions();
    else if (tab === 'deposits') renderDeposits();
  }

  /* ------------------------ Simulations manager ------------------------ */
  function openManageModal() {
    const sims = Store.listSimulations();
    const cur = Store.getSelected();
    let html = '<button class="btn btn-primary btn-block" id="btnNewSim" style="margin-bottom:12px;">' + esc(t('sim.new')) + '</button>';
    if (!sims.length) html += '<div class="empty-state">' + esc(t('sim.noData')) + '</div>';
    html += '<div class="sim-list">';
    sims.forEach(function (s) {
      const ended = s.bankrupt ? t('account.bankrupt') : (Store.isEnded(s) ? t('sim.ended') : t('sim.active'));
      html += '<div class="sim-list-item' + (cur && s.id === cur.id ? ' current' : '') + '">' +
        '<div class="sl-info"><div class="sl-name">' + esc(s.name) + '</div>' +
        '<div class="sl-meta">' + esc(s.playerName || '') + ' · ' + fmtMoney(s.startingCapital, s.baseCurrency) + ' · ' + ended + '</div></div>' +
        '<div style="display:flex;gap:6px;">' +
        (cur && s.id === cur.id ? '' : '<button class="btn btn-sm btn-ghost" data-switch="' + s.id + '">' + esc(t('common.confirm')) + '</button>') +
        '<button class="btn btn-sm btn-ghost" data-del="' + s.id + '" style="color:var(--up);">' + esc(t('sim.delete')) + '</button>' +
        '</div></div>';
    });
    html += '</div>';
    showModal(t('sim.editTitle'), html);

    const nb = $('btnNewSim');
    if (nb) nb.addEventListener('click', openCreateModal);
    document.querySelectorAll('[data-switch]').forEach(function (el) {
      el.addEventListener('click', function () {
        Store.selectSimulation(el.getAttribute('data-switch'));
        state.gameOverShown = false;
        closeModal();
        renderSimSelector(); renderAll();
      });
    });
    document.querySelectorAll('[data-del]').forEach(function (el) {
      el.addEventListener('click', function () {
        const id = el.getAttribute('data-del');
        if (window.confirm(t('sim.confirmDelete'))) {
          Store.deleteSimulation(id);
          closeModal();
          renderSimSelector(); renderAll();
        }
      });
    });
  }

  function openCreateModal() {
    const today = new Date().toISOString().slice(0, 10);
    const future = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
    const html =
      '<div class="form-field"><label>' + esc(t('sim.name')) + '</label><input id="fName" value="' + esc(t('sim.defaultName')) + '" /></div>' +
      '<div class="form-field"><label>' + esc(t('sim.player')) + '</label><input id="fPlayer" value="' + esc(t('sim.defaultPlayer')) + '" /></div>' +
      '<div class="form-field"><label>' + esc(t('sim.baseCurrency')) + '</label><select id="fCurrency"><option value="HKD">HKD</option><option value="USD">USD</option></select></div>' +
      '<div class="form-field"><label>' + esc(t('sim.startCapital')) + '</label><input id="fCapital" type="number" step="any" value="100000" /></div>' +
      '<div class="form-field"><label>' + esc(t('sim.startDate')) + '</label><input id="fStart" type="date" value="' + today + '" /></div>' +
      '<div class="form-field"><label>' + esc(t('sim.endDate')) + '</label><input id="fEnd" type="date" value="' + future + '" /></div>' +
      '<div class="form-actions"><button class="btn btn-ghost" id="btnCancelCreate">' + esc(t('sim.cancel')) + '</button>' +
      '<button class="btn btn-primary" id="btnConfirmCreate">' + esc(t('sim.create')) + '</button></div>';
    showModal(t('sim.createTitle'), html);

    $('btnCancelCreate').addEventListener('click', closeModal);
    $('btnConfirmCreate').addEventListener('click', function () {
      Store.createSimulation({
        name: $('fName').value || t('sim.defaultName'),
        playerName: $('fPlayer').value || t('sim.defaultPlayer'),
        baseCurrency: $('fCurrency').value,
        startingCapital: $('fCapital').value,
        startDate: $('fStart').value,
        endDate: $('fEnd').value,
      });
      state.gameOverShown = false;
      closeModal();
      renderSimSelector(); renderAll();
      toast(t('order.success'));
    });
  }

  /* --------------------------- render all --------------------------- */
  function renderAll() {
    renderSimSelector();
    renderWatchlist();
    renderRangeSelector();
    if (state.selected.type === 'asset' && state.selected.symbol) {
      renderQuoteView(); renderOrderTicket(); renderChart(); renderAssetDetail();
    } else if (state.selected.type === 'deposit') {
      renderDepositView();
    }
    renderAccount();
    renderHoldings();
    renderShorts();
    switchTab(state.activeTab);
    updateConnStatus();
    updateLastUpdated();
  }

  /* -------------------------- Events -------------------------- */
  function bindEvents() {
    $('langToggle').addEventListener('click', function () {
      const next = L() === 'zh-TW' ? 'en' : 'zh-TW';
      I18N.setLang(next);
      Store.setLanguage(next);
      applyLanguage();
    });

    $('simSelect').addEventListener('change', function () {
      Store.selectSimulation(this.value);
      state.gameOverShown = false;
      renderAll();
    });

    $('currSelect').addEventListener('change', function () {
      setDisplayCurrency(this.value);
    });

    $('btnManageSims').addEventListener('click', openManageModal);
    $('btnReport').addEventListener('click', function () {
      const sim = Store.getSelected();
      if (sim) renderReport(sim);
    });
    $('modalClose').addEventListener('click', closeModal);
    $('modalBackdrop').addEventListener('click', function (e) {
      if (e.target === $('modalBackdrop')) closeModal();
    });

    $('searchInput').addEventListener('input', function () {
      state.search = this.value;
      renderWatchlist();
    });

    $('watchlist').addEventListener('click', function (e) {
      const favBtn = e.target.closest('[data-fav]');
      if (favBtn) { e.stopPropagation(); toggleFavorite(favBtn.getAttribute('data-fav')); return; }
      const item = e.target.closest('.watch-item');
      if (!item) return;
      const kind = item.getAttribute('data-watch');
      const sym = item.getAttribute('data-symbol');
      if (kind === 'deposit') selectDeposit(sym);
      else selectAsset(sym);
    });

    $('holdings').addEventListener('click', function (e) {
      const sellBtn = e.target.closest('[data-sell]');
      if (sellBtn) { e.stopPropagation(); selectAsset(sellBtn.getAttribute('data-sell')); setOrderSide('SELL'); return; }
      const hold = e.target.closest('[data-hold]');
      if (hold) selectAsset(hold.getAttribute('data-hold'));
    });

    $('shorts').addEventListener('click', function (e) {
      const coverBtn = e.target.closest('[data-cover]');
      if (coverBtn) { e.stopPropagation(); selectAsset(coverBtn.getAttribute('data-cover')); setOrderSide('COVER'); return; }
      const hold = e.target.closest('[data-hold]');
      if (hold) selectAsset(hold.getAttribute('data-hold'));
    });

    $('rangeSelector').addEventListener('click', function (e) {
      const btn = e.target.closest('.range-btn');
      if (!btn) return;
      state.chartRange = btn.getAttribute('data-range');
      renderRangeSelector();
      renderChart();
    });

    $('detailTabs').addEventListener('click', function (e) {
      const btn = e.target.closest('.detail-tab');
      if (!btn) return;
      state.detailTab = btn.getAttribute('data-detail');
      renderAssetDetail();
    });

    $('tabBuy').addEventListener('click', function () { setOrderSide('BUY'); });
    $('tabSell').addEventListener('click', function () { setOrderSide('SELL'); });
    $('tabShort').addEventListener('click', function () { setOrderSide('SHORT'); });
    $('tabCover').addEventListener('click', function () { setOrderSide('COVER'); });

    $('orderPrice').addEventListener('input', function () { state.priceEdited = true; state.orderPrice = this.value; updateOrderEstimate(); });
    $('orderQty').addEventListener('input', function () { state.orderQty = this.value; updateOrderEstimate(); });
    $('btnMax').addEventListener('click', handleMax);
    $('btnSubmitOrder').addEventListener('click', submitOrder);

    $('tabBar').addEventListener('click', function (e) {
      const tab = e.target.closest('.main-tab');
      if (tab) switchTab(tab.getAttribute('data-tab'));
    });

    // tab content: redeem deposits + click-through to assets
    $('tabContent').addEventListener('click', function (e) {
      const redeemBtn = e.target.closest('[data-redeem]');
      if (redeemBtn) {
        const sim = Store.getSelected();
        if (!sim) return;
        const res = Store.redeemDeposit(sim, redeemBtn.getAttribute('data-redeem'));
        if (res.ok) { toast(t('deposit.redeemed')); renderAccount(); renderHoldings(); renderShorts(); renderDeposits(); renderTransactions(); }
        return;
      }
      const symEl = e.target.closest('[data-symbol]');
      if (symEl) selectAsset(symEl.getAttribute('data-symbol'));
    });

    // Toolbar navigation
    $('toolbar').addEventListener('click', function (e) {
      const btn = e.target.closest('.tb-btn');
      if (btn) switchView(btn.getAttribute('data-view'));
    });

    // User / auth
    $('btnUser').addEventListener('click', openAuthModal);

    // Theme toggle
    $('btnTheme').addEventListener('click', toggleTheme);

    // Page view click-through to trade
    $('pageView').addEventListener('click', function (e) {
      const symEl = e.target.closest('[data-symbol]');
      if (symEl) {
        selectAsset(symEl.getAttribute('data-symbol'));
        switchView('trade');
      }
    });

    window.addEventListener('resize', function () { PriceChart.render(); });
  }

  /* ============================ Toolbar views ============================ */
  function switchView(view) {
    state.currentView = view;
    document.querySelectorAll('.tb-btn').forEach(function (b) {
      b.className = 'tb-btn' + (b.getAttribute('data-view') === view ? ' active' : '');
    });
    const tradeView = $('tradeView');
    const pageView = $('pageView');
    if (view === 'trade') {
      tradeView.style.display = '';
      pageView.style.display = 'none';
    } else {
      tradeView.style.display = 'none';
      pageView.style.display = 'block';
      renderPageView(view);
    }
  }

  function renderPageView(view) {
    if (view === 'observe') renderObserveView();
    else if (view === 'market') renderMarketView();
    else if (view === 'etf') renderEtfView();
    else if (view === 'hot') renderHotView();
    else if (view === 'portfolio') renderPortfolioView();
    else if (view === 'investors') renderInvestorsView();
    else if (view === 'fxcrypto') renderFxCryptoView();
    else if (view === 'competition') renderCompetitionView();
  }

  /* --------------------------- Theme --------------------------- */
  function initTheme() {
    const saved = localStorage.getItem('pt_theme');
    if (saved === 'dark') document.body.classList.add('dark');
  }
  function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('pt_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  }

  /* ----------------------- Display currency ----------------------- */
  function initDisplayCurrency() {
    const saved = localStorage.getItem('pt_display_currency');
    if (saved === 'USD' || saved === 'HKD') state.displayCurrency = saved;
    const sel = $('currSelect');
    if (sel) sel.value = state.displayCurrency;
  }
  function setDisplayCurrency(c) {
    state.displayCurrency = (c === 'USD' || c === 'HKD') ? c : 'HKD';
    localStorage.setItem('pt_display_currency', state.displayCurrency);
    renderAll();
    if (state.currentView !== 'trade') renderPageView(state.currentView);
  }

  /* ------------------------- Observe list ------------------------- */
  function renderObserveView() {
    let html = pageHeader(t('observe.title'), t('observe.addHint'));
    html += '<div class="observe-add">' +
      '<input id="observeInput" list="observeDatalist" placeholder="' + esc(t('observe.addHint')) + '" />' +
      '<button class="btn btn-primary" id="btnObserveAdd">' + esc(t('observe.add')) + '</button>' +
      '<datalist id="observeDatalist">' + MD.ASSETS.map(function (a) { return '<option value="' + esc(a.symbol) + '">' + esc(L() === 'zh-TW' ? a.nameZh : a.name) + '</option>'; }).join('') + '</datalist>' +
      '</div>';
    const favs = getFavorites().map(function (s) { return MD.getAsset(s); }).filter(Boolean);
    if (!favs.length) {
      html += '<div class="empty-state">' + esc(t('observe.empty')) + '</div>';
    } else {
      html += '<div class="observe-grid">';
      favs.forEach(function (a) {
        const p = MD.getPrice(a.symbol);
        const pc = MD.getPrevClose(a.symbol);
        const chg = p - pc;
        const chgPct = pc ? (chg / pc) * 100 : 0;
        const f = MD.getFundamentals(a.symbol);
        const nm = L() === 'zh-TW' ? a.nameZh : a.name;
        html += '<div class="observe-card">' +
          '<div class="oc-top"><span class="oc-sym">' + esc(a.symbol) + '</span><span class="oc-chg ' + pnlClass(chg) + '">' + signed(chgPct.toFixed(2), '%') + '</span></div>' +
          '<div class="oc-name">' + esc(nm) + '</div>' +
          '<div class="oc-price">' + fmtPrice(a.symbol, p) + ' <span class="c-muted">' + a.currency + '</span></div>' +
          '<div class="oc-meta">' + esc(L() === 'zh-TW' ? '高低' : 'Range') + ': ' + fmtPrice(a.symbol, f.low52) + ' – ' + fmtPrice(a.symbol, f.high52) + '</div>' +
          '<div class="oc-actions">' +
          '<button class="btn btn-sm btn-primary" data-trade="' + esc(a.symbol) + '">' + esc(t('observe.trade')) + '</button>' +
          '<button class="btn btn-sm btn-ghost" data-unfav="' + esc(a.symbol) + '">' + esc(t('observe.remove')) + '</button>' +
          '</div></div>';
      });
      html += '</div>';
    }
    $('pageView').innerHTML = html;
    const addBtn = $('btnObserveAdd');
    if (addBtn) addBtn.addEventListener('click', function () {
      const sym = ($('observeInput').value || '').trim().toUpperCase();
      if (!sym) return;
      const a = MD.getAsset(sym);
      if (!a) { toast(t('watchlist.noResult')); return; }
      if (!isFavorite(sym)) toggleFavorite(sym);
      renderObserveView();
    });
    document.querySelectorAll('[data-unfav]').forEach(function (el) {
      el.addEventListener('click', function () { toggleFavorite(el.getAttribute('data-unfav')); renderObserveView(); });
    });
    document.querySelectorAll('[data-trade]').forEach(function (el) {
      el.addEventListener('click', function () { selectAsset(el.getAttribute('data-trade')); switchView('trade'); });
    });
  }

  function pageHeader(title, sub) {
    return '<div class="page-header"><span class="page-title">' + esc(title) + '</span><span class="page-sub">' + esc(sub || '') + '</span></div>';
  }
  function sectionTitle(text) {
    return '<div class="section-title"><span class="bar"></span>' + esc(text) + '</div>';
  }
  function indicesBar() {
    const idx = MD.getIndices();
    let h = '<div class="indices-bar">';
    idx.forEach(function (d) {
      const nm = L() === 'zh-TW' ? d.nameZh : d.name;
      h += '<div class="index-chip"><span class="ic-name">' + esc(nm) + '</span>' +
        '<span class="ic-value">' + d.value.toFixed(d.decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '</span>' +
        '<span class="ic-chg ' + pnlClass(d.chgPct) + '">' + signed(d.chgPct.toFixed(2), '%') + '</span></div>';
    });
    return h + '</div>';
  }
  function moverCard(title, items) {
    let h = '<div class="movers-card"><div class="movers-card-title">' + esc(title) + '</div>';
    items.forEach(function (it, i) {
      const nm = L() === 'zh-TW' ? it.nameZh : it.name;
      h += '<div class="mover-row" data-symbol="' + esc(it.symbol) + '">' +
        '<span class="mover-rank">' + (i + 1) + '</span>' +
        '<span class="mover-sym">' + esc(it.symbol) + '</span>' +
        '<span class="mover-name">' + esc(nm) + '</span>' +
        '<span class="mover-price">' + it.price.toFixed(it.decimals) + '</span>' +
        '<span class="mover-chg ' + pnlClass(it.chgPct) + '">' + signed(it.chgPct.toFixed(2), '%') + '</span>' +
        '</div>';
    });
    return h + '</div>';
  }

  function renderMarketView() {
    const stable = MD.getStabilityRanking();
    let html = pageHeader(t('market.title'), t('market.subtitle'));
    html += sectionTitle(t('indices.title'));
    html += indicesBar();

    // Classification screener (region > industry > need)
    html += renderScreener();

    // Market sections (rectangles): HK / US / EU, stocks + ETFs separated
    ['HK', 'US', 'EU'].forEach(function (mk) {
      html += renderMarketSection(mk);
    });

    html += sectionTitle(t('stability.title'));
    html += '<div class="panel" style="overflow:hidden;"><table class="hot-table"><thead><tr>' +
      '<th style="width:52px;">' + esc(t('stability.rank')) + '</th><th>' + esc(t('holdings.symbol')) + '</th><th></th>' +
      '<th class="num">' + esc(t('stability.vol')) + '</th><th class="num">' + esc(t('stability.cagr')) + '</th><th class="num">' + esc(t('stability.totalReturn')) + '</th></tr></thead><tbody>';
    stable.slice(0, 15).forEach(function (s, i) {
      const nm = L() === 'zh-TW' ? s.nameZh : s.name;
      html += '<tr data-symbol="' + esc(s.symbol) + '"><td><span class="stab-rank' + (i < 3 ? ' top' : '') + '">' + (i + 1) + '</span></td>' +
        '<td><strong>' + esc(s.symbol) + '</strong></td><td class="c-muted">' + esc(nm) + '</td>' +
        '<td class="num">' + s.volatility.toFixed(2) + '%</td>' +
        '<td class="num ' + pnlClass(s.cagr) + '">' + signed(s.cagr.toFixed(2), '%') + '</td>' +
        '<td class="num ' + pnlClass(s.totalReturn) + '">' + signed(s.totalReturn.toFixed(1), '%') + '</td></tr>';
    });
    html += '</tbody></table></div>';
    $('pageView').innerHTML = html;
    bindScreenerEvents();
  }

  function renderScreener() {
    const sc = state.screener;
    const industries = MD.INDUSTRIES;
    const needs = MD.NEEDS;
    const regions = ['HK', 'US', 'EU'];
    let html = sectionTitle(t('screen.title'));
    html += '<div class="screen-bar">' +
      '<select id="scRegion"><option value="">' + esc(t('screen.region')) + ': ' + esc(t('screen.all')) + '</option>' + regions.map(function (r) { return '<option value="' + r + '"' + (sc.region === r ? ' selected' : '') + '>' + esc(t('market.' + r.toLowerCase())) + '</option>'; }).join('') + '</select>' +
      '<select id="scIndustry"><option value="">' + esc(t('screen.industry')) + ': ' + esc(t('screen.all')) + '</option>' + industries.map(function (it) { return '<option value="' + it.key + '"' + (sc.industry === it.key ? ' selected' : '') + '>' + esc(L() === 'zh-TW' ? it.zh : it.en) + '</option>'; }).join('') + '</select>' +
      '<select id="scNeed"><option value="">' + esc(t('screen.need')) + ': ' + esc(t('screen.all')) + '</option>' + needs.map(function (n) { return '<option value="' + n.key + '"' + (sc.need === n.key ? ' selected' : '') + '>' + esc(L() === 'zh-TW' ? n.zh : n.en) + '</option>'; }).join('') + '</select>' +
      '</div>';
    const results = MD.screenAssets(sc.region, sc.industry, sc.need);
    html += '<div class="screen-results">';
    if (results.length) {
      results.forEach(function (a) {
        const p = MD.getPrice(a.symbol);
        const chg = MD.getTodayChangePct(a.symbol);
        const nm = L() === 'zh-TW' ? a.nameZh : a.name;
        const need = MD.needsOf(a.symbol, a.type);
        html += '<div class="screen-chip" data-symbol="' + esc(a.symbol) + '">' +
          '<span class="sc-sym">' + esc(a.symbol) + '</span>' +
          '<span class="sc-name">' + esc(nm) + '</span>' +
          '<span class="sc-tag">' + esc(L() === 'zh-TW' ? need[1] : need[0]) + '</span>' +
          '<span class="sc-price">' + fmtPriceD(a.symbol, p) + '</span>' +
          '<span class="sc-chg ' + pnlClass(chg) + '">' + signed(chg.toFixed(2), '%') + '</span>' +
          '</div>';
      });
    } else {
      html += '<div class="empty-state">' + esc(t('screen.empty')) + '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderMarketSection(mk) {
    const mv = MD.getMarketMovers(mk);
    const etf = MD.getMarketEtfYtd(mk);
    const mkLabel = t('market.' + mk.toLowerCase());
    if (!mv.gainers.length && !etf.gainers.length) return '';
    let html = '<div class="market-section">' +
      '<div class="ms-head"><span class="ms-title">' + esc(mkLabel) + '</span><span class="ms-sub">' + esc(t('type.stock') + ' & ' + t('type.etf')) + '</span></div>' +
      '<div class="ms-body">';
    if (mv.gainers.length) {
      html += '<div class="ms-col"><div class="ms-col-title">' + esc(t('type.stock') + ' · ' + t('movers.todayGainers')) + '</div>' +
        moverCard(t('movers.todayGainers'), mv.gainers) + moverCard(t('movers.todayLosers'), mv.losers) + '</div>';
    }
    if (etf.gainers.length) {
      html += '<div class="ms-col"><div class="ms-col-title">' + esc(t('type.etf') + ' · ' + t('movers.ytdEtf')) + '</div>' +
        moverCard(t('movers.ytdEtf'), etf.gainers) + moverCard(t('movers.ytdEtfLosers'), etf.losers) + '</div>';
    }
    html += '</div></div>';
    return html;
  }

  function bindScreenerEvents() {
    const region = $('scRegion');
    if (!region) return;
    region.addEventListener('change', function () { state.screener.region = this.value; renderMarketView(); });
    $('scIndustry').addEventListener('change', function () { state.screener.industry = this.value; renderMarketView(); });
    $('scNeed').addEventListener('change', function () { state.screener.need = this.value; renderMarketView(); });
  }

  function renderEtfView() {
    const picks = MD.getEtfPicks();
    let html = pageHeader(t('etf.title'), t('etf.subtitle'));
    html += '<div class="pick-grid">';
    picks.forEach(function (p) {
      const a = MD.getAsset(p.symbol);
      if (!a) return;
      const nm = L() === 'zh-TW' ? a.nameZh : a.name;
      const tag = L() === 'zh-TW' ? p.tag : p.tagEn;
      const reason = L() === 'zh-TW' ? p.reasonZh : p.reasonEn;
      const price = MD.getPrice(p.symbol);
      const chg = MD.getTodayChangePct(p.symbol);
      html += '<div class="pick-card" data-symbol="' + esc(p.symbol) + '">' +
        '<div class="pick-head"><span class="pick-sym">' + esc(p.symbol) + '</span><span class="pick-name">' + esc(nm) + '</span><span class="pick-tag">' + esc(tag) + '</span></div>' +
        '<div class="pick-reason">' + esc(reason) + '</div>' +
        '<div style="margin-top:8px;font-size:13px;"><strong>' + fmtPrice(p.symbol, price) + '</strong> <span class="' + pnlClass(chg) + '">' + signed(chg.toFixed(2), '%') + '</span></div>' +
        '</div>';
    });
    html += '</div>';
    $('pageView').innerHTML = html;
  }

  function renderHotView() {
    const period = state.hotPeriod || 'today';
    const hot = MD.getHotRanking(period);
    const periods = ['today', 'week', 'month', '3month'];
    let html = pageHeader(t('hot.title'), t('hot.subtitle'));
    html += '<div class="period-tabs" id="hotPeriods">' + periods.map(function (p) {
      return '<button class="period-tab' + (period === p ? ' active' : '') + '" data-period="' + p + '">' + esc(t('hot.' + p)) + '</button>';
    }).join('') + '</div>';
    html += '<div class="panel" style="overflow:hidden;"><table class="hot-table"><thead><tr>' +
      '<th style="width:52px;">#</th><th>' + esc(t('holdings.symbol')) + '</th><th></th><th>' + esc(t('type.stock')) + '</th>' +
      '<th class="num">' + esc(t('holdings.price')) + '</th><th class="num">' + esc(t('hot.turnover')) + '</th></tr></thead><tbody>';
    hot.forEach(function (it, i) {
      const a = MD.getAsset(it.symbol);
      const nm = L() === 'zh-TW' ? it.nameZh : it.name;
      html += '<tr data-symbol="' + esc(it.symbol) + '"><td>' + (i + 1) + '</td>' +
        '<td><strong>' + esc(it.symbol) + '</strong></td><td class="c-muted">' + esc(nm) + '</td>' +
        '<td>' + esc(t('type.' + it.type)) + '</td>' +
        '<td class="num">' + it.price.toFixed(it.decimals) + '</td>' +
        '<td class="num">' + fmtLarge(it.turnover, it.currency) + '</td></tr>';
    });
    html += '</tbody></table></div>';
    $('pageView').innerHTML = html;
    document.querySelectorAll('#hotPeriods .period-tab').forEach(function (el) {
      el.addEventListener('click', function () { state.hotPeriod = el.getAttribute('data-period'); renderHotView(); });
    });
  }

  function renderPortfolioView() {
    const ports = MD.getPortfolios();
    const palette = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#e5484d', '#8b5cf6'];
    let html = pageHeader(t('portfolio.title'), t('portfolio.subtitle'));
    html += '<div class="portfolio-grid">';
    ports.forEach(function (pf) {
      const name = L() === 'zh-TW' ? pf.nameZh : pf.name;
      const author = L() === 'zh-TW' ? pf.authorZh : pf.author;
      const note = L() === 'zh-TW' ? pf.noteZh : pf.noteEn;
      html += '<div class="portfolio-card">' +
        '<div class="portfolio-head"><span class="portfolio-name">' + esc(name) + '</span><span class="portfolio-tag">' + esc(pf.tag) + '</span></div>' +
        '<div class="portfolio-author">' + esc(author) + '</div>' +
        '<div class="portfolio-meta"><span>' + (L() === 'zh-TW' ? '風險' : 'Risk') + ': ' + esc(pf.risk) + '</span><span>' + (L() === 'zh-TW' ? '參考年化' : 'Est. annual') + ': ' + pf.ret.toFixed(1) + '%</span></div>' +
        '<div class="portfolio-pie">' +
        '<div class="donut" style="background:' + donutGradient(pf.allocation.map(function (x) { return x.pct; }), palette) + ';"><div class="donut-hole">' + (L() === 'zh-TW' ? '配置' : 'Alloc') + '</div></div>' +
        '<div class="alloc-legend alloc-legend-col">' + pf.allocation.map(function (al, i) {
          const lb = L() === 'zh-TW' ? al.labelZh : al.label;
          return '<span class="alloc-legend-item" data-symbol="' + esc(al.symbol) + '" style="cursor:pointer;"><span class="alloc-dot" style="background:' + palette[i % palette.length] + ';"></span>' + esc(lb) + ' · ' + esc(al.symbol) + ' <strong>' + (al.pct * 100).toFixed(0) + '%</strong></span>';
        }).join('') + '</div>' +
        '</div>' +
        '<div class="portfolio-note">' + esc(note) + '</div>' +
        '<button class="btn btn-primary btn-block" data-apply="' + esc(pf.id) + '">' + esc(t('portfolio.apply')) + '</button>' +
        '</div>';
    });
    html += '</div>';
    $('pageView').innerHTML = html;
    document.querySelectorAll('[data-apply]').forEach(function (el) {
      el.addEventListener('click', function () { openApplyPortfolio(el.getAttribute('data-apply')); });
    });
  }

  /* ---------------------- Apply portfolio (one-click) ----------------- */
  function openApplyPortfolio(id) {
    const pf = MD.getPortfolios().find(function (p) { return p.id === id; });
    const sim = Store.getSelected();
    if (!pf) return;
    if (!sim) { toast(t('sim.noData')); return; }
    const summary = Store.getAccountSummary(sim);
    const totalBudget = Math.max(0, summary.buyingPower);
    function calcQty(sym, cur, budget, pct) {
      const px = MD.getPrice(sym) || 0;
      const basePx = MD.convertToBase(px, cur, sim.baseCurrency);
      return basePx > 0 ? Math.floor((budget * pct) / basePx) : 0;
    }
    let rows = '';
    pf.allocation.forEach(function (al) {
      const a = MD.getAsset(al.symbol);
      if (!a) return;
      const qty0 = calcQty(al.symbol, a.currency, totalBudget, al.pct);
      const nm = L() === 'zh-TW' ? a.nameZh : a.name;
      const lb = L() === 'zh-TW' ? al.labelZh : al.label;
      rows += '<div class="apply-row" data-symbol="' + esc(al.symbol) + '" data-currency="' + a.currency + '">' +
        '<span class="ar-label">' + esc(lb) + ' · ' + esc(al.symbol) + '</span>' +
        '<span class="c-muted">' + (al.pct * 100).toFixed(0) + '%</span>' +
        '<input class="ar-qty" type="number" min="0" step="1" value="' + qty0 + '" />' +
        '</div>';
    });
    showModal(t('portfolio.applyTitle'),
      '<div class="auth-field"><label>' + esc(t('portfolio.totalBudget')) + ' (' + sim.baseCurrency + ')</label><input id="applyBudget" type="number" value="' + Math.floor(totalBudget) + '" /></div>' +
      '<div style="margin:8px 0;font-size:12px;color:var(--text-3);">' + esc(t('portfolio.component')) + '</div>' +
      rows +
      '<div class="auth-msg" id="applyMsg"></div>' +
      '<div class="form-actions"><button class="btn btn-ghost" id="btnApplyCancel">' + esc(t('common.cancel')) + '</button>' +
      '<button class="btn btn-primary" id="btnApplyConfirm">' + esc(t('portfolio.confirmApply')) + '</button></div>');
    $('btnApplyCancel').addEventListener('click', closeModal);
    $('applyBudget').addEventListener('input', function () {
      const budget = Number(this.value) || 0;
      document.querySelectorAll('.apply-row').forEach(function (row) {
        const sym = row.getAttribute('data-symbol');
        const cur = row.getAttribute('data-currency');
        const al = pf.allocation.find(function (x) { return x.symbol === sym; });
        row.querySelector('.ar-qty').value = calcQty(sym, cur, budget, al ? al.pct : 0);
      });
    });
    $('btnApplyConfirm').addEventListener('click', function () {
      let applied = 0, failed = 0;
      document.querySelectorAll('.apply-row').forEach(function (row) {
        const sym = row.getAttribute('data-symbol');
        const qty = Number(row.querySelector('.ar-qty').value) || 0;
        if (qty <= 0) return;
        const px = MD.getPrice(sym) || 0;
        const res = Store.buy(sim, sym, qty, px);
        if (res.ok) applied++; else failed++;
      });
      Store.snapshotEquity(sim, true);
      renderAccount(); renderHoldings(); renderShorts(); renderTransactions();
      closeModal();
      if (failed) toast(t('portfolio.applyPartial'));
      else toast(t('portfolio.applySuccess'));
    });
  }

  function renderFxCryptoView() {
    const fx = MD.ASSETS.filter(function (a) { return a.market === 'FX'; });
    const crypto = MD.ASSETS.filter(function (a) { return a.market === 'CRYPTO'; });
    function table(items) {
      let h = '<div class="panel" style="overflow:hidden;"><table class="hot-table"><thead><tr>' +
        '<th>' + esc(t('holdings.symbol')) + '</th><th></th>' +
        '<th class="num">' + esc(t('holdings.price')) + '</th><th class="num">' + esc(L() === 'zh-TW' ? '今日漲跌' : 'Daily change') + '</th></tr></thead><tbody>';
      items.forEach(function (a) {
        const p = MD.getPrice(a.symbol);
        const chg = MD.getTodayChangePct(a.symbol);
        const nm = L() === 'zh-TW' ? a.nameZh : a.name;
        h += '<tr data-symbol="' + esc(a.symbol) + '"><td><strong>' + esc(a.symbol) + '</strong></td><td class="c-muted">' + esc(nm) + '</td>' +
          '<td class="num">' + fmtPrice(a.symbol, p) + '</td>' +
          '<td class="num ' + pnlClass(chg) + '">' + signed(chg.toFixed(2), '%') + '</td></tr>';
      });
      return h + '</tbody></table></div>';
    }
    let html = pageHeader(t('fxcrypto.title'), t('fxcrypto.subtitle'));
    html += sectionTitle(t('watchlist.fx'));
    html += table(fx);
    html += sectionTitle(t('watchlist.crypto'));
    html += table(crypto);
    $('pageView').innerHTML = html;
  }

  /* --------------------------- Auth --------------------------- */
  async function initAuth() {
    if (!Cloud.ready()) return; // SDK lazy-loads; restore only if already present
    const u = await Cloud.getUser();
    if (u) { Cloud.setCurrentUser(u); updateUserButton(u); }
  }

  function maskEmail(e) { return e ? e.replace(/^(.{2})[^@]*(@.*)$/, '$1***$2') : ''; }
  function getNickname() {
    const saved = localStorage.getItem('pt_nickname');
    if (saved) return saved;
    const u = Cloud.getCurrentUser();
    if (u && u.email) return maskEmail(u.email);
    return L() === 'zh-TW' ? '投資者' : 'Investor';
  }

  function updateUserButton(u) {
    const btn = $('btnUser');
    if (u) {
      btn.textContent = getNickname();
      btn.title = u.email || '';
      btn.classList.add('logged');
    } else {
      btn.textContent = t('auth.login');
      btn.classList.remove('logged');
    }
  }

  // Shown when the page is served from a domain the cloud backend is not bound to
  // (e.g. a GitHub Pages mirror): auth/DB calls would be rejected by Origin check.
  function cloudBlockedPanel() {
    return '<div class="panel" style="padding:24px;">' +
      '<div style="margin-bottom:8px;font-weight:600;">' + esc(t('auth.cloudBlocked')) + '</div>' +
      '<div style="color:var(--text-2);font-size:13px;line-height:1.65;">' + esc(t('auth.cloudBlockedHint', { domain: Cloud.boundHost() })) + '</div>' +
      '</div>';
  }

  async function openAuthModal() {
    if (!Cloud.originAllowed()) {
      showModal(t('auth.title'),
        cloudBlockedPanel() +
        '<div class="form-actions"><button class="btn btn-primary" id="btnBlockedOk">' + esc(t('common.close')) + '</button></div>');
      $('btnBlockedOk').addEventListener('click', closeModal);
      return;
    }
    const ok = await Cloud.ensureReady();
    if (!ok) { toast(t('auth.signInFirst')); return; }
    if (Cloud.getCurrentUser()) {
      showModal(t('auth.title'),
        '<div style="margin-bottom:12px;">' + esc(t('auth.loggedInAs')) + ': <strong>' + esc(getNickname()) + '</strong></div>' +
        '<div class="form-actions"><button class="btn btn-ghost" id="btnAuthCancel">' + esc(t('common.cancel')) + '</button>' +
        '<button class="btn btn-danger" id="btnLogout">' + esc(t('auth.logout')) + '</button></div>');
      $('btnAuthCancel').addEventListener('click', closeModal);
      $('btnLogout').addEventListener('click', async function () {
        await Cloud.signOut(); Cloud.setCurrentUser(null); updateUserButton(null);
        closeModal(); toast(t('auth.logout'));
      });
      return;
    }
    showModal(t('auth.title'),
      '<div class="auth-tabs"><button class="auth-tab active" data-authtab="login">' + esc(t('auth.login')) + '</button>' +
      '<button class="auth-tab" data-authtab="signup">' + esc(t('auth.signup')) + '</button></div>' +
      '<div id="authLoginForm">' +
      '<div class="auth-field"><label>' + esc(t('auth.email')) + '</label><input id="authEmail" type="email" placeholder="' + esc(t('auth.emailPlaceholder')) + '" /></div>' +
      '<div class="auth-field"><label>' + esc(t('auth.password')) + '</label><input id="authPassword" type="password" placeholder="' + esc(t('auth.passwordPlaceholder')) + '" /></div>' +
      '<div class="auth-msg" id="authMsg"></div>' +
      '<button class="btn btn-primary btn-block" id="btnDoLogin">' + esc(t('auth.login')) + '</button>' +
      '</div>' +
      '<div id="authSignupForm" style="display:none;">' +
      '<div class="auth-field"><label>' + esc(t('auth.username')) + '</label><input id="authUsername" placeholder="' + esc(t('auth.usernamePlaceholder')) + '" /></div>' +
      '<div class="auth-field"><label>' + esc(t('auth.email')) + '</label><input id="authEmail2" type="email" placeholder="' + esc(t('auth.emailPlaceholder')) + '" /></div>' +
      '<div class="auth-field"><label>' + esc(t('auth.password')) + '</label><input id="authPassword2" type="password" placeholder="' + esc(t('auth.passwordPlaceholder')) + '" /></div>' +
      '<div class="auth-field"><label>' + esc(t('auth.code')) + '</label><div style="display:flex;gap:8px;"><input id="authCode" placeholder="••••••" /><button type="button" class="btn btn-ghost" id="btnSendCode" style="white-space:nowrap;">' + esc(t('auth.getCode')) + '</button></div></div>' +
      '<div class="auth-msg" id="authMsg2"></div>' +
      '<button class="btn btn-primary btn-block" id="btnDoSignup">' + esc(t('auth.signup')) + '</button>' +
      '</div>' +
      '<div class="auth-hint">' + esc(t('auth.noPhone')) + '</div>');

    document.querySelectorAll('.auth-tab').forEach(function (el) {
      el.addEventListener('click', function () {
        const tab = el.getAttribute('data-authtab');
        document.querySelectorAll('.auth-tab').forEach(function (b) { b.className = 'auth-tab' + (b === el ? ' active' : ''); });
        $('authLoginForm').style.display = tab === 'login' ? '' : 'none';
        $('authSignupForm').style.display = tab === 'signup' ? '' : 'none';
      });
    });
    $('btnDoLogin').addEventListener('click', doPasswordLogin);
    $('btnDoSignup').addEventListener('click', doSignup);
    $('btnSendCode').addEventListener('click', sendEmailCodeHandler);
  }

  function isValidEmail(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }

  async function sendEmailCodeHandler() {
    const email = $('authEmail2').value.trim();
    const msg = $('authMsg2');
    if (!isValidEmail(email)) { msg.className = 'auth-msg err'; msg.textContent = t('auth.invalidEmail'); return; }
    msg.className = 'auth-msg'; msg.textContent = '';
    const sent = await Cloud.sendEmailCode(email);
    if (sent.error) { msg.className = 'auth-msg err'; msg.textContent = sent.error.message || 'send failed'; return; }
    state.pendingOtp = { email: email, verificationId: sent.data.verificationId, isExistingUser: sent.data.isExistingUser };
    msg.className = 'auth-msg ok'; msg.textContent = t('auth.sendSuccess');
  }

  async function doPasswordLogin() {
    const msg = $('authMsg');
    const email = $('authEmail').value.trim();
    const password = $('authPassword').value;
    if (!isValidEmail(email)) { msg.className = 'auth-msg err'; msg.textContent = t('auth.invalidEmail'); return; }
    if (!password) { msg.className = 'auth-msg err'; msg.textContent = t('auth.needPassword'); return; }
    const res = await Cloud.signInWithPassword(email, password);
    if (res.error) { msg.className = 'auth-msg err'; msg.textContent = res.error.message || 'login failed'; return; }
    afterAuthSuccess();
  }

  async function doSignup() {
    const msg = $('authMsg2');
    const email = $('authEmail2').value.trim();
    const password = $('authPassword2').value;
    const code = $('authCode').value.trim();
    const username = $('authUsername').value.trim();
    if (!state.pendingOtp || state.pendingOtp.email !== email) { msg.className = 'auth-msg err'; msg.textContent = t('auth.needCode'); return; }
    const res = await Cloud.verifyEmailOtp(state.pendingOtp.email, state.pendingOtp.verificationId, state.pendingOtp.isExistingUser, code, password);
    if (res.error) { msg.className = 'auth-msg err'; msg.textContent = res.error.message || 'verify failed'; return; }
    if (username) localStorage.setItem('pt_nickname', username);
    state.pendingOtp = null;
    afterAuthSuccess();
  }

  async function afterAuthSuccess() {
    const u = await Cloud.getUser();
    Cloud.setCurrentUser(u); updateUserButton(u);
    closeModal(); toast(t('auth.loginSuccess'));
    syncMyRanking();
    if (state.currentView === 'competition') renderCompetitionView();
  }

  /* --------------------- Ranking sync & leaderboard ----------------- */
  async function syncMyRanking() {
    const u = Cloud.getCurrentUser();
    if (!u) return false;
    const sim = Store.getSelected();
    if (!sim) return false;
    const summary = Store.getAccountSummary(sim);
    const payload = {
      nickname: getNickname(),
      totalReturn: +summary.totalReturn.toFixed(4),
      rToday: +Store.getPeriodReturn(sim, 86400000).toFixed(4),
      rWeek: +Store.getPeriodReturn(sim, 7 * 86400000).toFixed(4),
      rMonth: +Store.getPeriodReturn(sim, 30 * 86400000).toFixed(4),
      r3month: +Store.getPeriodReturn(sim, 90 * 86400000).toFixed(4),
      rYear: +Store.getPeriodReturn(sim, 365 * 86400000).toFixed(4),
      totalAssets: +summary.totalAssets.toFixed(2),
      currency: sim.baseCurrency,
    };
    return await Cloud.syncRanking(payload);
  }

  function rankBadge(n) {
    const cls = n === 1 ? 'rank-1' : (n === 2 ? 'rank-2' : (n === 3 ? 'rank-3' : 'rank-n'));
    return '<span class="rank-badge ' + cls + '">' + n + '</span>';
  }

  async function renderCompetitionView() {
    $('pageView').innerHTML = pageHeader(t('nav.competition'), t('leaderboard.hint')) + '<div class="empty-state">…</div>';
    let u = Cloud.getCurrentUser();
    if (!u && !state._authRestoreTried) {
      state._authRestoreTried = true;
      const ok = await Cloud.ensureReady();
      if (ok) {
        const restored = await Cloud.getUser();
        if (restored) { Cloud.setCurrentUser(restored); updateUserButton(restored); u = restored; }
      }
    }
    let html = pageHeader(t('nav.competition'), t('leaderboard.hint'));
    if (!Cloud.originAllowed()) {
      $('pageView').innerHTML = html + cloudBlockedPanel();
      return;
    }
    if (!u) {
      html += '<div class="panel" style="padding:34px;text-align:center;"><div style="margin-bottom:14px;color:var(--text-2);">' + esc(t('auth.signInFirst')) + '</div>' +
        '<button class="btn btn-primary" id="btnGoLogin">' + esc(t('auth.login')) + '</button></div>';
      $('pageView').innerHTML = html;
      $('btnGoLogin').addEventListener('click', openAuthModal);
      return;
    }
    const periods = ['today', 'week', 'month', '3month', 'year'];
    html += '<div class="comp-grid">';
    html += '<div class="comp-panel"><h3>' + esc(t('leaderboard.title')) + '</h3>' +
      '<div class="period-tabs" id="lbPeriods">' + periods.map(function (p) {
        return '<button class="period-tab' + (state.leaderboardPeriod === p ? ' active' : '') + '" data-period="' + p + '">' + esc(t('leaderboard.period.' + p)) + '</button>';
      }).join('') + '</div>' +
      '<div id="lbContent" class="c-muted" style="padding:8px 0;">' + esc(t('leaderboard.noData')) + '</div>' +
      '<button class="btn btn-ghost btn-block" id="btnSyncRank" style="margin-top:8px;">' + esc(t('leaderboard.sync')) + '</button>' +
      '</div>';
    html += renderRoomsPanel();
    html += '</div>';
    $('pageView').innerHTML = html;

    document.querySelectorAll('#lbPeriods .period-tab').forEach(function (el) {
      el.addEventListener('click', function () { state.leaderboardPeriod = el.getAttribute('data-period'); renderCompetitionView(); });
    });
    $('btnSyncRank').addEventListener('click', async function () { await syncMyRanking(); toast(t('leaderboard.synced')); loadLeaderboard(); });
    bindRoomsEvents();
    loadLeaderboard();
    loadMyRooms();
  }

  async function loadLeaderboard() {
    const host = $('lbContent');
    if (!host) return;
    const rows = await Cloud.fetchRankings();
    const u = Cloud.getCurrentUser();
    const myId = u ? u.id : null;
    const key = { today: 'r_today', week: 'r_week', month: 'r_month', '3month': 'r_3month', year: 'r_year' }[state.leaderboardPeriod];
    const sorted = rows.slice().sort(function (a, b) { return (b[key] || 0) - (a[key] || 0); });
    const top50 = sorted.slice(0, 50);
    let myRank = -1;
    sorted.forEach(function (r, i) { if (myId && r.owner_id === myId) myRank = i + 1; });
    if (!top50.length) { host.innerHTML = '<div class="empty-state">' + esc(t('leaderboard.noData')) + '</div>'; return; }
    let html = '';
    if (myRank > 0) html += '<div style="padding:6px 2px;font-size:12px;">' + esc(t('leaderboard.me')) + ': <strong>#' + myRank + '</strong></div>';
    html += '<table class="hot-table"><thead><tr><th style="width:46px;">' + esc(t('leaderboard.rank')) + '</th><th>' + esc(t('leaderboard.user')) + '</th><th class="num">' + esc(t('leaderboard.return')) + '</th><th class="num">' + esc(t('leaderboard.assets')) + '</th></tr></thead><tbody>';
    top50.forEach(function (r, i) {
      const isMe = myId && r.owner_id === myId;
      const cur = r.currency || 'HKD';
      const ret = r[key] || 0;
      html += '<tr class="' + (isMe ? 'me-row' : '') + '"><td>' + rankBadge(i + 1) + '</td><td>' + esc(r.nickname || '—') + (isMe ? ' <span class="c-muted">(' + esc(t('leaderboard.me')) + ')</span>' : '') + '</td>' +
        '<td class="num ' + pnlClass(ret) + '">' + signed(Number(ret).toFixed(2), '%') + '</td>' +
        '<td class="num">' + fmtMoney(Number(r.total_assets) || 0, cur) + '</td></tr>';
    });
    html += '</tbody></table>';
    host.innerHTML = html;
  }

  /* --------------------------- Rooms --------------------------- */
  function renderRoomsPanel() {
    return '<div class="comp-panel"><h3>' + esc(t('room.yourRooms')) + '</h3>' +
      '<div class="auth-field"><label>' + esc(t('room.name')) + '</label><input id="roomName" placeholder="' + esc(t('room.name')) + '" /></div>' +
      '<button class="btn btn-primary btn-block" id="btnCreateRoom">' + esc(t('room.createBtn')) + '</button>' +
      '<div style="margin-top:16px;font-size:12px;color:var(--text-3);">' + esc(t('room.joinHint')) + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:6px;"><input id="roomCode" placeholder="' + esc(t('room.code')) + '" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;" /><button class="btn btn-ghost" id="btnJoinRoom">' + esc(t('room.joinBtn')) + '</button></div>' +
      '<div class="auth-msg" id="roomMsg"></div>' +
      '<div id="roomList" style="margin-top:12px;"></div></div>';
  }

  function bindRoomsEvents() {
    const c = $('btnCreateRoom');
    if (c) c.addEventListener('click', createRoomFlow);
    const j = $('btnJoinRoom');
    if (j) j.addEventListener('click', joinRoomFlow);
  }

  async function createRoomFlow() {
    const msg = $('roomMsg');
    const name = $('roomName').value.trim() || getNickname() + ' 的房間';
    const sim = Store.getSelected();
    const res = await Cloud.createRoom(name, sim ? sim.baseCurrency : 'HKD', sim ? sim.startingCapital : 100000);
    if (res.error) { msg.className = 'auth-msg err'; msg.textContent = res.error.message; return; }
    // creator auto-joins
    await Cloud.joinRoom(res.code, getNickname(), +Store.getAccountSummary(sim).totalReturn.toFixed(4), +Store.getAccountSummary(sim).totalAssets.toFixed(2));
    msg.className = 'auth-msg ok'; msg.textContent = t('room.createSuccess') + ': ' + res.code;
    toast(t('room.createSuccess'));
    loadMyRooms();
  }

  async function joinRoomFlow() {
    const msg = $('roomMsg');
    const code = $('roomCode').value.trim().toUpperCase();
    if (!code) return;
    const room = await Cloud.findRoomByCode(code);
    if (!room) { msg.className = 'auth-msg err'; msg.textContent = '無效的邀請碼'; return; }
    const sim = Store.getSelected();
    const res = await Cloud.joinRoom(code, getNickname(), +Store.getAccountSummary(sim).totalReturn.toFixed(4), +Store.getAccountSummary(sim).totalAssets.toFixed(2));
    if (res.error) { msg.className = 'auth-msg err'; msg.textContent = res.error.message; return; }
    msg.className = 'auth-msg ok'; msg.textContent = t('room.joinSuccess');
    toast(t('room.joinSuccess'));
    loadMyRooms();
  }

  async function loadMyRooms() {
    const host = $('roomList');
    if (!host) return;
    const u = Cloud.getCurrentUser();
    if (!u) return;
    const rooms = await Cloud.listMyRooms();
    let myRoomIds = {};
    const cloud = Cloud.getCloud();
    if (cloud) {
      const { data } = await cloud.database.from('room_members').select('room_id').eq('owner_id', u.id);
      (data || []).forEach(function (r) { myRoomIds[r.room_id] = true; });
    }
    const mine = rooms.filter(function (r) { return r.owner_id === u.id || myRoomIds[r.id]; });
    if (!mine.length) { host.innerHTML = '<div class="empty-state">' + esc(t('room.empty')) + '</div>'; return; }
    let html = '';
    mine.forEach(function (r) {
      html += '<div class="room-card"><div style="display:flex;align-items:center;gap:8px;"><strong>' + esc(r.name) + '</strong>' +
        '<span class="room-code">' + esc(r.code) + '</span>' +
        '<button class="btn btn-sm btn-ghost" data-copy="' + esc(r.code) + '">' + esc(t('room.copy')) + '</button>' +
        '<button class="btn btn-sm btn-ghost" data-roomview="' + r.id + '" style="margin-left:auto;">' + esc(t('room.members')) + '</button></div></div>';
    });
    host.innerHTML = html;
    host.querySelectorAll('[data-copy]').forEach(function (el) {
      el.addEventListener('click', function () { navigator.clipboard.writeText(el.getAttribute('data-copy')); toast(t('room.copied')); });
    });
    host.querySelectorAll('[data-roomview]').forEach(function (el) {
      el.addEventListener('click', function () { viewRoom(el.getAttribute('data-roomview')); });
    });
  }

  async function viewRoom(roomId) {
    const members = await Cloud.listRoomMembers(roomId);
    const u = Cloud.getCurrentUser();
    const myId = u ? u.id : null;
    let html = '<table class="hot-table"><thead><tr><th style="width:46px;">' + esc(t('leaderboard.rank')) + '</th><th>' + esc(t('leaderboard.user')) + '</th><th class="num">' + esc(t('leaderboard.return')) + '</th><th class="num">' + esc(t('leaderboard.assets')) + '</th></tr></thead><tbody>';
    members.forEach(function (m, i) {
      const isMe = myId && m.owner_id === myId;
      html += '<tr class="' + (isMe ? 'me-row' : '') + '"><td>' + rankBadge(i + 1) + '</td><td>' + esc(m.nickname || '—') + '</td>' +
        '<td class="num ' + pnlClass(m.total_return) + '">' + signed(Number(m.total_return).toFixed(2), '%') + '</td>' +
        '<td class="num">' + fmtMoney(Number(m.total_assets) || 0, 'HKD') + '</td></tr>';
    });
    html += '</tbody></table>';
    if (!members.length) html = '<div class="empty-state">' + esc(t('leaderboard.noData')) + '</div>';
    showModal(t('room.members'), html);
  }

  /* --------------------------- Boot --------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
