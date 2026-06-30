// @vitest-environment node
// TSK-127 — test della porta `RtcStatePort` (US-066, ADR-009 §3) contro
// l'`IndexedDBAdapter` reale (fake-indexeddb in test).
//
// Scope DoD:
//   - round-trip put→get
//   - get su romId inesistente → null (absence sentinel)
//   - delete poi get → null
//   - delete idempotente (no throw su romId assente)
//   - cascade delete: removeRom rimuove anche la entry rtcState
//   - parità schema: bump DB_VERSION 1→2, store `rtcState` creato in upgrade
//
// Pattern di test allineato a `db.test.ts` (resta su test diretti delle
// funzioni di db.ts, che è ciò che `indexedDbStorage` espone — l'adapter
// IDB è un thin wrapper). Inseriamo la suite qui sotto `storage-port.test.ts`
// come richiesto dal frontmatter TSK-127 `code_path`, per dare alla porta
// RTC un file dedicato (parità con la naming-convention `port.ts`).

import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  addRom,
  closeDB,
  deleteRtcState,
  getRtcState,
  getRom,
  putRtcState,
  removeRom,
} from "./db";
import { indexedDbStorage } from "./indexeddb-adapter";
import type { RtcState } from "../domain/rtc-service";
import type { RomInput } from "./types";

/** Stato RTC canonico di riferimento (ADR-009 §2 wall-clock UTC). */
function sampleState(overrides: Partial<RtcState> = {}): RtcState {
  return {
    year: 2026,
    month: 6,
    day: 30,
    hour: 12,
    minute: 34,
    second: 56,
    ...overrides,
  };
}

function romInput(title: string, content: string): RomInput {
  return {
    title,
    platform: "GBC",
    core: "gambatte",
    fileBlob: new Blob([content]),
  };
}

beforeEach(async () => {
  // Reset completo: chiudi la connessione, elimina il DB (per garantire una
  // migration pulita fra le suite — il bump 1→2 deve essere idempotente).
  await closeDB();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("soli-boy");
    req.onsuccess = () => resolve();
    req.onblocked = () => resolve();
    req.onerror = () => reject(req.error);
  });
});

describe("storage rtcState (TSK-127, ADR-009 §3, US-066)", () => {
  it("putRtcState + getRtcState: round-trip per romId", async () => {
    const romId = "rom-abc";
    const state = sampleState();
    await putRtcState(romId, state);
    const got = await getRtcState(romId);
    // Confronto strutturale (la entry persiste i campi internamente in un
    // RtcStateRecord, ma getRtcState ritorna solo il payload `state` canonico).
    expect(got).toEqual(state);
  });

  it("getRtcState su romId inesistente → null (absence sentinel)", async () => {
    expect(await getRtcState("ghost-rom")).toBeNull();
  });

  it("deleteRtcState rimuove ed è idempotente", async () => {
    const romId = "rom-xyz";
    await putRtcState(romId, sampleState());
    await deleteRtcState(romId);
    expect(await getRtcState(romId)).toBeNull();
    // Idempotente: deleteRtcState su entry già assente non solleva.
    await expect(deleteRtcState(romId)).resolves.toBeUndefined();
    // E un secondo delete su ROM mai vista è altrettanto safe.
    await expect(deleteRtcState("mai-vista")).resolves.toBeUndefined();
  });

  it("putRtcState è idempotente per romId (sovrascrittura)", async () => {
    const romId = "rom-update";
    await putRtcState(romId, sampleState({ year: 2026, hour: 10 }));
    await putRtcState(romId, sampleState({ year: 2030, hour: 23 }));
    const got = await getRtcState(romId);
    // L'ultima put vince: parità con la semantica di `putSram` (chiave =
    // keyPath dello store, single entry per romId).
    expect(got).toEqual(sampleState({ year: 2030, hour: 23 }));
  });

  it("segregazione per romId: due ROM hanno stati indipendenti", async () => {
    await putRtcState("rom-A", sampleState({ year: 2026 }));
    await putRtcState("rom-B", sampleState({ year: 2030 }));
    expect((await getRtcState("rom-A"))?.year).toBe(2026);
    expect((await getRtcState("rom-B"))?.year).toBe(2030);
    // Delete su A non tocca B.
    await deleteRtcState("rom-A");
    expect(await getRtcState("rom-A")).toBeNull();
    expect(await getRtcState("rom-B")).not.toBeNull();
  });
});

describe("storage rtcState cascade-delete (TSK-127, US-066 AC)", () => {
  it("removeRom elimina anche lo stato RTC associato", async () => {
    const romId = await addRom(romInput("Pokémon Crystal", "CRYSTAL-BYTES"));
    await putRtcState(romId, sampleState());
    // Pre-condizione: RTC e ROM presenti.
    expect(await getRom(romId)).toBeDefined();
    expect(await getRtcState(romId)).not.toBeNull();

    await removeRom(romId);

    // Post-condizione: entrambi rimossi (cascade).
    expect(await getRom(romId)).toBeUndefined();
    expect(await getRtcState(romId)).toBeNull();
  });

  it("removeRom è idempotente anche con cascade RTC (no throw)", async () => {
    // Nessun RTC mai persistito → la cascade non solleva.
    const romId = await addRom(romInput("Pokémon Gold", "GOLD-BYTES"));
    await removeRom(romId);
    await expect(removeRom(romId)).resolves.toBeUndefined();
    expect(await getRtcState(romId)).toBeNull();
  });

  it("removeRom rimuove RTC senza toccare altri romId", async () => {
    const id1 = await addRom(romInput("Pokémon Silver", "SILVER-BYTES"));
    const id2 = await addRom(romInput("Pokémon Crystal", "CRYSTAL-BYTES"));
    await putRtcState(id1, sampleState({ year: 2026 }));
    await putRtcState(id2, sampleState({ year: 2030 }));
    await removeRom(id1);
    expect(await getRtcState(id1)).toBeNull();
    expect((await getRtcState(id2))?.year).toBe(2030);
  });
});

describe("storage rtcState — porta StoragePort/SaveStoragePort (TSK-127)", () => {
  // Smoke test: verifica che l'adapter IDB esposto come `indexedDbStorage`
  // implementi davvero le tre ops della porta. Se il SaveService (US-067/068)
  // riceve una `SaveStoragePort`, deve poter chiamare putRtcState/getRtcState/
  // deleteRtcState senza fare cast aggiuntivi.
  it("indexedDbStorage espone putRtcState / getRtcState / deleteRtcState", async () => {
    const romId = "rom-port";
    const state = sampleState();
    await indexedDbStorage.putRtcState(romId, state);
    expect(await indexedDbStorage.getRtcState(romId)).toEqual(state);
    await indexedDbStorage.deleteRtcState(romId);
    expect(await indexedDbStorage.getRtcState(romId)).toBeNull();
  });
});
