// EP-021 — Visual oracle side-by-side: produzione vs prototipo EP-020.
//
// Verifica parità strutturale (marker DOM) e cattura screenshot comparabili
// su shell, Play idle e Info. Non usa pixel-diff rigido: copy e dati reali
// differiscono; l'obiettivo è regression guard su layout EP-021.

import crypto from "node:crypto";
import { expect, test } from "@playwright/test";
import { dismissPrivacyBannerIfVisible } from "./helpers/app-nav";
import { setThemeViaDB } from "./helpers/set-theme";
import {
  INFO_MARKERS,
  PLAY_IDLE_MARKERS,
  SHELL_MARKERS,
  assertMarkersVisible,
  assertScreenshotNonEmpty,
  gotoProduction,
  gotoPrototype,
} from "./helpers/visual-fidelity";

const DESKTOP = { width: 1280, height: 800 };

test.describe("EP-021 — visual oracle prototipo vs produzione", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
  });

  test("shell: marker strutturali presenti su entrambe le app", async ({
    browser,
  }) => {
    const prod = await browser.newPage();
    const proto = await browser.newPage();
    await gotoProduction(prod);
    await dismissPrivacyBannerIfVisible(prod);
    await gotoPrototype(proto);

    await assertMarkersVisible(prod, SHELL_MARKERS);
    await assertMarkersVisible(proto, SHELL_MARKERS);

    await prod.close();
    await proto.close();
  });

  test("Play idle: schermo + drop-zone su prod e prototipo", async ({
    browser,
  }) => {
    const prod = await browser.newPage();
    const proto = await browser.newPage();
    await gotoProduction(prod);
    await dismissPrivacyBannerIfVisible(prod);
    await gotoPrototype(proto);

    await assertMarkersVisible(prod, PLAY_IDLE_MARKERS.prod);
    await assertMarkersVisible(proto, PLAY_IDLE_MARKERS.proto);

    await prod.close();
    await proto.close();
  });

  test("Info: sezioni privacy, store compliance e legali", async ({
    browser,
  }) => {
    const prod = await browser.newPage();
    const proto = await browser.newPage();
    await gotoProduction(prod);
    await dismissPrivacyBannerIfVisible(prod);
    await prod.getByRole("tab", { name: /info/i }).click();
    await gotoPrototype(proto);
    await proto.getByRole("tab", { name: /info/i }).click();

    await assertMarkersVisible(prod, INFO_MARKERS.prod);
    await assertMarkersVisible(proto, INFO_MARKERS.proto);

    await prod.close();
    await proto.close();
  });

  test("screenshot side-by-side: shell cyberpunk (prod ≠ proto, entrambi validi)", async ({
    browser,
  }) => {
    const prod = await browser.newPage();
    const proto = await browser.newPage();

    await gotoProduction(prod);
    await dismissPrivacyBannerIfVisible(prod);
    await setThemeViaDB(prod, "cyberpunk");
    await gotoPrototype(proto);
    // Prototipo default index.html = cyberpunk
    await expect(prod.locator("html")).toHaveAttribute("data-theme", "cyberpunk");
    await expect(proto.locator("html")).toHaveAttribute("data-theme", "cyberpunk");

    const prodShot = await prod.screenshot({ fullPage: false });
    const protoShot = await proto.screenshot({ fullPage: false });
    assertScreenshotNonEmpty(prodShot);
    assertScreenshotNonEmpty(protoShot);

    const prodMd5 = crypto.createHash("md5").update(prodShot).digest("hex");
    const protoMd5 = crypto.createHash("md5").update(protoShot).digest("hex");
    expect(
      prodMd5,
      "screenshot prod e proto non devono essere byte-identici (copy/dati differiscono)",
    ).not.toBe(protoMd5);

    await test.info().attach("prod-shell-cyberpunk.png", {
      body: prodShot,
      contentType: "image/png",
    });
    await test.info().attach("proto-shell-cyberpunk.png", {
      body: protoShot,
      contentType: "image/png",
    });

    await prod.close();
    await proto.close();
  });
});
