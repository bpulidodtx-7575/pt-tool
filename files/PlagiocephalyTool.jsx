// CHOA Plagiocephaly Assessment Tool — Flat Design Edition
// CVAI formula: |A−B| / max(A,B) × 100  (official CHOA formula)
// Responsive: mobile-first (600px tablet, 1000px desktop)
// Touch targets: ≥48px on all interactive elements
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { RANGES } from "./ranges";
import { validateMeasurement, processCvai, processCr, buildCvaiNote, buildCrNote, SEVERITY, CR_LEVELS, CHOA_PDF } from "./calc";

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
const IcRuler    = p => <Ic {...p} d="M3 17l4-4 2 2 4-4 2 2 4-4"/>;

// ─── Logic & reference data imported from calc.js ─────────────────────────────

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(false);
  const t = useRef(null);
  const copy = useCallback(async text => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const el = Object.assign(document.createElement("textarea"), {value:text,style:"position:fixed;top:-9999px;opacity:0"});
        document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
      }
      setCopied(true); clearTimeout(t.current);
      t.current = setTimeout(() => setCopied(false), 2000);
    } catch (e) { console.warn("Clipboard write failed", e); }
  }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  return [copied, copy];
}

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive:true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return scrolled;
}

// ─── Diagrams ─────────────────────────────────────────────────────────────────
function DiagramCVAI() {
  return (
    <div className="diagram-frame" role="img"
      aria-label="Top-down skull: Diagonal A (longer solid line) and Diagonal B (shorter dashed), both at 30° from nose centre.">
      <svg viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg">
        <line x1="140" y1="20" x2="140" y2="200" stroke="var(--border-soft)" strokeWidth="0.75" strokeDasharray="2 3"/>
        <line x1="40" y1="110" x2="240" y2="110" stroke="var(--border-soft)" strokeWidth="0.75" strokeDasharray="2 3"/>
        <ellipse cx="140" cy="110" rx="100" ry="86" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.5"/>
        <path d="M134 25 Q140 19 146 25" fill="none" stroke="var(--ink-2)" strokeWidth="1.5"/>
        <rect x="36"  y="100" width="8" height="20" rx="3" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.25"/>
        <rect x="236" y="100" width="8" height="20" rx="3" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.25"/>
        <line x1="68" y1="48" x2="218" y2="180" stroke="var(--measure-primary)" strokeWidth="2"/>
        <circle cx="68" cy="48" r="4" fill="var(--measure-primary)"/>
        <circle cx="218" cy="180" r="4" fill="var(--measure-primary)"/>
        <line x1="212" y1="48" x2="76" y2="172" stroke="var(--ink-3)" strokeWidth="1.75" strokeDasharray="4 3"/>
        <circle cx="212" cy="48" r="4" fill="var(--ink-3)"/>
        <circle cx="76" cy="172" r="4" fill="var(--ink-3)"/>
        <text x="50"  y="42"  fontSize="11" fontWeight="700" fill="var(--measure-primary)" fontFamily="var(--font-mono)" aria-hidden="true">A</text>
        <text x="222" y="44"  fontSize="11" fontWeight="600" fill="var(--ink-3)"      fontFamily="var(--font-mono)" aria-hidden="true">B</text>
        <text x="140" y="214" fontSize="9"  fill="var(--ink-3)" textAnchor="middle"   fontFamily="var(--font-mono)" aria-hidden="true">A = longer · B = shorter · 30° from nose</text>
      </svg>
    </div>
  );
}

