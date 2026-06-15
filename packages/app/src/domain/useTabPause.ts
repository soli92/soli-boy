// TSK-098 (EP-014 / US-052) — Estrazione hook `useTabPause` da App.tsx.
//
// Incapsula la logica di pausa/ripresa dell'engine emulatore sincronizzata al
// cambio tab UI dell'applicazione. Pre-estrazione il blocco viveva inline in
// `AppContent` (App.tsx:263-290 nella versione pre-TSK-098): un `useEffect`
// + due `useRef` (`prevTabRef`, `engineRef`) intrecciati alla logica di rendering
// di un componente già ~370 LOC.
//
// Il refactor è puramente strutturale (P2-01 della review SP-12, conf. 0.85):
// l'hook accetta tutte le dipendenze come parametri (engine, activeTab,
// selected, playTab) ed è privo di import dal componente chiamante. Stessa
// semantica del codice originale — pausa quando si lascia la tab "play",
// resume quando si torna su "play", entrambi guardati da `selected` non-null
// (no-op in stato idle).
//
// L'engine è descritto da un'interfaccia minimale (`PausableEngine`, subset di
// `EmulatorEngine`): coerente con il pattern di `useAppLifecycle` (TSK-065)
// che usa un proprio `LifecycleTarget` invece di importare `CoreWrapper`. Il
// guard "resume su engine non configurato è no-op" resta in `WasmBoyEngine.resume()`
// (wasmboy-engine.ts:77-84), che protegge anche dal resume su idle.
//
// `Tab` è parametrico (`<T extends string>`) così l'hook non dipende dal set
// di tab specifico di App.tsx (`"play" | "library" | "settings" | "info"`): il
// chiamante passa la stringa-sentinella che rappresenta la tab "in gioco".

import { useEffect, useRef } from "react";

/** Interfaccia minimale del target di pausa/ripresa (subset di `EmulatorEngine`). */
export interface PausableEngine {
  pause(): void;
  resume(): void;
}

/**
 * Hook: sincronizza pausa/ripresa dell'engine al cambio tab.
 *
 * - Quando l'utente lascia `playTab` → `engine.pause()`.
 * - Quando l'utente torna su `playTab` → `engine.resume()`.
 * - Entrambi i rami sono no-op se `selected` è nullish (stato idle: niente ROM).
 *
 * L'engine è memorizzato in una ref per evitare di reinstallare l'effetto ad
 * ogni cambio di `engine` (che in App.tsx muta quando muta `selected.core`):
 * il side-effect è triggerato solo dal cambio tab, non dal cambio engine.
 *
 * @param engine    Target con `pause()` / `resume()`. La ref si aggiorna ad ogni render.
 * @param activeTab Tab UI corrente (stringa).
 * @param selected  Selezione ROM corrente (verità "il gioco è in sessione"); falsy ⇒ no-op.
 * @param playTab   Sentinella che identifica la tab "in gioco".
 */
export function useTabPause<T extends string>(
  engine: PausableEngine,
  activeTab: T,
  selected: unknown,
  playTab: T,
): void {
  // Ref all'engine per la pausa tab-leave. L'engine cambia quando cambia
  // `selected` (in App.tsx via `useMemo`), quindi aggiorniamo la ref ad ogni render.
  const engineRef = useRef<PausableEngine>(engine);
  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  // Tab precedente: inizializzata alla tab corrente al mount, così il primo
  // render non triggera né pause né resume.
  const prevTabRef = useRef<T>(activeTab);

  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev === activeTab) return;

    if (selected) {
      // Lascio playTab → pausa.
      if (prev === playTab && activeTab !== playTab) {
        engineRef.current.pause();
      }
      // Torno a playTab → riprendo (guard `configured` nell'engine protegge da idle).
      if (prev !== playTab && activeTab === playTab) {
        engineRef.current.resume();
      }
    }

    prevTabRef.current = activeTab;
  }, [activeTab, selected, playTab]);
}
