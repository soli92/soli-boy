// TSK-017 — test Settings rimappatura comandi (US-013).
// TSK-150 (EP-020) — I select nativi sono stati sostituiti da Radix Select.

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_KEY_PROFILE } from "../../domain/input-mapping";
import { openRadixSelect, pickRadixSelectOption } from "../../test-radix-select";
import { Settings } from "./Settings";

function openSection(name: RegExp): void {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("Settings", () => {
  it("mostra il profilo e permette la rimappatura di un tasto", async () => {
    const onRemap = vi.fn();
    render(<Settings profile={DEFAULT_KEY_PROFILE} onRemap={onRemap} />);
    openSection(/controlli — rimappatura/i);
    const trigger = screen.getByLabelText("Pulsante per ArrowUp");
    expect(trigger).toHaveTextContent("UP");
    await pickRadixSelectOption("Pulsante per ArrowUp", "A");
    expect(onRemap).toHaveBeenCalledWith("ArrowUp", "a");
  });

  it("espone L e R come opzioni rimappabili (TSK-121 / US-064)", () => {
    render(<Settings profile={DEFAULT_KEY_PROFILE} onRemap={vi.fn()} />);
    openSection(/controlli — rimappatura/i);
    const trigger = screen.getByLabelText("Pulsante per q");
    expect(trigger).toHaveTextContent("L");
    openRadixSelect("Pulsante per q");
    expect(screen.getByRole("option", { name: "L" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "R" })).toBeInTheDocument();
  });

  it("Salva profilo invoca onSaveProfile e mostra conferma", () => {
    const onSaveProfile = vi.fn();
    render(<Settings profile={DEFAULT_KEY_PROFILE} onRemap={vi.fn()} onSaveProfile={onSaveProfile} />);
    openSection(/controlli — rimappatura/i);
    fireEvent.click(screen.getByRole("button", { name: /salva profilo/i }));
    expect(onSaveProfile).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent(/salvato/i);
  });

  it("rende sempre la sezione legale no-ROM protette (TSK-070, US-034)", () => {
    render(<Settings profile={DEFAULT_KEY_PROFILE} onRemap={vi.fn()} />);
    openSection(/^legale$/i);
    expect(
      screen.getByTestId("sb-store-compliance-section"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("note", {
        name: /avviso conformità store: no-ROM protette/i,
      }),
    ).toHaveTextContent(/non include, distribuisce né supporta/i);
  });
});
