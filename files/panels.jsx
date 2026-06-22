import { useState, useMemo } from "react";
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
import { NumberInput, AlertBox, ResultCard } from "./components";
import { InlineGuide } from "./Diagrams";
import { IcChevron } from "./icons";

// Per-field border state: hard error (invalid) vs. out-of-range warning.
const fieldStatus = (v) => (v.empty ? null : !v.ok ? "error" : v.warning ? "warn" : null);

// ─── Calculator panels (inputs + validation + result — no diagram) ────────────
export function CvaiPanel({ a, setA, b, setB, onCopy, onClear }) {
  const vA = validateMeasurement(a, "Diagonal A", RANGES.diagA);
  const vB = validateMeasurement(b, "Diagonal B", RANGES.diagB);
  const bothEmpty = vA.empty && vB.empty;
  const anyEmpty = vA.empty || vB.empty;
  const errorMsg = !vA.ok && !vA.empty ? vA.error : !vB.ok && !vB.empty ? vB.error : null;
  const warnMsg = !errorMsg ? vA.warning || vB.warning : null;
  const logicErr =
    !errorMsg && !anyEmpty && vA.ok && vB.ok && vA.value <= vB.value
      ? "Diagonal A should be greater than Diagonal B."
      : null;
  const result = !anyEmpty && !errorMsg && !logicErr ? processCvai(vA.value, vB.value) : null;
  const sev = result ? SEVERITY[result.sevIdx] : null;
  const cvai = result?.displayCvai ?? null;
  const copyText = useMemo(() => (sev ? buildCvaiNote(cvai, sev, a, b) : ""), [cvai, sev, a, b]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="input-grid">
        <NumberInput
          id="cvai-a"
          label="Diagonal A"
          hint="longer"
          rangeLabel={RANGES.diagA.label}
          swatchVar="var(--measure-primary)"
          value={a}
          onChange={setA}
          nextId="cvai-b"
          status={fieldStatus(vA)}
        />
        <NumberInput
          id="cvai-b"
          label="Diagonal B"
          hint="shorter"
          rangeLabel={RANGES.diagB.label}
          swatchVar="var(--ink-3)"
          value={b}
          onChange={setB}
          status={fieldStatus(vB)}
        />
      </div>
      {/* Collapsible guide — mobile only, hidden on tablet+ via CSS */}
      <InlineGuide tab="cvai" />
      {warnMsg && (
        <div className="field-warning" role="status" aria-live="polite">
          {warnMsg}
        </div>
      )}
      {bothEmpty && <div className="result-empty">Enter both diagonal measurements to calculate CVAI</div>}
      {errorMsg && <AlertBox>{errorMsg}</AlertBox>}
      {logicErr && <AlertBox>{logicErr}</AlertBox>}
      {sev && (
        <ResultCard
          eyebrow="CVAI"
          value={cvai.toFixed(2)}
          unit="%"
          rangeMain={`Level ${sev.level}`}
          rangeSub={`${sev.range}%`}
          sevLabel={sev.label}
          sevVar={sev.sevVar}
          recommendation={sev.recommendation}
          presentation={sev.presentation}
          copyText={copyText}
          onCopy={onCopy}
          onClear={onClear}
        />
      )}
    </div>
  );
}

export function CrPanel({ ml, ap, setMl, setAp, onCopy, onClear }) {
  const vMl = validateMeasurement(ml, "M/L", RANGES.crMl);
  const vAp = validateMeasurement(ap, "A/P", RANGES.crAp);
  const bothEmpty = vMl.empty && vAp.empty;
  const anyEmpty = vMl.empty || vAp.empty;
  const errorMsg = !vMl.ok && !vMl.empty ? vMl.error : !vAp.ok && !vAp.empty ? vAp.error : null;
  const warnMsg = !errorMsg ? vMl.warning || vAp.warning : null;
  const result = !anyEmpty && !errorMsg ? processCr(vMl.value, vAp.value) : null;
  const res = useMemo(() => (result ? { ...CR_LEVELS[result.key], key: result.key } : null), [result]);
  const cr = result?.displayCr ?? null;
  const copyText = useMemo(() => (res ? buildCrNote(cr, res, ml, ap) : ""), [cr, res, ml, ap]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="input-grid">
        <NumberInput
          id="cr-ml"
          label="Width (M/L)"
          hint="medial-lateral"
          rangeLabel={RANGES.crMl.label}
          swatchVar="var(--measure-primary)"
          value={ml}
          onChange={setMl}
          nextId="cr-ap"
          status={fieldStatus(vMl)}
        />
        <NumberInput
          id="cr-ap"
          label="Length (A/P)"
          hint="anterior-posterior"
          rangeLabel={RANGES.crAp.label}
          swatchVar="var(--ink-3)"
          value={ap}
          onChange={setAp}
          status={fieldStatus(vAp)}
        />
      </div>
      <InlineGuide tab="cr" />
      {warnMsg && (
        <div className="field-warning" role="status" aria-live="polite">
          {warnMsg}
        </div>
      )}
      {bothEmpty && <div className="result-empty">Enter both measurements to calculate Cephalic Ratio</div>}
      {errorMsg && <AlertBox>{errorMsg}</AlertBox>}
      {res && (
        <ResultCard
          eyebrow="Cephalic Ratio"
          value={cr.toFixed(1)}
          unit=""
          rangeMain={res.short}
          rangeSub={res.rangeFull}
          sevLabel={res.label}
          sevVar={res.sevVar}
          recommendation={res.detail}
          presentation={res.key === "ortho" ? res.presentation : null}
          copyText={copyText}
          onCopy={onCopy}
          onClear={onClear}
        />
      )}
    </div>
  );
}

