import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// Logo brand orizzontale: sostituisce il testo "Soli-boy" nell'header.
// Vite risolve l'import SVG in una URL servibile (asset pipeline).
import logoUrl from "./assets/soliboy-logo-horizontal.svg";
import { FileLoader } from "./components/FileLoader/FileLoader";
import { Library } from "./components/Library/Library";
import { Player } from "./components/Player/Player";
import { Settings } from "./components/Settings/Settings";
import { LegalNotice } from "./components/LegalNotice";
import { PrivacyNotice } from "./components/PrivacyNotice/PrivacyNotice";
import { StoreComplianceNotice } from "./components/StoreComplianceNotice/StoreComplianceNotice";
// TSK-057 (US-025) — Banner in-app per il ciclo di auto-update Electron.
// No-op su web (nessun bridge window.soliboyDesktop → ritorna null).
import { UpdateBanner } from "./components/UpdateBanner/UpdateBanner";
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
// TSK-066 (US-032) — wiring feedback aptico: hook + porta IndexedDB (chiave `"haptics-enabled"`).
// Stato sollevato a livello App: Settings ne riceve il toggle, TouchOverlay l'enabled flag.
import { useHapticsConfig } from "./components/TouchOverlay/useHapticsConfig";

// TSK-025 (ADR-005): selezione engine. Default ENGINE REALE per-piattaforma via
// registry (l'utente che apre la webapp vuole emulare davvero). Lo StubEngine
// deterministico (test/e2e/dev senza WASM) resta opt-in con ?engine=stub, oppure
// automatico in ambiente test (vitest). Retrocompat: ?engine=real è ancora
// accettato (no-op, ora che il reale è il default).
const engineParam =
  typeof location !== "undefined"
    ? new URLSearchParams(location.search).get("engine")
    : null;
const STUB_ENGINE = engineParam === "stub" || import.meta.env.MODE === "test";
const REAL_ENGINE = !STUB_ENGINE;

// TSK-055 — Bundle storage+config selezionato a runtime una sola volta a
// modulo-load. Su web/mobile coincide con i singleton storici IndexedDB
// (comportamento invariato); su desktop Electron è il `NativeFsAdapter`
// iniettato col bridge `window.soliboyDesktop` (TSK-053). Il dominio non
// vede la differenza: consuma `SaveStoragePort`/`ConfigPort`.
const { storage: selectedStorage, config: selectedConfig } = selectAdapter();

/** Le 4 destinazioni funzionali dell'app. */
type Tab = "play" | "library" | "settings" | "info";

const TABS: { id: Tab; label: string }[] = [
  { id: "play", label: "Play" },
  { id: "library", label: "Libreria" },
  { id: "settings", label: "Impostazioni" },
  { id: "info", label: "Info & Privacy" },
];

