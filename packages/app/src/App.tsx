import { useEffect, useMemo, useState } from "react";
import { FileLoader } from "./components/FileLoader/FileLoader";
import { Library } from "./components/Library/Library";
import { Player } from "./components/Player/Player";
import { Settings } from "./components/Settings/Settings";
import { LegalNotice } from "./components/LegalNotice";
import { PrivacyNotice } from "./components/PrivacyNotice/PrivacyNotice";
import { makePrivacyAckPort } from "./components/PrivacyNotice/privacy-port";
import { usePrivacyAck } from "./components/PrivacyNotice/usePrivacyAck";
// TSK-055 — punto unico di selezione runtime: IndexedDB su web/mobile,
// NativeFsAdapter su desktop Electron (rileva `window.soliboyDesktop`).
// I servizi di dominio consumano solo le porte (`SaveStoragePort`/`ConfigPort`):
// nessun consumatore deve sapere quale backend di persistenza è attivo.
import { selectAdapter } from "./storage/select-adapter";
import { StubEngine } from "./core/stub-engine";
import { selectEngine } from "./core/engine-registry";
import {
  DEFAULT_KEY_PROFILE,
  InputMapping,
  type KeyProfile,
} from "./domain/input-mapping";
import { SaveService } from "./domain/save-service";
import type { RomRecord } from "./storage/types";
import type { GameButton } from "./core/core-wrapper";
import { useVideoSettings } from "./components/Player/useVideoSettings";
import { makeVideoSettingsPort } from "./components/Player/video-settings-port";
// TSK-044 (US-036) — wiring tema UI: hook + porta IndexedDB (chiave `"ui-theme"`).
// Lo stato è sollevato a livello App e iniettato in Settings via prop opzionali;
// stesso pattern adottato per le `Resa video` (TSK-036).
import { useTheme } from "./components/ThemeSelector/useTheme";
import { makeThemePort } from "./components/ThemeSelector/theme-port";

// TSK-025 (ADR-005): selezione engine. Default StubEngine (test/dev/e2e deterministici);
// engine REALE per-piattaforma via registry, opt-in con ?engine=real.
const REAL_ENGINE =
  typeof location !== "undefined" &&
  new URLSearchParams(location.search).get("engine") === "real";

// TSK-055 — Bundle storage+config selezionato a runtime una sola volta a
// modulo-load. Su web/mobile coincide con i singleton storici IndexedDB
// (comportamento invariato); su desktop Electron è il `NativeFsAdapter`
// iniettato col bridge `window.soliboyDesktop` (TSK-053). Il dominio non
// vede la differenza: consuma `SaveStoragePort`/`ConfigPort`.
const { storage: selectedStorage, config: selectedConfig } = selectAdapter();

