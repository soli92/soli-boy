// TSK-098 (EP-014 / US-052) — Estrazione hook `useSaveData` da Settings.tsx.
//
// Incapsula la logica I/O della sezione "Dati" (US-019) prima inline in
// `Settings` (Settings.tsx:230-385 nella versione pre-TSK-098): listing dei
// save state, export con `triggerDownload`, import da File con feedback
// user-facing. Pre-estrazione il componente era ~500 LOC con stato locale
// (saveStates, dataBusy, dataMessage), callback memoizzate e side-effect
// browser (URL.createObjectURL → anchor.click) annidati dentro un blocco di
// rendering già denso.
//
// Refactor strutturale (P2-05 della review SP-12, conf. 0.85): l'hook accetta
// `saveService` (interfaccia segregata) + `currentRomId` come parametri e non
// importa nulla dal componente chiamante. Il chiamante mantiene la
// responsabilità della selezione UI (`selectedSaveStateId`), del wiring del
// `<input type=file>` e dell'invocazione: `handleExport(saveStateId)` ne
// riceve l'id per export, mentre `handleImportFile(file)` prende un `File`
// dal change event come prima.
//
// Semantica preservata 1:1:
// - listSaveStates filtrato per `romId === currentRomId` (US-018 AC2: niente
//   fantasmi cross-rom);
// - messaggi user-facing identici, con `kind: "info" | "error"` mappato dai
//   `reason` di `exportSaveState` / `importSave` (US-019 AC3);
// - reset busy/messaggio gestito in `finally`;
// - `triggerDownload` con guard `URL.createObjectURL`, revoke immediato,
//   anchor non aggiunta al DOM (no side-effect visivo).
//
// Ritorna `{ list, busy, message, refresh, handleExport, handleImportFile }`
// (firma AC2 del TSK).

import { useCallback, useEffect, useState } from "react";
import type {
  ExportSaveStateResult,
  ImportSaveResult,
} from "./save-service";
import type { SaveStateRecord } from "../storage/types";

/**
 * Interfaccia segregata consumata dall'hook. Sottoinsieme di `SaveService`
 * (TSK-031/033): coerente con il `SaveDataPort` di `Settings.tsx`, qui
 * duplicato per non creare dipendenze cicliche tra dominio e componente.
 */
export interface SaveDataPort {
  listSaveStates(romId: string): Promise<SaveStateRecord[]>;
  exportSaveState(saveStateId: string): Promise<ExportSaveStateResult>;
  importSave(input: Blob | ArrayBuffer | string): Promise<ImportSaveResult>;
}

/** Forma del feedback user-facing della sezione "Dati". */
export type SaveDataMessage =
  | { kind: "info"; text: string }
  | { kind: "error"; text: string };

export interface UseSaveDataResult {
  /** Save state correnti per `currentRomId`, filtrati per `romId` esatto. */
  list: ReadonlyArray<SaveStateRecord>;
  /** True durante una operazione export/import in volo. */
  busy: boolean;
  /** Feedback corrente (success/error), oppure `null` se nessun feedback. */
  message: SaveDataMessage | null;
  /** Ricarica la lista (refetch). */
  refresh: () => Promise<void>;
  /**
   * Esporta lo save state con id passato. Il download è triggerato qui dentro
   * (browser anchor click). No-op se `saveService` è assente o `saveStateId` è vuoto.
   */
  handleExport: (saveStateId: string) => Promise<void>;
  /**
   * Importa un file di salvataggio. Aggiorna `list` se il file riguarda
   * `currentRomId`. Errori mappati in messaggi user-facing (US-019 AC3).
   */
  handleImportFile: (file: File) => Promise<void>;
}

