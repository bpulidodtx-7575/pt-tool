import { defineConfig, devices } from "@playwright/test";

// Real-browser E2E. Specs live in ./e2e and use the *.spec.js suffix so they
// never collide with the Vitest unit suite (*.test.js). Tests run against the
// production build served by `vite preview`, exercising real CSS, focus, and
// clipboard — things jsdom can only approximate.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.js",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:4173",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    // The "copy note" feature writes/reads the clipboard.
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
