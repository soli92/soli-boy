// TSK-003 — test FileLoader (US-001) con StoragePort fake.
// TSK-075 — fake esteso con `listRomsMeta` (variante metadata-only).
// TSK-063 — test integrazione Capacitor URI path (US-029).
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StoragePort } from "../../storage/port";
import type { RomMeta, RomRecord } from "../../storage/types";
import type { CapacitorFilesystemApi } from "./useCapacitorFilePicker";
import { FileLoader } from "./FileLoader";

function fakeStorage(): StoragePort {
  return {
    addRom: vi.fn(async () => "id-1"),
    listRoms: vi.fn(async () => [] as RomRecord[]),
    listRomsMeta: vi.fn(async () => [] as RomMeta[]),
    getRom: vi.fn(async () => undefined),
    removeRom: vi.fn(async () => {}),
  };
}

// ── helper: mock window.Capacitor ────────────────────────────────────────────

function mockNativePlatform(isNative = true) {
  Object.defineProperty(window, "Capacitor", {
    writable: true,
    configurable: true,
    value: { isNativePlatform: () => isNative },
  });
}

function clearNativePlatform() {
  Object.defineProperty(window, "Capacitor", {
    writable: true,
    configurable: true,
    value: undefined,
  });
}

/** Crea una finta API Filesystem che restituisce `bytes` come base64. */
function fakeFilesystemApi(bytes: Uint8Array): CapacitorFilesystemApi {
  const b64 = btoa(String.fromCharCode(...bytes));
  return { readFile: vi.fn().mockResolvedValue({ data: b64 }) };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("FileLoader", () => {
  afterEach(() => {
    clearNativePlatform();
  });

  it("mostra picker e dropzone", () => {
    render(<FileLoader storage={fakeStorage()} />);
    expect(screen.getByLabelText("Carica ROM")).toBeInTheDocument();
    expect(screen.getByLabelText("Trascina qui una ROM")).toBeInTheDocument();
  });

  it("importa una ROM supportata e invoca onImported", async () => {
    const storage = fakeStorage();
    const onImported = vi.fn();
    render(<FileLoader storage={storage} onImported={onImported} />);
    const input = screen.getByLabelText("Carica ROM") as HTMLInputElement;
    const file = new File(["rom"], "zelda.gbc");
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(onImported).toHaveBeenCalledWith("id-1"));
    expect(storage.addRom).toHaveBeenCalledOnce();
  });

  it("su file non supportato mostra errore e non persiste", async () => {
    const storage = fakeStorage();
    render(<FileLoader storage={storage} />);
    const input = screen.getByLabelText("Carica ROM") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "game.nes")] } });
    await screen.findByRole("alert");
    expect(storage.addRom).not.toHaveBeenCalled();
  });

  it("TSK-020/REACT-A11Y-001: Enter/Space sulla dropzone apre il selettore file", () => {
    render(<FileLoader storage={fakeStorage()} />);
    const input = screen.getByLabelText("Carica ROM") as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => {});
    const dropzone = screen.getByLabelText("Trascina qui una ROM");
    fireEvent.keyDown(dropzone, { key: "Enter" });
    fireEvent.keyDown(dropzone, { key: " " });
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  // ── TSK-063: Capacitor URI path ─────────────────────────────────────────────

  it("TSK-063: handleCapacitorUri è no-op su browser (guard isCapacitorNative=false)", async () => {
    clearNativePlatform(); // browser env
    const storage = fakeStorage();
    const onImported = vi.fn();

    let registeredHandler: ((uri: string) => Promise<void>) | null = null;

    render(
      <FileLoader
        storage={storage}
        onImported={onImported}
        registerUriHandler={(fn) => {
          registeredHandler = fn;
        }}
      />,
    );

    // L'handler è registrato al mount.
    expect(registeredHandler).not.toBeNull();

    // Su browser (no Capacitor) → no-op: onImported non chiamato.
    await act(async () => {
      await registeredHandler!("file:///storage/emulated/0/roms/zelda.gbc");
    });

    expect(storage.addRom).not.toHaveBeenCalled();
    expect(onImported).not.toHaveBeenCalled();
  });

  it("TSK-063: handleCapacitorUri con Capacitor mockato legge il file e invoca onImported", async () => {
    // Simula ambiente Capacitor nativo.
    mockNativePlatform(true);

    const ROM_BYTES = new Uint8Array([
      // Header .gbc minimo: bytes a 0 (non serve magic per .gbc che usa estensione)
      ...new Array(0x100).fill(0),
    ]);
    const api = fakeFilesystemApi(ROM_BYTES);
    const storage = fakeStorage();
    const onImported = vi.fn();

    let registeredHandler: ((uri: string) => Promise<void>) | null = null;

    render(
      <FileLoader
        storage={storage}
        onImported={onImported}
        registerUriHandler={(fn) => {
          registeredHandler = fn;
        }}
        _filesystemApi={api}
      />,
    );

    expect(registeredHandler).not.toBeNull();

    await act(async () => {
      await registeredHandler!("file:///storage/emulated/0/roms/zelda.gbc");
    });

    // Il file è stato letto e passato allo storage.
    expect(api.readFile).toHaveBeenCalledWith({
      path: "file:///storage/emulated/0/roms/zelda.gbc",
    });
    expect(storage.addRom).toHaveBeenCalledOnce();
    expect(onImported).toHaveBeenCalledWith("id-1");
  });

  it("TSK-063: handleCapacitorUri mostra errore se readFile fallisce", async () => {
    mockNativePlatform(true);

    const failingApi: CapacitorFilesystemApi = {
      readFile: vi.fn().mockRejectedValue(new Error("File not found")),
    };
    const storage = fakeStorage();

    let registeredHandler: ((uri: string) => Promise<void>) | null = null;

    render(
      <FileLoader
        storage={storage}
        registerUriHandler={(fn) => {
          registeredHandler = fn;
        }}
        _filesystemApi={failingApi}
      />,
    );

    await act(async () => {
      await registeredHandler!("file:///storage/emulated/0/roms/missing.gbc");
    });

    // Deve mostrare un alert di errore.
    await screen.findByRole("alert");
    expect(storage.addRom).not.toHaveBeenCalled();
  });

  it("TSK-063: path <input type=file> web funziona invariato con Capacitor nativo", async () => {
    // Verifica che il path web standard non sia rotto dall'aggiunta del Capacitor path.
    mockNativePlatform(true);

    const storage = fakeStorage();
    const onImported = vi.fn();

    render(<FileLoader storage={storage} onImported={onImported} />);

    const input = screen.getByLabelText("Carica ROM") as HTMLInputElement;
    const file = new File(["rom"], "mario.gbc");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onImported).toHaveBeenCalledWith("id-1"));
    expect(storage.addRom).toHaveBeenCalledOnce();
  });
});
