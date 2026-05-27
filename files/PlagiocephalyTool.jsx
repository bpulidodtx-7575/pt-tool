// ─────────────────────────────────────────────────────────────────────────────
// CHOA Plagiocephaly Assessment Tool — v8.2
//
// Design: Plus Jakarta Sans + JetBrains Mono · oklch tokens · two-column grid ·
//   frosted appbar · 56px result number · tweaks panel · Therapedia brand integration
// Logic (v6): integer cross-multiplication, Number.isFinite() guards, null-return
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── Fonts: injected once at module level as <link> elements ─────────────────
// Avoids @import inside a React-rendered <style> (re-evaluated every render,
// blocks parallel loading, causes 3–30s timeout on hospital proxy firewalls).
if (typeof document !== "undefined") {
  [
    { rel:"preconnect", href:"https://fonts.googleapis.com" },
    { rel:"preconnect", href:"https://fonts.gstatic.com", crossOrigin:"anonymous" },
    { rel:"stylesheet", href:"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" },
  ].forEach(({ rel, href, crossOrigin }) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const el = document.createElement("link");
    el.rel = rel; el.href = href;
    if (crossOrigin) el.crossOrigin = crossOrigin;
    document.head.prepend(el);
  });
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
// Structure (order matters):
//   1. Hex fallback tokens — apply everywhere, always
//   2. @supports oklch — overrides tokens on capable browsers only
//   3. Global resets + layout — apply everywhere, always (NOT inside @supports)
const GLOBAL_CSS = `
  /* ── 1. Hex fallbacks — apply on ALL browsers ───────────────────────────────
     Without these, Safari ≤15.3 / Edge ≤110 / Android WebView ≤111 would
     inherit black/transparent surfaces because oklch resolves to invalid.     */
  :root {
    --font-sans:"Plus Jakarta Sans",ui-sans-serif,system-ui,-apple-system,sans-serif;
    --font-mono:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,monospace;
    --bg:#f9fafb; --surface:#ffffff; --surface-2:#f3f4f6; --surface-3:#e9eaec;
    --border:#dde0e6; --border-soft:#e8eaef;
    --ink:#1e2330; --ink-2:#414758; --ink-3:#666e85; --ink-4:#959daf;
    --accent-h:35;
    --accent:#d97757; --accent-soft:#fef3f0; --accent-strong:#c86245; --accent-ink:#8b3b2e;
    --sev-1:#2e8a50; --sev-2:#8a7200; --sev-3:#a06200; --sev-4:#c04020; --sev-5:#a02010;
    --shadow-card:0 1px 2px rgba(15,23,42,.04),0 4px 16px rgba(15,23,42,.04);
    --shadow-pop:0 4px 8px rgba(15,23,42,.06),0 16px 32px rgba(15,23,42,.08);
    --focus:0 0 0 3px rgba(217,119,87,.35);
    --r-sm:6px; --r-md:10px; --r-lg:14px; --r-pill:999px;
    --pad-card:28px; --gap-stack:20px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg:#111318; --surface:#1a1d24; --surface-2:#20242d; --surface-3:#272c37;
      --border:#333846; --border-soft:#2b3040;
      --ink:#f0f1f5; --ink-2:#c8ccd6; --ink-3:#8e95a8; --ink-4:#5a6070;
      --accent:#e89979; --accent-soft:#3d2420; --accent-strong:#f5a792; --accent-ink:#ffb9a1;
      --sev-1:#5ecc80; --sev-2:#d4b800; --sev-3:#d08000; --sev-4:#e06040; --sev-5:#d04030;
      --shadow-card:0 1px 3px rgba(0,0,0,.4),0 4px 20px rgba(0,0,0,.3);
      --focus:0 0 0 3px rgba(232,153,121,.45);
    }
  }

  /* ── 2. oklch overrides — only where color space is supported ───────────────
     Wrapping only the :root declarations keeps all layout/component CSS
     outside @supports so it always applies regardless of browser.             */
  @supports (color: oklch(0 0 0)) {
    :root {
      --bg:oklch(98.5% 0.003 230); --surface:oklch(100% 0 0);
      --surface-2:oklch(97% 0.004 230); --surface-3:oklch(94.5% 0.005 230);
      --border:oklch(92% 0.005 230); --border-soft:oklch(95% 0.004 230);
      --ink:oklch(22% 0.012 250); --ink-2:oklch(42% 0.012 250);
      --ink-3:oklch(58% 0.010 250); --ink-4:oklch(72% 0.008 250);
      --accent:oklch(60% 0.16 var(--accent-h)); --accent-soft:oklch(96% 0.03 var(--accent-h));
      --accent-strong:oklch(50% 0.17 var(--accent-h)); --accent-ink:oklch(32% 0.12 var(--accent-h));
      --sev-1:oklch(62% 0.13 155); --sev-2:oklch(70% 0.13 95); --sev-3:oklch(70% 0.14 65);
      --sev-4:oklch(63% 0.16 35);  --sev-5:oklch(55% 0.18 22);
      --focus:0 0 0 3px color-mix(in oklab,var(--accent) 35%,transparent);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg:oklch(14% 0.006 250); --surface:oklch(18% 0.007 250);
        --surface-2:oklch(22% 0.007 250); --surface-3:oklch(26% 0.008 250);
        --border:oklch(32% 0.008 250); --border-soft:oklch(28% 0.007 250);
        --ink:oklch(96% 0.004 240); --ink-2:oklch(80% 0.006 240);
        --ink-3:oklch(62% 0.007 240); --ink-4:oklch(46% 0.007 240);
        --accent:oklch(68% 0.18 var(--accent-h)); --accent-soft:oklch(24% 0.05 var(--accent-h));
        --accent-strong:oklch(74% 0.16 var(--accent-h)); --accent-ink:oklch(82% 0.12 var(--accent-h));
        --sev-1:oklch(78% 0.15 155); --sev-2:oklch(84% 0.14 95);
        --sev-3:oklch(82% 0.16 65);  --sev-4:oklch(76% 0.18 35);
        --sev-5:oklch(72% 0.20 22);
        --focus:0 0 0 3px color-mix(in oklab,var(--accent) 45%,transparent);
      }
    }
  }

  /* ── 3. Global resets — always apply regardless of color space support ───── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  [data-density="compact"] { --pad-card: 18px; --gap-stack: 14px; }

  html, body {
    background: var(--bg); color: var(--ink);
    font-family: var(--font-sans); font-size: 15px; line-height: 1.5;
    -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
    font-feature-settings: "ss01","cv11";
  }
  h1, h2, h3 { letter-spacing: -0.015em; font-weight: 600; }
  button { font-family: inherit; }
  a { color: var(--accent-strong); text-decoration: none; font-weight: 500; }
  a:hover { text-decoration: underline; }
  a:focus-visible { outline: none; box-shadow: var(--focus); border-radius: 3px; }
  ::selection { background: color-mix(in srgb, var(--accent) 25%, transparent); }

  .skip-nav {
    position: absolute; left: -9999px; top: 8px; z-index: 999;
    padding: 8px 14px; background: var(--ink); color: var(--bg);
    border-radius: var(--r-sm); font-weight: 600; font-size: 13px;
  }
  .skip-nav:focus { left: 8px; outline: none; box-shadow: var(--focus); }

  .appbar {
    position: sticky; top: 0; z-index: 50;
    background: color-mix(in srgb, var(--surface) 88%, transparent);
    backdrop-filter: saturate(180%) blur(12px);
    -webkit-backdrop-filter: saturate(180%) blur(12px);
    border-bottom: 1px solid var(--border-soft);
  }
  .appbar-inner {
    max-width: 1400px; margin: 0 auto; padding: 14px 32px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-mark {
    width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
    background: linear-gradient(140deg, var(--accent) 0%, var(--accent-strong) 100%);
    display: grid; place-items: center; color: white;
  }
  .brand-text { display: flex; flex-direction: column; line-height: 1.15; }
  .brand-name { font-size: 14px; font-weight: 600; color: var(--ink); letter-spacing: -0.01em; }
  .brand-meta { font-size: 11.5px; color: var(--ink-3); font-weight: 500; }
  .status-pill {
    display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px;
    border-radius: var(--r-pill); background: var(--surface-2);
    font-size: 12px; color: var(--ink-2); font-weight: 500;
  }

  main {
    max-width: 1400px; margin: 0 auto; padding: 40px 32px 96px;
    display: grid; grid-template-columns: minmax(0,1.5fr) minmax(0,1fr);
    gap: 32px; align-items: start;
  }
  @media (max-width: 960px) { main { grid-template-columns:1fr; padding:24px 20px 96px; gap:24px; } }
  .col-stack { display: flex; flex-direction: column; gap: var(--gap-stack); min-width: 0; }

  .card {
    background: var(--surface); border: 1px solid var(--border-soft);
    border-radius: var(--r-lg); box-shadow: var(--shadow-card);
  }
  .card-pad { padding: var(--pad-card); }
  .card-head {
    padding: 22px var(--pad-card) 16px;
    display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
  }
  .card-title { font-size: 16px; font-weight: 600; color: var(--ink); letter-spacing: -0.01em; }
  .card-meta   { font-size: 12px; color: var(--ink-3); font-weight: 500; font-family: var(--font-mono); }
  .card-head-flex {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap;
  }
  .eyebrow {
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
    font-weight: 600; color: var(--ink-3);
  }

  /* ── Segmented mode-switcher ─────────────────────────────────────────────── */
  .modeswitch {
    display: inline-grid; grid-template-columns: 1fr 1fr;
    background: var(--surface-2); border: 1px solid var(--border-soft);
    border-radius: var(--r-pill); padding: 4px; width: 100%; max-width: 460px;
  }
  .modeswitch button {
    background: transparent; border: none; cursor: pointer;
    border-radius: var(--r-pill); padding: 11px 16px;
    font-size: 13px; font-weight: 600; color: var(--ink-3);
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
    transition: all 0.15s ease;
  }
  .modeswitch button .sub {
    font-size: 10.5px; font-weight: 500; color: var(--ink-4);
    letter-spacing: 0.04em; text-transform: uppercase;
  }
  .modeswitch button[aria-selected="true"] {
    background: var(--surface); color: var(--ink);
    box-shadow: 0 1px 3px rgba(15,23,42,.06),0 1px 1px rgba(15,23,42,.04);
  }
  .modeswitch button[aria-selected="true"] .sub { color: var(--accent-strong); }
  .modeswitch button:focus-visible { outline: none; box-shadow: var(--focus); }
  @media (hover: none) and (pointer: coarse) { .modeswitch button { padding: 15px 16px; } }

  .formula-chip {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 8px 12px 8px 10px; background: var(--accent-soft);
    border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--border-soft));
    border-radius: var(--r-sm); font-family: var(--font-mono);
    font-size: 12.5px; color: var(--accent-ink); font-weight: 500;
  }
  .formula-chip .label {
    font-family: var(--font-sans); font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: color-mix(in srgb, var(--accent-ink) 70%, transparent);
  }

  /* ── Inputs ─────────────────────────────────────────────────────────────── */
  .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 480px) { .input-grid { grid-template-columns: 1fr; gap: 12px; } }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label {
    display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
    font-size: 13px; font-weight: 600; color: var(--ink-2);
  }
  .field-label .hint { font-size: 11.5px; font-weight: 500; color: var(--ink-3); }
  .field-label .swatch {
    width: 8px; height: 8px; border-radius: 2px;
    display: inline-block; vertical-align: middle; margin-right: 6px;
  }
  .input-wrap { position: relative; }
  .input-wrap input {
    width: 100%; padding: 14px 44px 14px 14px;
    font-family: var(--font-mono); font-size: 17px; font-weight: 500;
    color: var(--ink); background: var(--surface);
    border: 1.5px solid var(--border); border-radius: var(--r-md);
    outline: none; min-height: 50px; font-variant-numeric: tabular-nums;
    -moz-appearance: textfield; transition: all 0.15s ease;
  }
  .input-wrap input::-webkit-inner-spin-button,
  .input-wrap input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .input-wrap input::placeholder { color: var(--ink-4); font-weight: 400; }
  .input-wrap input:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 3%, var(--surface)); }
  .input-wrap input:focus-visible { border-color: var(--accent); box-shadow: var(--focus); background: var(--surface); }
  .input-wrap .unit {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    font-family: var(--font-mono); font-size: 12.5px; color: var(--ink-3);
    pointer-events: none; font-weight: 500;
  }
  @media (hover: none) and (pointer: coarse) { .input-wrap input { min-height: 58px; font-size: 18px; padding: 16px 44px 16px 16px; } }

  .measure-note {
    font-size: 12.5px; color: var(--ink-3); line-height: 1.55;
    background: var(--surface-2); border: 1px solid var(--border-soft);
    border-radius: var(--r-sm); padding: 10px 12px;
    display: flex; align-items: flex-start; gap: 8px;
  }

  /* ── Diagram ──────────────────────────────────────────────────────────────── */
  .diagram-frame {
    display: flex; justify-content: center; align-items: center;
    padding: 24px; background: var(--surface-2);
    border: 1px solid var(--border-soft); border-radius: var(--r-md);
  }
  .diagram-frame svg { width: 100%; max-width: 280px; height: auto; }

  /* ── Result ───────────────────────────────────────────────────────────────── */
  .result-empty {
    margin-top: 4px; padding: 28px 20px; text-align: center;
    border: 1px dashed var(--border); border-radius: var(--r-md);
    background: var(--surface-2); color: var(--ink-3); font-size: 13.5px;
  }
  .result {
    margin-top: 6px; border: 1px solid var(--border-soft);
    border-radius: var(--r-md); background: var(--surface);
    position: relative; overflow: hidden;
  }
  /* Left-bar treatment (default) */
  .result::before {
    content:""; position:absolute; left:0; top:0; bottom:0; width:4px;
    background:var(--sev-color,var(--accent));
  }
  [data-sev-treatment="dot"] .result::before { display:none; }
  [data-sev-treatment="tint"] .result { background:color-mix(in srgb,var(--sev-color) 5%,var(--surface)); }
  [data-sev-treatment="tint"] .result::before { display:none; }

  .result-head { padding:22px 22px 18px; display:flex; flex-direction:column; gap:6px; }
  .result-eyebrow-row {
    display:flex; align-items:center; gap:10px; font-size:11px;
    text-transform:uppercase; letter-spacing:0.08em; font-weight:600; color:var(--ink-3);
  }
  .result-eyebrow-row .sev-dot {
    width:8px; height:8px; border-radius:50%; background:var(--sev-color); display:inline-block;
  }
  .result-eyebrow-row .sev-label { color:var(--ink-2); letter-spacing:0.06em; }
  .result-number { display:flex; align-items:baseline; gap:12px; margin-top:2px; }
  .result-number .value {
    font-family:var(--font-mono); font-size:56px; font-weight:500;
    letter-spacing:-0.02em; color:var(--ink); line-height:1; font-variant-numeric:tabular-nums;
  }
  .result-number .pct {
    font-family:var(--font-mono); font-size:28px; font-weight:400; color:var(--ink-3); line-height:1;
  }
  .result-number .range {
    margin-left:auto; font-family:var(--font-mono); font-size:12px;
    color:var(--ink-3); text-align:right; line-height:1.4;
  }
  .result-number .range strong {
    display:block; font-size:13px; color:var(--ink);
    font-family:var(--font-sans); font-weight:600; letter-spacing:-0.01em;
  }
  .result-body {
    padding:18px 22px 22px; border-top:1px solid var(--border-soft);
    display:flex; flex-direction:column; gap:14px;
  }
  .result-section { display:flex; flex-direction:column; gap:5px; }
  .result-section h3 {
    /* h3 (not h4): h2=card title → h3=result subsections — no heading level skip */
    font-size:11px; text-transform:uppercase; letter-spacing:0.08em;
    color:var(--ink-3); font-weight:600;
  }
  .result-section p  { font-size:14px; color:var(--ink); line-height:1.55; }
  .result-section ul {
    list-style:none; display:flex; flex-direction:column; gap:4px;
    font-size:13.5px; color:var(--ink-2); line-height:1.55;
  }
  .result-section li { position:relative; padding-left:14px; }
  .result-section li::before {
    content:""; position:absolute; left:0; top:9px;
    width:4px; height:4px; background:var(--ink-4); border-radius:50%;
  }
  .result-actions {
    display:flex; gap:10px; padding:14px 22px;
    background:var(--surface-2); border-top:1px solid var(--border-soft);
    justify-content:flex-end;
  }
  @media (max-width: 480px) {
    .result-actions { flex-direction:column-reverse; }
    .result-actions > * { width:100%; justify-content:center; }
  }

  /* ── Buttons ──────────────────────────────────────────────────────────────── */
  .btn {
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:10px 18px; border-radius:var(--r-md); font-size:13.5px; font-weight:600;
    cursor:pointer; border:1px solid transparent; font-family:var(--font-sans);
    touch-action:manipulation; -webkit-tap-highlight-color:transparent; min-height:42px; white-space:nowrap;
    transition: all 0.2s ease;
  }
  .btn:focus-visible { outline:none; box-shadow:var(--focus); }
  .btn-primary { background:var(--accent); color:white; border-color:var(--accent); }
  .btn-primary:hover { background:var(--accent-strong); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
  .btn-primary:active { transform: translateY(0); box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
  .btn-primary.copied { background:var(--sev-1); border-color:var(--sev-1); color:white; }
  .btn-ghost { background:var(--surface); color:var(--ink-2); border-color:var(--border); }
  .btn-ghost:hover { background:var(--surface-2); border-color:var(--accent); color:var(--ink); }
  @media (hover: none) and (pointer: coarse) { .btn { min-height:48px; padding: 12px 18px; } }

  /* ── Alert ────────────────────────────────────────────────────────────────── */
  .alert {
    margin-top:4px; padding:12px 16px; border-radius:var(--r-md);
    background:color-mix(in srgb,var(--sev-3) 8%,var(--surface));
    border:1px solid color-mix(in srgb,var(--sev-3) 30%,var(--border));
    color:var(--sev-4); font-size:13.5px;
    display:flex; align-items:flex-start; gap:10px;
  }

  /* ── Severity table ───────────────────────────────────────────────────────── */
  .table-scroll { overflow-x:auto; }
  .table-scroll:focus-visible { outline:none; box-shadow:var(--focus); }
  .sev-table { width:100%; border-collapse:collapse; font-size:13px; }
  .sev-table th {
    text-align:left; font-size:10.5px; text-transform:uppercase;
    letter-spacing:0.08em; font-weight:600; color:var(--ink-3);
    padding:10px 14px; background:var(--surface-2);
    border-bottom:1px solid var(--border-soft);
  }
  .sev-table th:first-child { padding-left:var(--pad-card); }
  .sev-table th:last-child  { padding-right:var(--pad-card); }
  .sev-table td { padding:14px; vertical-align:top; border-bottom:1px solid var(--border-soft); }
  .sev-table td:first-child { padding-left:var(--pad-card); }
  .sev-table td:last-child  { padding-right:var(--pad-card); }
  .sev-table tr:last-child td { border-bottom:none; }
  .sev-table tr:hover td { background:color-mix(in srgb,var(--surface-2) 60%,var(--surface)); }
  .sev-table .level-num {
    display:inline-flex; align-items:center; gap:8px;
    font-family:var(--font-mono); font-size:13px; font-weight:600; color:var(--ink);
  }
  .sev-table .level-num .bar { width:3px; height:16px; background:var(--sev-color); border-radius:2px; }
  .sev-table .range-cell {
    font-family:var(--font-mono); font-size:13px; color:var(--ink-2);
    font-variant-numeric:tabular-nums; white-space:nowrap; width:110px;
  }
  .sev-table .pres-cell ul {
    list-style:none; font-size:12.5px; color:var(--ink-2);
    line-height:1.5; display:flex; flex-direction:column; gap:2px;
  }
  .sev-table .rec-cell { font-size:12.5px; color:var(--ink-2); line-height:1.55; }

  /* ── Accordion ────────────────────────────────────────────────────────────── */
  .accordion-toggle {
    width:100%; background:transparent; border:none; cursor:pointer;
    padding:22px var(--pad-card); display:flex; align-items:center;
    justify-content:space-between; text-align:left; font-family:inherit;
    transition: all 0.15s ease;
  }
  .accordion-toggle:hover { background: color-mix(in srgb, var(--surface-2) 50%, var(--surface)); }
  .accordion-toggle:focus-visible { outline:none; box-shadow:inset 0 0 0 2px var(--accent); border-radius:var(--r-lg); }
  .accordion-toggle .chev { color:var(--ink-3); transition: transform 0.2s ease; }
  .accordion-body {
    padding:0 var(--pad-card) var(--pad-card);
    border-top:1px solid var(--border-soft);
    display:flex; flex-direction:column; gap:16px;
  }
  .age-block {
    display:grid; grid-template-columns:140px 1fr; gap:18px; padding-top:18px;
  }
  @media (max-width: 600px) { .age-block { grid-template-columns:1fr; gap:6px; } }
  .age-tag {
    font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em;
    color:var(--ink-3); display:flex; align-items:flex-start; gap:8px; padding-top:2px;
  }
  .age-tag .dot { width:8px; height:8px; border-radius:50%; background:var(--accent); margin-top:4px; flex-shrink:0; }
  .age-content { font-size:13.5px; color:var(--ink-2); line-height:1.6; display:flex; flex-direction:column; gap:10px; }
  .age-content strong { color:var(--ink); font-weight:600; }
  .age-content ul { list-style:none; display:flex; flex-direction:column; gap:6px; margin-top:2px; }
  .age-content li { position:relative; padding-left:14px; }
  .age-content li::before {
    content:""; position:absolute; left:0; top:9px;
    width:4px; height:4px; background:var(--ink-4); border-radius:50%;
  }
  .cond-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:4px; }
  @media (max-width: 600px) { .cond-grid { grid-template-columns:1fr; } }
  .cond-card { border:1px solid var(--border-soft); border-radius:var(--r-md); padding:14px 16px; background:var(--surface-2); }
  .cond-card h5 { font-size:13.5px; font-weight:600; color:var(--ink); margin-bottom:8px; }
  .cond-card .eyebrow { margin-top:10px; margin-bottom:4px; }
  .cond-card ul { list-style:none; display:flex; flex-direction:column; gap:4px; }
  .cond-card li { font-size:12.5px; color:var(--ink-2); padding-left:14px; position:relative; }
  .cond-card li::before {
    content:""; position:absolute; left:0; top:8px;
    width:4px; height:4px; background:var(--ink-4); border-radius:50%;
  }

  /* ── Toast ────────────────────────────────────────────────────────────────── */
  .toast {
    position:fixed; top:80px; left:50%;
    transform:translateX(-50%) translateY(0);
    background:var(--ink); color:var(--bg);
    padding:10px 16px; border-radius:var(--r-pill);
    font-size:13px; font-weight:500; box-shadow:var(--shadow-pop);
    z-index:100; pointer-events:none;
    display:flex; align-items:center; gap:8px;
  }
  .toast.hidden { opacity:0; transform:translateX(-50%) translateY(-6px); }
  @media (prefers-reduced-motion: no-preference) {
    .toast { transition: opacity 0.2s, transform 0.2s; }
    .accordion-toggle .chev { transition: transform 0.2s; }
  }
  .accordion-toggle[aria-expanded="true"] .chev { transform: rotate(180deg); }

  /* ── Sticky mobile result ─────────────────────────────────────────────────── */
  .sticky-result {
    display:none; position:fixed; left:0; right:0; bottom:0;
    background:var(--surface); border-top:2px solid var(--accent);
    box-shadow:0 -4px 24px rgba(15,23,42,.08);
    padding:12px 16px calc(12px + env(safe-area-inset-bottom));
    z-index:40; align-items:center; gap:12px; justify-content:space-between;
  }
  .sticky-result .sticky-label {
    display:flex; align-items:center; gap:8px;
    font-family:var(--font-mono); font-size:13px; font-weight:500; color:var(--ink);
    font-variant-numeric:tabular-nums; min-width:0; overflow:hidden;
    text-overflow:ellipsis; white-space:nowrap;
  }
  .sticky-result .sticky-label .dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  @media (max-width: 640px) {
    .sticky-result.visible { display:flex; }
    main { padding-bottom:100px !important; }
  }

  /* ── Restored banner ──────────────────────────────────────────────────────── */
  .restored-bar {
    display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:10px 16px; background:color-mix(in srgb, var(--accent) 5%, var(--surface));
    border-bottom:1px solid color-mix(in srgb, var(--accent) 20%, var(--border-soft));
    border-top-left-radius:var(--r-lg); border-top-right-radius:var(--r-lg);
    font-size:12.5px; color:var(--ink-2);
  }
  .restored-bar button {
    font-size:12.5px; font-weight:600; color:var(--accent);
    background:transparent; border:none; padding:4px 8px;
    border-radius:var(--r-sm); cursor:pointer; font-family:inherit;
    transition: all 0.15s ease;
  }
  .restored-bar button:hover { background:color-mix(in srgb, var(--accent) 12%, var(--surface)); color:var(--accent-strong); }
  .restored-bar button:focus-visible { outline:none; box-shadow:var(--focus); }

  /* ── Tweaks panel ─────────────────────────────────────────────────────────── */
  .twk-panel {
    position:fixed; right:16px; bottom:16px; z-index:200; width:260px;
    background:color-mix(in srgb,var(--surface) 85%,transparent);
    backdrop-filter:blur(20px) saturate(160%);
    -webkit-backdrop-filter:blur(20px) saturate(160%);
    border:1px solid var(--border-soft); border-radius:var(--r-lg);
    box-shadow:var(--shadow-pop); font-family:var(--font-sans); overflow:hidden;
  }
  .twk-head {
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 14px; border-bottom:1px solid var(--border-soft);
    font-size:12px; font-weight:600; color:var(--ink);
  }
  .twk-body { padding:14px; display:flex; flex-direction:column; gap:14px; }
  .twk-section { display:flex; flex-direction:column; gap:6px; }
  .twk-section-label { font-size:10px; text-transform:uppercase; letter-spacing:0.07em; font-weight:600; color:var(--ink-3); }
  .twk-seg {
    display:flex; gap:4px; background:var(--surface-2);
    border:1px solid var(--border-soft); border-radius:var(--r-pill); padding:3px;
  }
  .twk-seg button {
    flex:1; font-size:12px; font-weight:500; padding:5px 8px;
    border:none; border-radius:var(--r-pill); cursor:pointer;
    background:transparent; color:var(--ink-3); font-family:inherit;
    touch-action:manipulation; transition: all 0.15s ease;
  }
  .twk-seg button[data-active="true"] { background:var(--surface); color:var(--accent-strong); box-shadow:0 1px 3px rgba(15,23,42,.08); }
  .twk-seg button:focus-visible { outline:none; box-shadow:var(--focus); }
  .twk-color-row { display:flex; gap:6px; }
  .twk-color-swatch {
    width:28px; height:28px; border-radius:50%; border:none; cursor:pointer;
    position:relative; flex-shrink:0; touch-action:manipulation; transition: transform 0.15s ease;
  }
  .twk-color-swatch:hover { transform: scale(1.08); }
  .twk-color-swatch[data-active="true"]::after {
    content:""; position:absolute; inset:-3px; border-radius:50%; border:2px solid var(--accent);
  }
  .twk-color-swatch:focus-visible { outline:none; box-shadow:var(--focus); }
  .twk-close {
    background:transparent; border:none; color:var(--ink-3); cursor:pointer;
    padding:2px 4px; border-radius:4px; font-family:inherit; font-size:14px;
    transition: all 0.15s ease;
  }
  .twk-close:hover { background:var(--surface-3); color:var(--ink); }
  .twk-toggle-btn {
    position:fixed; right:16px; bottom:16px; z-index:199;
    background:var(--accent); color:white; border:none;
    border-radius:var(--r-pill); padding:10px 16px;
    font-size:12px; font-weight:600; cursor:pointer;
    font-family:inherit; box-shadow:var(--shadow-pop); touch-action:manipulation;
    transition: all 0.2s ease;
  }
  .twk-toggle-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
  .twk-toggle-btn:active { transform: translateY(0); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .twk-toggle-btn:focus-visible { outline:none; box-shadow:var(--focus); }

  .sr-only {
    position:absolute; width:1px; height:1px; padding:0; margin:-1px;
    overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;
  }

  footer {
    text-align:center; padding:16px 32px 32px;
    font-size:12px; color:var(--ink-3);
    display:flex; justify-content:center; gap:8px; flex-wrap:wrap;
    max-width:1400px; margin:0 auto;
  }
`;

