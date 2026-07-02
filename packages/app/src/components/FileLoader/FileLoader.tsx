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
// TSK-145 (US-095 / EP-020) — Migrazione CTA "Carica ROM" alla primitive Button
// (solids/shadcn). Il pattern `asChild` monta il <label> come Slot Radix con gli
// stili del Button (variant="default"), evitando wrapper HTML extra e preservando
// l'associazione nativa label↔input file (click sul label apre il picker).
// L'input è sibling (non figlio) del label, linkato via `htmlFor="file-input"`.
import { Button } from "@/components/ui/button";

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
    try {
      const header = await readHeader(file);
      const res = await importRom(file.name, file, storage, header);
      if (res.ok) onImported?.(res.id);
      else setError(res.reason);
    } catch (err) {
      // TSK-097 — Guard runtime inattesi (es. IDB closed, TypeError da storage).
      // Senza questo wrap l'eccezione diventerebbe Promise rejected non gestita
      // e l'utente non vedrebbe alcun feedback.
      if (import.meta.env.DEV) console.error("FileLoader.handleFile:", err);
      setError("Errore inatteso durante l'importazione — riprovare");
    }
  }

  // TSK-095 — Pattern "latest ref" per evitare stale closure.
  // Il handler URI è registrato nel parent al mount (listener Capacitor fuori
  // dal ciclo render di React) ma deve usare sempre l'ultima versione di
  // storage/onImported/_filesystemApi. Aggiorniamo `handlerRef.current` a ogni
  // render così la closure stabile (registrata una sola volta) delega sempre
  // all'implementazione corrente — niente listener duplicati, niente stale.
  const handlerRef = useRef<(uri: string) => Promise<void>>(async () => {});
  handlerRef.current = async (uri: string) => {
    if (!isCapacitorNative()) return;
    const filename = filenameFromUri(uri);
    const file = await readFileFromUri(uri, filename, _filesystemApi);
    if (!file) {
      setError("Impossibile leggere il file dal percorso indicato.");
      return;
    }
    await handleFile(file);
  };

  useEffect(() => {
    registerUriHandler?.((uri: string) => handlerRef.current(uri));
  }, [registerUriHandler]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* TSK-145 — CTA "Carica ROM": Button asChild monta il <label> come Slot
          Radix con gli stili del Button (variant="default"). Il click sul label
          apre nativamente il picker file grazie all'attributo `htmlFor` che punta
          all'`id` dell'input sibling (WAI-ARIA labelling standard). L'input è
          `sr-only` (screen-reader only): invisibile visualmente ma raggiungibile
          da AT e testabile tramite `getByLabelText("Carica ROM")` (l'aria-label
          esplicito è preservato come fallback + doc a11y). */}
      <Button asChild variant="default">
        <label htmlFor="file-input">Carica ROM</label>
      </Button>
      <input
        id="file-input"
        ref={inputRef}
        type="file"
        aria-label="Carica ROM"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />

      {/* TSK-145 — Dropzone: utility Tailwind sostituiscono `.sb-dropzone`.
          `border-2 border-dashed border-border` = bordo tratteggiato con token
          semantico solids; `focus-visible:ring-2 focus-visible:ring-ring` =
          anello focus coerente col design system (equivalente all'outline
          precedente). `role="button"`/`tabIndex`/`aria-label`/keyboard handler
          preservati (invariante a11y: Enter/Space → apre picker, TSK-020). */}
      <div
        className="flex-1 min-h-16 flex items-center justify-center border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <p className="text-xs text-muted-foreground" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