/** Triggera il download nel browser. Side-effect isolato per testabilità. */
function triggerDownload(blob: Blob, filename: string): void {
  // Guard difensivo per ambienti privi di URL.createObjectURL (jsdom legacy).
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    throw new Error("URL.createObjectURL non disponibile in questo ambiente.");
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  // L'anchor non viene aggiunto al DOM (no side-effect visivo); .click()
  // lavora ugualmente in jsdom/Chromium.
  a.click();
  // revoke immediato: il browser ha già avviato il download al click,
  // tenere l'URL allocato non serve (no leak).
  if (typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
}

/**
 * Hook: incapsula listing/export/import dei salvataggi per la ROM corrente.
 *
 * - Idrata `list` ad ogni cambio di `saveService` o `currentRomId`.
 * - Esporta deserializzando via `saveService.exportSaveState`, poi `triggerDownload`.
 * - Importa via `saveService.importSave`, con refresh se l'import riguarda la
 *   ROM corrente.
 *
 * Il chiamante mantiene il selettore UI (`selectedSaveStateId`) e il
 * `<input type=file>`; questo hook è puro rispetto alla DOM (escluso il
 * download anchor, che è semantica del concetto "esporta").
 */
export function useSaveData(
  saveService: SaveDataPort | undefined,
  currentRomId: string,
): UseSaveDataResult {
  const [list, setList] = useState<ReadonlyArray<SaveStateRecord>>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<SaveDataMessage | null>(null);

  // Carica i save state della ROM corrente. Si invalida ad ogni cambio di
  // `currentRomId` o di `saveService` (es. test con fake diversi).
  const refresh = useCallback(async () => {
    if (!saveService || !currentRomId) {
      setList([]);
      return;
    }
    try {
      const items = await saveService.listSaveStates(currentRomId);
      // Difesa: filtro per romId (US-018 AC2 — niente fantasmi cross-rom).
      const filtered = items.filter((r) => r.romId === currentRomId);
      setList(filtered);
    } catch (e) {
      setList([]);
      setMessage({
        kind: "error",
        text: `Impossibile leggere i salvataggi: ${(e as Error).message}`,
      });
    }
  }, [saveService, currentRomId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleExport = useCallback(
    async (saveStateId: string) => {
      if (!saveService || !saveStateId) return;
      setBusy(true);
      setMessage(null);
      try {
        const res = await saveService.exportSaveState(saveStateId);
        if (!res.ok) {
          // Esito esplicito (entry/ROM non più presenti tra refresh e click).
          const text =
            res.reason === "not-found"
              ? "Il salvataggio selezionato non è più presente."
              : "La ROM associata al salvataggio non è più presente.";
          setMessage({ kind: "error", text });
          return;
        }
        triggerDownload(res.blob, res.filename);
        setMessage({
          kind: "info",
          text: `Esportato "${res.filename}".`,
        });
      } catch (e) {
        setMessage({
          kind: "error",
          text: `Esportazione fallita: ${(e as Error).message}`,
        });
      } finally {
        setBusy(false);
      }
    },
    [saveService],
  );

  const handleImportFile = useCallback(
    async (file: File) => {
      if (!saveService) return;
      setBusy(true);
      setMessage(null);
      try {
        const res = await saveService.importSave(file);
        if (res.ok) {
          setMessage({
            kind: "info",
            text: `Salvataggio importato (${res.kind === "saveState" ? "save state" : "SRAM"}).`,
          });
          // Se l'import riguarda la ROM corrente, aggiorna l'elenco.
          if (res.romId === currentRomId) {
            await refresh();
          }
        } else {
          // US-019 AC3: avviso comprensibile per file non valido o non corrispondente.
          // Mappa reason → testo user-facing (no leakage di campi tecnici).
          const text =
            res.reason === "invalid-file"
              ? "File non valido o danneggiato."
              : res.reason === "format-mismatch"
                ? "Il file non è un salvataggio Soli-boy."
                : res.reason === "unsupported-version"
                  ? "Versione del file non supportata da questa versione dell'app."
                  : "La ROM associata al salvataggio non è presente nella libreria.";
          setMessage({ kind: "error", text });
        }
      } catch (e) {
        // Difensivo: importSave non dovrebbe lanciare, ma l'I/O del File può.
        setMessage({
          kind: "error",
          text: `Importazione fallita: ${(e as Error).message}`,
        });
      } finally {
        setBusy(false);
      }
    },
    [saveService, currentRomId, refresh],
  );

  return {
    list,
    busy,
    message,
    refresh,
    handleExport,
    handleImportFile,
  };
}
