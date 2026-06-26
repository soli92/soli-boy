// TSK-017 — Settings: rimappatura comandi + profili (US-013).
// TSK-036 — Settings: scala + aspect ratio (US-021). Persistenza opzionale via
// `VideoSettingsPort` (cfr. components/Player/useVideoSettings.ts); stesso pattern
// del profilo comandi (callback `onSaveProfile`): qui il consumatore può sia
// gestire lo stato esternamente (modalità controllata) sia delegare la
// persistenza alla porta.
// TSK-037 — Settings: filtro base (nearest/smoothing/scanline, US-022). Stesso
// oggetto `VideoSettings`, quindi stessa porta e stesso wiring App.tsx già
// esistente: per la persistenza non serve nulla in più.
// TSK-033 — Settings: sezione "Dati" (US-019). Export/import salvataggi come
// file portabile, versionato. Il componente è UI-only: la (de)serializzazione
// è di competenza del SaveService di dominio (ADR-006 §Decisione p.3), iniettato
// via prop (interface segregata `SaveDataPort` per testabilità).
// UI della sezione Controlli su classi solids. La persistenza del profilo è delegata
// via callback (onSaveProfile) → store config a livello applicativo.

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameButton } from "../../core/core-wrapper";
import type { KeyProfile } from "../../domain/input-mapping";
import type {
  ExportSaveStateResult,
  ImportSaveResult,
} from "../../domain/save-service";
import type { SaveStateRecord } from "../../storage/types";
// TSK-098 (EP-014 / US-052) — Hook estratto per la sezione "Dati" (US-019):
// listing/export/import salvataggi. La selezione UI (`selectedSaveStateId`),
// il <input type=file> e l'invocazione export restano qui per chiarezza
// (concerni di rendering); l'I/O e i messaggi user-facing sono dentro
// `useSaveData`. Stessa interfaccia `SaveDataPort` (vedi sotto) consumata.
import { useSaveData } from "../../domain/useSaveData";
import {
  ASPECT_RATIOS,
  SCALE_FACTORS,
  VIDEO_FILTERS,
  parseVideoFilter,
  useVideoSettings,
  type AspectRatio,
  type ScaleFactor,
  type VideoFilter,
  type VideoSettings,
  type VideoSettingsPort,
} from "../Player/useVideoSettings";
// TSK-044 (US-036) — ThemeSelector ospitato nella nuova sezione "Aspetto".
// Le prop relative al tema sono OPZIONALI (vedi `SettingsProps`): se assenti,
// la sezione non viene renderizzata — preserva i test legacy che istanziano
// `<Settings>` senza wiring tema.
import { ThemeSelector } from "../ThemeSelector/ThemeSelector";
// TSK-069 (US-033) — Sezione "Privacy" SEMPRE disponibile in Settings:
// nessuna prop richiesta, il componente è UI puro (testo statico). La
// presenza è incondizionata per soddisfare il requisito del TSK-069
// §Technical Specs ("sempre disponibile in Settings → Privacy").
import { PrivacyNotice } from "../PrivacyNotice/PrivacyNotice";
// TSK-070 (US-034) — Sezione "Legale" SEMPRE disponibile in Settings:
// avviso esplicito no-ROM protette per conformità Play Store / App Store
// (US-034 §Business Rules + §Acceptance Criteria). UI puro, statico. La
// presenza è incondizionata per soddisfare il TSK-070 §DoD
// ("Avviso legale no-ROM protette visibile in Settings → Legale").
import { StoreComplianceNotice } from "../StoreComplianceNotice/StoreComplianceNotice";

const BUTTONS: GameButton[] = ["up", "down", "left", "right", "a", "b", "start", "select"];

/**
 * TSK-033 — Interfaccia segregata consumata dalla sezione "Dati".
 * È un sottoinsieme di `SaveService` (TSK-031/TSK-033): qui evitiamo di
 * importare la classe concreta così il componente è testabile con fake
 * minimali e non si accoppia ai dettagli di save state / SRAM runtime
 * (US-016/017) che non gli competono.
 */
export interface SaveDataPort {
  listSaveStates(romId: string): Promise<SaveStateRecord[]>;
  exportSaveState(saveStateId: string): Promise<ExportSaveStateResult>;
  importSave(input: Blob | ArrayBuffer | string): Promise<ImportSaveResult>;
}

