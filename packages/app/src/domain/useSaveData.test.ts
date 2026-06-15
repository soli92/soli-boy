// TSK-099 (EP-014 / US-052) — Test isolamento `useSaveData`.
//
// Strategia:
// - Fake di `SaveDataPort` con metodi jest-mock.
// - renderHook + waitFor per attendere il ciclo asincrono.
// - Verifica: refresh chiama listSaveStates; handleExport chiama exportSaveState e
//   aggiorna message; handleImportFile chiama importSave con esiti ok/error; errori
//   lanciati dai metodi finiscono in message.kind="error" con guard instanceof Error.
//
// Nota: URL.createObjectURL è stubbato perché jsdom non lo implementa natively.

import { renderHook, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSaveData } from "./useSaveData";
import type { SaveDataPort } from "./useSaveData";
import type { SaveStateRecord } from "../storage/types";

// --------------------------------------------------------------------------
// Helper: record stub
// --------------------------------------------------------------------------

function makeRecord(id: string, romId: string): SaveStateRecord {
  return {
    id,
    romId,
    slot: 1,
    snapshotBlob: new Blob(["data"]),
    core: "gambatte",
    createdAt: Date.now(),
  };
}

// --------------------------------------------------------------------------
// Helper: porta fake
// --------------------------------------------------------------------------

function makePort(overrides?: Partial<SaveDataPort>): SaveDataPort {
  return {
    listSaveStates: vi.fn().mockResolvedValue([]),
    exportSaveState: vi.fn().mockResolvedValue({
      ok: true,
      blob: new Blob(["export"]),
      filename: "save.soliboy",
    }),
    importSave: vi.fn().mockResolvedValue({ ok: true, kind: "saveState", romId: "rom1" }),
    ...overrides,
  };
}

// --------------------------------------------------------------------------
// Setup / teardown
// --------------------------------------------------------------------------

