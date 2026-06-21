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
- **Core logic** in `files/calc.js` — pure, testable functions (`processCvai`, `processCr`, `validateMeasurement`) plus reference data (`SEVERITY`, `CR_LEVELS`, `RANGES`)
- **Entrypoint**: `files/index.html` → `files/main.jsx` → `ErrorBoundary` → `PlagiocephalyTool.jsx`
- **Styling**: `files/styles.css` — CSS variables + oklch color space. Dark mode: the `useTheme` hook (`hooks.js`) sets `data-theme` on `<html>` for explicit Light/Dark; **System mode (default) leaves the attribute unset** so the `@media (prefers-color-scheme: dark)` rule drives it live. The dark token set is duplicated for `:root[data-theme="dark"]` and the media query — keep them in sync. Choice persists in `sessionStorage` (`pt-theme`); the `<ThemeToggle/>` button lives in the header.
- **Fonts**: Plus Jakarta Sans + JetBrains Mono are **self-hosted** (`files/fonts/*.woff2`, `@font-face` in `styles.css`) — no CDN, works offline
- **PWA**: installable + offline app-shell caching via `vite-plugin-pwa` (`files/vite.config.js`)
  - App icons live in `files/public/` (PNG 192/512 + maskable + apple-touch-180), generated from `public/icon-source.svg` via `npm run generate-pwa-assets` (`pwa-assets.config.js`) and **committed**; regenerate only when the source icon changes (needs `sharp`, a devDep)
- **Test**: `npm test` (Vitest, jsdom). Suites: `calc.test.js` (pure logic), `PlagiocephalyTool.test.jsx` (app flows), `components.test.jsx`, `panels.test.jsx`, `hooks.test.jsx`, `ErrorBoundary.test.jsx`, and `a11y.test.jsx` (automated axe checks).
  - **Coverage**: `npm run test:coverage` (v8 provider) enforces **80%** statements/branches/functions/lines over `calc.js`, `hooks.js`, `components.jsx`, `panels.jsx`, `ErrorBoundary.jsx` (config in `vite.config.js`); CI runs this. Output in `files/coverage/` (gitignored).
  - **a11y**: `a11y.test.jsx` asserts `toHaveNoViolations()` via `vitest-axe` (matcher registered in `test-setup.js`); the `color-contrast` rule is disabled since jsdom can't compute it.
- **Lint**: `npm run lint` (ESLint), **Format**: `npm run format` (Prettier)
- **Typecheck**: `npm run typecheck` — `calc.js` is JSDoc-typed and checked with `tsc --checkJs` (`files/jsconfig.json`)
- **CI**: `.github/workflows/ci.yml` runs lint → typecheck → format check → test (with coverage) → build on Node 20 & 22

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
