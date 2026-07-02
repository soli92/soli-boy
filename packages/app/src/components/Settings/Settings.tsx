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
//
// TSK-149 (EP-020 / US-097) — Accordion sezioni migrato da <details>/<summary>
// nativo a solids `Accordion` (Radix): keyboard nav (ArrowUp/Down, Home/End),
// aria-expanded/aria-controls corretti, chevron interno gestito dal DS.
// Modalità `type="multiple"`: più sezioni aperte contemporaneamente (parità
// con pre-migrazione, dove ogni <details> gestiva open/close indipendente).
// `defaultValue={["video"]}` conserva la UX pre-migrazione (Resa video aperta
// di default — TSK-110 / UX-028; tutte le altre chiuse per progressive
// disclosure). Il chevron custom e il marker CSS sono stati rimossi da
// `styles/app-extra.css` (Radix fornisce ChevronDown built-in nel trigger).

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
// TSK-126 (US-065, ADR-009) — Sezione "Orologio interno (RTC)" gating su
// piattaforma+bridge. Visibilità condizionale gestita internamente da
// RtcSection (return null se !hasRtc(platform) || bridge === null), quindi le
// prop `platform` / `rtcBridge` sono opzionali a livello di Settings per non
// rompere i test legacy che istanziano <Settings/> senza wiring RTC.
import type { RtcBridge } from "../../domain/rtc-service";
import { RtcSection } from "./RtcSection";
// TSK-149 (EP-020) — Accordion primitive Radix via wrapper solids/shadcn.
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// TSK-150 (EP-020) — Form controls migrati a primitive solids/shadcn.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// TSK-121 / US-064 — L e R rimappabili come gli altri comandi (EP-018).
const BUTTONS: GameButton[] = [
  "up",
  "down",
  "left",
  "right",
  "a",
  "b",
  "l",
  "r",
  "start",
  "select",
];

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
  /**
   * TSK-126 (US-065, ADR-009) — Piattaforma corrente per la sezione RTC.
   * Determina la visibilità della sezione `RtcSection` (visibile solo se
   * `hasRtc(platform)` e bridge non null). Prop OPZIONALI per backward
   * compat: i test legacy che istanziano `<Settings>` senza wiring RTC
   * non vedono la sezione (parità gating con haptics/theme).
   */
  rtcPlatform?: string;
  /**
   * TSK-126 (US-065, ADR-009) — Bridge engine↔RTC. Null se nessun gioco è
   * in esecuzione o se l'engine non ha inizializzato un bridge RTC
   * (comportamento corrente: gli engine concreti hanno `rtcBridge = null`,
   * le implementazioni reali arriveranno con Sprint 16).
   */
  rtcBridge?: RtcBridge | null;
}

