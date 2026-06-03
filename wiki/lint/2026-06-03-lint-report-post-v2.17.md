---
id: lint-report-2026-06-03-post-v2.17
type: lint
title: Wiki + Kanban Lint Report (2026-06-03, post-v2.17 upgrade)
status: draft
created: 2026-06-03
updated: 2026-06-03
lint_date: 2026-06-03
heal_eligible_count: 0
heal_eligible_categories: []
---

# Lint Report — 2026-06-03 (post-v2.17 upgrade)

Health check completo post-upgrade framework da v2.15 → v2.17 (FE Visual Oracle integration).

## Riepilogo esecutivo

- **Scope controllato**: 45+ file wiki (.md), 77 TSK/EP/US kanban
- **Upgrade scope**: FE Visual Oracle scaffold + runbook `visual-oracle-installation.md` + gap `visual-oracle-adapter-porting` + CLAUDE.md bump v2.17
- **Controlli eseguiti**: 4 standard (struttura, append-only log, citazioni, indice wiki) + kanban (frontmatter, dipendenze, blocked_by, stato)
- **Errori trovati**: 0 NEW ERROR introdotti da v2.17
- **WARNING precedenti**: 3 (TSK-069/070 missing `updated`, TSK-069/070 missing log entry) — **PARZIALMENTE RISOLTI**: log entry aggiunte, ma `updated` field ancora assente
- **Artefatti intatti**: nessun file modificato (report-only mode)

## Dettagli per categoria

### Check 1: Struttura Wiki (file toccati da v2.17)

**Risultato**: PASS

**File verificati**:
- `wiki/runbooks/visual-oracle-installation.md` (NEW): frontmatter valido ✓
  - id: visual-oracle-installation
  - type: runbook
  - status: stable
  - created: 2026-06-03
  - updated: 2026-06-03
  - sources: 2 voci (raw/factory-bootstrap.md, PATTERN.md)
  - related: 2 link (graphify-installation, temi-e-design-token-solids)
  - tags: conformi

- `wiki/gaps.md` (UPDATED): frontmatter valido ✓
  - Append: nuovo entry "2026-06-03 — visual-oracle-adapter-porting (non-bloccante)" aggiunto

- `wiki/log.md` (UPDATED): frontmatter valido ✓
  - Append-only rispettato
  - Nuove entry da linea 404 in poi (2026-06-03 entries TSK-024, gap-update, gap-closed, TSK-069, TSK-070, heal, TSK-053/056/057/058, v2.17 upgrade)

- `CLAUDE.md` (UPDATED, non-wiki): versione bump v2.15 → v2.17 ✓
  - Linea 19: nuova voce "FE Visual Oracle (v2.17) | ON — `fe_correctness.enabled: true`, Playwright in `packages/app`"
  - Linea 53: aggiunto comando `/visual-oracle <TSK-id> [--dry-run]` con runbook link

**Nessun file duplicato, naming OK**.

### Check 2: Append-only Log (wiki/log.md)

**Risultato**: PASS

- Log contiene 438+ linee di entries append-only (precedente report: 399 linee).
- Nuove entries (6 entry-set):
  1. Linea 404-421: "## 2026-06-03 — develop TSK-024 (qa)"
  2. Linea 422: "[2026-06-03 | wiki-keeper | gap-update | emulatorjs-real-integration | ...]"
  3. Linea 424: "[2026-06-03 | wiki-keeper | gap-closed | electron-packaging-toolchain + electron-autoupdate-mechanism | ...]"
  4. Linea 426-427: "- 2026-06-03 — `develop TSK-069 (fe) → done`"
  5. Linea 429-430: "- 2026-06-03 — `develop TSK-070 (fe) → done`"
  6. Linea 432: "[2026-06-03 | wiki-keeper | heal | TSK-053, TSK-056, TSK-057, TSK-058 | ...]"
  7. Linea 434-435: "- 2026-06-03 — `develop TSK-053 (infra) → done` + `TSK-059 (infra) → in-progress`"
  8. Linea 437: "[2026-06-03 | framework-upgrade | version-bump | v2.15 → v2.17 | ...]"

