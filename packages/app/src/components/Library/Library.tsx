// TSK-012 — Library: griglia delle ROM persistite (US-004/US-007).
// TSK-038 — UI ricerca per titolo + filtro piattaforma (US-008).
// TSK-039 — Copertina gioco (US-009): mostra coverBlob (se presente) o un
// segnaposto coerente col DS (.sb-art con iniziale del titolo); controllo
// per caricare una cover dall'utente (file input image/*) → setCover →
// refresh della tile. Nessun fetch esterno (US-033 privacy on-device).
// UI su classi solids.
// TSK-046 — Logo Soli-boy nell'header della Library (US-039 / EP-010).
// Variante scelta: HORIZONTAL (a colori del brand) importata come URL via Vite
// e renderizzata come <img>. Motivazione: <img> isola il documento SVG e NON
// eredita `currentColor` dal CSS host (perderemmo l'inchiostro su qualunque
// tema), quindi la variante mono renderebbe nero opaco illeggibile su temi
// scuri (es. `dark`, `90s-party`). La horizontal mantiene i colori del brand
// ed è leggibile su qualsiasi tema. Una versione theme-adaptive via inline
// SVG/svgr resta possibile miglioramento futuro (gap chiuso con opzione
// zero-dep — niente nuove dipendenze npm). Vedi gap svg-react-import-strategy.

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import logoUrl from "../../assets/soliboy-logo-horizontal.svg";
import type { Platform } from "../../domain/types";
import type { CoverPort, StoragePort } from "../../storage/port";
import type { RomMeta, RomRecord } from "../../storage/types";

// TSK-046 — stile inline per il logo header. Non possiamo applicare la classe
// `.sb-logo` esistente in solids-theme.css (è scoped per il box 34x34 del
// brand mark, in conflitto con la ratio 680x240 dell'asset orizzontale).
// solids-theme.css è fuori scope per questo TSK. Usiamo classe dedicata
// `sb-app-logo` (no CSS associato → tutta la dimensione via inline style).
const LOGO_STYLE: CSSProperties = {
  height: "2rem",
  width: "auto",
  display: "block",
};

export interface LibraryProps {
  /**
   * Porta combinata: lettura ROM (StoragePort) + aggiornamento copertina
   * (CoverPort). Tenute disgiunte nel contratto per interface segregation
   * (consumer ROM-only non vedono setCover); qui le componiamo nel prop.
   */
  storage: StoragePort & CoverPort;
  /**
   * Invocato alla selezione di un gioco. Riceve il `RomRecord` **completo**
   * (incluso `fileBlob`) caricato lazy via `storage.getRom(id)`: la Library
   * stessa lista solo i metadati (TSK-075, F-2 CQRL TSK-054), il `fileBlob`
   * viene materializzato on-demand al click — è ciò di cui il Player necessita.
   *
   * Se `getRom` fallisce o ritorna `undefined` (ROM rimossa nel frattempo),
   * il click è no-op (l'errore viene loggato in console — non vogliamo
   * smontare la libreria per un evento puntuale non-fatale, parità con la
   * gestione di `coverError`).
   */
  onSelect?: (rom: RomRecord) => void;
  /**
   * TSK-107 (US-056) — ID della ROM attualmente in esecuzione (da App `selected?.id`).
   * Se assente, nessuna tile mostra il badge "In gioco".
   */
  activeRomId?: string;
  /**
   * TSK-108 (US-056) — Invocato prima di `storage.removeRom` quando la ROM
   * rimossa è quella in esecuzione (App ferma il Player e azzera `selected`).
   */
  onBeforeRemove?: (romId: string) => void | Promise<void>;
}

/** Valore "tutte le piattaforme" del filtro. */
const ALL: "ALL" = "ALL";
type PlatformFilter = typeof ALL | Platform;

/** Etichette UI per il filtro piattaforma. */
const PLATFORM_LABELS: Record<PlatformFilter, string> = {
  ALL: "Tutte",
  GB: "GB",
  GBC: "GBC",
  GBA: "GBA",
  ARCADE: "Arcade",
};

/** Ordine canonico dei chip (GB e GBC condividono il chip GB-GBC della spec). */
const PLATFORM_ORDER: Platform[] = ["GB", "GBC", "GBA", "ARCADE"];

