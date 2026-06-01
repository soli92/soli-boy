---
id: CSS-DESIGN-001
tier: emergent
status: candidate
applies_to: { language: css, context: [design, robustness] }
severity_default: low
auto_fixable: false
created: 2026-06-01
source_tsk: TSK-040
promoted_from: ""
---
# CSS-DESIGN-001 — Documentare esplicitamente il contratto dei token CSS custom property esterni

**Regola:** quando un foglio di stile app fa `var(--token-del-ds-esterno)` dopo aver rimosso le definizioni locali di fallback, deve documentare (via commento inline o fallback nella var()) quali token sono attesi dal pacchetto esterno e a partire da quale versione.

**Rationale:** CSS `var()` senza fallback degrada silenziosamente a `initial`/inherited se il token non e definito — nessun errore di build, nessun test failure. Su upgrade del design system esterno, la regressione visiva e invisibile agli strumenti automatici.

**Esempio (bad):**
```css
/* nessuna documentazione — si assume che il DS esporti questo token */
.my-class { background: var(--sd-color-accent-1-bg); }
```

**Esempio (good — opzione A: commento contratto):**
```css
/* Token forniti da @soli92/solids >= 1.14.1: --sd-color-accent-1-bg, --sd-color-accent-1 */
.my-class { background: var(--sd-color-accent-1-bg); }
```

**Esempio (good — opzione B: fallback esplicito):**
```css
.my-class { background: var(--sd-color-accent-1-bg, #16243d); color: var(--sd-color-accent-1, #93c5fd); }
```

**Provenienza:** emersa in review di TSK-040 (integrazione @soli92/solids reale; rimozione blocchi :root/[data-theme] approssimati lascia classi .a-* / .ab-* / .sb-screen con token non definiti localmente). Gate umano richiesto per promozione a canonical (PATTERN §19.5).