// ─── CSS injection: one-time side effect at module load ───────────────────────
// Runs before any React render, guaranteed to execute exactly once per page.
// This prevents ~600 lines of CSS being diffed on every keystroke.
if (typeof document !== "undefined") {
  if (!document.getElementById("choa-plagio-styles")) {
    const el = document.createElement("style");
    el.id = "choa-plagio-styles";
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
  }
}

// ─── Icons (Lucide-style; d prop destructured so it creates a <path>, not a
//     stray attribute on the <svg> — fixes invisible IcShield / IcCheck bugs) ──
const Ic = ({ size=16, d, children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true" {...p}>
    {d ? <path d={d}/> : children}
  </svg>
);
const IcCopy    = p => <Ic {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></Ic>;
const IcCheck   = p => <Ic {...p} d="M20 6 9 17l-5-5"/>;
const IcRefresh = p => <Ic {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></Ic>;
const IcAlert   = p => <Ic {...p}><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></Ic>;
const IcChevron = p => <Ic {...p} d="m6 9 6 6 6-6"/>;
const IcSettings= p => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></Ic>;
const IcShield  = p => <Ic {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>;

const BrandMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="12" cy="12" rx="9" ry="8"/>
    <path d="M5 9h14" strokeDasharray="2 2" opacity="0.6"/>
    <circle cx="12" cy="12" r="1.5" fill="white" stroke="none"/>
  </svg>
);

// ─── Logic (v6) — integer cross-multiplication, Number.isFinite() guards ──────
// Boundaries verified: CVAI 3.5 / 6.25 / 8.75 / 11.0 all map to correct levels.
// Level 4 upper bound (11.0) is inclusive per CHOA "8.75 to 11.0".
const CLINICAL_MIN_MM = 1;
const CLINICAL_MAX_MM = 500;
const STORAGE_KEY = "choa_plagio_v8";

const toTenths = v => Math.round(v * 10);

function validateMeasurement(raw, label) {
  // Loose null check: catches both null and undefined without a separate branch
  if (raw === "" || raw == null) return { ok:false, value:null, error:null, empty:true };
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return { ok:false, value:null, error:`${label} must be a valid number.` };
  if (n <= 0)              return { ok:false, value:null, error:`${label} must be greater than zero.` };
  if (n < CLINICAL_MIN_MM) return { ok:false, value:null, error:`${label}: ${n} mm is below minimum for a skull measurement.` };
  if (n > CLINICAL_MAX_MM) return { ok:false, value:null, error:`${label}: ${n} mm exceeds ${CLINICAL_MAX_MM} mm — check caliper reading.` };
  return { ok:true, value:n, error:null, empty:false };
}

function processCvai(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
  const a10=toTenths(a), b10=toTenths(b);
  const diff=Math.abs(a10-b10), max=Math.max(a10,b10);
  if (max === 0) return null;
  let sevIdx;
  if      (diff*200 <  7*max)  sevIdx=0;  // < 3.5%
  else if (diff* 16 <    max)  sevIdx=1;  // < 6.25%
  else if (diff*400 < 35*max)  sevIdx=2;  // < 8.75%
  else if (diff*100 <=11*max)  sevIdx=3;  // ≤ 11.0% inclusive
  else                          sevIdx=4;
  const displayCvai=(diff/max)*100;
  if (!Number.isFinite(displayCvai)) return null;
  return { displayCvai, sevIdx };
}

function processCr(ml, ap) {
  if (!Number.isFinite(ml) || !Number.isFinite(ap) || ml <= 0 || ap <= 0) return null;
  const ml10=toTenths(ml), ap10=toTenths(ap);
  if (ap10 === 0) return null;
  const cr100=ml10*100;
  let key;
  if      (cr100 >  90*ap10) key="ortho";
  else if (cr100 >= 85*ap10) key="watch";
  else                        key="ok";
  const displayCr=(ml10/ap10)*100;
  if (!Number.isFinite(displayCr)) return null;
  return { key, displayCr };
}

const SEVERITY = [
  { level:1, range:"< 3.5",      rangeFull:"CVAI < 3.5%",      label:"Within normal limits",  sevVar:"var(--sev-1)",
    presentation:["All symmetry within normal limits"],
    recommendation:"No treatment required.", referral:"No referral indicated" },
  { level:2, range:"3.5 – 6.25", rangeFull:"CVAI 3.5 – 6.25%", label:"Mild asymmetry",        sevVar:"var(--sev-2)",
    presentation:["Minimal asymmetry in one posterior quadrant","No secondary changes"],
    recommendation:"Repositioning program.", referral:"Repositioning program — no orthosis at this stage" },
  { level:3, range:"6.25 – 8.75",rangeFull:"CVAI 6.25 – 8.75%",label:"Moderate asymmetry",    sevVar:"var(--sev-3)",
    presentation:["Two-quadrant involvement","Moderate to severe posterior flattening","Minimal ear shift and/or anterior involvement"],
    recommendation:"Conservative treatment — repositioning or cranial remolding orthosis based on age and history.",
    referral:"Consider cranial remolding orthosis (age and history dependent)" },
  { level:4, range:"8.75 – 11.0",rangeFull:"CVAI 8.75 – 11.0%",label:"Severe asymmetry",      sevVar:"var(--sev-4)",
    presentation:["Two- or three-quadrant involvement","Severe posterior flattening","Moderate ear shift","Anterior orbit asymmetry"],
    recommendation:"Cranial remolding orthosis.", referral:"Cranial remolding orthosis recommended" },
  { level:5, range:"> 11.0",     rangeFull:"CVAI > 11.0%",      label:"Very severe asymmetry", sevVar:"var(--sev-5)",
    presentation:["Three- or four-quadrant involvement","Severe posterior flattening","Severe ear shift","Anterior involvement including orbit and cheek asymmetry"],
    recommendation:"Cranial remolding orthosis.", referral:"Cranial remolding orthosis strongly recommended" },
];

const CR_LEVELS = {
  ortho:{ label:"Orthotic evaluation recommended", short:"Orthotic eval", rangeFull:"CR > 90",    sevVar:"var(--sev-4)",
          detail:"Per CHOA guideline: refer for cranial remolding orthosis evaluation.",
          presentation:["Bilateral forehead bossing","Increased posterior vault","Bilateral protrusion of parietal bone above ears"] },
  watch:{ label:"Borderline — monitor closely",    short:"Monitor",       rangeFull:"CR 85 – 90", sevVar:"var(--sev-3)",
          detail:"Reassess at next visit. Document trajectory. No immediate orthotic indicated per CHOA threshold (>90)." },
  ok:   { label:"Within normal range",             short:"Normal",        rangeFull:"CR ≤ 85",     sevVar:"var(--sev-1)",
          detail:"Continue routine developmental monitoring." },
};

// ─── EMR note builders ────────────────────────────────────────────────────────
function fmtTimestamp() {
  const n=new Date();
  return `${n.toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"})}    ${n.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:true})}`;
}
function buildCvaiNote(cvai, sev, rawA, rawB) {
  return ["PLAGIOCEPHALY ASSESSMENT",fmtTimestamp(),"",
    `CVAI: ${cvai.toFixed(2)}%`,
    `Severity: Level ${sev.level} — ${sev.label}  (range: ${sev.rangeFull})`,"",
    "Measurements (caliper):",
    `  Diagonal A (longer):  ${parseFloat(rawA).toFixed(1)} mm`,
    `  Diagonal B (shorter): ${parseFloat(rawB).toFixed(1)} mm`,"",
    "Clinical Presentation:",...sev.presentation.map(p=>`  - ${p}`),"",
    `Recommendation: ${sev.recommendation}`,`Referral: ${sev.referral}`,"",
    "Source: CHOA Plagiocephaly Severity Scale — choa.org/cranialremolding",
  ].join("\n");
}
function buildCrNote(cr, res, rawMl, rawAp) {
  const ref=res.key==="ortho"?"Yes — orthotic evaluation recommended"
           :res.key==="watch"?"Monitor — reassess at next visit"
           :"No — within normal range";
  return ["BRACHYCEPHALY ASSESSMENT",fmtTimestamp(),"",
    `Cephalic Ratio: ${cr.toFixed(1)}%`,
    `Assessment: ${res.label}  (range: ${res.rangeFull})`,"",
    "Measurements (caliper):",
    `  Medial-Lateral (M/L):     ${parseFloat(rawMl).toFixed(1)} mm`,
    `  Anterior-Posterior (A/P): ${parseFloat(rawAp).toFixed(1)} mm`,"",
    `Recommendation: ${res.detail}`,`Referral: ${ref}`,"",
    "Source: CHOA Plagiocephaly Severity Scale — choa.org/cranialremolding",
  ].join("\n");
}

// ─── Copy hook ────────────────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(false);
  const t = useRef(null);
  const copy = useCallback(async text => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const el=Object.assign(document.createElement("textarea"),{value:text,style:"position:fixed;top:-9999px;opacity:0"});
        document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
      }
      setCopied(true);
      clearTimeout(t.current);
      t.current=setTimeout(()=>setCopied(false),2000);
    } catch(err){ console.warn("Clipboard unavailable:",err.message); }
  },[]);
  useEffect(()=>()=>clearTimeout(t.current),[]);
  return [copied, copy];
}

