// TSK-063 — useCapacitorFilePicker: astrazione per la lettura di file URI via
// Capacitor Filesystem (US-029, EP-007).
//
// Contesto: su Capacitor WebView (Android/iOS) l'elemento `<input type="file">`
// apre già il picker di sistema (inclusi provider cloud come Google Drive e
// iCloud). L'handler onChange riceve sempre oggetti `File` — non URI raw — quindi
// il path standard del FileLoader funziona senza modifiche.
//
// Questo modulo gestisce il caso in cui un file venga fornito tramite URI (path
// stringa) anziché come oggetto `File` blob: tipico degli intents Android o dei
// deep-link iOS che passano `file://...` o `content://...` come riferimento
// esterno. In quel caso si usa `@capacitor/filesystem Filesystem.readFile` per
// leggere il contenuto binario (restituito come base64 su nativo), si decodifica
// e si crea un oggetto `File` compatibile con il flusso esistente
// (PlatformRecognition → LibraryService → StoragePort).
//
// Invariante privacy (US-033 / ADR-002): zero chiamate di rete. La lettura
// avviene SOLO via Filesystem plugin (IPC locale nativo); nessun fetch/XHR.
//
// [^src: management/kanban/EP-007-esperienza-mobile/US-029-caricamento-file-mobile/TSK-063.md]
// [^src: design_&_architecture/decisions/ADR-002.md §Conseguenze]

/** Guard: true se Capacitor nativo è disponibile (stesso pattern di useHaptics.ts). */
export function isCapacitorNative(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as unknown as Record<string, unknown>)["Capacitor"] !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Capacitor?.isNativePlatform?.() === true
  );
}

/**
 * Shape minimale dell'API Capacitor Filesystem consumata da questo modulo.
 * Definita localmente per disaccoppiare il renderer dal package Capacitor e
 * per facilitare il mock nei test (stesso pattern di NativeFsBridge).
 */
export interface CapacitorFilesystemApi {
  readFile(options: { path: string }): Promise<{ data: string | Blob }>;
}

/**
 * Carica il modulo `@capacitor/filesystem` in modo lazy (una sola volta).
 * Ritorna `null` se l'import fallisce (ambiente non nativo, modulo assente).
 * Mantiene la Promise in cache per evitare import multipli (stesso pattern
 * dell'import dinamico in useHaptics.ts).
 */
let filesystemApiPromise: Promise<CapacitorFilesystemApi | null> | null = null;

function loadFilesystemApi(): Promise<CapacitorFilesystemApi | null> {
  if (filesystemApiPromise) return filesystemApiPromise;
  filesystemApiPromise = import("@capacitor/filesystem")
    .then((mod) => {
      const api = (mod as unknown as { Filesystem: CapacitorFilesystemApi }).Filesystem;
      return api ?? null;
    })
    .catch(() => null);
  return filesystemApiPromise;
}

/**
 * Converte una stringa base64 in `Uint8Array` per creare un `Blob`/`File`.
 * `atob` è disponibile sia in browser che in jsdom (ES2015+).
 */
function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

/**
 * Legge un file da URI nativa via `Filesystem.readFile` e lo restituisce come
 * oggetto `File`, pronto per essere passato a `importRom` / `handleFile`.
 *
 * Su nativo il plugin restituisce `data` come stringa base64 (senza encoding).
 * Su Web il plugin usa `Blob` direttamente — in quel contesto questo path non
 * viene mai eseguito (guard `isCapacitorNative()`), ma gestiamo comunque il
 * ramo `Blob` per robustezza.
 *
 * @param uri   - URI nativa del file (es. `file:///storage/.../zelda.gbc`
 *                o `content://com.android.providers.media/...`).
 * @param filename - Nome del file per costruire l'oggetto `File`.
 * @param filesystemApi - Iniettabile per i test (default: import dinamico).
 * @returns `File` con i byte del file, oppure `null` se la lettura fallisce.
 */
export async function readFileFromUri(
  uri: string,
  filename: string,
  filesystemApi?: CapacitorFilesystemApi | null,
): Promise<File | null> {
  try {
    // Se `filesystemApi` è null/undefined, tenta il caricamento dinamico del modulo.
    // `null` è trattato come "api non disponibile" (fallback a null senza dynamic import).
    const api =
      filesystemApi !== undefined
        ? filesystemApi // può essere null → gestito dal guard sotto
        : await loadFilesystemApi();
    if (!api) return null;

    const result = await api.readFile({ path: uri });

    let buffer: ArrayBuffer;
    if (result.data instanceof Blob) {
      // Web path (Blob diretto).
      buffer = await result.data.arrayBuffer();
    } else {
      // Nativo path: base64 string.
      buffer = base64ToUint8Array(result.data).buffer as ArrayBuffer;
    }

    return new File([buffer], filename, { type: "application/octet-stream" });
  } catch {
    // Lettura fallita (URI non valida, permessi, ecc.): ritorna null
    // affinché il chiamante possa gestire l'errore a livello UI.
    return null;
  }
}

/**
 * Deriving a filename from a URI, stripping scheme and path separators.
 * Es. `file:///storage/emulated/0/ROM/zelda.gbc` → `zelda.gbc`.
 * Fallback: `file` se l'URI non contiene un nome riconoscibile.
 */
export function filenameFromUri(uri: string): string {
  const decoded = decodeURIComponent(uri);
  const parts = decoded.split(/[/\\]/);
  const last = parts[parts.length - 1];
  return last.length > 0 ? last : "file";
}
