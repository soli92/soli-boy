---
type: concept
sources:
  - "raw/caveman_deep_dive.md"
  - "raw/graphify_deep_dive.md"
status: approved
created: 2026-05-28
updated: 2026-05-28
tags: [design-doc, compression, caveman, graphify, token-reduction, parallel-scheduler, sync-adapters, v2-14, v2-15]
---

# Factory Compression Layer

> Design doc per integrare [[token-compression]] come layer trasversale della factory: [[caveman]] sull'asse output (comunicazioni agent-to-agent) e [[graphify]] sull'asse contesto (codebase + corpus wiki). Pattern a due assi ortogonali componibili, integrato con [[parallel-scheduler]], [[code-quality-review-layer]] e workflow di ingest. Roadmap su due release: v2.14 (Caveman + Graphify base) → v2.15 (wiki-as-graph sperimentale).

## Contesto e motivazione

Tre forze rendono l'integrazione di un compression layer rilevante per questa factory specifica: [^src: raw/caveman_deep_dive.md §Cos'è Caveman] [^src: raw/graphify_deep_dive.md §Cos'è Graphify]

1. **Amplificazione per wave**: con [[parallel-scheduler]] attivo (v2.11), una wave di N agenti moltiplica i token consumati per sessione. Una compressione del 60% sull'output di ogni agente si propaga linearmente sull'intera wave.
2. **Corpus wiki crescente**: agent come `wiki-keeper`, `wiki-query`, `lead-architect`, `tpm` operano su un knowledge base che cresce monotonicamente. Senza un meccanismo di compressione del contesto, ogni query paga il costo dell'intero corpus.
3. **Topologie full-stack-agents su codebase reali**: le factory derivate che attivano dev-agent (`be-dev`, `fe-dev`, `db-dev`, `qa-dev`) operano su `code_path` esterni che possono superare i 10k LOC. Caricare i file sorgente raw nel contesto è proibitivo su sessioni multiple.

Il design adotta il framework concettuale del [[token-compression]]: i due assi (output, contesto) sono ortogonali e componibili. Caveman e Graphify sono le implementazioni canoniche scelte come default; entrambi sono MIT, entrambi diventati maturi nel 2026.

## Modello architetturale a due assi

Il layer è **trasversale**: non sostituisce nessun componente esistente, ma intercetta i flussi di comunicazione tra agent (Caveman) e i flussi di contesto verso gli agent (Graphify).

```
┌─────────────────────────────────────────────────────────────────┐
│                     Factory Compression Layer                   │
├──────────────────────────────┬──────────────────────────────────┤
│     Output axis (Caveman)    │     Context axis (Graphify)      │
│  ─────────────────────────   │  ──────────────────────────────  │
│  agent → agent: full         │  code_path → dev-agent:          │
│  agent → tool:  ultra        │    GRAPH_REPORT.md invece di     │
│  tool  → agent: lite         │    file raw                      │
│  agent → user:  off          │                                  │
│  agent → wiki/: off          │  wiki/ → wiki-query (v2.15):     │
│  agent → code/: off          │    GRAPH_REPORT.md del corpus    │
└──────────────────────────────┴──────────────────────────────────┘
```

Entrambi gli assi sono **policy-driven**: il comportamento è definito in `factory.config.yaml`, non hardcoded nel codice degli agent. Questo segue il pattern [[stack-aware-ruleset]] del [[code-quality-review-layer]]: configurazione esterna, evolutiva, versionata.

## Allow-list per task_type × channel

Decisione critica: **cosa non comprimere mai**. Caveman applicato all'output di `wiki-keeper`, `product-manager`, `tpm` distruggerebbe il pattern karpathy-style che è il deliverable della factory. [^src: raw/caveman_deep_dive.md §Quando usarlo]

### Policy profile selezionabile

La matrice è parametrizzata da un **profilo di policy** configurabile in `factory.config.yaml.compression.output.policy_profile`:

- `conservative` (**default**) — risparmio moderato (50–70%), drift cumulativo minimo, audit trail più ricco
- `aggressive` — risparmio massimo (70–85%), accetta più drift in cambio di token savings, indicato per factory mature dopo periodo di validazione
- `custom` — matrice esplicita fornita inline (override completo dei preset)

**Invarianti applicati a tutti i profili (mai overridabili):**
- `to_user`: sempre `off` — l'output verso l'utente finale deve restare leggibile
- `to_artifact` (`wiki/`, `management/kanban/`, `code/`, `design_&_architecture/`): sempre `off` — deliverable persistenti
- `propagate-resolution` → wiki page update: sempre `off` — coerenza referenze cross-page

### Profilo `conservative` (default)

| Sorgente | Destinazione | Compressione | Rationale |
|---|---|---|---|
| Orchestrator | Sub-agent (dispatch) | `full` | Handoff JSON, payload strutturato |
| Sub-agent | Tool (Bash, Read, Grep) | `ultra` | Argomenti tool molto verbosi |
| Tool | Sub-agent (result) | `lite` | Output tool ridotto a essenziale, ma serve dettaglio per decisione |
| Sub-agent | Orchestrator (return) | `full` | Riepilogo lavoro, lista artefatti |
| Sub-agent | Sub-agent (sibling) | `full` | Es. wiki-keeper-worker → wiki-keeper |
| `feedback-router` | `dev-agent` (task package) | `full` | Comunicazione interna review |
| chain_depth_downgrade | — | `true` | Auto-downgrade `ultra → full → lite` su chain depth > 3 |

### Profilo `aggressive`

| Sorgente | Destinazione | Compressione | Rationale |
|---|---|---|---|
| Orchestrator | Sub-agent (dispatch) | `ultra` | Handoff massimamente compresso |
| Sub-agent | Tool (Bash, Read, Grep) | `ultra` | Invariato vs conservative |
| Tool | Sub-agent (result) | `full` | Compressione anche su result (rischio: meno dettaglio decisionale) |
| Sub-agent | Orchestrator (return) | `ultra` | Return ellittico |
| Sub-agent | Sub-agent (sibling) | `ultra` | Sibling-to-sibling massimo |
| `feedback-router` | `dev-agent` (task package) | `ultra` | Task package ellittico |
| chain_depth_downgrade | — | `false` | No downgrade, accetta drift su chain lunghe |

### Profilo `custom`

L'utente fornisce la matrice esplicita in `factory.config.yaml.compression.output.channels`. Gli invarianti restano enforced. Esempio:

```yaml
compression:
  output:
    policy_profile: custom
    channels:
      orchestrator_to_subagent: ultra
      tool_to_subagent: lite      # mix conservative/aggressive
      sibling_to_sibling: off     # disabilita per debugging specifico
```

### Quando scegliere quale profilo

| Situazione | Profilo consigliato |
|---|---|
| Factory new, primo deployment | `conservative` |
| Factory mature, dopo ≥ 2 settimane senza drift incident | `aggressive` |
| Debugging di un drift specifico | `custom` con canale problematico a `off` |
| Topologia `knowledge-only` (no dev-agent, chain corte) | `aggressive` (basso rischio) |
| Topologia `full-stack-agents` (chain lunghe orchestrator→PM→TPM→dev) | `conservative` finché chain depth ≥ 3 non è validato |
| Audit normativo o output customer-facing | Mantieni invarianti (`to_user: off`, `to_artifact: off`) |

Regola generale: **comprimere il messaging, mai gli artefatti**. Gli artefatti vivono oltre la sessione e devono essere leggibili da umani e tool downstream; il messaging è effimero.

## Confidence-gated dispatch (Graphify)

Graphify produce nodi e archi con tre tag di confidenza: `EXTRACTED` (deterministico, AST-derived), `INFERRED` (LLM-driven, esplorativo), `AMBIGUOUS` (conflitto tra sorgenti). [^src: raw/graphify_deep_dive.md §Architettura — la pipeline a tre passi]

Per evitare che relazioni inferite causino modifiche errate in production code, lo scheduler applica un gating per ruolo dell'agent:

| Ruolo agent | Nodi/archi consumati | Esempio |
|---|---|---|
| **Executor** (modifica file) | Solo `EXTRACTED` | `be-dev`, `fe-dev`, `db-dev`, `qa-dev` su task di modifica |
| **Explorer** (genera proposte) | `EXTRACTED` + `INFERRED` | `lead-architect` in fase di design, `wiki-query` |
| **Reviewer** (audit) | Tutto, con flag visibile | `code-reviewer` per blast radius analysis |

Questo è una specializzazione del pattern [[verifier-as-gate]] applicato al consumo di contesto.

## Integrazione con sottosistemi esistenti

### Parallel scheduler v2.11

La skill [[parallel-scheduler]] espande il proprio ruolo:

- **Pre-dispatch**: applica la policy Caveman al payload di handoff per ogni agent nella wave
- **Post-collection**: comprime i return value prima di aggregare
- **Cost telemetry**: il `wave_report.md` includerà metriche `tokens_in_compressed / tokens_in_raw` e `tokens_out_compressed / tokens_out_raw` per misurare l'efficacia

L'effetto è **moltiplicativo**: in una wave di 4 agenti, risparmio del 60% per agente = risparmio del 60% sull'intera wave.

### Code-reviewer v2.12 (CQRL)

Il [[code-quality-review-layer]] beneficia di Graphify come pre-check:

- `get_impact_radius(file)` viene invocato prima del review per identificare tutti i symbol dipendenti dal file modificato
- Il task package per il dev-agent include il blast radius come constraint esplicito ("non toccare i symbol X, Y, Z senza valutarne l'impatto")
- Riduce il rischio di **regression detection** in iter N+1 (loop control bullet 3 di CQRL)

### Sync adapters (PATTERN §16)

Graphify diventa il **quarto sync adapter** della famiglia [[sync-adapters]]:

| Sorgente | Sub-agent | Output raw | Versione |
|---|---|---|---|
| PDF | `sync-docs` | `raw/*.txt + raw/images/` | v1.0 |
| Figma | `figma-sync` | `raw/YYYY-MM-DD-figma-<slug>.md` | v2.9 |
| Repo esistente | `repo-sync` | `raw/YYYY-MM-DD-repo-<slug>.md` | v2.12 |
| **Knowledge graph** | **`graphify-sync`** | **`raw/YYYY-MM-DD-graph-<slug>.md`** | **v2.14** |

Il nuovo adapter è coerente con il pattern: read-only verso la sorgente, scrive solo nel proprio scope di `raw/`, invocabile via `/graphify-sync <target>`.

### Wiki workflow (sperimentale, v2.15)

In Fase 3 (post-validation di Fase 1-2), `wiki-keeper` e `wiki-query` diventano consumer del graph del corpus wiki/:

- `wiki-query`: invece di scansionare le pagine, query `GRAPH_REPORT.md` del corpus per identificare le pagine rilevanti, poi legge solo quelle
- `wiki-keeper`: prima di scrivere una nuova pagina, query del graph per duplicate detection e identificazione di pagine correlate (cross-link automation)

**Rischio**: il graph del wiki può andare stale rispetto ai file. Mitigation: il filesystem resta **single source of truth**; il graph è una view rebuildable da zero. Refresh post-commit via git hook.

## Topology-aware configuration

Il layer si comporta differentemente in base alla topologia della factory ([PATTERN.md §13](../../PATTERN.md)):

| Topologia | Output (Caveman) | Context (Graphify) | Rationale |
|---|---|---|---|
| `knowledge-only` | `enabled: true`, `policy_profile: aggressive` | `enabled: false` o `wiki` only (post-PoC) | Chain corte (ingest), drift rischio basso, no code_path |
| `plan-only` | `enabled: true`, `policy_profile: conservative` | `enabled: false` | Chain medie (PM→TPM), no code_path |
| `full-stack-agents` | `enabled: true`, `policy_profile: conservative` | `enabled: true`, `targets: [code_path]` | Chain lunghe + code_path grandi: massimo beneficio combinato |
| `hybrid-be-agents` / `hybrid-fe-agents` | `enabled: true`, `policy_profile: conservative` | `enabled: true`, `targets: [code_path]` parziale | Solo il layer agentificato beneficia di Graphify |
| `custom` | Su decisione utente | Su decisione utente | Topologia esplicita |

### Topologie federate (cross-factory)

In [[federated-topology]], una factory padre invoca factory figlie come sub-agent. La compressione Caveman **non attraversa** il boundary:

- **Intra-factory** (agent → agent della stessa factory): `enabled: true` con profilo configurato
- **Cross-factory** (factory padre ↔ factory figlia): **sempre `off`**, indipendentemente dal profilo

Rationale: factory diverse possono usare modelli o versioni differenti, con vocabolari Caveman incoerenti → l'handoff ellittico diventerebbe ambiguo. Il boundary cross-factory è già una zona di interfaccia chiara: deve restare normale-mode per leggibilità e debuggabilità.

## Backward compatibility

Il layer è **completamente opt-in** in v2.14:

- `compression.enabled: false` di default → factory v2.13 esistenti continuano a funzionare identiche
- Nessuna migrazione obbligatoria del frontmatter agent / skill esistenti
- Nessun cambio breaking nel `factory.config.yaml` (il blocco `compression:` è additivo, non sostituisce altri blocchi)
- Se `compression.output.provider` o `compression.context.provider` non sono presenti, il layer si comporta come se `enabled: false`

Considerazione futura: **default-on da v2.16** dopo periodo di validazione (≥ 2 release senza drift incidenti reportati). La transizione default-off → default-on sarà annunciata con migration runbook dedicato.

## Side-channel storage

Analogo al `code_quality/` introdotto in v2.12 per CQRL: i graph non vivono in `wiki/` né in `management/kanban/`, ma in un side-channel rebuildable.

```
.graphify-state/
├── code_paths/
│   └── <code_path-name>/
│       ├── graph.json
│       ├── GRAPH_REPORT.md
│       └── last_full_rebuild.txt
└── wiki/
    ├── graph.json
    ├── GRAPH_REPORT.md
    └── last_full_rebuild.txt
```

Caratteristiche:
- **Non versionato in git** (`.gitignore`-d): è una view derivata
- **Rebuildable**: full rebuild ricostruisce tutto da zero in <5 min su codebase medi
- **Scritto solo da `graphify-sync`**: nessun altro agent ci scrive (analogo a R.Q2 di CQRL)
- **Letto da molti**: dev-agent, code-reviewer, wiki-query, wiki-keeper (in v2.15)

## Drift mitigation

### Caveman drift cumulativo

**Sintomo**: su chain agentiche lunghe (orchestrator → sub-agent → tool → sub-agent → orchestrator), la compressione ellittica può introdurre ambiguità interpretative che si cumulano. [^src: raw/caveman_deep_dive.md §Contro]

**Mitigation**:

| Meccanismo | Trigger | Azione |
|---|---|---|
| **Audit trail per decisioni critiche** | `propagate-resolution`, `feedback-router` | Mantengono trace in normal mode (no Caveman) |
| **Allow-list rigorosa** | Output verso file artefatto | Sempre `off` per `wiki/`, `kanban/`, `code/` |
| **Drift detection** | Sub-agent returns ambiguous error | Fallback automatico a normal mode + log warning |
| **Severity ceiling** | Chain depth > 3 | Downgrade automatico `ultra` → `full` → `lite` |

### Graphify drift asincrono (semantica vs AST)

**Sintomo**: i nodi `EXTRACTED` (AST) si aggiornano ad ogni commit via post-commit hook; i nodi `INFERRED` (LLM-driven, semantici) rimangono alla versione dell'ultimo full rebuild. Su domini dove concept↔code sono accoppiati, il graph può diventare incoerente. [^src: raw/graphify_deep_dive.md §Contro]

**Mitigation**:

| Meccanismo | Frequenza | Costo |
|---|---|---|
| **Incremental update** (AST only) | Post-commit, on-session-start | Zero token |
| **Full rebuild semantico** | Cron weekly (`0 0 * * 0`) | 2–20 $ token |
| **Drift monitoring** | Daily check | Confronta `last_ast_update` vs `last_full_rebuild`, alert se delta > 7 giorni |
| **Manual trigger** | Post-refactor maggiori | `/graphify-sync <target> --force` |
| **CI cache-with-fallback** | Ogni pipeline CI | Zero token (cache hit) o fallback a scansione filesystem se stale > 7gg |

### Strategia CI (ottimale, meno dispendiosa)

CI ephemeral non deve mai pagare 2–20 $/run per full rebuild. Il design adotta **cache-with-fallback**:

1. La cache key è `graphify-state-<sha-of-code_path>` (deterministica)
2. Cache hit (95%+ dei run) → graph caricato in <5s, zero token
3. Cache miss o stale (>7 giorni) → **fallback automatico** a scansione filesystem (comportamento v2.13 pre-Graphify), nessuna pipeline rebuild
4. Full rebuild solo su trigger esplicito (`/graphify-sync <target> --force` da local dev o scheduled job dedicato)

Effetto: CI non vede mai il costo build, eppure beneficia del graph aggiornato quando esiste. Rinuncia controllata al graph in scenari di cache cold start.

### Ghost duplicates

**Sintomo**: nodi duplicati quando AST e semantica disagree sull'ID. Bug noto di Graphify. [^src: raw/graphify_deep_dive.md §Contro]

**Mitigation**: il `graphify-sync` esegue un dedup check post-rebuild; se ghost duplicates > soglia, escalation a full rebuild + alert utente.

## Configurazione factory

Nuova sezione in [factory.config.yaml](../../factory.config.yaml):

```yaml
compression:
  output:
    provider: caveman  # caveman | none
    enabled: false     # default OFF, opt-in
    install_command: "curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash"
    policy_profile: conservative  # conservative | aggressive | custom
    # Invarianti enforced indipendentemente dal profilo:
    invariants:
      to_user: off                # mai compresso
      to_artifact: off            # wiki/, kanban/, code/, design_&_architecture/
      propagate_resolution: off   # mai compresso
    # channels: usato SOLO se policy_profile == custom (override completo)
    channels:
      orchestrator_to_subagent: full
      subagent_to_tool: ultra
      tool_to_subagent: lite
      subagent_to_orchestrator: full
      sibling_to_sibling: full
      feedback_router_to_devagent: full
    chain_depth_downgrade: true   # auto-downgrade su chain depth > 3 (profilo conservative)
    audit_trail_for:
      - propagate-resolution
      - feedback-router

  context:
    provider: graphify-cloud  # graphify-cloud (default) | graphify-ollama | none
    enabled: false            # default OFF, opt-in
    package: graphifyy        # safishamsi/graphify (PyPI: doppia y)
    # Privacy: docs/immagini vanno all'API LLM con graphify-cloud.
    # Per data residency enterprise: graphify-ollama (locale, 16+ GB VRAM, qualità inferiore)
    ollama:
      model: llama3.1:8b   # usato se provider == graphify-ollama
      vram_gb_min: 16
    targets:
      - kind: code_path
        name: backend        # match factory.config.yaml.code_paths[].name
        gitignore_patterns:
          - "*.env"
          - "secrets/**"
      - kind: wiki            # v2.15 only, vincolato a PoC karpathy-pattern (vedi Fase 3)
        path: wiki/
    update_strategy: incremental
    full_rebuild_cron: "0 0 * * 0"  # weekly
    drift_alert_days: 7
    ci_strategy:
      mode: cache-with-fallback   # cache-with-fallback (default) | disabled | always-rebuild
      cache_provider: actions     # actions (GitHub) | gitlab | s3 | local
      cache_key_prefix: graphify-state
      stale_threshold_hours: 168  # 7 giorni: oltre, fallback a scansione filesystem
      full_rebuild_on_demand: true  # solo via /graphify-sync --force
    confidence_gating:
      executor: [EXTRACTED]
      explorer: [EXTRACTED, INFERRED]
      reviewer: [EXTRACTED, INFERRED, AMBIGUOUS]
    mcp_server:
      enabled: false        # opt-in se l'utente ha MCP runtime
      topology: per-agent   # per-agent (default, isolato) | shared (opt-in, factory mature)
      crg_tools_max: 8      # CRG_TOOLS env var
```

## Roadmap di implementazione

### Fase 0 — Design doc (questa pagina)
- [x] Sintesi Caveman/Graphify ([[token-reduction-tools]])
- [x] Concept pages ([[caveman]], [[graphify]], [[token-compression]], [[knowledge-graph-codebase]])
- [x] Design doc completo (questa pagina) → **status: draft**
- [x] Promote a `review` (2026-05-28)
- [x] Risoluzione 7 open questions (vedi §Decisioni risolte)
- [ ] Promote a `approved` → start Fase 1

### Fase 1 — v2.14 Output Compression (Caveman)

Deliverable atomici:

1. PATTERN.md §20 "Compression Layer" + regole R.C1–R.C6
2. Skill `.claude/skills/caveman-protocol/SKILL.md` (allow-list channel-aware)
3. Estensione `factory.config.yaml` con `compression.output`
4. Hook in `.claude/skills/parallel-scheduling/SKILL.md` per comm-compression
5. Aggiornamento agent frontmatter con campo `caveman_policy:`
6. Comando `/compression [show|set|policy]` (`.claude/commands/compression.md`)
7. Validation: dry-run su una factory derivata di test

### Fase 1.5 — Validation on derived factory (gate prima di Fase 2)

Prima di estendere il layer al Context axis (Graphify) e di scrivere PATTERN.md §20 come canonical, validare la Fase 1 su una factory derivata reale. Questo è il **gate empirico** che decide se proseguire, modificare i preset, o retrocedere.

Deliverable atomici:

1. Selezionare una factory derivata candidate (es. `fsc-trasf-demo` già esistente)
2. Attivare `compression.output.enabled: true` con `policy_profile: conservative`
3. Eseguire una **baseline session** (sprint reale, 1–2 wave parallele) senza compression — misurare `tokens_in/out` raw
4. Riattivare compression, ripetere session equivalente — misurare `tokens_in/out_compressed`
5. Confronto su 3 metriche:
   - **Risparmio effettivo** (`1 - tokens_compressed / tokens_raw`): target ≥ 50%
   - **Drift detection** (numero di fallback automatici, ambiguità nei sibling-to-sibling handoff): target = 0 incidenti critici
   - **Qualità artefatti** (wiki pages / TSK prodotti): inalterata vs baseline (manual review)
6. **Decision gate**:
   - Se metriche OK → procedi Fase 2
   - Se risparmio < 30% → analizza profilo, valuta passaggio a `aggressive`
   - Se drift incidenti > 0 → analizza canale problematico, valuta `custom` profile o retreat
7. Produrre `wiki/runbooks/compression-validation-2026-XX-XX.md` con risultati e raccomandazione

Durata stimata: 1 settimana (incluso ramp-up + 2 round di misurazione).

### Fase 2 — v2.14 Context Compression (Graphify, target: code_path)

Deliverable atomici:

1. PATTERN.md §16 esteso: Graph come quarto sync source + regole R.G1–R.G6
2. Agent `.claude/agents/graphify-sync.md` (analogo a [[repo-sync]] v2.12)
3. Skill `.claude/skills/graphify-extraction-protocol/SKILL.md`
4. Comando `/graphify-sync <target>` (`.claude/commands/graphify-sync.md`)
5. Estensione `factory.config.yaml` con `compression.context`
6. Update agent `.claude/agents/code-reviewer.md`: integrazione `get_impact_radius` come pre-check
7. Update skill `.claude/skills/parallel-scheduling/SKILL.md`: confidence-gated dispatch
8. Side-channel `.graphify-state/` con `.gitignore` entry

### Fase 3 — v2.15 Wiki-as-Graph (sperimentale, gated da PoC)

**Invariante non negoziabile**: la regola karpathy-style non deve mai essere rotta. Concretamente significa che il `GRAPH_REPORT.md` derivato dal corpus wiki/ **deve preservare al 100%**:

- Citation `[^src: <path> §<section>]` claim → source
- Wikilink `[[name]]` cross-page con risoluzione corretta
- Frontmatter (`type`, `status`, `sources`, `related`, `tags`)
- Layering L1/L2 e namespace (sources/, concepts/, entities/, syntheses/, runbooks/, incidents/)
- Append-only contracts (wiki/log.md, wiki/gaps.md)

Se anche uno solo di questi non è preservato dal graph, **Fase 3 viene scartata** e wiki/ continua a essere consumato come filesystem (comportamento v2.14).

#### Fase 3a — Karpathy preservation PoC (gate obbligatorio, pre-pianificazione)

Prima ancora di pianificare lo sviluppo della Fase 3, eseguire un **PoC isolato** che misura empiricamente la preservazione del pattern karpathy:

1. Selezionare un sub-corpus rappresentativo: 10 concept + 5 entity + 3 synthesis + 1 source + 1 runbook
2. Eseguire `graphify` su questo sub-corpus
3. Verificare con check automatici:
   - **Citation integrity**: ogni `[^src: ...]` nelle pagine ha un nodo corrispondente nel graph con metadati `path` + `section` intatti
   - **Wikilink resolution**: ogni `[[name]]` ha un edge nel graph che risolve alla pagina corretta
   - **Frontmatter integrity**: per ogni pagina nel graph, `type`/`status`/`sources` sono accessibili senza loss
   - **Layering preservato**: namespace (sources/concepts/entities/syntheses/runbooks/incidents) sono distinguibili nel graph
4. **Decision gate**:
   - Tutti i 4 check pass → procedi pianificazione Fase 3b
   - Anche uno solo fail → **scartare Fase 3**, documentare il fail mode nel runbook PoC, mantenere wiki/ come filesystem-only
5. Produrre `wiki/runbooks/wiki-as-graph-poc-2026-XX-XX.md` con risultati + decisione

#### Fase 3b — Implementazione (subordinata al PoC)

Eseguibile **solo se** Fase 3a passa tutti e 4 i check. Deliverable atomici:

1. `graphify-sync` target esteso a `wiki/`
2. Update `.claude/agents/wiki-query.md`: consume GRAPH_REPORT.md invece di scansione pagine
3. Update `.claude/agents/wiki-keeper.md`: duplicate detection pre-write via graph
4. SessionStart hook + post-commit hook per refresh incrementale
5. **Fallback policy hard**: se graph non disponibile, stale, o citation/wikilink integrity check fallisce a runtime → fallback automatico a scansione filesystem (no degraded mode silenzioso)
6. A/B test su corpus completo: misurare qualità di `wiki-query` con graph vs senza
7. Karpathy invariant monitoring: check daily che valida i 4 vincoli sul graph corrente

## Decisioni risolte

Trace storica delle decisioni prese durante review (2026-05-28). Le 7 open questions iniziali sono tutte chiuse; le scelte sono integrate nelle sezioni rispettive del documento.

| # | Tema | Decisione | Dove integrata |
|---|---|---|---|
| 1 | Caveman in topologie federate | `off` cross-factory (sempre), `on` intra-factory | §Topology-aware configuration > Topologie federate |
| 2 | Graphify costo build su CI | `cache-with-fallback`: cache hit zero token, cache stale > 7gg → fallback a scansione filesystem, full rebuild solo on-demand | §Strategia di update > Strategia CI + YAML `ci_strategy:` |
| 3 | MCP server condiviso vs per-agent | `per-agent` default (isolato), opt-in `shared` per factory mature | YAML `mcp_server.topology:` |
| 4 | Caveman in topologia `knowledge-only` | Sì, profilo `aggressive` (chain corte, rischio basso) | §Topology-aware configuration > matrice topologia |
| 5 | Wiki-as-graph e citation `[^src:]` | **Invariante karpathy non negoziabile**: Fase 3 vincolata a PoC pre-validation con 4 check (citation/wikilink/frontmatter/layering); se anche uno fallisce → Fase 3 scartata | §Roadmap > Fase 3a Karpathy preservation PoC |
| 6 | Backward compatibility v2.13 → v2.14 | Opt-in completo, nessuna migrazione obbligatoria; default-on candidato da v2.16 | §Backward compatibility |
| 7 | Privacy multi-tenant (data residency) | `graphify-cloud` default, opt-in `graphify-ollama` (locale, 16+ GB VRAM) per enterprise | YAML `provider:` + `ollama:` block |

Tutte le decisioni sono **reversibili**: cambiano via `factory.config.yaml` senza modifiche al codice agent. La regola karpathy-invariante della decisione #5 è l'unica vincolante a livello architetturale (non un default ma un assioma del design).

## Anti-pattern

| Anti-pattern | Conseguenza | Mitigazione |
|---|---|---|
| Comprimere output verso `wiki/` o `kanban/` | Artefatti karpathy-style distrutti | Allow-list rigorosa nel `caveman-protocol` |
| Graphify always-on su microrepo | Overhead di setup non giustificato | Soglia minima: `LOC >= 10000 OR files >= 50` |
| Caveman `ultra` su chain depth > 3 | Drift cumulativo, ambiguità di handoff | Severity ceiling automatico |
| Confondere `INFERRED` con `EXTRACTED` in executor | Modifiche basate su relazioni inferite | Confidence gating obbligatorio per dev-agent |
| Skip full rebuild semantico per >7 giorni | Drift asincrono, graph incoerente | Cron weekly + drift monitoring |
| Trattare `GRAPH_REPORT.md` come source of truth | Divergenza graph ↔ filesystem | Graph è view rebuildable; filesystem è SoT |
| Caveman senza audit trail su `propagate-resolution` | Reference cross-page corrotte | Allow-list esplicita esclude resolution flow |

## Rischi sistemici

### Adoption rischio: opt-in vs default-on

Il layer è disegnato **opt-in** (`enabled: false` di default). Vantaggi: nessun impatto su factory esistenti, rollout incrementale, possibilità di disabilitare per debugging. Svantaggi: il valore si concretizza solo se l'utente esegue lo switch.

**Mitigation**: in v2.14 documentare un "quick-win path" per factory esistenti che mostra il ROI atteso. Considerare default-on da v2.16 dopo periodo di validazione.

### Coupling implicito sul modello

Caveman è stato progettato per fraseggio Claude/GPT. Modelli diversamente fine-tunati possono produrre output ambigui sotto Caveman. [^src: raw/caveman_deep_dive.md §Contro]

**Mitigation**: il `caveman-protocol` includerà una sezione "model compatibility matrix" basata su test reali. Per modelli non testati, default conservativo `lite`.

### Maintenance burden di un dipendency esterno

Caveman è single-maintainer (Julius Brussee). Graphify ha doppia implementazione (safishamsi/Howell5) ma comunità giovane. Entrambi possono diventare abbandoned. [^src: raw/caveman_deep_dive.md §Cos'è Caveman] [^src: raw/graphify_deep_dive.md §Cos'è Graphify]

**Mitigation**:
- Il layer è disegnato **provider-agnostic** (`provider: caveman | none`, `provider: graphify | none`): se un tool muore, si può sostituire senza cambiare gli agent
- Vendor lock-in evitato: nessun dato proprietario nei due tool

### Drift tra documentazione e implementazione

Il design doc descrive il sistema desiderato. Senza validation continua, la documentazione può divergere dall'implementazione reale.

**Mitigation**: in Fase 1 introdurre un check `/lint --compression` che verifica coerenza tra `factory.config.yaml.compression` e gli agent frontmatter.

## Concetti correlati

[[token-compression]]
[[knowledge-graph-codebase]]
[[parallel-scheduler]]
[[code-quality-review-layer]]
[[sync-adapters]]
[[stack-aware-ruleset]]
[[verifier-as-gate]]
[[orchestrator-workers]]
[[evaluator-optimizer]]
[[circuit-breaker]]

## Pagine collegate

[[caveman]]
[[graphify]]
[[julius-brussee]]
[[andrej-karpathy]]
[[token-reduction-tools]]
[[2026-05-28-caveman-deep-dive]]
[[2026-05-28-graphify-deep-dive]]

## Aggiornamenti (v2026-05-28)

### Fase 1 v2.14 implementata (2026-05-28 16:00)

PATTERN.md §20 + R.C1–R.C6, skill `caveman-protocol`, comando `/compression`, hook in
`parallel-scheduling`, blocco `compression:` in `factory.config.yaml`. Backward
compat totale (R.C6). Vedi [[migration-v214]] per il runbook completo della migration
v2.13 → v2.14.

### Fase 1.5 — Setup ready, empirical run pending (2026-05-28 16:30)

Setup pronto, validation empirica deferred a quando l'utente avrà:
- Una factory derivata aggiornata a v2.14 (PATTERN + `factory.config.yaml.compression`)
- Caveman installato e funzionante
- Un kanban con ≥ 4 TSK pronti in `status: todo` per generare wave significative
- Telemetria token configurata (`memory/episodic/*-wave-*.md` o equivalent)

**Factory candidate analizzate**:
- `fsc-trasf-demo`: NON candidate (pre-v2.7, no `factory.config.yaml`, no `.claude/agents/`,
  no TSK in kanban — solo 9 EP)

Runbook fill-in-the-blanks pronto: [[compression-validation-template]]. Copiarlo come
`wiki/runbooks/compression-validation-YYYY-MM-DD-<factory-name>.md` sulla factory
candidate quando disponibile, eseguire i 7 step, raccogliere le 3 metriche
(risparmio, drift, qualità), compilare il decision gate.

**Decision criteria pre-stabiliti**:
- `saving_combined ≥ 50%` + `drift_critici = 0` + `qualità invariata` → GO Fase 2
- `saving < 30%` → tentare `aggressive`, poi REWORK
- `drift > 0 critici` → `custom` con canale problematico off, poi NO-GO se persiste
- `qualità degradata` → STOP immediato + post-mortem

### Fase 2 v2.14 implementata (2026-05-28 17:00) — bypass gate Fase 1.5

Implementazione del **Context Compression Layer** via [[graphify]] come quarto sync
adapter (PATTERN §16 + §20.10-§20.11). Bypass del gate Fase 1.5 (validation
empirica still pending) per priorità di delivery: l'implementazione resta opt-in
totale (`compression.context.enabled: false` default, R.G6) quindi zero impatto su
factory esistenti.

**Modifiche introdotte**:
- PATTERN.md §16 esteso: Graphify come 4° sync adapter (PDF, Figma, Repo, **Graph**)
- PATTERN.md §20.10 — Context Compression Layer (subsezioni .1 confidence-gated dispatch, .2 schema YAML, .3 integrazione CQRL, .4 drift mitigation, .5 pipeline)
- PATTERN.md §20.11 — Invarianti R.G1–R.G6 (filesystem SoT, confidence-gated, blast radius, drift mitigation, write-restricted, opt-in)
- §4 naming: nuove entry `raw/YYYY-MM-DD-graph-<slug>.md` + side-channel `.graphify-state/code_paths/<slug>/`
- factory.config.yaml: `compression.context` block completo (da placeholder a attivabile)
- `.gitignore` creato con `.graphify-state/`
- Agent `.claude/agents/graphify-sync.md` (thin, analogo a repo-sync)
- Skill `.claude/skills/graphify-extraction-protocol.md` (5 fasi: Bootstrap → Discovery+Cost → Build Graph → Side-channel write+Summary → Log)
- Command `.claude/commands/graphify-sync.md` (sync/show/status/refresh)
- `.claude/agents/code-reviewer.md`: aggiunto blast radius pre-check (R.G3)
- `.claude/skills/parallel-scheduling.md`: confidence-gated context resolve Step 1 nuovo, rinumerati gli altri step

**Side-channel storage** `.graphify-state/code_paths/<slug>/`:
- `graph.json` (machine-readable, Graphify nativo)
- `GRAPH_REPORT.md` (consumato da dev-agent come context replacement)
- `last_full_rebuild.txt` (drift monitoring)
- Non versionato in git (R.G6)

**Default sicuri**:
- `compression.context.enabled: false`
- `provider: none` (utente sceglie `graphify-cloud` o `graphify-ollama`)
- CI strategy `cache-with-fallback` (zero token su cache hit)
- Confidence gating: executor → `EXTRACTED` only, explorer → `+INFERRED`, reviewer → tutto
- Cost gate per full rebuild > 5$ richiede conferma esplicita

**Runbook**: [[migration-v214-fase2]] documenta procedura completa di adozione,
trade-off, rollback.

### Fase 3a — PoC karpathy preservation setup ready (2026-05-28 17:30)

Setup completo della **Fase 3a — Karpathy preservation PoC** (gate obbligatorio
non negoziabile per Fase 3b). Run empirico deferred a quando Graphify sarà disponibile.

**Deliverable setup-only**:
- [[wiki-as-graph-poc-sub-corpus-snapshot]] — selezione strategica di **20 pagine**
  (10 concept + 5 entity + 3 synthesis + 1 source + 1 runbook) + baseline metriche
  misurate:
  - 218 citation `[^src:]` totali (target Check 1)
  - 215 wikilink occurrence / 57 unique target (target Check 2)
  - Frontmatter min `type`+`status` 20/20 (target Check 3)
  - 5 namespace distinti (target Check 4)
  - 3117 lines totali, range 32-583 per pagina (stress test mix densità)
- [[wiki-as-graph-poc-template]] — runbook procedurale 6 step + 4 check
  operazionalizzati con script `jq`/`grep` + decision gate
- Criteri di selezione del sub-corpus documentati (citation density / wikilink
  density / frontmatter ricchezza / namespace coverage / edge case low+long-form)

**4 check operazionalizzati**:
| Check | Criterio PASS | Target baseline |
|---|---|---|
| 1. Citation integrity | 100% citation preservate con `path`+`section` intatti | 218/218 |
| 2. Wikilink resolution | 100% wikilink resolved, 0 broken links | 215/215, 57 unique |
| 3. Frontmatter integrity | 100% obbligatori (type+status), ≥ 95% frequenti | 20/20 (type+status) |
| 4. Layering preservato | 5 namespace distinguibili + distribuzione 10/5/3/1/1 | 5/5 |

**Invariante non negoziabile** (R.K1, da consolidare in PATTERN.md se decisione GO):
anche **1 check su 4 FAIL** → Fase 3b scartata automaticamente. Nessuna negoziazione,
nessun "passing parziale" accettato. Il pattern karpathy è non comprimibile per
design.

**Esecuzione**: copiare [[wiki-as-graph-poc-template]] come
`wiki/runbooks/wiki-as-graph-poc-YYYY-MM-DD.md`, eseguire i 6 step su factory
candidate v2.14 Fase 2 con Graphify installato, compilare i risultati dei 4 check,
prendere decisione GO/NO-GO.

**Costo run stimato**: $0.05–$0.50 (sub-corpus piccolo, 3117 lines).

### Graphify installato sul meta-framework (2026-05-28 18:00)

Reality check confermato: il pacchetto PyPI `graphifyy` (doppia-y, autore Safi
Shamsi) esiste — v0.8.22 MIT, Python 3.10+, 68 deps tra cui 30+ tree-sitter
grammars. Il binario installato è `graphify` (singola-y, mismatch documentato).

**Installato sulla macchina** (system-wide via `pip3 install graphifyy`). NON
committato nel repo: i pacchetti Python non sono parte di
`soli-multi-agents-factory`. Quello che committiamo è la documentazione +
adapter markdown + config schema.

Runbook completo: [[graphify-installation]] (procedura standard + provider LLM
setup + smoke test + integrazione CI + troubleshooting).

**Correzioni nei deliverable Fase 2** (precedentemente prodotti):
- I riferimenti CLI `graphifyy --version` corretti a `graphify --version` in:
  - [[graphify-extraction-protocol]] (skill)
  - `.claude/commands/graphify-sync.md`
  - PATTERN.md §20.10.2 (coerenza inviolabile)
- Il sub-comando `get_impact_radius(file)` del design doc è una metafora; nel CLI
  reale è `graphify affected "<X>"` (reverse traversal)
- Output Graphify di default va in `<cwd>/graphify-out/`; lo skill
  `graphify-extraction-protocol` lo riloca al side-channel
  `.graphify-state/code_paths/<slug>/` per conformità R.G5

Con Graphify ora disponibile, la **Fase 1.5 reale** (validation empirica) e la
**Fase 3a reale** (PoC karpathy preservation) sono eseguibili — appena una factory
derivata v2.14 con kanban significativo sarà disponibile.

### v2.15 — Consolidation (2026-05-29)

PATTERN bumpato 2.14 → 2.15 come **consolidation release** (no nuove feature di
framework). Vedi `PATTERN.md` §21 e `CHANGELOG.md` v2.15.0.

**Riformulazione dei gate Fase 1.5 e Fase 3a** — passaggio da
«pending run empirico» (blocker implicito della versione) a **opt-in deferred**:

- I gate restano **setup-ready** (template completi, baseline misurato, decision
  criteria definiti) ma **non bloccano** il consolidamento del PATTERN.
- Sono eseguibili **a discrezione del derivatore** della factory, quando:
  - dispone di factory candidata reale (kanban significativo + sprint reale per
    Fase 1.5; sub-corpus karpathy per Fase 3a),
  - dispone di parametri di baseline adeguati per misurazione empirica delle 3
    metriche (Fase 1.5: saving combined ≥ 50%, drift critici = 0, qualità
    invariata) o dei 4 check (Fase 3a: citation / wikilink / frontmatter /
    layering).
- L'esito (qualunque sia) è **input per v2.16+**, non per v2.15. In assenza di
  esecuzione, i gate restano chiusi e Fase 3b wiki-as-graph resta non attivabile.

**Motivazione del passaggio a opt-in deferred**:

Il meta-framework stesso (questo repo) **non è candidate di validation Fase 1.5**:
non ha kanban significativo né sprint reale (verificato in §«Fase 1.5 — Setup
ready», 2026-05-28). Le factory derivate dal framework hanno parametri di
baseline misurabili **non garantiti** — dipende dal progetto reale. Bloccare il
consolidamento del PATTERN sulla validation empirica significherebbe lasciare
v2.14 in stato «WIP» indefinitamente, mentre il framework v2.14 è già stato
applicato a progetti reali con esito ragionevole (anche senza metriche formali).

La riformulazione **non altera invarianti né defaults**:

- R.C1–R.C6 (output) e R.G1–R.G6 (context) restano in vigore identici.
- Default `compression.output.enabled: false` + `compression.context.enabled:
  false` invariati.
- R.K1 (invariante karpathy non comprimibile) preservato: Fase 3b resta gated
  da Fase 3a con i 4 check non-negoziabili. La riformulazione sposta
  l'attivazione di Fase 3b ai termini «*se eseguita con esito positivo*», non
  «*quando eseguita*».

**Trace storica delle decisioni** (non sovrascritto):

- Fase 1.5 setup (2026-05-28 16:30) — gate empirico definito come «obbligatorio
  pre-Fase 2 reale»
- Fase 2 implementata (2026-05-28 17:00) — bypass del gate Fase 1.5 per priorità
  di delivery
- Fase 3a setup (2026-05-28 17:30) — gate karpathy preservation definito come
  «obbligatorio non negoziabile pre-Fase 3b»
- **v2.15 consolidation (2026-05-29)** — entrambi i gate passano da
  «obbligatorio» a «opt-in deferred»

I template restano committati (`compression-validation-template.md`,
`wiki-as-graph-poc-template.md`, `wiki-as-graph-poc-sub-corpus-snapshot.md`)
come riferimento operativo per chiunque vorrà eseguirli.

## Storie collegate
<!-- Sezione gestita dal product-manager — non modificare se sei wiki-keeper -->
