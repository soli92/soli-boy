// TSK-057 (US-025) — Test del componente UpdateBanner e dell'hook useUpdater.
//
// Struttura:
//  1. useUpdater — test dell'hook in isolamento (stati, eventi, guard web).
//  2. UpdateBanner — test del componente (render condizionale, testo, a11y).
//
// Pattern di mock: il bridge `window.soliboyDesktop` è simulato tramite un
// helper `makeBridge()` che restituisce un oggetto con `onUpdateEvent`
// (registra il listener, ritorna un unsubscribe) e `quitAndInstall` (spy).
// Il windowRef è iniettato direttamente nell'hook per isolare i test da
// `globalThis.window` (stesso pattern di `select-adapter.test.ts`).

import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UPDATE_LABELS, UpdateBanner } from "./UpdateBanner";
import { useUpdater } from "./useUpdater";
import type { UpdateProgress } from "./useUpdater";

// ── Bridge mock ────────────────────────────────────────────────────────────────

type UpdateEventCallback = (event: { type: string; payload?: unknown }) => void;

function makeBridge() {
  let listener: UpdateEventCallback | null = null;
  const unsubscribe = vi.fn(() => {
    listener = null;
  });
  const onUpdateEvent = vi.fn((cb: UpdateEventCallback) => {
    listener = cb;
    return unsubscribe;
  });
  const quitAndInstall = vi.fn();

  /** Emette un evento al listener corrente (simula il main process). */
  function emit(type: string, payload?: unknown) {
    if (!listener) throw new Error("Nessun listener registrato");
    listener({ type, payload });
  }

  return { onUpdateEvent, quitAndInstall, emit };
}

/** Crea un windowRef strutturalmente compatibile con l'hook (cast tramite unknown). */
function makeWindowRef(bridge: ReturnType<typeof makeBridge>) {
  return { soliboyDesktop: bridge } as unknown as Parameters<typeof useUpdater>[0];
}

// ── useUpdater ─────────────────────────────────────────────────────────────────

describe("useUpdater (TSK-057)", () => {
  it("restituisce phase:idle allo stato iniziale", () => {
    const bridge = makeBridge();
    const { result } = renderHook(() => useUpdater(makeWindowRef(bridge)));
    expect(result.current.phase).toBe("idle");
  });

  it("transita a checking su evento 'checking'", () => {
    const bridge = makeBridge();
    const { result } = renderHook(() => useUpdater(makeWindowRef(bridge)));
    act(() => bridge.emit("checking"));
    expect(result.current.phase).toBe("checking");
  });

  it("transita a available su evento 'available'", () => {
    const bridge = makeBridge();
    const { result } = renderHook(() => useUpdater(makeWindowRef(bridge)));
    act(() => bridge.emit("available", {}));
    expect(result.current.phase).toBe("available");
  });

  it("transita a not-available su evento 'not-available'", () => {
    const bridge = makeBridge();
    const { result } = renderHook(() => useUpdater(makeWindowRef(bridge)));
    act(() => bridge.emit("not-available"));
    expect(result.current.phase).toBe("not-available");
  });

  it("transita a progress e porta il payload percentuale", () => {
    const bridge = makeBridge();
    const { result } = renderHook(() => useUpdater(makeWindowRef(bridge)));
    const progressPayload: UpdateProgress = { percent: 42, bytesPerSecond: 1000, transferred: 42000, total: 100000 };
    act(() => bridge.emit("progress", progressPayload));
    expect(result.current.phase).toBe("progress");
    expect(result.current.progress?.percent).toBe(42);
  });

  it("transita a downloaded su evento 'downloaded'", () => {
    const bridge = makeBridge();
    const { result } = renderHook(() => useUpdater(makeWindowRef(bridge)));
    act(() => bridge.emit("downloaded", {}));
    expect(result.current.phase).toBe("downloaded");
  });

  it("transita a error su evento 'error' e porta il messaggio", () => {
    const bridge = makeBridge();
    const { result } = renderHook(() => useUpdater(makeWindowRef(bridge)));
    act(() => bridge.emit("error", "Connessione rifiutata"));
    expect(result.current.phase).toBe("error");
    expect(result.current.errorMessage).toBe("Connessione rifiutata");
  });

  it("espone quitAndInstall quando il bridge è presente", () => {
    const bridge = makeBridge();
    const { result } = renderHook(() => useUpdater(makeWindowRef(bridge)));
    expect(result.current.quitAndInstall).toBeDefined();
  });

  it("quitAndInstall delega al bridge.quitAndInstall()", () => {
    const bridge = makeBridge();
    const { result } = renderHook(() => useUpdater(makeWindowRef(bridge)));
    act(() => {
      result.current.quitAndInstall?.();
    });
    expect(bridge.quitAndInstall).toHaveBeenCalledTimes(1);
  });

  it("chiama unsubscribe all'unmount (cleanup)", () => {
    const bridge = makeBridge();
    const { unmount } = renderHook(() => useUpdater(makeWindowRef(bridge)));
    unmount();
    expect(bridge.onUpdateEvent.mock.results[0].value).toBe(bridge.onUpdateEvent.mock.results[0].value);
    // Il listener è stato rimosso (listener interno è null dopo unsubscribe).
    // Verifica indiretta: emettere dopo unmount non deve lanciare perché il cleanup
    // ha chiamato unsubscribe che azzera `listener` nel bridge mock.
    expect(() => bridge.emit("checking")).toThrow("Nessun listener registrato");
  });

  // ── Guard web (no bridge) ───────────────────────────────────────────────────

  it("è no-op senza windowRef (SSR / env senza window)", () => {
    const { result } = renderHook(() => useUpdater(undefined));
    expect(result.current.phase).toBe("idle");
    expect(result.current.quitAndInstall).toBeUndefined();
  });

  it("è no-op con windowRef senza soliboyDesktop (runtime web)", () => {
    const emptyWindow = {} as unknown as Parameters<typeof useUpdater>[0];
    const { result } = renderHook(() => useUpdater(emptyWindow));
    expect(result.current.phase).toBe("idle");
    expect(result.current.quitAndInstall).toBeUndefined();
  });
});

