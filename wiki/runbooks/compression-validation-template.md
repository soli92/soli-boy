---
id: compression-validation-template
type: runbook
title: "Compression Layer Validation (Fase 1.5) — template fill-in-the-blanks"
status: draft
created: 2026-05-28
updated: 2026-05-28
sources:
  - "wiki/concepts/factory-compression-layer.md (design doc, §Fase 1.5)"
  - "PATTERN.md §20 (Output Compression Layer)"
  - ".claude/skills/caveman-protocol.md"
  - ".claude/commands/compression.md"
related:
  - factory-compression-layer
  - caveman
  - migration-v214
  - parallel-scheduler
tags: [runbook, validation, fase-1-5, compression, caveman, gate-empirico, template]
---

# Compression Layer Validation (Fase 1.5) — Template

> ⚠️ **Status v2.15 (2026-05-29)** — Gate riformulato come **opt-in deferred**, non
> bloccante per il consolidamento del PATTERN. La Fase 2 (Context Compression Layer
> via Graphify) è stata implementata in v2.14 con bypass esplicito di questo gate
> (vedi [[factory-compression-layer]] §«v2.15 consolidation»). Questo runbook resta
> **riferimento operativo** per chiunque (derivatore della factory, utente con
> factory candidata reale) voglia eseguirne la validation empirica e proporne
> l'esito come input per v2.16+. In assenza di esecuzione il default rimane
> `compression.output.enabled: false`.

> Runbook **template** per la Fase 1.5 di validation empirica del Compression Layer
> (PATTERN §20 v2.14+). Da copiare in
> `wiki/runbooks/compression-validation-YYYY-MM-DD-<factory-name>.md` ed eseguire su una
> factory derivata reale aggiornata a v2.14 o successiva. Questo file resta come
> template di riferimento.

## Scopo del runbook

Eseguire (a discrezione) il **gate empirico** Fase 1.5 (vedi
[[factory-compression-layer]] §Roadmap + §«v2.15 consolidation»): misurare
risparmio, drift, qualità artefatti sulla factory derivata candidate. L'esito è
input per decisioni evolutive (es. proposta di default più aggressivi, taratura
delle policy) **non per** il consolidamento del PATTERN, che in v2.15 è già
chiuso indipendentemente da questo gate.

## Prerequisiti — Checklist

Verifica **ognuno** prima di procedere. Se anche uno solo è mancante → STOP, setup
incompleto.

### Factory derivata candidate

- [ ] Factory derivata con `PATTERN.md` ≥ v2.14 (verifica: `grep "pattern_version" factory.config.yaml`)
- [ ] `factory.config.yaml.compression.output` block presente (verifica: `yq '.compression.output' factory.config.yaml`)
- [ ] Topologia `full-stack-agents` o `hybrid-*-agents` (per generare wave parallele significative)
- [ ] `code_paths:` configurato con almeno una entry attiva
- [ ] Kanban con sprint reale: ≥ 4 TSK in `status: todo`, `consumer: agent`
- [ ] `scheduler.enabled: true` + `max_parallel ≥ 4`
- [ ] Routing matrix coerente: layer dei TSK candidate hanno `routing.<layer>: agent`
- [ ] `.claude/agents/` ha i dev-agent richiesti dai TSK (es. `be-dev.md` se ci sono TSK `layer: be`)

### Ambiente Caveman

- [ ] Caveman installato: `caveman --version` ritorna OK
- [ ] Versione testata: ___ (compila qui)
- [ ] Test minimal: `echo "Could you please help me read the file" | caveman --level=full` produce output ellittico
- [ ] Modello compatibile: ___ (compila qui — Claude Opus/Sonnet/Haiku, GPT-4, …)

### Telemetria

- [ ] Strumentazione per misurare `tokens_in / tokens_out` per wave disponibile. Opzioni:
  - **A**: `memory/episodic/*-wave-*.md` include token counts (default v2.14 wave_report)
  - **B**: Logging custom in `.claude/skills/parallel-scheduling.md` con counter
  - **C**: Telemetria del provider (Anthropic Console / OpenAI usage dashboard)
- [ ] Metodo scelto: ___ (A | B | C)

### Ambiente VCS

- [ ] Working tree pulito su factory candidate (verifica: `git status` → clean)
- [ ] Branch dedicato per validation (es. `validation/compression-1.5-YYYY-MM-DD`)
- [ ] Backup recente del kanban (per ripristinare stato `todo` dopo ogni round)

## Procedura — 7 step

### Step 1 — Selezione factory candidate

Compila qui i metadata:

| Campo | Valore |
|---|---|
| Factory name | ___ |
| Path | ___ |
| Pattern version | ___ |
| Topology | ___ |
| Sprint name | ___ |
| TSK candidate count | ___ |
| Layer distribution | be=___ fe=___ db=___ qa=___ |
| Wave depth attesa (level count) | ___ |
| Wave width attesa (max parallel TSK) | ___ |

