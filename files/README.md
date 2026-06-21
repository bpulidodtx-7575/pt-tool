# Plagiocephaly Assessment Tool

CHOA Plagiocephaly Assessment Tool — A clinical reference application for CVAI (Cranial Vault Asymmetry Index) and Cephalic Ratio measurements.

## Features

- ✅ **CVAI Calculator** — Diagonal asymmetry assessment for plagiocephaly
- ✅ **Cephalic Ratio** — Width-to-length ratio assessment for brachycephaly
- ✅ **Severity Scales** — CHOA severity levels with color-coded reference
- ✅ **Age Guidelines** — Clinical recommendations by age group
- ✅ **Session Only** — All measurements cleared on page refresh, no data transmitted
- ✅ **Accessibility** — WCAG compliant with keyboard navigation
- ✅ **Dark Mode** — Automatic theme support via OS preferences
- ✅ **Responsive** — Optimized for desktop, tablet, and mobile
- ✅ **Offline / installable** — PWA with app-shell caching, maskable + raster app icons; self-hosted fonts (no CDN)

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: CSS with oklch color space + CSS variables
- **Typography**: Plus Jakarta Sans + JetBrains Mono (self-hosted, `files/fonts/`)
- **PWA**: `vite-plugin-pwa` (offline app-shell)
- **Testing**: Vitest + React Testing Library (jsdom), v8 coverage (80% threshold), axe accessibility checks (`vitest-axe`)
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) — lint, typecheck, format check, test + coverage, build on Node 20 & 22
- **Deployment**: Netlify

## Local Development

### Prerequisites

- Node.js 20 or newer
- npm or yarn

> **Note:** All source and `package.json` live under `files/`. Run every npm
> command from there.

### Setup

```bash
cd files

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Test & lint

```bash
npm test           # Run the Vitest suite once
npm run test:watch
npm run test:coverage  # Vitest with v8 coverage (enforces 80% thresholds)
npm run lint       # ESLint
npm run typecheck  # tsc --checkJs over calc.js (JSDoc types)
npm run format     # Prettier (write)
```

### Build

```bash
# Create production build
npm run build

# Preview build locally
npm run preview
```

## Deployment to Netlify

### Option 1: Connect via Git (Recommended)

1. **Push to GitHub/GitLab/Bitbucket**

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Plagiocephaly Assessment Tool"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/plagiocephaly-tool
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider
   - Select your repository
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click "Deploy"

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI globally (optional)
npm install -g netlify-cli

# Deploy from this directory
netlify deploy --prod
```

### Option 3: Drag & Drop

1. Run `npm run build` locally
2. Go to [netlify.com/drop](https://netlify.com/drop)
3. Drag the `dist` folder onto the page
4. Your site is live!

## Project Structure

```
files/
├── index.html              # HTML entry point
├── main.jsx                # React app entry point (wraps App in ErrorBoundary)
├── PlagiocephalyTool.jsx   # App shell (header, tabs, sticky result)
├── panels.jsx              # CvaiPanel, CrPanel, SeverityTable, AgeGuidelines
├── components.jsx          # Toast, LegalDisclaimer, NumberInput, ResultCard, StickyResult …
├── Diagrams.jsx            # SVG measurement diagrams + guide
├── icons.jsx               # Inline SVG icon set
├── hooks.js                # useCopy, useScrolled
├── ErrorBoundary.jsx       # Graceful crash fallback
├── calc.js                 # Pure calculation logic + reference data (JSDoc-typed)
├── jsconfig.json           # tsc --checkJs config for calc.js
├── calc.test.js            # Unit tests for calc.js
├── PlagiocephalyTool.test.jsx  # App-level flow tests
├── components.test.jsx     # Toast, NumberInput, ResultCard, StickyResult … tests
├── panels.test.jsx         # SeverityTable + AgeGuidelines tests
├── hooks.test.jsx          # useCopy, useScrolled tests
├── ErrorBoundary.test.jsx  # Error fallback tests
├── a11y.test.jsx           # Automated accessibility checks (axe)
├── test-setup.js           # jsdom polyfills + axe matcher
├── styles.css              # Flat design system + dark mode + @font-face
├── fonts/                  # Self-hosted woff2 fonts
├── public/                 # Static assets: favicon.svg + generated PWA icons (PNG)
├── pwa-assets.config.js    # PWA icon generator config (npm run generate-pwa-assets)
├── vite.config.js          # Vite build + PWA + test config
├── netlify.toml            # Netlify deployment config
└── README.md               # This file

.github/workflows/ci.yml    # CI: lint, typecheck, format check, test + coverage, build (Node 20 & 22)
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+
- Mobile browsers (iOS Safari 15+, Chrome Mobile 90+)

**Note**: Full oklch color space support requires modern browsers. Fallbacks provided for older browsers.

## Performance

- **Small bundle**: React 18 + minimal dependencies
- **Fast renders**: No router or state library overhead
- **Code-split ready**: Architecture supports lazy loading if expanded

## Accessibility

- WCAG 2.1 Level AA compliant
- Keyboard navigation (Tab, Arrow keys)
- Screen reader optimized
- High contrast mode support
- Skip navigation link

## Privacy

✅ **All data is session-only** — cleared on page refresh  
✅ No data transmitted to servers  
✅ No tracking or analytics cookies  
✅ HIPAA-friendly for clinical use

## License

© 2015 Children's Healthcare of Atlanta · ORTH 961942

## Support

For issues or questions:

- Check browser console for errors
- Test in a private/incognito window

## Environment

Built and tested on Node 20+ with npm 9+.

---

Ready to deploy? Follow the **Deployment to Netlify** section above.