/**
 * Riassunto ROM richiesto dalla UI della sezione "Dati" per mostrare il
 * titolo umano accanto agli id (i save state hanno solo `romId`). Subset
 * minimale per non legare il componente al `RomRecord` completo (interface
 * segregation: niente Blob nella firma del consumer).
 */
export interface RomSummary {
  id: string;
  title: string;
}

export interface SettingsProps {
  profile: KeyProfile;
  /** Rimappa un tasto su un pulsante (US-013). */
  onRemap: (key: string, button: GameButton) => void;
  /** Persiste il profilo corrente (es. store config). */
  onSaveProfile?: () => void;
  /**
   * TSK-036 — preferenze video correnti (US-021). Se passate, il componente è
   * controllato dall'esterno (parent owns state). Altrimenti la sezione si
   * auto-gestisce e opzionalmente persiste tramite `videoConfigPort`.
   */
  videoSettings?: VideoSettings;
  /** Callback invocata ad ogni cambio scala/aspect (modalità controllata). */
  onVideoSettingsChange?: (next: VideoSettings) => void;
  /** Porta di persistenza opzionale (US-021), usata se il componente è auto-gestito. */
  videoConfigPort?: VideoSettingsPort;
  /**
   * TSK-033 — servizio salvataggi (US-019) per la sezione "Dati". Se assente,
   * la sezione viene comunque renderizzata in stato disabilitato con nota
   * onesta ("Carica una ROM per esportare i salvataggi"): nessun branch che
   * nasconde feature al volo (UX prevedibile).
   */
  saveService?: SaveDataPort;
  /**
   * TSK-033 — ROM corrente (id + title) il cui salvataggio l'utente può
   * esportare. Sceglierla dalla selezione attiva (Player) evita di duplicare
   * la lista ROM in Settings (la Library/tile la mostra già) e mantiene la
   * sezione "Dati" coerente con il contesto di gioco corrente.
   * Se assente, la sezione export è disabilitata con nota onesta.
   * L'import non richiede selezione: il file porta sempre il proprio `romId`
   * (riassociazione automatica via SaveService.importSave).
   */
  currentRom?: RomSummary;
  /**
   * TSK-044 (US-036) — tema UI corrente. Se passato insieme a `onThemeChange`,
   * la sezione "Aspetto" mostra il `ThemeSelector` cablato (modalità
   * controllata: lo stato vive a livello App tramite `useTheme`).
   * Prop OPZIONALI: i test legacy che istanziano `<Settings>` senza wiring
   * tema (es. Settings.test.tsx, Settings.videoSettings.test.tsx) continuano
   * a funzionare invariati — la sezione "Aspetto" semplicemente non viene
   * renderizzata se manca il binding.
   */
  theme?: string;
  /** Callback invocata al cambio tema (US-036). */
  onThemeChange?: (theme: string) => void;
  /**
   * TSK-066 (US-032) — feedback aptico abilitato. Se passato insieme a
   * `onHapticsChange`, la sezione "Mobile" mostra il toggle haptics.
   * Prop OPZIONALI per backward compat: i test legacy senza wiring haptics
   * non renderizzano la sezione.
   */
  hapticsEnabled?: boolean;
  /** Callback invocata al cambio del toggle feedback aptico (US-032). */
  onHapticsChange?: (enabled: boolean) => void;
  /**
   * TSK-102 (US-053) — preferenza "Avvio automatico dalla libreria" abilitata.
   * Se passata insieme a `onAutoStartChange`, la sezione "Avvio" mostra il
   * toggle relativo (opt-out della UX "tap = start" introdotta da TSK-100).
   * Prop OPZIONALI per backward compat: i test legacy senza wiring non
   * renderizzano la sezione (gating speculare a haptics/theme).
   */
  autoStartFromLibrary?: boolean;
  /** Callback invocata al cambio del toggle "Avvio automatico" (US-053 AC2). */
  onAutoStartChange?: (enabled: boolean) => void;
}

/** Etichette user-facing per i valori di scala. */
function scaleLabel(s: ScaleFactor): string {
  return s === "auto" ? "Adatta" : `${s}x`;
}

/** Etichette user-facing per gli aspect ratio. */
function aspectLabel(a: AspectRatio): string {
  switch (a) {
    case "original":
      return "Originale";
    case "4:3":
      return "4:3";
    case "stretch":
      return "Stretch";
  }
}

