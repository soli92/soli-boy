// Helper navigazione e2e — IA a 4 tab (increment 2, TSK-088/113).
//
// LegalNotice e StoreComplianceNotice vivono nel panel "Info & Privacy", non
// più nel footer né all'avvio. Al boot compare il banner privacy (TSK-069).

import { expect, type Page } from "@playwright/test";

/** Payload accettato da `page.setInputFiles` (path o buffer in-memory). */
export type RomUpload =
  | string
  | string[]
  | {
      name: string;
      mimeType: string;
      buffer: Buffer;
    }
  | Array<{
      name: string;
      mimeType: string;
      buffer: Buffer;
    }>;

export const INFO_PRIVACY_TAB = "Info & Privacy";

/** App idratata: la tab bar è sempre visibile (con o senza banner privacy). */
export async function waitForAppBoot(page: Page): Promise<void> {
  await expect(page.getByRole("tablist", { name: "Sezioni app" })).toBeVisible({
    timeout: 10_000,
  });
}

/** Chiude il banner privacy se visibile (IDB pulito → primo avvio). */
export async function dismissPrivacyBannerIfVisible(page: Page): Promise<void> {
  const banner = page.getByTestId("sb-privacy-banner");
  if (await banner.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: /ho capito/i }).click();
    await expect(banner).not.toBeVisible();
  }
}

export async function openInfoPrivacyTab(page: Page): Promise<void> {
  await page.getByRole("tab", { name: INFO_PRIVACY_TAB }).click();
  await expect(page.locator('[data-testid="panel-info"]')).toBeVisible();
}

export async function expectLegalNotice(page: Page): Promise<void> {
  await expect(page.getByRole("note", { name: /avviso legale/i })).toContainText(
    /non distribuisce/i,
  );
}

export async function expectStoreComplianceNotice(page: Page): Promise<void> {
  await expect(
    page.getByRole("note", { name: /avviso conformità store/i }),
  ).toContainText(/non include, distribuisce né supporta/i);
}

/** Naviga e attende il boot UI (tab bar visibile). */
export async function gotoApp(page: Page, path = "/"): Promise<void> {
  await page.goto(path);
  await waitForAppBoot(page);
}

/** Naviga con StubEngine e attende il boot UI. */
export async function gotoStubApp(page: Page, path = "/?engine=stub"): Promise<void> {
  await gotoApp(page, path);
}

/** Apre il panel Libreria (FileLoader montato solo con `activeTab === "library"`). */
export async function openLibraryTab(page: Page): Promise<void> {
  await waitForAppBoot(page);
  await page.getByRole("tab", { name: "Libreria" }).click();
  await expect(page.locator('[data-testid="panel-library"]')).toBeVisible();
  await expect(page.getByLabel("Carica ROM")).toBeAttached();
}

/** Carica una ROM via FileLoader nel panel Libreria. */
export async function uploadRom(page: Page, files: RomUpload): Promise<void> {
  await openLibraryTab(page);
  await page.getByLabel("Carica ROM").setInputFiles(files);
}

export async function openSettingsTab(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Impostazioni" }).click();
  await expect(page.locator('[data-testid="panel-settings"]')).toBeVisible();
  await dismissPrivacyBannerIfVisible(page);
}

/** Apre l'accordion "Controlli — rimappatura" (chiuso di default in Settings).
 *
 * TSK-149 (EP-020 / US-097) — Settings ora usa solids `Accordion` (Radix): il
 * trigger è un `<button>` con `aria-expanded` e `data-state=open|closed`. Il
 * click è idempotente (Radix ignora doppi click quando già open) ma leggiamo
 * `data-state` per evitare toggle non necessari (parità con il vecchio guard
 * su `HTMLDetailsElement.open`). Il testo del trigger è invariato. */
export async function openControlsRemapAccordion(page: Page): Promise<void> {
  const trigger = page.getByRole("button", {
    name: /^Controlli — rimappatura$/i,
  });
  const state = await trigger.getAttribute("data-state");
  if (state !== "open") {
    await trigger.click();
  }
  await expect(page.getByLabel("Pulsante per ArrowUp")).toBeVisible();
}

/**
 * Seleziona una ROM in Libreria (auto-start TSK-100) e attende `data-state=running`.
 * Gestisce il gate "Cambia gioco?" (TSK-101).
 *
 * Non clicca "Avvia": un secondo avvio su engine reali (mGBA/WasmBoy) può far
 * fallire `loadGame` con alert `MgbaEngine.load: loadGame fallito` (flake CI).
 */
export async function selectLibraryTileAndAutoStart(
  page: Page,
  tileName: string | RegExp,
  options?: { screenSelector?: string; runningTimeout?: number },
): Promise<void> {
  const tile = page.getByRole("button", { name: tileName });
  await expect(tile).toBeVisible();
  await tile.click();
  const changeDialog = page.getByRole("dialog", { name: /cambia gioco/i });
  if (await changeDialog.isVisible()) {
    await page.getByRole("button", { name: /cambia gioco/i }).click();
  }
  const screen = page.locator(options?.screenSelector ?? ".sb-screen");
  await expect(screen).toHaveAttribute("data-state", "running", {
    timeout: options?.runningTimeout ?? 30_000,
  });
}