function DiagramCR() {
  return (
    <div className="diagram-frame" role="img"
      aria-label="Top-down skull: M/L width (horizontal) and A/P length (vertical).">
      <svg viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg">
        <line x1="140" y1="14" x2="140" y2="206" stroke="var(--border-soft)" strokeWidth="0.75" strokeDasharray="2 3"/>
        <line x1="32" y1="110" x2="248" y2="110" stroke="var(--border-soft)" strokeWidth="0.75" strokeDasharray="2 3"/>
        <ellipse cx="140" cy="110" rx="100" ry="86" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.5"/>
        <path d="M134 25 Q140 19 146 25" fill="none" stroke="var(--ink-2)" strokeWidth="1.5"/>
        <rect x="36"  y="100" width="8" height="20" rx="3" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.25"/>
        <rect x="236" y="100" width="8" height="20" rx="3" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.25"/>
        <line x1="46" y1="110" x2="234" y2="110" stroke="var(--measure-primary)" strokeWidth="2"/>
        <polygon points="46,110 56,105 56,115"    fill="var(--measure-primary)"/>
        <polygon points="234,110 224,105 224,115" fill="var(--measure-primary)"/>
        <line x1="140" y1="28" x2="140" y2="192" stroke="var(--ink-3)" strokeWidth="2" strokeDasharray="4 3"/>
        <polygon points="140,28 135,38 145,38"    fill="var(--ink-3)"/>
        <polygon points="140,192 135,182 145,182" fill="var(--ink-3)"/>
        <text x="14"  y="114" fontSize="11" fontWeight="700" fill="var(--measure-primary)" fontFamily="var(--font-mono)" aria-hidden="true">M/L</text>
        <text x="148" y="22"  fontSize="11" fontWeight="600" fill="var(--ink-3)"      fontFamily="var(--font-mono)" aria-hidden="true">A/P</text>
        <text x="140" y="214" fontSize="9"  fill="var(--ink-3)" textAnchor="middle"   fontFamily="var(--font-mono)" aria-hidden="true">M/L = medial-lateral · A/P = anterior-posterior</text>
      </svg>
    </div>
  );
}

// ─── Measurement guide — shared between inline (mobile) and sidebar (tablet+) ─
const GUIDE_TEXT = {
  cvai: "Measure at 30° from nose centre to posterior skull using calipers. A = longer diagonal.",
  cr:   "Measure M/L (width) and A/P (length) using calipers. CR > 90 indicates orthotic evaluation per CHOA.",
};

function GuideContent({ tab }) {
  return (
    <>
      {tab === "cvai" ? <DiagramCVAI/> : <DiagramCR/>}
      <div className="measure-note">
        <IcRuler size={16} aria-hidden="true"/>
        <span>{GUIDE_TEXT[tab]}</span>
      </div>
    </>
  );
}

// Collapsible guide — shown only on mobile (CSS hides on tablet+)
function InlineGuide({ tab }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-guide">
      <button className="guide-toggle" aria-expanded={open}
              onClick={() => setOpen(o => !o)}>
        <span style={{display:"flex",alignItems:"center",gap:8}}>
          <IcRuler size={16}/>How to measure
        </span>
        <IcChevron size={16} className="chev"/>
      </button>
      {open && (
        <div className="guide-body">
          <GuideContent tab={tab}/>
        </div>
      )}
    </div>
  );
}

// ─── Shared UI components ─────────────────────────────────────────────────────
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
          <span className="disc-head-icon" aria-hidden="true"><IcShield size={24}/></span>
          <div>
            <h1 id="disc-h">Reference Tool — Not a Diagnostic Device</h1>
            <div className="sub">Read before continuing</div>
          </div>
        </div>
        <div className="disc-body" id="disc-body">
          <p>
            This tool is based on the official <strong>CHOA Plagiocephaly Severity Scale</strong>.
            It is <strong style={{color:"var(--sev-4)"}}>NOT a diagnostic device</strong> and must not replace clinical judgment.
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
            <IcExternal size={13}/>Official CHOA Plagiocephaly Severity Scale PDF
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

// Touch-friendly input: 52px min-height, 16px font-size, visible label
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
    <div className="alert" role="alert"><IcAlert size={16}/><span>{children}</span></div>
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
    if (reduced) { ref.current.style.opacity="1"; return; }
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
            <span style={{fontFamily:"var(--font-mono)",fontSize:11}}>{rangeSub}</span>
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
            <ul>{presentation.map((p,i) => <li key={i}>{p}</li>)}</ul>
          </div>
        )}
      </div>
      <div className="result-actions">
        {/* Mobile: full-width stacked, tablet+: row */}
        <button className="btn btn-ghost" onClick={onClear}
                aria-label="Clear all measurements and start a new patient">
          <IcRefresh size={15}/>New patient
        </button>
        <button className={`btn btn-primary${copied ? " copied" : ""}`}
                onClick={() => { copy(copyText); onCopy(); }}
                aria-label={copied ? "Copied to clipboard" : "Copy structured note for EMR"}>
          {copied ? <IcCheck size={15}/> : <IcCopy size={15}/>}
          {copied ? "Copied" : "Copy for EMR"}
        </button>
      </div>
    </div>
  );
}

