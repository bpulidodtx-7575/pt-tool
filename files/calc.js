// ─── Type definitions (JSDoc) ─────────────────────────────────────────────────
// calc.js is the clinically meaningful logic. It is JSDoc-typed and checked in CI
// via `npm run typecheck` (tsc --checkJs, see jsconfig.json). Comments only — no
// runtime effect.

/**
 * @typedef {Object} Range
 * @property {number} min
 * @property {number} max
 * @property {string} label
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} ok
 * @property {number|null} value
 * @property {string|null} error
 * @property {boolean} [empty]
 * @property {string|null} [warning]
 */

/**
 * @typedef {Object} CvaiResult
 * @property {number} displayCvai
 * @property {number} sevIdx  Index into SEVERITY (0-4).
 */

/** @typedef {"ortho" | "watch" | "ok"} CrKey */

/**
 * @typedef {Object} CrResult
 * @property {CrKey} key
 * @property {number} displayCr
 */

/**
 * @typedef {Object} SeverityLevel
 * @property {number} level
 * @property {string} range
 * @property {string} rangeFull
 * @property {string} label
 * @property {string} sevVar
 * @property {string[]} presentation
 * @property {string} recommendation
 * @property {string} referral
 */

/**
 * @typedef {Object} CrLevel
 * @property {string} label
 * @property {string} short
 * @property {string} rangeFull
 * @property {string} sevVar
 * @property {string} detail
 * @property {string[]} [presentation]
 */

/** Shape passed to buildCrNote: a CR_LEVELS entry merged with its key. */
/**
 * @typedef {Object} CrNoteInput
 * @property {CrKey} key
 * @property {string} label
 * @property {string} rangeFull
 * @property {string} detail
 */

/**
 * Validate a raw caliper measurement string.
 * @param {string} raw
 * @param {string} label
 * @param {Range} [range]
 * @returns {ValidationResult}
 */
export function validateMeasurement(raw, label, range) {
  if (raw === "" || raw == null) return { ok: false, value: null, error: null, empty: true };
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return { ok: false, value: null, error: `${label} must be a valid number.` };
  if (n <= 0) return { ok: false, value: null, error: `${label} must be greater than zero.` };
  const warning =
    range && (n < range.min || n > range.max)
      ? `Outside typical range (${range.min}–${range.max} mm). Confirm if correct.`
      : null;
  return { ok: true, value: n, error: null, empty: false, warning };
}

/**
 * Round millimetres to tenths (integer math avoids float drift per CHOA).
 * @param {number} v
 * @returns {number}
 */
export const toTenths = (v) => Math.round(v * 10);

/**
 * Format a raw measurement string as mm using the same tenths rounding as the
 * calculation, so the EMR note always shows the value the result was computed from.
 * @param {string} raw
 * @returns {string}
 */
const fmtMm = (raw) => (toTenths(parseFloat(raw)) / 10).toFixed(1);

/**
 * Compute CVAI and its CHOA severity bucket.
 *
 * Severity bands (CHOA Plagiocephaly Severity Scale — see CHOA_PDF):
 *   Level 1  CVAI < 3.5%      Level 2  3.5–6.25%   Level 3  6.25–8.75%
 *   Level 4  8.75–11.0%       Level 5  > 11.0%
 *
 * The buckets are compared with integer-tenths cross-multiplication (no float
 * division) to avoid rounding drift per CHOA. Each comparison below is the exact
 * integer form of `CVAI = diff/max*100` against its documented %% threshold:
 *   diff*200 <  7*max  ⟺  diff/max <  7/200 = 0.0350  ⟺  CVAI <  3.5%
 *   diff*16  <    max  ⟺  diff/max <  1/16  = 0.0625  ⟺  CVAI <  6.25%
 *   diff*400 < 35*max  ⟺  diff/max < 35/400 = 0.0875  ⟺  CVAI <  8.75%
 *   diff*100 <= 11*max ⟺  diff/max <= 11/100 = 0.1100 ⟺  CVAI <= 11.0%
 * Each shared edge (3.5/6.25/8.75) falls into the higher band; 11.0% falls into
 * Level 4 (the `<=`), so only CVAI strictly > 11.0% is Level 5.
 * @param {number} a  Longer diagonal (mm).
 * @param {number} b  Shorter diagonal (mm).
 * @returns {CvaiResult | null}
 */
