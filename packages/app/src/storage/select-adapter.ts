// TSK-055 — Selezione runtime dello StorageAdapter (ADR-002 §Adapter).
//
// Punto unico di scelta: web/mobile → `IndexedDBAdapter` (default storico),
// desktop Electron → `NativeFsAdapter` iniettato col bridge IPC esposto da
// TSK-053 (`window.soliboyDesktop`).
//
// ── Detection (correzione vs testo TSK) ───────────────────────────────────────
// Il TSK-055 cita `window.electronAPI` come sniff; il bridge REALE esposto da
// `packages/desktop/electron/preload.ts` (TSK-053) è invece
// `window.soliboyDesktop`. La detection usa quindi `window.soliboyDesktop`
// (cfr. preload.ts §`contextBridge.exposeInMainWorld("soliboyDesktop", api)` +
// commento di rotta in native-fs-adapter.ts §"Mapping IPC reale").
//
// ── Disaccoppiamento renderer ↔ desktop ───────────────────────────────────────
// Il package `@soli-boy/app` NON deve dipendere da `packages/desktop` (vedi
// commento `NativeFsBridge` in native-fs-adapter.ts). Per questo motivo:
//   - la "shape" del bridge è descritta qui in locale (`DesktopBridgeWindow`),
//     strutturalmente compatibile con `SoliboyDesktopApi` di preload.ts;
//   - il narrowing del tipo `window.soliboyDesktop` è privato del modulo —
//     non si arricchisce `globalThis.Window` con un'augmentazione globale, per
//     non far trapelare il contratto desktop nei consumer non-storage.
//
// ── baseDir ────────────────────────────────────────────────────────────────
// TSK-077: il bridge ora espone `getBaseDir()` (preload.ts) e
// `NativeFsAdapter` lo consuma LAZY+MEMOIZZATO alla prima operazione FS,
// risolvendo la root assoluta autoritativa del main (`FS_BASE_DIR`, single
// source of truth col `guardPath`). Conseguenza per la factory: resta
// SINCRONA — il `baseDir` passato qui sotto è ora puramente un FALLBACK
// usato se il bridge non espone `getBaseDir` (mock di test, bridge esterni
// pre-TSK-077). In runtime desktop "fresh" il valore convenzionale viene
// ignorato a favore della root assoluta del main.
//
// Pre-TSK-077 (storico): il bridge non esponeva l'absolute base directory:
// il main process la fissava a `path.resolve(os.homedir(), ".soli-boy")` e
// la factory accettava un override opzionale `baseDir`; in assenza adottava
// la convenzione `.soli-boy` relativa (path errato ma silenzioso lato
// renderer). Questa nota è mantenuta per archeologia.

import { indexedDbStorage, indexedDbConfig } from "./indexeddb-adapter";
import { NativeFsAdapter, type NativeFsBridge } from "./native-fs-adapter";
import type { ConfigPort, SaveStoragePort } from "./port";

/**
 * Tupla iniettabile nei servizi di dominio.
 *
 * - `storage`: porta completa `SaveStoragePort` (ROM + saveState + SRAM + cover,
 *   ADR-006 §Decisione p.2) — consumata da `LibraryService`, `GameSession`,
 *   `SaveService` e `FileLoader`.
 * - `config`: porta `ConfigPort` (TSK-036 F-036-01) — consumata da
 *   `useVideoSettings`, `useTheme`, `usePrivacyAck` via le rispettive
 *   port-factory (`makeVideoSettingsPort`, `makeThemePort`, `makePrivacyAckPort`).
 *
 * Entrambe le porte sono implementate dallo stesso adapter sottostante (sia
 * `IndexedDBAdapter` che `NativeFsAdapter` implementano `SaveStoragePort` +
 * `ConfigPort`): il dominio resta agnostico al backend di persistenza.
 */
export interface StorageBundle {
  readonly storage: SaveStoragePort;
  readonly config: ConfigPort;
}

/**
 * Sottoinsieme di `window` di cui ci interessa: presenza del bridge desktop.
 * Strutturalmente compatibile con `SoliboyDesktopApi` (preload.ts) ma definito
 * qui in locale per non dipendere dal package desktop.
 */
