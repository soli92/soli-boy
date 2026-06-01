// TSK-048 — E2e smoke test brand: favicon, manifest, logo header (US-037/038/039).
// Verifica che gli artefatti brand introdotti da TSK-043, TSK-045 e TSK-046
// siano presenti e raggiungibili a runtime in Chromium.
// Engine: StubEngine (default, nessun parametro ?engine=real necessario).
import { expect, test } from "@playwright/test";

test("favicon dichiarata in head", async ({ page }) => {
  await page.goto("/");
  const faviconHref = await page.locator('link[rel="icon"]').first().getAttribute("href");
  expect(faviconHref).toBeTruthy();
});

test("manifest.webmanifest raggiungibile", async ({ page }) => {
  await page.goto("/");
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBeTruthy();
  // Verifica HTTP 200 e contenuto JSON del manifest.
  const resp = await page.request.get(manifestHref!);
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.name).toBe("Soli-boy");
  expect(body.icons?.length).toBeGreaterThanOrEqual(2);
});

test("logo Soli-boy visibile nella Library", async ({ page }) => {
  await page.goto("/");
  // TSK-046 rende il logo come <img alt="Soli-boy"> (non un form control):
  // getByAltText è il locator corretto; getByLabel è riservato ai form control.
  await expect(page.getByAltText("Soli-boy")).toBeVisible();
});