// ─── Diagrams ─────────────────────────────────────────────────────────────────
function DiagramCVAI({ style="illustrated" }) {
  if (style==="minimal") return (
    <div className="diagram-frame" role="img"
      aria-label="CVAI: skull diagonals A (longer) and B (shorter), measured at 30° from nose centre.">
      <svg viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="140" cy="110" rx="100" ry="86" fill="none" stroke="var(--ink-3)" strokeWidth="1.25" strokeDasharray="2 3"/>
        <line x1="68" y1="48" x2="218" y2="180" stroke="var(--ink)"   strokeWidth="1.5"/>
        <line x1="212" y1="48" x2="62" y2="180" stroke="var(--ink-3)" strokeWidth="1.5" strokeDasharray="3 3"/>
        <circle cx="68" cy="48" r="3" fill="var(--ink)"/><circle cx="218" cy="180" r="3" fill="var(--ink)"/>
        <circle cx="212" cy="48" r="3" fill="var(--ink-3)"/><circle cx="62" cy="180" r="3" fill="var(--ink-3)"/>
        <text x="48" y="42" fontSize="11" fill="var(--ink)"   fontWeight="600" fontFamily="var(--font-mono)">A</text>
        <text x="222" y="42" fontSize="11" fill="var(--ink-3)" fontWeight="600" fontFamily="var(--font-mono)">B</text>
      </svg>
    </div>
  );
  return (
    <div className="diagram-frame" role="img"
      aria-label="CVAI measurement: top-down skull with Diagonal A (longer, accent-coloured solid line) and Diagonal B (shorter, dashed), both from forehead to posterior skull at 30° from nose centre.">
      <svg viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg">
        <line x1="140" y1="20" x2="140" y2="200" stroke="var(--border)" strokeWidth="0.75" strokeDasharray="2 3"/>
        <line x1="40" y1="110" x2="240" y2="110" stroke="var(--border)" strokeWidth="0.75" strokeDasharray="2 3"/>
        <ellipse cx="140" cy="110" rx="100" ry="86" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5"/>
        <path d="M134 25 Q140 19 146 25" fill="none" stroke="var(--ink)" strokeWidth="1.5"/>
        <rect x="36"  y="100" width="8" height="20" rx="3" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.25"/>
        <rect x="236" y="100" width="8" height="20" rx="3" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.25"/>
        <line x1="68" y1="48" x2="218" y2="180" stroke="var(--accent)" strokeWidth="2"/>
        <circle cx="68" cy="48" r="4" fill="var(--accent)"/><circle cx="218" cy="180" r="4" fill="var(--accent)"/>
        <line x1="212" y1="48" x2="76" y2="172" stroke="var(--ink-3)" strokeWidth="1.75" strokeDasharray="4 3"/>
        <circle cx="212" cy="48" r="4" fill="var(--ink-3)"/><circle cx="76" cy="172" r="4" fill="var(--ink-3)"/>
        <text x="50" y="42" fontSize="11" fontWeight="600" fill="var(--accent-strong)" fontFamily="var(--font-mono)">A</text>
        <text x="222" y="44" fontSize="11" fontWeight="600" fill="var(--ink-2)"        fontFamily="var(--font-mono)">B</text>
        <text x="140" y="214" fontSize="9" fill="var(--ink-3)" textAnchor="middle" fontFamily="var(--font-mono)">A = longer · B = shorter · 30° from nose</text>
      </svg>
    </div>
  );
}

