// TSK-012 — test Library con StoragePort fake.
// TSK-038 — copertura ricerca per titolo, filtro piattaforma, stato vuoto (US-008).
// TSK-039 — copertura display cover/segnaposto + upload (US-009).
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CoverPort, StoragePort } from "../../storage/port";
import type { RomRecord } from "../../storage/types";
import { Library } from "./Library";

function rec(
  id: string,
  title: string,
  platform: RomRecord["platform"],
  coverBlob?: Blob,
): RomRecord {
  return {
    id,
    title,
    platform,
    core: "gambatte",
    fileBlob: new Blob([id]),
    addedAt: 0,
    ...(coverBlob ? { coverBlob } : {}),
  };
}

// TSK-075 — fake storage esteso con `listRomsMeta` (path metadata-only usato
// dalla Library) e `getRom` funzionante (la Library lo invoca lazy al click di
// selezione, per fornire il `fileBlob` completo al consumer onSelect).
function fakeStorage(rows: RomRecord[]): StoragePort & CoverPort {
  return {
    addRom: vi.fn(async () => "x"),
    listRoms: vi.fn(async () => rows),
    listRomsMeta: vi.fn(async () =>
      rows.map(({ fileBlob: _omit, ...meta }) => {
        void _omit;
        return meta;
      }),
    ),
    getRom: vi.fn(async (id: string) => rows.find((r) => r.id === id)),
    removeRom: vi.fn(async () => {}),
    setCover: vi.fn(async () => {}),
  };
}

// TSK-039 — jsdom non implementa URL.createObjectURL/revokeObjectURL:
// mock minimo per i test che esercitano il rendering <img> della cover.
// Reset tra test per evitare cross-pollination dello spy counter.
const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
beforeEach(() => {
  let n = 0;
  URL.createObjectURL = vi.fn(() => `blob:mock/${++n}`);
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
});

