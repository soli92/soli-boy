// TSK-033 — Test Settings: sezione "Dati" (US-019).
// Copre:
//  - presenza dei controlli (Gioco/Salvataggio/Esporta/Importa) in stato base;
//  - export con mock di `URL.createObjectURL`/anchor `.click()`;
//  - import KO con file invalido → role="alert" comprensibile (US-019 AC3);
//  - import OK con file valido → role="status" e refresh della lista entry.
//
// Mock: la sezione consuma un'interfaccia segregata `SaveDataPort`, quindi
// niente fake-indexeddb e niente engine. Coerente con SaveStatePanel.test.tsx.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_KEY_PROFILE } from "../../domain/input-mapping";
import type {
  ExportSaveStateResult,
  ImportSaveResult,
} from "../../domain/save-service";
import type { SaveStateRecord } from "../../storage/types";
import { Settings, type SaveDataPort } from "./Settings";

// --- Helpers fake ------------------------------------------------------------

function makeSaveState(over: Partial<SaveStateRecord> = {}): SaveStateRecord {
  return {
    id: "ss-1",
    romId: "rom-1",
    slot: 0,
    snapshotBlob: new Blob(["x"]),
    core: "gambatte",
    createdAt: 1_700_000_000_000,
    ...over,
  };
}

function makePort(opts: {
  list?: SaveStateRecord[];
  exportRes?: ExportSaveStateResult;
  importRes?: ImportSaveResult;
}): SaveDataPort & {
  listSaveStates: ReturnType<typeof vi.fn>;
  exportSaveState: ReturnType<typeof vi.fn>;
  importSave: ReturnType<typeof vi.fn>;
} {
  const list = opts.list ?? [];
  // Annotazione esplicita del return type: senza, TS allarga `ok: true` a
  // `boolean` (cfr. literal type widening in inference su oggetti) e i mock
  // non sono più assegnabili a `SaveDataPort`. Coerente con il pattern dei
  // makePort/Port mock di SaveStatePanel.test.tsx.
  const exportRes: ExportSaveStateResult =
    opts.exportRes ?? { ok: true, blob: new Blob(["{}"]), filename: "x.json" };
  const importRes: ImportSaveResult =
    opts.importRes ?? { ok: true, kind: "saveState", romId: "rom-1", id: "ss-new" };
  return {
    listSaveStates: vi.fn(async (_romId: string) => list),
    exportSaveState: vi.fn(async (_id: string): Promise<ExportSaveStateResult> => exportRes),
    importSave: vi.fn(
      async (_input: Blob | ArrayBuffer | string): Promise<ImportSaveResult> => importRes,
    ),
  };
}

// jsdom non implementa URL.createObjectURL/revokeObjectURL: stub per i test.
// Coerente con Library.test.tsx (linea 37 ss.). Riportato anche su anchor.click
// per intercettare l'invocazione senza side-effect (nessun download reale).
const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
let createSpy: ReturnType<typeof vi.fn>;
let revokeSpy: ReturnType<typeof vi.fn>;
let clickSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  createSpy = vi.fn(() => "blob:mock/1");
  revokeSpy = vi.fn();
  URL.createObjectURL = createSpy;
  URL.revokeObjectURL = revokeSpy;
  // Spy su HTMLAnchorElement.prototype.click → niente navigazione in jsdom.
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

afterEach(() => {
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
  clickSpy.mockRestore();
});

// --- Tests -------------------------------------------------------------------

