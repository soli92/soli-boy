// TSK-126 — Test RtcSection (US-065, ADR-009).
//
// Copertura DoD del TSK-126 §Technical Specs:
//  1. Render con piattaforma senza RTC ('gba') → componente non presente nel DOM.
//  2. Render con piattaforma con RTC ('gbc') + bridge mock → sezione visibile,
//     campi popolati dal bridge.
//  3. Input mese=13 → pulsante "Imposta" disabilitato + aria-invalid="true".
//  4. Input valido → pulsante abilitato; click → bridge.setRtcState chiamato
//     con i valori corretti.
//
// Più alcune asserzioni di coerenza ADR-009: bridge=null nasconde la sezione
// anche su piattaforma con RTC (fail-safe — niente azione senza engine attivo).

import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import type { RtcBridge, RtcState } from "../../domain/rtc-service";
import { RtcSection } from "./RtcSection";
import { Accordion } from "@/components/ui/accordion";

// TSK-149 (EP-020 / US-097) — RtcSection ora ritorna un `AccordionItem` che
// DEVE essere renderizzato all'interno di un `<Accordion>` parent (Radix
// context provider). L'helper wrappa il render dei test standalone
// mantenendo la sezione APERTA di default (`defaultValue={["rtc"]}`) così i
// `getByTestId` per i campi/pulsanti annidati continuano a funzionare come
// pre-migrazione (`<details open>`). Nessuna modifica alle asserzioni di
// visibilità: la sezione mostra sempre `sb-rtc-section` come testid sull'item.
function renderInAccordion(ui: ReactElement): ReturnType<typeof render> {
  return render(
    <Accordion type="multiple" defaultValue={["rtc"]}>
      {ui}
    </Accordion>,
  );
}

function makeBridge(initial: RtcState | null = null): RtcBridge & {
  getRtcState: ReturnType<typeof vi.fn>;
  setRtcState: ReturnType<typeof vi.fn>;
} {
  // Mock con storage interno mutabile: `setRtcState` aggiorna `current` così
  // un eventuale `getRtcState` successivo riflette lo stato. Coerente con
  // `RtcBridge` reale (i bridge concreti operano sui registri del core).
  let current: RtcState | null = initial;
  return {
    hasRtc: vi.fn(() => true),
    getRtcState: vi.fn(() => current),
    setRtcState: vi.fn((s: RtcState) => {
      current = s;
    }),
  };
}

const VALID_STATE: RtcState = {
  year: 2026,
  month: 6,
  day: 30,
  hour: 12,
  minute: 30,
  second: 45,
};

describe("RtcSection — visibilità condizionale (TSK-126 / US-065 / ADR-009)", () => {
  it("non renderizza nulla su piattaforma senza RTC ('gba')", () => {
    const bridge = makeBridge(VALID_STATE);
    const { container } = render(
      <RtcSection platform="gba" bridge={bridge} />,
    );
    // Nessun nodo prodotto: il return null deve azzerare l'intera sezione.
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("sb-rtc-section")).toBeNull();
    // F-05 / review-iter-1 — Il bridge NON deve essere consultato se la
    // piattaforma non ha RTC. Il `useEffect` di popolamento ha guard
    // `if (!hasRtc(platform)) return;` per evitare side-effect futuri con
    // bridge concreti dello Sprint 16 (lettura registri inesistenti).
    expect(bridge.getRtcState).not.toHaveBeenCalled();
  });

  it("non renderizza nulla se bridge=null anche su piattaforma con RTC", () => {
    // Edge case ADR-009: fail-safe — niente bridge ⇒ niente UI di azione.
    const { container } = render(
      <RtcSection platform="gbc" bridge={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderizza la sezione su piattaforma con RTC ('gbc') e bridge attivo", () => {
    const bridge = makeBridge(VALID_STATE);
    renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
    expect(screen.getByTestId("sb-rtc-section")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /imposta data e ora/i }),
    ).toBeInTheDocument();
  });

  it("renderizza la sezione anche per piattaforma 'gb'", () => {
    // hasRtc("gb") = true secondo il fallback conservativo del rtc-service.
    const bridge = makeBridge(VALID_STATE);
    renderInAccordion(<RtcSection platform="gb" bridge={bridge} />);
    expect(screen.getByTestId("sb-rtc-section")).toBeInTheDocument();
  });
});