export function Library({ storage, onSelect, activeRomId, onBeforeRemove }: LibraryProps) {
  // TSK-075 — la Library lista i **metadati** (senza fileBlob). Sul NativeFsAdapter
  // elimina N round-trip IPC `readFile` sui binari ROM al caricamento (F-2 CQRL
  // TSK-054). Il `fileBlob` viene caricato lazy via `storage.getRom(id)` al click
  // (vedi handler `handleSelect` sotto).
  const [roms, setRoms] = useState<RomMeta[] | null>(null);
  // `error` è riservato ESCLUSIVAMENTE al fallimento di listRomsMeta (smonta la
  // griglia): F-039-01 separa l'errore non-fatale dell'upload copertina in
  // `coverError`, che viene reso come alert sopra la <ul> senza smontarla
  // (l'utente non perde lista/filtri/scroll).
  const [error, setError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<RomMeta | null>(null);
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<PlatformFilter>(ALL);

  useEffect(() => {
    let active = true;
    // F-038-02: al cambio identità di `storage` resettiamo i filtri (UI coerente
    // con il nuovo dataset) e lo stato di errore.
    setQuery("");
    setPlatform(ALL);
    setError(null);
    setCoverError(null);
    storage
      .listRomsMeta()
      .then((r) => {
        if (active) setRoms(r);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Impossibile caricare la libreria: ${msg}`);
      });
    return () => {
      active = false;
    };
  }, [storage]);

  // Piattaforme effettivamente presenti nella libreria — il filtro mostra solo
  // chip rilevanti (oltre a "Tutte"). Ordinato in modo stabile.
  const availablePlatforms = useMemo<Platform[]>(() => {
    if (!roms) return [];
    const present = new Set(roms.map((r) => r.platform));
    return PLATFORM_ORDER.filter((p) => present.has(p));
  }, [roms]);

  // Filtro in-memory: case-insensitive sul titolo + match piattaforma.
  // `useMemo` evita re-render inutili durante la digitazione.
  // F-038-04: presupposto architetturale — dataset piccolo già caricato
  // interamente in memoria. Per dataset grandi esiste StoragePort.listRomsMeta(filter)
  // (architecture-overview §EP-002).
  const filtered = useMemo<RomMeta[]>(() => {
    if (!roms) return [];
    const q = query.trim().toLowerCase();
    return roms.filter((r) => {
      if (platform !== ALL && r.platform !== platform) return false;
      if (q.length > 0 && !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [roms, query, platform]);

  // TSK-075 — selezione: la Library tiene solo metadati; il `fileBlob` serve al
  // Player → lo materializziamo on-demand qui via `getRom(id)`. Path lazy: una
  // singola `readFile` IPC al click invece di N readFile al caricamento.
  // Se la ROM è sparita (race con removeRom) o `getRom` fallisce, no-op
  // graceful (log in console — non scaliamo a `error` che smonterebbe la lista).
  const handleSelect = useCallback(
    async (meta: RomMeta) => {
      if (!onSelect) return;
      try {
        const full = await storage.getRom(meta.id);
        if (full) onSelect(full);
        else console.warn(`Library: ROM ${meta.id} non trovata al momento del click`);
      } catch (err: unknown) {
        console.warn(`Library: getRom(${meta.id}) fallito:`, err);
      }
    },
    [storage, onSelect],
  );

  // TSK-039 — handler upload copertina: persiste via setCover, poi aggiorna
  // localmente la entry in `roms` per refreshare la tile senza ri-listare
  // l'intera libreria (evita flicker e mantiene scroll/filtri stabili).
  // F-039-01: errore non-fatale → `coverError`, NON `error` (che smonterebbe
  // l'intera griglia). F-039-02: `useCallback` per referenza stabile verso
  // GameTile (riduce re-render delle tile).
  const handleCoverChange = useCallback(
    async (romId: string, file: File) => {
      setCoverError(null);
      try {
        await storage.setCover(romId, file);
        setRoms((prev) =>
          prev
            ? prev.map((r) => (r.id === romId ? { ...r, coverBlob: file } : r))
            : prev,
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setCoverError(`Impossibile aggiornare la copertina: ${msg}`);
      }
    },
    [storage],
  );

  const handleRemoveRequest = useCallback((meta: RomMeta) => {
    setPendingRemove(meta);
  }, []);

  const handleRemoveCancel = useCallback(() => {
    setPendingRemove(null);
  }, []);

  const handleRemoveConfirm = useCallback(async () => {
    if (!pendingRemove) return;
    const { id, title } = pendingRemove;
    const snapshot = roms;
    setPendingRemove(null);
    setRoms((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    setCoverError(null);
    try {
      await onBeforeRemove?.(id);
      await storage.removeRom(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (snapshot) setRoms(snapshot);
      setCoverError(`Impossibile rimuovere "${title}" dalla libreria: ${msg}`);
    }
  }, [pendingRemove, roms, onBeforeRemove, storage]);

  // TSK-046 — Header della Library con logo brand. Renderizzato in tutti gli
  // stati (error/loading/empty/populated) per coerenza branding. L'alt="Soli-boy"
  // fornisce l'accessible name all'<img> (role=img); l'alt NON è testo nodale
  // → non interferisce con getByText() degli e2e/test esistenti.
  const header = (
    <header className="sd-flex sd-items-center sd-gap-md">
      <img src={logoUrl} alt="Soli-boy" className="sb-app-logo" style={LOGO_STYLE} />
    </header>
  );

  if (error !== null)
    return (
      <section aria-label="Libreria giochi" className="sd-flex sd-flex-col sd-gap-md">
        {header}
        <p className="sb-note" role="alert">
          {error}
        </p>
      </section>
    );
  if (roms === null)
    return (
      <section aria-label="Libreria giochi" className="sd-flex sd-flex-col sd-gap-md">
        {header}
        <p className="sb-note">Caricamento libreria…</p>
      </section>
    );
  if (roms.length === 0)
    return (
      <section aria-label="Libreria giochi" className="sd-flex sd-flex-col sd-gap-md">
        {header}
        <p className="sb-note">Nessun gioco. Carica una ROM per iniziare.</p>
      </section>
    );

  return (
    <section aria-label="Libreria giochi" className="sd-flex sd-flex-col sd-gap-md">
      {header}
      <div className="sd-flex sd-items-center sd-gap-md sd-wrap">
        <label className="sb-search" htmlFor="library-search">
          <span className="sr-only">Cerca per titolo</span>
          <input
            id="library-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per titolo…"
          />
        </label>

        <div
          role="radiogroup"
          aria-label="Filtra per piattaforma"
          className="sd-flex sd-items-center sd-gap-sm sd-wrap"
        >
          <PlatformChip
            value={ALL}
            current={platform}
            onSelect={setPlatform}
            label={PLATFORM_LABELS.ALL}
          />
          {availablePlatforms.map((p) => (
            <PlatformChip
              key={p}
              value={p}
              current={platform}
              onSelect={setPlatform}
              label={PLATFORM_LABELS[p]}
            />
          ))}
        </div>
      </div>

      {coverError !== null && (
        <p className="sb-note" role="alert">
          {coverError}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="sb-note" role="status">
          Nessun risultato per i filtri selezionati.
        </p>
      ) : (
        <ul className="sb-grid" aria-label="Risultati libreria">
          {filtered.map((rom) => (
            <li key={rom.id}>
              <GameTile
                rom={rom}
                isActive={activeRomId !== undefined && rom.id === activeRomId}
                onSelect={() => void handleSelect(rom)}
                onCoverChange={(file) => void handleCoverChange(rom.id, file)}
                onRemove={() => handleRemoveRequest(rom)}
              />
            </li>
          ))}
        </ul>
      )}
      {pendingRemove && (
        <RemoveRomConfirmDialog
          title={pendingRemove.title}
          isActiveRom={activeRomId !== undefined && pendingRemove.id === activeRomId}
          onConfirm={() => void handleRemoveConfirm()}
          onCancel={handleRemoveCancel}
        />
      )}
    </section>
  );
}

interface PlatformChipProps {
  value: PlatformFilter;
  current: PlatformFilter;
  onSelect: (v: PlatformFilter) => void;
  label: string;
}

function PlatformChip({ value, current, onSelect, label }: PlatformChipProps) {
  const active = value === current;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      className={"sd-badge sb-chip" + (active ? " sb-chip-on" : "")}
      onClick={() => onSelect(value)}
    >
      {label}
    </button>
  );
}

// TSK-039 — tile gioco con copertina (US-009).
// Struttura: `<article>.sb-tile` contiene
//   1. uno `<span>.sb-art` con <img> (coverBlob presente) o segnaposto
//      (iniziale del titolo, .sb-art a-1: design system),
//   2. il `<button>.sb-game` di selezione (accessible name "title platform",
//      compatibile con e2e/TSK-011),
//   3. un `<label>` con file input image/* per caricare una nuova copertina.
//
// A11y:
// - L'immagine ha `alt={rom.title}` quando informativa (TSK-039).
// - Il placeholder ha `aria-hidden="true"`: l'iniziale è puramente decorativa,
//   il titolo è già esposto come testo nel button.
// - L'input file è etichettato con "Cambia copertina di <titolo>".

interface GameTileProps {
  rom: RomMeta;
  /** TSK-107 — tile della ROM attualmente in esecuzione. */
  isActive?: boolean;
  onSelect: () => void;
  onCoverChange: (file: File) => void;
  /** TSK-108 — apre il dialog di conferma rimozione. */
  onRemove: () => void;
}

function GameTile({ rom, isActive = false, onSelect, onCoverChange, onRemove }: GameTileProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!rom.coverBlob) {
      setCoverUrl(null);
      return;
    }
    // URL.createObjectURL può non essere disponibile in tutti gli ambienti di
    // test (jsdom legacy) — fallback difensivo a null. In prod (browser/WebView)
    // è sempre definito.
    if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
      setCoverUrl(null);
      return;
    }
    const url = URL.createObjectURL(rom.coverBlob);
    setCoverUrl(url);
    // Cleanup: revoke per evitare memory leak quando la tile viene rimontata
    // o la coverBlob cambia.
    return () => {
      if (typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(url);
      }
    };
  }, [rom.coverBlob]);

  // Iniziale per il segnaposto: prima lettera del titolo (uppercase) o "?".
  const initial = (rom.title.trim()[0] ?? "?").toUpperCase();

  return (
    <article
      className={"sd-card sb-tile" + (isActive ? " sb-tile-active" : "")}
      data-active={isActive ? "true" : "false"}
    >
      <span className="sb-art a-1">
        {rom.coverBlob && coverUrl ? (
          <img
            src={coverUrl}
            alt={rom.title}
            className="sb-cover-img"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "inherit",
            }}
          />
        ) : (
          <span aria-hidden="true">{initial}</span>
        )}
      </span>

      <button
        type="button"
        className="sb-game"
        onClick={onSelect}
        data-testid={`sb-select-rom-${rom.id}`}
      >
        {/* Spazio esplicito fra titolo e badge: l'accessible name deve restare
            "titolo platform" (es. "tetris GB"). Senza il nodo whitespace, il
            calcolo accname di dom-accessibility-api concatena senza spazio
            ("tetrisGB"), divergendo dal browser reale su cui poggiano gli e2e
            (app.e2e.ts → getByRole button name "tetris GB"). */}
        <span className="sb-game-title">{rom.title}</span>{" "}
        <span className="sd-badge">{rom.platform}</span>
      </button>

      {isActive && (
        <span className="sb-tile-active-badge" data-testid="sb-tile-in-game-badge">
          In gioco
        </span>
      )}

      <button
        type="button"
        className="sb-btn sb-danger sb-tile-remove"
        onClick={onRemove}
        aria-label={`Rimuovi ${rom.title} dalla libreria`}
        data-testid={`sb-remove-rom-${rom.id}`}
      >
        Rimuovi
      </button>

      {/*
        Controllo upload: l'accessible name è fornito esclusivamente via
        `aria-label` per evitare di duplicare il testo del titolo nel DOM (che
        romperebbe gli e2e basati su `getByText(title)` con strict mode).
        Il label visibile generico "Copertina" è sufficiente: il contesto
        della tile fornisce l'associazione visuale alla ROM specifica.
      */}
      <label className="sb-cover-upload">
        <input
          type="file"
          accept="image/*"
          aria-label={`Cambia copertina di ${rom.title}`}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onCoverChange(f);
            // Reset value così re-selezionare lo stesso file rilancia onChange.
            e.target.value = "";
          }}
        />
        <span className="sb-cover-upload-label" aria-hidden="true">
          Copertina
        </span>
      </label>
    </article>
  );
}

interface RemoveRomConfirmDialogProps {
  title: string;
  isActiveRom: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** TSK-108 — Dialog modale di conferma rimozione ROM (pattern TSK-101). */
function RemoveRomConfirmDialog({
  title,
  isActiveRom,
  onConfirm,
  onCancel,
}: RemoveRomConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  function onDialogKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const focusables = [cancelRef.current, confirmRef.current].filter(
      (el): el is HTMLButtonElement => el !== null,
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="sb-dialog-backdrop"
      onClick={onCancel}
      data-testid="remove-rom-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-rom-title"
        aria-describedby="remove-rom-desc"
        className="sb-dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onDialogKeyDown}
        data-testid="remove-rom-dialog"
        style={{
          background: "var(--sd-color-bg-elevated, #1a1430)",
          color: "var(--sd-color-text-primary, #f0e9ff)",
          borderRadius: "var(--sd-radius-md, 8px)",
          padding: "1.25rem",
          maxWidth: "24rem",
          width: "calc(100% - 2rem)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        }}
      >
        <h2 id="remove-rom-title" className="sb-lbl" style={{ marginTop: 0 }}>
          Rimuovere {title} dalla libreria?
        </h2>
        <p id="remove-rom-desc" className="sb-note" style={{ marginBottom: "1.25rem" }}>
          {isActiveRom
            ? "Stai rimuovendo il gioco attualmente in esecuzione. Verrà fermato."
            : "La ROM verrà eliminata dal dispositivo. I save state associati potrebbero restare orfani."}
        </p>
        <div className="sd-flex sd-gap-sm" style={{ justifyContent: "flex-end" }}>
          <button ref={cancelRef} type="button" className="sb-btn" onClick={onCancel}>
            Annulla
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="sb-btn sb-danger"
            onClick={onConfirm}
          >
            Rimuovi
          </button>
        </div>
      </div>
    </div>
  );
}
