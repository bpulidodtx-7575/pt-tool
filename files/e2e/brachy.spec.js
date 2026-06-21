import { test, expect } from "@playwright/test";

// Brachycephaly (Cephalic Ratio) flow + clipboard, in a real browser.
test.describe("Brachycephaly tool — Cephalic Ratio flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /I understand/i }).click();
    await page.getByRole("tab", { name: /Brachycephaly/i }).click();
  });

  test("computes the cephalic ratio and its CHOA bucket", async ({ page }) => {
    await page.locator("#cr-ml").fill("150");
    await page.locator("#cr-ap").fill("130");
    const panel = page.locator("#panel-cr");
    await expect(panel).toContainText("115.4");
    await expect(panel).toContainText("Orthotic evaluation recommended");
  });

  test("copies a structured EMR note to the clipboard", async ({ page }) => {
    await page.locator("#cr-ml").fill("150");
    await page.locator("#cr-ap").fill("130");
    const panel = page.locator("#panel-cr");
    await panel.getByRole("button", { name: /Copy structured note/i }).click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain("BRACHYCEPHALY ASSESSMENT");
    expect(clip).toContain("Cephalic Ratio: 115.4%");
  });
});
