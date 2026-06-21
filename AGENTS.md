# Plagiocephaly Assessment Tool — Agent Guide

## Project root is `files/`

All source, config, and `package.json` live under `files/`. Run all npm commands from there:

```bash
cd files
npm install
npm run dev    # Vite dev server on localhost:3000 (auto-opens browser)
npm run build  # Outputs to files/dist/
npm run preview
```

## Stack & structure

- **React 18 + Vite 5** — single-page SPA, no router, no state library
- **Component modules** (all under `files/`):
  - `PlagiocephalyTool.jsx` — the `App` shell (header, tabs, sticky result)
  - `panels.jsx` — `CvaiPanel`, `CrPanel`, `SeverityTable`, `AgeGuidelines`
  - `components.jsx` — `Toast`, `LegalDisclaimer`, `NumberInput`, `AlertBox`, `ResultCard`, `StickyResult`
  - `Diagrams.jsx` — SVG diagrams + the inline/sidebar measurement guide
  - `icons.jsx` — inline SVG icon set · `hooks.js` — `useCopy`, `useScrolled`
  - `ErrorBoundary.jsx` — wraps `<App/>` in `main.jsx` for a graceful crash fallback
- **Core logic** in `files/calc.js` — pure, testable functions (`processCvai`, `processCr`, `validateMeasurement`) plus reference data (`SEVERITY`, `CR_LEVELS`, `RANGES`). The bucket arithmetic uses integer-tenths cross-multiplication (no float drift); each comparison is annotated with the CHOA `%` threshold it encodes (source: `CHOA_PDF`). The displayed band edges (`SEVERITY[].range`, `CR_LEVELS[].rangeFull`) are the clinical source of truth and must match the thresholds — the `clinical constants ↔ legend provenance` tests in `calc.test.js` derive the edges from the reference data and fail if they drift (guards the PR #14 legend-vs-logic bug class).
- **Entrypoint**: `files/index.html` → `files/main.jsx` → `ErrorBoundary` → `PlagiocephalyTool.jsx`
- **Styling**: `files/styles.css` — CSS variables + oklch color space. Dark mode: the `useTheme` hook (`hooks.js`) sets `data-theme` on `<html>` for explicit Light/Dark; **System mode (default) leaves the attribute unset** so the `@media (prefers-color-scheme: dark)` rule drives it live. The dark token set is duplicated for `:root[data-theme="dark"]` and the media query — keep them in sync. Choice persists in `sessionStorage` (`pt-theme`); the `<ThemeToggle/>` button lives in the header.
- **Fonts**: Plus Jakarta Sans + JetBrains Mono are **self-hosted** (`files/fonts/*.woff2`, `@font-face` in `styles.css`) — no CDN, works offline
- **PWA**: installable + offline app-shell caching via `vite-plugin-pwa` (`files/vite.config.js`)
  - App icons live in `files/public/` (PNG 192/512 + maskable + apple-touch-180), generated from `public/icon-source.svg` via `npm run generate-pwa-assets` (`pwa-assets.config.js`) and **committed**; regenerate only when the source icon changes (needs `sharp`, a devDep)
  - **Updates are prompt-based** (`registerType: "prompt"`): `PwaReloadPrompt.jsx` (thin wrapper around `useRegisterSW` from the build-only `virtual:pwa-register/react`, rendered only in `main.jsx`) drives the pure `ReloadPromptView` in `components.jsx` (update-available bar + offline-ready toast). The virtual module never reaches Vitest — only `ReloadPromptView` is unit-tested; the wrapper and `main.jsx` are excluded from coverage. Build is the compile check for the wrapper.
- **Test**: `npm test` (Vitest, jsdom). Suites: `calc.test.js` (pure logic), `calc.property.test.js` (property-based via `fast-check`), `PlagiocephalyTool.test.jsx` (app flows), `components.test.jsx`, `panels.test.jsx`, `hooks.test.jsx`, `ErrorBoundary.test.jsx`, and `a11y.test.jsx` (automated axe checks).
  - **Coverage**: `npm run test:coverage` (v8 provider) enforces **80%** statements/branches/functions/lines over `calc.js`, `hooks.js`, `components.jsx`, `panels.jsx`, `ErrorBoundary.jsx` (config in `vite.config.js`); CI runs this. Output in `files/coverage/` (gitignored).
  - **a11y**: `a11y.test.jsx` asserts `toHaveNoViolations()` via `vitest-axe` (matcher registered in `test-setup.js`); the `color-contrast` rule is disabled since jsdom can't compute it.
  - **Property-based**: `calc.property.test.js` fuzzes `processCvai`/`processCr`/`validateMeasurement`/`toTenths`/note builders for invariants (symmetry, monotonic severity, bucket↔ratio agreement). Runs under the normal Vitest commands (`*.test.js`).
  - **E2E**: `npm run test:e2e` (Playwright, `files/e2e/*.spec.js`, Chromium + Pixel 5) runs against the built+previewed app on port 4173. First run needs `npx playwright install chromium`. Screenshots/traces on failure only. Has its own CI job (browser download is blocked in the sandbox, so E2E is CI-verified).
- **Lint**: `npm run lint` (ESLint), **Format**: `npm run format` (Prettier)
- **Typecheck**: `npm run typecheck` — `calc.js` is JSDoc-typed and checked with `tsc --checkJs` (`files/jsconfig.json`)
- **Lighthouse budgets**: `npm run lhci` (`@lhci/cli`, config in `files/lighthouserc.json`) audits the built `dist/` (`staticDistDir`, median of 3 runs) against category score budgets — perf ≥0.9 (warn), a11y/best-practices/SEO ≥0.95 (error). PWA category omitted (removed in Lighthouse 12). Needs Chrome; verified in CI (sandbox has no Chrome). Reports in `files/.lighthouseci/` (gitignored).
- **Security scanning**: a `security` job in `ci.yml` runs `npm audit --omit=dev --audit-level=high` as a **blocking** gate (only `react`/`react-dom` ship, so production deps are the gate) plus a non-blocking full-tree `npm audit` for triage of dev-tooling advisories. CodeQL static analysis runs from a separate `.github/workflows/codeql.yml` (javascript-typescript; push to main, PRs into main, weekly cron) — alerts land in the repo Security tab. Dependabot (`.github/dependabot.yml`) covers npm + Actions updates.
- **CI**: `.github/workflows/ci.yml` — `build-and-test` job runs lint → typecheck → format check → test (with coverage) → build on Node 20 & 22; a separate `e2e` job installs Chromium and runs Playwright (uploads the HTML report as an artifact on failure); a `lighthouse` job builds and runs the Lighthouse budgets (uploads its report artifact always); a `security` job runs the `npm audit` gate. CodeQL runs as its own workflow.

## Deployment

- **Netlify** — config at `files/netlify.toml`
- Build: `npm run build`, publish dir: `dist`
- SPA redirect `/* → /index.html`; immutable cache for hashed assets under `/assets/*`
- **Security headers** live in `files/netlify.toml` (CSP, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`). The CSP keeps
  `script-src 'self'` (no inline/CDN scripts) but needs `style-src 'unsafe-inline'`
  for React's inline `style={{…}}` attributes — keep that in mind before adding any
  external script/font/image source.
- **Dependency updates**: `.github/dependabot.yml` opens weekly npm (`/files`) +
  github-actions PRs; routine devDependency bumps are grouped into one PR.

## Notable quirks

- Node 20+ only (enforced via `package.json` `engines`; the PWA build needs a global `crypto`, absent on Node 18)
- Vite port is **3000** (not default 5173) — set in `vite.config.js`
- All measurements are session-only (cleared on refresh) — no backend, no storage
- Legal disclaimer modal shown on first load (must be acknowledged)
- Touch targets ≥48px enforced everywhere, iOS-safe 16px font on inputs
- `NumberInput` (`components.jsx`) auto-focuses the first field after the disclaimer, has a per-field clear (×) button, and takes a `status` prop (`"error"`/`"warn"`) that the panels derive via `fieldStatus(validateMeasurement(...))` to color the border (`is-error`/`is-warn` + `aria-invalid`)
- **Keyboard shortcuts** (active after the disclaimer; `useKeyboardShortcuts` in `hooks.js`): `?` help dialog, `t` switch calculator, `c` copy note, `n` new patient, `Esc` close help. Action keys are non-numeric so they fire even while a number input is focused; the handler ignores `Ctrl/Meta/Alt` combos and real text fields. Discoverable via the header keyboard button (`ShortcutsHelp` modal).
- **Focus management**: `useFocusTrap(containerRef, { initialFocusRef, restoreFocus })` (`hooks.js`) traps Tab within `aria-modal` dialogs and restores focus to the trigger on unmount. Used by `LegalDisclaimer` (CTA initial focus, `restoreFocus:false` — the app focuses the first field on dismiss) and `ShortcutsHelp` (mounted only while open, so close via button *or* `Esc` both restore focus). The hook must be mounted only while the dialog is open (mount == active). The calculator tablist uses **roving tabindex** (selected tab `tabindex=0`, others `-1`; ←/→ move between them via `handleTabKey`).
