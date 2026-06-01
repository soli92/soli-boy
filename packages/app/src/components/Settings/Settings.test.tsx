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
});
