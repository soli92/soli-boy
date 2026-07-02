import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InfoTab } from "./InfoTab";

describe("InfoTab (EP-021)", () => {
  it("compone privacy, store compliance e legal card", () => {
    render(<InfoTab />);
    expect(screen.getByTestId("sb-privacy-section")).toBeInTheDocument();
    expect(screen.getByTestId("sb-store-compliance-section")).toBeInTheDocument();
    expect(screen.getByTestId("sb-legal-card")).toBeInTheDocument();
    expect(screen.getByRole("note", { name: /avviso legale/i })).toBeInTheDocument();
    expect(screen.getByTestId("sb-app-version")).toHaveTextContent(/v0\.4\.0/);
  });
});
