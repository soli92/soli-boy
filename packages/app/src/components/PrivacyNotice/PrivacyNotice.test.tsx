// TSK-069 (US-033) — test del componente PrivacyNotice.
//
// Suddiviso per variante (`banner` vs `section`) per chiarire i due use case
// (primo avvio dismissibile vs sezione Settings sempre consultabile).
// Pattern allineato a LegalNotice.test.tsx (TSK-006) e ai test di
// ThemeSelector.

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  PRIVACY_ACK_LABEL,
  PRIVACY_NOTICE_POINTS,
  PrivacyNotice,
} from "./PrivacyNotice";

describe("PrivacyNotice — banner variant (TSK-069, US-033)", () => {
  it("renderizza tutti i punti dell'informativa privacy on-device", () => {
    render(<PrivacyNotice variant="banner" />);
    // I punti dichiarano fedelmente il modello on-device (ADR-002 §Conseguenze).
    for (const point of PRIVACY_NOTICE_POINTS) {
      expect(screen.getByText(point)).toBeInTheDocument();
    }
  });

  it("dichiara esplicitamente che i dati restano sul dispositivo (no server esterni)", () => {
    render(<PrivacyNotice variant="banner" />);
    // Asserzione su due claim chiave US-033 / ADR-002.
    const banner = screen.getByTestId("sb-privacy-banner");
    expect(banner).toHaveTextContent(/restano sul tuo dispositivo/i);
    expect(banner).toHaveTextContent(/nessun file viene inviato a server esterni/i);
  });

  it("dichiara assenza di account, tracking, analytics e telemetria", () => {
    render(<PrivacyNotice variant="banner" />);
    const banner = screen.getByTestId("sb-privacy-banner");
    expect(banner).toHaveTextContent(/non è richiesto alcun account/i);
    expect(banner).toHaveTextContent(/tracking/i);
    expect(banner).toHaveTextContent(/analytics/i);
    expect(banner).toHaveTextContent(/telemetria/i);
  });

  it("è di default banner (senza variant esplicita)", () => {
    render(<PrivacyNotice />);
    expect(screen.getByTestId("sb-privacy-banner")).toBeInTheDocument();
    expect(screen.queryByTestId("sb-privacy-section")).toBeNull();
  });

  it("mostra il pulsante 'Ho capito' e invoca onAcknowledge al click", () => {
    const onAcknowledge = vi.fn();
    render(
      <PrivacyNotice variant="banner" onAcknowledge={onAcknowledge} />,
    );

    const btn = screen.getByRole("button", { name: PRIVACY_ACK_LABEL });
    fireEvent.click(btn);

    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });

  it("non crasha se onAcknowledge non è fornito (callback opzionale)", () => {
    render(<PrivacyNotice variant="banner" />);
    const btn = screen.getByRole("button", { name: PRIVACY_ACK_LABEL });
    // Il click su un componente senza callback non deve lanciare.
    expect(() => fireEvent.click(btn)).not.toThrow();
  });

  it("ha role=region con aria-labelledby legato all'heading", () => {
    render(<PrivacyNotice variant="banner" />);
    const banner = screen.getByTestId("sb-privacy-banner");
    expect(banner.getAttribute("role")).toBe("region");
    const labelledBy = banner.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    // L'id puntato esiste e contiene il testo dell'heading
    const heading = document.getElementById(labelledBy as string);
    expect(heading).not.toBeNull();
    expect(heading?.textContent).toMatch(/privacy/i);
  });

  it("applica le classi solids e quelle aggiuntive", () => {
    render(<PrivacyNotice variant="banner" className="extra-banner" />);
    const banner = screen.getByTestId("sb-privacy-banner");
    expect(banner).toHaveClass("sd-card");
    expect(banner).toHaveClass("sb-sec");
    expect(banner).toHaveClass("extra-banner");
  });
});

describe("PrivacyNotice — section variant (TSK-069, sempre disponibile)", () => {
  it("renderizza i punti dell'informativa anche in modalità section", () => {
    render(<PrivacyNotice variant="section" />);
    for (const point of PRIVACY_NOTICE_POINTS) {
      expect(screen.getByText(point)).toBeInTheDocument();
    }
  });

  it("NON mostra alcun pulsante di dismiss (sezione non dismissibile)", () => {
    render(<PrivacyNotice variant="section" />);
    expect(
      screen.queryByRole("button", { name: PRIVACY_ACK_LABEL }),
    ).toBeNull();
  });

  it("ignora onAcknowledge (la sezione non lo invoca)", () => {
    const onAcknowledge = vi.fn();
    render(<PrivacyNotice variant="section" onAcknowledge={onAcknowledge} />);
    expect(onAcknowledge).not.toHaveBeenCalled();
  });

  it("cita ADR-002 nella nota di chiusura per giustificare il claim on-device", () => {
    render(<PrivacyNotice variant="section" />);
    const section = screen.getByTestId("sb-privacy-section");
    expect(section).toHaveTextContent(/ADR-002/);
  });

  it("ha un heading distinto dal banner (id non collide)", () => {
    // Render contemporaneo: in App.tsx il banner sparisce dopo l'ack, ma
    // garantiamo unicità by design degli `aria-labelledby` per evitare
    // ambiguità WAI-ARIA in qualsiasi composizione.
    render(
      <>
        <PrivacyNotice variant="banner" />
        <PrivacyNotice variant="section" />
      </>,
    );
    const banner = screen.getByTestId("sb-privacy-banner");
    const section = screen.getByTestId("sb-privacy-section");
    const bannerLabel = banner.getAttribute("aria-labelledby");
    const sectionLabel = section.getAttribute("aria-labelledby");
    expect(bannerLabel).toBeTruthy();
    expect(sectionLabel).toBeTruthy();
    expect(bannerLabel).not.toBe(sectionLabel);
  });

  it("applica le classi solids di base (sd-card, sb-sec)", () => {
    render(<PrivacyNotice variant="section" />);
    const section = screen.getByTestId("sb-privacy-section");
    expect(section).toHaveClass("sd-card");
    expect(section).toHaveClass("sb-sec");
  });
});
