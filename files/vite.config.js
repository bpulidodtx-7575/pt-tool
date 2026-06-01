import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
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
    environment: "node",
  },
})