// ─── Reference panels ─────────────────────────────────────────────────────────
export function SeverityTable() {
  return (
    <section className="card" aria-labelledby="sev-h">
      <div className="card-head">
        <h2 id="sev-h" className="card-title">
          CHOA severity scale
        </h2>
        <span className="card-meta">5 levels · CVAI</span>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="CHOA severity scale — scroll to see all columns"
      >
        <table className="sev-table">
          <caption className="sr-only">
            CHOA Plagiocephaly Severity Scale: five levels from normal to very severe
          </caption>
          <thead>
            <tr>
              {["Level", "CVAI", "Presentation", "Recommendation"].map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SEVERITY.map((s) => (
              <tr key={s.level}>
                <td>
                  <span className="level-num" style={{ "--sev-color": s.sevVar }}>
                    <span className="bar" aria-hidden="true" />L{s.level}
                  </span>
                </td>
                <td className="range-cell">{s.range}</td>
                <td className="pres-cell">
                  <ul>
                    {s.presentation.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </td>
                <td className="rec-cell">{s.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sev-footnote">
        Recommendations are examples, not a substitute for clinical judgment.{" "}
        <a
          href={CHOA_PDF}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View official CHOA PDF (opens in new tab)"
        >
          View official CHOA scale ↗
        </a>
      </div>
    </section>
  );
}

export function AgeGuidelines() {
  const [open, setOpen] = useState(false);
  return (
    <section className="card" aria-labelledby="age-h">
      <button
        className="accordion-toggle"
        aria-expanded={open}
        aria-controls="age-body"
        onClick={() => setOpen((o) => !o)}
      >
        <h2 id="age-h" className="card-title" style={{ margin: 0, border: "none" }}>
          Age-specific guidelines
        </h2>
        <IcChevron size={16} className="chev" />
      </button>
      {open && (
        <div id="age-body" className="accordion-body">
          <div className="age-block">
            <div className="age-tag">
              <span className="dot" aria-hidden="true" />
              <span>Birth – 4 months</span>
            </div>
            <div className="age-content">
              <p>
                A documented <strong>two-month repositioning period</strong> is highly recommended before referring for
                orthosis evaluation. Required by most third-party payors.
              </p>
              <ul>
                <li>
                  <strong>Tummy Time Tools</strong> —{" "}
                  <a href="https://choa.org/tummytimetools" target="_blank" rel="noreferrer">
                    choa.org/tummytimetools
                  </a>
                </li>
                <li>
                  If <strong>torticollis suspected</strong>, early referral to physical therapy
                </li>
              </ul>
            </div>
          </div>
          <div className="age-block">
            <div className="age-tag">
              <span className="dot" aria-hidden="true" />
              <span>4+ months</span>
            </div>
            <div className="age-content">
              <p>Assess for further treatment when secondary skull characteristics are observed:</p>
              <div className="cond-grid">
                <div className="cond-card">
                  <h3>Plagiocephaly</h3>
                  <div className="eyebrow">Clinical presentation</div>
                  <ul>
                    <li>Ipsilateral ear shift</li>
                    <li>Ipsilateral frontal bossing</li>
                    <li>Contralateral frontal flattening</li>
                  </ul>
                  <div className="eyebrow">Documentation</div>
                  <ul>
                    <li>Measure diagonals with calipers</li>
                    <li>Calculate CVAI</li>
                  </ul>
                </div>
                <div className="cond-card">
                  <h3>Brachycephaly</h3>
                  <div className="eyebrow">Clinical presentation</div>
                  <ul>
                    <li>Bilateral forehead bossing</li>
                    <li>Increased posterior vault</li>
                    <li>Bilateral parietal protrusion above ears</li>
                  </ul>
                  <div className="eyebrow">Documentation</div>
                  <ul>
                    <li>Measure M/L and A/P with calipers</li>
                    <li>CR &gt; 90 → refer for orthotic evaluation</li>
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