/** Etichetta user-facing per un `GameButton` nel selettore rimappatura. */
function buttonOptionLabel(button: GameButton): string {
  if (button === "select") return "Select";
  if (button === "start") return "Start";
  return button.toUpperCase();
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
  rtcPlatform,
  rtcBridge,
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

  // TSK-149 — Progressive disclosure: sezione "Resa video" aperta di default
  // (parità con l'UX pre-migrazione dove `<details open>` era su questa sola
  // sezione — TSK-110 / UX-028). Le altre sezioni sono chiuse; l'utente le
  // apre singolarmente. `type="multiple"` consente più sezioni aperte insieme
  // (parità pre-migrazione: ogni <details> era indipendente).
  return (
    <section className="sd-card sb-sec" aria-label="Impostazioni controlli">
      <Accordion
        type="multiple"
        defaultValue={["video"]}
        className="flex flex-col"
      >
        {/* === Accordion 1: Controlli — rimappatura (chiuso di default) === */}
        <AccordionItem value="controls">
          <AccordionTrigger>Controlli — rimappatura</AccordionTrigger>
          <AccordionContent>
            <ul className="flex flex-col gap-1 list-none p-0 m-0">
              {Object.entries(profile).map(([key, button]) => (
                <li key={key}>
                  <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
                    <Kbd>{key}</Kbd>
                    <Select
                      value={button}
                      onValueChange={(value) =>
                        onRemap(key, value as GameButton)
                      }
                    >
                      <SelectTrigger
                        className="w-[120px]"
                        aria-label={`Pulsante per ${key}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUTTONS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {buttonOptionLabel(b)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              className="w-full mt-3"
              onClick={() => {
                onSaveProfile?.();
                setSaved(true);
              }}
            >
              Salva profilo
            </Button>
            {saved && (
              <p className="sb-note" role="status">
                Profilo salvato.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* === Accordion 2: Resa video — scala e proporzioni (aperto) ====== */}
        {/* TSK-036 — Resa video (US-021): scala + aspect ratio. Persistenza via
            `videoConfigPort` (opzionale); stessa porta consumata da Player.
            TSK-110 — aperto di default (UX-028) — su Accordion via defaultValue. */}
        <AccordionItem value="video">
          <AccordionTrigger>Resa video — scala e proporzioni</AccordionTrigger>
          <AccordionContent>
            <ul
              className="flex flex-col gap-1 list-none p-0 m-0"
              aria-label="Impostazioni resa video"
            >
              <li>
                <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
                  <Label htmlFor="video-scale">Fattore di scala</Label>
                  <Select
                    value={String(effective.scale)}
                    onValueChange={handleScaleChange}
                  >
                    <SelectTrigger
                      id="video-scale"
                      className="w-[120px]"
                      aria-label="Fattore di scala"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{scaleLabel("auto")}</SelectItem>
                      {SCALE_FACTORS.map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {scaleLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </li>
              <li>
                <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
                  <Label htmlFor="video-aspect">Aspect ratio</Label>
                  <Select
                    value={effective.aspect}
                    onValueChange={handleAspectChange}
                  >
                    <SelectTrigger
                      id="video-aspect"
                      className="w-[120px]"
                      aria-label="Aspect ratio"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {aspectLabel(a)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </li>
              <li>
                <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
                  <Label htmlFor="video-filter">Filtro</Label>
                  <Select
                    value={effective.filter}
                    onValueChange={handleFilterChange}
                  >
                    <SelectTrigger
                      id="video-filter"
                      className="w-[120px]"
                      aria-label="Filtro video"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIDEO_FILTERS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {filterLabel(f)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* === Accordion 3: Aspetto — tema UI (chiuso, opzionale) ========== */}
        {/* TSK-044 (US-036) — Aspetto: tema UI applicato via `data-theme` su
            `<html>`. Sezione opzionale: renderizzata solo se App.tsx ha cablato
            `theme` + `onThemeChange` (modalità controllata via `useTheme` con
            porta IndexedDB). I test legacy che non passano queste prop vedono
            lo stesso markup di prima — niente regressioni. */}
        {theme !== undefined && onThemeChange !== undefined && (
          <AccordionItem value="aspect">
            <AccordionTrigger>Aspetto — tema UI</AccordionTrigger>
            <AccordionContent>
              <ThemeSelector theme={theme} onThemeChange={onThemeChange} />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* === Accordion 4: Mobile — feedback aptico (chiuso, opzionale) === */}
        {/* TSK-066 (US-032) — Mobile: feedback aptico.
            Sezione opzionale: renderizzata solo se App.tsx ha cablato
            `hapticsEnabled` + `onHapticsChange`. I test legacy che non passano
            queste prop non vedono la sezione. */}
        {hapticsEnabled !== undefined && onHapticsChange !== undefined && (
          <AccordionItem value="mobile">
            <AccordionTrigger>Mobile — feedback aptico</AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center justify-between py-1.5">
                <Label htmlFor="haptics-toggle">Vibrazione ai controlli</Label>
                <Switch
                  id="haptics-toggle"
                  checked={hapticsEnabled}
                  onCheckedChange={onHapticsChange}
                  data-testid="sb-haptics-toggle"
                  aria-label="Feedback aptico"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* === Accordion 5: Avvio — auto-start dalla libreria (chiuso) ===== */}
        {/* TSK-102 (US-053) — Toggle "Avvio automatico dalla libreria".
            Permette di opt-out dalla UX "tap = start" introdotta da TSK-100:
            con toggle OFF il tap su una tile della Library seleziona la ROM e
            porta su Play, ma NON avvia automaticamente — l'utente preme "Avvia"
            dal Player (comportamento legacy pre-TSK-100).
            Sezione opzionale: renderizzata solo se App.tsx ha cablato le prop
            (modalità controllata via `useAutoStartConfig`). I test legacy che
            non passano queste prop non vedono la sezione (parità haptics/theme). */}
        {autoStartFromLibrary !== undefined &&
          onAutoStartChange !== undefined && (
            <AccordionItem value="autostart">
              <AccordionTrigger>Avvio — automatico dalla libreria</AccordionTrigger>
              <AccordionContent>
                <div className="flex items-center justify-between py-1.5">
                  <Label htmlFor="auto-start-toggle">
                    Avvio automatico dalla libreria
                  </Label>
                  <Switch
                    id="auto-start-toggle"
                    checked={autoStartFromLibrary}
                    onCheckedChange={onAutoStartChange}
                    data-testid="sb-auto-start-toggle"
                    aria-label="Avvio automatico dalla libreria"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

        {/* === Accordion 6: Dati — salvataggi (export/import) (chiuso) ===== */}
        {/* TSK-033 — Dati (US-019): export/import salvataggi.
            Sezione sempre visibile per UX prevedibile; disabilitata con nota
            se manca `saveService` (es. test legacy senza wiring) o non ci sono
            save state per la ROM selezionata. */}
        <AccordionItem value="data">
          <AccordionTrigger>Dati — salvataggi (export/import)</AccordionTrigger>
          <AccordionContent>
            <div
              className="sd-flex sd-items-center sd-gap-sm mb-3"
              role="group"
              aria-label="Esporta e importa salvataggi"
              data-testid="sb-data-section"
            >
              <span className="text-sm font-mono" data-testid="sb-data-rom-context">
                {currentRom
                  ? `Gioco corrente: ${currentRom.title}`
                  : "Nessun gioco corrente"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Label htmlFor="save-state-export" className="shrink-0">
                Salvataggio
              </Label>
              <Select
                value={selectedSaveStateId || undefined}
                onValueChange={setSelectedSaveStateId}
                disabled={!dataSectionAvailable || saveStates.length === 0}
              >
                <SelectTrigger
                  id="save-state-export"
                  className="w-[220px]"
                  aria-label="Salvataggio da esportare"
                >
                  <SelectValue
                    placeholder={
                      saveStates.length === 0
                        ? "(nessun salvataggio)"
                        : undefined
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {saveStates.map((rec) => (
                    <SelectItem key={rec.id} value={rec.id}>
                      {saveStateLabel(rec)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handleExport}
                disabled={exportDisabled}
                aria-label="Esporta salvataggio selezionato"
              >
                Esporta
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Label htmlFor="save-state-import" className="shrink-0">
                Importa file
              </Label>
              <Input
                ref={importInputRef}
                id="save-state-import"
                type="file"
                aria-label="Importa file di salvataggio"
                accept="application/json,.json"
                onChange={handleImportChange}
                disabled={!dataSectionAvailable || dataBusy}
                className="max-w-xs"
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
          </AccordionContent>
        </AccordionItem>

        {/* === Accordion 7: Orologio interno RTC (chiuso, opzionale) ======= */}
        {/* TSK-126 (US-065, ADR-009) — Sezione "Orologio interno (RTC)".
            Visibile solo se la piattaforma corrente ha un RTC E un bridge attivo
            è disponibile (gating interno a RtcSection, return null altrimenti).
            Posta dopo "Dati": il payload RTC è la "terza categoria di dato del
            salvataggio" (ADR-009 §3), quindi semanticamente vicina ai save state.
            Prop opzionali: i test legacy senza wiring RTC non vedono la sezione.
            TSK-149 — RtcSection ora ritorna un `AccordionItem` (value="rtc")
            che si integra nell'Accordion parent qui. */}
        {rtcPlatform !== undefined && rtcBridge !== undefined && (
          <RtcSection platform={rtcPlatform} bridge={rtcBridge} />
        )}

        {/* === Accordion 8: Legale (chiuso) ================================ */}
        {/* TSK-070 (US-034) — Sezione "Legale" SEMPRE consultabile, posta
            PRIMA della sezione Privacy così il cross-link interno "qui sotto"
            è coerente (vedi StoreComplianceNotice.tsx). Avviso esplicito
            no-ROM protette per conformità store. */}
        <AccordionItem value="legal">
          <AccordionTrigger>Legale</AccordionTrigger>
          <AccordionContent>
            {/* headingHidden=true: il trigger sopra funge già da titolo —
                sopprimiamo l'intestazione interna di StoreComplianceNotice
                per evitare il doppio header (Residuo A). */}
            <StoreComplianceNotice headingHidden />
          </AccordionContent>
        </AccordionItem>

        {/* === Accordion 9: Privacy (chiuso) =============================== */}
        {/* TSK-069 (US-033) — Sezione "Privacy" SEMPRE consultabile.
            Incondizionata (no prop gating) perché il contenuto è statico e
            riflette il modello on-device dell'app (ADR-002 §Conseguenze).
            Variante `section`: layout coerente, non dismissibile. */}
        <AccordionItem value="privacy">
          <AccordionTrigger>Privacy</AccordionTrigger>
          <AccordionContent>
            {/* headingHidden=true: il trigger sopra funge già da titolo —
                sopprimiamo l'intestazione interna di PrivacyNotice
                per evitare il doppio header (Residuo A). */}
            <PrivacyNotice variant="section" headingHidden />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