// Composizione del Core web MVP. Storage reale via `selectAdapter()`.
export function App() {
  const storage = selectedStorage;
  const stub = useMemo(() => new StubEngine(), []);
  const [profile, setProfile] = useState<KeyProfile>(DEFAULT_KEY_PROFILE);
  const [selected, setSelected] = useState<RomRecord | null>(null);
  const [refresh, setRefresh] = useState(0);
  // TSK-033 (US-019) — riassunto ROM corrente per la sezione "Dati" di Settings.
  // La ROM "corrente" è quella selezionata nel Player (`selected`); proiettiamo
  // un sottoinsieme leggero (id + title) per disaccoppiare Settings dal
  // `RomRecord` completo (interface segregation: niente Blob nel contratto UI).
  const currentRomSummary = useMemo(
    () =>
      selected !== null
        ? { id: selected.id, title: selected.title }
        : undefined,
    [selected],
  );

  // TSK-036 (F-036-02) — stato video sollevato a livello App: Settings e Player
  // ne sono consumatori controllati, condividendo la stessa istanza e così
  // restando sincronizzati in sessione. La porta concreta (IndexedDB `config`,
  // chiave `video-settings`) idrata al mount e persiste su `setValue`.
  const videoPort = useMemo(
    () => makeVideoSettingsPort(selectedConfig),
    [],
  );
  const { value: videoSettings, setValue: setVideoSettings } =
    useVideoSettings(videoPort);

  // TSK-044 (US-036) — stato tema UI sollevato a livello App. Stessa
  // composizione delle `Resa video`: porta concreta (IndexedDB `config`,
  // chiave canonica `"ui-theme"`) memoizzata, hook che idrata al mount e
  // applica `data-theme` al `<html>`. La preferenza è passata a Settings via
  // prop opzionali — sezione "Aspetto" attiva solo qui (test legacy intatti).
  const themePort = useMemo(() => makeThemePort(selectedConfig), []);
  const { theme, setTheme } = useTheme(themePort);

  // TSK-069 (US-033) — Stato presa visione informativa privacy on-device.
  // Stesso pattern di `useTheme`: porta concreta (IndexedDB `config`, chiave
  // canonica `"privacy-ack"`) memoizzata, hook che idrata al mount. Il banner
  // è renderizzato SOLO se l'utente non ha ancora cliccato "Ho capito" in una
  // sessione precedente; la sezione "Privacy" di Settings resta sempre
  // disponibile (vedi `PrivacyNotice variant="section"`).
  const privacyPort = useMemo(() => makePrivacyAckPort(selectedConfig), []);
  const { acknowledged: privacyAck, acknowledge: ackPrivacy } =
    usePrivacyAck(privacyPort);

  // TSK-032 (US-016 / ADR-006) — SaveService composto al livello App e iniettato
  // nel Player. Lo `storage` (IndexedDBAdapter) implementa già `SaveStoragePort`
  // (port.ts §SaveStoragePort): nessun nuovo adapter, niente storage paralleli.
  const saveService = useMemo(() => new SaveService(storage), [storage]);

  // In modalità reale l'engine dipende dal core del gioco selezionato (registry).
  const engine = useMemo(
    () => (REAL_ENGINE && selected ? selectEngine(selected.core) : stub),
    [selected, stub],
  );

  // Routing input fisici → core (US-012), basato sul profilo corrente.
  const input = useMemo(
    () => new InputMapping((b, p) => engine.sendInput(b, p), profile),
    [engine, profile],
  );
  useEffect(() => {
    // Con engine reale l'input tastiera è gestito dalla lib (WasmBoy): il wiring
    // globale resta per lo StubEngine / controlli app.
    if (REAL_ENGINE) return;
    const down = (e: KeyboardEvent) => input.keyDown(e.key);
    const up = (e: KeyboardEvent) => input.keyUp(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [input]);

  function remap(key: string, button: GameButton) {
    setProfile((p) => ({ ...p, [key]: button }));
  }

  return (
    <main className="sb-app">
      <header className="sd-flex sd-items-center sd-between">
        <span className="sb-title">Soli-boy</span>
      </header>

      {/* TSK-069 (US-033) — Banner privacy on-device al primo avvio.
          Non bloccante (non è un paywall, vedi TSK-069 §Technical Specs):
          l'utente può comunque interagire con FileLoader/Library/Settings.
          Reso sopra il FileLoader per dare visibilità prima di qualsiasi
          azione che tocchi i file utente. Si nasconde dopo l'ack. */}
      {!privacyAck && (
        <PrivacyNotice variant="banner" onAcknowledge={ackPrivacy} />
      )}

      <FileLoader storage={storage} onImported={() => setRefresh((n) => n + 1)} />

      <Library key={refresh} storage={storage} onSelect={setSelected} />

      {selected && (
        <Player
          engine={engine}
          rom={{ rom: selected.fileBlob, core: selected.core }}
          title={selected.title}
          videoSettings={videoSettings}
          // TSK-032 — wiring save state panel (US-016, ADR-006 §Decisione p.4).
          saveService={saveService}
          romId={selected.id}
          currentCore={selected.core}
        />
      )}

      <Settings
        profile={profile}
        onRemap={remap}
        videoSettings={videoSettings}
        onVideoSettingsChange={setVideoSettings}
        // TSK-033 (US-019) — wiring sezione "Dati": export/import salvataggi.
        // Il SaveService è la stessa istanza condivisa col Player (TSK-032),
        // così le entry create dal Player sono immediatamente esportabili.
        // `currentRom` riflette la selezione del Player: l'UI Dati lavora
        // sempre sulla ROM "in contesto" (no doppio selettore).
        saveService={saveService}
        currentRom={currentRomSummary}
        // TSK-044 (US-036) — wiring sezione "Aspetto": tema UI controllato
        // dall'hook `useTheme` a livello App. Le prop sono OPZIONALI lato
        // Settings: i test legacy senza wiring tema continuano a passare.
        theme={theme}
        onThemeChange={setTheme}
      />

      <LegalNotice />
    </main>
  );
}
