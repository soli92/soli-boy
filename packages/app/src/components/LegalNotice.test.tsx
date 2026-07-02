// TSK-006 — test del componente LegalNotice (US-006).
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalNotice } from "./LegalNotice";

describe("LegalNotice", () => {
  it("mostra l'avviso che si esegue solo su file dell'utente", () => {
    render(<LegalNotice />);
    const note = screen.getByRole("note", { name: /avviso legale/i });
    expect(note).toHaveTextContent(/non distribuisce/i);
    expect(note).toHaveTextContent(/file forniti dall'utente/i);
  });

  it("applica le utility di tipografia + la className del chiamante", () => {
    // TSK-152 (US-098, EP-020): migrazione a Tailwind — la vecchia classe
    // solids `sb-note` è sostituita da `text-xs text-muted-foreground
    // text-center`. Il passthrough `className` del chiamante resta.
    render(<LegalNotice className="extra" />);
    const note = screen.getByRole("note");
    expect(note).toHaveClass("text-xs");
    expect(note).toHaveClass("text-muted-foreground");
    expect(note).toHaveClass("text-center");
    expect(note).toHaveClass("extra");
  });

  it("variante card: sezioni Licenza, Trademark e Versione", () => {
    render(<LegalNotice variant="card" />);
    expect(screen.getByRole("note", { name: /avviso legale/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /licenza/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /trademark/i })).toBeInTheDocument();
    expect(screen.getByTestId("sb-app-version")).toHaveTextContent(/v0\.4\.0/);
  });
});
