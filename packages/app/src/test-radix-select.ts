// Shared Radix Select helpers for jsdom tests (TSK-150 / EP-020).

import { fireEvent, screen, waitFor } from "@testing-library/react";

export function openRadixSelect(label: string | RegExp): HTMLElement {
  const trigger = screen.getByLabelText(label);
  fireEvent.pointerDown(trigger);
  fireEvent.click(trigger);
  return trigger;
}

export async function pickRadixSelectOption(
  label: string | RegExp,
  optionName: string | RegExp,
): Promise<void> {
  openRadixSelect(label);
  const option = await waitFor(() =>
    screen.getByRole("option", { name: optionName }),
  );
  fireEvent.click(option);
}