### Step 2 — Baseline run (NO compression)

**Pre-condizioni**:
- `compression.output.enabled: false`
- Tutti i TSK candidate in `status: todo`
- `git stash` di eventuali modifiche locali non commit

**Esecuzione**:

```bash
cd <factory-path>
/compression set enabled false        # forza off, anche se è già il default
/compression show                      # verifica enabled=false
git log -1 --oneline                   # registra commit base
/run                                   # avvia wave dispatch parallelo
```

**Misurazioni da raccogliere** (per ogni wave dispatched):

| Wave | Level | Width | Duration (s) | tokens_in | tokens_out | TSK ok | TSK failed |
|---|---|---|---|---|---|---|---|
| 1 | 0 | ___ | ___ | ___ | ___ | ___ | ___ |
| 1 | 1 | ___ | ___ | ___ | ___ | ___ | ___ |
| 2 | 0 | ___ | ___ | ___ | ___ | ___ | ___ |

**Total baseline**: `tokens_in_total = ___`, `tokens_out_total = ___`, `wall_clock = ___`

**Snapshot artefatti baseline**:
```bash
git diff HEAD~<N>..HEAD --stat > /tmp/baseline-diff.txt   # diff di tutto lo sprint
cp -r management/kanban /tmp/baseline-kanban-snapshot/
cp -r <code_path>/ /tmp/baseline-code-snapshot/
```

### Step 3 — Reset stato

Ripristina lo stato pre-sprint per ripetere il run sotto compression:

```bash
git reset --hard <commit-base>
# Verifica TSK tornati a status: todo
grep -l "status: done" management/kanban/**/TSK-*.md | xargs grep "review_status"
```

ATTENZIONE: questa è un'operazione **destruttiva**. Eseguila SOLO su branch dedicato
(`validation/compression-1.5-*`). Mai sul branch main della factory candidate.

### Step 4 — Compressed run (con compression)

**Pre-condizioni**:
- `compression.output.enabled: true`
- `policy_profile: conservative` (default; per topologia `knowledge-only` parti con `aggressive`)
- Stesso commit base dello Step 2

**Esecuzione**:

```bash
/compression set enabled true
/compression policy conservative      # o aggressive per knowledge-only
/compression show                      # verifica config
/run                                   # avvia wave dispatch parallelo con intercept
```

**Misurazioni da raccogliere**:

| Wave | Level | Width | Duration (s) | tokens_in_compressed | tokens_out_compressed | TSK ok | TSK failed | Drift events |
|---|---|---|---|---|---|---|---|---|
| 1 | 0 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| 1 | 1 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| 2 | 0 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |

**Total compressed**: `tokens_in_compressed_total = ___`, `tokens_out_compressed_total = ___`, `wall_clock = ___`

**Drift events totali**: ___ (deve essere 0 critici per superare il gate)

**Snapshot artefatti compressed**:
```bash
git diff HEAD~<N>..HEAD --stat > /tmp/compressed-diff.txt
cp -r management/kanban /tmp/compressed-kanban-snapshot/
cp -r <code_path>/ /tmp/compressed-code-snapshot/
```

### Step 5 — Confronto sulle 3 metriche

#### Metrica A — Risparmio effettivo (target ≥ 50%)

```
ratio_in  = tokens_in_compressed_total  / tokens_in_total
ratio_out = tokens_out_compressed_total / tokens_out_total
saving_in  = 1 - ratio_in
saving_out = 1 - ratio_out
saving_combined = 1 - (tokens_in_compressed + tokens_out_compressed) /
                      (tokens_in_total + tokens_out_total)
```

Compila:
- `saving_in  = ___ %`
- `saving_out = ___ %`
- `saving_combined = ___ %`

**Target**: `saving_combined ≥ 50%`.

#### Metrica B — Drift detection (target = 0 critici)

Conta dal `wiki/log.md` (marker `compression-drift`):
```bash
grep "compression-drift" wiki/log.md | wc -l
```

- Drift totale: ___
- Drift critici (chain di sub-agent fallita > 1 step): ___
- Drift recuperati via fallback normal mode: ___

**Target**: 0 drift critici. Drift recuperati via fallback sono accettabili.

#### Metrica C — Qualità artefatti (target: invariata)

**Diff baseline vs compressed**:
```bash
diff -r /tmp/baseline-kanban-snapshot/ /tmp/compressed-kanban-snapshot/ > /tmp/kanban-diff.txt
diff -r /tmp/baseline-code-snapshot/   /tmp/compressed-code-snapshot/   > /tmp/code-diff.txt
```

Manual review:
- [ ] TSK content identico/equivalente (modulo whitespace e ordine non semantico)
- [ ] Code prodotto identico/equivalente (test BE/FE/DB/QA passano allo stesso set)
- [ ] Wiki pages aggiornate (se ce ne sono) preservano citation `[^src: ...]` e wikilink `[[name]]`
- [ ] `wiki/log.md` entry semanticamente equivalenti (modulo `compression` markers extra)
- [ ] Nessuna regressione visibile

