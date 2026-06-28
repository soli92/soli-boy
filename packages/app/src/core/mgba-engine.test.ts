// TSK-123 — MgbaEngine: verifica forward L/R verso API mGBA WASM (EP-018).
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Core } from "../domain/types";

const buttonPress = vi.fn();
const buttonUnpress = vi.fn();

const mockModule = {
  FSInit: vi.fn(async () => {}),
  uploadRom: vi.fn((_file: File, cb?: () => void) => {
    cb?.();
  }),
  loadGame: vi.fn(() => true),
  buttonPress,
  buttonUnpress,
  pauseGame: vi.fn(),
  resumeGame: vi.fn(),
  quitGame: vi.fn(),
  setVolume: vi.fn(),
  filePaths: () => ({
    gamePath: "/game",
    savePath: "/save",
    saveStatePath: "/state",
  }),
  FS: {
    readFile: vi.fn(() => new Uint8Array()),
    writeFile: vi.fn(),
  },
};

vi.mock("@thenick775/mgba-wasm", () => ({
  default: vi.fn(async () => mockModule),
}));

import { MgbaEngine } from "./mgba-engine";

async function makeLoadedMgba() {
  const engine = new MgbaEngine();
  const container = document.createElement("div");
  await engine.load({
    rom: new Blob([new Uint8Array([0x00])]),
    core: "mgba" as Core,
    container,
  });
  return engine;
}

describe("MgbaEngine — shoulder L/R forward (TSK-123)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sendInput('l'/'r') inoltra a buttonPress/buttonUnpress mGBA", async () => {
    const engine = await makeLoadedMgba();

    engine.sendInput("l", true);
    engine.sendInput("r", true);
    engine.sendInput("l", false);
    engine.sendInput("r", false);

    expect(buttonPress).toHaveBeenNthCalledWith(1, "L");
    expect(buttonPress).toHaveBeenNthCalledWith(2, "R");
    expect(buttonUnpress).toHaveBeenNthCalledWith(1, "L");
    expect(buttonUnpress).toHaveBeenNthCalledWith(2, "R");
  });
});
