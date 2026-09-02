import { defineConfig } from "@vite-pwa/assets-generator/config";

// Generates the raster icon set into files/public/ from the square source SVG.
// Run with `npm run generate-pwa-assets` and commit the output; the build/CI then
// just copy the committed PNGs (no rasterization at build time).
//
// padding: 0 — icon-source.svg is already a finished, full-bleed app icon with the
// mark inside the maskable safe zone, so no extra padding/background is added.
export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    transparent: { sizes: [64, 192, 512] },
    maskable: { sizes: [512], padding: 0 },
    apple: { sizes: [180], padding: 0 },
  },
  images: ["public/icon-source.svg"],
});
