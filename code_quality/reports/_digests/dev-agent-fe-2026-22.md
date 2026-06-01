# Digest settimanale code-review — dev-agent fe — 2026-W22

Generato: 2026-06-01 | Reviewer: code-reviewer@2.14.0

## TSK-035 — Schermo intero (Fullscreen API) — iter-1 → conditional

**Verdict:** conditional (1 medium blocking + 3 low advisory)
**Stack:** typescript/react/vite (conf 0.97)
**Files toccati:** useFullscreen.ts, Player.tsx, Player.fullscreen.test.tsx, Player.test.tsx

### Pattern ricorrenti da tenere a mente

**F-035-01 [medium, blocking] — Guard null in toggle() mancante (TS-ROBUST-001)**
In `useFullscreen.ts:91-97`, `toggle()` confronta `document.fullscreenElement === ref.current`
senza guard quando `ref.current` è null. Il path `null===null` entra nel ramo exit()
che poi esce onestamente, ma la semantica e' fuorviante e il caso non e' testato.
Correzione: aggiungere `if (!ref.current) return;` all'inizio di toggle().

**F-035-03 [low, advisory] — Dissonanza aria-label / testo visibile bottone (REACT-A11Y-001)**
In `Player.tsx:119,127`, `aria-label="Esci da schermo intero"` ma testo visibile
"Esci schermo intero" (manca "da"). Viola WCAG 2.5.3 Label in Name.
Correzione: usare `{fsLabel}` come children del bottone per allineamento completo.

**F-035-02 [low, advisory] — Cast `as HTMLElement | null` non giustificato (TS-IDIOM-002)**
Firma hook dovrebbe essere `RefObject<HTMLElement | null>` invece di `RefObject<Element | null>`
per eliminare il cast a riga 75 senza perdere precisione.

**F-035-04 [low, advisory] — Commento mancante su limite `[ref]` dipendenza useEffect (TS-ROBUST-001)**
L'effetto con `[ref]` gira solo al mount perche' ref identity e' stabile — corretto per l'uso
corrente, ma non documentato come vincolo esplicito (mono-target by design).

### Cosa ha funzionato bene (da replicare)

- Cleanup listener fullscreenchange su unmount: pattern corretto con return cleanup nell'effetto.
- Fallback onesto: `isApiSupported()` + bottone disabled + title — nessun fallback custom inventato.
- a11y di base: aria-label dinamico + aria-pressed sincronizzati.
- Scope engine-agnostico rispettato: nessuna modifica a EmulatorEngine.
- Test set completo: 6 casi inclusi cleanup su unmount e fallback API assente.

### Prossimo step

Risolvere F-035-01 e F-035-03 (bloccanti al conditional). max_diff_lines: 80.
Scope fix: useFullscreen.ts (riga 91) e Player.tsx (riga 127). Non toccare EmulatorEngine.
