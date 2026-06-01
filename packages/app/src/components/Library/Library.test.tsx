// TSK-012 — test Library con StoragePort fake.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StoragePort } from "../../storage/port";
import type { RomRecord } from "../../storage/types";
import { Library } from "./Library";

function rec(id: string, title: string, platform: RomRecord["platform"]): RomRecord {
  return { id, title, platform, core: "gambatte", fileBlob: new Blob([id]), addedAt: 0 };
}

function fakeStorage(rows: RomRecord[]): StoragePort {
  return {
    addRom: vi.fn(async () => "x"),
    listRoms: vi.fn(async () => rows),
    getRom: vi.fn(async () => undefined),
    removeRom: vi.fn(async () => {}),
  };
}

describe("Library", () => {
  it("mostra i giochi con titolo e piattaforma", async () => {
    render(<Library storage={fakeStorage([rec("1", "Tetris", "GB"), rec("2", "Metroid", "GBA")])} />);
    expect(await screen.findByText("Tetris")).toBeInTheDocument();
    expect(screen.getByText("Metroid")).toBeInTheDocument();
    expect(screen.getByText("GBA")).toBeInTheDocument();
  });

  it("stato vuoto quando non ci sono giochi", async () => {
    render(<Library storage={fakeStorage([])} />);
    expect(await screen.findByText(/nessun gioco/i)).toBeInTheDocument();
  });

  it("selezione invoca onSelect", async () => {
    const onSelect = vi.fn();
    render(<Library storage={fakeStorage([rec("1", "Tetris", "GB")])} onSelect={onSelect} />);
    fireEvent.click(await screen.findByText("Tetris"));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