function DiagramCR({ style="illustrated" }) {
  if (style==="minimal") return (
    <div className="diagram-frame" role="img" aria-label="CR: skull width (M/L) over depth (A/P).">
      <svg viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="140" cy="110" rx="100" ry="86" fill="none" stroke="var(--ink-3)" strokeWidth="1.25" strokeDasharray="2 3"/>
        <line x1="40" y1="110" x2="240" y2="110" stroke="var(--ink)"   strokeWidth="1.5"/>
        <line x1="140" y1="22" x2="140" y2="198" stroke="var(--ink-3)" strokeWidth="1.5" strokeDasharray="3 3"/>
        <text x="22"  y="115" fontSize="11" fill="var(--ink)"   fontWeight="600" fontFamily="var(--font-mono)">M/L</text>
        <text x="146" y="20"  fontSize="11" fill="var(--ink-3)" fontWeight="600" fontFamily="var(--font-mono)">A/P</text>
      </svg>
    </div>
  );
  return (
    <div className="diagram-frame" role="img"
      aria-label="CR measurement: top-down skull with M/L width (accent horizontal arrow) and A/P length (dashed vertical arrow).">
      <svg viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg">
        <line x1="140" y1="14" x2="140" y2="206" stroke="var(--border)" strokeWidth="0.75" strokeDasharray="2 3"/>
        <line x1="32" y1="110" x2="248" y2="110" stroke="var(--border)" strokeWidth="0.75" strokeDasharray="2 3"/>
        <ellipse cx="140" cy="110" rx="100" ry="86" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5"/>
        <path d="M134 25 Q140 19 146 25" fill="none" stroke="var(--ink)" strokeWidth="1.5"/>
        <rect x="36"  y="100" width="8" height="20" rx="3" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.25"/>
        <rect x="236" y="100" width="8" height="20" rx="3" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.25"/>
        <line x1="46" y1="110" x2="234" y2="110" stroke="var(--accent)" strokeWidth="2"/>
        <polygon points="46,110 56,105 56,115" fill="var(--accent)"/>
        <polygon points="234,110 224,105 224,115" fill="var(--accent)"/>
        <line x1="140" y1="28" x2="140" y2="192" stroke="var(--ink-3)" strokeWidth="2" strokeDasharray="4 3"/>
        <polygon points="140,28 135,38 145,38" fill="var(--ink-3)"/>
        <polygon points="140,192 135,182 145,182"  fill="var(--ink-3)"/>
        <text x="14"  y="114" fontSize="11" fontWeight="600" fill="var(--accent-strong)" fontFamily="var(--font-mono)">M/L</text>
        <text x="148" y="22"  fontSize="11" fontWeight="600" fill="var(--ink-2)"         fontFamily="var(--font-mono)">A/P</text>
        <text x="140" y="214" fontSize="9" fill="var(--ink-3)" textAnchor="middle" fontFamily="var(--font-mono)">M/L = medial-lateral · A/P = anterior-posterior</text>
      </svg>
    </div>
  );
}

