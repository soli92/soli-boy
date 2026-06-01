// TSK-028 — MgbaEngine: adapter EmulatorEngine reale su mGBA WASM (GBA, ADR-005).
// Lib: @thenick775/mgba-wasm (MPL-2.0), core mGBA via Emscripten. Import dinamico:
// non pesa sul bundle/stub finché non si avvia un gioco GBA.
// TSK-030 (ADR-006) — esteso con snapshot/restore + SRAM (US-016/US-017).
//
// NOTA (onestà): non verificato a runtime in questo repo (manca una ROM GBA libera
// per gli specifici flussi di save). L'adapter segue l'API documentata
// (dist/mgba.d.ts); validare con e2e quando disponibile (vedi public/test-roms/README.md).
import type {
  AudioSettings,
  EmulatorEngine,
  EngineCapabilities,
  GameButton,
  LoadOptions,
  SpeedSettings,
} from "./core-wrapper";

/**
 * Superficie minima dell'API mGBA usata (dist/mgba.d.ts di @thenick775/mgba-wasm).
 * TSK-030: estesa con saveState/loadState slot-based, getSave, filePaths, gameName,
 * saveName e accesso al filesystem virtuale `FS` (Emscripten IDBFS).
 */
interface MgbaFS {
  readFile(path: string): Uint8Array;
  writeFile(path: string, data: Uint8Array | string): void;
  unlink?(path: string): void;
}
interface MgbaModule {
  FSInit(): Promise<void>;
  uploadRom(file: File, callback?: () => void): void;
  loadGame(romPath: string, savePathOverride?: string): boolean;
  buttonPress(name: string): void;
  buttonUnpress(name: string): void;
  pauseGame(): void;
  resumeGame(): void;
  quitGame(): void;
  setVolume(percent: number): void;
  filePaths(): {
    gamePath: string;
    savePath: string;
    saveStatePath: string;
  };
  /** TSK-030 / US-016 — save state slot-based (file scritto in saveStatePath). */
  saveState(slot: number): boolean;
  loadState(slot: number): boolean;
  /** TSK-030 / US-017 — legge la SRAM del gioco corrente. */
  getSave(): Uint8Array | null;
  /** TSK-030 — flush IDBFS dopo scritture. */
  FSSync(): Promise<void>;
  saveName?: string;
  gameName?: string;
  FS: MgbaFS;
}

const BTN: Record<GameButton, string> = {
  up: "Up", down: "Down", left: "Left", right: "Right",
  a: "A", b: "B", start: "Start", select: "Select",
};

/**
 * TSK-030 — slot riservato a soli-boy per la cattura del save state come bytes.
 * Il dominio (SaveService, TSK-032) gestisce gli slot logici utente; questo è solo
 * uno slot tecnico del filesystem mGBA usato come buffer di estrazione.
 */
const MGBA_SNAPSHOT_SLOT = 0;

export class MgbaEngine implements EmulatorEngine {
  // TSK-030: mGBA supporta save state e SRAM → entrambe capability ON.
  readonly capabilities: EngineCapabilities = {
    rewind: false,
    saveStates: true,
    sram: true,
  };
  private module: MgbaModule | null = null;
  /** Path del file rom caricato (serve a derivare il nome del save state file). */
  private gameFileName: string | null = null;

  async load(opts: LoadOptions): Promise<void> {
    if (!opts.container) throw new Error("MgbaEngine.load: container DOM mancante.");
    const canvas = this.ensureCanvas(opts.container);

    const mod = await import("@thenick775/mgba-wasm");
    const factory = (mod.default ?? mod) as unknown as (o: {
      canvas: HTMLCanvasElement;
    }) => Promise<MgbaModule>;
    this.module = await factory({ canvas });
    await this.module.FSInit();

    const name = "game.gba";
    const file = new File([opts.rom], name, { type: "application/octet-stream" });
    await new Promise<void>((resolve) => this.module!.uploadRom(file, () => resolve()));
    const ok = this.module.loadGame(`${this.module.filePaths().gamePath}/${name}`);
    if (!ok) throw new Error("MgbaEngine.load: loadGame fallito.");
    this.gameFileName = name;
  }

  start(): void {
    this.module?.resumeGame();
  }
  pause(): void {
    this.module?.pauseGame();
  }
  resume(): void {
    this.module?.resumeGame();
  }
  stop(): void {
    this.module?.quitGame();
    this.module = null;
    this.gameFileName = null;
  }

  setAudio(settings: AudioSettings): void {
    this.module?.setVolume(settings.mute ? 0 : Math.round(Math.min(1, Math.max(0, settings.volume)) * 100));
  }

  sendInput(button: GameButton, pressed: boolean): void {
    if (!this.module) return;
    if (pressed) this.module.buttonPress(BTN[button]);
    else this.module.buttonUnpress(BTN[button]);
  }

  setSpeed(_settings: SpeedSettings): void {
    // Fast-forward/rewind mGBA non mappati finché non validati a runtime (capabilities.rewind=false).
  }

