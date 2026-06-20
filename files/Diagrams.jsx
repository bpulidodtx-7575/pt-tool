import { useState } from "react";
import { IcRuler, IcChevron } from "./icons";

// ─── Diagrams ─────────────────────────────────────────────────────────────────
export function DiagramCVAI() {
  return (
    <div
      className="diagram-frame"
      role="img"
      aria-label="Top-down skull: Diagonal A (longer solid line) and Diagonal B (shorter dashed), both at 30° from nose centre."
    >
      <svg viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg">
        <line x1="140" y1="20" x2="140" y2="200" stroke="var(--border-soft)" strokeWidth="0.75" strokeDasharray="2 3" />
        <line x1="40" y1="110" x2="240" y2="110" stroke="var(--border-soft)" strokeWidth="0.75" strokeDasharray="2 3" />
        <ellipse cx="140" cy="110" rx="100" ry="86" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.5" />
        <path d="M134 25 Q140 19 146 25" fill="none" stroke="var(--ink-2)" strokeWidth="1.5" />
        <rect
          x="36"
          y="100"
          width="8"
          height="20"
          rx="3"
          fill="var(--surface)"
          stroke="var(--ink-2)"
          strokeWidth="1.25"
        />
        <rect
          x="236"
          y="100"
          width="8"
          height="20"
          rx="3"
          fill="var(--surface)"
          stroke="var(--ink-2)"
          strokeWidth="1.25"
        />
        <line x1="68" y1="48" x2="218" y2="180" stroke="var(--measure-primary)" strokeWidth="2" />
        <circle cx="68" cy="48" r="4" fill="var(--measure-primary)" />
        <circle cx="218" cy="180" r="4" fill="var(--measure-primary)" />
        <line x1="212" y1="48" x2="76" y2="172" stroke="var(--ink-3)" strokeWidth="1.75" strokeDasharray="4 3" />
        <circle cx="212" cy="48" r="4" fill="var(--ink-3)" />
        <circle cx="76" cy="172" r="4" fill="var(--ink-3)" />
        <text
          x="50"
          y="42"
          fontSize="11"
          fontWeight="700"
          fill="var(--measure-primary)"
          fontFamily="var(--font-mono)"
          aria-hidden="true"
        >
          A
        </text>
        <text
          x="222"
          y="44"
          fontSize="11"
          fontWeight="600"
          fill="var(--ink-3)"
          fontFamily="var(--font-mono)"
          aria-hidden="true"
        >
          B
        </text>
        <text
          x="140"
          y="214"
          fontSize="9"
          fill="var(--ink-3)"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          aria-hidden="true"
        >
          A = longer · B = shorter · 30° from nose
        </text>
      </svg>
    </div>
  );
}

export function DiagramCR() {
  return (
    <div
      className="diagram-frame"
      role="img"
      aria-label="Top-down skull: M/L width (horizontal) and A/P length (vertical)."
    >
      <svg viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg">
        <line x1="140" y1="14" x2="140" y2="206" stroke="var(--border-soft)" strokeWidth="0.75" strokeDasharray="2 3" />
        <line x1="32" y1="110" x2="248" y2="110" stroke="var(--border-soft)" strokeWidth="0.75" strokeDasharray="2 3" />
        <ellipse cx="140" cy="110" rx="100" ry="86" fill="var(--surface)" stroke="var(--ink-2)" strokeWidth="1.5" />
        <path d="M134 25 Q140 19 146 25" fill="none" stroke="var(--ink-2)" strokeWidth="1.5" />
        <rect
          x="36"
          y="100"
          width="8"
          height="20"
          rx="3"
          fill="var(--surface)"
          stroke="var(--ink-2)"
          strokeWidth="1.25"
        />
        <rect
          x="236"
          y="100"
          width="8"
          height="20"
          rx="3"
          fill="var(--surface)"
          stroke="var(--ink-2)"
          strokeWidth="1.25"
        />
        <line x1="46" y1="110" x2="234" y2="110" stroke="var(--measure-primary)" strokeWidth="2" />
        <polygon points="46,110 56,105 56,115" fill="var(--measure-primary)" />
        <polygon points="234,110 224,105 224,115" fill="var(--measure-primary)" />
        <line x1="140" y1="28" x2="140" y2="192" stroke="var(--ink-3)" strokeWidth="2" strokeDasharray="4 3" />
        <polygon points="140,28 135,38 145,38" fill="var(--ink-3)" />
        <polygon points="140,192 135,182 145,182" fill="var(--ink-3)" />
        <text
          x="14"
          y="114"
          fontSize="11"
          fontWeight="700"
          fill="var(--measure-primary)"
          fontFamily="var(--font-mono)"
          aria-hidden="true"
        >
          M/L
        </text>
        <text
          x="148"
          y="22"
          fontSize="11"
          fontWeight="600"
          fill="var(--ink-3)"
          fontFamily="var(--font-mono)"
          aria-hidden="true"
        >
          A/P
        </text>
        <text
          x="140"
          y="214"
          fontSize="9"
          fill="var(--ink-3)"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          aria-hidden="true"
        >
          M/L = medial-lateral · A/P = anterior-posterior
        </text>
      </svg>
    </div>
  );
}

// ─── Measurement guide — shared between inline (mobile) and sidebar (tablet+) ─
const GUIDE_TEXT = {
  cvai: "Measure at 30° from nose centre to posterior skull using calipers. A = longer diagonal.",
  cr: "Measure M/L (width) and A/P (length) using calipers. CR > 90 indicates orthotic evaluation per CHOA.",
};

export function GuideContent({ tab }) {
  return (
    <>
      {tab === "cvai" ? <DiagramCVAI /> : <DiagramCR />}
      <div className="measure-note">
        <IcRuler size={16} aria-hidden="true" />
        <span>{GUIDE_TEXT[tab]}</span>
      </div>
    </>
  );
}

// Collapsible guide — shown only on mobile (CSS hides on tablet+)
export function InlineGuide({ tab }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-guide">
      <button className="guide-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IcRuler size={16} />
          How to measure
        </span>
        <IcChevron size={16} className="chev" />
      </button>
      {open && (
        <div className="guide-body">
          <GuideContent tab={tab} />
        </div>
      )}
    </div>
  );
}