describe("Settings — sezione Dati (TSK-033 / US-019)", () => {
  it("renderizza i controlli della sezione 'Dati' (contesto ROM / Salvataggio / Esporta / Importa file)", async () => {
    const port = makePort({ list: [makeSaveState({ slot: 0 }), makeSaveState({ id: "ss-2", slot: 1 })] });
    render(
      <Settings
        profile={DEFAULT_KEY_PROFILE}
        onRemap={vi.fn()}
        saveService={port}
        currentRom={{ id: "rom-1", title: "Tetris" }}
      />,
    );
    // Group region con label "Esporta e importa salvataggi"
    expect(screen.getByRole("group", { name: /esporta e importa salvataggi/i })).toBeInTheDocument();
    // Etichetta contesto ROM (no selettore — UX semplice; ROM definita dal Player).
    expect(screen.getByTestId("sb-data-rom-context")).toHaveTextContent(/gioco corrente/i);
    // Controlli presenti
    expect(screen.getByLabelText("Salvataggio da esportare")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /esporta/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Importa file di salvataggio")).toBeInTheDocument();
    // Attesa idratazione dei save state
    await waitFor(() => {
      const sel = screen.getByLabelText("Salvataggio da esportare") as HTMLSelectElement;
      expect(sel.options.length).toBeGreaterThan(0);
    });
  });

  it("mostra stato 'nessun salvataggio' e disabilita Esporta quando la lista è vuota", async () => {
    const port = makePort({ list: [] });
    render(
      <Settings
        profile={DEFAULT_KEY_PROFILE}
        onRemap={vi.fn()}
        saveService={port}
        currentRom={{ id: "rom-1", title: "Tetris" }}
      />,
    );
    await waitFor(() => expect(port.listSaveStates).toHaveBeenCalled());
    const exportBtn = screen.getByRole("button", { name: /esporta/i }) as HTMLButtonElement;
    expect(exportBtn.disabled).toBe(true);
    const saveSel = screen.getByLabelText("Salvataggio da esportare") as HTMLSelectElement;
    // Includes the placeholder "(nessun salvataggio)"
    expect(saveSel.options[0].textContent).toMatch(/nessun salvataggio/i);
  });

  it("Esporta: invoca exportSaveState, crea object URL e clicca l'anchor (download)", async () => {
    const port = makePort({
      list: [makeSaveState({ id: "ss-a", slot: 0 })],
      exportRes: { ok: true, blob: new Blob(["payload"]), filename: "tetris.slot0.soliboy-save.json" },
    });
    render(
      <Settings
        profile={DEFAULT_KEY_PROFILE}
        onRemap={vi.fn()}
        saveService={port}
        currentRom={{ id: "rom-1", title: "Tetris" }}
      />,
    );

    await waitFor(() => expect(port.listSaveStates).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /esporta/i }));

    await waitFor(() => expect(port.exportSaveState).toHaveBeenCalledWith("ss-a"));
    // URL allocato sul blob, anchor cliccato, URL revocato.
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith("blob:mock/1");
    // Feedback positivo come status (no alert).
    const msg = await screen.findByRole("status");
    expect(msg).toHaveTextContent(/esportato/i);
  });

  it("Import KO (file invalido) → role='alert' con messaggio comprensibile (US-019 AC3)", async () => {
    const port = makePort({
      list: [makeSaveState()],
      importRes: { ok: false, reason: "invalid-file", detail: "JSON malformato" },
    });
    render(
      <Settings
        profile={DEFAULT_KEY_PROFILE}
        onRemap={vi.fn()}
        saveService={port}
        currentRom={{ id: "rom-1", title: "Tetris" }}
      />,
    );

    const fileInput = screen.getByLabelText("Importa file di salvataggio") as HTMLInputElement;
    const bogus = new File(["not-json"], "save.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [bogus] } });

    await waitFor(() => expect(port.importSave).toHaveBeenCalled());
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/file non valido/i);
  });

  it("Import KO (rom-not-found) → role='alert' con messaggio dedicato (US-019 AC3)", async () => {
    const port = makePort({
      list: [makeSaveState()],
      importRes: { ok: false, reason: "rom-not-found" },
    });
    render(
      <Settings
        profile={DEFAULT_KEY_PROFILE}
        onRemap={vi.fn()}
        saveService={port}
        currentRom={{ id: "rom-1", title: "Tetris" }}
      />,
    );
    const file = new File(["{}"], "save.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText("Importa file di salvataggio"), {
      target: { files: [file] },
    });
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/ROM associata/i);
  });

  it("Import OK → role='status' con conferma; per la ROM corrente refresh dei save state", async () => {
    const port = makePort({
      list: [makeSaveState({ id: "ss-1" })],
      importRes: { ok: true, kind: "saveState", romId: "rom-1", id: "ss-new" },
    });
    render(
      <Settings
        profile={DEFAULT_KEY_PROFILE}
        onRemap={vi.fn()}
        saveService={port}
        currentRom={{ id: "rom-1", title: "Tetris" }}
      />,
    );

    await waitFor(() => expect(port.listSaveStates).toHaveBeenCalledTimes(1));

    const file = new File(["{}"], "save.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText("Importa file di salvataggio"), {
      target: { files: [file] },
    });

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(/importato/i);
    // Refresh atteso: lista interrogata di nuovo per la ROM corrente.
    await waitFor(() => expect(port.listSaveStates).toHaveBeenCalledTimes(2));
  });

  it("Senza saveService la sezione mostra nota onesta e i controlli sono disabilitati", () => {
    render(
      <Settings profile={DEFAULT_KEY_PROFILE} onRemap={vi.fn()} />,
    );
    // Sezione presente per UX prevedibile.
    expect(screen.getByRole("group", { name: /esporta e importa salvataggi/i })).toBeInTheDocument();
    // Nota "non disponibile" (statica, non role=status: vedi commento in Settings.tsx).
    expect(screen.getByTestId("sb-data-unavailable")).toHaveTextContent(
      /gestione dei salvataggi non è disponibile/i,
    );
    // Esporta disabilitato.
    expect((screen.getByRole("button", { name: /esporta/i }) as HTMLButtonElement).disabled).toBe(true);
    // Senza currentRom: il contesto invita a selezionare una ROM.
    expect(screen.getByTestId("sb-data-rom-context")).toHaveTextContent(/seleziona una ROM/i);
  });
});