export function processCvai(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
  const a10 = toTenths(a),
    b10 = toTenths(b);
  const diff = Math.abs(a10 - b10),
    max = Math.max(a10, b10);
  if (max === 0) return null;
  /** @type {number} */
  let sevIdx;
  if (diff * 200 < 7 * max)
    sevIdx = 0; // CVAI < 3.5%   → Level 1
  else if (diff * 16 < max)
    sevIdx = 1; // CVAI < 6.25%  → Level 2
  else if (diff * 400 < 35 * max)
    sevIdx = 2; // CVAI < 8.75%  → Level 3
  else if (diff * 100 <= 11 * max)
    sevIdx = 3; // CVAI <= 11.0% → Level 4
  else sevIdx = 4; //                            CVAI > 11.0%  → Level 5
  const displayCvai = (diff / max) * 100;
  return Number.isFinite(displayCvai) ? { displayCvai, sevIdx } : null;
}

/**
 * Compute Cephalic Ratio and its CHOA bucket.
 *
 * Thresholds (CHOA — see CHOA_PDF): CR > 90 → orthotic eval; CR 85–90 → monitor;
 * CR < 85 → normal. Compared via integer cross-multiplication of `CR = ml/ap*100`
 * (cr100 = ml10*100):
 *   cr100 >  90*ap10  ⟺  CR >  90  → "ortho"
 *   cr100 >= 85*ap10  ⟺  CR >= 85  → "watch"   (so exactly 85 and 90 are "watch")
 *   otherwise         ⟺  CR <  85  → "ok"
 * Note the strict `>` at 90 and inclusive `>=` at 85: the normal band is CR < 85,
 * matching CR_LEVELS.ok.rangeFull ("CR < 85") — guarded by the provenance tests.
 * @param {number} ml  Medial-lateral width (mm).
 * @param {number} ap  Anterior-posterior length (mm).
 * @returns {CrResult | null}
 */
export function processCr(ml, ap) {
  if (!Number.isFinite(ml) || !Number.isFinite(ap) || ml <= 0 || ap <= 0) return null;
  const ml10 = toTenths(ml),
    ap10 = toTenths(ap);
  if (ap10 === 0) return null;
  const cr100 = ml10 * 100;
  const key = cr100 > 90 * ap10 ? "ortho" : cr100 >= 85 * ap10 ? "watch" : "ok";
  const displayCr = (ml10 / ap10) * 100;
  return Number.isFinite(displayCr) ? { key, displayCr } : null;
}

/**
 * Formatted local timestamp for assessment notes.
 * @returns {string}
 */
