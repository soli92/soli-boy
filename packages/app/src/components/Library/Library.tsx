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
import { useCallback, useEffect, useMemo, useState } from "react";
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

// TSK-108 — azione Rimuovi con dialog conferma (US-056, EP-016).
// La rimozione è distruttiva (cancella la ROM da IndexedDB): un dialog modale
// chiede conferma prima di procedere. Il dialog è implementato inline con
// `role="dialog"` + `aria-modal` + focus trap minimale (due bottoni).
// `onRemove` opzionale per backward compat con i test legacy.

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
   * TSK-107 — ID della ROM correntemente in sessione nel Player (prop
   * opzionale per backward compat). Se presente, la GameTile corrispondente
   * mostra il badge "In esecuzione" e `aria-current="true"`.
   */
  currentRomId?: string;
  /**
   * TSK-108 — callback invocata dopo la conferma di rimozione di una ROM.
   * Riceve l'id della ROM da rimuovere. Il gestore (App.tsx) si occupa di
   * chiamare `storage.removeRom(id)` e di aggiornare il refresh counter.
   * Prop opzionale: se assente, il bottone Rimuovi non viene renderizzato
   * (backward compat con test legacy senza questa feature).
   */
  onRemove?: (romId: string) => void;
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

export function Library({ storage, onSelect, currentRomId, onRemove }: LibraryProps) {
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
                onSelect={() => void handleSelect(rom)}
                onCoverChange={(file) => void handleCoverChange(rom.id, file)}
                isCurrent={currentRomId !== undefined && rom.id === currentRomId}
                onRemove={onRemove}
              />
            </li>
          ))}
        </ul>
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
// TSK-107 — indicatore visivo ROM corrente (US-056, EP-016).
//
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
// - TSK-107: `aria-current="true"` sul bottone di selezione quando la ROM è
//   quella corrente in sessione; il badge ".sb-current-badge" ha aria-hidden
//   (testo decorativo — l'informazione è già in aria-current).

interface GameTileProps {
  /**
   * TSK-075 — la tile riceve `RomMeta` (no `fileBlob`): per renderizzare basta
   * titolo/piattaforma + coverBlob. Il `fileBlob` viene caricato dalla
   * Library al click via `getRom(id)`.
   */
  rom: RomMeta;
  onSelect: () => void;
  onCoverChange: (file: File) => void;
  /**
   * TSK-107 — true se questa tile è la ROM correntemente in sessione nel
   * Player. Aggiunge un badge visivo "In esecuzione" + `aria-current="true"`
   * sul bottone di selezione per l'accessibilità.
   */
  isCurrent?: boolean;
  /**
   * TSK-108 — callback invocata dopo la conferma di rimozione (passata dalla
   * Library). Riceve l'id della ROM. Se assente, il bottone Rimuovi non viene
   * renderizzato (backward compat con test legacy).
   */
  onRemove?: (romId: string) => void;
}

function GameTile({ rom, onSelect, onCoverChange, isCurrent = false, onRemove }: GameTileProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  // TSK-108 — stato del dialog di conferma rimozione.
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

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
    <article className={"sd-card sb-tile" + (isCurrent ? " sb-tile--current" : "")}>
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

      {/* TSK-107 — badge "In esecuzione" visivo + aria-current sul bottone.
          aria-current="true" comunica ad AT che questa ROM è attiva in sessione.
          Il badge testuale ha aria-hidden: l'informazione è già in aria-current. */}
      {isCurrent && (
        <span
          className="sb-current-badge sd-badge"
          aria-hidden="true"
          data-testid="sb-tile-current-badge"
          style={{ fontSize: "0.7rem", opacity: 0.9 }}
        >
          In esecuzione
        </span>
      )}

      <button
        type="button"
        className="sb-game"
        onClick={onSelect}
        aria-current={isCurrent ? "true" : undefined}
      >
        {/* Spazio esplicito fra titolo e badge: l'accessible name deve restare
            "titolo platform" (es. "tetris GB"). Senza il nodo whitespace, il
            calcolo accname di dom-accessibility-api concatena senza spazio
            ("tetrisGB"), divergendo dal browser reale su cui poggiano gli e2e
            (app.e2e.ts → getByRole button name "tetris GB"). */}
        <span className="sb-game-title">{rom.title}</span>{" "}
        <span className="sd-badge">{rom.platform}</span>
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

      {/* TSK-108 — bottone Rimuovi: visibile solo se il gestore è fornito.
          Apre un dialog di conferma prima di procedere (azione distruttiva).
          L'accessible name cita il titolo della ROM ("Rimuovi <titolo>")
          per disambiguare se più tile sono visibili. */}
      {onRemove && (
        <>
          <button
            type="button"
            className="sb-btn sb-danger"
            aria-label={`Rimuovi ${rom.title}`}
            data-testid={`sb-tile-remove-${rom.id}`}
            onClick={() => setShowRemoveDialog(true)}
          >
            Rimuovi
          </button>

          {showRemoveDialog && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`sb-remove-dialog-title-${rom.id}`}
              aria-describedby={`sb-remove-dialog-desc-${rom.id}`}
              data-testid={`sb-remove-dialog-${rom.id}`}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
              onClick={() => setShowRemoveDialog(false)}
            >
              <div
                className="sd-card"
                style={{
                  background: "var(--sd-color-bg-elevated, #1a1430)",
                  color: "var(--sd-color-text-primary, #f0e9ff)",
                  padding: "1.5rem",
                  borderRadius: "0.5rem",
                  maxWidth: "28rem",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2
                  id={`sb-remove-dialog-title-${rom.id}`}
                  style={{ marginTop: 0, marginBottom: "0.75rem" }}
                >
                  Rimuovi gioco?
                </h2>
                <p
                  id={`sb-remove-dialog-desc-${rom.id}`}
                  style={{ marginBottom: "1.25rem" }}
                >
                  Stai per rimuovere{" "}
                  <strong>
                    {rom.title} ({rom.platform})
                  </strong>{" "}
                  dalla libreria. L&apos;operazione non può essere annullata.
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="sb-btn"
                    onClick={() => setShowRemoveDialog(false)}
                    data-testid={`sb-remove-dialog-cancel-${rom.id}`}
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    className="sb-btn sb-btn-primary sb-danger"
                    onClick={() => {
                      setShowRemoveDialog(false);
                      onRemove(rom.id);
                    }}
                    data-testid={`sb-remove-dialog-confirm-${rom.id}`}
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}