describe("RtcSection — popolamento iniziale (TSK-126 §Implementation Steps)", () => {
  it("popola i sei campi dai valori del bridge al mount", () => {
    const bridge = makeBridge(VALID_STATE);
    renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
    expect((screen.getByTestId("sb-rtc-year") as HTMLInputElement).value).toBe(
      "2026",
    );
    expect((screen.getByTestId("sb-rtc-month") as HTMLInputElement).value).toBe(
      "6",
    );
    expect((screen.getByTestId("sb-rtc-day") as HTMLInputElement).value).toBe(
      "30",
    );
    expect((screen.getByTestId("sb-rtc-hour") as HTMLInputElement).value).toBe(
      "12",
    );
    expect((screen.getByTestId("sb-rtc-minute") as HTMLInputElement).value).toBe(
      "30",
    );
    expect((screen.getByTestId("sb-rtc-second") as HTMLInputElement).value).toBe(
      "45",
    );
    expect(bridge.getRtcState).toHaveBeenCalled();
  });

  it("usa lo stato di default se il bridge ritorna null (es. RTC non latched)", () => {
    const bridge = makeBridge(null);
    renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
    // DEFAULT_STATE in RtcSection.tsx: 2026-01-01 00:00:00.
    expect((screen.getByTestId("sb-rtc-year") as HTMLInputElement).value).toBe(
      "2026",
    );
    expect((screen.getByTestId("sb-rtc-month") as HTMLInputElement).value).toBe(
      "1",
    );
  });
});

