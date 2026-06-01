// TSK-012 — Library: griglia delle ROM persistite (US-004/US-007).
// TSK-038 — UI ricerca per titolo + filtro piattaforma (US-008).
// TSK-039 — Copertina gioco (US-009): mostra coverBlob (se presente) o un
// segnaposto coerente col DS (.sb-art con iniziale del titolo); controllo
// per caricare una cover dall'utente (file input image/*) → setCover →
// refresh della tile. Nessun fetch esterno (US-033 privacy on-device).
// UI su classi solids.

import { useEffect, useMemo, useState } from "react";
import type { Platform } from "../../domain/types";
import type { CoverPort, StoragePort } from "../../storage/port";
import type { RomRecord } from "../../storage/types";

export interface LibraryProps {
  /**
   * Porta combinata: lettura ROM (StoragePort) + aggiornamento copertina
   * (CoverPort). Tenute disgiunte nel contratto per interface segregation
   * (consumer ROM-only non vedono setCover); qui le componiamo nel prop.
   */
  storage: StoragePort & CoverPort;
  /** Invocato alla selezione di un gioco. */
  onSelect?: (rom: RomRecord) => void;
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

export function Library({ storage, onSelect }: LibraryProps) {
  const [roms, setRoms] = useState<RomRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<PlatformFilter>(ALL);

  useEffect(() => {
    let active = true;
    // F-038-02: al cambio identità di `storage` resettiamo i filtri (UI coerente
    // con il nuovo dataset) e lo stato di errore.
    setQuery("");
    setPlatform(ALL);
    setError(null);
    storage
      .listRoms()
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
  // interamente in memoria. Per dataset grandi esiste StoragePort.listRoms(filter)
  // (architecture-overview §EP-002).
  const filtered = useMemo<RomRecord[]>(() => {
    if (!roms) return [];
    const q = query.trim().toLowerCase();
    return roms.filter((r) => {
      if (platform !== ALL && r.platform !== platform) return false;
      if (q.length > 0 && !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [roms, query, platform]);

  // TSK-039 — handler upload copertina: persiste via setCover, poi aggiorna
  // localmente la entry in `roms` per refreshare la tile senza ri-listare
  // l'intera libreria (evita flicker e mantiene scroll/filtri stabili).
  async function handleCoverChange(romId: string, file: File) {
    setError(null);
    try {
      await storage.setCover(romId, file);
      setRoms((prev) =>
        prev
          ? prev.map((r) => (r.id === romId ? { ...r, coverBlob: file } : r))
          : prev,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Impossibile aggiornare la copertina: ${msg}`);
    }
  }

  if (error !== null)
    return (
      <p className="sb-note" role="alert">
        {error}
      </p>
    );
  if (roms === null) return <p className="sb-note">Caricamento libreria…</p>;
  if (roms.length === 0)
    return <p className="sb-note">Nessun gioco. Carica una ROM per iniziare.</p>;

  return (
    <section aria-label="Libreria giochi" className="sd-flex sd-flex-col sd-gap-md">
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
                onSelect={() => onSelect?.(rom)}
                onCoverChange={(file) => void handleCoverChange(rom.id, file)}
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
  rom: RomRecord;
  onSelect: () => void;
  onCoverChange: (file: File) => void;
}

function GameTile({ rom, onSelect, onCoverChange }: GameTileProps) {
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
    <article className="sd-card sb-tile">
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

      <button type="button" className="sb-game" onClick={onSelect}>
        <span className="sb-game-title">{rom.title}</span>
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
    </article>
  );
}
