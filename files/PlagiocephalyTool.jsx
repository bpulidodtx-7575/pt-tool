// CHOA Plagiocephaly Assessment Tool — Therapedia Edition
// CVAI formula: |A−B| / max(A,B) × 100  (official CHOA formula)
// No patient data stored or transmitted. Reference tool only.
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// Therapedia fonts: Bitter (display) + Nunito Sans (body) + JetBrains Mono (numbers)
if (typeof document !== "undefined") {
  [
    { rel:"preconnect", href:"https://fonts.googleapis.com" },
    { rel:"preconnect", href:"https://fonts.gstatic.com", crossOrigin:"anonymous" },
    { rel:"stylesheet", href:"https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,600;0,700;1,600;1,700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,500;6..12,600;6..12,700&family=JetBrains+Mono:wght@400;500;600&display=swap" },
  ].forEach(({ rel, href, crossOrigin }) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const el = document.createElement("link");
    el.rel = rel; el.href = href;
    if (crossOrigin) el.crossOrigin = crossOrigin;
    document.head.prepend(el);
  });
}

// ─── Therapedia Design System tokens ─────────────────────────────────────────
// Palette sampled directly from the Therapedia logo:
//   Thera blue   #0070BD — PT service color (this tool's primary)
//   Pedia orange #F08218 — CTA / action color
//   Red dot      #E11E15 — wordmark dot / emphasis
//   Cream bg     #FBF7F0 — warm off-white page
const GLOBAL_CSS = `
  /* ── Therapedia Design System tokens ──────────────────────────────────── */
  :root {
    /* Brand */
    --brand-blue:        #0070BD;
    --brand-blue-deep:   #00538C;
    --brand-blue-soft:   #D6EAF6;
    --brand-orange:      #F08218;
    --brand-orange-deep: #C7670C;
    --brand-orange-soft: #FCE6D0;
    --brand-red:         #E11E15;
    --brand-red-deep:    #B0140E;
    --brand-red-soft:    #FBD9D7;

    /* Fonts */
    --font-display: "Bookman Old Style","Bookman","Bitter",Georgia,"Times New Roman",serif;
    --font-sans:    "Nunito Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    --font-mono:    "JetBrains Mono",ui-monospace,Menlo,monospace;

    /* Neutrals (warm-cool blend) */
    --ink-900: #0E1B2B;
    --ink-700: #1F2F40;
    --ink-500: #4A5A6B;
    --ink-300: #8E9AA5;
    --ink-200: #C3CCD3;
    --ink-100: #E3E8EC;

    /* Page surfaces */
    --bg:        #FBF7F0;   /* cream — Therapedia default */
    --surface:   #FFFFFF;   /* paper */
    --surface-2: #F5EFE4;   /* warm tint */
    --surface-3: #EDE4D4;

    /* Semantic */
    --border:      var(--ink-200);
    --border-soft: var(--ink-100);
    --ink:   var(--ink-900);
    --ink-2: var(--ink-700);
    --ink-3: var(--ink-500);
    --ink-4: var(--ink-300);

    /* Accent = PT service blue (Physical Therapy — the discipline for plagiocephaly) */
    --accent:       var(--brand-blue);
    --accent-soft:  var(--brand-blue-soft);
    --accent-strong:var(--brand-blue-deep);
    --accent-ink:   #003A70;

    /* CTA = Therapedia orange */
    --cta:          var(--brand-orange);
    --cta-soft:     var(--brand-orange-soft);
    --cta-strong:   var(--brand-orange-deep);

    /* Clinical severity colors (medical reference — not brand) */
    --sev-1: #2E9D5B;
    --sev-2: #8a7200;
    --sev-3: #C7670C;
    --sev-4: #c04020;
    --sev-5: #B0140E;

    /* Shadows (warm-neutral per Therapedia system) */
    --shadow-card: 0 4px 12px rgba(14,27,43,.07), 0 2px 4px rgba(14,27,43,.04);
    --shadow-pop:  0 12px 28px rgba(14,27,43,.10), 0 4px 8px rgba(14,27,43,.05);

    /* Focus — 3px blue ring (WCAG AAA, clinical-first) */
    --focus: 0 0 0 3px rgba(0,112,189,.25), 0 0 0 1.5px rgba(0,112,189,.6);

    /* Radii */
    --r-xs:  4px;
    --r-sm:  8px;
    --r-md:  12px;
    --r-lg:  20px;
    --r-pill:999px;

    /* Card padding + gap */
    --pad-card:  28px;
    --gap-stack: 20px;
  }

  /* ── Dark mode — unofficial Therapedia dark ──────────────────────────── */
  @media (prefers-color-scheme: dark) {
    :root {
      --bg:        #080F1A;
      --surface:   #0C1625;
      --surface-2: #11203A;
      --surface-3: #172A4A;
      --border:      #1E3050;
      --border-soft: #162540;
      --ink:   #EBF0F5;
      --ink-2: #C8D4DD;
      --ink-3: #7A8F9E;
      --ink-4: #4A5E6E;
      --accent:       #3EA7E8;
      --accent-soft:  #0A2540;
      --accent-strong:#61BCE8;
      --accent-ink:   #A8D8F5;
      --cta:          #F08218;
      --cta-soft:     #3A1E00;
      --cta-strong:   #FFB460;
      --sev-1: #5ecc80; --sev-2: #d4b800;
      --sev-3: #E08820; --sev-4: #e06040; --sev-5: #d04030;
      --shadow-card: 0 4px 12px rgba(0,0,0,.40), 0 2px 4px rgba(0,0,0,.30);
      --shadow-pop:  0 12px 28px rgba(0,0,0,.55), 0 4px 8px rgba(0,0,0,.35);
      --focus: 0 0 0 3px rgba(62,167,232,.30), 0 0 0 1.5px rgba(62,167,232,.55);
    }
  }

  /* ── Resets ──────────────────────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    background: var(--bg);
    color: var(--ink-2);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    font-feature-settings: "kern","liga";
  }

  /* Headings use Bitter (Therapedia display face) */
  h1, h2, h3 {
    font-family: var(--font-display);
    font-weight: 600;
    letter-spacing: -.01em;
    color: var(--ink);
    text-wrap: balance;
  }

  button { font-family: var(--font-sans); }
  a { color: var(--accent); text-decoration: none; font-weight: 600; }
  a:hover { color: var(--accent-strong); text-decoration: underline; text-underline-offset: 3px; }
  a:focus-visible { outline: none; box-shadow: var(--focus); border-radius: 3px; }
  ::selection { background: color-mix(in srgb, var(--accent) 20%, transparent); }

  /* ── Skip nav ────────────────────────────────────────────────────────── */
  .skip-nav {
    position: absolute; left: -9999px; top: 8px; z-index: 999;
    padding: 8px 14px; background: var(--ink); color: var(--bg);
    border-radius: var(--r-sm); font-weight: 700; font-size: 13px;
  }
  .skip-nav:focus { left: 8px; outline: none; box-shadow: var(--focus); }

  /* ── App bar ─────────────────────────────────────────────────────────── */
  .appbar {
    position: sticky; top: 0; z-index: 50;
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter: saturate(180%) blur(12px);
    -webkit-backdrop-filter: saturate(180%) blur(12px);
    border-bottom: 1px solid var(--border-soft);
    transition: box-shadow 200ms;
  }
  .appbar.is-scrolled { box-shadow: var(--shadow-card); }
  .appbar-inner {
    max-width: 1200px; margin: 0 auto; padding: 12px 32px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }

  /* Therapedia wordmark treatment */
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-logo {
    height: 36px; width: auto; display: block;
    flex-shrink: 0;
  }
  .brand-divider {
    width: 1px; height: 28px; background: var(--border); flex-shrink: 0;
  }
  .brand-text { display: flex; flex-direction: column; line-height: 1.15; }
  .brand-name {
    font-family: var(--font-display);
    font-size: 15px; font-weight: 700;
    color: var(--ink); letter-spacing: -.01em;
    display: flex; align-items: baseline; gap: 0;
  }
  .brand-name .thera  { color: var(--brand-blue); }
  .brand-name .pedia  { color: var(--brand-orange); font-style: italic; }
  .brand-name .dot    { color: var(--brand-red); }
  .brand-meta { font-size: 11px; color: var(--ink-3); font-weight: 600; text-transform: uppercase; letter-spacing: .07em; margin-top: 2px; }

  .status-pill {
    display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px;
    border-radius: var(--r-pill); background: var(--surface-2);
    border: 1px solid var(--border-soft);
    font-size: 11.5px; color: var(--ink-3); font-weight: 600;
  }

  /* ── Main layout ─────────────────────────────────────────────────────── */
  main {
    max-width: 1200px; margin: 0 auto; padding: 36px 32px 96px;
    display: grid; grid-template-columns: minmax(0,1.5fr) minmax(0,1fr);
    gap: 32px; align-items: start;
  }
  @media (max-width: 960px) { main { grid-template-columns:1fr; padding:24px 20px 96px; gap:24px; } }
  .col-stack { display: flex; flex-direction: column; gap: var(--gap-stack); min-width: 0; }

  /* ── Cards ───────────────────────────────────────────────────────────── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border-soft);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-card);
  }
  .card-pad { padding: var(--pad-card); }
  .card-head {
    padding: 22px var(--pad-card) 16px;
    display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
  }
  .card-title {
    font-family: var(--font-display);
    font-size: 17px; font-weight: 700; color: var(--ink); letter-spacing: -.01em;
  }
  .card-meta { font-size: 11.5px; color: var(--ink-3); font-weight: 600; font-family: var(--font-mono); }
  .card-head-flex {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap;
  }
  .eyebrow {
    font-size: 11px; text-transform: uppercase; letter-spacing: .1em;
    font-weight: 700; color: var(--ink-3);
  }

  /* ── Segmented tab switcher ──────────────────────────────────────────── */
  .modeswitch {
    display: inline-grid; grid-template-columns: 1fr 1fr;
    background: var(--surface-2);
    border: 1px solid var(--border-soft);
    border-radius: var(--r-pill); padding: 4px;
    width: 100%; max-width: 460px;
  }
  .modeswitch button {
    background: transparent; border: none; cursor: pointer;
    border-radius: var(--r-pill); padding: 10px 16px;
    font-size: 13px; font-weight: 700; color: var(--ink-3);
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
    font-family: var(--font-sans);
    transition: background 150ms, color 150ms, box-shadow 150ms;
  }
  .modeswitch button .sub {
    font-size: 10px; font-weight: 700; color: var(--ink-4);
    letter-spacing: .06em; text-transform: uppercase;
  }
  .modeswitch button[aria-selected="true"] {
    background: var(--surface); color: var(--ink);
    box-shadow: 0 1px 4px rgba(14,27,43,.10), 0 1px 1px rgba(14,27,43,.06);
  }
  .modeswitch button[aria-selected="true"] .sub { color: var(--accent); }
  .modeswitch button:focus-visible { outline: none; box-shadow: var(--focus); }
  @media (hover: none) and (pointer: coarse) { .modeswitch button { padding: 14px 16px; } }

  /* ── Formula chip ────────────────────────────────────────────────────── */
  .formula-chip {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 7px 12px 7px 10px;
    background: var(--accent-soft);
    border: 1px solid color-mix(in srgb, var(--accent) 22%, var(--border-soft));
    border-radius: var(--r-sm);
    font-family: var(--font-mono); font-size: 12.5px;
    color: var(--accent-ink); font-weight: 500;
  }
  .formula-chip .label {
    font-family: var(--font-sans); font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: .1em;
    color: color-mix(in srgb, var(--accent-ink) 65%, transparent);
  }

  /* ── Inputs ──────────────────────────────────────────────────────────── */
  .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 480px) { .input-grid { grid-template-columns: 1fr; gap: 12px; } }

  .field { display: flex; flex-direction: column; gap: 5px; }
  .field-label {
    display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
    font-size: 13px; font-weight: 700; color: var(--ink-2);
  }
  .field-label .hint { font-size: 11.5px; font-weight: 600; color: var(--ink-3); }
  .field-label .swatch {
    width: 8px; height: 8px; border-radius: 3px;
    display: inline-block; vertical-align: middle; margin-right: 6px;
  }
  .field-range {
    font-size: 11.5px; color: var(--ink-4);
    font-family: var(--font-mono); font-weight: 500;
  }
  .field-warning {
    font-size: 12px; color: var(--sev-3); font-weight: 700; line-height: 1.4; margin-top: 2px;
  }

  .input-wrap { position: relative; }
  .input-wrap input {
    width: 100%; padding: 13px 44px 13px 14px;
    font-family: var(--font-mono); font-size: 18px; font-weight: 600;
    color: var(--ink); background: var(--surface);
    border: 1.5px solid var(--border); border-radius: var(--r-md);
    outline: none; min-height: 50px; font-variant-numeric: tabular-nums;
    -moz-appearance: textfield;
    transition: border-color 150ms, box-shadow 150ms;
  }
  .input-wrap input::-webkit-inner-spin-button,
  .input-wrap input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .input-wrap input::placeholder { color: var(--ink-4); font-weight: 400; }
  .input-wrap input:hover { border-color: var(--accent); }
  .input-wrap input:focus-visible {
    border-color: var(--accent);
    box-shadow: var(--focus);
    outline: none;
  }
  .input-wrap .unit {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    font-family: var(--font-mono); font-size: 12px; color: var(--ink-3);
    pointer-events: none; font-weight: 600;
  }
  @media (hover: none) and (pointer: coarse) {
    .input-wrap input { min-height: 56px; font-size: 19px; padding: 15px 46px 15px 16px; }
  }

  /* ── Measurement hint ────────────────────────────────────────────────── */
  .measure-note {
    font-size: 13px; color: var(--ink-3); line-height: 1.55;
    background: var(--surface-2);
    border: 1px solid var(--border-soft);
    border-radius: var(--r-sm); padding: 10px 13px;
    display: flex; align-items: flex-start; gap: 8px;
  }

  /* ── Diagrams ────────────────────────────────────────────────────────── */
  .diagram-frame {
    display: flex; justify-content: center; align-items: center;
    padding: 20px; background: var(--surface-2);
    border: 1px solid var(--border-soft); border-radius: var(--r-md);
  }
  .diagram-frame svg { width: 100%; max-width: 280px; height: auto; }

  /* ── Result card ─────────────────────────────────────────────────────── */
  .result-empty {
    margin-top: 4px; padding: 28px 20px; text-align: center;
    border: 1.5px dashed var(--border); border-radius: var(--r-md);
    background: var(--surface-2); color: var(--ink-3);
    font-size: 13.5px; font-weight: 500;
  }

  .result {
    margin-top: 6px;
    border: 1px solid var(--border-soft);
    border-radius: var(--r-lg);
    background: var(--surface);
    box-shadow: var(--shadow-card);
    position: relative; overflow: hidden;
    transition: box-shadow 200ms;
  }
  .result:hover { box-shadow: var(--shadow-pop); }
  .result::before {
    content:""; position:absolute; left:0; top:0; bottom:0; width:5px;
    background:var(--sev-color, var(--accent));
  }

  .result-head { padding:22px 22px 18px; display:flex; flex-direction:column; gap:6px; }
  .result-eyebrow-row {
    display:flex; align-items:center; gap:10px; font-size:11px;
    text-transform:uppercase; letter-spacing:.09em; font-weight:700; color:var(--ink-3);
  }
  .result-eyebrow-row .sev-dot {
    width:8px; height:8px; border-radius:50%; background:var(--sev-color); display:inline-block;
  }
  .result-eyebrow-row .sev-label { color:var(--ink-2); }

  .result-number { display:flex; align-items:baseline; gap:12px; margin-top:4px; }
  .result-number .value {
    font-family:var(--font-mono); font-size:56px; font-weight:600;
    letter-spacing:-.03em; color:var(--ink); line-height:1;
    font-variant-numeric:tabular-nums;
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
    font-family:var(--font-display); font-weight:700; letter-spacing:-.01em;
  }

  .result-body {
    padding:16px 22px 22px; border-top:1px solid var(--border-soft);
    display:flex; flex-direction:column; gap:14px;
  }
  .result-section { display:flex; flex-direction:column; gap:5px; }
  .result-section h3 {
    font-size:10.5px; text-transform:uppercase; letter-spacing:.1em;
    color:var(--ink-3); font-weight:700; font-family:var(--font-sans);
  }
  .result-section p  { font-size:14px; color:var(--ink-2); line-height:1.6; }
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
    border-radius:0 0 var(--r-lg) var(--r-lg);
    justify-content:flex-end;
  }
  @media (max-width: 480px) {
    .result-actions { flex-direction:column-reverse; }
    .result-actions > * { width:100%; justify-content:center; }
  }

  /* ── Buttons ─────────────────────────────────────────────────────────── */
  .btn {
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:10px 20px; border-radius:var(--r-pill);
    font-size:13.5px; font-weight:700; font-family:var(--font-sans);
    cursor:pointer; border:none; line-height:1;
    touch-action:manipulation; -webkit-tap-highlight-color:transparent;
    min-height:42px; white-space:nowrap;
    transition: background 150ms, color 150ms, box-shadow 150ms, transform 100ms;
  }
  .btn:focus-visible { outline:none; box-shadow:var(--focus); }
  .btn:active { transform:scale(.98); }
  .btn-primary {
    background:var(--cta); color:#fff;
    box-shadow: 0 4px 14px -4px rgba(240,130,24,.50);
  }
  .btn-primary:hover {
    background:var(--cta-strong);
    box-shadow: 0 6px 20px -4px rgba(240,130,24,.55);
    transform: translateY(-1px);
  }
  .btn-primary:active { transform:scale(.98); box-shadow:none; }
  .btn-primary.copied { background:var(--sev-1); box-shadow:none; }
  .btn-ghost {
    background:var(--surface); color:var(--ink-2);
    border:1.5px solid var(--border); box-shadow:var(--sh-1);
  }
  .btn-ghost:hover {
    background:var(--surface-2); border-color:var(--accent); color:var(--ink);
    transform: translateY(-1px);
  }
  .btn-ghost:active { transform:scale(.98); }
  @media (hover: none) and (pointer: coarse) { .btn { min-height:48px; padding:13px 20px; } }

  /* ── Alert ───────────────────────────────────────────────────────────── */
  .alert {
    margin-top:4px; padding:12px 16px; border-radius:var(--r-md);
    background:color-mix(in srgb,var(--sev-3) 8%,var(--surface));
    border:1px solid color-mix(in srgb,var(--sev-3) 28%,var(--border));
    color:var(--sev-4); font-size:13.5px; font-weight:600;
    display:flex; align-items:flex-start; gap:10px;
  }

  /* ── Severity reference table ────────────────────────────────────────── */
  .table-scroll { overflow-x:auto; }
  .table-scroll:focus-visible { outline:none; box-shadow:var(--focus); }
  .sev-table { width:100%; border-collapse:collapse; font-size:13px; }
  .sev-table th {
    text-align:left; font-size:10px; text-transform:uppercase;
    letter-spacing:.1em; font-weight:700; color:var(--ink-3);
    padding:10px 14px; background:var(--surface-2);
    border-bottom:1px solid var(--border-soft);
    font-family:var(--font-sans);
  }
  .sev-table th:first-child { padding-left:var(--pad-card); }
  .sev-table th:last-child  { padding-right:var(--pad-card); }
  .sev-table td { padding:13px 14px; vertical-align:top; border-bottom:1px solid var(--border-soft); }
  .sev-table td:first-child { padding-left:var(--pad-card); }
  .sev-table td:last-child  { padding-right:var(--pad-card); }
  .sev-table tr:last-child td { border-bottom:none; }
  .sev-table tr:hover td { background:color-mix(in srgb,var(--surface-2) 55%,var(--surface)); }
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

  /* ── Accordion ───────────────────────────────────────────────────────── */
  .accordion-toggle {
    width:100%; background:transparent; border:none; cursor:pointer;
    padding:20px var(--pad-card);
    display:flex; align-items:center; justify-content:space-between;
    text-align:left; font-family:var(--font-sans);
    border-radius:var(--r-lg);
    transition: background 150ms;
  }
  .accordion-toggle:hover { background:var(--surface-2); }
  .accordion-toggle:focus-visible { outline:none; box-shadow:inset 0 0 0 2px var(--accent); border-radius:var(--r-lg); }
  .accordion-toggle .chev { color:var(--ink-3); }
  @media (prefers-reduced-motion: no-preference) {
    .accordion-toggle .chev { transition:transform 200ms; }
  }
  .accordion-toggle[aria-expanded="true"] .chev { transform:rotate(180deg); }
  .accordion-toggle[aria-expanded="true"] { background:var(--surface-2); border-radius:var(--r-lg) var(--r-lg) 0 0; }

  .accordion-body {
    padding:0 var(--pad-card) var(--pad-card);
    border-top:1px solid var(--border-soft);
    display:flex; flex-direction:column; gap:16px;
  }
  .age-block { display:grid; grid-template-columns:140px 1fr; gap:18px; padding-top:18px; }
  @media (max-width: 600px) { .age-block { grid-template-columns:1fr; gap:6px; } }
  .age-tag {
    font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em;
    color:var(--ink-3); display:flex; align-items:flex-start; gap:8px; padding-top:2px;
  }
  .age-tag .dot { width:8px; height:8px; border-radius:50%; background:var(--accent); margin-top:4px; flex-shrink:0; }
  .age-content { font-size:13.5px; color:var(--ink-2); line-height:1.6; display:flex; flex-direction:column; gap:10px; }
  .age-content strong { color:var(--ink); font-weight:700; }
  .age-content ul { list-style:none; display:flex; flex-direction:column; gap:6px; margin-top:2px; }
  .age-content li { position:relative; padding-left:14px; }
  .age-content li::before {
    content:""; position:absolute; left:0; top:9px;
    width:4px; height:4px; background:var(--ink-4); border-radius:50%;
  }
  .cond-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:4px; }
  @media (max-width: 600px) { .cond-grid { grid-template-columns:1fr; } }
  .cond-card {
    border:1px solid var(--border-soft); border-radius:var(--r-md);
    padding:14px 16px; background:var(--surface-2);
  }
  .cond-card h5 { font-size:13.5px; font-weight:700; color:var(--ink); margin-bottom:8px; }
  .cond-card .eyebrow { margin-top:10px; margin-bottom:4px; }
  .cond-card ul { list-style:none; display:flex; flex-direction:column; gap:4px; }
  .cond-card li { font-size:12.5px; color:var(--ink-2); padding-left:14px; position:relative; }
  .cond-card li::before {
    content:""; position:absolute; left:0; top:8px;
    width:4px; height:4px; background:var(--ink-4); border-radius:50%;
  }

  /* ── Toast ───────────────────────────────────────────────────────────── */
  .toast {
    position:fixed; top:80px; left:50%;
    transform:translateX(-50%) translateY(0);
    background:var(--ink); color:var(--bg);
    padding:10px 18px; border-radius:var(--r-pill);
    font-size:13px; font-weight:700; box-shadow:var(--shadow-pop);
    z-index:100; pointer-events:none;
    display:flex; align-items:center; gap:8px;
  }
  .toast.hidden { opacity:0; transform:translateX(-50%) translateY(-6px); }
  @media (prefers-reduced-motion: no-preference) {
    .toast { transition:opacity 0.2s, transform 0.2s; }
  }

  /* ── Sticky mobile result bar ────────────────────────────────────────── */
  .sticky-result {
    display:none; position:fixed; left:0; right:0; bottom:0;
    background:var(--surface);
    border-top:3px solid var(--accent);
    box-shadow:0 -4px 24px rgba(14,27,43,.10);
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

  /* ── Legal disclaimer modal ──────────────────────────────────────────── */
  .disc-overlay {
    position:fixed; inset:0; z-index:999;
    background:rgba(8,15,26,.80);
    display:flex; align-items:center; justify-content:center;
    padding:20px;
  }
  .disc-modal {
    background:var(--surface); border-radius:var(--r-lg);
    max-width:560px; width:100%; box-shadow:var(--shadow-pop); overflow:hidden;
  }
  .disc-head {
    background:color-mix(in srgb,var(--sev-4) 7%,var(--surface));
    border-bottom:1px solid color-mix(in srgb,var(--sev-4) 16%,var(--border));
    padding:24px 28px 20px;
    display:flex; align-items:flex-start; gap:14px;
  }
  .disc-head-icon { color:var(--sev-4); flex-shrink:0; margin-top:2px; }
  .disc-head h1 {
    font-family:var(--font-display);
    font-size:18px; font-weight:700; color:var(--ink); line-height:1.2;
  }
  .disc-head .sub { font-size:12.5px; color:var(--ink-3); font-weight:600; margin-top:3px; }
  .disc-body { padding:24px 28px; display:flex; flex-direction:column; gap:16px; }
  .disc-body p { font-size:14px; color:var(--ink-2); line-height:1.65; }
  .disc-list {
    list-style:none; display:flex; flex-direction:column; gap:10px;
    padding:16px; background:var(--surface-2);
    border:1px solid var(--border-soft); border-radius:var(--r-md);
  }
  .disc-list li {
    font-size:13.5px; color:var(--ink-2); line-height:1.5;
    position:relative; padding-left:18px;
  }
  .disc-list li::before {
    content:""; position:absolute; left:0; top:8px;
    width:5px; height:5px; background:var(--sev-3); border-radius:50%;
  }
  .disc-foot {
    padding:20px 28px; border-top:1px solid var(--border-soft);
    background:var(--surface-2); display:flex; flex-direction:column; gap:14px;
  }
  .disc-pdf {
    font-size:13px; color:var(--accent); font-weight:700;
    display:inline-flex; align-items:center; gap:6px;
  }
  .disc-cta {
    width:100%; padding:14px; font-size:15px; font-weight:800;
    background:var(--cta); color:#fff; border:none;
    border-radius:var(--r-pill); cursor:pointer; font-family:var(--font-sans);
    min-height:52px; letter-spacing:.01em;
    box-shadow: 0 4px 16px -4px rgba(240,130,24,.55);
    transition: background 150ms, transform 100ms, box-shadow 150ms;
  }
  .disc-cta:hover {
    background:var(--cta-strong);
    box-shadow: 0 6px 22px -4px rgba(240,130,24,.60);
    transform:translateY(-1px);
  }
  .disc-cta:active { transform:scale(.98); box-shadow:none; }
  .disc-cta:focus-visible { outline:none; box-shadow:var(--focus); }

  /* ── Card footer strip ───────────────────────────────────────────────── */
  .card-footer-strip {
    padding:10px var(--pad-card) 12px;
    border-top:1px solid var(--border-soft);
    background:var(--surface-2);
    font-size:11.5px; color:var(--ink-3); line-height:1.6;
    border-bottom-left-radius:var(--r-lg);
    border-bottom-right-radius:var(--r-lg);
    display:flex; align-items:center; gap:6px;
  }

  .sr-only {
    position:absolute; width:1px; height:1px; padding:0; margin:-1px;
    overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;
  }

  /* ── Page footer ─────────────────────────────────────────────────────── */
  footer {
    text-align:center; padding:20px 32px 36px;
    font-size:12px; color:var(--ink-3);
    display:flex; justify-content:center; align-items:center;
    gap:8px; flex-wrap:wrap; max-width:1200px; margin:0 auto;
  }
  footer a { font-weight:600; }
  .footer-sep { color:var(--border); }
`;

