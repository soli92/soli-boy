# TSK-088 — EP-019 Critic Pass: Info/About Navigation

**Pattern EP-019**: Critic/Judge pass + conferma design decision  
**Data**: 2026-06-15  
**Status**: done

---

## ART-DIRECTOR STATEMENT

```
INTENT: Le sezioni Info/About/Privacy devono essere in una tab dedicata,
NON mescolate con le impostazioni di gioco.
PROBLEM: Backlog item "sezioni info da spostare in nav dedicata (F-01)"
DESIGN RATIONALE: L'utente cerca info legali/privacy raramente; devono essere
accessibili ma non nel percorso primario (play → library → settings).
CONSTRAINTS: 4 tab max per bottom nav (WCAG, cognitive load).
```

## DESIGN SPEC (DSL)

```
Nav structure (implementata):
  Tab 1: "play"    — schermata di gioco (emulator-first, default)
  Tab 2: "library" — griglia ROM persistite
  Tab 3: "settings" — impostazioni audio/video/input
  Tab 4: "info"    — "Info & Privacy" (legal, privacy, about)

Separazione: Play/Library/Settings = CORE USER PATH
             Info = REFERENCE (raro accesso)
```

## CRITIC PASS (EP-019 Judge)

### Analisi implementazione (App.tsx:63-69)

```typescript
type Tab = "play" | "library" | "settings" | "info";
const TABS = [
  { id: "play",     label: "Gioca" },
  { id: "library",  label: "Libreria" },
  { id: "settings", label: "Impostazioni" },
  { id: "info",     label: "Info & Privacy" },
];
```

### Critic findings

| Finding | Verdict |
|---|---|
| 4 tab ben distinte, "info" separata da "settings" | PASS ✓ |
| Default tab = "play" (emulator-first) | PASS ✓ |
| "Info & Privacy" combina legal + privacy in un'unica tab (non due) | CONDITIONAL — vedi nota |

**Nota conditional**: Potrebbe valere la pena separare "Info" (about/crediti) da
"Privacy" (dati, consenso) in futuro. Per ora la singola tab è giustificata
(entrambe hanno bassa frequenza di accesso). Da rivalutare se i contenuti crescono.

### VERDICT: **pass** (conditional su separazione futura Info/Privacy)

**Finding non previsto (EP-019 value)**: Il backlog diceva "sezioni info da spostare
in nav dedicata" come se fosse da IMPLEMENTARE. Il critic pass ha rivelato che era
GIÀ IMPLEMENTATA da uno sprint precedente. L'EP-019 Design Intelligence Layer, nella
sua funzione di critica, ha EVITATO lavoro duplicato — questo è esattamente il valore
del critic/judge pattern: non solo valutare qualità, ma rilevare quando l'implementazione
supera già la specifica.
