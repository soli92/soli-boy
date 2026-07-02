// TSK-070 (US-034) — test del componente StoreComplianceNotice.
//
// Asserzioni allineate al TSK-070 §DoD:
// - "Avviso legale no-ROM protette visibile in Settings → Legale" (verifica
//   contenuto e accessibilità).
// - "Test verde (presenza testo nel DOM)" (assertion sul testo verbatim
//   dal TSK §Technical Specs).
//
// Pattern allineato a LegalNotice.test.tsx (TSK-006) e
// PrivacyNotice.test.tsx (TSK-069). Niente design system improvvisato.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  STORE_COMPLIANCE_NOTICE_DETAIL,
  STORE_COMPLIANCE_NOTICE_TEXT,
  StoreComplianceNotice,
} from "./StoreComplianceNotice";

describe("StoreComplianceNotice (TSK-070, US-034)", () => {
  it("mostra l'avviso legale verbatim sul no-ROM protette (TSK-070 §Technical Specs)", () => {
    render(<StoreComplianceNotice />);
    // Il testo è verbatim dal TSK-070 §Technical Specs: assertion sul
    // contenuto principale (no fuzzy match) per evitare drift testuali.
    expect(screen.getByText(STORE_COMPLIANCE_NOTICE_TEXT)).toBeInTheDocument();
  });

  it("dichiara esplicitamente che l'app NON include né distribuisce ROM/BIOS protetti", () => {
    render(<StoreComplianceNotice />);
    const section = screen.getByTestId("sb-store-compliance-section");
    // Claim chiave US-034 §Business Rules ("non distribuisce ROM o BIOS
    // protetti, con avviso esplicito").
    expect(section).toHaveTextContent(/non include, distribuisce né supporta/i);
    expect(section).toHaveTextContent(/ROM o BIOS coperti da copyright/i);
  });

  it("chiarisce che l'utente deve usare solo file di sua legittima proprietà", () => {
    render(<StoreComplianceNotice />);
    const section = screen.getByTestId("sb-store-compliance-section");
    expect(section).toHaveTextContent(/legittima proprietà/i);
  });

  it("menziona homebrew e dominio pubblico come use case legittimi", () => {
    render(<StoreComplianceNotice />);
    // Onestà del messaggio: l'app è destinata ad altri scenari oltre alle ROM
    // di proprietà (vedi STORE_COMPLIANCE_NOTICE_DETAIL).
    expect(
      screen.getByText(STORE_COMPLIANCE_NOTICE_DETAIL),
    ).toBeInTheDocument();
    const section = screen.getByTestId("sb-store-compliance-section");
    expect(section).toHaveTextContent(/homebrew/i);
    expect(section).toHaveTextContent(/pubblico dominio/i);
  });

  it("attribuisce la responsabilità della legalità dei file all'utente", () => {
    render(<StoreComplianceNotice />);
    const section = screen.getByTestId("sb-store-compliance-section");
    expect(section).toHaveTextContent(
      /responsabilità della legalità dei file caricati è dell'utente/i,
    );
  });

  it("rimanda alla sezione Privacy per il modello on-device (cross-link TSK-070 §Implementation Steps p.3)", () => {
    render(<StoreComplianceNotice />);
    const section = screen.getByTestId("sb-store-compliance-section");
    // Il TSK-070 §Implementation Steps p.3 chiede di collegare al
    // PrivacyNotice. Il cross-link è testuale (entrambe le sezioni sono
    // nella stessa schermata Settings), no URL hardcoded.
    expect(section).toHaveTextContent(/Privacy: tutto resta sul tuo dispositivo/i);
  });

  it("ha role=note con aria-label descrittivo distinto da LegalNotice (accessibilità)", () => {
    render(<StoreComplianceNotice />);
    // aria-label deliberatamente differente da "Avviso legale" (LegalNotice
    // TSK-006) per evitare collisione di matching nei test (vedi commento
    // in StoreComplianceNotice.tsx).
    const note = screen.getByRole("note", {
      name: /avviso conformità store: no-ROM protette/i,
    });
    expect(note).toBeInTheDocument();
  });

  it("ha aria-labelledby legato all'heading della sezione", () => {
    render(<StoreComplianceNotice />);
    const section = screen.getByTestId("sb-store-compliance-section");
    const labelledBy = section.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    const heading = document.getElementById(labelledBy as string);
    expect(heading).not.toBeNull();
    // L'heading dichiara la natura legale della sezione.
    expect(heading?.textContent).toMatch(/legale/i);
  });

  it("applica le classi aggiuntive del chiamante (className passthrough)", () => {
    // TSK-152 (US-098, EP-020): migrazione a shadcn Alert `destructive` — le
    // vecchie classi solids `sd-card`/`sb-sec` non sono più presenti. Assertion
    // sul solo contratto pubblico stabile: passthrough `className`.
    render(<StoreComplianceNotice className="extra-store" />);
    const section = screen.getByTestId("sb-store-compliance-section");
    expect(section).toHaveClass("extra-store");
  });
});
