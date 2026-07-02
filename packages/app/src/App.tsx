import { useEffect, useMemo, useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
// TSK-098 (EP-014 / US-052) — Hook estratto per la pausa/ripresa engine al
// cambio tab. Pre-estrazione la logica (~25 LOC: useEffect + prevTabRef +
// engineRef) viveva inline in AppContent; ora App.tsx è ridotto e l'hook è
// testabile in isolamento (cfr. packages/app/src/domain/useTabPause.ts).
import { useTabPause } from "./domain/useTabPause";
import type { RomRecord } from "./storage/types";
import type { GameButton, SessionState } from "./core/core-wrapper";
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
// TSK-102 (US-053) — wiring preferenza "Avvio automatico dalla libreria":
// hook + porta IndexedDB (chiave `"auto-start-from-library"`, store `config`).
// Stato sollevato a livello App: Settings riceve il toggle, `handleLibrarySelect`
// rispetta il valore per decidere se impostare `autoStartFromLibrary` (flag di
// auto-avvio della selezione corrente) a true o false.
import { useAutoStartConfig } from "./components/Settings/useAutoStartConfig";
// TSK-132 (ADR-009 §4) — StubRtcBridge per e2e EP-019: bridge RTC deterministico
// usato quando il URL param ?rtcPlatform è presente in stub mode.
import { StubRtcBridge } from "./core/stub-engine"; // StubRtcBridge: e2e-only, see stub-engine.ts
// TSK-143 (US-094 / EP-020) — Migrazione app shell alle primitive solids/Radix.
// I componenti Tabs (Radix) sostituiscono l'implementazione manuale di tablist +
// keyboard navigation: Arrow/Home/End/Space/Enter sono gestiti internamente dalla
// primitive, così come `role="tab"`/`role="tablist"`/`role="tabpanel"` e la
// gestione di `aria-selected`/`aria-controls`/`tabindex` (WAI-ARIA APG pattern).
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
// TSK-145 (US-095 / EP-020) — CTA "Vai alla Libreria" migrata a Button variant="outline":
// azione secondaria coerente con il Button primary del FileLoader ("Carica ROM").
import { ThemeSwitcher } from "./components/ThemeSelector/ThemeSwitcher";
import { Button } from "@/components/ui/button";

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

// TSK-132 (EP-019 / ADR-009 §4) — Piattaforma RTC iniettata via URL param
// `?rtcPlatform=<platform>` in stub mode. Usato esclusivamente dagli e2e di
// EP-019 per rendere visibile la `RtcSection` in Settings senza un bridge reale.
// Solo attivo con STUB_ENGINE: in produzione (engine reale) questo param è
// ignorato (il wiring arriverà con i bridge concreti Sprint 16).
const E2E_RTC_PLATFORM =
  STUB_ENGINE && typeof location !== "undefined"
    ? new URLSearchParams(location.search).get("rtcPlatform") ?? undefined
    : undefined;

// TSK-055 — Bundle storage+config selezionato a runtime una sola volta a
// modulo-load. Su web/mobile coincide con i singleton storici IndexedDB
// (comportamento invariato); su desktop Electron è il `NativeFsAdapter`
// iniettato col bridge `window.soliboyDesktop` (TSK-053). Il dominio non
// vede la differenza: consuma `SaveStoragePort`/`ConfigPort`.
//
// TSK-096 (US-051, P3-01) — `selectAdapter()` gira a module-load fuori da
// qualsiasi componente React: una sua eccezione (bridge desktop corrotto,
// init `NativeFsAdapter`, ecc.) farebbe crashare l'intero bundle prima del
// montaggio del root, producendo white screen senza Error Boundary utile.
// La invochiamo difensivamente: se lancia, archiviamo l'errore e `App`
// renderizza un fallback UI di emergenza in luogo dell'albero completo.
type AdapterBundle = ReturnType<typeof selectAdapter>;
let selectedStorage: AdapterBundle["storage"] | null = null;
let selectedConfig: AdapterBundle["config"] | null = null;
let storageInitError: Error | null = null;
try {
  const bundle = selectAdapter();
  selectedStorage = bundle.storage;
  selectedConfig = bundle.config;
} catch (err) {
  storageInitError = err instanceof Error ? err : new Error(String(err));
  console.error("[soli-boy] Storage init failed:", storageInitError);
}

// Messaggio UI canonico del fallback storage; i test lo importano come conseguenza.
export const STORAGE_INIT_ERROR_MESSAGE =
  "Impossibile inizializzare lo storage — ricaricare l'app";

/** Le 4 destinazioni funzionali dell'app. */
const TABS = [
  { id: "play", label: "Play" },
  { id: "library", label: "Libreria" },
  { id: "settings", label: "Impostazioni" },
  { id: "info", label: "Info & Privacy" },
] as const;

type Tab = (typeof TABS)[number]["id"];

/**
 * TSK-096 (US-051) — Fallback di emergenza quando `selectAdapter()` ha
 * lanciato a module-load. Non monta nessun hook che dipende dallo storage:
 * solo messaggio + invito al refresh. Compliance con WAI-ARIA via `role="alert"`.
 */
function StorageInitErrorFallback({ error }: { error: Error }) {
  return (
    <main className="sb-app" role="alert" data-testid="sb-storage-init-error">
      <header className="flex items-center justify-between">
        <h1 className="sb-title sb-title--logo">
          <img className="sb-logo" src={logoUrl} alt="Soli-boy" />
        </h1>
      </header>
      <p className="text-xs text-muted-foreground">{STORAGE_INIT_ERROR_MESSAGE}</p>
      <p className="text-xs text-muted-foreground" data-testid="sb-storage-init-error-detail">
        {error.message}
      </p>
    </main>
  );
}

// Composizione del Core web MVP. Storage reale via `selectAdapter()`.
// TSK-096 — separata da App (thin shell) per rispettare react-hooks/rules-of-hooks.
function AppContent({
  storage,
  config,
}: {
  storage: AdapterBundle["storage"];
  config: AdapterBundle["config"];
}) {
  const stub = useMemo(() => new StubEngine(), []);

  // TSK-132 (EP-019 / ADR-009 §4) — bridge RTC stub per e2e: creato solo se
  // `E2E_RTC_PLATFORM` è valorizzato (URL param `?rtcPlatform=<platform>` in
  // stub mode). Singleton stabile per tutta la vita di AppContent (useMemo senza
  // deps: il valore del param è costante per sessione). In produzione vale `null`
  // e Settings non renderizza RtcSection (prop `rtcBridge` non passata).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stubRtcBridge = useMemo(
    () => (E2E_RTC_PLATFORM ? new StubRtcBridge() : null),
    [],
  );
  const [profile, setProfile] = useState<KeyProfile>(DEFAULT_KEY_PROFILE);
  const [selected, setSelected] = useState<RomRecord | null>(null);
  const [refresh, setRefresh] = useState(0);
  // TSK-100 (US-053) — Auto-start ROM dalla Library (UX-CF1-01 "tap = start").
  // Indica se la selezione corrente proviene dalla Library E deve auto-avviarsi:
  // in caso affermativo il Player avvia la ROM automaticamente, senza richiedere
  // il click su "Avvia". Default false (`handleLibrarySelect` lo imposta a true
  // SOLO se la preferenza utente è ON — vedi TSK-102 sotto).
  //
  // TSK-102 (US-053) — Il valore è ora preferenza-driven via
  // `useAutoStartConfig` (hook + ConfigPort, chiave `auto-start-from-library`,
  // default ON). Con preferenza OFF, `handleLibrarySelect` continua a popolare
  // `selected` e a switchare su Play, ma NON imposta il flag a true: il Player
  // resta in idle finché l'utente non preme "Avvia" (comportamento legacy
  // pre-TSK-100).
  //
  // Backward compat: il flag transita al Player via prop `autoStart`; il
  // Player garantisce no-loop via ref interno (`autoStartedForRomRef` su
  // identità Blob). I path NON-library (FileLoader → setRefresh, banner CTA)
  // NON impostano questo flag a true → Player resta legacy (richiede click
  // "Avvia"). La prop riflette "la selezione corrente è da Library E deve
  // auto-avviare", non "deve auto-avviare in questo istante" (lo stato
  // is-already-started è gestito dal Player).
  const [autoStartFromLibrary, setAutoStartFromLibrary] = useState(false);

  // TSK-101 (US-053) — Gate di conferma cambio gioco (UX-CF1-02).
  // `playerState` traccia a livello App lo stato osservato del Player
  // ("idle" | "loaded" | "running" | "paused"), aggiornato dalla callback
  // `onStateChange` del Player. La sorgente di verità resta nel `CoreWrapper`
  // (R.M1): qui osserviamo solo per decidere se aprire il dialog.
  // `pendingRom` è la ROM tap'd dalla Library mentre il gate è aperto; viene
  // sostituita a `selected` SOLO dopo conferma esplicita dell'utente.
  const [playerState, setPlayerState] = useState<SessionState>("idle");
  const [pendingRom, setPendingRom] = useState<RomRecord | null>(null);

  // INCREMENT 2 — navigazione a tab. Default "play" (emulator-first).
  // TSK-143 (US-094) — La keyboard navigation (Arrow/Home/End) è ora
  // interamente gestita da Radix Tabs (WAI-ARIA APG). Nessun handler manuale.
  const [activeTab, setActiveTab] = useState<Tab>("play");

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
  // TSK-096 (US-051, P1-01): deps includono `config` per soddisfare
  // `react-hooks/exhaustive-deps`. `config` è un singleton di modulo stabile
  // per l'intera vita dell'app (single allocation in `selectAdapter()`),
  // quindi la memoizzazione resta de facto idempotente.
  const videoPort = useMemo(
    () => makeVideoSettingsPort(config),
    [config],
  );
  const { value: videoSettings, setValue: setVideoSettings } =
    useVideoSettings(videoPort);

  // TSK-044 (US-036) — stato tema UI sollevato a livello App. Stessa
  // composizione delle `Resa video`: porta concreta (IndexedDB `config`,
  // chiave canonica `"ui-theme"`) memoizzata, hook che idrata al mount e
  // applica `data-theme` al `<html>`. La preferenza è passata a Settings via
  // prop opzionali — sezione "Aspetto" attiva solo qui (test legacy intatti).
  // TSK-096 (US-051, P1-02): deps idem a `videoPort`.
  const themePort = useMemo(() => makeThemePort(config), [config]);
  const { theme, setTheme } = useTheme(themePort);

  // TSK-066 (US-032) — stato feedback aptico. ConfigPort riusa `config`
  // (store `config`, chiave `haptics-enabled`). Persistenza on `setHapticsEnabled`
  // seguita da `saveHapticsEnabled` (chiamata dal toggle in Settings).
  const { hapticsEnabled, setHapticsEnabled, saveHapticsEnabled } =
    useHapticsConfig(config);

  // TSK-102 (US-053) — preferenza "Avvio automatico dalla libreria".
  // ConfigPort riusa `config` (store `config`, chiave `auto-start-from-library`).
  // Default ON (vedi `DEFAULT_AUTO_START_FROM_LIBRARY` in useAutoStartConfig).
  // La preferenza è CONSULTATA da `handleLibrarySelect`/`confirmGameChange` per
  // decidere se impostare il flag `autoStartFromLibrary` (selezione-corrente) a
  // true (auto-avvio) o false (Player resta in idle, comportamento pre-TSK-100).
  const {
    autoStartFromLibrary: autoStartPreference,
    setAutoStartFromLibrary: setAutoStartPreference,
    saveAutoStartFromLibrary,
  } = useAutoStartConfig(config);

  // TSK-069 (US-033) — Stato presa visione informativa privacy on-device.
  // Stesso pattern di `useTheme`: porta concreta (IndexedDB `config`, chiave
  // canonica `"privacy-ack"`) memoizzata, hook che idrata al mount. Il banner
  // è renderizzato SOLO se l'utente non ha ancora cliccato "Ho capito" in una
  // sessione precedente; la sezione "Privacy" di Settings resta sempre
  // disponibile (vedi `PrivacyNotice variant="section"`).
  // TSK-096 (US-051): deps allineate a `videoPort`/`themePort`.
  const privacyPort = useMemo(() => makePrivacyAckPort(config), [config]);
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

  // INCREMENT 2 — Pausa automatica quando si lascia la tab Play, ripresa
  // automatica al ritorno. Il guard C-01 (resume() no-op su engine non
  // configurato) è già in WasmBoyEngine.resume() → sicuro sempre-montato.
  //
  // TSK-098 (EP-014 / US-052) — Logica estratta in `useTabPause` (domain/),
  // che incapsula `useEffect` + `prevTabRef` + `engineRef` con semantica
  // identica. Stima complessità cognitiva: AppContent < 15 dopo l'estrazione
  // (era ~22 includendo il blocco rimosso).
  //
  // Razionale dell'extraction: pause su engine già in pausa è un no-op
  // sicuro (WasmBoyEngine.pause() chiama WasmBoy.pause() idempotente); idem
  // resume su idle (guard `configured`). Non serve l'accesso al `state` di
  // CoreWrapper — basta `selected` come prova "il gioco è in sessione".
  useTabPause(engine, activeTab, selected, "play");

  // Handler selezione ROM dalla Library: seleziona la ROM e porta l'utente
  // sulla tab Play (OQ-02: auto-switch preferibile per nielsen-1 / flow-ux-1).
  // TSK-100 (US-053) — imposta `autoStartFromLibrary=true` così il Player avvia
  // automaticamente la ROM (UX-CF1-01 "tap = start").
  //
  // TSK-102 (US-053) — Il flag `autoStartFromLibrary` (selezione-corrente) è
  // ora driven dalla preferenza utente `autoStartPreference` (Settings →
  // "Avvio automatico dalla libreria", default ON): con preferenza OFF il
  // Player NON auto-avvia; l'utente preme "Avvia" dal Player (AC4). Il tap
  // continua a popolare `selected` e a switchare su Play (AC4: "seleziona la
  // ROM e cambia tab Play, ma il Player non avvia automaticamente").
  //
  // TSK-101 (US-053) — Gate di conferma cambio gioco (UX-CF1-02): se il Player
  // è in stato `running` o `paused` con una ROM DIVERSA, intercettiamo il tap
  // e apriamo un dialog modale ("Cambia gioco?") invece di sostituire `selected`.
  // Casi:
  // - stesso `rom.id` → no-op (AC2). Già selezionato/in esecuzione, niente da fare.
  //   Si entra comunque in Play (lo facciamo sotto, ma senza re-impostare
  //   `autoStartFromLibrary=true`: la ROM è la stessa, evitiamo cicli di
  //   auto-start sul Player già running).
  // - Player idle/loaded (mai avviato o stoppato) → swap diretto, senza dialog.
  // - Player running/paused con ROM DIVERSA → mostra dialog; lo swap effettivo
  //   avviene in `confirmGameChange`.
  function handleLibrarySelect(rom: RomRecord) {
    // AC2: stessa ROM corrente → no-op (no dialog, no re-trigger autoStart).
    if (selected && selected.id === rom.id) {
      setActiveTab("play");
      return;
    }
    // AC1: gioco attivo (running/paused) con ROM diversa → gate.
    const gameActive = playerState === "running" || playerState === "paused";
    if (selected && gameActive) {
      setPendingRom(rom);
      return;
    }
    // Player idle/loaded (o nessuna ROM precedente) → swap diretto.
    setSelected(rom);
    // TSK-102 (US-053) — solo se la preferenza è ON propaghiamo il flag di
    // auto-avvio al Player; con preferenza OFF resta `false` (Player in idle).
    setAutoStartFromLibrary(autoStartPreference);
    setActiveTab("play");
  }

  // TSK-101 (US-053) — Conferma del dialog "Cambia gioco?" (AC4).
  // Pipeline: stop dell'engine corrente (forza `idle` lato Player → l'effect
  // di autoStart riarmato ripartirà con la nuova ROM) → swap `selected` →
  // chiude dialog e porta su Play. `engine.stop()` è idempotente
  // (vedi WasmBoyEngine stop, anche su engine non configurato).
  function confirmGameChange() {
    if (!pendingRom) return;
    engine.stop();
    setSelected(pendingRom);
    // TSK-102 (US-053) — la conferma del gate eredita la preferenza utente
    // sullo stesso asse di `handleLibrarySelect`: con preferenza ON la nuova
    // ROM auto-avvia, con OFF il Player resta in idle e attende "Avvia".
    setAutoStartFromLibrary(autoStartPreference);
    setPendingRom(null);
    setActiveTab("play");
  }

  // TSK-101 (US-053) — Annulla dialog "Cambia gioco?" (AC3).
  // Dialog chiuso, ROM in esecuzione non cambiata, nessun side-effect.
  function cancelGameChange() {
    setPendingRom(null);
  }

  // TSK-108 (US-056) — Prima di rimuovere la ROM in esecuzione, ferma il Player.
  function handleBeforeRemoveRom(romId: string) {
    if (selected?.id !== romId) return;
    engine.stop();
    setSelected(null);
    setAutoStartFromLibrary(false);
    setPlayerState("idle");
    setPendingRom(null);
  }

  return (
    <div className="proto-root sb-app">
      {/* TSK-143 (US-094 / EP-020) + EP-021 — Shell prototipo: header con logo,
          tab inline centrate e quick theme toggle; contenuto scrollabile sotto.
          Radix Tabs: pattern WAI-ARIA APG completo; `aria-label` "Sezioni app"
          preservato per e2e. */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as Tab)}
        className="flex flex-col flex-1 min-h-0"
      >
        <header className="sb-app-header">
          <h1 className="sb-title sb-title--logo m-0">
            <img className="sb-logo" src={logoUrl} alt="Soli-boy" />
          </h1>

          <nav className="sb-app-header__nav" aria-label="Navigazione principale">
            <TabsList
              aria-label="Sezioni app"
              className="sb-app-header__tabs w-full rounded-none border-0 bg-transparent p-0 overflow-x-auto"
            >
              {TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </nav>

          <ThemeSwitcher theme={theme} onThemeChange={setTheme} />
        </header>

        <main className="sb-app-main">
          {!privacyAck && (
            <PrivacyNotice variant="banner" onAcknowledge={ackPrivacy} />
          )}
          <UpdateBanner />

        {/* Panel Play — SEMPRE montato via `forceMount`. Radix imposta
            `data-state="inactive"` + attributo `hidden` sull'elemento quando
            la tab non è attiva; la utility Tailwind
            `data-[state=inactive]:hidden` è ridondante ma difensiva
            (garantisce `display:none` anche se `hidden` HTML fosse sovrascritto
            da un `display` esplicito). */}
        <TabsContent
          value="play"
          forceMount
          data-testid="panel-play"
          className="flex flex-col gap-5 data-[state=inactive]:hidden mt-0"
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
            touchConfigStorage={config}
            autoStart={autoStartFromLibrary}
            onStateChange={setPlayerState}
          />
          {/* EP-021 — CTA idle stile prototipo: drop-zone con invito a Libreria.
              Il contenitore non è focusabile (no role=button) per evitare
              nested-interactive con il Button interno (axe WCAG). */}
          {!selected && (
            <div
              className="drop-zone"
              onClick={() => setActiveTab("library")}
              data-testid="play-idle-drop-zone"
            >
              <div className="text-3xl mb-2" aria-hidden="true">
                📁
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Carica una ROM per iniziare
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Trascina un file .gb · .gbc · .gba oppure vai alla Libreria
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab("library");
                }}
              >
                Vai alla Libreria
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="library"
          data-testid="panel-library"
          className="flex flex-col gap-5 mt-0"
        >
          <Library
            key={refresh}
            storage={storage}
            activeRomId={selected?.id}
            onSelect={handleLibrarySelect}
            onBeforeRemove={handleBeforeRemoveRom}
          />
          <FileLoader
            storage={storage}
            onImported={() => setRefresh((n) => n + 1)}
          />
        </TabsContent>

        <TabsContent
          value="settings"
          data-testid="panel-settings"
          className="flex flex-col gap-5 mt-0"
        >
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
            autoStartFromLibrary={autoStartPreference}
            onAutoStartChange={async (value) => {
              setAutoStartPreference(value);
              await saveAutoStartFromLibrary(value);
            }}
            rtcPlatform={selected?.platform ?? E2E_RTC_PLATFORM}
            rtcBridge={engine.rtcBridge ?? stubRtcBridge ?? undefined}
          />
        </TabsContent>

        <TabsContent
          value="info"
          data-testid="panel-info"
          className="flex flex-col gap-5 mt-0"
        >
          <PrivacyNotice variant="section" />
          <StoreComplianceNotice />
          <LegalNotice />
        </TabsContent>
        </main>
      </Tabs>

      {/* TSK-101 (US-053) + TSK-153 (EP-020) — AlertDialog Radix per conferma
          cambio gioco. Portal, focus trap, Esc e backdrop nativi. */}
      <AlertDialog
        open={pendingRom !== null}
        onOpenChange={(open) => {
          if (!open) cancelGameChange();
        }}
      >
        <AlertDialogContent data-testid="confirm-game-change-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Cambia gioco?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRom && selected
                ? `Stai per avviare "${pendingRom.title}" mentre "${selected.title}" è in corso. `
                : pendingRom
                  ? `Stai per avviare "${pendingRom.title}" mentre un altro gioco è in corso. `
                  : ""}
              Lo stato corrente non sarà salvato in autosave: i progressi non
              salvati andranno persi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-action="cancel">Annulla</AlertDialogCancel>
            <AlertDialogAction
              data-action="confirm"
              onClick={confirmGameChange}
            >
              Cambia gioco
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// TSK-096 — Thin shell: zero hook → nessuna violazione rules-of-hooks.
// Il gate d'errore è stabile per l'intera vita del modulo (module-load singleton).
export function App() {
  if (storageInitError !== null) {
    return <StorageInitErrorFallback error={storageInitError} />;
  }
  return <AppContent storage={selectedStorage!} config={selectedConfig!} />;
}
