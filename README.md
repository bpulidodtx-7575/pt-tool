# Plagiocephaly Assessment Tool

CHOA Plagiocephaly Assessment Tool — a clinical **reference** calculator for CVAI (Cranial Vault Asymmetry Index) and Cephalic Ratio. Session-only measurements; nothing is stored or transmitted.

> This is a reference tool, not a diagnostic device.

## Project root is `files/`

All source, `package.json`, and app docs live under [`files/`](./files/). Run every npm command from there.

```bash
cd files
npm install
npm run dev    # http://localhost:3000
```

Other common scripts (also from `files/`): `npm test` · `npm run test:coverage` · `npm run test:e2e` · `npm run lint` · `npm run typecheck` · `npm run build`.

## Docs map

| Doc | What it’s for |
| --- | --- |
| [`files/README.md`](./files/README.md) | Full product README: features, clinical constants, stack, deploy |
| [`AGENTS.md`](./AGENTS.md) | Agent/contributor guide: layout, quirks, CI, a11y |
| [`SECURITY.md`](./SECURITY.md) | Security model and how to report issues |
| [`docs/adr/`](./docs/adr/) | Architectural decision records |

## Privacy

- All measurements are **session-only** (cleared on refresh)
- No backend, no tracking, no PII collected
- See [`SECURITY.md`](./SECURITY.md) for the full model

## License

© 2015 Children's Healthcare of Atlanta · ORTH 961942