// ── UpdateBanner ───────────────────────────────────────────────────────────────

describe("UpdateBanner — guard web (TSK-057)", () => {
  it("non renderizza nulla su web (nessun bridge)", () => {
    // Usiamo il default di useUpdater (window jsdom senza soliboyDesktop).
    const { container } = render(<UpdateBanner />);
    expect(container.firstChild).toBeNull();
  });
});

// Helper: renderizza UpdateBanner iniettando un bridge tramite spy su useUpdater.
// Per testare il render del componente senza accoppiarlo all'implementazione
// dell'hook, utilizziamo vi.mock su useUpdater e sostituiamo il suo ritorno.
// Così i test del componente restano indipendenti dai dettagli dell'hook.

// NOTE: vi.mock viene eseguito prima dei test nella zona module. Lo usiamo
// per fornire stati controllati al componente.

vi.mock("./useUpdater", async (importOriginal) => {
  const original = await importOriginal<typeof import("./useUpdater")>();
  return {
    ...original,
    // Lasciamo il modulo originale; sovrascriviamo useUpdater in ogni test
    // tramite vi.spyOn per non rompere i test dell'hook sopra (che usano
    // l'originale). Vedi commento sotto.
  };
});

// Strategia: useUpdater è importato nel componente; nei test del componente
// eseguiamo vi.spyOn per sostituire il return value. Funziona perché
// vi.mock trasforma il modulo in un oggetto mutabile.
const updaterModule = await import("./useUpdater");

function spyUpdater(overrides: Partial<ReturnType<typeof updaterModule.useUpdater>>) {
  return vi.spyOn(updaterModule, "useUpdater").mockReturnValue({
    phase: "idle",
    quitAndInstall: undefined,
    ...overrides,
  });
}

