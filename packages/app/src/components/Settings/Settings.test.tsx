// TSK-017 — test Settings rimappatura comandi (US-013).
// TSK-149 (EP-020 / US-097) — Le sezioni chiuse di default (`controls`,
// `legal`, ...) sono ora `AccordionItem` (Radix): il contenuto è smontato
// finché il trigger non viene attivato. `openSection` clicca il trigger prima
// delle asserzioni per portare la sezione allo stato "aperta" — parità
// funzionale con `<details open>` pre-migrazione, dove il DOM era sempre
// popolato (solo `display:none`).
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_KEY_PROFILE } from "../../domain/input-mapping";
import { Settings } from "./Settings";

/** TSK-149 — apre l'AccordionItem cliccando sul trigger con il nome dato. */
function openSection(name: RegExp): void {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("Settings", () => {
  it("mostra il profilo e permette la rimappatura di un tasto", () => {
    const onRemap = vi.fn();
    render(<Settings profile={DEFAULT_KEY_PROFILE} onRemap={onRemap} />);
    openSection(/controlli — rimappatura/i);
    // ArrowUp è mappato su "up"
    const sel = screen.getByLabelText("Pulsante per ArrowUp") as HTMLSelectElement;
    expect(sel.value).toBe("up");
    fireEvent.change(sel, { target: { value: "a" } });
    expect(onRemap).toHaveBeenCalledWith("ArrowUp", "a");
  });

  it("espone L e R come opzioni rimappabili (TSK-121 / US-064)", () => {
    render(<Settings profile={DEFAULT_KEY_PROFILE} onRemap={vi.fn()} />);
    openSection(/controlli — rimappatura/i);
    const sel = screen.getByLabelText("Pulsante per q") as HTMLSelectElement;
    expect(sel.value).toBe("l");
    expect(Array.from(sel.options).map((o) => o.value)).toContain("l");
    expect(Array.from(sel.options).map((o) => o.value)).toContain("r");
  });

  it("Salva profilo invoca onSaveProfile e mostra conferma", () => {
    const onSaveProfile = vi.fn();
    render(<Settings profile={DEFAULT_KEY_PROFILE} onRemap={vi.fn()} onSaveProfile={onSaveProfile} />);
    openSection(/controlli — rimappatura/i);
    fireEvent.click(screen.getByRole("button", { name: /salva profilo/i }));
    expect(onSaveProfile).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent(/salvato/i);
  });

  // TSK-070 (US-034) — Avviso legale no-ROM protette SEMPRE visibile in
  // Settings → Legale (TSK-070 §DoD). Test di integrazione: il componente
  // StoreComplianceNotice è renderizzato dentro Settings senza dipendere
  // da prop opzionali.
  it("rende sempre la sezione legale no-ROM protette (TSK-070, US-034)", () => {
    render(<Settings profile={DEFAULT_KEY_PROFILE} onRemap={vi.fn()} />);
    // TSK-149 — La sezione Legale è ora un AccordionItem chiuso di default:
    // apriamo il trigger per montare `StoreComplianceNotice` nel DOM.
    openSection(/^legale$/i);
    // Presenza del data-testid del componente compliance.
    expect(
      screen.getByTestId("sb-store-compliance-section"),
    ).toBeInTheDocument();
    // Presenza del testo chiave US-034 §Business Rules. aria-label distinto
    // da "Avviso legale" (LegalNotice TSK-006) per evitare collisione strict
    // nei test che hanno il render dell'App completa (vedi e2e app.e2e.ts).
    expect(
      screen.getByRole("note", {
        name: /avviso conformità store: no-ROM protette/i,
      }),
    ).toHaveTextContent(/non include, distribuisce né supporta/i);
  });
});