// ─── Shared small components ──────────────────────────────────────────────────
function Toast({ visible }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={`toast${visible?"":" hidden"}`}>
      <IcCheck size={14}/><span>Copied to clipboard</span>
    </div>
  );
}

function NumberInput({ id, label, hint, swatchVar, value, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        <span>
          {swatchVar && <span className="swatch" style={{background:swatchVar}} aria-hidden="true"/>}
          {label}
        </span>
        {hint && <span className="hint">{hint}</span>}
      </label>
      <div className="input-wrap">
        <input id={id} type="number" inputMode="decimal" step="0.1" min="0.1"
               value={value} onChange={e=>onChange(e.target.value)}
               placeholder="—" autoComplete="off"
               aria-label={`${label} in millimeters`}/>
        <span className="unit">mm</span>
      </div>
    </div>
  );
}

function AlertBox({ children }) {
  return (
    <div className="alert" role="alert">
      <IcAlert size={16}/><span>{children}</span>
    </div>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────
function ResultCard({ eyebrow, value, unit, rangeMain, rangeSub,
                      sevLabel, sevVar, recommendation, presentation,
                      copyText, onCopy, onClear }) {
  const [copied, copy] = useCopy();
  const ref = useRef(null);

  // Fade on value change — skips animation if user prefers reduced motion
  useEffect(() => {
    if (!ref.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      ref.current.style.opacity = "1";
      ref.current.style.transition = "none";
    } else {
      ref.current.style.opacity = "0";
      requestAnimationFrame(() => {
        if (!ref.current) return;
        ref.current.style.transition = "opacity 0.22s ease";
        ref.current.style.opacity = "1";
      });
    }
  }, [value]);

  return (
    <div className="result" style={{"--sev-color":sevVar}} ref={ref}
         role="status" aria-live="polite" aria-atomic="true">
      <div className="result-head">
        <div className="result-eyebrow-row">
          <span className="sev-dot" aria-hidden="true"/>
          <span>{eyebrow}</span>
          <span style={{color:"var(--ink-4)"}}>·</span>
          <span className="sev-label">{sevLabel}</span>
        </div>
        <div className="result-number">
          <span className="value">{value}</span>
          {unit && <span className="pct">{unit}</span>}
          <span className="range">
            <strong>{rangeMain}</strong>
            <span style={{fontFamily:"var(--font-mono)",fontSize:12}}>{rangeSub}</span>
          </span>
        </div>
      </div>
      <div className="result-body">
        <div className="result-section">
          {/* h3 (not h4): card heading is h2, result sub-sections are h3 — no skip */}
          <h3>Recommendation</h3>
          <p>{recommendation}</p>
        </div>
        {presentation?.length > 0 && (
          <div className="result-section">
            <h3>Clinical presentation</h3>
            <ul>{presentation.map((p,i)=><li key={i}>{p}</li>)}</ul>
          </div>
        )}
      </div>
      <div className="result-actions">
        <button className="btn btn-ghost" onClick={onClear}
                aria-label="Clear all measurements and start a new patient">
          <IcRefresh size={14}/>New patient
        </button>
        <button className={`btn btn-primary${copied?" copied":""}`}
                onClick={()=>{copy(copyText);onCopy();}}
                aria-label={copied?"Result copied":"Copy structured note for EMR"}>
          {copied?<IcCheck size={14}/>:<IcCopy size={14}/>}
          {copied?"Copied":"Copy for EMR"}
        </button>
      </div>
    </div>
  );
}

// ─── CVAI panel ───────────────────────────────────────────────────────────────
function CvaiPanel({ a, setA, b, setB, onCopy, onClear, diagramStyle }) {
  const vA=validateMeasurement(a,"Diagonal A");
  const vB=validateMeasurement(b,"Diagonal B");
  const bothEmpty=vA.empty&&vB.empty, anyEmpty=vA.empty||vB.empty;
  const errorMsg=(!vA.ok&&!vA.empty)?vA.error:(!vB.ok&&!vB.empty)?vB.error:null;
  const result=(!anyEmpty&&!errorMsg)?processCvai(vA.value,vB.value):null;
  const sev=result?SEVERITY[result.sevIdx]:null;
  const cvai=result?.displayCvai??null;

  // Memoised to avoid rebuilding the EMR note string on every unrelated re-render
  const copyText=useMemo(()=>sev?buildCvaiNote(cvai,sev,a,b):"",[cvai,sev?.level,a,b]);

  return (
    <>
      <DiagramCVAI style={diagramStyle}/>
      <div className="measure-note">
        <span>📐</span>
        <span>Measure at 30° from nose centre (outer eyebrow) to posterior skull using calipers.</span>
      </div>
      <div className="input-grid">
        <NumberInput id="cvai-a" label="Diagonal A" hint="longer"  swatchVar="var(--accent)" value={a} onChange={setA}/>
        <NumberInput id="cvai-b" label="Diagonal B" hint="shorter" swatchVar="var(--ink-3)"  value={b} onChange={setB}/>
      </div>
      {(bothEmpty||(anyEmpty&&!errorMsg))&&<div className="result-empty">Enter both measurements to calculate CVAI</div>}
      {errorMsg&&<AlertBox>{errorMsg}</AlertBox>}
      {sev&&<ResultCard eyebrow="CVAI" value={cvai.toFixed(2)} unit="%" rangeMain={`Level ${sev.level}`}
              rangeSub={sev.range+"%"} sevLabel={sev.label} sevVar={sev.sevVar}
              recommendation={sev.recommendation} presentation={sev.presentation}
              copyText={copyText} onCopy={onCopy} onClear={onClear}/>}
      {!anyEmpty&&!errorMsg&&!sev&&<AlertBox>Calculation error — please re-enter measurements.</AlertBox>}
    </>
  );
}

// ─── CR panel ─────────────────────────────────────────────────────────────────
function CrPanel({ ml, ap, setMl, setAp, onCopy, onClear, diagramStyle }) {
  const vMl=validateMeasurement(ml,"M/L");
  const vAp=validateMeasurement(ap,"A/P");
  const bothEmpty=vMl.empty&&vAp.empty, anyEmpty=vMl.empty||vAp.empty;
  const errorMsg=(!vMl.ok&&!vMl.empty)?vMl.error:(!vAp.ok&&!vAp.empty)?vAp.error:null;
  const result=(!anyEmpty&&!errorMsg)?processCr(vMl.value,vAp.value):null;
  const res=result?{...CR_LEVELS[result.key],key:result.key}:null;
  const cr=result?.displayCr??null;

  const copyText=useMemo(()=>res?buildCrNote(cr,res,ml,ap):"",[cr,res?.key,ml,ap]);

  return (
    <>
      <DiagramCR style={diagramStyle}/>
      <div className="measure-note">
        <span>📐</span>
        <span>Measure M/L (width) and A/P (length) using calipers. CR &gt; 90 indicates orthotic evaluation per CHOA.</span>
      </div>
      <div className="input-grid">
        <NumberInput id="cr-ml" label="Width (M/L)"  hint="medial-lateral"    swatchVar="var(--accent)" value={ml} onChange={setMl}/>
        <NumberInput id="cr-ap" label="Length (A/P)" hint="anterior-posterior" swatchVar="var(--ink-3)"  value={ap} onChange={setAp}/>
      </div>
      {(bothEmpty||(anyEmpty&&!errorMsg))&&<div className="result-empty">Enter both measurements to calculate Cephalic Ratio</div>}
      {errorMsg&&<AlertBox>{errorMsg}</AlertBox>}
      {res&&<ResultCard eyebrow="Cephalic Ratio" value={cr.toFixed(1)} unit=""
              rangeMain={res.short} rangeSub={res.rangeFull}
              sevLabel={res.label} sevVar={res.sevVar}
              recommendation={res.detail}
              presentation={res.key==="ortho"?res.presentation:null}
              copyText={copyText} onCopy={onCopy} onClear={onClear}/>}
      {!anyEmpty&&!errorMsg&&!res&&<AlertBox>Calculation error — please re-enter measurements.</AlertBox>}
    </>
  );
}

// ─── Severity table ───────────────────────────────────────────────────────────
function SeverityTable() {
  return (
    <section className="card" aria-labelledby="sev-h">
      <div className="card-head">
        <h2 id="sev-h" className="card-title">CHOA severity scale</h2>
        <span className="card-meta">5 levels · CVAI</span>
      </div>
      <div className="table-scroll" tabIndex={0} role="region"
           aria-label="CHOA severity scale — scroll horizontally to view all columns">
        <table className="sev-table">
          <caption className="sr-only">CHOA Plagiocephaly Severity Scale: five levels from normal (Level 1) to very severe (Level 5)</caption>
          <thead>
            <tr>{["Level","CVAI","Presentation","Recommendation"].map(h=>(
              <th key={h} scope="col">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {SEVERITY.map(s=>(
              <tr key={s.level}>
                <td><span className="level-num" style={{"--sev-color":s.sevVar}}><span className="bar" aria-hidden="true"/>L{s.level}</span></td>
                <td className="range-cell">{s.range}</td>
                <td className="pres-cell"><ul>{s.presentation.map((p,i)=><li key={i}>{p}</li>)}</ul></td>
                <td className="rec-cell">{s.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{padding:"14px var(--pad-card) 18px",fontSize:11.5,color:"var(--ink-3)",lineHeight:1.6}}>
        Recommendations are examples, not a substitute for clinical judgment.
      </div>
    </section>
  );
}

// ─── Age guidelines accordion ─────────────────────────────────────────────────
function AgeGuidelines() {
  const [open,setOpen]=useState(false);
  return (
    <section className="card" aria-labelledby="age-h">
      <button className="accordion-toggle" aria-expanded={open} aria-controls="age-body"
              onClick={()=>setOpen(o=>!o)}>
        <h2 id="age-h" className="card-title" style={{marginBottom:0,paddingBottom:0,border:"none"}}>
          Age-specific guidelines
        </h2>
        <IcChevron size={16} className="chev"/>
      </button>
      {open&&(
        <div id="age-body" className="accordion-body" role="region" aria-labelledby="age-h">
          <div className="age-block">
            <div className="age-tag"><span className="dot"/><span>Birth – 4 months</span></div>
            <div className="age-content">
              <p>A documented <strong>two-month repositioning period</strong> is highly recommended before referring for orthosis evaluation. Required by most third-party payors.</p>
              <ul>
                <li><strong>Tummy Time Tools</strong> — <a href="https://choa.org/tummytimetools" target="_blank" rel="noreferrer">choa.org/tummytimetools</a></li>
                <li>If <strong>torticollis suspected</strong>, early referral to physical therapy</li>
              </ul>
            </div>
          </div>
          <div className="age-block">
            <div className="age-tag"><span className="dot"/><span>4+ months</span></div>
            <div className="age-content">
              <p>Assess for further treatment when secondary skull characteristics are observed:</p>
              <div className="cond-grid">
                <div className="cond-card">
                  <h5>Plagiocephaly</h5>
                  <div className="eyebrow">Clinical presentation</div>
                  <ul><li>Ipsilateral ear shift</li><li>Ipsilateral frontal bossing</li><li>Contralateral frontal flattening</li></ul>
                  <div className="eyebrow">Documentation</div>
                  <ul><li>Measure longest and shortest diagonals with calipers</li><li>Calculate CVAI</li></ul>
                </div>
                <div className="cond-card">
                  <h5>Brachycephaly</h5>
                  <div className="eyebrow">Clinical presentation</div>
                  <ul><li>Bilateral forehead bossing</li><li>Increased posterior vault</li><li>Bilateral parietal protrusion above ears</li></ul>
                  <div className="eyebrow">Documentation</div>
                  <ul><li>Measure M/L and A/P with calipers</li><li>Calculate CR — if CR &gt; 90, refer for orthotic evaluation</li></ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Tweaks panel ─────────────────────────────────────────────────────────────
const HUE_OPTIONS=[
  {h:35, label:"Rust",   bg:"oklch(60% 0.16 35)" },
  {h:15, label:"Orange", bg:"oklch(60% 0.16 15)" },
  {h:255,label:"Blue",   bg:"oklch(60% 0.16 255)"},
  {h:195,label:"Teal",   bg:"oklch(60% 0.16 195)"},
  {h:155,label:"Sage",   bg:"oklch(60% 0.16 155)"},
];

function TweaksPanel({ tweaks, setTweak }) {
  const [open,setOpen]=useState(false);
  function Seg({label,twkKey,options}){
    return (
      <div className="twk-section">
        <div className="twk-section-label">{label}</div>
        <div className="twk-seg">
          {options.map(o=>(
            <button key={o.value} data-active={tweaks[twkKey]===o.value?"true":"false"}
                    aria-pressed={tweaks[twkKey]===o.value}
                    onClick={()=>setTweak(twkKey,o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (!open) return (
    <button className="twk-toggle-btn" onClick={()=>setOpen(true)} aria-label="Open design tweaks">
      <IcSettings size={13} style={{verticalAlign:"middle",marginRight:5}}/>Tweaks
    </button>
  );
  return (
    <div className="twk-panel" role="dialog" aria-label="Design tweaks">
      <div className="twk-head">
        <span>Tweaks</span>
        <button className="twk-close" onClick={()=>setOpen(false)} aria-label="Close">✕</button>
      </div>
      <div className="twk-body">
        <div className="twk-section">
          <div className="twk-section-label">Accent colour</div>
          <div className="twk-color-row">
            {HUE_OPTIONS.map(o=>(
              <button key={o.h} className="twk-color-swatch"
                      style={{background:o.bg}}
                      data-active={tweaks.accentHue===o.h?"true":"false"}
                      aria-label={o.label} aria-pressed={tweaks.accentHue===o.h}
                      onClick={()=>setTweak("accentHue",o.h)}/>
            ))}
          </div>
        </div>
        <Seg label="Density"          twkKey="density"      options={[{value:"comfortable",label:"Comfortable"},{value:"compact",label:"Compact"}]}/>
        <Seg label="Severity display" twkKey="sevTreatment" options={[{value:"bar",label:"Left bar"},{value:"dot",label:"Dot"},{value:"tint",label:"Tint"}]}/>
        <Seg label="Diagram style"    twkKey="diagramStyle" options={[{value:"illustrated",label:"Illustrated"},{value:"minimal",label:"Minimal"}]}/>
      </div>
    </div>
  );
}

// ─── Sticky mobile result bar ─────────────────────────────────────────────────
function StickyResult({ visible, value, label, sevVar, copyText, onCopy }) {
  const [copied,copy]=useCopy();
  if (!visible) return null;
  return (
    <div className={`sticky-result${visible?" visible":""}`} aria-hidden="true">
      <div className="sticky-label">
        <span className="dot" style={{background:sevVar}}/>
        <span>{value}  ·  {label}</span>
      </div>
      <button className={`btn btn-primary${copied?" copied":""}`}
              style={{fontSize:12,padding:"8px 14px",minHeight:36}}
              onClick={()=>{copy(copyText);onCopy();}}>
        {copied?<IcCheck size={13}/>:<IcCopy size={13}/>}
        {copied?"Copied":"Copy"}
      </button>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,   setTab]   = useState("cvai");
  const [cvaiA, setCvaiA] = useState("");
  const [cvaiB, setCvaiB] = useState("");
  const [crMl,  setCrMl]  = useState("");
  const [crAp,  setCrAp]  = useState("");
  const [toast,    setToast]    = useState(false);
  const [restored, setRestored] = useState(false);
  const toastT = useRef(null);

  const [tweaks, setTweakState] = useState({
    accentHue:35, density:"comfortable", sevTreatment:"bar", diagramStyle:"illustrated"
  });
  const setTweak = useCallback((key,val)=>setTweakState(p=>({...p,[key]:val})),[]);

  useEffect(()=>{
    document.documentElement.style.setProperty("--accent-h", tweaks.accentHue);
    document.documentElement.dataset.density      = tweaks.density;
    document.documentElement.dataset.sevTreatment = tweaks.sevTreatment;
  },[tweaks]);

  useEffect(()=>{
    const prev=document.title;
    document.title="Plagiocephaly Assessment — CHOA Clinical Reference";
    return ()=>{document.title=prev;};
  },[]);

  useEffect(()=>{
    try {
      const raw=localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s=JSON.parse(raw);
      if (s.tab)   setTab(s.tab);
      if (s.cvaiA) setCvaiA(s.cvaiA);
      if (s.cvaiB) setCvaiB(s.cvaiB);
      if (s.crMl)  setCrMl(s.crMl);
      if (s.crAp)  setCrAp(s.crAp);
      if (s.cvaiA||s.cvaiB||s.crMl||s.crAp) setRestored(true);
      if (s.tweaks) setTweakState(p=>({...p,...s.tweaks}));
    } catch {}
  },[]);
  useEffect(()=>{
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify({tab,cvaiA,cvaiB,crMl,crAp,tweaks})); } catch {}
  },[tab,cvaiA,cvaiB,crMl,crAp,tweaks]);

  const clearAll=()=>{
    setCvaiA("");setCvaiB("");setCrMl("");setCrAp("");
    setRestored(false);
    try{localStorage.removeItem(STORAGE_KEY);}catch{}
  };

  const showToast=()=>{
    setToast(true);
    clearTimeout(toastT.current);
    toastT.current=setTimeout(()=>setToast(false),2000);
  };
  useEffect(()=>()=>clearTimeout(toastT.current),[]);

  const TABS=["cvai","cr"];
  const handleTabKey=useCallback(e=>{
    const i=TABS.indexOf(tab);
    if (e.key==="ArrowRight"){ e.preventDefault(); const next=TABS[(i+1)%2]; setTab(next); document.getElementById(`tab-${next}`)?.focus(); }
    if (e.key==="ArrowLeft") { e.preventDefault(); const prev=TABS[(i-1+2)%2]; setTab(prev); document.getElementById(`tab-${prev}`)?.focus(); }
  },[tab]);

  const hasInput=cvaiA||cvaiB||crMl||crAp;

  const sticky=useMemo(()=>{
    if (tab==="cvai"){
      const vA=validateMeasurement(cvaiA,"A"),vB=validateMeasurement(cvaiB,"B");
      if (vA.ok&&vB.ok){
        const r=processCvai(vA.value,vB.value);
        if (r){const s=SEVERITY[r.sevIdx];
          return{visible:true,value:`CVAI ${r.displayCvai.toFixed(1)}%`,label:`Level ${s.level}`,
                 sevVar:s.sevVar,copyText:buildCvaiNote(r.displayCvai,s,cvaiA,cvaiB)};}
      }
    } else {
      const vM=validateMeasurement(crMl,"M/L"),vA=validateMeasurement(crAp,"A/P");
      if (vM.ok&&vA.ok){
        const r=processCr(vM.value,vA.value);
        if (r){const l=CR_LEVELS[r.key];
          return{visible:true,value:`CR ${r.displayCr.toFixed(1)}`,label:l.short,
                 sevVar:l.sevVar,copyText:buildCrNote(r.displayCr,{...l,key:r.key},crMl,crAp)};}
      }
    }
    return{visible:false};
  },[tab,cvaiA,cvaiB,crMl,crAp]);

  return (
    <>
      <Toast visible={toast}/>
      <a href="#main" className="skip-nav">Skip to main content</a>

      <header className="appbar">
        <div className="appbar-inner">
          <div className="brand">
            <div className="brand-mark"><BrandMark/></div>
            <div className="brand-text">
              <span className="brand-name">Plagiocephaly Assessment</span>
              <span className="brand-meta">CVAI · Cephalic Ratio · CHOA scale</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span className="status-pill" aria-label="Data saved locally — nothing transmitted">
              <IcShield size={13}/>Local only
            </span>
          </div>
        </div>
      </header>

      <main id="main">
        <div className="col-stack">
          <section className="card" aria-labelledby="calc-h">
            {(restored||hasInput)&&(
              <div className="restored-bar">
                <span>{restored?"📋 Measurements restored from last session":"📋 Unsaved measurements"}</span>
                <button onClick={clearAll} aria-label="Clear all measurements and start fresh">Clear all</button>
              </div>
            )}
            <div className="card-pad" style={{paddingBottom:0}}>
              <div className="card-head-flex" style={{marginBottom:18}}>
                <div>
                  <h1 id="calc-h" className="card-title" style={{fontSize:18}}>
                    {tab==="cvai"?"Cranial Vault Asymmetry Index":"Cephalic Ratio"}
                  </h1>
                  <div className="card-meta" style={{marginTop:4}}>
                    {tab==="cvai"?"Diagonal asymmetry · plagiocephaly":"Width-to-length ratio · brachycephaly"}
                  </div>
                </div>
                <span className="formula-chip" aria-label="Formula">
                  <span className="label">f(x)</span>
                  {tab==="cvai"?"|A−B| ÷ max(A,B) × 100":"(M/L ÷ A/P) × 100"}
                </span>
              </div>
              <div role="tablist" aria-label="Calculator type" className="modeswitch" onKeyDown={handleTabKey}>
                {[
                  {id:"cvai",label:"Plagiocephaly",sub:"CVAI"},
                  {id:"cr",  label:"Brachycephaly", sub:"Cephalic Ratio"},
                ].map(m=>(
                  <button key={m.id} id={`tab-${m.id}`} role="tab"
                          aria-selected={tab===m.id} aria-controls={`panel-${m.id}`}
                          onClick={()=>setTab(m.id)}>
                    {m.label}{" "}<span className="sub">{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="card-pad">
              <div id="panel-cvai" role="tabpanel" aria-labelledby="tab-cvai"
                   style={{display:tab==="cvai"?"flex":"none",flexDirection:"column",gap:10}}>
                <CvaiPanel a={cvaiA} setA={setCvaiA} b={cvaiB} setB={setCvaiB}
                           onCopy={showToast} onClear={clearAll} diagramStyle={tweaks.diagramStyle}/>
              </div>
              <div id="panel-cr" role="tabpanel" aria-labelledby="tab-cr"
                   style={{display:tab==="cr"?"flex":"none",flexDirection:"column",gap:10}}>
                <CrPanel ml={crMl} setMl={setCrMl} ap={crAp} setAp={setCrAp}
                         onCopy={showToast} onClear={clearAll} diagramStyle={tweaks.diagramStyle}/>
              </div>
            </div>
            <div style={{padding:"10px var(--pad-card) 12px",borderTop:"1px solid var(--border-soft)",
                         background:"var(--surface-2)",fontSize:11.5,color:"var(--ink-3)",lineHeight:1.6,
                         borderBottomLeftRadius:"var(--r-lg)",borderBottomRightRadius:"var(--r-lg)"}}>
              Measurements are saved locally on this device only. No data is transmitted.
            </div>
          </section>
        </div>
        <div className="col-stack">
          <SeverityTable/>
          <AgeGuidelines/>
        </div>
      </main>

      <footer>
        <a href="https://choa.org/cranialremolding" target="_blank" rel="noreferrer">choa.org/cranialremolding</a>
        <span>·</span>
        <span>© 2015 Children's Healthcare of Atlanta · ORTH 961942</span>
      </footer>

      <StickyResult {...sticky} onCopy={showToast}/>
      <TweaksPanel tweaks={tweaks} setTweak={setTweak}/>
    </>
  );
}
