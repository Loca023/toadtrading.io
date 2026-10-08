/* =====================================================================
 * store.js — Persistence, simulation CRUD & the paper-trading engine
 *             (long, short, margin/leverage, deposits, bankruptcy, report)
 * ===================================================================== */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'paper_trading_sim.v1';
  const MD = global.MarketData;
  const MAX_LEVERAGE = 2.0; // default max leverage (200%)

  const state = {
    simulations: [],
    selectedId: null,
    language: 'zh-TW',
  };

  /* ------------------------- Persistence --------------------------- */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state.simulations = parsed.simulations || [];
        state.selectedId = parsed.selectedId || null;
        state.language = parsed.language || 'zh-TW';
      }
    } catch (e) {
      state.simulations = [];
    }
    // Migrate legacy sims: ensure new fields exist.
    state.simulations.forEach(function (s) {
      if (!s.shorts) s.shorts = {};
      if (s.maxLeverage == null) s.maxLeverage = MAX_LEVERAGE;
      if (s.bankrupt == null) s.bankrupt = false;
      if (s.peakNav == null) s.peakNav = s.startingCapital;
      if (s.maxDrawdown == null) s.maxDrawdown = 0;
      if (s.maxLeverageUsed == null) s.maxLeverageUsed = 0;
    });
    if (state.simulations.length) {
      state.selectedId = state.selectedId && findSim(state.selectedId) ? state.selectedId : state.simulations[0].id;
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        simulations: state.simulations,
        selectedId: state.selectedId,
        language: state.language,
      }));
    } catch (e) { /* storage full or unavailable */ }
  }

  /* ---------------------------- Helpers ---------------------------- */
  function findSim(id) {
    return state.simulations.find(function (s) { return s.id === id; }) || null;
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // Fixed HK$40 commission per trade (both buy and sell), converted to the
  // asset's own currency so it sits naturally in cost basis / transaction.
  function calcFee(currency) {
    return MD.baseToNative(40, currency, 'HKD');
  }

  /* ------------------------ Simulation CRUD ------------------------ */
  function listSimulations() { return state.simulations; }
  function getSelected() { return findSim(state.selectedId); }
  function selectSimulation(id) { if (findSim(id)) { state.selectedId = id; save(); } }
  function getLanguage() { return state.language; }
  function setLanguage(lang) { state.language = lang; save(); }

  function createSimulation(opts) {
    const cap = Number(opts.startingCapital) || 100000;
    const sim = {
      id: uid(),
      name: opts.name,
      playerName: opts.playerName || opts.name,
      baseCurrency: opts.baseCurrency || 'HKD',
      startingCapital: cap,
      startDate: opts.startDate || '',
      endDate: opts.endDate || '',
      cash: cap,
      holdings: {},   // long positions: symbol -> { qty, avgCost, currency, market }
      shorts: {},     // short positions: symbol -> { qty, avgPrice, fee, currency, market }
      deposits: [],
      transactions: [],
      realizedPnl: 0,
      maxLeverage: opts.maxLeverage || MAX_LEVERAGE,
      bankrupt: false,
      peakNav: cap,
      maxDrawdown: 0,
      maxLeverageUsed: 0,
      equityHistory: [{ t: Date.now(), nav: cap }],
      createdAt: Date.now(),
    };
    state.simulations.unshift(sim);
    state.selectedId = sim.id;
    save();
    return sim;
  }

  function deleteSimulation(id) {
    state.simulations = state.simulations.filter(function (s) { return s.id !== id; });
    if (state.selectedId === id) {
      state.selectedId = state.simulations.length ? state.simulations[0].id : null;
    }
    save();
  }

  function isEnded(sim) {
    if (sim.bankrupt) return true;
    if (!sim.endDate) return false;
    const end = new Date(sim.endDate + 'T23:59:59');
    return Date.now() > end.getTime();
  }

  /* ------------------------ Margin / NAV --------------------------- */
  function getMarginInfo(sim) {
    const base = sim.baseCurrency;
    let longValue = 0, shortValue = 0, depositsValue = 0;

    Object.keys(sim.holdings).forEach(function (sym) {
      const h = sim.holdings[sym];
      longValue += MD.convertToBase((MD.getPrice(sym) || 0) * h.qty, h.currency, base);
    });
    Object.keys(sim.shorts).forEach(function (sym) {
      const s = sim.shorts[sym];
      shortValue += MD.convertToBase((MD.getPrice(sym) || 0) * s.qty, s.currency, base);
    });
    sim.deposits.forEach(function (d) {
      depositsValue += MD.convertToBase(d.principal + accruedInterest(d), d.currency, base);
    });

    const nav = sim.cash + longValue + depositsValue - shortValue;
    const grossExposure = longValue + shortValue;
    const maxLev = sim.maxLeverage || MAX_LEVERAGE;
    const maxGross = Math.max(0, nav) * maxLev;
    const buyingPower = Math.max(0, maxGross - grossExposure);
    const leverage = nav > 0 ? grossExposure / nav : Infinity;

    return {
      nav: nav, longValue: longValue, shortValue: shortValue, depositsValue: depositsValue,
      grossExposure: grossExposure, buyingPower: buyingPower, leverage: leverage, maxLeverage: maxLev,
    };
  }

  function updateEquityStats(sim) {
    const mi = getMarginInfo(sim);
    const nav = mi.nav;
    if (nav > sim.peakNav) sim.peakNav = nav;
    if (sim.peakNav > 0) {
      const dd = (sim.peakNav - nav) / sim.peakNav;
      if (dd > sim.maxDrawdown) sim.maxDrawdown = dd;
    }
    if (mi.leverage !== Infinity && mi.leverage > sim.maxLeverageUsed) sim.maxLeverageUsed = mi.leverage;
    return mi;
  }

  function checkBankruptcy(sim) {
    const mi = getMarginInfo(sim);
    if (mi.nav <= 0) {
      sim.bankrupt = true;
      save();
    }
    return sim.bankrupt;
  }

  /* ----------------------- Equity history (period returns) --------- */
  function snapshotEquity(sim, force) {
    const mi = getMarginInfo(sim);
    const hist = sim.equityHistory || [];
    const now = Date.now();
    if (!force && hist.length && now - hist[hist.length - 1].t < 60000) return;
    hist.push({ t: now, nav: mi.nav });
    if (hist.length > 5000) hist.splice(0, hist.length - 5000);
    sim.equityHistory = hist;
  }

  function getPeriodReturn(sim, ms) {
    const hist = sim.equityHistory || [];
    const now = Date.now();
    const target = now - ms;
    let base = sim.startingCapital;
    for (let i = 0; i < hist.length; i++) {
      if (hist[i].t <= target) base = hist[i].nav;
      else break;
    }
    const mi = getMarginInfo(sim);
    if (base > 0) return (mi.nav - base) / base * 100;
    return 0;
  }

  /* ----------------------- Trading operations ---------------------- */
  function recordTx(sim, tx) {
    tx.id = uid();
    tx.ts = Date.now();
    sim.transactions.unshift(tx);
  }

  // Long buy (with margin buying power check)
  function buy(sim, symbol, qty, price) {
    const a = MD.getAsset(symbol);
    if (!a) return { ok: false, msg: 'invalid_symbol' };
    const qtyN = Number(qty);
    if (!qtyN || qtyN <= 0) return { ok: false, msg: 'order.invalidQty' };

    const notional = qtyN * price;
    const fee = calcFee(a.currency);
    const totalCost = notional + fee;
    const costBase = MD.convertToBase(totalCost, a.currency, sim.baseCurrency);

    const mi = getMarginInfo(sim);
    if (costBase > mi.buyingPower + 1e-9) return { ok: false, msg: 'order.insufficientBuyingPower' };

    const h = sim.holdings[symbol] || { qty: 0, avgCost: 0, currency: a.currency, market: a.market };
    const newQty = h.qty + qtyN;
    h.avgCost = (h.qty * h.avgCost + totalCost) / newQty;
    h.qty = newQty;
    sim.holdings[symbol] = h;
    sim.cash -= costBase; // can go negative → margin borrowed

    recordTx(sim, { type: 'BUY', symbol: symbol, name: a.name, qty: qtyN, price: price, amount: notional, fee: fee, currency: a.currency });
    updateEquityStats(sim);
    checkBankruptcy(sim);
    save();
    return { ok: true };
  }

  // Long sell (close / reduce)
  function sell(sim, symbol, qty, price) {
    const a = MD.getAsset(symbol);
    const h = sim.holdings[symbol];
    const qtyN = Number(qty);
    if (!a || !h) return { ok: false, msg: 'order.insufficientHoldings' };
    if (!qtyN || qtyN <= 0) return { ok: false, msg: 'order.invalidQty' };
    if (qtyN > h.qty + 1e-9) return { ok: false, msg: 'order.insufficientHoldings' };

    const notional = qtyN * price;
    const fee = calcFee(a.currency);
    const proceeds = notional - fee;
    const realized = proceeds - qtyN * h.avgCost;
    sim.realizedPnl += MD.convertToBase(realized, a.currency, sim.baseCurrency);
    sim.cash += MD.convertToBase(proceeds, a.currency, sim.baseCurrency);

    h.qty -= qtyN;
    if (h.qty <= 1e-9) delete sim.holdings[symbol];

    recordTx(sim, { type: 'SELL', symbol: symbol, name: a.name, qty: qtyN, price: price, amount: notional, fee: fee, currency: a.currency, pnl: MD.convertToBase(realized, a.currency, sim.baseCurrency) });
    updateEquityStats(sim);
    checkBankruptcy(sim);
    save();
    return { ok: true };
  }

  // Open short (sell borrowed shares)
  function openShort(sim, symbol, qty, price) {
    const a = MD.getAsset(symbol);
    if (!a) return { ok: false, msg: 'invalid_symbol' };
    const qtyN = Number(qty);
    if (!qtyN || qtyN <= 0) return { ok: false, msg: 'order.invalidQty' };

    const notional = qtyN * price;
    const fee = calcFee(a.currency);
    const proceeds = notional - fee;

    const mi = getMarginInfo(sim);
    const liabilityBase = MD.convertToBase(notional, a.currency, sim.baseCurrency);
    if (liabilityBase > mi.buyingPower + 1e-9) return { ok: false, msg: 'order.insufficientBuyingPower' };

    sim.cash += MD.convertToBase(proceeds, a.currency, sim.baseCurrency);

    const s = sim.shorts[symbol] || { qty: 0, avgPrice: 0, fee: 0, currency: a.currency, market: a.market };
    const newQty = s.qty + qtyN;
    s.avgPrice = (s.qty * s.avgPrice + qtyN * price) / newQty;
    s.fee += fee;
    s.qty = newQty;
    sim.shorts[symbol] = s;

    recordTx(sim, { type: 'SHORT', symbol: symbol, name: a.name, qty: qtyN, price: price, amount: notional, fee: fee, currency: a.currency });
    updateEquityStats(sim);
    checkBankruptcy(sim);
    save();
    return { ok: true };
  }

  // Close short (buy to cover)
  function closeShort(sim, symbol, qty, price) {
    const a = MD.getAsset(symbol);
    const s = sim.shorts[symbol];
    const qtyN = Number(qty);
    if (!a || !s) return { ok: false, msg: 'order.insufficientShort' };
    if (!qtyN || qtyN <= 0) return { ok: false, msg: 'order.invalidQty' };
    if (qtyN > s.qty + 1e-9) return { ok: false, msg: 'order.insufficientShort' };

    const notional = qtyN * price;
    const fee = calcFee(a.currency);
    const feePortion = s.fee * (qtyN / s.qty); // allocate open-side fee
    const realized = (s.avgPrice - price) * qtyN - feePortion - fee;

    sim.realizedPnl += MD.convertToBase(realized, a.currency, sim.baseCurrency);
    sim.cash -= MD.convertToBase(notional + fee, a.currency, sim.baseCurrency);

    s.qty -= qtyN;
    s.fee -= feePortion;
    if (s.qty <= 1e-9) delete sim.shorts[symbol];

    recordTx(sim, { type: 'COVER', symbol: symbol, name: a.name, qty: qtyN, price: price, amount: notional, fee: fee, currency: a.currency, pnl: MD.convertToBase(realized, a.currency, sim.baseCurrency) });
    updateEquityStats(sim);
    checkBankruptcy(sim);
    save();
    return { ok: true };
  }

  /* ----------------------- Deposit operations ---------------------- */
  function openDeposit(sim, depositId, principal) {
    const d = MD.getDeposit(depositId);
    const p = Number(principal);
    if (!d) return { ok: false, msg: 'order.invalidQty' };
    if (!p || p <= 0) return { ok: false, msg: 'order.invalidQty' };
    const costBase = MD.convertToBase(p, d.currency, sim.baseCurrency);
    if (costBase > sim.cash + 1e-9) return { ok: false, msg: 'deposit.insufficient' };

    sim.cash -= costBase;
    sim.deposits.push({
      id: uid(), depositId: depositId, principal: p, rate: d.rate,
      openAt: Date.now(), termDays: d.termDays, currency: d.currency,
      name: d.name, nameZh: d.nameZh, market: d.market,
    });
    recordTx(sim, { type: 'DEPOSIT', symbol: depositId, name: d.name, qty: 0, price: p, amount: p, fee: 0, currency: d.currency });
    save();
    return { ok: true };
  }

  function accruedInterest(dep) {
    const days = Math.max(0, (Date.now() - dep.openAt) / 86400000);
    return dep.principal * dep.rate * (days / 365);
  }

  function redeemDeposit(sim, depId) {
    const idx = sim.deposits.findIndex(function (d) { return d.id === depId; });
    if (idx < 0) return { ok: false, msg: 'order.invalidQty' };
    const dep = sim.deposits[idx];
    const interest = accruedInterest(dep);
    const total = dep.principal + interest;
    sim.cash += MD.convertToBase(total, dep.currency, sim.baseCurrency);
    sim.realizedPnl += MD.convertToBase(interest, dep.currency, sim.baseCurrency);
    sim.deposits.splice(idx, 1);
    recordTx(sim, { type: 'REDEEM', symbol: dep.depositId, name: dep.name, qty: 0, price: total, amount: total, fee: 0, currency: dep.currency });
    recordTx(sim, { type: 'INTEREST', symbol: dep.depositId, name: dep.name, qty: 0, price: interest, amount: interest, fee: 0, currency: dep.currency, pnl: MD.convertToBase(interest, dep.currency, sim.baseCurrency) });
    save();
    return { ok: true };
  }

  /* ----------------------- Account summary ------------------------- */
  function getAccountSummary(sim) {
    if (!sim) return null;
    const base = sim.baseCurrency;
    const mi = getMarginInfo(sim);
    let unrealized = 0, dayPnl = 0;

    Object.keys(sim.holdings).forEach(function (sym) {
      const h = sim.holdings[sym];
      const price = MD.getPrice(sym) || 0;
      const pc = MD.getPrevClose(sym) || price;
      unrealized += MD.convertToBase((price - h.avgCost) * h.qty, h.currency, base);
      dayPnl += MD.convertToBase((price - pc) * h.qty, h.currency, base);
    });
    Object.keys(sim.shorts).forEach(function (sym) {
      const s = sim.shorts[sym];
      const price = MD.getPrice(sym) || 0;
      const pc = MD.getPrevClose(sym) || price;
      unrealized += MD.convertToBase((s.avgPrice - price) * s.qty, s.currency, base);
      dayPnl += MD.convertToBase((pc - price) * s.qty, s.currency, base);
    });

    const totalAssets = mi.nav;
    const totalReturn = sim.startingCapital > 0
      ? ((totalAssets - sim.startingCapital) / sim.startingCapital) * 100
      : 0;

    return {
      cash: sim.cash,
      holdingsValue: mi.longValue,
      shortValue: mi.shortValue,
      depositsValue: mi.depositsValue,
      totalAssets: totalAssets,
      unrealized: unrealized,
      realized: sim.realizedPnl,
      dayPnl: dayPnl,
      totalReturn: totalReturn,
      nav: mi.nav,
      leverage: mi.leverage,
      buyingPower: mi.buyingPower,
      grossExposure: mi.grossExposure,
      maxLeverage: mi.maxLeverage,
    };
  }

  /* --------------------- Competition leaderboard ------------------- */
  function getLeaderboard() {
    return state.simulations.map(function (s) {
      const summary = getAccountSummary(s);
      return {
        id: s.id,
        name: s.name,
        playerName: s.playerName,
        baseCurrency: s.baseCurrency,
        startingCapital: s.startingCapital,
        totalAssets: summary.totalAssets,
        totalReturn: summary.totalReturn,
        dayPnl: summary.dayPnl,
        bankrupt: s.bankrupt,
        ended: isEnded(s),
      };
    }).sort(function (a, b) { return b.totalReturn - a.totalReturn; });
  }

  /* ----------------------- Performance report --------------------- */
  function getPerformanceReport(sim) {
    const summary = getAccountSummary(sim);
    const base = sim.baseCurrency;

    const closed = sim.transactions.filter(function (tx) { return tx.pnl != null; });
    const wins = closed.filter(function (tx) { return tx.pnl > 0; });
    const losses = closed.filter(function (tx) { return tx.pnl < 0; });
    const grossProfit = wins.reduce(function (s, tx) { return s + tx.pnl; }, 0);
    const grossLoss = Math.abs(losses.reduce(function (s, tx) { return s + tx.pnl; }, 0));
    const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;

    let best = null, worst = null;
    closed.forEach(function (tx) {
      if (!best || tx.pnl > best.pnl) best = tx;
      if (!worst || tx.pnl < worst.pnl) worst = tx;
    });

    const count = function (type) { return sim.transactions.filter(function (tx) { return tx.type === type; }).length; };
    const interestEarned = sim.transactions.filter(function (tx) { return tx.type === 'INTEREST'; })
      .reduce(function (s, tx) { return s + (tx.pnl || 0); }, 0);

    const days = Math.max(1, (Date.now() - sim.createdAt) / 86400000);
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);

    return {
      name: sim.name,
      playerName: sim.playerName,
      baseCurrency: base,
      startingCapital: sim.startingCapital,
      finalAssets: summary.totalAssets,
      totalReturn: summary.totalReturn,
      realized: summary.realized,
      unrealized: summary.unrealized,
      nav: summary.nav,
      peakNav: sim.peakNav,
      maxDrawdown: sim.maxDrawdown * 100,
      totalTrades: count('BUY') + count('SELL') + count('SHORT') + count('COVER'),
      buyCount: count('BUY'), sellCount: count('SELL'),
      shortCount: count('SHORT'), coverCount: count('COVER'),
      depositCount: count('DEPOSIT'),
      closedCount: closed.length,
      winRate: winRate,
      wins: wins.length,
      losses: losses.length,
      profitFactor: profitFactor,
      bestTrade: best,
      worstTrade: worst,
      interestEarned: interestEarned,
      maxLeverageUsed: sim.maxLeverageUsed,
      days: days,
      bankrupt: sim.bankrupt,
      ended: isEnded(sim),
    };
  }

  global.Store = {
    load: load,
    save: save,
    listSimulations: listSimulations,
    getSelected: getSelected,
    selectSimulation: selectSimulation,
    createSimulation: createSimulation,
    deleteSimulation: deleteSimulation,
    isEnded: isEnded,
    getLanguage: getLanguage,
    setLanguage: setLanguage,
    buy: buy,
    sell: sell,
    openShort: openShort,
    closeShort: closeShort,
    openDeposit: openDeposit,
    redeemDeposit: redeemDeposit,
    accruedInterest: accruedInterest,
    getMarginInfo: getMarginInfo,
    updateEquityStats: updateEquityStats,
    checkBankruptcy: checkBankruptcy,
    snapshotEquity: snapshotEquity,
    getPeriodReturn: getPeriodReturn,
    getAccountSummary: getAccountSummary,
    getLeaderboard: getLeaderboard,
    getPerformanceReport: getPerformanceReport,
    calcFee: calcFee,
    MAX_LEVERAGE: MAX_LEVERAGE,
  };
})(window);