  /**
   * TSK-030 / US-016 — cattura save state via API mGBA reale.
   * Strategia: scrive sul filesystem virtuale al `saveStatePath` (slot tecnico),
   * legge i bytes via `FS.readFile`, ritorna il blob raw. Il file dello slot è
   * un payload mGBA nativo: il dominio lo tratta come opaque blob.
   * Reject onesto se mGBA non è inizializzato o l'API saveState non riesce.
   */
  async snapshot(): Promise<Uint8Array> {
    const mod = this.requireModule("snapshot");
    if (typeof mod.saveState !== "function") {
      throw new Error("MgbaEngine.snapshot: API mGBA saveState non disponibile a runtime.");
    }
    const ok = mod.saveState(MGBA_SNAPSHOT_SLOT);
    if (!ok) throw new Error("MgbaEngine.snapshot: mGBA saveState ha riportato false (slot tecnico non scritto).");
    await this.flushFs();
    const path = this.saveStateFilePath(MGBA_SNAPSHOT_SLOT);
    let bytes: Uint8Array;
    try {
      bytes = mod.FS.readFile(path);
    } catch (e) {
      throw new Error(`MgbaEngine.snapshot: impossibile leggere il file save state da ${path} (${(e as Error).message}).`);
    }
    return new Uint8Array(bytes);
  }

  /**
   * TSK-030 / US-016 — ripristina lo stato da uno snapshot prodotto da `snapshot()`.
   * Strategia: scrive i bytes nello slot tecnico via `FS.writeFile`, poi chiama
   * `loadState(slot)`. Reject onesto se l'API non è disponibile o `loadState`
   * riporta false (file corrotto/non riconosciuto da mGBA).
   */
  async restore(state: Uint8Array): Promise<void> {
    const mod = this.requireModule("restore");
    if (typeof mod.loadState !== "function") {
      throw new Error("MgbaEngine.restore: API mGBA loadState non disponibile a runtime.");
    }
    const path = this.saveStateFilePath(MGBA_SNAPSHOT_SLOT);
    try {
      mod.FS.writeFile(path, new Uint8Array(state));
    } catch (e) {
      throw new Error(`MgbaEngine.restore: impossibile scrivere il file save state in ${path} (${(e as Error).message}).`);
    }
    const ok = mod.loadState(MGBA_SNAPSHOT_SLOT);
    if (!ok) {
      throw new Error(
        "MgbaEngine.restore: mGBA loadState ha riportato false (payload non riconosciuto; cross-engine save states non supportati — ADR-006).",
      );
    }
  }

  /**
   * TSK-030 / US-017 — legge la SRAM corrente via `getSave()`.
   * Ritorna `null` se nessuna SRAM è presente (es. gioco senza battery RAM).
   * Reject onesto solo se il modulo non è inizializzato (non c'è gioco caricato).
   */
  async getSram(): Promise<Uint8Array | null> {
    const mod = this.requireModule("getSram");
    if (typeof mod.getSave !== "function") {
      throw new Error("MgbaEngine.getSram: API mGBA getSave non disponibile a runtime.");
    }
    const save = mod.getSave();
    if (!save || save.length === 0) return null;
    return new Uint8Array(save);
  }

  /**
   * TSK-030 / US-017 — inietta dati SRAM nel filesystem virtuale al `saveName`
   * corrente, così il core li legge come save in-game della cartuccia.
   * Reject onesto se il path SRAM non è noto (nessun gioco caricato) o la FS
   * non è scrivibile.
   */
  async loadSram(data: Uint8Array): Promise<void> {
    const mod = this.requireModule("loadSram");
    const path = mod.saveName;
    if (!path) {
      throw new Error("MgbaEngine.loadSram: saveName non impostato (nessun gioco caricato).");
    }
    try {
      mod.FS.writeFile(path, new Uint8Array(data));
    } catch (e) {
      throw new Error(`MgbaEngine.loadSram: impossibile scrivere SRAM in ${path} (${(e as Error).message}).`);
    }
    await this.flushFs();
  }

  /** Compone il path del file save state per uno slot dato la convenzione mGBA. */
  private saveStateFilePath(slot: number): string {
    const mod = this.requireModule("saveStateFilePath");
    const dir = mod.filePaths().saveStatePath;
    const baseName = (mod.gameName ?? this.gameFileName ?? "game.gba").split("/").pop() ?? "game.gba";
    return `${dir}/${baseName}.ss${slot}`;
  }

  private requireModule(op: string): MgbaModule {
    if (!this.module) {
      throw new Error(`MgbaEngine.${op}: mGBA non inizializzato (chiamare load prima).`);
    }
    return this.module;
  }

  /** Sincronizza IDBFS dopo scritture; tollera l'assenza dell'API (best-effort). */
  private async flushFs(): Promise<void> {
    const mod = this.module;
    if (!mod) return;
    if (typeof mod.FSSync === "function") {
      try {
        await mod.FSSync();
      } catch {
        // best-effort: la persistenza IDBFS è gestita anche al quitGame; non blocchiamo.
      }
    }
  }

  private ensureCanvas(container: HTMLElement): HTMLCanvasElement {
    const existing = container.querySelector("canvas");
    if (existing) return existing;
    const canvas = document.createElement("canvas");
    canvas.className = "mgba-canvas";
    container.appendChild(canvas);
    return canvas;
  }
}