interface DesktopBridgeWindow {
  // Vincoliamo SOLO il sottoinsieme che ci serve (`NativeFsBridge`): il vero
  // `SoliboyDesktopApi` (preload.ts) espone anche `showOpenDialog`,
  // `showSaveDialog`, `onUpdateEvent` ma non sono consumati dalla factory di
  // selezione storage. L'oggetto reale resta strutturalmente compatibile.
  soliboyDesktop?: NativeFsBridge;
}

/**
 * Rileva se siamo eseguiti nel renderer Electron di soli-boy: condizione unica
 * è la presenza del bridge IPC esposto via `contextBridge` come
 * `window.soliboyDesktop`.
 *
 * Implementazione difensiva:
 *   - tollera assenza di `window` (es. test in env "node", SSR, worker);
 *   - tollera che `window.soliboyDesktop` sia `null`/`undefined` (web/mobile);
 *   - non valida la "shape" oltre la presenza: i metodi sono già tipizzati
 *     `NativeFsBridge` e l'adapter li consuma assumendo il contratto di TSK-053.
 */
export function isDesktopRuntime(
  win: DesktopBridgeWindow | undefined = typeof window === "undefined"
    ? undefined
    : (window as unknown as DesktopBridgeWindow),
): boolean {
  return !!win && typeof win.soliboyDesktop === "object" && win.soliboyDesktop !== null;
}

/** Convenzione `baseDir` quando l'override non è fornito (vedi nota in testa). */
const DEFAULT_DESKTOP_BASE_DIR = ".soli-boy";

/**
 * Opzioni della factory. `windowRef` esiste SOLO per facilitare i test
 * (iniezione di un `window` mockato): in runtime reale il default punta a
 * `globalThis.window`. `baseDir` permette al caller di sovrascrivere la
 * convenzione (utile quando un'estensione futura del bridge lo esporrà
 * dinamicamente).
 */
export interface SelectAdapterOptions {
  windowRef?: DesktopBridgeWindow;
  baseDir?: string;
}

/**
 * Restituisce il bundle storage da iniettare nei servizi di dominio.
 *
 *  - **Desktop (Electron)**: costruisce un'unica istanza di `NativeFsAdapter`
 *    iniettando il bridge `window.soliboyDesktop` (TSK-053) e usa LA STESSA
 *    istanza sia come `storage` sia come `config` (l'adapter implementa
 *    entrambe le porte — vedi native-fs-adapter.ts §"NativeFsAdapter").
 *  - **Web/Mobile**: riusa i singleton storici (`indexedDbStorage`,
 *    `indexedDbConfig`), così il comportamento attuale resta invariato (DoD
 *    TSK-055 p.1: "L'app web usa IndexedDBAdapter invariato.").
 *
 * I tipi di ritorno (`SaveStoragePort` + `ConfigPort`) sono identici sui due
 * rami: il dominio consuma le porte, non l'adapter concreto (ADR-002).
 *
 * [^src: design_&_architecture/decisions/ADR-002.md §Adapter]
 * [^src: packages/app/src/storage/native-fs-adapter.ts §NativeFsAdapter]
 * [^src: packages/desktop/electron/preload.ts §contextBridge]
 */
export function selectAdapter(opts: SelectAdapterOptions = {}): StorageBundle {
  const winRef =
    opts.windowRef ??
    (typeof window === "undefined"
      ? undefined
      : (window as unknown as DesktopBridgeWindow));

  if (isDesktopRuntime(winRef)) {
    // F-077-2-I1 (CQRL TSK-077 iter-1): TS-IDIOM-002 esige commento inline su
    // ogni `!`. `isDesktopRuntime(winRef)` ha già escluso `winRef === undefined`
    // E garantito che `winRef.soliboyDesktop` sia un oggetto non-null (vedi
    // implementazione sopra). Il narrow è quindi sicuro in questo ramo.
    const bridge = winRef!.soliboyDesktop as NativeFsBridge; // safe: isDesktopRuntime() ha già verificato non-null
    const baseDir = opts.baseDir ?? DEFAULT_DESKTOP_BASE_DIR;
    const adapter = new NativeFsAdapter({ bridge, baseDir });
    // Stessa istanza per storage+config: NativeFsAdapter implementa
    // SaveStoragePort & ConfigPort (cfr. class signature in native-fs-adapter.ts).
    return { storage: adapter, config: adapter };
  }

  // Default web/mobile: i singleton storici. Nessuna nuova allocazione.
  return { storage: indexedDbStorage, config: indexedDbConfig };
}
