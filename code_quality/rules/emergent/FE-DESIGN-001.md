---
id: FE-DESIGN-001
tier: emergent
status: candidate
applies_to:
  language: "*"
  framework: any
  context: [design, traceability]
severity_default: low
auto_fixable: false
created: 2026-07-03
source_tsk: TSK-172
promoted_from: ""
gate: human
---
# FE-DESIGN-001 — Decisione di breakpoint responsive deve essere rispecchiata nella documentazione wiki/DoD

**Regola:** quando un dev-agent modifica un valore di breakpoint responsive (es. numero di colonne
in una griglia Tailwind, soglia `min-width` in una media query) rispetto a quanto specificato nel
DoD del TSK o nella wiki entity di riferimento, la documentazione (wiki/concepts/, DoD, schermata-*
entities) deve essere aggiornata nello stesso TSK o in un task wiki esplicito apertura contestuale.

**Rationale:** I breakpoint responsive sono contratti di design documentati (wiki/concepts/layout-responsive.md,
schermata-*.md). Una deviazione non tracciata crea drift silenzioso tra il design documentato e il
codice effettivo: le future review e i test di regressione si confrontano con la spec errata, non con
la realta' implementata. Il drift e' tanto piu' rischioso quanto piu' il breakpoint e' testato via
visual oracle (che accetta il valore de-facto, non quello de-jure).

**Esempio (bad):**
```tsx
// DoD dice: "3 colonne su tablet (768px)" — wiki dice "3 (tablet)"
// Il dev-agent introduce md:grid-cols-4 senza aggiornare il DoD/wiki
<ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" />
```

**Esempio (good — opzione A: aggiorna wiki nello stesso TSK):**
Aggiornare `wiki/concepts/layout-responsive.md`: "Library: 2 col (mobile), 3 (sm 640-767px),
4 (md 768-1023px), 5 (lg ≥1024px)" con commento che documenta la motivazione del cambio.

**Esempio (good — opzione B: apri wikigap esplicito):**
In `wiki/gaps.md` aggiungere: "OPEN: layout-responsive §Library specifica 3 col tablet; implementato
4 col (md) per eliminare salto 3→5 [TSK-172]. Ratifica owner pendente."

**Provenienza:** emersa in review TSK-172 (US-108/EP-022). Il dev-agent ha scelto md:grid-cols-4
invece di md:grid-cols-3 (spec) con rationale documentato nel commento inline, ma wiki/DoD restano
a "3 colonne". Gate umano richiesto per promozione a canonical (PATTERN §19.5).
