// TSK-069 (US-033) — Adapter concreto del `PrivacyAckPort`.
//
// Wrapper sottile sopra `ConfigPort` (store IndexedDB `config`, keyPath "key"):
// - load  → getConfig<string>("privacy-ack")
// - save  → setConfig<string>("privacy-ack", "true")
//
// Chiave canonica `"privacy-ack"` (ref. TSK-069 §Implementation Steps).
// Allineato al pattern di `makeThemePort` (TSK-044) e `makeVideoSettingsPort`
// (TSK-036, F-036-01): il componente sa solo della porta astratta; il wiring
// concreto vive qui.
//
// L'informativa di privacy (testo) NON è persistita: solo l'avvenuta presa
// visione (boolean-as-string). Il contenuto del notice è statico nel componente
// `PrivacyNotice` e riflette il comportamento on-device dell'app (ADR-002
// §Conseguenze "nessun dato lascia il dispositivo").

import type { ConfigPort } from "../../storage/port";

/** Chiave canonica usata nello store `config` (single source of truth). */
export const PRIVACY_ACK_KEY = "privacy-ack";

/**
 * Valore canonico salvato sotto `PRIVACY_ACK_KEY` quando l'utente ha preso
 * visione dell'informativa. Stringa (non boolean) per coerenza con lo schema
 * del TSK-069 (`setConfig('privacy-ack', 'true')`) e per evitare drift se in
 * futuro si aggiungono varianti (`"true"` / `"dismissed"` / `"v2"`).
 */
export const PRIVACY_ACK_VALUE = "true";

/**
 * Porta minimale per la presa visione dell'informativa privacy on-device.
 *
 * - `load()` ritorna `null` se l'utente non ha mai accettato (primo avvio):
 *   semantica analoga a `ThemePort.load()` — l'hook resta sullo stato di
 *   default (notice visibile) senza setState.
 * - `save()` persiste in modo idempotente sotto `PRIVACY_ACK_KEY`; gli errori
 *   sono propagati (il chiamante decide se logarli; `usePrivacyAck` li
 *   intercetta con `console.warn` come `useTheme`).
 *
 * Definita qui (non in `storage/port.ts`) perché è una concern strettamente
 * legata al componente `PrivacyNotice` — analogo al pattern adottato da
 * `VideoSettingsPort` (definita in `components/Player/useVideoSettings.ts`).
 */
export interface PrivacyAckPort {
  load(): Promise<string | null>;
  save(value: string): Promise<void>;
}

/**
 * Crea un `PrivacyAckPort` concreto su un `ConfigPort`.
 */
export function makePrivacyAckPort(config: ConfigPort): PrivacyAckPort {
  return {
    async load(): Promise<string | null> {
      const v = await config.getConfig<string>(PRIVACY_ACK_KEY);
      return v ?? null;
    },
    async save(value: string): Promise<void> {
      await config.setConfig<string>(PRIVACY_ACK_KEY, value);
    },
  };
}
