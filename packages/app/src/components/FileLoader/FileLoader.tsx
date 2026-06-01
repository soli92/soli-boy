// TSK-003 — FileLoader: selettore file + drag & drop (US-001).
// Carica una ROM fornita dall'utente e la importa via dominio (importRom, TSK-002).
// UI su classi solids. Errore comprensibile su file non valido.

import { useState } from "react";
import type { StoragePort } from "../../storage/port";
import { importRom } from "../../domain/rom-library";

export interface FileLoaderProps {
  storage: StoragePort;
  /** Callback con l'id della ROM importata. */
  onImported?: (id: string) => void;
}

/** Legge i primi byte per la conferma da contenuto, in modo difensivo (jsdom non ha Blob.arrayBuffer). */
async function readHeader(file: Blob): Promise<Uint8Array | undefined> {
  const head = file.slice(0, 0x100);
  if (typeof head.arrayBuffer !== "function") return undefined;
  try {
    return new Uint8Array(await head.arrayBuffer());
  } catch {
    return undefined;
  }
}

export function FileLoader({ storage, onImported }: FileLoaderProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    const header = await readHeader(file);
    const res = await importRom(file.name, file, storage, header);
    if (res.ok) onImported?.(res.id);
    else setError(res.reason);
  }

  return (
    <div className="sb-loader">
      <label className="sb-btn sb-btn-primary">
        Carica ROM
        <input
          type="file"
          aria-label="Carica ROM"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </label>

      <div
        className="sb-dropzone"
        role="button"
        tabIndex={0}
        aria-label="Trascina qui una ROM"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) void handleFile(f);
        }}
      >
        Trascina qui una ROM
      </div>

      {error && (
        <p className="sb-note" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
