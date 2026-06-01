// TSK-003 — test FileLoader (US-001) con StoragePort fake.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StoragePort } from "../../storage/port";
import type { RomRecord } from "../../storage/types";
import { FileLoader } from "./FileLoader";

function fakeStorage(): StoragePort {
  return {
    addRom: vi.fn(async () => "id-1"),
    listRoms: vi.fn(async () => [] as RomRecord[]),
    getRom: vi.fn(async () => undefined),
    removeRom: vi.fn(async () => {}),
  };
}

describe("FileLoader", () => {
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
});
