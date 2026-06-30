// TSK-032 — Pannello "Save state" del Player (US-016, ADR-006 §Decisione p.4).
// Mostra N slot Salva/Carica/Elimina ancorati alla ROM corrente (US-018: solo i
// save state di questo gioco). Consuma il SaveService di dominio (TSK-031) via
// un'interfaccia segregata (SaveServicePort) per testabilità.
//
// Invarianti di scope:
// - L'UI non parla mai direttamente con lo storage o con l'engine: orchestra
//   solo via SaveService (separation of concerns, ADR-006).
// - Capability check onesto: se l'engine non supporta i save state
//   (`capabilities.saveStates === false`), il pannello è disabilitato con nota
//   esplicita ("save state non supportati da questo motore"). Niente claim falsi.
// - Stato runtime: il pannello è attivo solo durante l'esecuzione (`isRunning`)
//   per coerenza con l'AC US-016 ("creare un save state durante l'esecuzione").
//   Caricare richiede comunque un engine "pronto" (idem, l'engine deve avere una
//   ROM caricata): il gate dell'UI è lo stesso (running).
// - Niente design system improvvisato: usa solo classi `sb-*` / `sd-*` definite
//   in `styles/solids-theme.css` (sezione "player" / utilities flex/gap).
// - A11y: la sezione è una region etichettata `aria-label="Save state"`; ogni
//   bottone ha un aria-label esplicito che cita lo slot ("Salva nello slot N",
//   "Carica slot N", "Elimina slot N") perché il label visibile è breve.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EmulatorEngine } from "../../core/core-wrapper";
import type { LoadStateResult } from "../../domain/save-service";
import type { Core } from "../../domain/types";
import type { SaveStateRecord } from "../../storage/types";

/**
 * Interfaccia segregata consumata dal pannello. È un sottoinsieme di
 * `SaveService` (TSK-031): qui evitiamo di importare la classe concreta così
 * il componente resta testabile con fake minimali e non si accoppia ai
 * dettagli SRAM (US-017) che non gli competono.
 */
export interface SaveServicePort {
  saveState(engine: EmulatorEngine, romId: string, slot: number): Promise<string>;
  loadState(
    engine: EmulatorEngine,
    saveStateId: string,
    currentCore: Core,
  ): Promise<LoadStateResult>;
  listSaveStates(romId: string): Promise<SaveStateRecord[]>;
  deleteSaveState(id: string): Promise<void>;
}

export interface SaveStatePanelProps {
  /** Engine corrente (per snapshot/restore via SaveService). */
  engine: EmulatorEngine;
  /** Servizio di dominio per i save state (TSK-031). */
  saveService: SaveServicePort;
  /** ID della ROM in sessione. Se assente, il pannello è disabilitato (no ROM, no save). */
  romId?: string;
  /**
   * Core canonico della ROM in sessione (per il guard cross-engine in load,
   * ADR-006 §Conseguenze). Se assente, il load è bloccato (no claim falsi).
   */
  currentCore?: Core;
  /**
   * True se l'engine sta effettivamente eseguendo la ROM. AC US-016 vincola
   * la creazione di save state al runtime "in esecuzione": il pannello applica
   * lo stesso gate sia su Salva sia su Carica/Elimina (idle non ha senso).
   */
  isRunning: boolean;
  /** Numero di slot esposti dall'UI (default 3, ADR-006 §Decisione p.4 indica "slot"). */
  slots?: number;
}

const DEFAULT_SLOTS = 3;