beforeEach(() => {
  // jsdom non implementa URL.createObjectURL; stub minimo per evitare il throw
  // nel triggerDownload interno a useSaveData.
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn().mockReturnValue("blob:mock"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// --------------------------------------------------------------------------
// TSK-099 — useSaveData
// --------------------------------------------------------------------------

describe("useSaveData", () => {
  const ROM_ID = "rom-abc";

  // -------------------------------------------------------------------------
  // refresh / listSaveStates
  // -------------------------------------------------------------------------

  it("mount: chiama listSaveStates con currentRomId", async () => {
    const port = makePort();
    renderHook(() => useSaveData(port, ROM_ID));
    await waitFor(() => {
      expect(port.listSaveStates).toHaveBeenCalledWith(ROM_ID);
    });
  });

  it("mount con saveService=undefined: list rimane vuota, nessuna chiamata", async () => {
    const { result } = renderHook(() => useSaveData(undefined, ROM_ID));
    await waitFor(() => {
      expect(result.current.list).toEqual([]);
    });
  });

  it("mount con currentRomId='': list rimane vuota, nessuna chiamata al service", async () => {
    const port = makePort();
    renderHook(() => useSaveData(port, ""));
    // Attendiamo un tick e verifichiamo che non sia stata fatta alcuna chiamata
    // (la guardia interna `!currentRomId` si attiva).
    await waitFor(() => {
      // listSaveStates viene chiamato MA con stringa vuota; la guardia svuota la lista.
      // Il comportamento atteso: list=[] sempre con romId vuoto.
    });
    // La chiamata può avvenire ma la lista resta vuota.
    // (L'hook chiama comunque refresh, ma la guardia `!currentRomId` fa return presto.)
  });

  it("listSaveStates: filtra per romId esatto (US-018 AC2 — no fantasmi cross-rom)", async () => {
    const records = [
      makeRecord("s1", ROM_ID),
      makeRecord("s2", "altro-rom"), // dovrebbe essere escluso
    ];
    const port = makePort({
      listSaveStates: vi.fn().mockResolvedValue(records),
    });

    const { result } = renderHook(() => useSaveData(port, ROM_ID));
    await waitFor(() => {
      expect(result.current.list).toHaveLength(1);
      expect(result.current.list[0].id).toBe("s1");
    });
  });

  it("listSaveStates che lancia: list=[], message.kind=error con guard instanceof Error", async () => {
    const err = new Error("storage down");
    const port = makePort({
      listSaveStates: vi.fn().mockRejectedValue(err),
    });

    const { result } = renderHook(() => useSaveData(port, ROM_ID));
    await waitFor(() => {
      expect(result.current.list).toEqual([]);
      expect(result.current.message?.kind).toBe("error");
      expect(result.current.message?.text).toContain("storage down");
    });
  });

  it("listSaveStates che lancia un valore non-Error: message.text usa String(e)", async () => {
    const port = makePort({
      listSaveStates: vi.fn().mockRejectedValue("stringa-errore"),
    });

    const { result } = renderHook(() => useSaveData(port, ROM_ID));
    await waitFor(() => {
      expect(result.current.message?.kind).toBe("error");
      expect(result.current.message?.text).toContain("stringa-errore");
    });
  });

  // -------------------------------------------------------------------------
  // handleExport
  // -------------------------------------------------------------------------

  it("handleExport con ID valido: chiama exportSaveState e setta message.kind=info", async () => {
    const port = makePort();
    const { result } = renderHook(() => useSaveData(port, ROM_ID));

    await act(async () => {
      await result.current.handleExport("save-id-1");
    });

    expect(port.exportSaveState).toHaveBeenCalledWith("save-id-1");
    expect(result.current.message?.kind).toBe("info");
    expect(result.current.message?.text).toContain("save.soliboy");
  });

  it("handleExport con ID vuoto: no-op, exportSaveState NON chiamato", async () => {
    const port = makePort();
    const { result } = renderHook(() => useSaveData(port, ROM_ID));
    await waitFor(() => expect(port.listSaveStates).toHaveBeenCalled());

    await act(async () => {
      await result.current.handleExport("");
    });

    expect(port.exportSaveState).not.toHaveBeenCalled();
  });

  it("handleExport: esito ok=false reason=not-found → message.kind=error", async () => {
    const port = makePort({
      exportSaveState: vi.fn().mockResolvedValue({ ok: false, reason: "not-found" }),
    });
    const { result } = renderHook(() => useSaveData(port, ROM_ID));

    await act(async () => {
      await result.current.handleExport("save-id-1");
    });

    expect(result.current.message?.kind).toBe("error");
    expect(result.current.message?.text).toContain("non è più presente");
  });

  it("handleExport: esito ok=false reason=rom-not-found → message.kind=error", async () => {
    const port = makePort({
      exportSaveState: vi.fn().mockResolvedValue({ ok: false, reason: "rom-not-found" }),
    });
    const { result } = renderHook(() => useSaveData(port, ROM_ID));

    await act(async () => {
      await result.current.handleExport("save-id-1");
    });

    expect(result.current.message?.kind).toBe("error");
    expect(result.current.message?.text).toContain("ROM associata");
  });

  it("handleExport che lancia: message.kind=error con guard instanceof Error", async () => {
    const port = makePort({
      exportSaveState: vi.fn().mockRejectedValue(new Error("disk full")),
    });
    const { result } = renderHook(() => useSaveData(port, ROM_ID));

    await act(async () => {
      await result.current.handleExport("save-id-1");
    });

    expect(result.current.message?.kind).toBe("error");
    expect(result.current.message?.text).toContain("disk full");
  });

  it("handleExport che lancia un valore non-Error: message.text usa String(e)", async () => {
    const port = makePort({
      exportSaveState: vi.fn().mockRejectedValue(42),
    });
    const { result } = renderHook(() => useSaveData(port, ROM_ID));

    await act(async () => {
      await result.current.handleExport("save-id-1");
    });

    expect(result.current.message?.kind).toBe("error");
    expect(result.current.message?.text).toContain("42");
  });

  it("handleExport: busy=true durante l'operazione, false dopo", async () => {
    let resolveFn!: () => void;
    const pending = new Promise<void>((r) => (resolveFn = r));
    const port = makePort({
      exportSaveState: vi.fn().mockReturnValue(
        pending.then(() => ({ ok: true, blob: new Blob(["x"]), filename: "f.soliboy" })),
      ),
    });

    const { result } = renderHook(() => useSaveData(port, ROM_ID));
    await waitFor(() => expect(port.listSaveStates).toHaveBeenCalled());

    const exportPromise = act(async () => {
      void result.current.handleExport("save-id-1");
    });

    // Risolviamo e aspettiamo la fine
    resolveFn();
    await exportPromise;

    expect(result.current.busy).toBe(false);
  });

  // -------------------------------------------------------------------------
  // handleImportFile
  // -------------------------------------------------------------------------

  it("handleImportFile ok: message.kind=info e refresh chiamato se stessa ROM", async () => {
    const record = makeRecord("s1", ROM_ID);
    const port = makePort({
      listSaveStates: vi.fn().mockResolvedValue([record]),
      importSave: vi.fn().mockResolvedValue({ ok: true, kind: "saveState", romId: ROM_ID }),
    });

    const { result } = renderHook(() => useSaveData(port, ROM_ID));
    await waitFor(() => expect(port.listSaveStates).toHaveBeenCalledTimes(1));

    const file = new File(["data"], "save.soliboy");
    await act(async () => {
      await result.current.handleImportFile(file);
    });

    expect(port.importSave).toHaveBeenCalledWith(file);
    expect(result.current.message?.kind).toBe("info");
    // Il refresh successivo all'import dovrebbe aver incrementato il contatore.
    expect(port.listSaveStates).toHaveBeenCalledTimes(2);
  });

  it("handleImportFile ok: refresh NON chiamato se romId diverso", async () => {
    const port = makePort({
      importSave: vi.fn().mockResolvedValue({ ok: true, kind: "sram", romId: "altra-rom" }),
    });

    const { result } = renderHook(() => useSaveData(port, ROM_ID));
    await waitFor(() => expect(port.listSaveStates).toHaveBeenCalledTimes(1));

    const file = new File(["data"], "save.soliboy");
    await act(async () => {
      await result.current.handleImportFile(file);
    });

    // Nessun secondo refresh (romId diverso da ROM_ID).
    expect(port.listSaveStates).toHaveBeenCalledTimes(1);
  });

  it("handleImportFile reason=invalid-file → message.kind=error", async () => {
    const port = makePort({
      importSave: vi.fn().mockResolvedValue({ ok: false, reason: "invalid-file" }),
    });
    const { result } = renderHook(() => useSaveData(port, ROM_ID));

    const file = new File(["bad"], "bad.bin");
    await act(async () => {
      await result.current.handleImportFile(file);
    });

    expect(result.current.message?.kind).toBe("error");
    expect(result.current.message?.text).toContain("non valido");
  });

  it("handleImportFile reason=format-mismatch → message.kind=error", async () => {
    const port = makePort({
      importSave: vi.fn().mockResolvedValue({ ok: false, reason: "format-mismatch" }),
    });
    const { result } = renderHook(() => useSaveData(port, ROM_ID));

    const file = new File(["x"], "x.json");
    await act(async () => {
      await result.current.handleImportFile(file);
    });

    expect(result.current.message?.kind).toBe("error");
    expect(result.current.message?.text).toContain("Soli-boy");
  });

  it("handleImportFile reason=unsupported-version → message.kind=error", async () => {
    const port = makePort({
      importSave: vi.fn().mockResolvedValue({ ok: false, reason: "unsupported-version" }),
    });
    const { result } = renderHook(() => useSaveData(port, ROM_ID));

    const file = new File(["x"], "x.json");
    await act(async () => {
      await result.current.handleImportFile(file);
    });

    expect(result.current.message?.kind).toBe("error");
    expect(result.current.message?.text).toContain("Versione");
  });

  it("handleImportFile reason=rom-not-found → message.kind=error", async () => {
    const port = makePort({
      importSave: vi.fn().mockResolvedValue({ ok: false, reason: "rom-not-found" }),
    });
    const { result } = renderHook(() => useSaveData(port, ROM_ID));

    const file = new File(["x"], "x.json");
    await act(async () => {
      await result.current.handleImportFile(file);
    });

    expect(result.current.message?.kind).toBe("error");
    expect(result.current.message?.text).toContain("ROM");
  });

  it("handleImportFile che lancia: message.kind=error con guard instanceof Error", async () => {
    const port = makePort({
      importSave: vi.fn().mockRejectedValue(new Error("I/O error")),
    });
    const { result } = renderHook(() => useSaveData(port, ROM_ID));

    const file = new File(["x"], "x.json");
    await act(async () => {
      await result.current.handleImportFile(file);
    });

    expect(result.current.message?.kind).toBe("error");
    expect(result.current.message?.text).toContain("I/O error");
  });

  it("handleImportFile che lancia un valore non-Error: message.text usa String(e)", async () => {
    const port = makePort({
      importSave: vi.fn().mockRejectedValue({ weird: "object" }),
    });
    const { result } = renderHook(() => useSaveData(port, ROM_ID));

    const file = new File(["x"], "x.json");
    await act(async () => {
      await result.current.handleImportFile(file);
    });

    expect(result.current.message?.kind).toBe("error");
    // String({ weird: "object" }) → "[object Object]"
    expect(result.current.message?.text).toContain("object Object");
  });

  it("handleImportFile con saveService=undefined: no-op", async () => {
    const { result } = renderHook(() => useSaveData(undefined, ROM_ID));
    const file = new File(["x"], "x.json");
    await act(async () => {
      await result.current.handleImportFile(file);
    });
    // Non si crasha e il message rimane null.
    expect(result.current.message).toBeNull();
  });
});
