// TSK-003 — FileLoader: selettore file + drag & drop (US-001).
// Carica una ROM fornita dall'utente e la importa via dominio (importRom, TSK-002).
// UI su classi solids. Errore comprensibile su file non valido.
//
// TSK-063 — Capacitor path: su mobile nativo l'elemento <input type="file">
// apre il picker di sistema (inclusi provider cloud Google Drive/iCloud) e
// fornisce già oggetti `File` tramite l'evento onChange — nessuna modifica al
// flusso principale. Il prop `onCapacitorUri` gestisce il caso in cui un file
// arrivi tramite URI esterna (deep-link, Android intent): legge il contenuto
// via Filesystem.readFile e lo converte in File prima di passarlo a handleFile.
// [^src: management/kanban/EP-007-esperienza-mobile/US-029-caricamento-file-mobile/TSK-063.md]

import { useEffect, useRef, useState } from "react";
import type { StoragePort } from "../../storage/port";
import { importRom } from "../../domain/rom-library";
import {
  isCapacitorNative,
  readFileFromUri,
  filenameFromUri,
  type CapacitorFilesystemApi,
} from "./useCapacitorFilePicker";

export interface FileLoaderProps {
  storage: StoragePort;
  /** Callback con l'id della ROM importata. */
  onImported?: (id: string) => void;
  /**
   * TSK-063 — Riceve un ref-callback con la funzione `handleCapacitorUri`,
   * così il parent (es. App) può invocarla quando riceve un Android intent o
   * un iOS deep-link contenente un file URI. No-op se non fornito.
   *
   * Esempio:
   *   const uriHandlerRef = useRef<((uri: string) => Promise<void>) | null>(null);
   *   <FileLoader registerUriHandler={(fn) => { uriHandlerRef.current = fn; }} .../>
   *   // Poi: uriHandlerRef.current?.("file:///storage/emulated/0/rom.gbc");
   */
  registerUriHandler?: (handler: (uri: string) => Promise<void>) => void;
  /**
   * TSK-063 — Iniettabile per i test (mock di `@capacitor/filesystem`).
   * In runtime non serve mai passarlo esplicitamente: viene caricato in modo
   * lazy da `readFileFromUri` via import dinamico. Presente solo per facilitare
   * l'iniezione del mock nel test senza dover mock-are l'intero modulo ESM.
   */
  _filesystemApi?: CapacitorFilesystemApi | null;
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

export function FileLoader({
  storage,
  onImported,
  registerUriHandler,
  _filesystemApi,
}: FileLoaderProps) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    const header = await readHeader(file);
    const res = await importRom(file.name, file, storage, header);
    if (res.ok) onImported?.(res.id);
    else setError(res.reason);
  }

  /**
   * TSK-063 — Gestisce un URI file esterno (Android intent / iOS deep-link).
   * Risolve il contenuto via Capacitor Filesystem, costruisce un File e
   * delega a handleFile (identico al path <input>).
   * Sicuro da invocare anche in ambiente web: il guard `isCapacitorNative()`
   * garantisce il no-op fuori dal contesto nativo.
   */
  async function handleCapacitorUri(uri: string) {
    if (!isCapacitorNative()) return;
    const filename = filenameFromUri(uri);
    const file = await readFileFromUri(uri, filename, _filesystemApi);
    if (!file) {
      setError("Impossibile leggere il file dal percorso indicato.");
      return;
    }
    await handleFile(file);
  }

  // TSK-063 — Registra l'handler URI nel parent alla prima resa.
  // Dipendenza stabile: `registerUriHandler` è una funzione di callback
  // fornita dal parent; `handleCapacitorUri` varia a ogni render (closure)
  // ma per questo pattern di "registrazione" ci interessa solo il montaggio.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    registerUriHandler?.(handleCapacitorUri);
    // Intenzionalmente vuoto: registriamo una sola volta al mount.
    // Il pattern è analogo a un ref-setter. Se il parent cambia
    // `registerUriHandler` tra render, la nuova registrazione avviene
    // al successivo montaggio (behavior accettabile per questo use-case).
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="sb-loader">
      <label className="sb-btn sb-btn-primary">
        Carica ROM
        <input
          ref={inputRef}
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
        onKeyDown={(e) => {
          // TSK-020 / REACT-A11Y-001: attivazione da tastiera → apre il selettore file.
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
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