/** TSK-037 — Etichette user-facing per i filtri video (US-022). */
function filterLabel(f: VideoFilter): string {
  switch (f) {
    case "nearest":
      return "Nearest";
    case "smoothing":
      return "Smoothing";
    case "scanline":
      return "Scanline";
  }
}

export function Settings({
  profile,
  onRemap,
  onSaveProfile,
  videoSettings,
  onVideoSettingsChange,
  videoConfigPort,
  saveService,
  currentRom,
  theme,
  onThemeChange,
  hapticsEnabled,
  onHapticsChange,
  autoStartFromLibrary,
  onAutoStartChange,
}: SettingsProps) {
  const [saved, setSaved] = useState(false);

  // TSK-036 — stato video. Modalità controllata se `videoSettings` è passata;
  // altrimenti usiamo l'hook con eventuale porta di persistenza.
  const internal = useVideoSettings(videoConfigPort);
  const controlled = videoSettings !== undefined;
  // F-036-05: il narrowing su `videoSettings !== undefined` consente di evitare
  // il cast esplicito; il branch controllato vede `videoSettings` come definito.
  const effective: VideoSettings = videoSettings ?? internal.value;

  function updateVideo(next: VideoSettings) {
    if (controlled) {
      onVideoSettingsChange?.(next);
    } else {
      internal.setValue(next);
      onVideoSettingsChange?.(next);
    }
  }

  function handleScaleChange(raw: string) {
    const next: ScaleFactor =
      raw === "auto" ? "auto" : (Number(raw) as Exclude<ScaleFactor, "auto">);
    updateVideo({ ...effective, scale: next });
  }

  function handleAspectChange(raw: string) {
    updateVideo({ ...effective, aspect: raw as AspectRatio });
  }

  // TSK-037 — applicazione del filtro (US-022).
  // F-037-01: validiamo a runtime contro VIDEO_FILTERS tramite `parseVideoFilter`
  // (in useVideoSettings.ts). Un valore non riconosciuto ricade sul default
  // canonico (`DEFAULT_VIDEO_SETTINGS.filter`) invece di propagare un cast
  // non sicuro.
  function handleFilterChange(raw: string) {
    const next: VideoFilter = parseVideoFilter(raw);
    updateVideo({ ...effective, filter: next });
  }

  // === TSK-033 — sezione "Dati" (US-019): export/import salvataggi ===========
  //
  // TSK-098 (EP-014 / US-052) — La logica I/O (listing, export con
  // `triggerDownload`, import con mapping reason → messaggio user-facing) è
  // estratta in `useSaveData` (domain/). Qui restano i concerni UI puri:
  // - `selectedSaveStateId`: scelta dell'utente sull'entry da esportare; non
  //   sta nel hook perché è stato di rendering della select, non I/O.
  // - `importInputRef`: ref al `<input type=file>` per resettare il valore
  //   dopo un import (idem).
  // - Effect di preselezione: sincronizza `selectedSaveStateId` con la prima
  //   entry di `saveStates` ad ogni cambio della lista (preserva la UX
  //   "prima entry preselezionata" del codice originale).
  //
  // `dataMessage` (kind: info | error) è veicolato con `role="alert"` per i
  // KO e `role="status"` per i success — assistive tech non interrompono
  // l'utente sui success (US-019 AC3 "avviso comprensibile").
  const currentRomId = currentRom?.id ?? "";
  // `refresh` non è consumato qui (l'invalidazione su import OK è incapsulata
  // nel hook), perciò non lo destrutturiamo. Esposto comunque dall'API del
  // hook per consumer futuri (es. wiring a un global "refresh" event).
  const {
    list: saveStates,
    busy: dataBusy,
    message: dataMessage,
    handleExport: exportSaveState,
    handleImportFile,
  } = useSaveData(saveService, currentRomId);
  const [selectedSaveStateId, setSelectedSaveStateId] = useState<string>("");
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Preselezione: prima entry (UX), oppure reset se vuota. Sincronizzato sul
  // `saveStates` esposto dal hook: cambia (refresh / cambio ROM / import OK
  // sulla ROM corrente) ⇒ riallineiamo la select. Equivalente al
  // `setSelectedSaveStateId(filtered[0]?.id ?? "")` pre-estrazione, ora qui.
  useEffect(() => {
    setSelectedSaveStateId(saveStates[0]?.id ?? "");
  }, [saveStates]);

  // Etichetta umana per una entry: "Slot N — DD/MM/YYYY HH:MM".
  // Localizziamo con `toLocaleString` (lo userà jsdom in test ma non è il
  // contenuto che asseriamo).
  function saveStateLabel(rec: SaveStateRecord): string {
    return `Slot ${rec.slot + 1} — ${new Date(rec.createdAt).toLocaleString()}`;
  }

  // Wrapper UI che inoltra `selectedSaveStateId` corrente al hook. Memoizzato
  // come l'originale per coerenza (consumato da `onClick` del bottone Esporta).
  const handleExport = useCallback(
    () => exportSaveState(selectedSaveStateId),
    [exportSaveState, selectedSaveStateId],
  );

  const handleImportChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void handleImportFile(file).finally(() => {
          // Permette di reimportare lo stesso file (gli `input[type=file]` non
          // sparano `change` se il valore non cambia).
          if (importInputRef.current) importInputRef.current.value = "";
        });
      }
    },
    [handleImportFile],
  );

  const dataSectionAvailable = saveService !== undefined;
  const exportDisabled =
    !dataSectionAvailable ||
    dataBusy ||
    selectedSaveStateId === "" ||
    saveStates.length === 0;

  // Nota: lo stile cursor:pointer + chevron accordion è ora in
  // styles/app-extra.css (regola `.sd-card.sb-sec details > summary.sb-lbl`),
  // quindi non serve più lo stile inline summaryStyle (Residuo B).

  return (
    <section className="sd-card sb-sec" aria-label="Impostazioni controlli">
      {/* === Accordion 1: Controlli — rimappatura (aperto di default) ======== */}
      <details open>
        <summary className="sb-lbl">
          Controlli — rimappatura
        </summary>
        <ul className="sb-keymap">
          {Object.entries(profile).map(([key, button]) => (
            <li key={key} className="sb-row">
              <span className="sb-key">{key}</span>
              <select
                className="sb-sel"
                aria-label={`Pulsante per ${key}`}
                value={button}
                onChange={(e) => onRemap(key, e.target.value as GameButton)}
              >
                {BUTTONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
        <button
          className="sb-btn sb-full"
          onClick={() => {
            onSaveProfile?.();
            setSaved(true);
          }}
        >
          Salva profilo
        </button>
        {saved && (
          <p className="sb-note" role="status">
            Profilo salvato.
          </p>
        )}
      </details>

      {/* === Accordion 2: Resa video — scala e proporzioni (aperto di default) === */}
      {/* TSK-036 — Resa video (US-021): scala + aspect ratio. Persistenza via
          `videoConfigPort` (opzionale); stessa porta consumata da Player.
          TSK-110 (US-057, EP-016) — accordion aperto di default (`open`) per
          migliorare la discoverability delle impostazioni video più usate. */}
      <details open>
        <summary className="sb-lbl">
          Resa video — scala e proporzioni
        </summary>
        <ul className="sb-keymap" aria-label="Impostazioni resa video">
          <li className="sb-row">
            <span className="sb-key">Fattore di scala</span>
            <select
              className="sb-sel"
              aria-label="Fattore di scala"
              value={String(effective.scale)}
              onChange={(e) => handleScaleChange(e.target.value)}
            >
              <option value="auto">{scaleLabel("auto")}</option>
              {SCALE_FACTORS.map((s) => (
                <option key={s} value={String(s)}>
                  {scaleLabel(s)}
                </option>
              ))}
            </select>
          </li>
          <li className="sb-row">
            <span className="sb-key">Aspect ratio</span>
            <select
              className="sb-sel"
              aria-label="Aspect ratio"
              value={effective.aspect}
              onChange={(e) => handleAspectChange(e.target.value)}
            >
              {ASPECT_RATIOS.map((a) => (
                <option key={a} value={a}>
                  {aspectLabel(a)}
                </option>
              ))}
            </select>
          </li>
          {/* TSK-037 — Filtro (US-022): nearest/smoothing/scanline. Stesso
              `VideoSettings`, stessa porta, persistenza già coperta dal
              wiring App.tsx introdotto in TSK-036. */}
          <li className="sb-row">
            <span className="sb-key">Filtro</span>
            <select
              className="sb-sel"
              aria-label="Filtro video"
              value={effective.filter}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              {VIDEO_FILTERS.map((f) => (
                <option key={f} value={f}>
                  {filterLabel(f)}
                </option>
              ))}
            </select>
          </li>
        </ul>
      </details>

      {/* === Accordion 3: Aspetto — tema UI (chiuso, opzionale) ============= */}
      {/* TSK-044 (US-036) — Aspetto: tema UI applicato via `data-theme` su
          `<html>`. Sezione opzionale: renderizzata solo se App.tsx ha cablato
          `theme` + `onThemeChange` (modalità controllata via `useTheme` con
          porta IndexedDB). I test legacy che non passano queste prop vedono
          lo stesso markup di prima — niente regressioni. */}
      {theme !== undefined && onThemeChange !== undefined && (
        <details>
          <summary className="sb-lbl">
            Aspetto — tema UI
          </summary>
          <ul className="sb-keymap" aria-label="Impostazioni aspetto">
            <ThemeSelector theme={theme} onThemeChange={onThemeChange} />
          </ul>
        </details>
      )}

      {/* === Accordion 4: Mobile — feedback aptico (chiuso, opzionale) ====== */}
      {/* TSK-066 (US-032) — Mobile: feedback aptico.
          Sezione opzionale: renderizzata solo se App.tsx ha cablato
          `hapticsEnabled` + `onHapticsChange`. I test legacy che non passano
          queste prop non vedono la sezione. */}
      {hapticsEnabled !== undefined && onHapticsChange !== undefined && (
        <details>
          <summary className="sb-lbl">
            Mobile — feedback aptico
          </summary>
          <ul className="sb-keymap" aria-label="Impostazioni mobile">
            <li className="sb-row">
              <span className="sb-key">Vibrazione ai controlli</span>
              <button
                type="button"
                className={`sb-tog${hapticsEnabled ? " on" : ""}`}
                role="switch"
                aria-checked={hapticsEnabled}
                aria-label="Feedback aptico"
                data-testid="sb-haptics-toggle"
                onClick={() => onHapticsChange(!hapticsEnabled)}
              >
                <span className="knob" />
              </button>
            </li>
          </ul>
        </details>
      )}

      {/* === Accordion 5: Avvio — auto-start dalla libreria (chiuso, opzionale) === */}
      {/* TSK-102 (US-053) — Toggle "Avvio automatico dalla libreria".
          Permette di opt-out dalla UX "tap = start" introdotta da TSK-100:
          con toggle OFF il tap su una tile della Library seleziona la ROM e
          porta su Play, ma NON avvia automaticamente — l'utente preme "Avvia"
          dal Player (comportamento legacy pre-TSK-100).
          Sezione opzionale: renderizzata solo se App.tsx ha cablato le prop
          (modalità controllata via `useAutoStartConfig`). I test legacy che
          non passano queste prop non vedono la sezione (parità haptics/theme). */}
      {autoStartFromLibrary !== undefined && onAutoStartChange !== undefined && (
        <details>
          <summary className="sb-lbl">
            Avvio — automatico dalla libreria
          </summary>
          <ul className="sb-keymap" aria-label="Impostazioni avvio">
            <li className="sb-row">
              <span className="sb-key">Avvio automatico dalla libreria</span>
              <button
                type="button"
                className={`sb-tog${autoStartFromLibrary ? " on" : ""}`}
                role="switch"
                aria-checked={autoStartFromLibrary}
                aria-label="Avvio automatico dalla libreria"
                data-testid="sb-auto-start-toggle"
                onClick={() => onAutoStartChange(!autoStartFromLibrary)}
              >
                <span className="knob" />
              </button>
            </li>
          </ul>
        </details>
      )}

      {/* === Accordion 6: Dati — salvataggi (export/import) (chiuso) ======== */}
      {/* TSK-033 — Dati (US-019): export/import salvataggi.
          Sezione sempre visibile per UX prevedibile; disabilitata con nota
          se manca `saveService` (es. test legacy senza wiring) o non ci sono
          save state per la ROM selezionata. */}
      <details>
        <summary className="sb-lbl">
          Dati — salvataggi (export/import)
        </summary>
        <div
          className="sd-flex sd-items-center sd-gap-sm"
          role="group"
          aria-label="Esporta e importa salvataggi"
          data-testid="sb-data-section"
        >
          {/* Etichetta di contesto: la ROM corrente è quella selezionata nel
              Player (App-level state). Non rendiamo un selettore ROM dedicato:
              (a) la Library lo è già; (b) duplicare il titolo qui collide con
              gli e2e che usano `getByText(title)` in modalità strict. L'utente
              che vuole esportare i save di un'altra ROM la seleziona dalla
              Library, poi torna in Settings (workflow esistente).
              Per la stessa ragione, indichiamo la ROM tramite id corto (non il
              titolo): il titolo resta univoco nella DOM (Library tile + Player). */}
          {/* TSK-110 (US-057, EP-016) — mostra il titolo della ROM corrente
              invece dell'id troncato. Il titolo è già esposto nella tile della
              Library; qui la coerenza visiva "vedi titolo ovunque" migliora
              la UX. Wording ancora distinto da "Nessun gioco" (Library) per
              non collidere con gli e2e in modalità strict (vedi sopra). */}
          <span className="sb-key" data-testid="sb-data-rom-context">
            {currentRom
              ? `Gioco corrente: ${currentRom.title}`
              : "— seleziona una ROM dalla libreria —"}
          </span>
        </div>
        <div className="sd-flex sd-items-center sd-gap-sm">
          <span className="sb-key">Salvataggio</span>
          <select
            className="sb-sel"
            aria-label="Salvataggio da esportare"
            value={selectedSaveStateId}
            onChange={(e) => setSelectedSaveStateId(e.target.value)}
            disabled={!dataSectionAvailable || saveStates.length === 0}
          >
            {saveStates.length === 0 && (
              <option value="">(nessun salvataggio)</option>
            )}
            {saveStates.map((rec) => (
              <option key={rec.id} value={rec.id}>
                {saveStateLabel(rec)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="sb-btn sb-btn-primary"
            onClick={handleExport}
            disabled={exportDisabled}
            aria-label="Esporta salvataggio selezionato"
          >
            Esporta
          </button>
        </div>
        <div className="sd-flex sd-items-center sd-gap-sm">
          <span className="sb-key">Importa file</span>
          <input
            ref={importInputRef}
            type="file"
            aria-label="Importa file di salvataggio"
            // application/json + estensione di courtesy: il dialog non filtra a
            // schermo (US-019 menziona "file"), ma offre un hint al browser.
            accept="application/json,.json"
            onChange={handleImportChange}
            disabled={!dataSectionAvailable || dataBusy}
          />
        </div>
        {!dataSectionAvailable && (
          // Nota statica (no aria-live): è uno stato permanente del rendering
          // quando manca il SaveService, non un feedback contestuale. Mantenere
          // un role="status" qui creerebbe ambiguità con il messaggio "Profilo
          // salvato" (anch'esso role="status"): l'AT leggerebbe entrambi.
          <p className="sb-note" data-testid="sb-data-unavailable">
            La gestione dei salvataggi non è disponibile.
          </p>
        )}
        {dataMessage && (
          <p
            className="sb-note"
            role={dataMessage.kind === "error" ? "alert" : "status"}
            data-testid="sb-data-message"
          >
            {dataMessage.text}
          </p>
        )}
      </details>

      {/* === Accordion 7: Legale (chiuso) ==================================== */}
      {/* TSK-070 (US-034) — Sezione "Legale" SEMPRE consultabile, posta
          PRIMA della sezione Privacy così il cross-link interno "qui sotto"
          è coerente (vedi StoreComplianceNotice.tsx). Avviso esplicito
          no-ROM protette per conformità store. */}
      <details>
        <summary className="sb-lbl">
          Legale
        </summary>
        {/* headingHidden=true: il <summary> sopra funge già da titolo —
            sopprimiamo l'intestazione interna di StoreComplianceNotice
            per evitare il doppio header (Residuo A). */}
        <StoreComplianceNotice headingHidden />
      </details>

      {/* === Accordion 8: Privacy (chiuso) =================================== */}
      {/* TSK-069 (US-033) — Sezione "Privacy" SEMPRE consultabile.
          Incondizionata (no prop gating) perché il contenuto è statico e
          riflette il modello on-device dell'app (ADR-002 §Conseguenze).
          Variante `section`: layout coerente, non dismissibile. */}
      <details>
        <summary className="sb-lbl">
          Privacy
        </summary>
        {/* headingHidden=true: il <summary> sopra funge già da titolo —
            sopprimiamo l'intestazione interna di PrivacyNotice
            per evitare il doppio header (Residuo A). */}
        <PrivacyNotice variant="section" headingHidden />
      </details>
    </section>
  );
}