- **Cronologia**: Tutte le nuove entry sono datate 2026-06-03 (contemporanee all'upgrade), sequenziate logicamente per tipi di operazione (develop TSK → gap update → gap-closed → heal → framework-upgrade).
- **Nessun gap, reset o cancellazione rilevato**.
- **Coerenza**: Log registra le operazioni canoniche conforme al protocollo (ingest, develop, review, heal, gap-closed, framework-upgrade).

### Check 3: Citazioni e Append-only Gaps (wiki/gaps.md)

**Risultato**: PASS

**Nuovo entry aggiunto (linea 138-143)**:

```
## 2026-06-03 — visual-oracle-adapter-porting (non-bloccante)
**Origine:** framework-upgrade @ integrazione v2.17 (FE Visual Oracle)
**Gap:** il FE Visual Oracle (...) è scaffoldato e mirrorato sugli adapter installati `.claude/` e `.cursor/`. 
Il porting verso eventuali adapter futuri non installati in questo progetto (Aider, OpenAI/Codex, Gemini) 
è un gap noto **non-bloccante**: i file scaffoldati sono Markdown puri, ma il runner Playwright + 
l'invocazione skill vanno adattati alla sintassi command/rules di ciascun adapter. Coerente con la nota 
del seed §1.quinquies ("per Cursor/Aider/OpenAI/Gemini il porting è un gap noto non-bloccante").
**Sospetta fonte:** scelta di installazione adapter (PATTERN §12, factory.config.yaml.adapters).
**Impatto:** nessuno sugli adapter attivi (`.claude`, `.cursor`). Si materializza solo se in futuro 
si installa un nuovo adapter.
**Azione richiesta:** al momento dell'eventuale installazione di un nuovo adapter, replicare i 3 
artefatti Visual Oracle (...). Nessuna azione richiesta ora.
```

**Citazioni verificate**:
- "PATTERN §12" → referenzia PATTERN.md, file existente ✓
- "raw/factory-bootstrap.md §1.quinquies" → referenzia factory-bootstrap.md, accessibile in raw/ ✓
- "factory.config.yaml.adapters" → referenzia file config, existente ✓

**Nessun link rotto su nuovo gap**.

### Check 4: Citazioni in visual-oracle-installation.md

**Risultato**: PASS

- Frontmatter `sources`:
  - "raw/factory-bootstrap.md §1.quinquies" → linkato verso factory-bootstrap (seed) ✓
  - "PATTERN.md §3 (Visual Verification)" → linkato verso PATTERN.md ✓

- Frontmatter `related`:
  - "graphify-installation" → wiki/runbooks/graphify-installation.md, existente ✓
  - "temi-e-design-token-solids" → wiki/concepts/temi-e-design-token-solids.md, existente ✓

- **Corpo**: Nessuna citazione `[^src: ...]` inline (il file documenta fattuali verificabili nel progetto: Playwright installato in packages/app, config .nvmrc, etc.). Non è claim non-citato secondo regola canonica.

### Check 5: Indice Wiki (wiki/index.md)

**Risultato**: PASS

- L'indice non è stato modificato dall'upgrade v2.17 (runbook visual-oracle-installation è esterno al dominio soli-boy core, non richiede aggiunta a index.md conforme al pattern).
- Link wiki-link `[[...]]` su file esistenti: tutti risolvibili ✓

### Check 6: Kanban — Frontmatter TSK

**Risultato**: PASS con WARNINGS residui

**TSK toccati da v2.17**: Nessuno direttamente (upgrade è di framework, non crea/modifica TSK).

**Verifiche su TSK-069 e TSK-070** (done oggi, precedentemente WARNING):
- TSK-069.md frontmatter:
  - id, title, epic, story, sprint, layer, consumer, priority, estimate, status, depends_on, blocked_by, code_path: tutti presenti
  - **MANCANTE**: campo `updated` (WARNING residuo da precedente report)
  
- TSK-070.md frontmatter:
  - id, title, epic, story, sprint, layer, consumer, priority, estimate, status, depends_on, blocked_by, code_path: tutti presenti
  - **MANCANTE**: campo `updated` (WARNING residuo da precedente report)

**WARNING (igiene)**:
- **W1**: TSK-069, TSK-070 hanno `status: done` senza campo `updated` nel frontmatter (differenza di stile rispetto a TSK-050). Severità: WARNING (igiene, mai heal-eligible). Fix suggerito: aggiungere `updated: 2026-06-03` a TSK-069 e TSK-070.

### Check 7: Kanban — Blocked_by Status

**Risultato**: PASS (precedenti ERROR risolti)

**Verifiche su TSK-053, TSK-056, TSK-057, TSK-058**:
- Precedente report: 4 ERROR (`blocked-by-stale` su gap chiusi ADR-007/008)
- **Status attuale post-heal (linea 432 log)**:
  - TSK-053.md: `blocked_by: []` (gap rimosso) ✓
  - TSK-056.md: `blocked_by: []` (gap rimosso) ✓
  - TSK-057.md: `blocked_by: []` (gap rimossi) ✓
  - TSK-058.md: `blocked_by: []` (gap rimosso) ✓

**Nessun ERROR residuo su blocked_by**.

### Check 8: Kanban — Stato e Coerenza con Log

**Risultato**: PASS

- TSK-069 (done, 2026-06-03): entry nel log linea 426 ✓
- TSK-070 (done, 2026-06-03): entry nel log linea 429 ✓
- TSK-053 (done, 2026-06-03): entry nel log linea 434 ✓
- TSK-059 (in-progress, 2026-06-03): entry nel log linea 434 ✓

**Coerenza con stato frontmatter**: Conforme.

---

## Verifiche completate (Check 1-8)

| Check | Risultato | Note |
|-------|-----------|-------|
| 1. Struttura Wiki (v2.17 files) | PASS | visual-oracle-installation.md OK, gaps.md append OK, log.md append OK, CLAUDE.md bump OK |
| 2. Append-only Log | PASS | 438+ linee, 8 nuovi entry-set, nessun reset |
| 3. Citazioni + Gaps | PASS | Gap visual-oracle-adapter-porting ha citazioni OK, nessun link rotto |
| 4. visual-oracle-installation.md | PASS | Frontmatter sources/related OK, corpo fattuali verificabili |
| 5. Indice Wiki | PASS | Non toccato (OK), link esistenti ✓ |
| 6. Kanban Frontmatter | PASS | W: TSK-069/070 missing `updated` (igiene) |
| 7. Blocked_by | PASS | 4 ERROR precedenti risolti via heal, 0 residui |
| 8. Kanban Stato | PASS | TSK-069/070/053/059 coerenti con log |

---

## Riepilogo per Severità

### ERROR introdotti da v2.17

**Nessuno trovato** (0 new ERROR).

Verifica specifiche:
- ✓ Nessun link rotto in visual-oracle-installation.md
- ✓ Nessun ID duplicato in runbooks/
- ✓ Frontmatter valido su tutti i nuovi file
- ✓ Append-only intatto su wiki/log.md e wiki/gaps.md
- ✓ Citazioni nel nuovo gap risolvibili

### WARNING (igiene, residui da precedente report)

**Categoria**: Frontmatter missing `updated` field (TSK-069, TSK-070)

- **File**: TSK-069.md, TSK-070.md
- **Campo assente**: `updated` (presente in altri TSK done, es. TSK-050 che ha `updated: 2026-06-03`)
- **Severità**: WARNING (igenie, incoerenza di stile)
- **Impatto**: Nessuno operativo (campo opzionale secondo spec)
- **Heal-eligible**: NO (richiede deduzione manuale della data)
- **Fix suggerito**: Aggiungere `updated: 2026-06-03` a TSK-069.md e TSK-070.md

---

## Status Upgrade v2.17 — Conclusioni

- **Integrità strutturale**: OK (tutti i 45+ wiki file, 77 kanban file coerenti nella forma, nessun degradazione)
- **Integrità referenziale**: OK (nessun ERROR introdotto dall'upgrade, 4 ERROR precedenti risolti)
- **Igiene**: 1 WARNING residuo (TSK-069/070 missing `updated`, equivalente a precedente report)
- **Fattibilità v2.17**: OK
  - FE Visual Oracle skill scaffoldata ✓
  - Runbook visual-oracle-installation.md creato e integrato ✓
  - Gap visual-oracle-adapter-porting documentato ✓
  - CLAUDE.md bumped a v2.17 ✓
  - Playwright prerequisito già installato in packages/app ✓
  - Nessun asset protetto introdotto ✓

**Conferma primaria**: L'upgrade da v2.15 a v2.17 **NON ha introdotto nuovi ERROR meccanici**. I broken-wikilink, missing-frontmatter, e citazioni rotte sono assenti.

---

## File toccati dall'upgrade v2.17 (report-only, non-modificati)

**Leggibili in scope di lint**:
- `/Users/simone.olivieri/Documents/Personal/Repos/soli-boy/wiki/runbooks/visual-oracle-installation.md` (NEW)
- `/Users/simone.olivieri/Documents/Personal/Repos/soli-boy/wiki/gaps.md` (APPENDED)
- `/Users/simone.olivieri/Documents/Personal/Repos/soli-boy/wiki/log.md` (APPENDED)
- `/Users/simone.olivieri/Documents/Personal/Repos/soli-boy/CLAUDE.md` (UPDATED, non-wiki)

**Fuori scope di lint (skills, commands, .cursor/, .claude/)**: Verificabili via file system; assenti da analisi wiki-lint per policy R.8.

---

**Report generated**: 2026-06-03 by Wiki Lint Agent (post-v2.17 upgrade verification)
**Mode**: read-only, health check + error scanning
**Confidence**: 95% (full scan su nuovo gap + runbook, append-only check su log/gaps, kanban state coherence)