describe("RtcSection — validazione range (TSK-126 §DoD)", () => {
  it("disabilita 'Imposta' quando mese=13 (fuori range)", () => {
    const bridge = makeBridge(VALID_STATE);
    renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);

    const monthInput = screen.getByTestId("sb-rtc-month") as HTMLInputElement;
    fireEvent.change(monthInput, { target: { value: "13" } });

    const submit = screen.getByTestId("sb-rtc-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    // aria-invalid è marcato sul campo incriminato (US-065 AC4).
    expect(monthInput.getAttribute("aria-invalid")).toBe("true");
    // Messaggio comprensibile è renderizzato.
    expect(screen.getByTestId("sb-rtc-month-error")).toHaveTextContent(
      /fuori intervallo/i,
    );
  });

  it("disabilita 'Imposta' quando anno=1999 (sanity post-Y2K)", () => {
    const bridge = makeBridge(VALID_STATE);
    renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
    fireEvent.change(screen.getByTestId("sb-rtc-year"), {
      target: { value: "1999" },
    });
    expect(
      (screen.getByTestId("sb-rtc-submit") as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      screen.getByTestId("sb-rtc-year").getAttribute("aria-invalid"),
    ).toBe("true");
  });

  it("disabilita 'Imposta' quando un campo è vuoto (NaN)", () => {
    const bridge = makeBridge(VALID_STATE);
    renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
    fireEvent.change(screen.getByTestId("sb-rtc-hour"), {
      target: { value: "" },
    });
    expect(
      (screen.getByTestId("sb-rtc-submit") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("mantiene 'Imposta' abilitato con stato valido (no errori)", () => {
    const bridge = makeBridge(VALID_STATE);
    renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
    const submit = screen.getByTestId("sb-rtc-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
    // F-01 / review-iter-1: quando il campo è valido NON emettiamo
    // `aria-invalid="false"` (lo screen reader l'avrebbe annunciato come
    // "non valido: falso"). L'attributo deve essere assente del tutto.
    expect(
      screen.getByTestId("sb-rtc-year").hasAttribute("aria-invalid"),
    ).toBe(false);
    expect(
      screen.getByTestId("sb-rtc-month").hasAttribute("aria-invalid"),
    ).toBe(false);
  });
});

describe("RtcSection — pulsante Imposta (TSK-126 §DoD)", () => {
  it("click su 'Imposta' invoca bridge.setRtcState con i valori del form", () => {
    const bridge = makeBridge(null); // mount con default DEFAULT_STATE
    renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);

    // L'utente modifica anno+mese+giorno (gli altri restano default 0).
    fireEvent.change(screen.getByTestId("sb-rtc-year"), {
      target: { value: "2027" },
    });
    fireEvent.change(screen.getByTestId("sb-rtc-month"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByTestId("sb-rtc-day"), {
      target: { value: "15" },
    });

    fireEvent.click(screen.getByTestId("sb-rtc-submit"));

    expect(bridge.setRtcState).toHaveBeenCalledTimes(1);
    expect(bridge.setRtcState).toHaveBeenCalledWith({
      year: 2027,
      month: 3,
      day: 15,
      hour: 0,
      minute: 0,
      second: 0,
    });
  });

  it("mostra messaggio di conferma dopo l'impostazione", () => {
    const bridge = makeBridge(VALID_STATE);
    renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
    fireEvent.click(screen.getByTestId("sb-rtc-submit"));
    expect(screen.getByTestId("sb-rtc-confirmed")).toHaveTextContent(
      /orologio interno impostato/i,
    );
  });

  it("nasconde la conferma se l'utente modifica un campo dopo aver impostato", () => {
    const bridge = makeBridge(VALID_STATE);
    renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
    fireEvent.click(screen.getByTestId("sb-rtc-submit"));
    expect(screen.queryByTestId("sb-rtc-confirmed")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("sb-rtc-hour"), {
      target: { value: "15" },
    });
    expect(screen.queryByTestId("sb-rtc-confirmed")).toBeNull();
  });

  it("non chiama setRtcState se lo stato è invalido (double-check pre-call)", () => {
    const bridge = makeBridge(VALID_STATE);
    renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
    fireEvent.change(screen.getByTestId("sb-rtc-month"), {
      target: { value: "13" },
    });
    // Pulsante disabilitato → React non fa partire onClick: assert difensivo.
    fireEvent.click(screen.getByTestId("sb-rtc-submit"));
    expect(bridge.setRtcState).not.toHaveBeenCalled();
  });
});

// TSK-131 — Pulsante "Usa ora del dispositivo" (US-068, ADR-009 §5).
//
// Copertura DoD del TSK-131 §Technical Specs:
//  1. Click su "Usa ora del dispositivo" → `bridge.setRtcState` chiamato con
//     i valori dell'orologio di sistema (UTC) e campi form aggiornati.
//  2. Dopo sync, i campi sono modificabili manualmente senza vincoli.
//  3. Il pulsante NON è presente quando la sezione è nascosta (piattaforma
//     senza RTC / bridge null).
//  4. Il pulsante è raggiungibile via Tab e attivabile via Enter/Space
//     (semantica nativa `<button type="button">`).
//  5. Nessuna chiamata `fetch`/`XMLHttpRequest` al click (verifica con spy).
describe("RtcSection — pulsante 'Usa ora del dispositivo' (TSK-131 / US-068 / ADR-009)", () => {
  // Data deterministica per le asserzioni sul payload sync. Usiamo un
  // istante UTC ben definito così possiamo confrontare i campi attesi senza
  // dipendere dal timezone della macchina di test (la chain `syncToDevice`
  // usa `getUTC*`, quindi i valori attesi sono in UTC).
  // 2027-03-15T14:25:36.000Z → year=2027, month=3, day=15, hour=14, min=25, sec=36.
  const FROZEN_UTC = new Date("2027-03-15T14:25:36.000Z");

  it("non renderizza il pulsante sync se la sezione è nascosta (piattaforma senza RTC)", () => {
    const bridge = makeBridge(VALID_STATE);
    renderInAccordion(<RtcSection platform="gba" bridge={bridge} />);
    expect(screen.queryByTestId("sb-rtc-sync-device")).toBeNull();
  });

  it("non renderizza il pulsante sync se bridge=null", () => {
    renderInAccordion(<RtcSection platform="gbc" bridge={null} />);
    expect(screen.queryByTestId("sb-rtc-sync-device")).toBeNull();
  });

  it("renderizza il pulsante 'Usa ora del dispositivo' quando la sezione è visibile", () => {
    const bridge = makeBridge(VALID_STATE);
    renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
    const syncBtn = screen.getByTestId("sb-rtc-sync-device");
    expect(syncBtn).toBeInTheDocument();
    expect(syncBtn).toHaveAttribute("type", "button");
    expect(syncBtn).toHaveAttribute("aria-label", "Usa ora del dispositivo");
    // Sanity: convive con "Imposta" (incremento su TSK-126, non sostituzione).
    expect(screen.getByTestId("sb-rtc-submit")).toBeInTheDocument();
  });

  it("click su 'Usa ora del dispositivo' chiama bridge.setRtcState con l'ora UTC corrente", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_UTC);
    try {
      const bridge = makeBridge(VALID_STATE);
      renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);

      fireEvent.click(screen.getByTestId("sb-rtc-sync-device"));

      // `RtcService.syncToDevice` scrive in UTC sul bridge.
      expect(bridge.setRtcState).toHaveBeenCalledTimes(1);
      expect(bridge.setRtcState).toHaveBeenCalledWith({
        year: 2027,
        month: 3,
        day: 15,
        hour: 14,
        minute: 25,
        second: 36,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("dopo click su 'Usa ora del dispositivo' i campi del form sono popolati con i valori UTC", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_UTC);
    try {
      const bridge = makeBridge(VALID_STATE);
      renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);

      fireEvent.click(screen.getByTestId("sb-rtc-sync-device"));

      expect(
        (screen.getByTestId("sb-rtc-year") as HTMLInputElement).value,
      ).toBe("2027");
      expect(
        (screen.getByTestId("sb-rtc-month") as HTMLInputElement).value,
      ).toBe("3");
      expect(
        (screen.getByTestId("sb-rtc-day") as HTMLInputElement).value,
      ).toBe("15");
      expect(
        (screen.getByTestId("sb-rtc-hour") as HTMLInputElement).value,
      ).toBe("14");
      expect(
        (screen.getByTestId("sb-rtc-minute") as HTMLInputElement).value,
      ).toBe("25");
      expect(
        (screen.getByTestId("sb-rtc-second") as HTMLInputElement).value,
      ).toBe("36");
    } finally {
      vi.useRealTimers();
    }
  });

  it("dopo sync, i campi restano modificabili manualmente senza vincoli (no auto-apply)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_UTC);
    try {
      const bridge = makeBridge(VALID_STATE);
      renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);

      fireEvent.click(screen.getByTestId("sb-rtc-sync-device"));
      // L'utente edita l'anno dopo il sync — il form deve permetterlo.
      fireEvent.change(screen.getByTestId("sb-rtc-year"), {
        target: { value: "2030" },
      });
      expect(
        (screen.getByTestId("sb-rtc-year") as HTMLInputElement).value,
      ).toBe("2030");
      // E "Imposta" resta abilitato (stato post-edit ancora valido).
      expect(
        (screen.getByTestId("sb-rtc-submit") as HTMLButtonElement).disabled,
      ).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("'Usa ora del dispositivo' NON applica automaticamente: niente messaggio di conferma finché l'utente non preme 'Imposta'", () => {
    // AC US-068 + DoD TSK-131: il sync popola i campi, l'utente deve
    // confermare con "Imposta". Il messaggio `sb-rtc-confirmed` compare solo
    // dopo "Imposta" (TSK-126), MAI dopo il solo sync.
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_UTC);
    try {
      const bridge = makeBridge(VALID_STATE);
      renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);

      fireEvent.click(screen.getByTestId("sb-rtc-sync-device"));
      // Dopo il solo sync: NO conferma visualizzata.
      expect(screen.queryByTestId("sb-rtc-confirmed")).toBeNull();

      // Poi l'utente preme "Imposta": ora compare la conferma.
      fireEvent.click(screen.getByTestId("sb-rtc-submit"));
      expect(screen.getByTestId("sb-rtc-confirmed")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("sync seguito da 'Imposta' applica i valori del dispositivo via setRtcState (conferma utente esplicita)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_UTC);
    try {
      const bridge = makeBridge(VALID_STATE);
      renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);

      // 1° call: syncToDevice scrive UTC sul bridge.
      fireEvent.click(screen.getByTestId("sb-rtc-sync-device"));
      // 2° call: handleSubmit scrive di nuovo i campi del form (stessi valori).
      fireEvent.click(screen.getByTestId("sb-rtc-submit"));

      expect(bridge.setRtcState).toHaveBeenCalledTimes(2);
      // Entrambe le call hanno lo stesso payload (il form è stato popolato
      // con i valori UTC ritornati da getRtcState).
      expect(bridge.setRtcState).toHaveBeenLastCalledWith({
        year: 2027,
        month: 3,
        day: 15,
        hour: 14,
        minute: 25,
        second: 36,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("'Usa ora del dispositivo' non effettua chiamate di rete (RNF-05 / RNF-06)", () => {
    // Spy globali su fetch/XMLHttpRequest: nessuno deve essere invocato.
    // jsdom espone entrambi; li sostituiamo con spy che fallirebbero il test
    // se chiamati. (RtcService.syncToDevice usa solo `new Date()`.)
    const fetchSpy = vi.fn();
    const xhrSpy = vi.fn();
    const origFetch = globalThis.fetch;
    const origXHR = globalThis.XMLHttpRequest;
    globalThis.fetch = fetchSpy;
    // @ts-expect-error — override per spy.
    globalThis.XMLHttpRequest = xhrSpy;
    try {
      const bridge = makeBridge(VALID_STATE);
      renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
      fireEvent.click(screen.getByTestId("sb-rtc-sync-device"));
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(xhrSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = origFetch;
      globalThis.XMLHttpRequest = origXHR;
    }
  });

  // F-03 / review-iter-1 — Esito "soft" del sync: il bridge accetta la write
  // di `syncToDevice` ma `getRtcState` ritorna null subito dopo (es. core
  // latched ma non ancora sincronizzato, oppure bridge stub Sprint 16). Lo
  // stato pre-sync deve essere preservato e l'utente deve essere informato
  // via notice non bloccante nella `role="status"` esistente.
  it("se getRtcState ritorna null dopo syncToDevice, lo stato pre-sync è preservato e viene mostrata una notice", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_UTC);
    try {
      // Bridge "write-only": setRtcState muta lo storage ma getRtcState
      // ritorna sempre null (simula bridge concreto che non rilegge ancora).
      const bridge: RtcBridge & {
        getRtcState: ReturnType<typeof vi.fn>;
        setRtcState: ReturnType<typeof vi.fn>;
      } = {
        hasRtc: () => true,
        getRtcState: vi.fn(() => null),
        setRtcState: vi.fn<(s: RtcState) => void>(),
      };

      renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);

      // Pre-sync: lo stato è il DEFAULT_STATE (2026-01-01 00:00:00) perché
      // il bridge ritorna null anche al mount. Verifichiamo i valori.
      expect(
        (screen.getByTestId("sb-rtc-year") as HTMLInputElement).value,
      ).toBe("2026");
      expect(
        (screen.getByTestId("sb-rtc-month") as HTMLInputElement).value,
      ).toBe("1");

      fireEvent.click(screen.getByTestId("sb-rtc-sync-device"));

      // Il side-effect `setRtcState` su core è comunque andato (syncToDevice
      // scrive prima di rileggere): asserzione side-effect preservato.
      expect(bridge.setRtcState).toHaveBeenCalledTimes(1);
      // Ma lo stato del form NON cambia (nessun popolamento da null): i
      // campi restano sui valori pre-sync.
      expect(
        (screen.getByTestId("sb-rtc-year") as HTMLInputElement).value,
      ).toBe("2026");
      expect(
        (screen.getByTestId("sb-rtc-month") as HTMLInputElement).value,
      ).toBe("1");
      // E l'utente vede la notice "Sincronizzazione non disponibile" nella
      // `role="status"` (non bloccante, non modale).
      const notice = screen.getByTestId("sb-rtc-sync-notice");
      expect(notice).toHaveTextContent(/sincronizzazione non disponibile/i);
      expect(notice).toHaveAttribute("role", "status");
    } finally {
      vi.useRealTimers();
    }
  });

  it("la notice di sync sparisce dopo che l'utente modifica un campo (edit = intent fresco)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_UTC);
    try {
      const bridge: RtcBridge & {
        getRtcState: ReturnType<typeof vi.fn>;
        setRtcState: ReturnType<typeof vi.fn>;
      } = {
        hasRtc: () => true,
        getRtcState: vi.fn(() => null),
        setRtcState: vi.fn<(s: RtcState) => void>(),
      };
      renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
      fireEvent.click(screen.getByTestId("sb-rtc-sync-device"));
      expect(screen.getByTestId("sb-rtc-sync-notice")).toBeInTheDocument();

      // L'utente edita un campo: la notice precedente diventa irrilevante.
      fireEvent.change(screen.getByTestId("sb-rtc-hour"), {
        target: { value: "15" },
      });
      expect(screen.queryByTestId("sb-rtc-sync-notice")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("la notice di sync sparisce se l'utente preme 'Imposta' (intent esplicito = stato valido applicato)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_UTC);
    try {
      // Bridge "write-only" come nel test F-03 sopra.
      const bridge: RtcBridge & {
        getRtcState: ReturnType<typeof vi.fn>;
        setRtcState: ReturnType<typeof vi.fn>;
      } = {
        hasRtc: () => true,
        getRtcState: vi.fn(() => null),
        setRtcState: vi.fn<(s: RtcState) => void>(),
      };
      renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
      fireEvent.click(screen.getByTestId("sb-rtc-sync-device"));
      expect(screen.getByTestId("sb-rtc-sync-notice")).toBeInTheDocument();

      // L'utente preme "Imposta" sui valori correnti del form (DEFAULT_STATE
      // è valido): il submit applica e la notice di sync precedente non è
      // più rilevante (lo stato è stato confermato dall'utente).
      fireEvent.click(screen.getByTestId("sb-rtc-submit"));
      expect(screen.queryByTestId("sb-rtc-sync-notice")).toBeNull();
      expect(screen.getByTestId("sb-rtc-confirmed")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("'Usa ora del dispositivo' è raggiungibile/attivabile via tastiera (button semantico)", () => {
    // `<button type="button">` è nativamente focusabile e attivabile da
    // Enter/Space. Verifichiamo le precondizioni: non è disabilitato, non
    // ha tabindex negativo, ha aria-label. L'attivazione effettiva via
    // tastiera è un test browser-level che dipende dal default action di
    // jsdom (`click` su Enter è simulato). Affidiamo al runtime la coerenza
    // di Enter/Space → click — comportamento standard dello user-agent.
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_UTC);
    try {
      const bridge = makeBridge(VALID_STATE);
      renderInAccordion(<RtcSection platform="gbc" bridge={bridge} />);
      const syncBtn = screen.getByTestId("sb-rtc-sync-device") as HTMLButtonElement;
      expect(syncBtn.disabled).toBe(false);
      expect(syncBtn.tabIndex).toBeGreaterThanOrEqual(0);
      // Simuliamo l'attivazione via keyboard come fa lo user-agent (click event).
      syncBtn.focus();
      expect(document.activeElement).toBe(syncBtn);
      fireEvent.click(syncBtn);
      expect(bridge.setRtcState).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
