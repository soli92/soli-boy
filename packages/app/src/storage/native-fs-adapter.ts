// TSK-054 — NativeFsAdapter: implementa la porta di persistenza locale (StoragePort
// + SaveStatePort + SramPort + CoverPort + ConfigPort) per il target desktop
// (Electron), appoggiandosi al bridge IPC esposto in TSK-053 da `preload.ts`
// (`window.soliboyDesktop`, contextBridge → main process Node `fs/promises` +
// `dialog.show{Open,Save}Dialog`).
//
// ── Mapping IPC reale (TSK-053 done) ───────────────────────────────────────────
// Il TSK-054 cita `window.electronAPI.fs.*` come namespace; il bridge reale
// esposto in TSK-053 è invece `window.soliboyDesktop` (cfr. preload.ts
// §contextBridge.exposeInMainWorld("soliboyDesktop", api)). L'adapter consuma il
// nome canonico effettivo, restando agnostico tramite l'interfaccia
// `NativeFsBridge` iniettabile (facilita il mock nei test e disaccoppia il
// renderer dal `globalThis` quando il bundler non lo esegue in jsdom).
//
// ── Schema su disco ────────────────────────────────────────────────────────────
// Directory base: ~/.soli-boy/ (o equivalente platform-specific risolto dal main
// process). Una sottodirectory logica per collezione:
//
//   ~/.soli-boy/
//     ├─ roms/
//     │    ├─ index.json                        ← manifest (RomManifest)
//     │    ├─ <romId>.bin                       ← fileBlob della ROM
//     │    └─ <romId>.cover.bin                 ← coverBlob (US-009, opzionale)
//     ├─ save-states/
//     │    ├─ index.json                        ← manifest (SaveStateManifest)
//     │    └─ <saveStateId>.bin                 ← snapshotBlob
//     ├─ sram/
//     │    ├─ index.json                        ← manifest (SramManifest)
//     │    └─ <romId>.sram                      ← data SRAM cartuccia
//     └─ config.json                            ← chiave/valore (ConfigManifest)
//
// Le chiavi logiche (id ROM = hash FNV-1a 32-bit del contenuto, id save state
// = `<romId>:<slot>:<createdAt>:<uuid>`, chiavi config arbitrarie) sono
// **identiche** all'IndexedDBAdapter: invariante richiesto dal TSK
// (compatibilità export/import futura, US-019).
//
// ── Vincoli e assunzioni ──────────────────────────────────────────────────────
// Il bridge IPC (TSK-053 esteso da TSK-074) espone:
//   - readFile / writeFile (TSK-053)
//   - unlink / mkdir / readdir / stat (TSK-074)
//   - showOpenDialog / showSaveDialog (TSK-053)
//
// Conseguenze rispetto al workaround originale di TSK-054:
//   1. **Directory garantite via mkdir(recursive)** — l'adapter chiama
//      `mkdir({recursive:true})` sulle sottodirectory (`roms/`, `save-states/`,
//      `sram/`) prima delle scritture, invece di assumere che il main le
//      preconfiguri. Idempotente e safe se le dir esistono già.
//   2. **Delete reale via unlink** — `removeRom` e `deleteSaveState` ora
//      chiamano `bridge.unlink(...)` sui file blob (best-effort: ENOENT
//      tollerato per mantenere idempotenza). Niente più tombstone a 0 byte.
//   3. L'esistenza di un file si verifica via `bridge.stat({exists})` oppure,
//      per i path che servono sia letti sia assenti, ancora via
//      `readFile`+catch ENOENT in `readFileIfExists` (più diretto quando il
//      contenuto serve davvero).
//
// Invariante privacy (ADR-002 / US-033): zero chiamate di rete. L'adapter usa
// SOLO il bridge IPC; nessun fetch/XHR/WebSocket. Verificato anche nei test
// (mock del bridge → assenza di network).
//
// ── Stato runtime ─────────────────────────────────────────────────────────────
// L'export del **runtime adapter** (selezione web/IDB vs desktop/NativeFs) NON
// avviene qui: è scope di TSK-055. Questo file esporta solo la classe
// `NativeFsAdapter` (e la sua factory) per consentire ai consumer di istanziarla
// quando rilevano il bridge desktop.
//
// [^src: design_&_architecture/api_specs/storage-port.md §Adapter]
// [^src: design_&_architecture/decisions/ADR-002.md §Decisione]
// [^src: packages/desktop/electron/preload.ts §contextBridge]
// [^src: management/kanban/EP-006-distribuzione-desktop/US-023-filesystem-nativo/TSK-053.md §Implementazione]

import type { RtcState } from "../domain/rtc-service";
// F-127-2 (CQRL TSK-127 iter-1): importa la costante `RTC_STATE_SCHEMA_VERSION`
// invece di hardcodare `1` nel record persistito (vedi `putRtcState`). Manteniamo
// IDB e NativeFs allineati sulla stessa source of truth per la versione di schema.
import { RTC_STATE_SCHEMA_VERSION } from "./db";
import type {
  ConfigPort,
  CoverPort,
  RtcStatePort,
  SaveStatePort,
  SaveStoragePort,
  SramPort,
  StoragePort,
} from "./port";
import type {
  RomFilter,
  RomInput,
  RomMeta,
  RomRecord,
  RtcStateRecord,
  SaveStateInput,
  SaveStateRecord,
  SramRecord,
} from "./types";
// NB: `ConfigRecord` (./types) NON è importato qui — il manifest serializza
// `Record<string, unknown>`, non `ConfigRecord[]`, perché lo store config su
// disco usa una struttura object-map (più compatta per chiavi sparse). Resta
// un riferimento di documentazione: la SEMANTICA delle chiavi è la stessa
// dello store `config` IDB (cfr. db.ts §getConfig/setConfig).