// Composizione del Core web MVP. Storage reale via `selectAdapter()`.
export function App() {
  const storage = selectedStorage;
  const stub = useMemo(() => new StubEngine(), []);
  const [profile, setProfile] = useState<KeyProfile>(DEFAULT_KEY_PROFILE);
  const [selected, setSelected] = useState<RomRecord | null>(null);
  const [refresh, setRefresh] = useState(0);

  // INCREMENT 2 — navigazione a tab. Default "play" (emulator-first).
  const [activeTab, setActiveTab] = useState<Tab>("play");

  // Ref per il contenitore tablist (keyboard navigation con frecce).
  const tablistRef = useRef<HTMLDivElement>(null);

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

  // TSK-066 (US-032) — stato feedback aptico. ConfigPort riusa `selectedConfig`
  // (store `config`, chiave `haptics-enabled`). Persistenza on `setHapticsEnabled`
  // seguita da `saveHapticsEnabled` (chiamata dal toggle in Settings).
  const { hapticsEnabled, setHapticsEnabled, saveHapticsEnabled } =
    useHapticsConfig(selectedConfig);

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

  // INCREMENT 2 — Pausa automatica quando si lascia la tab Play,
  // ripresa automatica al ritorno. Il guard C-01 (resume() no-op su engine
  // non configurato) è già in WasmBoyEngine.resume() → sicuro sempre-montato.
  // Usiamo una ref al wrapper del Player (lifecycleTarget) tramite un
  // ref callback esposto dalla prop `onLifecycleReady`.
  // Approccio alternativo più semplice: teniamo un ref all'engine wrapper
  // direttamente qui in App, dato che CoreWrapper è costruito in Player.
  // Per non accoppiare App a CoreWrapper, usiamo invece un ref a un oggetto
  // { pause, resume, currentState } iniettato dal Player via callback.
  //
  // Tuttavia, il Player non espone attualmente questo callback.
  // Soluzione pragmatica e non invasiva: usiamo l'engine direttamente qui,
  // poiché App è l'owner di `engine` e sa già se il gioco è in corso
  // tramite il campo `selected`. Per "pausa on leave" chiamiamo
  // engine.pause() se `selected` è presente e l'utente lascia Play.
  // CoreWrapper non è accesso diretto: usiamo l'engine puro per la pausa.
  // Il guard in WasmBoyEngine.resume() protegge anche dal resume su idle.
  //
  // Nota: non abbiamo accesso al `state` di CoreWrapper da App.tsx senza
  // aggiungere una callback. Usiamo quindi un ref locale `isPlayingRef`
  // che traccia se il gioco è in corso (impostato a true quando si avvia
  // dal Player). Questo è sufficiente: pause su engine già in pausa
  // è un no-op sicuro (WasmBoyEngine.pause() chiama WasmBoy.pause() che
  // è idempotente); idem resume su idle (guard configured).
  const prevTabRef = useRef<Tab>(activeTab);

  // Ref all'engine per la pausa tab-leave. L'engine cambia quando cambia
  // `selected` (useMemo), quindi aggiorniamo la ref ad ogni render.
  const engineRef = useRef(engine);
  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  // Pausa/ripresa sincronizzata al cambio tab.
  // Solo se c'è una ROM selezionata (il Player è in gioco).
  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev === activeTab) return;

    if (selected) {
      // Lascio Play → pausa
      if (prev === "play" && activeTab !== "play") {
        engineRef.current.pause();
      }
      // Torno a Play → riprendo (guard configured in engine protegge da idle)
      if (prev !== "play" && activeTab === "play") {
        engineRef.current.resume();
      }
    }

    prevTabRef.current = activeTab;
  }, [activeTab, selected]);

  // Gestione keyboard navigation sulla tablist (WAI-ARIA pattern:
  // ArrowLeft/ArrowRight per spostarsi, Home/End per i bordi).
  const handleTablistKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const tabIds = TABS.map((t) => t.id);
      const currentIndex = tabIds.indexOf(activeTab);

      let nextIndex = currentIndex;
      if (e.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % tabIds.length;
      } else if (e.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
      } else if (e.key === "Home") {
        nextIndex = 0;
      } else if (e.key === "End") {
        nextIndex = tabIds.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      const nextTab = tabIds[nextIndex];
      setActiveTab(nextTab);
      // Sposta il focus sul button della tab attivata via tastiera.
      const btn = tablistRef.current?.querySelector<HTMLButtonElement>(
        `[data-tab-id="${nextTab}"]`,
      );
      btn?.focus();
    },
    [activeTab],
  );

  // Handler selezione ROM dalla Library: seleziona la ROM e porta l'utente
  // sulla tab Play (OQ-02: auto-switch preferibile per nielsen-1 / flow-ux-1).
  function handleLibrarySelect(rom: RomRecord) {
    setSelected(rom);
    setActiveTab("play");
  }

  return (
    <main className="sb-app">
      <header className="sd-flex sd-items-center sd-between">
        {/* a11y (EP-012 window A): h1 mantenuto per WCAG page-has-heading-one.
            Il nome accessibile dell'heading è fornito dall'alt dell'immagine
            del logo brand (sostituisce il testo "Soli-boy"). */}
        <h1 className="sb-title sb-title--logo">
          <img className="sb-logo" src={logoUrl} alt="Soli-boy" />
        </h1>
      </header>

      {/* TSK-069 (US-033) — Banner privacy on-device al primo avvio.
          Non bloccante: l'utente può interagire con il resto dell'app.
          Rimane come overlay/banner sopra la navigazione (indipendente dalle tab). */}
      {!privacyAck && (
        <PrivacyNotice variant="banner" onAcknowledge={ackPrivacy} />
      )}

      {/* TSK-057 (US-025) — Banner auto-update: no-op su web (guard in UpdateBanner).
          Posizionato dopo il banner privacy per non competere in visibilità. */}
      <UpdateBanner />

      {/* INCREMENT 2 — Navigazione a 4 tab (WAI-ARIA tablist pattern).
          Pattern: nav landmark + tablist con role="tab", aria-selected, aria-controls.
          Keyboard: ArrowLeft/ArrowRight per navigare, Home/End per i bordi.
          Player panel usa `hidden` attribute (mai smontato, preserva stato gioco).
          Altri panel usano conditional render (unmount accettabile, no stato BG). */}
      <nav aria-label="Navigazione principale">
        <div
          role="tablist"
          aria-label="Sezioni app"
          className="sb-tab-bar"
          ref={tablistRef}
          onKeyDown={handleTablistKeyDown}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              data-tab-id={tab.id}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={[
                "sb-tab-btn",
                activeTab === tab.id ? "sb-tab-btn--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Panel Play — Player SEMPRE montato (always-mounted, mai smontato).
          Usa hidden attribute invece di conditional render per preservare lo
          stato WasmBoy. La visibilità CSS è gestita via hidden + sb-panel hidden.
          A-01 validata: WasmBoyEngine.resume() ha guard `if (!configured) return`
          (wasmboy-engine.ts:77-84), quindi il player montato-ma-mai-avviato è sicuro. */}
      <div
        id="panel-play"
        role="tabpanel"
        aria-labelledby="tab-play"
        className="sb-tab-panel"
        hidden={activeTab !== "play"}
      >
        <Player
          engine={engine}
          rom={
            selected
              ? { rom: selected.fileBlob, core: selected.core }
              : // ROM placeholder per stato idle (Player sempre montato):
                // fileBlob vuoto, core gb — il Player non avvierà nulla
                // finché l'utente non preme "Avvia" (wrapper.load è chiamato
                // solo in handlePlay, non al mount).
                { rom: new Blob(), core: "gambatte" }
          }
          title={selected?.title}
          videoSettings={videoSettings}
          saveService={selected ? saveService : undefined}
          romId={selected?.id}
          currentCore={selected?.core}
          hapticsEnabled={hapticsEnabled}
          inputMapping={input}
          touchConfigStorage={selectedConfig}
        />
        {/* CTA FileLoader in stato idle (nessuna ROM selezionata) */}
        {!selected && (
          <div className="sb-play-idle-cta">
            <p className="sb-note">
              Seleziona un gioco dalla Libreria per iniziare, oppure carica una ROM:
            </p>
            <FileLoader
              storage={storage}
              onImported={() => setRefresh((n) => n + 1)}
            />
            <button
              type="button"
              className="sb-btn"
              onClick={() => setActiveTab("library")}
            >
              Vai alla Libreria
            </button>
          </div>
        )}
      </div>

      {/* Panel Libreria — conditional render (nessuno stato background da preservare). */}
      {activeTab === "library" && (
        <div
          id="panel-library"
          role="tabpanel"
          aria-labelledby="tab-library"
          className="sb-tab-panel"
        >
          <Library
            key={refresh}
            storage={storage}
            onSelect={handleLibrarySelect}
          />
          {/* FileLoader canonico in Libreria per importare nuove ROM. */}
          <FileLoader
            storage={storage}
            onImported={() => setRefresh((n) => n + 1)}
          />
        </div>
      )}

      {/* Panel Impostazioni — conditional render.
          Le sotto-sezioni di Settings sono sempre espanse: l'accordion
          (progressive disclosure) è implementato tramite <details>/<summary>
          semantici qui nel wrapper, non modificando Settings.tsx (no-rewrite). */}
      {activeTab === "settings" && (
        <div
          id="panel-settings"
          role="tabpanel"
          aria-labelledby="tab-settings"
          className="sb-tab-panel"
        >
          <div className="sb-accordion-wrap">
            <Settings
              profile={profile}
              onRemap={remap}
              videoSettings={videoSettings}
              onVideoSettingsChange={setVideoSettings}
              saveService={saveService}
              currentRom={currentRomSummary}
              theme={theme}
              onThemeChange={setTheme}
              hapticsEnabled={hapticsEnabled}
              onHapticsChange={async (value) => {
                setHapticsEnabled(value);
                await saveHapticsEnabled(value);
              }}
            />
          </div>
        </div>
      )}

      {/* Panel Info & Privacy — conditional render. Sempre accessibile (compliance). */}
      {activeTab === "info" && (
        <div
          id="panel-info"
          role="tabpanel"
          aria-labelledby="tab-info"
          className="sb-tab-panel"
        >
          <PrivacyNotice variant="section" />
          <StoreComplianceNotice />
          <LegalNotice />
        </div>
      )}

      <footer>
        <LegalNotice />
      </footer>
    </main>
  );
}
