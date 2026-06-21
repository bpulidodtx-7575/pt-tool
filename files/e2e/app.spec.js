import { test, expect } from "@playwright/test";

// Core plagiocephaly (CVAI) flow in a real browser.
test.describe("Plagiocephaly tool — CVAI flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // The legal disclaimer gates the app until acknowledged. The CTA's accessible
    // name comes from its aria-label ("Acknowledge disclaimer …"), not its visible text.
    await page.getByRole("button", { name: /Acknowledge disclaimer/i }).click();
  });

  test("auto-focuses the first measurement field after the disclaimer", async ({ page }) => {
    await expect(page.locator("#cvai-a")).toBeFocused();
  });

  test("computes CVAI and renders the severity level", async ({ page }) => {
    await page.locator("#cvai-a").fill("100");
    await page.locator("#cvai-b").fill("90");
    const panel = page.locator("#panel-cvai");
    await expect(panel).toContainText("10.00");
    await expect(panel).toContainText("Level 4");
    await expect(panel).toContainText("Severe asymmetry");
  });

  test("clears a single field with its clear (×) button", async ({ page }) => {
    await page.locator("#cvai-a").fill("123");
    await page.getByRole("button", { name: /Clear Diagonal A/i }).click();
    await expect(page.locator("#cvai-a")).toHaveValue("");
    await expect(page.locator("#cvai-a")).toBeFocused();
  });

  test("flags an invalid value with aria-invalid", async ({ page }) => {
    await page.locator("#cvai-a").fill("0");
    await expect(page.locator("#cvai-a")).toHaveAttribute("aria-invalid", "true");
  });
});
