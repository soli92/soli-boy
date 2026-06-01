// TSK-012 — test Library con StoragePort fake.
// TSK-038 — copertura ricerca per titolo, filtro piattaforma, stato vuoto (US-008).
import { fireEvent, render, screen, within } from "@testing-library/react";
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
    // Il badge piattaforma sulla tile (la stringa "GBA" compare anche come chip
    // nel filtro: TSK-038). Restringiamo al grid dei risultati.
    const grid = screen.getByRole("list", { name: /risultati libreria/i });
    expect(within(grid).getByText("GBA")).toBeInTheDocument();
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

  it("mostra role=alert quando storage.listRoms rejecta (F-038-01)", async () => {
    const failing: StoragePort = {
      addRom: vi.fn(async () => "x"),
      listRoms: vi.fn(async () => {
        throw new Error("IndexedDB indisponibile");
      }),
      getRom: vi.fn(async () => undefined),
      removeRom: vi.fn(async () => {}),
    };
    render(<Library storage={failing} />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/impossibile caricare la libreria/i);
    expect(alert).toHaveTextContent(/IndexedDB indisponibile/);
  });

  // TSK-038 — US-008 acceptance criteria
  describe("ricerca e filtro (US-008)", () => {
    it("filtra per titolo (case-insensitive) quando l'utente digita", async () => {
      render(
        <Library
          storage={fakeStorage([
            rec("1", "Tetris", "GB"),
            rec("2", "Metroid", "GBA"),
            rec("3", "Super Mario Land", "GB"),
          ])}
        />,
      );
      // attendi caricamento
      expect(await screen.findByText("Tetris")).toBeInTheDocument();

      const search = screen.getByLabelText(/cerca per titolo/i);
      fireEvent.change(search, { target: { value: "mario" } });

      expect(screen.getByText("Super Mario Land")).toBeInTheDocument();
      expect(screen.queryByText("Tetris")).not.toBeInTheDocument();
      expect(screen.queryByText("Metroid")).not.toBeInTheDocument();
    });

    it("filtra per piattaforma quando l'utente seleziona un chip", async () => {
      render(
        <Library
          storage={fakeStorage([
            rec("1", "Tetris", "GB"),
            rec("2", "Metroid", "GBA"),
            rec("3", "F-Zero", "GBA"),
          ])}
        />,
      );
      expect(await screen.findByText("Tetris")).toBeInTheDocument();

      const group = screen.getByRole("radiogroup", { name: /filtra per piattaforma/i });
      fireEvent.click(within(group).getByRole("radio", { name: "GBA" }));

      expect(screen.getByText("Metroid")).toBeInTheDocument();
      expect(screen.getByText("F-Zero")).toBeInTheDocument();
      expect(screen.queryByText("Tetris")).not.toBeInTheDocument();
    });

    it("combina ricerca testuale e filtro piattaforma", async () => {
      render(
        <Library
          storage={fakeStorage([
            rec("1", "Mario Bros", "GB"),
            rec("2", "Super Mario Advance", "GBA"),
            rec("3", "Metroid", "GBA"),
          ])}
        />,
      );
      expect(await screen.findByText("Mario Bros")).toBeInTheDocument();

      const group = screen.getByRole("radiogroup", { name: /filtra per piattaforma/i });
      fireEvent.click(within(group).getByRole("radio", { name: "GBA" }));
      const search = screen.getByLabelText(/cerca per titolo/i);
      fireEvent.change(search, { target: { value: "mario" } });

      expect(screen.getByText("Super Mario Advance")).toBeInTheDocument();
      expect(screen.queryByText("Mario Bros")).not.toBeInTheDocument(); // escluso da piattaforma
      expect(screen.queryByText("Metroid")).not.toBeInTheDocument(); // escluso da ricerca
    });

    it("mostra stato vuoto 'nessun risultato' quando nessuna ROM matcha", async () => {
      render(
        <Library
          storage={fakeStorage([rec("1", "Tetris", "GB"), rec("2", "Metroid", "GBA")])}
        />,
      );
      expect(await screen.findByText("Tetris")).toBeInTheDocument();

      const search = screen.getByLabelText(/cerca per titolo/i);
      fireEvent.change(search, { target: { value: "zzz-non-esiste" } });

      expect(screen.getByText(/nessun risultato/i)).toBeInTheDocument();
      expect(screen.queryByText("Tetris")).not.toBeInTheDocument();
      expect(screen.queryByText("Metroid")).not.toBeInTheDocument();
    });

    it("espone solo i chip delle piattaforme presenti in libreria (+ Tutte)", async () => {
      render(
        <Library
          storage={fakeStorage([rec("1", "Tetris", "GB"), rec("2", "Metroid", "GBA")])}
        />,
      );
      expect(await screen.findByText("Tetris")).toBeInTheDocument();

      const group = screen.getByRole("radiogroup", { name: /filtra per piattaforma/i });
      const chips = within(group).getAllByRole("radio");
      const labels = chips.map((c) => c.textContent);
      expect(labels).toEqual(["Tutte", "GB", "GBA"]);
    });
  });
});
