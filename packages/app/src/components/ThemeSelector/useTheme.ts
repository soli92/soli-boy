// TSK-044 (US-036) — Stato e persistenza del tema UI applicato via `data-theme`
// sull'elemento `<html>`.
//
// Engine-agnostico: il tema viene applicato impostando l'attributo
// `data-theme` su `document.documentElement`; i token CSS (palette, accent,
// scanline) provengono dal design system reale `@soli92/solids` (TSK-040) e
// dall'app stylesheet `styles/solids-theme.css` (variante `90s-party` e
// `cyberpunk`).
//
// Persistenza opzionale via `ThemePort`: l'adapter reale (IndexedDB `config`
// store, chiave canonica `"ui-theme"`) è cablato dalla composizione applicativa
// (`App.tsx`), fuori scope di questo hook; qui consumiamo solo la porta.
//
// Pattern allineato a `useVideoSettings` (TSK-036): hook di stato + porta
// opzionale, applicazione effetto al DOM via `useEffect`, persistenza
// best-effort con `console.warn` su errore (no rollback UI).

import { useCallback, useEffect, useState } from "react";
import type { ThemePort } from "../../storage/port";

/**
 * Temi UI supportati dall'app (US-036).
 * - `90s-party`: tema brand (default canonico). Identità rave/synthwave.
 * - `dark`: tema scuro neutro (legacy, già presente prima di TSK-040).
 * - `cyberpunk`: tema neon (fornito da `@soli92/solids` + override locale).
 *
 * Tipato come tuple `as const` per permettere ai consumer (ThemeSelector,
 * tests) di derivare il tipo dei valori senza duplicare l'elenco.
 */
export const UI_THEMES = ["90s-party", "dark", "cyberpunk"] as const;
export type UiTheme = (typeof UI_THEMES)[number];

/**
 * Default canonico del tema all'avvio (decisione brand ratificata dall'owner,
 * TSK-044): `"90s-party"`. Il valore è esposto come costante per essere
 * riusabile dai test e dal componente `ThemeSelector` (preselezione).
 */
export const DEFAULT_UI_THEME: UiTheme = "90s-party";

/**
 * Attributo DOM che veicola il tema corrente. Centralizzato qui per evitare
 * drift fra `index.html` (default iniziale), `useTheme` (applicazione) e
 * tests (asserzioni sull'attributo).
 */
export const DATA_THEME_ATTR = "data-theme";

/**
 * TSK-044 / F-044-01 — Validazione runtime di un valore tema proveniente da
 * input non tipizzati (es. valore restituito da `port.load()` da una versione
 * precedente o da uno store corrotto). Restituisce il valore se incluso in
 * `UI_THEMES`, altrimenti `DEFAULT_UI_THEME`. Centralizzato qui — accanto a
 * `UI_THEMES` — per evitare drift fra i consumatori (ThemeSelector, tests) e
 * per essere riusabile dai test. Pattern allineato a `parseVideoFilter` di
 * `useVideoSettings` (TSK-037 / F-037-01).
 */
export function parseTheme(raw: string): UiTheme {
  return (UI_THEMES as readonly string[]).includes(raw)
    ? (raw as UiTheme)
    : DEFAULT_UI_THEME;
}

export interface UseThemeResult {
  /** Tema corrente (sempre definito; default applicato in attesa del load). */
  theme: UiTheme;
  /** Aggiorna il tema, applica `data-theme` e — se presente la porta — persiste. */
  setTheme: (next: string) => void;
}

/**
 * Hook condiviso da App e Settings per leggere/scrivere il tema UI.
 *
 * Comportamento:
 * - Senza `port`: stato puramente in-memory inizializzato a `DEFAULT_UI_THEME`.
 * - Con `port`: al mount invoca `port.load()`; se ritorna un valore lo applica
 *   (e lo riflette sul `data-theme` del documento). Se la load fallisce,
 *   logghiamo un warning e restiamo sul default (UI non si blocca).
 * - Ad ogni `setTheme(next)`:
 *   1. aggiorna lo stato in memoria,
 *   2. imposta `document.documentElement.setAttribute("data-theme", next)`,
 *   3. invoca `port.save(next)` best-effort (un eventuale reject NON rolla
 *      back la UI, ma è loggato per facilitare il debug; coerente con
 *      `useVideoSettings` dopo i fix CQRL F-036-03).
 *
 * NB: l'applicazione del `data-theme` al DOM è un effetto. Lo eseguiamo dentro
 * `useEffect([theme])` (invece che dentro `setTheme`) così la sincronizzazione
 * documento↔stato resta valida anche quando il tema cambia per altre vie
 * (es. load asincrono dalla porta al mount).
 */
export function useTheme(port?: ThemePort): UseThemeResult {
  const [theme, setThemeState] = useState<UiTheme>(DEFAULT_UI_THEME);

  // Idratazione dalla porta (one-shot al mount). `cancelled` evita setState
  // dopo unmount nei test che svolgono il render in <StrictMode> o smontano
  // rapidamente l'albero.
  useEffect(() => {
    let cancelled = false;
    if (!port) return;
    port
      .load()
      .then((loaded) => {
        if (cancelled) return;
        // F-044-01 — valore esterno non validato: se la porta restituisce un
        // tema sconosciuto (schema legacy, corruzione store) cadiamo sul
        // default canonico invece di propagare un `data-theme` non riconosciuto.
        if (loaded) setThemeState(parseTheme(loaded));
      })
      .catch((err) => {
        if (cancelled) return;
        // Persistenza degradata: continuiamo sul default in memoria.
        console.warn("[useTheme] port.load() rejected:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [port]);

  // Applicazione dell'attributo `data-theme` ad ogni cambio di stato.
  // Guard per ambienti privi di `document` (Node test runner senza jsdom
  // env): l'effetto resta no-op invece di lanciare.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute(DATA_THEME_ATTR, theme);
  }, [theme]);

  const setTheme = useCallback(
    (next: string) => {
      // F-044-01 — `next` arriva dal DOM (es. `event.target.value` di un
      // <select>) ed è quindi un valore esterno non validato: passa da
      // `parseTheme` per coerenza con il path di idratazione (default su
      // input sconosciuto, mai propagare un `data-theme` non riconosciuto).
      const parsed = parseTheme(next);
      setThemeState(parsed);
      if (port) {
        // Best-effort: non blocchiamo la UI sull'I/O. Persistiamo il valore
        // *normalizzato* per evitare di salvare junk nello store.
        port.save(parsed).catch((err) => {
          // Diagnostico: la UI resta su `parsed`; logghiamo perché la
          // persistenza è fallita (quota piena, DB chiuso da un altro tab, ecc.).
          console.warn("[useTheme] port.save() rejected:", err);
        });
      }
    },
    [port],
  );

  return { theme, setTheme };
}
