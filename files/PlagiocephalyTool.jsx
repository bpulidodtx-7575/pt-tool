// CHOA Plagiocephaly Assessment Tool — Flat Design Edition
// CVAI formula: |A−B| / max(A,B) × 100  (official CHOA formula)
// Responsive: mobile-first (600px tablet, 1000px desktop)
// Touch targets: ≥48px on all interactive elements
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  validateMeasurement,
  processCvai,
  processCr,
  buildCvaiNote,
  buildCrNote,
  RANGES,
  SEVERITY,
  CR_LEVELS,
  CHOA_PDF,
} from "./calc";
import { IcShield, IcKeyboard } from "./icons";
import { useScrolled, useCopy, useKeyboardShortcuts } from "./hooks";
import { GuideContent } from "./Diagrams";
import { Toast, LegalDisclaimer, StickyResult, ThemeToggle, ShortcutsHelp } from "./components";
import { CvaiPanel, CrPanel, SeverityTable, AgeGuidelines } from "./panels";

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [disclaimerDone, setDisclaimerDone] = useState(false);
  const [tab, setTab] = useState("cvai");
  const [cvaiA, setCvaiA] = useState("");
  const [cvaiB, setCvaiB] = useState("");
  const [crMl, setCrMl] = useState("");
  const [crAp, setCrAp] = useState("");
  const [toast, setToast] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const toastT = useRef(null);
  const helpBtnRef = useRef(null);
  const scrolled = useScrolled();
  const [, copyNote] = useCopy();

  useEffect(() => {
    document.title = "Plagiocephaly Assessment Tool";
  }, []);

  // Move focus to the first measurement field once the disclaimer is dismissed,
  // so the clinician can start typing without an extra tap. Runs only on that
  // transition (not on tab switches).
  useEffect(() => {
    if (disclaimerDone) document.getElementById(tab === "cvai" ? "cvai-a" : "cr-ml")?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disclaimerDone]);

  const clearAll = () => {
    setCvaiA("");
    setCvaiB("");
    setCrMl("");
    setCrAp("");
  };

  const showToast = () => {
    setToast(true);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(false), 2000);
  };
  useEffect(() => () => clearTimeout(toastT.current), []);

  const handleTabKey = useCallback(
    (e) => {
      const TABS = ["cvai", "cr"];
      const i = TABS.indexOf(tab);
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const n = TABS[(i + 1) % 2];
        setTab(n);
        document.getElementById(`tab-${n}`)?.focus();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const p = TABS[(i - 1 + 2) % 2];
        setTab(p);
        document.getElementById(`tab-${p}`)?.focus();
      }
    },
    [tab],
  );

  const sticky = useMemo(() => {
    if (tab === "cvai") {
      const vA = validateMeasurement(cvaiA, "A", RANGES.diagA),
        vB = validateMeasurement(cvaiB, "B", RANGES.diagB);
      if (vA.ok && vB.ok) {
        const r = processCvai(vA.value, vB.value);
        if (r) {
          const s = SEVERITY[r.sevIdx];
          return {
            visible: true,
            value: `CVAI ${r.displayCvai.toFixed(1)}%`,
            label: `Level ${s.level}`,
            sevVar: s.sevVar,
            copyText: buildCvaiNote(r.displayCvai, s, cvaiA, cvaiB),
          };
        }
      }
    } else {
      const vM = validateMeasurement(crMl, "M/L", RANGES.crMl),
        vA = validateMeasurement(crAp, "A/P", RANGES.crAp);
      if (vM.ok && vA.ok) {
        const r = processCr(vM.value, vA.value);
        if (r) {
          const l = CR_LEVELS[r.key];
          return {
            visible: true,
            value: `CR ${r.displayCr.toFixed(1)}`,
            label: l.short,
            sevVar: l.sevVar,
            copyText: buildCrNote(r.displayCr, { ...l, key: r.key }, crMl, crAp),
          };
        }
      }
    }
    return { visible: false };
  }, [tab, cvaiA, cvaiB, crMl, crAp]);

  // Global bedside shortcuts (active once the disclaimer is acknowledged).
  useKeyboardShortcuts(
    {
      help: () => setHelpOpen((o) => !o),
      escape: () => setHelpOpen(false),
      toggleTab: () => setTab((t) => (t === "cvai" ? "cr" : "cvai")),
      clear: clearAll,
      copy: () => {
        if (sticky.visible) {
          copyNote(sticky.copyText);
          showToast();
        }
      },
    },
    disclaimerDone,
  );

  const closeHelp = () => {
    setHelpOpen(false);
    helpBtnRef.current?.focus();
  };

  return (
    <>
      {!disclaimerDone && <LegalDisclaimer onDismiss={() => setDisclaimerDone(true)} />}
      <Toast visible={toast} />
      <a href="#main" className="skip-nav">
        Skip to main content
      </a>

      <header className={`appbar${scrolled ? " is-scrolled" : ""}`}>
        <div className="appbar-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-label">Plagiocephaly Assessment</span>
          </div>
          <div className="appbar-actions">
            <button
              type="button"
              className="help-btn"
              ref={helpBtnRef}
              onClick={() => setHelpOpen((o) => !o)}
              aria-label="Keyboard shortcuts"
              aria-haspopup="dialog"
              title="Keyboard shortcuts (?)"
            >
              <IcKeyboard size={16} />
            </button>
            <ThemeToggle />
            <span className="status-pill">
              <IcShield size={12} aria-hidden="true" />
              No data stored
            </span>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Mobile-first: single column → two-column grid at 600px → centered 900px at 1000px */}
        <div className="page-wrap">
          {/* ── Left / full-width column: calculator ── */}
          <div style={{ minWidth: 0 }}>
            <section className="card" aria-labelledby="calc-h">
              <div className="card-pad" style={{ paddingBottom: 0 }}>
                <div className="card-head-flex" style={{ marginBottom: 14 }}>
                  <div>
                    <h1 id="calc-h" className="card-title" style={{ fontSize: 18 }}>
                      {tab === "cvai" ? "Cranial Vault Asymmetry Index" : "Cephalic Ratio"}
                    </h1>
                    <div className="card-meta" style={{ marginTop: 3 }}>
                      {tab === "cvai" ? "Diagonal asymmetry · plagiocephaly" : "Width-to-length ratio · brachycephaly"}
                    </div>
                  </div>
                  <span
                    className="formula-chip"
                    role="img"
                    aria-label={
                      tab === "cvai"
                        ? "Formula: absolute difference divided by max, times 100"
                        : "Formula: M/L divided by A/P, times 100"
                    }
                  >
                    <span className="label" aria-hidden="true">
                      f(x)
                    </span>
                    <span aria-hidden="true">{tab === "cvai" ? "|A−B| ÷ max × 100" : "M/L ÷ A/P × 100"}</span>
                  </span>
                </div>
                <div role="tablist" aria-label="Calculator type" className="modeswitch" onKeyDown={handleTabKey}>
                  {[
                    { id: "cvai", label: "Plagiocephaly", sub: "CVAI" },
                    { id: "cr", label: "Brachycephaly", sub: "Cephalic Ratio" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      id={`tab-${m.id}`}
                      role="tab"
                      aria-selected={tab === m.id}
                      aria-controls={`panel-${m.id}`}
                      onClick={() => setTab(m.id)}
                    >
                      {m.label}
                      <span className="sub">{m.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-pad">
                <div
                  id="panel-cvai"
                  role="tabpanel"
                  aria-labelledby="tab-cvai"
                  style={{ display: tab === "cvai" ? "block" : "none" }}
                >
                  <CvaiPanel
                    a={cvaiA}
                    setA={setCvaiA}
                    b={cvaiB}
                    setB={setCvaiB}
                    onCopy={showToast}
                    onClear={clearAll}
                  />
                </div>
                <div
                  id="panel-cr"
                  role="tabpanel"
                  aria-labelledby="tab-cr"
                  style={{ display: tab === "cr" ? "block" : "none" }}
                >
                  <CrPanel ml={crMl} setMl={setCrMl} ap={crAp} setAp={setCrAp} onCopy={showToast} onClear={clearAll} />
                </div>
              </div>

              <div className="card-footer-strip">
                <IcShield size={11} aria-hidden="true" />
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
              <div style={{ padding: "0 var(--pad-card) var(--pad-card)" }}>
                <GuideContent tab={tab} />
              </div>
            </div>

            <SeverityTable />
            <AgeGuidelines />
          </div>
        </div>
      </main>

      <footer>
        <a
          href={CHOA_PDF}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="CHOA Severity Scale PDF (opens in new tab)"
        >
          CHOA Severity Scale
        </a>
        <span className="footer-sep" aria-hidden="true">
          ·
        </span>
        <span>No patient data collected</span>
      </footer>

      <StickyResult {...sticky} onCopy={showToast} />
      <ShortcutsHelp open={helpOpen} onClose={closeHelp} />
    </>
  );
}