Verdict qualità: **identica** | **equivalente con differenze cosmetiche** | **degradata**

### Step 6 — Decision gate

Compila la matrice di decisione:

| Metrica | Valore | Target | OK? |
|---|---|---|---|
| Risparmio combinato | ___ % | ≥ 50% | ☐ |
| Drift critici | ___ | = 0 | ☐ |
| Qualità artefatti | ___ | invariata | ☐ |

**Decisione**:

- **Tutti OK** → ✅ Procedi a Fase 2 (Context Compression, Graphify code_path). Aggiorna
  design doc [[factory-compression-layer]] §Fase 1.5 con risultati + raccomandazione
  GO.
- **Risparmio < 30%** → Analizza con `/compression show` quale canale ha ratio bassa.
  Valuta passaggio a `policy_profile: aggressive` e ripeti Step 2-5. Se dopo
  aggressive ancora < 30%, raccomandazione = REWORK (rivedere `caveman-protocol` o
  abbandonare).
- **Drift critici > 0** → Identifica il canale problematico nel marker
  `compression-drift`. Valuta `policy_profile: custom` con quel canale a `off`. Se
  drift persiste anche in custom, raccomandazione = NO-GO (mantieni
  `enabled: false` di default).
- **Qualità degradata** → STOP immediato. Raccomandazione = NO-GO + post-mortem in
  `wiki/incidents/YYYY-MM-DD-compression-quality-regression.md`.

Compila qui:

```
DECISIONE FINALE: ___ (GO | REWORK | NO-GO)
RATIONALE:
___
PATH FORWARD:
___
```

### Step 7 — Reporting

1. **Compila questo runbook** (rinominato `compression-validation-YYYY-MM-DD-<factory-name>.md`) con tutti i valori misurati. Lascia in `status: review` per peer review.

2. **Aggiorna design doc** [[factory-compression-layer]] §Fase 1.5 con sezione
   `## Aggiornamenti (vYYYY-MM-DD)` non-distruttiva (PATTERN §7 r.7) contenente:
   - Riferimento al runbook
   - Risultati delle 3 metriche
   - Decisione finale
   - Raccomandazione su `policy_profile` per le altre factory derivate

3. **Aggiorna wiki/log.md** della factory candidate:
   ```
   [YYYY-MM-DD HH:MM] validation — compression Fase 1.5 conclusa, decisione: <GO|REWORK|NO-GO>, saving=<X%>, drift=<N>, qualità=<status> — files touched: 1
   ```

4. **Aggiorna wiki/log.md** del meta-framework (`soli-multi-agents-factory`) per
   tracciare l'avanzamento globale della roadmap.

5. Se decisione = **GO**: apri TSK di Fase 2 nel meta-framework (Graphify code_path).
   Se decisione = **REWORK**: apri issue/TSK per il rework richiesto.
   Se decisione = **NO-GO**: deprecare la Fase 2 nel design doc; OCL resta opt-in
   come "feature sperimentale, default off".

## Anti-pattern da evitare

- **Misurare 1 sola wave**: rumore alto, conclusioni non affidabili. Minimo 2 wave per round, idealmente uno sprint completo.
- **Variare il profilo durante un round**: rende non comparabili le metriche. Fissa il profilo all'inizio dello Step 4.
- **Skippare lo snapshot artefatti**: senza confronto baseline vs compressed non puoi giudicare la metrica C.
- **Reset destruttivo sul branch sbagliato**: lo Step 3 è dangerous. SEMPRE su branch dedicato.
- **Misurare solo `tokens_out`**: il guadagno reale è la **somma** in/out. Tenerli separati nel report ma valutare il combinato.
- **Validare sotto carico anomalo** (un solo TSK, o TSK tutti dello stesso layer): la wave non è rappresentativa. Sprint diversificato.

## Trade-off documentati

| Aspetto | Pro Compression | Pro Baseline |
|---|---|---|
| Costo API per sprint | -50–70% | costo pieno |
| Wall-clock per wave | leggermente più veloce (token∝latenza) | nessuna variazione |
| Debuggabilità messaging | output ellittico richiede unfold mentale | output verbose self-explanatory |
| Audit trail | richiede compression-drift marker per traccia | trace naturale |
| Setup overhead | install Caveman + config | nessuno |

## Riferimenti

- Design doc: [[factory-compression-layer]] §Fase 1.5
- Pattern: PATTERN.md §20.7 (integrazione scheduler), §20.4 (R.C1–R.C6)
- Skill: `.claude/skills/caveman-protocol.md`
- Comando: `.claude/commands/compression.md`
- Runbook migration: [[migration-v214]]
- Concept correlati: [[caveman]], [[token-compression]], [[parallel-scheduler]]
