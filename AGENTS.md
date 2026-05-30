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
- **Single component** — `files/PlagiocephalyTool.jsx` (~700 lines, all-in-one)
- **Core logic** extracted to `files/calc.js` + `files/ranges.js` (testable pure functions)
- **Entrypoint**: `files/index.html` → `files/main.jsx` → `PlagiocephalyTool.jsx`
- **Styling**: `files/styles.css` — CSS variables + oklch color space, dark mode via `prefers-color-scheme`
- **Fonts**: Plus Jakarta Sans + JetBrains Mono loaded from Google Fonts CDN in `index.html` (requires internet)
- **Test**: `npm test` (Vitest) — 19 unit tests for calculation logic
- **Lint**: `npm run lint` (ESLint), **Format**: `npm run format` (Prettier)

## Deployment

- **Netlify** — config at `files/netlify.toml`
- Build: `npm run build`, publish dir: `dist`
- SPA redirect `/* → /index.html`, immutable cache for `dist/*`

## Notable quirks

- Node 18.x or 20.x only (enforced via `package.json` `engines`)
- Vite port is **3000** (not default 5173) — set in `vite.config.js`
- All measurements are session-only (cleared on refresh) — no backend, no storage
- Legal disclaimer modal shown on first load (must be acknowledged)
- Touch targets ≥48px enforced everywhere, iOS-safe 16px font on inputs