describe("Library", () => {
  // TSK-046 — US-039: l'header della Library mostra il logo brand.
  it("mostra il logo Soli-boy nell'header (US-039)", async () => {
    render(<Library storage={fakeStorage([rec("1", "Tetris", "GB")])} />);
    // L'<img> deriva il suo accessible name dall'attributo alt.
    const logo = await screen.findByRole("img", { name: "Soli-boy" });
    expect(logo).toBeInTheDocument();
    // Vite serve l'asset come URL col filename in dev oppure inline come data-URI
    // SVG (asset sotto la soglia di inlining, default in Vite). Accettiamo entrambe
    // le forme: l'invariante è che l'header mostri l'asset del logo orizzontale.
    expect(logo.getAttribute("src")).toMatch(/soliboy-logo-horizontal|^data:image\/svg\+xml/);
  });

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

  // TSK-075 F-2 — `handleSelect` è asincrono: carica la ROM completa via
  // `getRom(id)` al click e invoca `onSelect` solo dopo la risoluzione. I test
  // devono attendere il microtask (waitFor), non asserire sincrono dopo il click.
  it("selezione carica la ROM completa via getRom e invoca onSelect (F-2)", async () => {
    const onSelect = vi.fn();
    const storage = fakeStorage([rec("1", "Tetris", "GB")]);
    render(<Library storage={storage} onSelect={onSelect} />);
    fireEvent.click(await screen.findByText("Tetris"));
    await waitFor(() => expect(onSelect).toHaveBeenCalledOnce());
    expect(storage.getRom).toHaveBeenCalledWith("1");
    // onSelect riceve il RomRecord completo (incluso fileBlob), non il solo meta.
    const passed = (onSelect.mock.calls[0] as [RomRecord])[0];
    expect(passed.id).toBe("1");
    expect(passed.fileBlob).toBeInstanceOf(Blob);
  });

  it("non invoca onSelect se getRom ritorna undefined (ROM sparita nel frattempo) (F-2)", async () => {
    const onSelect = vi.fn();
    const storage = fakeStorage([rec("1", "Tetris", "GB")]);
    storage.getRom = vi.fn(async () => undefined);
    render(<Library storage={storage} onSelect={onSelect} />);
    fireEvent.click(await screen.findByText("Tetris"));
    await waitFor(() => expect(storage.getRom).toHaveBeenCalledWith("1"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("non invoca onSelect se getRom rigetta (no-op fail-soft) (F-2)", async () => {
    const onSelect = vi.fn();
    const storage = fakeStorage([rec("1", "Tetris", "GB")]);
    storage.getRom = vi.fn(async () => {
      throw new Error("io");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Library storage={storage} onSelect={onSelect} />);
    fireEvent.click(await screen.findByText("Tetris"));
    await waitFor(() => expect(storage.getRom).toHaveBeenCalledWith("1"));
    expect(onSelect).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("mostra role=alert quando storage.listRomsMeta rejecta (F-038-01)", async () => {
    // TSK-075 — il fallimento è ora su `listRomsMeta` (path lazy della UI),
    // non più su `listRoms`: stessa semantica di failure mode, stesso role=alert.
    const failing: StoragePort & CoverPort = {
      addRom: vi.fn(async () => "x"),
      listRoms: vi.fn(async () => []),
      listRomsMeta: vi.fn(async () => {
        throw new Error("IndexedDB indisponibile");
      }),
      getRom: vi.fn(async () => undefined),
      removeRom: vi.fn(async () => {}),
      setCover: vi.fn(async () => {}),
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

  // TSK-039 — US-009: copertina / segnaposto / upload.
  describe("copertina (US-009)", () => {
    it("se coverBlob è presente la tile mostra <img alt=titolo>", async () => {
      const cover = new Blob(["png-bytes"], { type: "image/png" });
      render(
        <Library
          storage={fakeStorage([rec("1", "Tetris", "GB", cover)])}
        />,
      );
      // L'immagine compare quando l'effect ha eseguito createObjectURL.
      const img = await screen.findByRole("img", { name: "Tetris" });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", expect.stringMatching(/^blob:/));
      expect(URL.createObjectURL).toHaveBeenCalledWith(cover);
    });

    it("in assenza di cover mostra un segnaposto coerente col DS (no <img>)", async () => {
      render(
        <Library storage={fakeStorage([rec("1", "Tetris", "GB")])} />,
      );
      // attendi il rendering
      await screen.findByText("Tetris");
      // TSK-046 — il logo Soli-boy nell'header è un <img> sempre presente:
      // restringiamo la verifica "no <img>" alla griglia delle tile, dove
      // la cover sarebbe stata renderizzata in caso di coverBlob.
      const grid = screen.getByRole("list", { name: /risultati libreria/i });
      expect(within(grid).queryByRole("img")).not.toBeInTheDocument();
      // Iniziale del titolo come segnaposto, dentro un elemento .sb-art.
      const tile = within(grid).getByRole("listitem");
      const art = tile.querySelector(".sb-art");
      expect(art).not.toBeNull();
      expect(art?.textContent).toBe("T");
    });

    it("l'accessible name del button di selezione resta 'titolo platform' (compat e2e)", async () => {
      render(
        <Library
          storage={fakeStorage([rec("1", "tetris", "GB", new Blob(["x"], { type: "image/png" }))])}
        />,
      );
      // Il pulsante non deve includere l'alt dell'<img>: deve restare "tetris GB"
      // (US-009 + invariante e2e TSK-011/TSK-019).
      const btn = await screen.findByRole("button", { name: "tetris GB" });
      expect(btn).toBeInTheDocument();
    });

    it("upload chiama setCover e poi mostra l'immagine sulla tile", async () => {
      const storage = fakeStorage([rec("1", "Tetris", "GB")]);
      render(<Library storage={storage} />);
      // Pre-condizione: tile senza img (la griglia non contiene cover image).
      // TSK-046 — l'header brand contiene un <img alt="Soli-boy"> sempre
      // presente; lo escludiamo dalla verifica restringendoci alla <ul> dei
      // risultati.
      await screen.findByText("Tetris");
      const gridPre = screen.getByRole("list", { name: /risultati libreria/i });
      expect(within(gridPre).queryByRole("img")).not.toBeInTheDocument();

      // L'input file è label-ato per ROM.
      const input = screen.getByLabelText(
        "Cambia copertina di Tetris",
      ) as HTMLInputElement;
      const file = new File(["png"], "cover.png", { type: "image/png" });
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => expect(storage.setCover).toHaveBeenCalledWith("1", file));
      // Dopo setCover la tile si refresh e renderizza <img alt="Tetris">.
      const img = await screen.findByRole("img", { name: "Tetris" });
      expect(img).toHaveAttribute("src", expect.stringMatching(/^blob:/));
    });

    it("se setCover fallisce mostra role=alert e non aggiorna la tile", async () => {
      const rows = [rec("1", "Tetris", "GB")];
      const storage: StoragePort & CoverPort = {
        addRom: vi.fn(async () => "x"),
        listRoms: vi.fn(async () => rows),
        listRomsMeta: vi.fn(async () =>
          rows.map(({ fileBlob: _omit, ...meta }) => {
            void _omit;
            return meta;
          }),
        ),
        getRom: vi.fn(async () => undefined),
        removeRom: vi.fn(async () => {}),
        setCover: vi.fn(async () => {
          throw new Error("quota piena");
        }),
      };
      render(<Library storage={storage} />);
      await screen.findByText("Tetris");

      const input = screen.getByLabelText(
        "Cambia copertina di Tetris",
      ) as HTMLInputElement;
      fireEvent.change(input, {
        target: { files: [new File(["x"], "c.png", { type: "image/png" })] },
      });

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(/impossibile aggiornare la copertina/i);
      expect(alert).toHaveTextContent(/quota piena/i);
      // F-039-01: l'errore di setCover NON deve smontare l'intera griglia
      // (l'utente non perde lista/filtri/scroll). La <ul> dei risultati resta
      // presente e la tile esistente è ancora visibile.
      expect(
        screen.getByRole("list", { name: /risultati libreria/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Tetris")).toBeInTheDocument();
    });
  });
});