if (typeof document !== "undefined") {
  if (!document.getElementById("choa-plagio-styles")) {
    const el = document.createElement("style");
    el.id = "choa-plagio-styles";
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = ({ size=16, d, children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true" {...p}>
    {d ? <path d={d}/> : children}
  </svg>
);
const IcCopy     = p => <Ic {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></Ic>;
const IcCheck    = p => <Ic {...p} d="M20 6 9 17l-5-5"/>;
const IcRefresh  = p => <Ic {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></Ic>;
const IcAlert    = p => <Ic {...p}><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></Ic>;
const IcChevron  = p => <Ic {...p} d="m6 9 6 6 6-6"/>;
const IcShield   = p => <Ic {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>;
const IcExternal = p => <Ic {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></Ic>;

// ─── Clinical ranges (mm, 0–24 month infants) ─────────────────────────────────
const RANGES = {
  diagA: { min: 80, max: 200, label: "Typical: 80–200 mm" },
  diagB: { min: 80, max: 200, label: "Typical: 80–200 mm" },
  crMl:  { min: 60, max: 180, label: "Typical: 60–180 mm" },
  crAp:  { min: 80, max: 200, label: "Typical: 80–200 mm" },
};

// ─── Logic ────────────────────────────────────────────────────────────────────
function validateMeasurement(raw, label, range) {
  if (raw === "" || raw == null) return { ok:false, value:null, error:null, empty:true };
  const n = parseFloat(raw);
  if (!Number.isFinite(n))  return { ok:false, value:null, error:`${label} must be a valid number.` };
  if (n <= 0)               return { ok:false, value:null, error:`${label} must be greater than zero.` };
  const warning = (range && (n < range.min || n > range.max))
    ? `Outside typical range (${range.min}–${range.max} mm). Confirm if correct.`
    : null;
  return { ok:true, value:n, error:null, empty:false, warning };
}

const toTenths = v => Math.round(v * 10);

// CVAI = |A−B| / max(A,B) × 100  (official CHOA formula)
function processCvai(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
  const a10 = toTenths(a), b10 = toTenths(b);
  const diff = Math.abs(a10 - b10), max = Math.max(a10, b10);
  if (max === 0) return null;
  let sevIdx;
  if      (diff * 200 <  7 * max)  sevIdx = 0;
  else if (diff *  16 <      max)  sevIdx = 1;
  else if (diff * 400 < 35 * max)  sevIdx = 2;
  else if (diff * 100 <= 11 * max) sevIdx = 3;
  else                              sevIdx = 4;
  const displayCvai = (diff / max) * 100;
  if (!Number.isFinite(displayCvai)) return null;
  return { displayCvai, sevIdx };
}

function processCr(ml, ap) {
  if (!Number.isFinite(ml) || !Number.isFinite(ap) || ml <= 0 || ap <= 0) return null;
  const ml10 = toTenths(ml), ap10 = toTenths(ap);
  if (ap10 === 0) return null;
  const cr100 = ml10 * 100;
  let key;
  if      (cr100 >  90 * ap10) key = "ortho";
  else if (cr100 >= 85 * ap10) key = "watch";
  else                          key = "ok";
  const displayCr = (ml10 / ap10) * 100;
  if (!Number.isFinite(displayCr)) return null;
  return { key, displayCr };
}

// ─── Reference data ───────────────────────────────────────────────────────────
const SEVERITY = [
  { level:1, range:"< 3.5",       rangeFull:"CVAI < 3.5%",       label:"Within normal limits",  sevVar:"var(--sev-1)",
    presentation:["All symmetry within normal limits"],
    recommendation:"No treatment required.", referral:"No referral indicated" },
  { level:2, range:"3.5 – 6.25",  rangeFull:"CVAI 3.5 – 6.25%",  label:"Mild asymmetry",        sevVar:"var(--sev-2)",
    presentation:["Minimal asymmetry in one posterior quadrant","No secondary changes"],
    recommendation:"Repositioning program.", referral:"Repositioning program — no orthosis at this stage" },
  { level:3, range:"6.25 – 8.75", rangeFull:"CVAI 6.25 – 8.75%", label:"Moderate asymmetry",    sevVar:"var(--sev-3)",
    presentation:["Two-quadrant involvement","Moderate to severe posterior flattening","Minimal ear shift and/or anterior involvement"],
    recommendation:"Conservative treatment — repositioning or cranial remolding orthosis based on age and history.",
    referral:"Consider cranial remolding orthosis (age and history dependent)" },
  { level:4, range:"8.75 – 11.0", rangeFull:"CVAI 8.75 – 11.0%", label:"Severe asymmetry",      sevVar:"var(--sev-4)",
    presentation:["Two- or three-quadrant involvement","Severe posterior flattening","Moderate ear shift","Anterior orbit asymmetry"],
    recommendation:"Cranial remolding orthosis.", referral:"Cranial remolding orthosis recommended" },
  { level:5, range:"> 11.0",      rangeFull:"CVAI > 11.0%",       label:"Very severe asymmetry", sevVar:"var(--sev-5)",
    presentation:["Three- or four-quadrant involvement","Severe posterior flattening","Severe ear shift","Anterior involvement including orbit and cheek asymmetry"],
    recommendation:"Cranial remolding orthosis.", referral:"Cranial remolding orthosis strongly recommended" },
];

const CR_LEVELS = {
  ortho: { label:"Orthotic evaluation recommended", short:"Orthotic eval", rangeFull:"CR > 90",    sevVar:"var(--sev-4)",
           detail:"Per CHOA guideline: refer for cranial remolding orthosis evaluation.",
           presentation:["Bilateral forehead bossing","Increased posterior vault","Bilateral protrusion of parietal bone above ears"] },
  watch: { label:"Borderline — monitor closely",    short:"Monitor",       rangeFull:"CR 85 – 90", sevVar:"var(--sev-3)",
           detail:"Reassess at next visit. Document trajectory. No immediate orthotic indicated per CHOA threshold (>90)." },
  ok:    { label:"Within normal range",             short:"Normal",        rangeFull:"CR ≤ 85",     sevVar:"var(--sev-1)",
           detail:"Continue routine developmental monitoring." },
};

const CHOA_PDF = "https://pediatricapta.org/special-interest-groups/HB/ORTH_961942_PlagiocephalyScale_BWInfo.pdf";

// ─── EMR note builders ────────────────────────────────────────────────────────
function fmtTimestamp() {
  const n = new Date();
  return `${n.toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"})}    ${n.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:true})}`;
}
function buildCvaiNote(cvai, sev, rawA, rawB) {
  return [
    "PLAGIOCEPHALY ASSESSMENT — Therapedia Physical Therapy", fmtTimestamp(), "",
    `CVAI: ${cvai.toFixed(2)}%`,
    `Severity: Level ${sev.level} — ${sev.label}  (range: ${sev.rangeFull})`, "",
    "Measurements (caliper):",
    `  Diagonal A (longer):  ${parseFloat(rawA).toFixed(1)} mm`,
    `  Diagonal B (shorter): ${parseFloat(rawB).toFixed(1)} mm`, "",
    "Clinical Presentation:", ...sev.presentation.map(p => `  - ${p}`), "",
    `Recommendation: ${sev.recommendation}`,
    `Referral: ${sev.referral}`, "",
    "Source: CHOA Plagiocephaly Severity Scale — choa.org/cranialremolding",
    "Note: This is a reference tool, not a diagnostic device.",
  ].join("\n");
}
function buildCrNote(cr, res, rawMl, rawAp) {
  const ref = res.key === "ortho" ? "Yes — orthotic evaluation recommended"
            : res.key === "watch" ? "Monitor — reassess at next visit"
            : "No — within normal range";
  return [
    "BRACHYCEPHALY ASSESSMENT — Therapedia Physical Therapy", fmtTimestamp(), "",
    `Cephalic Ratio: ${cr.toFixed(1)}%`,
    `Assessment: ${res.label}  (range: ${res.rangeFull})`, "",
    "Measurements (caliper):",
    `  Medial-Lateral (M/L):     ${parseFloat(rawMl).toFixed(1)} mm`,
    `  Anterior-Posterior (A/P): ${parseFloat(rawAp).toFixed(1)} mm`, "",
    `Recommendation: ${res.detail}`,
    `Referral: ${ref}`, "",
    "Source: CHOA Plagiocephaly Severity Scale — choa.org/cranialremolding",
    "Note: This is a reference tool, not a diagnostic device.",
  ].join("\n");
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(false);
  const t = useRef(null);
  const copy = useCallback(async text => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const el = Object.assign(document.createElement("textarea"), { value:text, style:"position:fixed;top:-9999px;opacity:0" });
        document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
      }
      setCopied(true);
      clearTimeout(t.current);
      t.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) { console.warn("Clipboard unavailable:", err.message); }
  }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  return [copied, copy];
}

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = document.querySelector('.tp-scroll-host') || window;
    const handler = () => setScrolled((el === window ? window.scrollY : el.scrollTop) > threshold);
    el.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => el.removeEventListener('scroll', handler);
  }, [threshold]);
  return scrolled;
}

// ─── Diagrams ─────────────────────────────────────────────────────────────────
function DiagramCVAI() {
  return (
    <div className="diagram-frame" role="img"
      aria-label="Top-down skull view: Diagonal A (longer, solid) and Diagonal B (shorter, dashed), both at 30° from nose centre.">
      <svg viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg">
        <line x1="140" y1="20" x2="140" y2="200" stroke="var(--border-soft)" strokeWidth="0.75" strokeDasharray="2 3"/>
        <line x1="40" y1="110" x2="240" y2="110" stroke="var(--border-soft)" strokeWidth="0.75" strokeDasharray="2 3"/>
        <ellipse cx="140" cy="110" rx="100" ry="86" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.5"/>
        <path d="M134 25 Q140 19 146 25" fill="none" stroke="var(--ink-2)" strokeWidth="1.5"/>
        <rect x="36"  y="100" width="8" height="20" rx="3" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.25"/>
        <rect x="236" y="100" width="8" height="20" rx="3" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.25"/>
        <line x1="68" y1="48" x2="218" y2="180" stroke="var(--brand-blue)" strokeWidth="2"/>
        <circle cx="68"  cy="48"  r="4" fill="var(--brand-blue)"/>
        <circle cx="218" cy="180" r="4" fill="var(--brand-blue)"/>
        <line x1="212" y1="48" x2="76" y2="172" stroke="var(--ink-3)" strokeWidth="1.75" strokeDasharray="4 3"/>
        <circle cx="212" cy="48"  r="4" fill="var(--ink-3)"/>
        <circle cx="76"  cy="172" r="4" fill="var(--ink-3)"/>
        <text x="50"  y="42"  fontSize="11" fontWeight="700" fill="var(--brand-blue)"  fontFamily="var(--font-mono)">A</text>
        <text x="222" y="44"  fontSize="11" fontWeight="600" fill="var(--ink-3)"       fontFamily="var(--font-mono)">B</text>
        <text x="140" y="214" fontSize="9"  fill="var(--ink-3)" textAnchor="middle"    fontFamily="var(--font-mono)">A = longer · B = shorter · 30° from nose</text>
      </svg>
    </div>
  );
}

function DiagramCR() {
  return (
    <div className="diagram-frame" role="img"
      aria-label="Top-down skull view: M/L width (horizontal) and A/P length (vertical).">
      <svg viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg">
        <line x1="140" y1="14"  x2="140" y2="206" stroke="var(--border-soft)" strokeWidth="0.75" strokeDasharray="2 3"/>
        <line x1="32"  y1="110" x2="248" y2="110" stroke="var(--border-soft)" strokeWidth="0.75" strokeDasharray="2 3"/>
        <ellipse cx="140" cy="110" rx="100" ry="86" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.5"/>
        <path d="M134 25 Q140 19 146 25" fill="none" stroke="var(--ink-2)" strokeWidth="1.5"/>
        <rect x="36"  y="100" width="8" height="20" rx="3" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.25"/>
        <rect x="236" y="100" width="8" height="20" rx="3" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.25"/>
        <line x1="46" y1="110" x2="234" y2="110" stroke="var(--brand-blue)" strokeWidth="2"/>
        <polygon points="46,110 56,105 56,115"    fill="var(--brand-blue)"/>
        <polygon points="234,110 224,105 224,115" fill="var(--brand-blue)"/>
        <line x1="140" y1="28" x2="140" y2="192" stroke="var(--ink-3)" strokeWidth="2" strokeDasharray="4 3"/>
        <polygon points="140,28 135,38 145,38"    fill="var(--ink-3)"/>
        <polygon points="140,192 135,182 145,182" fill="var(--ink-3)"/>
        <text x="14"  y="114" fontSize="11" fontWeight="700" fill="var(--brand-blue)" fontFamily="var(--font-mono)">M/L</text>
        <text x="148" y="22"  fontSize="11" fontWeight="600" fill="var(--ink-3)"      fontFamily="var(--font-mono)">A/P</text>
        <text x="140" y="214" fontSize="9"  fill="var(--ink-3)" textAnchor="middle"   fontFamily="var(--font-mono)">M/L = medial-lateral · A/P = anterior-posterior</text>
      </svg>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────
function Toast({ visible }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={`toast${visible ? "" : " hidden"}`}>
      <IcCheck size={14}/><span>Copied to clipboard</span>
    </div>
  );
}

function LegalDisclaimer({ onDismiss }) {
  const btnRef = useRef(null);
  useEffect(() => { btnRef.current?.focus(); }, []);
  return (
    <div className="disc-overlay" role="dialog" aria-modal="true"
         aria-labelledby="disc-h" aria-describedby="disc-body">
      <div className="disc-modal">
        <div className="disc-head">
          <span className="disc-head-icon" aria-hidden="true"><IcShield size={26}/></span>
          <div>
            <h1 id="disc-h">Reference Tool — Not a Diagnostic Device</h1>
            <div className="sub">Read before continuing</div>
          </div>
        </div>
        <div className="disc-body" id="disc-body">
          <p>
            This tool is based on the official <strong>CHOA Plagiocephaly Severity Scale</strong>.
            It is <strong style={{color:"var(--sev-4)"}}>NOT a diagnostic device</strong> and must not
            replace clinical judgment.
          </p>
          <ul className="disc-list" role="list">
            <li>Use as a reference only — not for diagnosis or treatment decisions</li>
            <li>Consult the official CHOA scale and a licensed clinician for all clinical decisions</li>
            <li>No patient data is stored, transmitted, or retained — measurements are session-only</li>
            <li>Results are examples only, not a substitute for qualified clinical assessment</li>
          </ul>
        </div>
        <div className="disc-foot">
          <a href={CHOA_PDF} target="_blank" rel="noopener noreferrer" className="disc-pdf"
             aria-label="Official CHOA Plagiocephaly Severity Scale PDF (opens in new tab)">
            <IcExternal size={14}/>Official CHOA Plagiocephaly Severity Scale PDF
          </a>
          <button ref={btnRef} className="disc-cta" onClick={onDismiss}
                  aria-label="Acknowledge disclaimer and continue to the reference tool">
            I understand — Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function NumberInput({ id, label, hint, rangeLabel, swatchVar, value, onChange, nextId }) {
  const handleKeyDown = e => {
    if (e.key === "Enter" && nextId) document.getElementById(nextId)?.focus();
  };
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
               value={value} onChange={e => onChange(e.target.value)}
               onKeyDown={handleKeyDown}
               placeholder="—" autoComplete="off"
               aria-label={`${label} in millimeters`}
               aria-describedby={rangeLabel ? `${id}-range` : undefined}/>
        <span className="unit" aria-hidden="true">mm</span>
      </div>
      {rangeLabel && <span id={`${id}-range`} className="field-range">{rangeLabel}</span>}
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

function ResultCard({ eyebrow, value, unit, rangeMain, rangeSub,
                      sevLabel, sevVar, recommendation, presentation,
                      copyText, onCopy, onClear }) {
  const [copied, copy] = useCopy();
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { ref.current.style.opacity="1"; ref.current.style.transition="none"; return; }
    ref.current.style.opacity = "0";
    requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.style.transition = "opacity 0.2s ease";
      ref.current.style.opacity = "1";
    });
  }, [value]);

  return (
    <div className="result" style={{"--sev-color":sevVar}} ref={ref}
         role="status" aria-live="polite" aria-atomic="true">
      <div className="result-head">
        <div className="result-eyebrow-row">
          <span className="sev-dot" aria-hidden="true"/>
          <span>{eyebrow}</span>
          <span style={{color:"var(--border)"}} aria-hidden="true">·</span>
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
          <h3>Recommendation</h3>
          <p>{recommendation}</p>
        </div>
        {presentation?.length > 0 && (
          <div className="result-section">
            <h3>Clinical presentation</h3>
            <ul>{presentation.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </div>
        )}
      </div>
      <div className="result-actions">
        <button className="btn btn-ghost" onClick={onClear}
                aria-label="Clear all measurements and start a new patient">
          <IcRefresh size={14}/>New patient
        </button>
        <button className={`btn btn-primary${copied ? " copied" : ""}`}
                onClick={() => { copy(copyText); onCopy(); }}
                aria-label={copied ? "Result copied to clipboard" : "Copy structured note for EMR"}>
          {copied ? <IcCheck size={14}/> : <IcCopy size={14}/>}
          {copied ? "Copied" : "Copy for EMR"}
        </button>
      </div>
    </div>
  );
}

// ─── Calculator panels ────────────────────────────────────────────────────────
function CvaiPanel({ a, setA, b, setB, onCopy, onClear }) {
  const vA = validateMeasurement(a, "Diagonal A", RANGES.diagA);
  const vB = validateMeasurement(b, "Diagonal B", RANGES.diagB);
  const bothEmpty = vA.empty && vB.empty;
  const anyEmpty  = vA.empty || vB.empty;
  const errorMsg  = (!vA.ok && !vA.empty) ? vA.error : (!vB.ok && !vB.empty) ? vB.error : null;
  const warnMsg   = !errorMsg ? (vA.warning || vB.warning) : null;
  const logicErr  = (!errorMsg && !anyEmpty && vA.ok && vB.ok && vA.value <= vB.value)
                    ? "Diagonal A should be greater than Diagonal B." : null;
  const result    = (!anyEmpty && !errorMsg && !logicErr) ? processCvai(vA.value, vB.value) : null;
  const sev       = result ? SEVERITY[result.sevIdx] : null;
  const cvai      = result?.displayCvai ?? null;
  const copyText  = useMemo(() => sev ? buildCvaiNote(cvai, sev, a, b) : "", [cvai, sev?.level, a, b]);

  return (
    <>
      <DiagramCVAI/>
      <div className="measure-note">
        <span aria-hidden="true">📐</span>
        <span>Measure at 30° from nose centre to posterior skull using calipers. A = longer diagonal.</span>
      </div>
      <div className="input-grid">
        <NumberInput id="cvai-a" label="Diagonal A" hint="longer"
                     rangeLabel={RANGES.diagA.label}
                     swatchVar="var(--brand-blue)" value={a} onChange={setA} nextId="cvai-b"/>
        <NumberInput id="cvai-b" label="Diagonal B" hint="shorter"
                     rangeLabel={RANGES.diagB.label}
                     swatchVar="var(--ink-3)" value={b} onChange={setB}/>
      </div>
      {warnMsg && <div className="field-warning" role="status" aria-live="polite">{warnMsg}</div>}
      {bothEmpty && <div className="result-empty">Enter both diagonal measurements to calculate CVAI</div>}
      {errorMsg && <AlertBox>{errorMsg}</AlertBox>}
      {logicErr && <AlertBox>{logicErr}</AlertBox>}
      {sev && (
        <ResultCard eyebrow="CVAI" value={cvai.toFixed(2)} unit="%"
          rangeMain={`Level ${sev.level}`} rangeSub={`${sev.range}%`}
          sevLabel={sev.label} sevVar={sev.sevVar}
          recommendation={sev.recommendation} presentation={sev.presentation}
          copyText={copyText} onCopy={onCopy} onClear={onClear}/>
      )}
    </>
  );
}

function CrPanel({ ml, ap, setMl, setAp, onCopy, onClear }) {
  const vMl = validateMeasurement(ml, "M/L", RANGES.crMl);
  const vAp = validateMeasurement(ap, "A/P", RANGES.crAp);
  const bothEmpty = vMl.empty && vAp.empty;
  const anyEmpty  = vMl.empty || vAp.empty;
  const errorMsg  = (!vMl.ok && !vMl.empty) ? vMl.error : (!vAp.ok && !vAp.empty) ? vAp.error : null;
  const warnMsg   = !errorMsg ? (vMl.warning || vAp.warning) : null;
  const result    = (!anyEmpty && !errorMsg) ? processCr(vMl.value, vAp.value) : null;
  const res       = result ? { ...CR_LEVELS[result.key], key:result.key } : null;
  const cr        = result?.displayCr ?? null;
  const copyText  = useMemo(() => res ? buildCrNote(cr, res, ml, ap) : "", [cr, res?.key, ml, ap]);

  return (
    <>
      <DiagramCR/>
      <div className="measure-note">
        <span aria-hidden="true">📐</span>
        <span>Measure M/L (width) and A/P (length) using calipers. CR &gt; 90 indicates orthotic evaluation per CHOA.</span>
      </div>
      <div className="input-grid">
        <NumberInput id="cr-ml" label="Width (M/L)" hint="medial-lateral"
                     rangeLabel={RANGES.crMl.label}
                     swatchVar="var(--brand-blue)" value={ml} onChange={setMl} nextId="cr-ap"/>
        <NumberInput id="cr-ap" label="Length (A/P)" hint="anterior-posterior"
                     rangeLabel={RANGES.crAp.label}
                     swatchVar="var(--ink-3)" value={ap} onChange={setAp}/>
      </div>
      {warnMsg && <div className="field-warning" role="status" aria-live="polite">{warnMsg}</div>}
      {bothEmpty && <div className="result-empty">Enter both measurements to calculate Cephalic Ratio</div>}
      {errorMsg && <AlertBox>{errorMsg}</AlertBox>}
      {res && (
        <ResultCard eyebrow="Cephalic Ratio" value={cr.toFixed(1)} unit=""
          rangeMain={res.short} rangeSub={res.rangeFull}
          sevLabel={res.label} sevVar={res.sevVar}
          recommendation={res.detail}
          presentation={res.key === "ortho" ? res.presentation : null}
          copyText={copyText} onCopy={onCopy} onClear={onClear}/>
      )}
    </>
  );
}

// ─── Reference panels ─────────────────────────────────────────────────────────
function SeverityTable() {
  return (
    <section className="card" aria-labelledby="sev-h">
      <div className="card-head">
        <h2 id="sev-h" className="card-title">CHOA severity scale</h2>
        <span className="card-meta">5 levels · CVAI</span>
      </div>
      <div className="table-scroll" tabIndex={0} role="region"
           aria-label="CHOA severity scale reference table">
        <table className="sev-table">
          <caption className="sr-only">
            CHOA Plagiocephaly Severity Scale: five levels from normal (Level 1) to very severe (Level 5)
          </caption>
          <thead>
            <tr>
              {["Level","CVAI","Presentation","Recommendation"].map(h => (
                <th key={h} scope="col">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SEVERITY.map(s => (
              <tr key={s.level}>
                <td>
                  <span className="level-num" style={{"--sev-color":s.sevVar}}>
                    <span className="bar" aria-hidden="true"/>L{s.level}
                  </span>
                </td>
                <td className="range-cell">{s.range}</td>
                <td className="pres-cell">
                  <ul>{s.presentation.map((p,i) => <li key={i}>{p}</li>)}</ul>
                </td>
                <td className="rec-cell">{s.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{padding:"14px var(--pad-card) 18px",fontSize:11.5,color:"var(--ink-3)",lineHeight:1.6}}>
        Recommendations are examples, not a substitute for clinical judgment.{" "}
        <a href={CHOA_PDF} target="_blank" rel="noopener noreferrer"
           aria-label="View official CHOA Plagiocephaly Severity Scale PDF (opens in new tab)">
          View official CHOA scale ↗
        </a>
      </div>
    </section>
  );
}

function AgeGuidelines() {
  const [open, setOpen] = useState(false);
  return (
    <section className="card" aria-labelledby="age-h">
      <button className="accordion-toggle" aria-expanded={open} aria-controls="age-body"
              onClick={() => setOpen(o => !o)}>
        <h2 id="age-h" className="card-title" style={{marginBottom:0,paddingBottom:0,border:"none"}}>
          Age-specific guidelines
        </h2>
        <IcChevron size={16} className="chev"/>
      </button>
      {open && (
        <div id="age-body" className="accordion-body" role="region" aria-labelledby="age-h">
          <div className="age-block">
            <div className="age-tag"><span className="dot" aria-hidden="true"/><span>Birth – 4 months</span></div>
            <div className="age-content">
              <p>A documented <strong>two-month repositioning period</strong> is highly recommended before referring for orthosis evaluation. Required by most third-party payors.</p>
              <ul>
                <li><strong>Tummy Time Tools</strong> — <a href="https://choa.org/tummytimetools" target="_blank" rel="noreferrer">choa.org/tummytimetools</a></li>
                <li>If <strong>torticollis suspected</strong>, early referral to physical therapy</li>
              </ul>
            </div>
          </div>
          <div className="age-block">
            <div className="age-tag"><span className="dot" aria-hidden="true"/><span>4+ months</span></div>
            <div className="age-content">
              <p>Assess for further treatment when secondary skull characteristics are observed:</p>
              <div className="cond-grid">
                <div className="cond-card">
                  <h5>Plagiocephaly</h5>
                  <div className="eyebrow">Clinical presentation</div>
                  <ul>
                    <li>Ipsilateral ear shift</li>
                    <li>Ipsilateral frontal bossing</li>
                    <li>Contralateral frontal flattening</li>
                  </ul>
                  <div className="eyebrow">Documentation</div>
                  <ul>
                    <li>Measure longest and shortest diagonals with calipers</li>
                    <li>Calculate CVAI</li>
                  </ul>
                </div>
                <div className="cond-card">
                  <h5>Brachycephaly</h5>
                  <div className="eyebrow">Clinical presentation</div>
                  <ul>
                    <li>Bilateral forehead bossing</li>
                    <li>Increased posterior vault</li>
                    <li>Bilateral parietal protrusion above ears</li>
                  </ul>
                  <div className="eyebrow">Documentation</div>
                  <ul>
                    <li>Measure M/L and A/P with calipers</li>
                    <li>Calculate CR — if CR &gt; 90, refer for orthotic evaluation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StickyResult({ visible, value, label, sevVar, copyText, onCopy }) {
  const [copied, copy] = useCopy();
  if (!visible) return null;
  return (
    <div className={`sticky-result${visible ? " visible" : ""}`} aria-hidden="true">
      <div className="sticky-label">
        <span className="dot" style={{background:sevVar}}/>
        <span>{value}  ·  {label}</span>
      </div>
      <button className={`btn btn-primary${copied ? " copied" : ""}`}
              style={{fontSize:12,padding:"8px 16px",minHeight:36,borderRadius:"var(--r-pill)"}}
              onClick={() => { copy(copyText); onCopy(); }}>
        {copied ? <IcCheck size={13}/> : <IcCopy size={13}/>}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [disclaimerDone, setDisclaimerDone] = useState(false);
  const [tab,   setTab]   = useState("cvai");
  const [cvaiA, setCvaiA] = useState("");
  const [cvaiB, setCvaiB] = useState("");
  const [crMl,  setCrMl]  = useState("");
  const [crAp,  setCrAp]  = useState("");
  const [toast, setToast] = useState(false);
  const toastT = useRef(null);
  const scrolled = useScrolled();

  useEffect(() => { document.title = "Plagiocephaly Assessment — Therapedia PT"; }, []);

  const clearAll = () => { setCvaiA(""); setCvaiB(""); setCrMl(""); setCrAp(""); };

  const showToast = () => {
    setToast(true);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(false), 2000);
  };
  useEffect(() => () => clearTimeout(toastT.current), []);

  const TABS = ["cvai","cr"];
  const handleTabKey = useCallback(e => {
    const i = TABS.indexOf(tab);
    if (e.key === "ArrowRight") { e.preventDefault(); const next=TABS[(i+1)%2]; setTab(next); document.getElementById(`tab-${next}`)?.focus(); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); const prev=TABS[(i-1+2)%2]; setTab(prev); document.getElementById(`tab-${prev}`)?.focus(); }
  }, [tab]);

  const sticky = useMemo(() => {
    if (tab === "cvai") {
      const vA=validateMeasurement(cvaiA,"A",RANGES.diagA), vB=validateMeasurement(cvaiB,"B",RANGES.diagB);
      if (vA.ok && vB.ok) {
        const r = processCvai(vA.value, vB.value);
        if (r) { const s=SEVERITY[r.sevIdx]; return { visible:true, value:`CVAI ${r.displayCvai.toFixed(1)}%`, label:`Level ${s.level}`, sevVar:s.sevVar, copyText:buildCvaiNote(r.displayCvai,s,cvaiA,cvaiB) }; }
      }
    } else {
      const vM=validateMeasurement(crMl,"M/L",RANGES.crMl), vA=validateMeasurement(crAp,"A/P",RANGES.crAp);
      if (vM.ok && vA.ok) {
        const r = processCr(vM.value, vA.value);
        if (r) { const l=CR_LEVELS[r.key]; return { visible:true, value:`CR ${r.displayCr.toFixed(1)}`, label:l.short, sevVar:l.sevVar, copyText:buildCrNote(r.displayCr,{...l,key:r.key},crMl,crAp) }; }
      }
    }
    return { visible:false };
  }, [tab,cvaiA,cvaiB,crMl,crAp]);

  return (
    <>
      {!disclaimerDone && <LegalDisclaimer onDismiss={() => setDisclaimerDone(true)}/>}
      <Toast visible={toast}/>
      <a href="#main" className="skip-nav">Skip to main content</a>

      <header className={`appbar${scrolled ? " is-scrolled" : ""}`}>
        <div className="appbar-inner">
          <div className="brand">
            {/* Therapedia logo */}
            <img src="/logo-color.png" alt="Therapedia" className="brand-logo"/>
            <span className="brand-divider" aria-hidden="true"/>
            <div className="brand-text">
              <span className="brand-name" aria-label="Therapedia Plagiocephaly Assessment">
                <span className="thera">Thera</span><em className="pedia">pedia</em><span className="dot">.</span>
              </span>
              <span className="brand-meta">Plagiocephaly Assessment · Physical Therapy</span>
            </div>
          </div>
          <span className="status-pill" aria-label="No patient data is stored or transmitted">
            <IcShield size={12} aria-hidden="true"/>No data stored
          </span>
        </div>
      </header>

      <main id="main">
        <div className="col-stack">
          <section className="card" aria-labelledby="calc-h">
            <div className="card-pad" style={{paddingBottom:0}}>
              <div className="card-head-flex" style={{marginBottom:18}}>
                <div>
                  <h1 id="calc-h" className="card-title" style={{fontSize:20}}>
                    {tab === "cvai" ? "Cranial Vault Asymmetry Index" : "Cephalic Ratio"}
                  </h1>
                  <div className="card-meta" style={{marginTop:4}}>
                    {tab === "cvai" ? "Diagonal asymmetry · plagiocephaly" : "Width-to-length ratio · brachycephaly"}
                  </div>
                </div>
                <span className="formula-chip"
                      aria-label={tab === "cvai" ? "Formula: absolute difference of A and B divided by max, times 100" : "Formula: M/L divided by A/P times 100"}>
                  <span className="label" aria-hidden="true">f(x)</span>
                  <span aria-hidden="true">{tab === "cvai" ? "|A−B| ÷ max(A,B) × 100" : "(M/L ÷ A/P) × 100"}</span>
                </span>
              </div>
              <div role="tablist" aria-label="Calculator type" className="modeswitch" onKeyDown={handleTabKey}>
                {[
                  { id:"cvai", label:"Plagiocephaly", sub:"CVAI" },
                  { id:"cr",   label:"Brachycephaly",  sub:"Cephalic Ratio" },
                ].map(m => (
                  <button key={m.id} id={`tab-${m.id}`} role="tab"
                          aria-selected={tab === m.id} aria-controls={`panel-${m.id}`}
                          onClick={() => setTab(m.id)}>
                    {m.label}<span className="sub">{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="card-pad">
              <div id="panel-cvai" role="tabpanel" aria-labelledby="tab-cvai"
                   style={{display:tab==="cvai"?"flex":"none",flexDirection:"column",gap:10}}>
                <CvaiPanel a={cvaiA} setA={setCvaiA} b={cvaiB} setB={setCvaiB}
                           onCopy={showToast} onClear={clearAll}/>
              </div>
              <div id="panel-cr" role="tabpanel" aria-labelledby="tab-cr"
                   style={{display:tab==="cr"?"flex":"none",flexDirection:"column",gap:10}}>
                <CrPanel ml={crMl} setMl={setCrMl} ap={crAp} setAp={setCrAp}
                         onCopy={showToast} onClear={clearAll}/>
              </div>
            </div>
            <div className="card-footer-strip">
              <IcShield size={11} aria-hidden="true"/>
              No patient data is stored locally or on servers. Measurements are cleared on page refresh.
            </div>
          </section>
        </div>

        <div className="col-stack">
          <SeverityTable/>
          <AgeGuidelines/>
        </div>
      </main>

      <footer>
        <img src="/logo-color.png" alt="Therapedia" style={{height:20,opacity:.7,verticalAlign:"middle"}}/>
        <span className="footer-sep" aria-hidden="true">·</span>
        <span>Pediatric Physical Therapy · Keller &amp; Justin, TX</span>
        <span className="footer-sep" aria-hidden="true">·</span>
        <a href={CHOA_PDF} target="_blank" rel="noopener noreferrer"
           aria-label="CHOA Plagiocephaly Severity Scale PDF (opens in new tab)">
          CHOA Severity Scale
        </a>
        <span className="footer-sep" aria-hidden="true">·</span>
        <span>© 2015 Children's Healthcare of Atlanta · ORTH 961942</span>
        <span className="footer-sep" aria-hidden="true">·</span>
        <span>No patient data collected</span>
      </footer>

      <StickyResult {...sticky} onCopy={showToast}/>
    </>
  );
}
