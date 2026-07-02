// TSK-033 — Test Settings: sezione "Dati" (US-019).
// TSK-150 (EP-020) — Select Radix al posto del <select> nativo per export.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_KEY_PROFILE } from "../../domain/input-mapping";
import type {
  ExportSaveStateResult,
  ImportSaveResult,
} from "../../domain/save-service";
import type { SaveStateRecord } from "../../storage/types";
import { Settings, type SaveDataPort } from "./Settings";

function openDataSection(): void {
  fireEvent.click(
    screen.getByRole("button", { name: /dati — salvataggi/i }),
  );
}

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

const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
let createSpy: ReturnType<typeof vi.fn>;
let revokeSpy: ReturnType<typeof vi.fn>;
let clickSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  createSpy = vi.fn(() => "blob:mock/1");
  revokeSpy = vi.fn();
  URL.createObjectURL = createSpy as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = revokeSpy as unknown as typeof URL.revokeObjectURL;
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

afterEach(() => {
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
  clickSpy.mockRestore();
});

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
    openDataSection();
    expect(screen.getByRole("group", { name: /esporta e importa salvataggi/i })).toBeInTheDocument();
    expect(screen.getByTestId("sb-data-rom-context")).toHaveTextContent(/gioco corrente/i);
    expect(screen.getByLabelText("Salvataggio da esportare")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /esporta/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Importa file di salvataggio")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText("Salvataggio da esportare")).not.toHaveTextContent(
        /nessun salvataggio/i,
      );
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
    openDataSection();
    await waitFor(() => expect(port.listSaveStates).toHaveBeenCalled());
    const exportBtn = screen.getByRole("button", { name: /esporta/i }) as HTMLButtonElement;
    expect(exportBtn.disabled).toBe(true);
    expect(screen.getByLabelText("Salvataggio da esportare")).toHaveTextContent(
      /nessun salvataggio/i,
    );
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
    openDataSection();

    await waitFor(() => expect(port.listSaveStates).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByLabelText("Salvataggio da esportare")).toHaveTextContent(/slot 1/i),
    );
    const exportBtn = screen.getByRole("button", { name: /esporta/i });
    await waitFor(() => expect(exportBtn).not.toBeDisabled(), { timeout: 3_000 });

    fireEvent.click(exportBtn);

    await waitFor(() => expect(port.exportSaveState).toHaveBeenCalledWith("ss-a"), { timeout: 3_000 });
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith("blob:mock/1");
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
    openDataSection();

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
    openDataSection();
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
    openDataSection();

    await waitFor(() => expect(port.listSaveStates).toHaveBeenCalledTimes(1));

    const file = new File(["{}"], "save.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText("Importa file di salvataggio"), {
      target: { files: [file] },
    });

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(/importato/i);
    await waitFor(() => expect(port.listSaveStates).toHaveBeenCalledTimes(2));
  });

  it("Senza saveService la sezione mostra nota onesta e i controlli sono disabilitati", () => {
    render(
      <Settings profile={DEFAULT_KEY_PROFILE} onRemap={vi.fn()} />,
    );
    openDataSection();
    expect(screen.getByRole("group", { name: /esporta e importa salvataggi/i })).toBeInTheDocument();
    expect(screen.getByTestId("sb-data-unavailable")).toHaveTextContent(
      /gestione dei salvataggi non è disponibile/i,
    );
    expect((screen.getByRole("button", { name: /esporta/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId("sb-data-rom-context")).toHaveTextContent(
      /nessun gioco corrente/i,
    );
  });
});
