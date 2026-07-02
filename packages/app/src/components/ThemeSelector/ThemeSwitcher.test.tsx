import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeSwitcher } from "./ThemeSwitcher";

describe("ThemeSwitcher (EP-021)", () => {
  it("mostra il tema corrente e il successivo nel toggle", () => {
    render(<ThemeSwitcher theme="cyberpunk" onThemeChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /CYBERPUNK/i })).toBeInTheDocument();
    expect(screen.getByText("90S PARTY")).toBeInTheDocument();
  });

  it("cicla verso 90s-party quando il tema è cyberpunk", () => {
    const onThemeChange = vi.fn();
    render(<ThemeSwitcher theme="cyberpunk" onThemeChange={onThemeChange} />);
    fireEvent.click(screen.getByRole("button", { name: /CYBERPUNK/i }));
    expect(onThemeChange).toHaveBeenCalledWith("90s-party");
  });

  it("normalizza dark al pair cyberpunk/90s-party", () => {
    const onThemeChange = vi.fn();
    render(<ThemeSwitcher theme="dark" onThemeChange={onThemeChange} />);
    fireEvent.click(screen.getByRole("button", { name: /CYBERPUNK/i }));
    expect(onThemeChange).toHaveBeenCalledWith("90s-party");
  });
});
