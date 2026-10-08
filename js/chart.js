/* =====================================================================
 * chart.js — Lightweight canvas price chart (no external dependencies)
 * Supports line + area, grid, axis labels, hover crosshair & tooltip.
 * ===================================================================== */
(function (global) {
  'use strict';

  const UP = '#e5484d';   // 漲 (red)  — Chinese market convention
  const DOWN = '#16a34a'; // 跌 (green)

  let state = null;

  function init(canvas) {
    state = { canvas: canvas, hover: null };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', function () { state.hover = null; render(); });
  }

  function onMove(e) {
    if (!state || !state.data) return;
    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    state.hover = x;
    render();
  }

  function setData(data, opts) {
    state.data = data;   // { points: [{t, price}], prevClose }
    state.opts = opts || {};
    render();
  }

  function render() {
    if (!state || !state.data || !state.data.points.length) return;
    const canvas = state.canvas;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (cssW === 0 || cssH === 0) return;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const pad = { top: 14, right: 58, bottom: 24, left: 10 };
    const plotW = cssW - pad.left - pad.right;
    const plotH = cssH - pad.top - pad.bottom;

    const pts = state.data.points;
    const prices = pts.map(function (p) { return p.price; });
    const min = Math.min.apply(null, prices);
    const max = Math.max.apply(null, prices);
    const range = (max - min) || 1;
    const yMin = min - range * 0.08;
    const yMax = max + range * 0.08;
    const ySpan = (yMax - yMin) || 1;

    const first = pts[0].price;
    const last = pts[pts.length - 1].price;
    const color = last >= first ? UP : DOWN;

    const dark = typeof document !== 'undefined' && document.body.classList.contains('dark');
    const GRID = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const AXIS = dark ? '#8a97aa' : '#94a3b8';
    const PRECLOSE = dark ? 'rgba(160,174,192,0.5)' : 'rgba(100,116,139,0.5)';
    const HOVER = dark ? 'rgba(226,232,240,0.95)' : 'rgba(15,23,42,0.9)';
    const HOVERTXT = dark ? '#0f172a' : '#fff';

    function xAt(i) { return pad.left + (pts.length === 1 ? 0 : (i / (pts.length - 1)) * plotW); }
    function yAt(v) { return pad.top + (1 - (v - yMin) / ySpan) * plotH; }

    // ---- grid + y labels (5 lines) ----
    ctx.font = '11px -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'middle';
    const gridLines = 5;
    for (let g = 0; g <= gridLines; g++) {
      const v = yMin + (ySpan * g) / gridLines;
      const y = yAt(v);
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      ctx.fillStyle = AXIS;
      ctx.textAlign = 'left';
      const label = formatY(v, last);
      ctx.fillText(label, pad.left + plotW + 6, y);
    }

    // ---- x labels ----
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = AXIS;
    const labelCount = 4;
    for (let g = 0; g <= labelCount; g++) {
      const i = Math.round((pts.length - 1) * (g / labelCount));
      const x = xAt(i);
      ctx.fillText(formatX(pts[i].t), x, pad.top + plotH + 6);
    }

    // ---- area fill ----
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    grad.addColorStop(0, hexToRgba(color, 0.18));
    grad.addColorStop(1, hexToRgba(color, 0.0));
    ctx.beginPath();
    ctx.moveTo(xAt(0), yAt(pts[0].price));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(xAt(i), yAt(pts[i].price));
    ctx.lineTo(xAt(pts.length - 1), pad.top + plotH);
    ctx.lineTo(xAt(0), pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // ---- line ----
    ctx.beginPath();
    ctx.moveTo(xAt(0), yAt(pts[0].price));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(xAt(i), yAt(pts[i].price));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // ---- prev close reference line ----
    const pc = state.data.prevClose;
    if (pc && pc >= yMin && pc <= yMax) {
      const y = yAt(pc);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = PRECLOSE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ---- hover crosshair + tooltip ----
    if (state.hover !== null) {
      const i = Math.max(0, Math.min(pts.length - 1, Math.round(((state.hover - pad.left) / plotW) * (pts.length - 1))));
      const x = xAt(i);
      const y = yAt(pts[i].price);
      ctx.strokeStyle = PRECLOSE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.stroke();

      // point dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // tooltip
      const tip = formatX(pts[i].t) + '  ' + formatY(pts[i].price, last);
      ctx.font = '11px -apple-system, "Segoe UI", Roboto, sans-serif';
      const tw = ctx.measureText(tip).width + 16;
      let tx = x + 10;
      if (tx + tw > cssW - 6) tx = x - tw - 10;
      const ty = Math.max(4, y - 22);
      ctx.fillStyle = HOVER;
      ctx.beginPath();
      roundRect(ctx, tx, ty, tw, 22, 6);
      ctx.fill();
      ctx.fillStyle = HOVERTXT;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(tip, tx + 8, ty + 11);
    }
  }

  function formatY(v, ref) {
    const abs = Math.abs(v);
    if (abs >= 10000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (abs >= 1000) return v.toFixed(1);
    if (abs >= 100) return v.toFixed(1);
    if (abs >= 1) return v.toFixed(2);
    return v.toFixed(3);
  }

  function formatX(t) {
    const d = new Date(t);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    }
    return (d.getMonth() + 1) + '/' + d.getDate() + '/' + String(d.getFullYear()).slice(2);
  }

  function hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  global.PriceChart = { init: init, setData: setData, render: render };
})(window);
