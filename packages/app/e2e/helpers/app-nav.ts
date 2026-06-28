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

export async function openInfoPrivacyTab(page: Page): Promise<void> {
  await page.getByRole("tab", { name: INFO_PRIVACY_TAB }).click();
  await expect(page.locator("#panel-info")).toBeVisible();
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

/** Naviga con StubEngine e attende il boot UI. */
export async function gotoStubApp(page: Page, path = "/?engine=stub"): Promise<void> {
  await page.goto(path);
  await waitForAppBoot(page);
}

/** Apre il panel Libreria (FileLoader montato solo con `activeTab === "library"`). */
export async function openLibraryTab(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Libreria" }).click();
  await expect(page.getByLabel("Carica ROM")).toBeAttached();
}

/** Carica una ROM via FileLoader nel panel Libreria. */
export async function uploadRom(page: Page, files: RomUpload): Promise<void> {
  await openLibraryTab(page);
  await page.getByLabel("Carica ROM").setInputFiles(files);
}
