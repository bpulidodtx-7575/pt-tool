import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // "prompt": a new service worker waits for an explicit user action (the
      // PwaReloadPrompt UI) instead of silently reloading mid-assessment.
      registerType: "prompt",
      includeAssets: ["favicon.svg", "apple-touch-icon-180x180.png"],
      // App shell only — there is no backend or patient data to sync, so we
      // precache the build output and serve it offline at the bedside.
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
      manifest: {
        name: "Plagiocephaly Assessment Tool",
        short_name: "Plagiocephaly",
        description: "CHOA Plagiocephaly Assessment Tool — CVAI and Cephalic Ratio clinical reference.",
        theme_color: "#f2673c",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        // Raster set generated from public/icon-source.svg via
        // `npm run generate-pwa-assets` (see pwa-assets.config.js).
        icons: [
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    target: "es2020",
  },
  server: {
    open: true,
    port: 3000,
  },
  test: {
    include: ["**/*.test.js", "**/*.test.jsx"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test-setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Cover the app's logic, components and the screen that orchestrates them.
      // Still excluded: entry/config, icons.jsx, and Diagrams.jsx — the latter is
      // largely-static SVG markup that integration tests render but do not assert
      // (17% covered; including it would drag the floor down for no real signal).
      include: ["calc.js", "hooks.js", "components.jsx", "panels.jsx", "ErrorBoundary.jsx", "PlagiocephalyTool.jsx"],
      // Ratchet, not an aspiration: these sit just under the measured values
      // (98.42 / 92.30 / 96.42 / 98.42) so coverage can only hold or improve.
      // Raise them when it rises; never lower them to make a red build pass.
      thresholds: {
        statements: 98,
        branches: 92,
        functions: 96,
        lines: 98,
      },
    },
  },
});
