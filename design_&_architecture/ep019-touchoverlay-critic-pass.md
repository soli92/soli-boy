# TSK-087 — EP-019 Critic Pass: TouchOverlay Positioning

**Pattern EP-019**: Critic/Judge pass su implementazione esistente  
**Data**: 2026-06-15  
**Status**: done

---

## ART-DIRECTOR STATEMENT

```
INTENT: Verificare che l'overlay touch sia posizionato in modo ottimale
per l'esperienza "emulator-first" su mobile.
PROBLEM: Finding precedente (2026-06-09) indicava "touch overlay mal posizionato"
DESIGN RATIONALE: L'overlay deve stare SOTTO lo schermo in portrait (non sopra)
e usare un layout a 3 colonne in landscape. Il gioco deve essere sempre visibile.
CONSTRAINTS: WCAG (aria-hidden ok, non nel tab order), touch device only, fullscreen mode.
```

## CRITIC PASS (EP-019 Judge)

### Implementazione attuale (Variante B, post-sprint 10)

```
Portrait non-fullscreen: overlay NEL FLUSSO NORMALE sotto lo schermo ✓
Landscape: layout 3 colonne via CSS (D-pad sx, schermo centro, pulsanti dx) ✓
Fullscreen: overlay con position:absolute inset:0 ancorato a .sb-screen ✓
```

### Critic findings

| Finding | Severity | Verdict |
|---|---|---|
| Positioning Variante B: portrait overlay sotto lo schermo | ✓ corretto | PASS |
| Landscape 3-col: schermo sempre visibile, controlli non si sovrappongono | ✓ corretto | PASS |
| Fullscreen overlay: inset:0 ancorato al viewport | ✓ corretto | PASS |
| aria-hidden="true" + non nel tab order | ✓ WCAG compliant | PASS |

### VERDICT: **pass** — nessun code change necessario

**Nota EP-019**: Il critic pass su un'implementazione ESISTENTE è altrettanto
valido dell'applicazione a nuove feature. La conferma esplicita che "Variante B è
corretta" è un output di valore: documenta una decisione di design che altrimenti
rischia di essere ri-dibattuta in future sprint.

**Finding non previsto**: L'overlay ha già gestione gamepad (si nasconde quando
un gamepad Bluetooth è connesso — `hideWhenGamepad` prop). Questo non era nella
specifica originale EP-019 e rivela che il design è più completo di quanto il
backlog suggerisse.