export function fmtTimestamp() {
  const n = new Date();
  return `${n.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}    ${n.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
}

// Reference data below is the clinical source of truth shown to clinicians. The
// numeric band edges in each `range`/`rangeFull` MUST stay in lockstep with the
// thresholds encoded in processCvai / processCr above (authority: the CHOA
// Plagiocephaly Severity Scale, CHOA_PDF). The "clinical constants ↔ legend
// provenance" tests in calc.test.js fail if the two ever drift apart.
/** @type {SeverityLevel[]} */
export const SEVERITY = [
  {
    level: 1,
    range: "< 3.5",
    rangeFull: "CVAI < 3.5%",
    label: "Within normal limits",
    sevVar: "var(--sev-1)",
    presentation: ["All symmetry within normal limits"],
    recommendation: "No treatment required.",
    referral: "No referral indicated",
  },
  {
    level: 2,
    range: "3.5 \u2013 6.25",
    rangeFull: "CVAI 3.5 \u2013 6.25%",
    label: "Mild asymmetry",
    sevVar: "var(--sev-2)",
    presentation: ["Minimal asymmetry in one posterior quadrant", "No secondary changes"],
    recommendation: "Repositioning program.",
    referral: "Repositioning program \u2014 no orthosis at this stage",
  },
  {
    level: 3,
    range: "6.25 \u2013 8.75",
    rangeFull: "CVAI 6.25 \u2013 8.75%",
    label: "Moderate asymmetry",
    sevVar: "var(--sev-3)",
    presentation: [
      "Two-quadrant involvement",
      "Moderate to severe posterior flattening",
      "Minimal ear shift and/or anterior involvement",
    ],
    recommendation:
      "Conservative treatment \u2014 repositioning or cranial remolding orthosis based on age and history.",
    referral: "Consider cranial remolding orthosis (age and history dependent)",
  },
  {
    level: 4,
    range: "8.75 \u2013 11.0",
    rangeFull: "CVAI 8.75 \u2013 11.0%",
    label: "Severe asymmetry",
    sevVar: "var(--sev-4)",
    presentation: [
      "Two- or three-quadrant involvement",
      "Severe posterior flattening",
      "Moderate ear shift",
      "Anterior orbit asymmetry",
    ],
    recommendation: "Cranial remolding orthosis.",
    referral: "Cranial remolding orthosis recommended",
  },
  {
    level: 5,
    range: "> 11.0",
    rangeFull: "CVAI > 11.0%",
    label: "Very severe asymmetry",
    sevVar: "var(--sev-5)",
    presentation: [
      "Three- or four-quadrant involvement",
      "Severe posterior flattening",
      "Severe ear shift",
      "Anterior involvement including orbit and cheek asymmetry",
    ],
    recommendation: "Cranial remolding orthosis.",
    referral: "Cranial remolding orthosis strongly recommended",
  },
];

/** @type {Record<CrKey, CrLevel>} */
export const CR_LEVELS = {
  ortho: {
    label: "Orthotic evaluation recommended",
    short: "Orthotic eval",
    rangeFull: "CR > 90",
    sevVar: "var(--sev-4)",
    detail: "Per CHOA guideline: refer for cranial remolding orthosis evaluation.",
    presentation: [
      "Bilateral forehead bossing",
      "Increased posterior vault",
      "Bilateral protrusion of parietal bone above ears",
    ],
  },
  watch: {
    label: "Borderline \u2014 monitor closely",
    short: "Monitor",
    rangeFull: "CR 85 \u2013 90",
    sevVar: "var(--sev-3)",
    detail: "Reassess at next visit. Document trajectory. No immediate orthotic indicated per CHOA threshold (>90).",
  },
  ok: {
    label: "Within normal range",
    short: "Normal",
    rangeFull: "CR < 85",
    sevVar: "var(--sev-1)",
    detail: "Continue routine developmental monitoring.",
  },
};

/** @type {Record<"diagA" | "diagB" | "crMl" | "crAp", Range>} */
export const RANGES = {
  diagA: { min: 80, max: 200, label: "Typical: 80–200 mm" },
  diagB: { min: 80, max: 200, label: "Typical: 80–200 mm" },
  crMl: { min: 60, max: 180, label: "Typical: 60–180 mm" },
  crAp: { min: 80, max: 200, label: "Typical: 80–200 mm" },
};

export const CHOA_PDF =
  "https://pediatricapta.org/special-interest-groups/HB/ORTH_961942_PlagiocephalyScale_BWInfo.pdf";

/**
 * Build a structured plagiocephaly assessment note for the EMR.
 * @param {number} cvai
 * @param {SeverityLevel} sev
 * @param {string} rawA
 * @param {string} rawB
 * @returns {string}
 */
export function buildCvaiNote(cvai, sev, rawA, rawB) {
  return [
    "PLAGIOCEPHALY ASSESSMENT",
    fmtTimestamp(),
    "",
    `CVAI: ${cvai.toFixed(2)}%`,
    `Severity: Level ${sev.level} \u2014 ${sev.label}  (range: ${sev.rangeFull})`,
    "",
    "Measurements (caliper):",
    `  Diagonal A (longer):  ${fmtMm(rawA)} mm`,
    `  Diagonal B (shorter): ${fmtMm(rawB)} mm`,
    "",
    "Clinical Presentation:",
    ...sev.presentation.map((p) => `  - ${p}`),
    "",
    `Recommendation: ${sev.recommendation}`,
    `Referral: ${sev.referral}`,
    "",
    "Source: CHOA Plagiocephaly Severity Scale \u2014 choa.org/cranialremolding",
    "Note: This is a reference tool, not a diagnostic device.",
  ].join("\n");
}

/**
 * Build a structured brachycephaly assessment note for the EMR.
 * @param {number} cr
 * @param {CrNoteInput} res
 * @param {string} rawMl
 * @param {string} rawAp
 * @returns {string}
 */
export function buildCrNote(cr, res, rawMl, rawAp) {
  const ref =
    res.key === "ortho"
      ? "Yes \u2014 orthotic evaluation recommended"
      : res.key === "watch"
        ? "Monitor \u2014 reassess at next visit"
        : "No \u2014 within normal range";
  return [
    "BRACHYCEPHALY ASSESSMENT",
    fmtTimestamp(),
    "",
    `Cephalic Ratio: ${cr.toFixed(1)}%`,
    `Assessment: ${res.label}  (range: ${res.rangeFull})`,
    "",
    "Measurements (caliper):",
    `  Medial-Lateral (M/L):     ${fmtMm(rawMl)} mm`,
    `  Anterior-Posterior (A/P): ${fmtMm(rawAp)} mm`,
    "",
    `Recommendation: ${res.detail}`,
    `Referral: ${ref}`,
    "",
    "Source: CHOA Plagiocephaly Severity Scale \u2014 choa.org/cranialremolding",
    "Note: This is a reference tool, not a diagnostic device.",
  ].join("\n");
}
