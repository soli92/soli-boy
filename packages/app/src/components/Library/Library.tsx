// TSK-012 — Library: griglia delle ROM persistite (US-004/US-007).
// Mostra titolo + piattaforma; selezione → callback. UI su classi solids.

import { useEffect, useState } from "react";
import type { StoragePort } from "../../storage/port";
import type { RomRecord } from "../../storage/types";

export interface LibraryProps {
  storage: StoragePort;
  /** Invocato alla selezione di un gioco. */
  onSelect?: (rom: RomRecord) => void;
}

export function Library({ storage, onSelect }: LibraryProps) {
  const [roms, setRoms] = useState<RomRecord[] | null>(null);

  useEffect(() => {
    let active = true;
    void storage.listRoms().then((r) => {
      if (active) setRoms(r);
    });
    return () => {
      active = false;
    };
  }, [storage]);

  if (roms === null) return <p className="sb-note">Caricamento libreria…</p>;
  if (roms.length === 0)
    return <p className="sb-note">Nessun gioco. Carica una ROM per iniziare.</p>;

  return (
    <ul className="sb-grid" aria-label="Libreria giochi">
      {roms.map((rom) => (
        <li key={rom.id}>
          <button className="sd-card sb-game" onClick={() => onSelect?.(rom)}>
            <span className="sb-game-title">{rom.title}</span>
            <span className="sd-badge">{rom.platform}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
