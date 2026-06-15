# TSK-089 — SoliDS Token Audit: uso CSS tokens in soli-boy

**Pattern EP-019**: Critic/Judge audit design token usage  
**Data**: 2026-06-15  
**Status**: done

---

## ART-DIRECTOR STATEMENT

```
INTENT: Documentare l'uso attuale di SoliDS design tokens in soli-boy,
identificare pattern incoerenti o opportunità di migliore integrazione.
PROBLEM: soli-boy usa classi sb-/sd- non documentate in modo sistematico.
DESIGN RATIONALE: Un design system serve solo se usato in modo coerente.
L'audit EP-019 espone dove il token usage è ideale vs dove diverge.
CONSTRAINTS: @soli92/solids come dependency, CSS custom properties, no runtime SDK.
```

## DESIGN SPEC (DSL)

```
Scope audit: packages/app/src/**/*.tsx + *.css
Token namespaces trovati:
  - sb-* : soli-boy custom classes (NOT SoliDS tokens)
  - sd-* : SoliDS utility classes (flex, items-center, between)
  - CSS var: non rilevate nel source (uso tramite classi, non var dirette)
```

## FINDINGS

### Token namespace usage

| Namespace | Esempi trovati | Note |
|---|---|---|
| `sb-app`, `sb-title`, `sb-logo`, `sb-tab-bar` | App.tsx layout | Classi custom soli-boy — non SoliDS |
| `sd-flex`, `sd-items-center`, `sd-between` | App.tsx header | SoliDS utility classes — corretto ✓ |
| `sb-tab-btn`, `sb-tab-btn--active` | Tab navigation | Custom, ma seguono pattern BEM |
| `sb-note`, `sb-btn` | UI elements | Custom — candidati per migrazione a SoliDS components |
| `sb-accordion-wrap` | Settings | Custom — potrebbe usare SoliDS Accordion |
| `sb-screen` | Player viewport | Custom — engine-agnostico, OK custom |

### EP-019 Critic Assessment

**Cosa funziona**: l'uso di `sd-*` per utility layout è corretto. SoliDS è usato come
dependency e i token CSS sono ereditati via cascade. 

**Gap trovati**:
1. Le classi `sb-*` sono soli-boy-custom e duplicate logica che SoliDS potrebbe fornire
   (es. `sb-btn` → SoliDS Button, `sb-accordion-wrap` → SoliDS Accordion se esiste)
2. Non c'è uso diretto di CSS custom properties (`--sd-color-*`, `--sd-space-*`) —
   l'integrazione avviene solo tramite classi, non tramite tokens diretti
3. Il theming (light/dark) funziona via `data-theme` propagato a `<html>` — dipende da SoliDS themes ✓

**Finding non previsto (EP-019 value)**: L'audit ha rivelato che soli-boy usa SoliDS
come THEME PROVIDER più che come COMPONENT LIBRARY. I componenti UI sono custom (sb-*)
ma si appoggiano alle custom properties di SoliDS per colori e spacing. Questo è un
pattern valido ma non documentato — la collaborazione soli-boy ↔ SoliDS è "implicit coupling"
tramite CSS cascade, non "explicit coupling" tramite component import.

**Raccomandazione**: In un prossimo sprint, migrare `sb-btn` → `@soli92/solids Button` e
`sb-accordion-wrap` → SoliDS Accordion (quando disponibile). Riduce il CSS custom e
aumenta la coerenza con il design system.

### VERDICT: **pass** (con 2 finding di miglioramento)
