// TSK-017 — test Settings rimappatura comandi (US-013).
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_KEY_PROFILE } from "../../domain/input-mapping";
import { Settings } from "./Settings";

describe("Settings", () => {
  it("mostra il profilo e permette la rimappatura di un tasto", () => {
    const onRemap = vi.fn();
    render(<Settings profile={DEFAULT_KEY_PROFILE} onRemap={onRemap} />);
    // ArrowUp è mappato su "up"
    const sel = screen.getByLabelText("Pulsante per ArrowUp") as HTMLSelectElement;
    expect(sel.value).toBe("up");
    fireEvent.change(sel, { target: { value: "a" } });
    expect(onRemap).toHaveBeenCalledWith("ArrowUp", "a");
  });

  it("Salva profilo invoca onSaveProfile e mostra conferma", () => {
    const onSaveProfile = vi.fn();
    render(<Settings profile={DEFAULT_KEY_PROFILE} onRemap={vi.fn()} onSaveProfile={onSaveProfile} />);
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