/**
 * Interfaccia minima richiesta dall'adapter al bridge IPC (sottoinsieme di
 * `SoliboyDesktopApi` esportata da `packages/desktop/electron/preload.ts`).
 * Definita qui per disaccoppiare il renderer dal package desktop (l'app non
 * dipende da `electron/` come modulo) e per consentire l'iniezione nei test.
 *
 * TSK-074: estesa con unlink / mkdir / readdir / stat per supportare il delete
 * reale e la creazione delle directory di collezione.
 *
 * TSK-077: aggiunto `getBaseDir?` (OPZIONALE per retro-compat con bridge
 * pre-TSK-077). Quando presente, ritorna il path assoluto autoritativo della
 * base dir applicativa, risolto lato main process (single source of truth con
 * `guardPath`); l'adapter lo consuma in modo lazy+memoizzato per non
 * propagare async ai consumer (`selectAdapter()` / `App.tsx` restano sync).
 * Se assente → fallback esplicito al `baseDir` convenzionale del costruttore
 * (no path errati silenziosi, vedi `resolveBaseDir()`).
 */
export interface NativeFsBridge {
  readFile(filePath: string): Promise<Uint8Array>;
  writeFile(filePath: string, data: Uint8Array): Promise<void>;
  unlink(filePath: string): Promise<void>;
  mkdir(dirPath: string, opts?: { recursive?: boolean }): Promise<void>;
  readdir(dirPath: string): Promise<string[]>;
  stat(filePath: string): Promise<{ exists: boolean; size: number; isDirectory: boolean }>;
  /**
   * TSK-077 — ritorna la base dir assoluta autoritativa del main process.
   * Opzionale: bridge pre-TSK-077 ne sono privi → l'adapter cade sul
   * `baseDir` convenzionale passato al costruttore.
   */
  getBaseDir?(): Promise<string>;
}

// ── Manifest schemas ─────────────────────────────────────────────────────────
// I manifest sono JSON serializzabili: i campi `Blob`/`Uint8Array` dei record
// runtime restano FUORI dal JSON (vivono come file binari separati). Nel
// manifest persistiamo solo i metadati (id, titolo, ecc.) e il riferimento al
// file blob (path relativo alla sottodirectory).

interface RomManifestEntry {
  id: string;
  title: string;
  platform: RomRecord["platform"];
  core: RomRecord["core"];
  addedAt: number;
  /** path relativo (es. "<id>.bin") del fileBlob, dentro `roms/`. */
  filePath: string;
  /** path relativo (es. "<id>.cover.bin") del coverBlob, se presente. */
  coverPath?: string;
}

interface RomManifest {
  version: 1;
  entries: RomManifestEntry[];
}

interface SaveStateManifestEntry {
  id: string;
  romId: string;
  slot: number;
  core: SaveStateRecord["core"];
  createdAt: number;
  /** path relativo (es. "<id>.bin") dello snapshotBlob, dentro `save-states/`. */
  snapshotPath: string;
}

interface SaveStateManifest {
  version: 1;
  entries: SaveStateManifestEntry[];
}

interface SramManifestEntry {
  romId: string;
  updatedAt: number;
  /** path relativo (es. "<romId>.sram") del data blob, dentro `sram/`. */
  dataPath: string;
}

interface SramManifest {
  version: 1;
  entries: SramManifestEntry[];
}

interface ConfigManifest {
  version: 1;
  /** map key → value JSON-serializzabile. */
  entries: Record<string, unknown>;
}

// ── Costanti di layout ────────────────────────────────────────────────────────
const ROMS_DIR = "roms";
const SAVE_STATES_DIR = "save-states";
const SRAM_DIR = "sram";
const RTC_STATE_DIR = "rtc-state"; // TSK-127 stub layout (ADR-009 §3 / NativeFs)
const ROMS_MANIFEST = "index.json";
const SAVE_STATES_MANIFEST = "index.json";
const SRAM_MANIFEST = "index.json";
const CONFIG_FILE = "config.json";

// ── Utilità path ──────────────────────────────────────────────────────────────
// Contratto path POSIX (TSK-074 / F-5): l'adapter compone path **sempre** con
// separatore `/`. Il main process (`path.resolve` in `guardPath`) normalizza
// poi i separatori nel formato nativo prima di toccare il filesystem. Su
// Windows i path POSIX-style come `C:/Users/.../soli-boy/roms/index.json`
// vengono accettati da `path.resolve` e convertiti in `C:\Users\...` in modo
// trasparente.
// Il costruttore di `NativeFsAdapter` normalizza `baseDir` a POSIX
// (sostituisce `\` con `/` ed elimina trailing slash) per evitare path misti
// nel caso il main passi un baseDir Windows-style.
function joinPath(...parts: string[]): string {
  return parts
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+|\/+$/g, "")))
    .filter((p) => p.length > 0)
    .join("/");
}

/**
 * Normalizza un path a POSIX-style (separatore `/`) collassando trailing
 * slash. Usata sul `baseDir` ricevuto dal main process per evitare path misti
 * (es. `C:\Users\foo/roms/index.json`) quando il main su Windows passa path
 * NT-style. Vedi F-5 (CQRL TSK-054 iter-1).
 */
function normalizeToPosix(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+$/, "");
}

// ── Utilità blob/binary ───────────────────────────────────────────────────────
async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

function bytesToBlob(bytes: Uint8Array, type = "application/octet-stream"): Blob {
  // Nuova ArrayBuffer per evitare aliasing del buffer del bridge IPC (potrebbe
  // essere riusato/Detach in alcuni runtime Electron); copia esplicita.
  const copy = new Uint8Array(bytes);
  return new Blob([copy], { type });
}

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