describe("UpdateBanner — rendering per fase (TSK-057)", () => {
  it("non renderizza nulla in fase 'idle' anche con bridge presente", () => {
    const spy = spyUpdater({ phase: "idle", quitAndInstall: vi.fn() });
    const { container } = render(<UpdateBanner />);
    // Il guard web (quitAndInstall undefined) fa ritornare null; ma qui
    // simluiamo desktop con quitAndInstall definita. In fase idle il
    // componente non mostra il banner.
    // Attenzione: il guard primario è `!quitAndInstall` → null. Con
    // quitAndInstall definita il componente entra nel render ma mostra nulla
    // per idle/not-available/checking.
    expect(container.firstChild).toBeNull();
    spy.mockRestore();
  });

  it("non renderizza nulla in fase 'not-available'", () => {
    const spy = spyUpdater({ phase: "not-available", quitAndInstall: vi.fn() });
    const { container } = render(<UpdateBanner />);
    expect(container.firstChild).toBeNull();
    spy.mockRestore();
  });

  it("non renderizza nulla in fase 'checking'", () => {
    const spy = spyUpdater({ phase: "checking", quitAndInstall: vi.fn() });
    const { container } = render(<UpdateBanner />);
    expect(container.firstChild).toBeNull();
    spy.mockRestore();
  });

  it("mostra testo 'Aggiornamento disponibile' in fase 'available'", () => {
    const spy = spyUpdater({ phase: "available", quitAndInstall: vi.fn() });
    render(<UpdateBanner />);
    expect(screen.getByTestId("sb-update-banner")).toBeInTheDocument();
    expect(screen.getByText(UPDATE_LABELS.available)).toBeInTheDocument();
    spy.mockRestore();
  });

  it("mostra il progresso percentuale in fase 'progress'", () => {
    const spy = spyUpdater({
      phase: "progress",
      progress: { percent: 65 },
      quitAndInstall: vi.fn(),
    });
    render(<UpdateBanner />);
    expect(screen.getByText(UPDATE_LABELS.downloading)).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument();
    // Elemento <progress> con value corretto
    const progressEl = screen.getByRole("progressbar");
    expect(progressEl).toBeInTheDocument();
    expect(progressEl).toHaveAttribute("value", "65");
    spy.mockRestore();
  });

  it("mostra pulsante 'Riavvia per aggiornare' in fase 'downloaded'", () => {
    const spy = spyUpdater({ phase: "downloaded", quitAndInstall: vi.fn() });
    render(<UpdateBanner />);
    expect(screen.getByText(UPDATE_LABELS.downloaded)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: UPDATE_LABELS.restartCta })).toBeInTheDocument();
    spy.mockRestore();
  });

  it("il click su 'Riavvia per aggiornare' invoca quitAndInstall", () => {
    const quitAndInstall = vi.fn();
    const spy = spyUpdater({ phase: "downloaded", quitAndInstall });
    render(<UpdateBanner />);
    fireEvent.click(screen.getByRole("button", { name: UPDATE_LABELS.restartCta }));
    expect(quitAndInstall).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("mostra il messaggio di errore in fase 'error'", () => {
    const spy = spyUpdater({
      phase: "error",
      errorMessage: "Timeout connessione",
      quitAndInstall: vi.fn(),
    });
    render(<UpdateBanner />);
    expect(screen.getByTestId("sb-update-banner")).toBeInTheDocument();
    expect(screen.getByText(/Timeout connessione/)).toBeInTheDocument();
    spy.mockRestore();
  });

  // ── Accessibilità ────────────────────────────────────────────────────────────

  it("ha role=status con aria-live=polite (a11y WCAG 4.1.3)", () => {
    const spy = spyUpdater({ phase: "available", quitAndInstall: vi.fn() });
    render(<UpdateBanner />);
    const banner = screen.getByTestId("sb-update-banner");
    expect(banner.getAttribute("role")).toBe("status");
    expect(banner.getAttribute("aria-live")).toBe("polite");
    spy.mockRestore();
  });

  it("NON ha aria-hidden (annunciato agli screen reader)", () => {
    const spy = spyUpdater({ phase: "available", quitAndInstall: vi.fn() });
    render(<UpdateBanner />);
    const banner = screen.getByTestId("sb-update-banner");
    expect(banner).not.toHaveAttribute("aria-hidden");
    spy.mockRestore();
  });

  it("è posizionato come overlay fisso in cima allo schermo (fixed top)", () => {
    // TSK-152 (US-098, EP-020): migrazione a shadcn Alert — le vecchie classi
    // solids `sd-card`/`sb-sec` sono sostituite da utility Tailwind. Assertion
    // sul posizionamento visivo (fixed/top/inset-x-0) che è il contratto reale
    // del banner di aggiornamento.
    const spy = spyUpdater({ phase: "available", quitAndInstall: vi.fn() });
    render(<UpdateBanner />);
    const banner = screen.getByTestId("sb-update-banner");
    expect(banner).toHaveClass("fixed");
    expect(banner).toHaveClass("top-0");
    expect(banner).toHaveClass("inset-x-0");
    spy.mockRestore();
  });

  it("in fase 'downloaded' offre un pulsante 'Più tardi' che nasconde il banner", () => {
    // TSK-152: nuovo affordance ghost "Più tardi" (UPDATE_LABELS.laterCta).
    // Il click nasconde localmente il banner (nessuna persistenza — riappare
    // alla prossima sessione se lo stato downloaded si ripresenta).
    const spy = spyUpdater({ phase: "downloaded", quitAndInstall: vi.fn() });
    render(<UpdateBanner />);
    expect(screen.getByTestId("sb-update-banner")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: UPDATE_LABELS.laterCta }));
    expect(screen.queryByTestId("sb-update-banner")).toBeNull();
    spy.mockRestore();
  });
});
