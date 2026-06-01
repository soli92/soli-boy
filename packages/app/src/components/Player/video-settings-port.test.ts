// @vitest-environment node
// TSK-036 (F-036-01) — Round-trip della persistenza video-settings sul config
// store reale (fake-indexeddb): copre il wrapper concreto + l'adapter.
//
// Verifichiamo che il valore scritto via `save()` sopravviva a una "ricarica"
// (chiusura DB + nuova porta) e venga restituito da `load()`. Questo è il
// contratto di fondo richiesto da F-036-02 (riapplicazione al reload).

import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { closeDB } from "../../storage/db";
import { indexedDbConfig } from "../../storage/indexeddb-adapter";
import { VIDEO_SETTINGS_KEY, makeVideoSettingsPort } from "./video-settings-port";
import type { VideoSettings } from "./useVideoSettings";

beforeEach(async () => {
  await closeDB();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("soli-boy");
    req.onsuccess = () => resolve();
    req.onblocked = () => resolve();
    req.onerror = () => reject(req.error);
  });
});

describe("video-settings-port (TSK-036 F-036-01)", () => {
  it("load() ritorna null quando non c'è preferenza salvata (primo avvio)", async () => {
    const port = makeVideoSettingsPort(indexedDbConfig);
    expect(await port.load()).toBeNull();
  });

  it("save → load: round-trip preserva scale, aspect e filter", async () => {
    const port = makeVideoSettingsPort(indexedDbConfig);
    // TSK-037: il round-trip include il nuovo campo `filter` (US-022).
    const v: VideoSettings = { scale: 4, aspect: "4:3", filter: "scanline" };
    await port.save(v);
    expect(await port.load()).toEqual(v);
  });

  it("persistenza cross-session: dopo closeDB il valore è ancora leggibile", async () => {
    const port = makeVideoSettingsPort(indexedDbConfig);
    const v: VideoSettings = {
      scale: 5,
      aspect: "stretch",
      filter: "smoothing",
    };
    await port.save(v);

    // Simula reload: chiude la connessione e ricrea la porta.
    await closeDB();
    const port2 = makeVideoSettingsPort(indexedDbConfig);
    expect(await port2.load()).toEqual(v);
  });

  it("save è idempotente: l'ultimo valore vince", async () => {
    const port = makeVideoSettingsPort(indexedDbConfig);
    await port.save({ scale: 1, aspect: "original", filter: "nearest" });
    await port.save({ scale: "auto", aspect: "stretch", filter: "smoothing" });
    expect(await port.load()).toEqual({
      scale: "auto",
      aspect: "stretch",
      filter: "smoothing",
    });
  });

  it("usa la chiave canonica `video-settings`", () => {
    expect(VIDEO_SETTINGS_KEY).toBe("video-settings");
  });
});
