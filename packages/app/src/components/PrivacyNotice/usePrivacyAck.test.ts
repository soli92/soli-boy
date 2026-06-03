// TSK-069 (US-033) — Test del hook usePrivacyAck (idratazione + persistenza).
//
// Pattern allineato a useTheme.test.ts (TSK-047): fake port in-memory, nessuna
// dipendenza da IndexedDB reale. Ambiente jsdom (vite.config.ts).

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  PRIVACY_ACK_KEY,
  PRIVACY_ACK_VALUE,
  makePrivacyAckPort,
  type PrivacyAckPort,
} from "./privacy-port";
import { usePrivacyAck } from "./usePrivacyAck";

function makePort(
  initial: string | null = null,
  saveFn?: () => Promise<void>,
): PrivacyAckPort & {
  load: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
} {
  return {
    load: vi.fn<PrivacyAckPort["load"]>(async () => initial),
    save: vi.fn<PrivacyAckPort["save"]>(saveFn ?? (async () => {})),
  };
}

describe("usePrivacyAck — idratazione (TSK-069)", () => {
  it("port.load()→null ⇒ acknowledged=false (banner di primo avvio mostrato)", async () => {
    const port = makePort(null);
    const { result } = renderHook(() => usePrivacyAck(port));
    await waitFor(() => expect(port.load).toHaveBeenCalled());
    expect(result.current.acknowledged).toBe(false);
  });

  it("port.load()→'true' ⇒ acknowledged=true (utente ha già preso visione)", async () => {
    const port = makePort(PRIVACY_ACK_VALUE);
    const { result } = renderHook(() => usePrivacyAck(port));
    await waitFor(() => expect(result.current.acknowledged).toBe(true));
  });

  it("port.load()→qualsiasi non-null ⇒ acknowledged=true (robust verso future varianti)", async () => {
    const port = makePort("v2-some-future-flag");
    const { result } = renderHook(() => usePrivacyAck(port));
    await waitFor(() => expect(result.current.acknowledged).toBe(true));
  });

  it("senza porta ⇒ stato in-memory inizializzato a false", () => {
    const { result } = renderHook(() => usePrivacyAck());
    expect(result.current.acknowledged).toBe(false);
  });
});

describe("usePrivacyAck — persistenza (TSK-069)", () => {
  it("acknowledge() ⇒ port.save chiamato con PRIVACY_ACK_VALUE", async () => {
    const port = makePort(null);
    const { result } = renderHook(() => usePrivacyAck(port));
    await waitFor(() => expect(port.load).toHaveBeenCalled());

    await act(async () => {
      result.current.acknowledge();
    });

    expect(port.save).toHaveBeenCalledWith(PRIVACY_ACK_VALUE);
    expect(result.current.acknowledged).toBe(true);
  });

  it("acknowledge() senza porta ⇒ aggiorna solo lo stato (no crash)", async () => {
    const { result } = renderHook(() => usePrivacyAck());
    await act(async () => {
      result.current.acknowledge();
    });
    expect(result.current.acknowledged).toBe(true);
  });
});

describe("usePrivacyAck — robustezza errori (best-effort)", () => {
  it("port.load() che rejecta ⇒ acknowledged resta false (banner visibile) + warn", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const loadError = new Error("IndexedDB closed");
    const port: PrivacyAckPort = {
      load: vi.fn(async () => {
        throw loadError;
      }),
      save: vi.fn(async () => {}),
    };
    const { result } = renderHook(() => usePrivacyAck(port));

    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(result.current.acknowledged).toBe(false);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("[usePrivacyAck] port.load() rejected:"),
      loadError,
    );

    warn.mockRestore();
  });

  it(
    "port.save() che rejecta ⇒ console.warn chiamato E acknowledged resta true " +
      "(no rollback, no crash)",
    async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const saveError = new Error("QuotaExceededError");
      const port = makePort(null, async () => {
        throw saveError;
      });
      const { result } = renderHook(() => usePrivacyAck(port));
      await waitFor(() => expect(port.load).toHaveBeenCalled());

      await act(async () => {
        result.current.acknowledge();
      });

      // Stato in memoria deve riflettere l'ack (UX prevedibile in sessione)
      expect(result.current.acknowledged).toBe(true);

      // console.warn deve essere stato chiamato per segnalare il reject
      await waitFor(() => expect(warn).toHaveBeenCalled());
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("[usePrivacyAck] port.save() rejected:"),
        saveError,
      );

      warn.mockRestore();
    },
  );
});

describe("makePrivacyAckPort — adapter su ConfigPort", () => {
  it("load() ritorna il valore presente sotto PRIVACY_ACK_KEY", async () => {
    const store: Record<string, unknown> = { [PRIVACY_ACK_KEY]: "true" };
    const config = {
      async getConfig<T>(key: string): Promise<T | undefined> {
        return store[key] as T | undefined;
      },
      async setConfig<T>(key: string, value: T): Promise<void> {
        store[key] = value;
      },
    };

    const port = makePrivacyAckPort(config);
    await expect(port.load()).resolves.toBe("true");
  });

  it("load() ritorna null (non undefined) se la chiave non è presente", async () => {
    const config = {
      async getConfig<T>(_key: string): Promise<T | undefined> {
        return undefined;
      },
      async setConfig<T>(_key: string, _value: T): Promise<void> {},
    };

    const port = makePrivacyAckPort(config);
    await expect(port.load()).resolves.toBeNull();
  });

  it("save(v) scrive sotto PRIVACY_ACK_KEY (chiave canonica)", async () => {
    const setConfig = vi.fn(async () => {});
    const getConfig = vi.fn(async () => undefined);
    const config = { getConfig, setConfig };

    const port = makePrivacyAckPort(config);
    await port.save(PRIVACY_ACK_VALUE);

    expect(setConfig).toHaveBeenCalledWith(PRIVACY_ACK_KEY, PRIVACY_ACK_VALUE);
  });
});
