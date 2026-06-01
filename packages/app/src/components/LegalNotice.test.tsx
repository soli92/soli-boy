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

  it("applica le classi solids e quelle aggiuntive", () => {
    render(<LegalNotice className="extra" />);
    const note = screen.getByRole("note");
    expect(note).toHaveClass("sb-note");
    expect(note).toHaveClass("extra");
  });
});
