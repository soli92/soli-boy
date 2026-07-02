// EP-021 — Helper confronto strutturale app vs prototipo EP-020.

import { expect, type Page } from "@playwright/test";

export const PROD_BASE_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:4173";
export const PROTO_BASE_URL = "http://localhost:4174";

/** Marker DOM condivisi fra produzione e prototipo (shell EP-021). */
export const SHELL_MARKERS = [
  ".proto-root",
  ".theme-switcher",
  ".sb-app-header, header", // prod: sb-app-header; proto: inline header
] as const;

/** Marker tab Play idle. */
export const PLAY_IDLE_MARKERS = {
  prod: [".sb-screen", '[data-testid="play-idle-drop-zone"]'],
  proto: [".sb-screen", ".drop-zone"],
} as const;

/** Marker tab Info. */
export const INFO_MARKERS = {
  prod: [
    '[data-testid="sb-privacy-section"]',
    '[data-testid="sb-store-compliance-section"]',
    '[data-testid="sb-legal-card"]',
  ],
  proto: ["text=Privacy Notice", "text=Store Compliance", "text=Note Legali"],
} as const;

export async function gotoProduction(
  page: Page,
  path = "/?engine=stub",
): Promise<void> {
  await page.goto(`${PROD_BASE_URL}${path}`);
  await expect(page.getByRole("tablist", { name: "Sezioni app" })).toBeVisible({
    timeout: 15_000,
  });
}

export async function gotoPrototype(page: Page): Promise<void> {
  await page.goto(PROTO_BASE_URL);
  await expect(page.locator(".proto-root")).toBeVisible({ timeout: 60_000 });
}

export async function assertMarkersVisible(
  page: Page,
  markers: readonly string[],
): Promise<void> {
  for (const marker of markers) {
    await expect(
      page.locator(marker).first(),
      `marker visibile: ${marker}`,
    ).toBeVisible();
  }
}

/** Screenshot non vuoto: almeno `minBytes` e non tutti byte identici. */
export function assertScreenshotNonEmpty(
  buffer: Buffer,
  minBytes = 8_000,
): void {
  expect(buffer.byteLength, "screenshot troppo piccolo").toBeGreaterThan(minBytes);
  const unique = new Set(buffer);
  expect(unique.size, "screenshot monocolore/svuotato").toBeGreaterThan(16);
}