function jsonToBytes(value: unknown): Uint8Array {
  return TEXT_ENCODER.encode(JSON.stringify(value));
}

function bytesToJson<T>(bytes: Uint8Array): T {
  return JSON.parse(TEXT_DECODER.decode(bytes)) as T;
}

/** Hash FNV-1a 32-bit — identico a `db.ts` (compatibilità id ROM). */
async function hashBlob(blob: Blob): Promise<string> {
  const buf = await blobToBytes(blob);
  let h = 0x811c9dc5;
  for (let i = 0; i < buf.length; i++) {
    h ^= buf[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Id save state — identico a `db.ts` (compatibilità export/import US-019). */
function saveStateId(romId: string, slot: number, createdAt: number): string {
  return `${romId}:${slot}:${createdAt}:${crypto.randomUUID()}`;
}

// ── Adapter ───────────────────────────────────────────────────────────────────
/**
 * NativeFsAdapter — implementazione `SaveStoragePort` + `ConfigPort` su
 * filesystem nativo via IPC Electron. Mantiene la stessa "shape" semantica
 * dell'IndexedDBAdapter (vedi indexeddb-adapter.ts): id derivati dal contenuto,
 * idempotenza put, segregazione per `romId`, ordinamento su `listSaveStates`.
 *
 * Construzione: `new NativeFsAdapter({ bridge, baseDir })`. `baseDir` è il path
 * **assoluto** della directory radice dell'app (es. `~/.soli-boy/`), risolto
 * dal main process (la scelta del path platform-specific è demandata al main,
 * non a questo file: l'adapter è location-agnostic).
 */
export class NativeFsAdapter
  implements
    StoragePort,
    SaveStatePort,
    SramPort,
    CoverPort,
    RtcStatePort,
    ConfigPort,
    SaveStoragePort
{
  private readonly bridge: NativeFsBridge;
  /**
   * Fallback baseDir convenzionale (TSK-055): usato sse il bridge non espone
   * `getBaseDir` (pre-TSK-077). Normalizzato a POSIX nel costruttore.
   * In runtime "fresh" (bridge >= TSK-077) viene IGNORATO a favore della root
   * assoluta del main risolta via `resolveBaseDir()`. Lo manteniamo per
   * retro-compatibilità (mock di test, bridge esterni embedder).
   */
  private readonly fallbackBaseDir: string;

  /**
   * TSK-077 — Promise memoizzata della base dir effettiva. Risolta LAZY al
   * primo accesso (prima operazione FS); single-flight (concorrent calls
   * condividono la stessa Promise grazie al caching qui sotto). Tenere una
   * Promise (non lo string risolto) è esattamente quello che mantiene la
   * factory `selectAdapter()` sincrona: il costruttore non await niente, e i
   * consumer (`App.tsx`) non vedono async leak.
   */
  private resolvedBaseDirPromise: Promise<string> | undefined;

  /**
   * Dir di collezione già garantite via mkdir: evita mkdir ridondanti.
   *
   * **Limite noto (F-074-3, CQRL TSK-074 iter-1)**: cache per-istanza senza
   * TTL né invalidazione. Se una directory già "ensured" viene rimossa
   * esternamente (es. utente che cancella manualmente `~/.soli-boy/roms/`
   * mentre l'app è aperta, o tooling OS), `ensureDir` ritorna senza ricreare
   * la directory; il `writeFile` successivo fallisce con ENOENT propagato al
   * caller. Scenario tollerabile in MVP single-process (la UI non offre
   * percorsi per rimozioni esterne mentre l'app è aperta; il fallimento è
   * comunque sintomatico e non corrompe lo stato).
   *
   * Mitigation futura possibile: invalidare l'entry da `ensuredDirs` quando
   * un `bridge.writeFile` rigetta con ENOENT e ritentare un singolo passaggio
   * `ensureDir → writeFile`. Non implementato qui per non scoprire un retry
   * silenzioso in un canale (FS) dove fail-loud è preferibile per
   * diagnosticare anomalie del filesystem dell'utente. Rivedere se i log di
   * produzione mostrano ricorrenza dello scenario.
   */
  private readonly ensuredDirs = new Set<string>();

  constructor(opts: { bridge: NativeFsBridge; baseDir: string }) {
    this.bridge = opts.bridge;
    // F-5: normalizziamo a POSIX nel costruttore così tutti i `joinPath`
    // successivi producono path con separatori consistenti, indipendentemente
    // dal formato passato dal main process.
    this.fallbackBaseDir = normalizeToPosix(opts.baseDir);
  }

  /**
   * TSK-077 — Risolve la base dir assoluta autoritativa (single source of
   * truth col `guardPath` del main, cfr. `packages/desktop/electron/main.ts
   * §FS_BASE_DIR`) in modo LAZY e MEMOIZZATO:
   *
   *   - **Lazy**: la prima chiamata effettiva al bridge avviene alla prima
   *     operazione FS, non nel costruttore. Conseguenza: `selectAdapter()` e
   *     `App.tsx` restano SINCRONI (nessun ripple async sui consumer); DoD
   *     TSK-077 §3.
   *   - **Memoizzato**: cachiamo la Promise (non il valore), così chiamate
   *     concorrenti durante la risoluzione condividono lo stesso IPC pending
   *     (single-flight, no race condition). Una volta risolta, ogni chiamata
   *     successiva è solo un `await` su una Promise già fulfilled (zero IPC).
   *   - **Fallback esplicito**: se `bridge.getBaseDir` è assente (bridge
   *     pre-TSK-077 o stub di test) → si usa la `fallbackBaseDir` del
   *     costruttore (valore convenzionale `.soli-boy`). Non silenzioso:
   *     scelta tracciata qui per non introdurre path "errati ma plausibili"
   *     (es. assoluti finti).
   *   - **Resilienza errore IPC**: se `getBaseDir()` rigetta, ripieghiamo
   *     sul fallback per evitare di rompere l'intera persistenza al primo
   *     errore IPC. La memoizzazione resta valida (il rigetto è stato
   *     "consumato" dal catch interno alla Promise risolta).
   *   - **Guardia output bridge (F-077-1-R1)**: anche il ramo di RESOLVE
   *     valida il valore ricevuto (`typeof abs === 'string' && length > 0`).
   *     Se il main risolvesse con `undefined`/`null`/`''` per bug, cadiamo
   *     sul fallback invece di propagare path degeneri ai path helpers.
   */
  private resolveBaseDir(): Promise<string> {
    if (this.resolvedBaseDirPromise) return this.resolvedBaseDirPromise;
    const bridgeGetBaseDir = this.bridge.getBaseDir?.bind(this.bridge);
    const fallback = this.fallbackBaseDir;
    const p: Promise<string> = bridgeGetBaseDir
      ? bridgeGetBaseDir().then(
          // F-077-1-R1 (CQRL TSK-077 iter-1): validiamo il valore risolto dal
          // bridge prima di propagarlo ai path helpers. Un bug nel main
          // process potrebbe risolvere con `undefined`/`null`/`''`: senza
          // questa guardia `normalizeToPosix` produrrebbe path degeneri (es.
          // `undefined/roms/index.json`) che `joinPath` comporrebbe
          // silenziosamente. Tipizzato `unknown` per coprire anche bridge
          // stub di test che eludono il contratto.
          (abs: unknown) =>
            typeof abs === "string" && abs.length > 0 ? normalizeToPosix(abs) : fallback,
          // Errore IPC: ripieghiamo sul valore convenzionale piuttosto che
          // far esplodere ogni operazione FS successiva. La Promise risolta
          // resta cacheata: niente retry-storm su IPC instabili.
          () => fallback,
        )
      : Promise.resolve(fallback);
    this.resolvedBaseDirPromise = p;
    return p;
  }

  // ── Path helpers ───────────────────────────────────────────────────────────
  // TSK-077: i path helpers sono ora `async` perché compongono la base dir
  // risolta dinamicamente dal bridge. Il caching in `resolveBaseDir()` rende
  // l'overhead trascurabile (un `await` su Promise fulfilled, no IPC) dopo la
  // prima risoluzione.
  private async romsManifestPath(): Promise<string> {
    return joinPath(await this.resolveBaseDir(), ROMS_DIR, ROMS_MANIFEST);
  }
  private async romBlobPath(id: string): Promise<string> {
    return joinPath(await this.resolveBaseDir(), ROMS_DIR, `${id}.bin`);
  }
  private async romCoverPath(id: string): Promise<string> {
    return joinPath(await this.resolveBaseDir(), ROMS_DIR, `${id}.cover.bin`);
  }
  private async saveStatesManifestPath(): Promise<string> {
    return joinPath(await this.resolveBaseDir(), SAVE_STATES_DIR, SAVE_STATES_MANIFEST);
  }
  private async saveStateBlobPath(id: string): Promise<string> {
    return joinPath(await this.resolveBaseDir(), SAVE_STATES_DIR, `${id}.bin`);
  }
  private async sramManifestPath(): Promise<string> {
    return joinPath(await this.resolveBaseDir(), SRAM_DIR, SRAM_MANIFEST);
  }
  private async sramBlobPath(romId: string): Promise<string> {
    return joinPath(await this.resolveBaseDir(), SRAM_DIR, `${romId}.sram`);
  }
  // TSK-127 — path RTC stub (file per-romId, pattern analogo a SRAM, ADR-009 §3
  // "NativeFsAdapter (desktop, ADR-007): mappatura su file <romId>.rtc.json").
  // Implementazione completa NativeFs è gap noto (TSK desktop dedicato post-EP-019):
  // qui resta uno stub funzionante che persiste un JSON con la stessa shape di IDB
  // (`RtcStateRecord`) — sufficiente per coprire la cascade-delete da `removeRom`.
  private async rtcStateFilePath(romId: string): Promise<string> {
    return joinPath(await this.resolveBaseDir(), RTC_STATE_DIR, `${romId}.rtc.json`);
  }
  private async rtcStateDirPath(): Promise<string> {
    return joinPath(await this.resolveBaseDir(), RTC_STATE_DIR);
  }
  private async configFilePath(): Promise<string> {
    return joinPath(await this.resolveBaseDir(), CONFIG_FILE);
  }

  // ── IO helpers ────────────────────────────────────────────────────────────
  /**
   * Legge un file e ritorna `undefined` se non esiste (nessun primitive `stat`
   * disponibile: rileviamo l'assenza dal fallimento di `readFile` lato main).
   * Tutti gli altri errori (permessi, IO corrotto) vengono propagati: vogliamo
   * fallire forte per non mascherare bug nello schema su disco.
   */
  private async readFileIfExists(path: string): Promise<Uint8Array | undefined> {
    try {
      return await this.bridge.readFile(path);
    } catch (err) {
      if (isNotFoundError(err)) return undefined;
      throw err;
    }
  }

  private async writeJson<T>(path: string, value: T): Promise<void> {
    await this.bridge.writeFile(path, jsonToBytes(value));
  }

  private async readManifestOrEmpty<T extends { version: 1; entries: unknown }>(
    path: string,
    empty: T,
  ): Promise<T> {
    const bytes = await this.readFileIfExists(path);
    if (!bytes || bytes.length === 0) return empty;
    return bytesToJson<T>(bytes);
  }

  /**
   * Garantisce l'esistenza di una directory (TSK-074). `mkdir(recursive:true)`
   * è idempotente (no-op se la dir esiste già); manteniamo comunque una cache
   * `ensuredDirs` per evitare round-trip IPC ridondanti nel caso d'uso
   * batch-write (es. ingest multiplo).
   */
  private async ensureDir(dirPath: string): Promise<void> {
    if (this.ensuredDirs.has(dirPath)) return;
    await this.bridge.mkdir(dirPath, { recursive: true });
    this.ensuredDirs.add(dirPath);
  }

  // TSK-077: anche i dir helper consumano la base risolta (vedi nota path
  // helpers sopra). Costo: `await` su Promise cacheata dopo la prima
  // risoluzione.
  private async romsDirPath(): Promise<string> {
    return joinPath(await this.resolveBaseDir(), ROMS_DIR);
  }
  private async saveStatesDirPath(): Promise<string> {
    return joinPath(await this.resolveBaseDir(), SAVE_STATES_DIR);
  }
  private async sramDirPath(): Promise<string> {
    return joinPath(await this.resolveBaseDir(), SRAM_DIR);
  }

  /**
   * Tenta `unlink` ignorando l'errore "file non trovato" — i delete sono
   * idempotenti per contratto. Errori non-ENOENT (permessi, IO) si propagano.
   */
  private async tryUnlink(path: string): Promise<void> {
    try {
      await this.bridge.unlink(path);
    } catch (err) {
      if (isNotFoundError(err)) return;
      throw err;
    }
  }

  // ── ROMs (StoragePort) ─────────────────────────────────────────────────────
  /**
   * Persiste una ROM:
   *   1. derivare l'id (hash FNV-1a del fileBlob — stesso dell'IDB);
   *   2. scrivere il fileBlob in `roms/<id>.bin`;
   *   3. aggiornare il manifest (upsert sull'id);
   *
   * Idempotenza: stesso contenuto → stesso id → riscrittura "in place" del
   * file blob (overwrite) e upsert sul manifest. Compatibile con il test
   * IDB "stesso contenuto → stesso id" (db.test.ts §addRom).
   *
   * Race condition nota (single-process MVP): non c'è locking transazionale
   * cross-file come in IndexedDB. Due `addRom` concorrenti sullo stesso id
   * sono sicure (last-write-wins, idempotenti); due `addRom` con id diversi
   * concorrenti possono perdere uno dei due upsert sul manifest (read-modify-
   * write). La cache `ensuredDirs` (sopra) amplifica silenziosamente questa
   * race in scenario multi-istanza e non si auto-invalida se la directory di
   * collezione viene rimossa esternamente (F-074-3 CQRL TSK-074 iter-1).
   * Mitigazione: l'app esegue ingest da UI seriale; rivedere se l'uso
   * concorrente diventa pattern (es. drag&drop batch).
   */
  // known-gap (TSK-094): writeFile → manifest non è atomico (blob orfano in caso di crash).
  // Stessa vulnerabilità risolta su putSaveState; fix da pianificare su TSK separato.
  async addRom(input: RomInput): Promise<string> {
    const id = await hashBlob(input.fileBlob);
    const filePath = `${id}.bin`;
    // 0. garantisci la dir di collezione (idempotente, ~/.soli-boy/roms/).
    await this.ensureDir(await this.romsDirPath());
    // 1. scrivi il blob (sovrascrive se esiste).
    await this.bridge.writeFile(await this.romBlobPath(id), await blobToBytes(input.fileBlob));

    // 2. upsert manifest.
    const manifest = await this.readRomsManifest();
    const existingCoverPath = manifest.entries.find((e) => e.id === id)?.coverPath;
    let coverPath: string | undefined = existingCoverPath;
    if (input.coverBlob) {
      coverPath = `${id}.cover.bin`;
      await this.bridge.writeFile(await this.romCoverPath(id), await blobToBytes(input.coverBlob));
    }
    const entry: RomManifestEntry = {
      id,
      title: input.title,
      platform: input.platform,
      core: input.core,
      addedAt: Date.now(),
      filePath,
      coverPath,
    };
    const updated = upsertById(manifest.entries, entry);
    await this.writeRomsManifest({ ...manifest, entries: updated });
    return id;
  }

  async listRoms(filter: RomFilter = {}): Promise<RomRecord[]> {
    const entries = await this.filteredRomEntries(filter);
    // Materializza i blob: list è già letta come metadati; per parità con IDB
    // ritorniamo i RomRecord completi (con fileBlob). I consumer ROM-only
    // (Library) DEVONO usare `listRomsMeta` (TSK-075) per evitare N round-trip
    // IPC `readFile` inutili sui fileBlob; questo path resta per i consumer che
    // davvero necessitano i blob completi in batch.
    return Promise.all(entries.map((e) => this.materializeRom(e)));
  }

  /**
   * TSK-075 — path lazy "metadata-only". Legge il manifest (1 IPC `readFile`
   * sul JSON `roms/index.json`) e ritorna i metadati delle ROM + l'eventuale
   * `coverBlob`. **NON** legge i `fileBlob` (binari ROM, KB-MB) — i consumer
   * UI (Library) non ne hanno bisogno; per il Player resta `getRom(id)`.
   *
   * Costo IPC effettivo:
   *   - 1 readFile per il manifest JSON.
   *   - 1 readFile per ogni ROM con `coverPath` valorizzato (assente se la
   *     cover non è stata caricata — caso comune al primo avvio).
   *   - 0 readFile sui `fileBlob` (era il problema F-2).
   *
   * Parità semantica con IDB: stesso filtro `RomFilter`, stessa shape
   * `RomMeta` ritornata. Vedi `./types.ts §RomMeta`.
   */
  async listRomsMeta(filter: RomFilter = {}): Promise<RomMeta[]> {
    const entries = await this.filteredRomEntries(filter);
    return Promise.all(entries.map((e) => this.materializeRomMeta(e)));
  }

  /**
   * Estrae le entry del manifest applicando il filtro (piattaforma + query
   * testuale). Fattorizzato per riusarlo fra `listRoms` e `listRomsMeta`
   * (stessa semantica di filtro — invariante parità IDB↔NativeFs).
   */
  private async filteredRomEntries(filter: RomFilter): Promise<RomManifestEntry[]> {
    const manifest = await this.readRomsManifest();
    let entries = manifest.entries;
    if (filter.platform) entries = entries.filter((e) => e.platform === filter.platform);
    const q = filter.query?.trim().toLowerCase();
    if (q) entries = entries.filter((e) => e.title.toLowerCase().includes(q));
    return entries;
  }

  async getRom(id: string): Promise<RomRecord | undefined> {
    const manifest = await this.readRomsManifest();
    const entry = manifest.entries.find((e) => e.id === id);
    if (!entry) return undefined;
    return this.materializeRom(entry);
  }

  /**
   * Rimuove una ROM: strip dal manifest + **unlink reale** dei blob (TSK-074).
   * Idempotente: rimuovere una ROM inesistente non solleva e non altera il
   * manifest (parità con IDB.removeRom). `tryUnlink` tollera ENOENT sui blob
   * (es. file già rimosso fuori banda), così il manifest resta sempre l'oracolo
   * della verità.
   */
  async removeRom(id: string): Promise<void> {
    const manifest = await this.readRomsManifest();
    const entry = manifest.entries.find((e) => e.id === id);
    if (!entry) return; // idempotente
    const remaining = manifest.entries.filter((e) => e.id !== id);
    await this.writeRomsManifest({ ...manifest, entries: remaining });
    // Delete reale: niente più tombstone a 0 byte (TSK-074, F-4 CQRL).
    await this.tryUnlink(await this.romBlobPath(id));
    if (entry.coverPath) {
      await this.tryUnlink(await this.romCoverPath(id));
    }
    // TSK-127 (ADR-009 §3, US-066) — cascade RTC.
    // Idempotente: `tryUnlink` tollera ENOENT, quindi se non c'è mai stato un
    // RTC per questa ROM il delete è no-op. Parità con `db.removeRom` IDB.
    await this.tryUnlink(await this.rtcStateFilePath(id));
  }

  // ── Cover (CoverPort) ──────────────────────────────────────────────────────
  /**
   * Associa/aggiorna la copertina di una ROM esistente. Errore se la ROM non
   * esiste (no record orfani — parità con IDB.setCover).
   */
  // known-gap (TSK-094): writeFile → manifest non è atomico (blob orfano in caso di crash).
  async setCover(romId: string, cover: Blob): Promise<void> {
    const manifest = await this.readRomsManifest();
    const idx = manifest.entries.findIndex((e) => e.id === romId);
    if (idx === -1) throw new Error(`ROM non trovata: ${romId}`);
    await this.ensureDir(await this.romsDirPath());
    const coverPath = `${romId}.cover.bin`;
    await this.bridge.writeFile(await this.romCoverPath(romId), await blobToBytes(cover));
    const updated = [...manifest.entries];
    updated[idx] = { ...updated[idx], coverPath };
    await this.writeRomsManifest({ ...manifest, entries: updated });
  }

  // ── Save states (SaveStatePort) ────────────────────────────────────────────
  /**
   * Persiste un nuovo save state. Idempotenza per id (l'id include
   * `crypto.randomUUID()` → due put ravvicinati sullo stesso slot coesistono,
   * parità con IDB F-031-1-R2).
   */
  async putSaveState(input: SaveStateInput): Promise<string> {
    const createdAt = Date.now();
    const id = saveStateId(input.romId, input.slot, createdAt);
    const snapshotPath = `${id}.bin`;
    await this.ensureDir(await this.saveStatesDirPath());
    const blobPath = await this.saveStateBlobPath(id);
    // TSK-094 (US-050): atomicità write-then-manifest. Se il manifest update
    // fallisce dopo che il blob è già stato scritto, il blob resta orfano (non
    // referenziato da alcun entry, non eliminabile dalla UI). Wrap in try/catch
    // con cleanup best-effort nel ramo di fallimento: si tenta `tryUnlink` sul
    // blob appena scritto, ignorando un eventuale errore dell'unlink (loggato
    // ma NON aggiunto all'errore propagato — non vogliamo mascherare l'errore
    // originale del manifest write). Il fallimento dell'unlink è degradazione
    // accettabile (resta un orfano), mentre fallire silenziosamente sul manifest
    // sarebbe corruzione invisibile dello store.
    await this.bridge.writeFile(blobPath, await blobToBytes(input.snapshotBlob));
    try {
      const manifest = await this.readSaveStatesManifest();
      const entry: SaveStateManifestEntry = {
        id,
        romId: input.romId,
        slot: input.slot,
        core: input.core,
        createdAt,
        snapshotPath,
      };
      await this.writeSaveStatesManifest({
        ...manifest,
        entries: [...manifest.entries, entry],
      });
      return id;
    } catch (err) {
      // Cleanup best-effort: rimuovi il blob orfano. Un fallimento qui è solo
      // loggato (non aggiunto all'errore propagato). NB: usiamo un try/catch
      // interno esplicito invece di affidarci al solo `tryUnlink` perché
      // `tryUnlink` rilancia errori non-ENOENT (permessi/IO) e qui non
      // vogliamo che un fallimento di cleanup oscuri l'errore originale.
      try {
        await this.tryUnlink(blobPath);
      } catch (unlinkErr) {
        // eslint-disable-next-line no-console -- log diagnostico best-effort
        console.warn(
          `[native-fs-adapter] putSaveState: cleanup tryUnlink fallito su ${blobPath} (blob orfano)`,
          unlinkErr,
        );
      }
      throw err;
    }
  }

  async listSaveStates(romId: string): Promise<SaveStateRecord[]> {
    const manifest = await this.readSaveStatesManifest();
    const filtered = manifest.entries.filter((e) => e.romId === romId);
    // Ordina per slot crescente, poi per createdAt (parità con IDB).
    filtered.sort((a, b) => a.slot - b.slot || a.createdAt - b.createdAt);
    return Promise.all(filtered.map((e) => this.materializeSaveState(e)));
  }

  async getSaveState(id: string): Promise<SaveStateRecord | undefined> {
    const manifest = await this.readSaveStatesManifest();
    const entry = manifest.entries.find((e) => e.id === id);
    if (!entry) return undefined;
    return this.materializeSaveState(entry);
  }

  async deleteSaveState(id: string): Promise<void> {
    const manifest = await this.readSaveStatesManifest();
    const entry = manifest.entries.find((e) => e.id === id);
    if (!entry) return; // idempotente
    const remaining = manifest.entries.filter((e) => e.id !== id);
    await this.writeSaveStatesManifest({ ...manifest, entries: remaining });
    // Delete reale (TSK-074): niente più tombstone a 0 byte.
    await this.tryUnlink(await this.saveStateBlobPath(id));
  }

  // ── SRAM (SramPort) ────────────────────────────────────────────────────────
  // known-gap (TSK-094): writeFile → manifest non è atomico (blob orfano in caso di crash).
  async putSram(romId: string, data: Blob): Promise<void> {
    const dataPath = `${romId}.sram`;
    await this.ensureDir(await this.sramDirPath());
    await this.bridge.writeFile(await this.sramBlobPath(romId), await blobToBytes(data));
    const manifest = await this.readSramManifest();
    const entry: SramManifestEntry = { romId, updatedAt: Date.now(), dataPath };
    await this.writeSramManifest({
      ...manifest,
      entries: upsertByRomId(manifest.entries, entry),
    });
  }

  async getSram(romId: string): Promise<SramRecord | undefined> {
    const manifest = await this.readSramManifest();
    const entry = manifest.entries.find((e) => e.romId === romId);
    if (!entry) return undefined;
    const bytes = await this.readFileIfExists(await this.sramBlobPath(romId));
    if (!bytes) return undefined;
    return { romId: entry.romId, updatedAt: entry.updatedAt, data: bytesToBlob(bytes) };
  }

  // ── RTC state (RtcStatePort) ───────────────────────────────────────────────
  // TSK-127 (ADR-009 §3, US-066) — stub NativeFs.
  //
  // Implementazione minimale per chiudere la cascade-delete e la parità di
  // contratto col `IndexedDBAdapter`: ogni stato RTC è un file JSON dedicato
  // `rtc-state/<romId>.rtc.json` (no manifest aggregato — non serve listing,
  // l'accesso è sempre per `romId`, e il volume è O(N_roms) come SRAM).
  //
  // planned: piena implementazione NativeFs in TSK desktop dedicato (post EP-019)
  //   — possibili evoluzioni: lock file per write atomico, migration su bump
  //   `schemaVersion`, riconciliazione orfani via `readdir`. ADR-009 §3 cita
  //   esplicitamente lo stub qui presente come transitorio (oggi sufficiente
  //   per le test su IDB; il path NativeFs ha copertura test demandata al TSK
  //   desktop futuro).

  async putRtcState(romId: string, state: RtcState): Promise<void> {
    await this.ensureDir(await this.rtcStateDirPath());
    const record: RtcStateRecord = {
      romId,
      state,
      updatedAt: new Date().toISOString(),
      // F-127-2 (CQRL TSK-127 iter-1): allineato a `db.ts §putRtcState`, evita drift
      // tra IDB e NativeFs sul bump della schemaVersion futura.
      schemaVersion: RTC_STATE_SCHEMA_VERSION,
    };
    await this.writeJson(await this.rtcStateFilePath(romId), record);
  }

  async getRtcState(romId: string): Promise<RtcState | null> {
    const bytes = await this.readFileIfExists(await this.rtcStateFilePath(romId));
    if (!bytes || bytes.length === 0) return null;
    // TODO: shape-validation in TSK desktop
    const record = bytesToJson<RtcStateRecord>(bytes);
    return record.state ?? null;
  }

  async deleteRtcState(romId: string): Promise<void> {
    // Idempotente: `tryUnlink` tollera ENOENT (parità con IDB.deleteRtcState).
    await this.tryUnlink(await this.rtcStateFilePath(romId));
  }

  // ── Config (ConfigPort) ────────────────────────────────────────────────────
  /**
   * Recupera il valore associato a `key`. `undefined` se assente.
   *
   * Lo store config è qui un singolo JSON (`config.json`) — non frammentato
   * come in IDB (record per chiave) perché il volume atteso è piccolo
   * (preferenze app, BIOS escluso: il BIOS è binario e resta gestito da
   * `bios.ts`, che è specifico IDB — per il desktop una variante dedicata
   * BiosPort è follow-up fuori scope di TSK-054).
   */
  async getConfig<T>(key: string): Promise<T | undefined> {
    const manifest = await this.readConfigManifest();
    if (!(key in manifest.entries)) return undefined;
    return manifest.entries[key] as T | undefined;
  }

  async setConfig<T>(key: string, value: T): Promise<void> {
    // TSK-077: la base dir è risolta lazy dal bridge (single source of truth
    // col main process); precedentemente usavamo `this.baseDir` privato.
    await this.ensureDir(await this.resolveBaseDir());
    const manifest = await this.readConfigManifest();
    const entries = { ...manifest.entries, [key]: value };
    await this.writeConfigManifest({ ...manifest, entries });
  }

  // ── Manifest read/write (privati) ──────────────────────────────────────────
  private async readRomsManifest(): Promise<RomManifest> {
    return this.readManifestOrEmpty<RomManifest>(await this.romsManifestPath(), {
      version: 1,
      entries: [],
    });
  }
  private async writeRomsManifest(m: RomManifest): Promise<void> {
    await this.writeJson(await this.romsManifestPath(), m);
  }
  private async readSaveStatesManifest(): Promise<SaveStateManifest> {
    return this.readManifestOrEmpty<SaveStateManifest>(await this.saveStatesManifestPath(), {
      version: 1,
      entries: [],
    });
  }
  private async writeSaveStatesManifest(m: SaveStateManifest): Promise<void> {
    await this.writeJson(await this.saveStatesManifestPath(), m);
  }
  private async readSramManifest(): Promise<SramManifest> {
    return this.readManifestOrEmpty<SramManifest>(await this.sramManifestPath(), {
      version: 1,
      entries: [],
    });
  }
  private async writeSramManifest(m: SramManifest): Promise<void> {
    await this.writeJson(await this.sramManifestPath(), m);
  }
  private async readConfigManifest(): Promise<ConfigManifest> {
    return this.readManifestOrEmpty<ConfigManifest>(await this.configFilePath(), {
      version: 1,
      entries: {},
    });
  }
  private async writeConfigManifest(m: ConfigManifest): Promise<void> {
    await this.writeJson(await this.configFilePath(), m);
  }

  // ── Materializzazione record → blob ────────────────────────────────────────
  /**
   * TSK-075 — variante "metadata-only" di `materializeRom`. Salta il
   * `readFile` sul fileBlob (il binario della ROM); materializza opzionalmente
   * solo il `coverBlob` quando presente (payload piccolo, necessario alla
   * Library UI per renderizzare la tile).
   */
  private async materializeRomMeta(entry: RomManifestEntry): Promise<RomMeta> {
    let coverBlob: Blob | undefined;
    if (entry.coverPath) {
      const coverBytes = await this.readFileIfExists(await this.romCoverPath(entry.id));
      if (coverBytes && coverBytes.length > 0) coverBlob = bytesToBlob(coverBytes, "image/*");
    }
    return {
      id: entry.id,
      title: entry.title,
      platform: entry.platform,
      core: entry.core,
      addedAt: entry.addedAt,
      coverBlob,
    };
  }

  private async materializeRom(entry: RomManifestEntry): Promise<RomRecord> {
    const romBlobAbsPath = await this.romBlobPath(entry.id);
    const fileBytes = await this.readFileIfExists(romBlobAbsPath);
    if (!fileBytes) {
      // Manifest che referenzia un file mancante: stato inconsistente. Lo
      // segnaliamo invece di mascherare (il caller può recuperare ricaricando
      // la ROM dall'origine). Vedi nota tombstone in `removeRom`.
      throw new Error(`Blob ROM mancante per id=${entry.id}: ${romBlobAbsPath}`);
    }
    const fileBlob = bytesToBlob(fileBytes);
    let coverBlob: Blob | undefined;
    if (entry.coverPath) {
      const coverBytes = await this.readFileIfExists(await this.romCoverPath(entry.id));
      if (coverBytes && coverBytes.length > 0) coverBlob = bytesToBlob(coverBytes, "image/*");
    }
    return {
      id: entry.id,
      title: entry.title,
      platform: entry.platform,
      core: entry.core,
      addedAt: entry.addedAt,
      fileBlob,
      coverBlob,
    };
  }

  private async materializeSaveState(entry: SaveStateManifestEntry): Promise<SaveStateRecord> {
    const bytes = await this.readFileIfExists(await this.saveStateBlobPath(entry.id));
    if (!bytes) {
      throw new Error(`Snapshot save state mancante per id=${entry.id}`);
    }
    return {
      id: entry.id,
      romId: entry.romId,
      slot: entry.slot,
      core: entry.core,
      createdAt: entry.createdAt,
      snapshotBlob: bytesToBlob(bytes),
    };
  }
}

// ── Helpers di manifest ──────────────────────────────────────────────────────
function upsertById<T extends { id: string }>(entries: T[], next: T): T[] {
  const idx = entries.findIndex((e) => e.id === next.id);
  if (idx === -1) return [...entries, next];
  const copy = [...entries];
  copy[idx] = next;
  return copy;
}

function upsertByRomId<T extends { romId: string }>(entries: T[], next: T): T[] {
  const idx = entries.findIndex((e) => e.romId === next.romId);
  if (idx === -1) return [...entries, next];
  const copy = [...entries];
  copy[idx] = next;
  return copy;
}

/**
 * Heuristica per riconoscere "file non trovato" attraverso il bridge IPC.
 * Electron forwarda `Error` con `code: 'ENOENT'` e/o messaggio "no such file or
 * directory" lato Node. Restiamo permissivi (case-insensitive + sia `code` sia
 * `message`) per non legarci a dettagli di runtime.
 *
 * F-3 (CQRL TSK-054 iter-1): type-guard strutturato prima del cast, per non
 * affidarci alla coincidenza che `(numero).code === undefined` non solleva.
 */
function isNotFoundError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: unknown; message?: unknown };
  if (typeof e.code === "string" && e.code === "ENOENT") return true;
  if (typeof e.message === "string" && /enoent|no such file/i.test(e.message)) return true;
  return false;
}

