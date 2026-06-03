// TSK-054 — barrel export del modulo storage.
//
// Esporta i contratti di porta + gli adapter disponibili. La **selezione runtime**
// (web/IDB vs desktop/NativeFs) NON avviene qui: è scope di TSK-055, che
// introdurrà una factory in grado di rilevare il bridge `window.soliboyDesktop`
// e istanziare il NativeFsAdapter, ricadendo sull'IndexedDBAdapter in assenza.
// Per ora il barrel limita la sua responsabilità all'esportazione dei simboli.

export type {
  ConfigPort,
  CoverPort,
  SaveStatePort,
  SaveStoragePort,
  SramPort,
  StoragePort,
  ThemePort,
} from "./port";

export type {
  ConfigRecord,
  RomFilter,
  RomInput,
  RomMeta,
  RomRecord,
  SaveStateInput,
  SaveStateRecord,
  SramRecord,
} from "./types";

// Adapter IndexedDB (web/mobile, TSK-002 / TSK-031 / TSK-036 / TSK-039).
export { indexedDbConfig, indexedDbStorage } from "./indexeddb-adapter";

// Adapter filesystem nativo (desktop, TSK-054). La selezione runtime è in TSK-055.
export { NativeFsAdapter } from "./native-fs-adapter";
export type { NativeFsBridge } from "./native-fs-adapter";
