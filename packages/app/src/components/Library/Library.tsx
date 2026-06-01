// TSK-012 — Library: griglia delle ROM persistite (US-004/US-007).
// TSK-038 — aggiunta UI ricerca per titolo + filtro piattaforma (US-008).
// Mostra titolo + piattaforma; selezione → callback. UI su classi solids.

import { useEffect, useMemo, useState } from "react";
import type { Platform } from "../../domain/types";
import type { StoragePort } from "../../storage/port";
import type { RomRecord } from "../../storage/types";

export interface LibraryProps {
  storage: StoragePort;
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
              <button className="sd-card sb-game" onClick={() => onSelect?.(rom)}>
                <span className="sb-game-title">{rom.title}</span>
                <span className="sd-badge">{rom.platform}</span>
              </button>
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