export function SaveStatePanel({
  engine,
  saveService,
  romId,
  currentCore,
  isRunning,
  slots = DEFAULT_SLOTS,
}: SaveStatePanelProps) {
  const slotList = useMemo(
    () => Array.from({ length: Math.max(0, slots) }, (_, i) => i),
    [slots],
  );

  // Capability check: il pannello esiste comunque (UX prevedibile), ma è
  // disabilitato con nota onesta se l'engine non supporta i save state.
  const supported = engine.capabilities.saveStates === true;

  // Disabilitazione complessiva del pannello (US-016 AC1 "durante l'esecuzione",
  // US-018 AC1 "associati al gioco" → serve romId). Se non supportato, sempre off.
  const disabledReason: string | null = !supported
    ? "Save state non supportati da questo motore."
    : !romId
      ? "Nessuna ROM selezionata."
      : !isRunning
        ? "Avvia il gioco per usare i save state."
        : null;
  const disabled = disabledReason !== null;

  // Lista corrente dei save state della ROM (US-018: solo quelli di romId).
  // SaveService.listSaveStates già filtra per romId (vedi TSK-031); manteniamo
  // un filtro difensivo qui per robustezza UI (no claim su entry altrui).
  const [list, setList] = useState<SaveStateRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "info" | "error"; text: string } | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<SaveStateRecord | null>(null);

  const refresh = useCallback(async () => {
    if (!romId) {
      setList([]);
      return;
    }
    try {
      const items = await saveService.listSaveStates(romId);
      // US-018 AC2: aprendo un gioco si vedono SOLO i suoi salvataggi.
      setList(items.filter((r) => r.romId === romId));
    } catch (e) {
      setMessage({
        kind: "error",
        text: `Impossibile leggere i save state: ${(e as Error).message}`,
      });
    }
  }, [romId, saveService]);

  // Carica la lista al mount e ad ogni cambio di romId (US-018 AC2). Quando
  // romId è undefined, svuotiamo (nessun "fantasma" dal gioco precedente).
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Indicizza i record per slot per il rendering: lo slot UI mostra il PIÙ
  // RECENTE save di quello slot (se esistono multipli con stesso slot,
  // TSK-031 li tiene tutti come entry distinte: usiamo `createdAt` desc).
  const latestBySlot = useMemo(() => {
    const map = new Map<number, SaveStateRecord>();
    for (const rec of list) {
      const prev = map.get(rec.slot);
      if (!prev || rec.createdAt > prev.createdAt) map.set(rec.slot, rec);
    }
    return map;
  }, [list]);

  async function handleSave(slot: number) {
    if (disabled || !romId) return;
    setBusy(true);
    setMessage(null);
    try {
      await saveService.saveState(engine, romId, slot);
      setMessage({ kind: "info", text: `Salvato nello slot ${slot + 1}.` });
      await refresh();
    } catch (e) {
      setMessage({
        kind: "error",
        text: `Salvataggio fallito: ${(e as Error).message}`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleLoad(rec: SaveStateRecord) {
    if (disabled || !currentCore) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await saveService.loadState(engine, rec.id, currentCore);
      if (res.ok) {
        setMessage({ kind: "info", text: `Caricato slot ${rec.slot + 1}.` });
      } else if (res.reason === "engine-mismatch") {
        // ADR-006 §Conseguenze: cross-engine rifiutato. Messaggio chiaro, no crash.
        setMessage({
          kind: "error",
          text:
            res.detail ??
            "Save state incompatibile con il motore corrente (engine mismatch).",
        });
      } else if (res.reason === "not-found") {
        setMessage({
          kind: "error",
          text: "Save state non trovato (forse è stato eliminato).",
        });
        await refresh();
      }
    } catch (e) {
      setMessage({
        kind: "error",
        text: `Caricamento fallito: ${(e as Error).message}`,
      });
    } finally {
      setBusy(false);
    }
  }

  function requestDelete(rec: SaveStateRecord) {
    if (disabled || !rec) return;
    setPendingDelete(rec);
  }

  function cancelDelete() {
    setPendingDelete(null);
  }

  async function confirmDelete() {
    if (!pendingDelete || disabled) return;
    const rec = pendingDelete;
    setPendingDelete(null);
    setBusy(true);
    setMessage(null);
    try {
      await saveService.deleteSaveState(rec.id);
      setMessage({ kind: "info", text: `Slot ${rec.slot + 1} eliminato.` });
      await refresh();
    } catch (e) {
      setMessage({
        kind: "error",
        text: `Eliminazione fallita: ${(e as Error).message}`,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="sd-card sb-sec"
      role="region"
      aria-label="Save state"
      data-supported={String(supported)}
      data-disabled={String(disabled)}
    >
      <h3 className="sb-lbl">Save state</h3>
      {disabledReason && (
        <p className="sb-note" data-testid="sb-savestate-disabled-note">
          {disabledReason}
        </p>
      )}
      <ul className="sb-keymap" aria-label="Slot save state">
        {slotList.map((slot) => {
          const rec = latestBySlot.get(slot);
          const slotLabel = `Slot ${slot + 1}`;
          const occupied = rec !== undefined;
          return (
            <li key={slot} className="sd-flex sd-items-center sd-gap-sm">
              <span className="sb-key" aria-hidden="true">
                {slotLabel}
              </span>
              <button
                type="button"
                className="sb-btn"
                onClick={() => handleSave(slot)}
                disabled={disabled || busy}
                aria-label={`Salva nello slot ${slot + 1}`}
                data-testid={`sb-savestate-save-${slot}`}
              >
                Salva
              </button>
              <button
                type="button"
                className="sb-btn sb-btn-primary"
                onClick={() => (rec ? handleLoad(rec) : undefined)}
                disabled={disabled || busy || !occupied || !currentCore}
                aria-label={`Carica slot ${slot + 1}`}
                data-testid={`sb-savestate-load-${slot}`}
              >
                Carica
              </button>
              <button
                type="button"
                className="sb-btn sb-danger"
                onClick={() => (rec ? requestDelete(rec) : undefined)}
                disabled={disabled || busy || !occupied}
                aria-label={`Elimina slot ${slot + 1}`}
                data-testid={`sb-savestate-delete-${slot}`}
              >
                Elimina
              </button>
              <span className="sb-mt" data-testid={`sb-savestate-meta-${slot}`}>
                {occupied
                  ? new Date(rec!.createdAt).toLocaleString()
                  : "vuoto"}
              </span>
            </li>
          );
        })}
      </ul>
      {message && (
        <p
          className="sb-note"
          role={message.kind === "error" ? "alert" : "status"}
          data-testid="sb-savestate-message"
        >
          {message.text}
        </p>
      )}
      {pendingDelete && (
        <DeleteSaveStateDialog
          slotLabel={`Slot ${pendingDelete.slot + 1}`}
          createdAtLabel={new Date(pendingDelete.createdAt).toLocaleString()}
          onConfirm={() => void confirmDelete()}
          onCancel={cancelDelete}
        />
      )}
    </section>
  );
}

interface DeleteSaveStateDialogProps {
  slotLabel: string;
  createdAtLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** TSK-111 — Dialog di conferma eliminazione save state. */
function DeleteSaveStateDialog({
  slotLabel,
  createdAtLabel,
  onConfirm,
  onCancel,
}: DeleteSaveStateDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  function onDialogKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const focusables = [cancelRef.current, confirmRef.current].filter(
      (el): el is HTMLButtonElement => el !== null,
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="sb-dialog-backdrop"
      onClick={onCancel}
      data-testid="delete-savestate-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-savestate-title"
        aria-describedby="delete-savestate-desc"
        className="sb-dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onDialogKeyDown}
        data-testid="delete-savestate-dialog"
        style={{
          background: "var(--sd-color-bg-elevated, #1a1430)",
          color: "var(--sd-color-text-primary, #f0e9ff)",
          borderRadius: "var(--sd-radius-md, 8px)",
          padding: "1.25rem",
          maxWidth: "24rem",
          width: "calc(100% - 2rem)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        }}
      >
        <h2 id="delete-savestate-title" className="sb-lbl" style={{ marginTop: 0 }}>
          Eliminare save state?
        </h2>
        <p id="delete-savestate-desc" className="sb-note" style={{ marginBottom: "1.25rem" }}>
          {slotLabel} — salvato il {createdAtLabel}
        </p>
        <div className="sd-flex sd-gap-sm" style={{ justifyContent: "flex-end" }}>
          <button ref={cancelRef} type="button" className="sb-btn" onClick={onCancel}>
            Annulla
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="sb-btn sb-danger"
            onClick={onConfirm}
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  );
}
