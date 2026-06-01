// TSK-030 / US-016 + US-017 — StubEngine: round-trip deterministico
// snapshot/restore + SRAM. Lo StubEngine serve a esercitare il SaveService
// (TSK-032) in unit/e2e senza WASM/ROM reali (ADR-006): perciò il round-trip
// deve essere effettivamente verificabile, non un no-op cieco.
import { describe, expect, it } from "vitest";
import { StubEngine } from "./stub-engine";

describe("StubEngine.capabilities (TSK-030)", () => {
  it("dichiara saveStates + sram supportati (rewind no)", () => {
    const e = new StubEngine();
    expect(e.capabilities).toEqual({ rewind: false, saveStates: true, sram: true });
  });
});

describe("StubEngine snapshot/restore round-trip (US-016)", () => {
  it("ripristina lo stato interno (loaded + audio + lastInput) da uno snapshot", async () => {
    const e = new StubEngine();
    await e.load({ rom: new Blob(["x"]), core: "gambatte" });
    e.setAudio({ volume: 0.42, mute: true });
    e.sendInput("a", true);

    const snap = await e.snapshot();
    expect(snap).toBeInstanceOf(Uint8Array);
    expect(snap.length).toBeGreaterThan(0);

    // Muta lo stato dopo lo snapshot
    e.setAudio({ volume: 1, mute: false });
    e.sendInput("b", false);
    e.stop();
    expect(e.loaded).toBe(false);

    // Ripristina e verifica
    await e.restore(snap);
    expect(e.loaded).toBe(true);
    expect(e.audio).toEqual({ volume: 0.42, mute: true });
    expect(e.lastInput).toEqual({ button: "a", pressed: true });
  });

  it("ogni snapshot è distinguibile (tick monotono): due snapshot consecutivi non sono byte-uguali", async () => {
    const e = new StubEngine();
    const a = await e.snapshot();
    const b = await e.snapshot();
    expect(a.length).toBe(b.length);
    let differ = false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        differ = true;
        break;
      }
    }
    expect(differ).toBe(true);
  });

  it("restore rifiuta payload con magic header errato (formato non riconosciuto)", async () => {
    const e = new StubEngine();
    const bogus = new TextEncoder().encode("NOTASOLISNAP{}");
    await expect(e.restore(bogus)).rejects.toThrow(/magic header non corrisponde/i);
  });

  it("restore rifiuta payload troppo corto", async () => {
    const e = new StubEngine();
    await expect(e.restore(new Uint8Array([1, 2, 3]))).rejects.toThrow(/troppo corto/i);
  });

  it("restore rifiuta JSON malformato dopo il magic header", async () => {
    const e = new StubEngine();
    const header = new TextEncoder().encode("SOLISTUB1");
    const body = new TextEncoder().encode("{not-json");
    const blob = new Uint8Array(header.length + body.length);
    blob.set(header, 0);
    blob.set(body, header.length);
    await expect(e.restore(blob)).rejects.toThrow(/JSON non valido/i);
  });
});

describe("StubEngine SRAM (US-017)", () => {
  it("getSram ritorna null finché loadSram non è stato chiamato", async () => {
    const e = new StubEngine();
    await expect(e.getSram()).resolves.toBeNull();
  });

  it("loadSram + getSram round-trippano i bytes", async () => {
    const e = new StubEngine();
    const data = new Uint8Array([1, 2, 3, 4, 5, 250, 251, 252]);
    await e.loadSram(data);
    const out = await e.getSram();
    expect(out).not.toBeNull();
    expect(Array.from(out!)).toEqual(Array.from(data));
  });

  it("getSram ritorna una copia difensiva (mutare l'output non altera lo stato interno)", async () => {
    const e = new StubEngine();
    await e.loadSram(new Uint8Array([10, 20, 30]));
    const first = (await e.getSram())!;
    first[0] = 99;
    const second = (await e.getSram())!;
    expect(second[0]).toBe(10);
  });

  it("loadSram fa una copia difensiva (mutare l'input dopo loadSram non altera lo stato)", async () => {
    const e = new StubEngine();
    const src = new Uint8Array([7, 8, 9]);
    await e.loadSram(src);
    src[0] = 99;
    const out = (await e.getSram())!;
    expect(out[0]).toBe(7);
  });

  it("la SRAM è preservata dopo un snapshot/restore (stato indipendente dal save state)", async () => {
    // Modello: la SRAM è la cartuccia (US-017), il save state è l'istantanea
    // dell'emulatore (US-016). Lo StubEngine tiene la SRAM esterna allo snapshot
    // per modellare questa distinzione e supportare i test del SaveService che
    // gestisce i due store separatamente (ADR-002 / ADR-006).
    const e = new StubEngine();
    await e.loadSram(new Uint8Array([11, 22, 33]));
    const snap = await e.snapshot();
    await e.restore(snap);
    const out = (await e.getSram())!;
    expect(Array.from(out)).toEqual([11, 22, 33]);
  });
});