// ─── Calculator panels (inputs + validation + result — no diagram) ────────────
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
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div className="input-grid">
        <NumberInput id="cvai-a" label="Diagonal A" hint="longer"
                     rangeLabel={RANGES.diagA.label}
                     swatchVar="var(--measure-primary)" value={a} onChange={setA} nextId="cvai-b"/>
        <NumberInput id="cvai-b" label="Diagonal B" hint="shorter"
                     rangeLabel={RANGES.diagB.label}
                     swatchVar="var(--ink-3)" value={b} onChange={setB}/>
      </div>
      {/* Collapsible guide — mobile only, hidden on tablet+ via CSS */}
      <InlineGuide tab="cvai"/>
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
    </div>
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
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div className="input-grid">
        <NumberInput id="cr-ml" label="Width (M/L)" hint="medial-lateral"
                     rangeLabel={RANGES.crMl.label}
                     swatchVar="var(--measure-primary)" value={ml} onChange={setMl} nextId="cr-ap"/>
        <NumberInput id="cr-ap" label="Length (A/P)" hint="anterior-posterior"
                     rangeLabel={RANGES.crAp.label}
                     swatchVar="var(--ink-3)" value={ap} onChange={setAp}/>
      </div>
      <InlineGuide tab="cr"/>
      {warnMsg && <div className="field-warning" role="status" aria-live="polite">{warnMsg}</div>}
      {bothEmpty && <div className="result-empty">Enter both measurements to calculate Cephalic Ratio</div>}
      {errorMsg && <AlertBox>{errorMsg}</AlertBox>}
      {res && (
        <ResultCard eyebrow="Cephalic Ratio" value={cr.toFixed(1)} unit=""
          rangeMain={res.short} rangeSub={res.rangeFull}
          sevLabel={res.label} sevVar={res.sevVar}
          recommendation={res.detail}
          presentation={res.key==="ortho" ? res.presentation : null}
          copyText={copyText} onCopy={onCopy} onClear={onClear}/>
      )}
    </div>
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
           aria-label="CHOA severity scale — scroll to see all columns">
        <table className="sev-table">
          <caption className="sr-only">CHOA Plagiocephaly Severity Scale: five levels from normal to very severe</caption>
          <thead>
            <tr>{["Level","CVAI","Presentation","Recommendation"].map(h => <th key={h} scope="col">{h}</th>)}</tr>
          </thead>
          <tbody>
            {SEVERITY.map(s => (
              <tr key={s.level}>
                <td><span className="level-num" style={{"--sev-color":s.sevVar}}><span className="bar" aria-hidden="true"/>L{s.level}</span></td>
                <td className="range-cell">{s.range}</td>
                <td className="pres-cell"><ul>{s.presentation.map((p,i) => <li key={i}>{p}</li>)}</ul></td>
                <td className="rec-cell">{s.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{padding:"10px var(--pad-card) 14px",fontSize:11,color:"var(--ink-3)",lineHeight:1.6}}>
        Recommendations are examples, not a substitute for clinical judgment.{" "}
        <a href={CHOA_PDF} target="_blank" rel="noopener noreferrer"
           aria-label="View official CHOA PDF (opens in new tab)">View official CHOA scale ↗</a>
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
        <h2 id="age-h" className="card-title" style={{margin:0,border:"none"}}>Age-specific guidelines</h2>
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
                  <ul><li>Ipsilateral ear shift</li><li>Ipsilateral frontal bossing</li><li>Contralateral frontal flattening</li></ul>
                  <div className="eyebrow">Documentation</div>
                  <ul><li>Measure diagonals with calipers</li><li>Calculate CVAI</li></ul>
                </div>
                <div className="cond-card">
                  <h5>Brachycephaly</h5>
                  <div className="eyebrow">Clinical presentation</div>
                  <ul><li>Bilateral forehead bossing</li><li>Increased posterior vault</li><li>Bilateral parietal protrusion above ears</li></ul>
                  <div className="eyebrow">Documentation</div>
                  <ul><li>Measure M/L and A/P with calipers</li><li>CR &gt; 90 → refer for orthotic evaluation</li></ul>
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
              style={{minHeight:40,padding:"0 16px",borderRadius:"var(--r-pill)",fontSize:13}}
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

  useEffect(() => { document.title = "Plagiocephaly Assessment Tool"; }, []);

  const clearAll = () => { setCvaiA(""); setCvaiB(""); setCrMl(""); setCrAp(""); };

  const showToast = () => {
    setToast(true); clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(false), 2000);
  };
  useEffect(() => () => clearTimeout(toastT.current), []);

  const TABS = ["cvai", "cr"];
  const handleTabKey = useCallback(e => {
    const i = TABS.indexOf(tab);
    if (e.key === "ArrowRight") { e.preventDefault(); const n=TABS[(i+1)%2]; setTab(n); document.getElementById(`tab-${n}`)?.focus(); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); const p=TABS[(i-1+2)%2]; setTab(p); document.getElementById(`tab-${p}`)?.focus(); }
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
            <span className="brand-mark" aria-hidden="true"/>
            <span className="brand-label">Plagiocephaly Assessment</span>
          </div>
          <span className="status-pill" aria-label="No patient data stored">
            <IcShield size={12} aria-hidden="true"/>No data stored
          </span>
        </div>
      </header>

      <main id="main">
        {/* Mobile-first: single column → two-column grid at 600px → centered 900px at 1000px */}
        <div className="page-wrap">

          {/* ── Left / full-width column: calculator ── */}
          <div style={{minWidth:0}}>
            <section className="card" aria-labelledby="calc-h">
              <div className="card-pad" style={{paddingBottom:0}}>
                <div className="card-head-flex" style={{marginBottom:14}}>
                  <div>
                    <h1 id="calc-h" className="card-title" style={{fontSize:18}}>
                      {tab === "cvai" ? "Cranial Vault Asymmetry Index" : "Cephalic Ratio"}
                    </h1>
                    <div className="card-meta" style={{marginTop:3}}>
                      {tab === "cvai" ? "Diagonal asymmetry · plagiocephaly" : "Width-to-length ratio · brachycephaly"}
                    </div>
                  </div>
                  <span className="formula-chip"
                        aria-label={tab === "cvai" ? "Formula: absolute difference divided by max, times 100" : "Formula: M/L divided by A/P, times 100"}>
                    <span className="label" aria-hidden="true">f(x)</span>
                    <span aria-hidden="true">{tab === "cvai" ? "|A−B| ÷ max × 100" : "M/L ÷ A/P × 100"}</span>
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
                     style={{display:tab==="cvai"?"block":"none"}}>
                  <CvaiPanel a={cvaiA} setA={setCvaiA} b={cvaiB} setB={setCvaiB}
                             onCopy={showToast} onClear={clearAll}/>
                </div>
                <div id="panel-cr" role="tabpanel" aria-labelledby="tab-cr"
                     style={{display:tab==="cr"?"block":"none"}}>
                  <CrPanel ml={crMl} setMl={setCrMl} ap={crAp} setAp={setCrAp}
                           onCopy={showToast} onClear={clearAll}/>
                </div>
              </div>

              <div className="card-footer-strip">
                <IcShield size={11} aria-hidden="true"/>
                No patient data stored. Measurements cleared on page refresh.
              </div>
            </section>
          </div>

          {/* ── Right column: reference sidebar (hidden on mobile via CSS) ── */}
          <div className="ref-col">
            {/* Guide card: hidden on mobile, visible tablet+ via CSS */}
            <div className="card guide-sidebar-card">
              <div className="card-head">
                <h2 className="card-title">How to measure</h2>
                <span className="card-meta">{tab === "cvai" ? "CVAI" : "Cephalic Ratio"}</span>
              </div>
              <div style={{padding:"0 var(--pad-card) var(--pad-card)"}}>
                <GuideContent tab={tab}/>
              </div>
            </div>

            <SeverityTable/>
            <AgeGuidelines/>
          </div>
        </div>
      </main>

      <footer>
        <a href={CHOA_PDF} target="_blank" rel="noopener noreferrer"
           aria-label="CHOA Severity Scale PDF (opens in new tab)">CHOA Severity Scale</a>
        <span className="footer-sep" aria-hidden="true">·</span>
        <span>No patient data collected</span>
      </footer>

      <StickyResult {...sticky} onCopy={showToast}/>
    </>
  );
}
