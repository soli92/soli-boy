import { useEffect, useMemo, useState } from "react";
import { FileLoader } from "./components/FileLoader/FileLoader";
import { Library } from "./components/Library/Library";
import { Player } from "./components/Player/Player";
import { Settings } from "./components/Settings/Settings";
import { LegalNotice } from "./components/LegalNotice";
import { indexedDbStorage } from "./storage/indexeddb-adapter";
import { StubEngine } from "./core/stub-engine";
import { EmulatorJsEngine } from "./core/emulatorjs-engine";
import {
  DEFAULT_KEY_PROFILE,
  InputMapping,
  type KeyProfile,
} from "./domain/input-mapping";
import type { RomRecord } from "./storage/types";
import type { EmulatorEngine, GameButton } from "./core/core-wrapper";

// TSK-022: selezione engine. Default StubEngine (test/dev/e2e deterministici);
// EmulatorJsEngine (reale) opt-in via ?engine=emulatorjs (ADR-004).
function selectEngine(): { engine: EmulatorEngine; real: boolean } {
  const real =
    typeof location !== "undefined" &&
    new URLSearchParams(location.search).get("engine") === "emulatorjs";
  return { engine: real ? new EmulatorJsEngine() : new StubEngine(), real };
}

// Composizione del Core web MVP. Storage reale (IndexedDB).
export function App() {
  const storage = indexedDbStorage;
  const { engine, real } = useMemo(selectEngine, []);
  const [profile, setProfile] = useState<KeyProfile>(DEFAULT_KEY_PROFILE);
  const [selected, setSelected] = useState<RomRecord | null>(null);
  const [refresh, setRefresh] = useState(0);

  // Routing input fisici → core (US-012), basato sul profilo corrente.
  const input = useMemo(
    () => new InputMapping((b, p) => engine.sendInput(b, p), profile),
    [engine, profile],
  );
  useEffect(() => {
    // Con engine reale l'input tastiera/gamepad è gestito nativamente da EmulatorJS
    // (ADR-004): il wiring globale resta solo per lo StubEngine / controlli app.
    if (real) return;
    const down = (e: KeyboardEvent) => input.keyDown(e.key);
    const up = (e: KeyboardEvent) => input.keyUp(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [input, real]);

  function remap(key: string, button: GameButton) {
    setProfile((p) => ({ ...p, [key]: button }));
  }

  return (
    <main className="sb-app">
      <header className="sd-flex sd-items-center sd-between">
        <span className="sb-title">Soli-boy</span>
      </header>

      <FileLoader storage={storage} onImported={() => setRefresh((n) => n + 1)} />

      <Library key={refresh} storage={storage} onSelect={setSelected} />

      {selected && (
        <Player
          engine={engine}
          rom={{ rom: selected.fileBlob, core: selected.core }}
          title={selected.title}
        />
      )}

      <Settings profile={profile} onRemap={remap} />

      <LegalNotice />
    </main>
  );
}
