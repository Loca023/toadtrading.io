/* =====================================================================
 * cloud.js — WorkBuddy Cloud Service integration
 *             (auth, global leaderboard, private competition rooms)
 * ===================================================================== */
(function (global) {
  'use strict';

  let cloud = null;
  let user = null;
  let sdkPromise = null;

  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@tencent-ai/workbuddy-cloud-sdk@dev/lib/index.global.js';

  function init() {
    if (cloud) return cloud;
    if (typeof WorkBuddyCloud === 'undefined') return null;
    const cfg = global.PUBLIC_CONFIG || {};
    cloud = WorkBuddyCloud.createWorkBuddyCloud({
      endpoint: cfg.endpoint,
      oauthRelayBaseUrl: cfg.oauthRelayBaseUrl,
      publishableKey: cfg.publishableKey,
    });
    return cloud;
  }

  function ready() { return !!init(); }
  function getCloud() { return cloud; }

  // The cloud server enforces an exact Origin match, so accounts / database only
  // work when the page is served from this app's own reserved domain.
  // (e.g. a mirror deployed on GitHub Pages can trade, but cannot log in.)
  function originAllowed() {
    try {
      const cfg = global.PUBLIC_CONFIG || {};
      if (!cfg.endpoint) return false;
      return location.host === new URL(cfg.endpoint).host;
    } catch (e) { return false; }
  }

  // Human-readable host the cloud backend is bound to (for UI hints).
  function boundHost() {
    try {
      return new URL((global.PUBLIC_CONFIG || {}).endpoint).host;
    } catch (e) { return ''; }
  }

  // Lazily load the SDK (does not block page rendering). Resolves true/false.
  function ensureReady() {
    if (cloud) return Promise.resolve(true);
    if (typeof WorkBuddyCloud !== 'undefined') return Promise.resolve(!!init());
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise(function (resolve) {
      const s = document.createElement('script');
      s.src = SDK_URL;
      s.async = true;
      let done = false;
      function finish(ok) { if (!done) { done = true; resolve(ok); } }
      s.onload = function () { finish(!!init()); };
      s.onerror = function () { finish(false); };
      setTimeout(function () { finish(!!init()); }, 10000);
      document.head.appendChild(s);
    });
    return sdkPromise;
  }

  /* ------------------------------ Auth ------------------------------ */
  async function getUser() {
    if (!ready()) return null;
    try {
      const { data, error } = await cloud.auth.getUser();
      if (error || !data) { user = null; return null; }
      user = data;
      return data;
    } catch (e) { return null; }
  }

  function getCurrentUser() { return user; }
  function setCurrentUser(u) { user = u; }

  async function getSession() {
    if (!ready()) return null;
    const { data } = await cloud.auth.getSession();
    return data || null;
  }

  // Email OTP: send code
  async function sendEmailCode(email) {
    if (!ready()) return { error: { message: 'cloud unavailable' } };
    return await cloud.auth.sendOtp({ email });
  }
  // Email OTP: verify (login or new-signup with password)
  async function verifyEmailOtp(email, verificationId, isExistingUser, token, password) {
    if (!ready()) return { error: { message: 'cloud unavailable' } };
    return await cloud.auth.verifyOtp({ email, verificationId, isExistingUser, token, password: isExistingUser ? undefined : password });
  }
  // Email + password login
  async function signInWithPassword(email, password) {
    if (!ready()) return { error: { message: 'cloud unavailable' } };
    return await cloud.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    if (!ready()) return;
    await cloud.auth.signOut();
    user = null;
  }

  /* ---------------------- Global leaderboard ------------------------ */
  // Upsert this user's performance snapshot (one row per user).
  async function syncRanking(payload) {
    if (!ready()) return false;
    const { error } = await cloud.database.rpc('upsert_ranking', {
      p_nickname: payload.nickname,
      p_total_return: payload.totalReturn,
      p_r_today: payload.rToday,
      p_r_week: payload.rWeek,
      p_r_month: payload.rMonth,
      p_r_3month: payload.r3month,
      p_r_year: payload.rYear,
      p_total_assets: payload.totalAssets,
      p_currency: payload.currency,
    });
    return !error;
  }

  async function fetchRankings() {
    if (!ready()) return [];
    const { data, error } = await cloud.database
      .from('rankings')
      .select('*')
      .order('total_return', { ascending: false })
      .limit(200);
    return error ? [] : (data || []);
  }

  /* ---------------------- Competition rooms ------------------------- */
  async function createRoom(name, currency, startingCapital) {
    if (!ready()) return { error: { message: 'cloud unavailable' } };
    const code = generateCode();
    const { data, error } = await cloud.database
      .from('rooms')
      .insert({ name: name, code: code, currency: currency, starting_capital: startingCapital })
      .select();
    if (error) return { error: error };
    return { data: (data && data[0]) || null, code: code };
  }

  async function findRoomByCode(code) {
    if (!ready()) return null;
    const { data } = await cloud.database.from('rooms').select('*').eq('code', code).maybeSingle();
    return data || null;
  }

  async function joinRoom(roomCode, nickname, totalReturn, totalAssets) {
    if (!ready()) return { error: { message: 'cloud unavailable' } };
    return await cloud.database.rpc('upsert_room_member', {
      p_room_code: roomCode, p_nickname: nickname,
      p_total_return: totalReturn, p_total_assets: totalAssets,
    });
  }

  async function listMyRooms() {
    if (!ready()) return [];
    const { data, error } = await cloud.database.from('rooms').select('*').order('created_at', { ascending: false }).limit(50);
    return error ? [] : (data || []);
  }

  async function listRoomMembers(roomId) {
    if (!ready()) return [];
    const { data, error } = await cloud.database
      .from('room_members')
      .select('*')
      .eq('room_id', roomId)
      .order('total_return', { ascending: false })
      .limit(100);
    return error ? [] : (data || []);
  }

  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  global.Cloud = {
    init: init,
    ready: ready,
    ensureReady: ensureReady,
    getCloud: getCloud,
    originAllowed: originAllowed,
    boundHost: boundHost,
    getUser: getUser,
    getCurrentUser: getCurrentUser,
    setCurrentUser: setCurrentUser,
    getSession: getSession,
    sendEmailCode: sendEmailCode,
    verifyEmailOtp: verifyEmailOtp,
    signInWithPassword: signInWithPassword,
    signOut: signOut,
    syncRanking: syncRanking,
    fetchRankings: fetchRankings,
    createRoom: createRoom,
    findRoomByCode: findRoomByCode,
    joinRoom: joinRoom,
    listMyRooms: listMyRooms,
    listRoomMembers: listRoomMembers,
  };
})(window);
