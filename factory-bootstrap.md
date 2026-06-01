---
description: Seed self-contained per scaffoldare una Agentic Factory llm-wiki++ v2.15. Replicabile da qualunque AI agent con file I/O su qualunque macchina/cartella. Hybrid: procedura + PATTERN essentials inline + adapter templates fetched da GitHub. v2.15 = consolidation release del Compression Layer a due assi opt-in introdotto in v2.14; gate empirici Fase 1.5 + 3a riformulati come opt-in deferred (non bloccanti).
argument-hint: [nome-progetto] [path-destinazione]
allowed-tools: Read, Write, Edit, Bash, Glob, TodoWrite, WebSearch, WebFetch
---

# Factory Bootstrap v2.15 — Self-Contained Portable Seed (Consolidation Release)

> **Replicabilità**: questo singolo file Markdown è il **seed completo** per scaffoldare
> una Agentic Factory llm-wiki++ v2.15 su **qualunque macchina/cartella** con
> **qualunque AI agent** (Claude Code, Cursor, OpenAI Assistants, Aider, Gemini Code,
> ChatGPT con file tools, etc.).
>
> **v2.15 = consolidation release**. Nessuna nuova feature di framework rispetto a
> v2.14. Bump versione del PATTERN per chiudere il ciclo v2.14 (Output Compression
> Layer Fase 1 + Context Compression Layer Fase 2) come baseline stabile. I due
> gate empirici Fase 1.5 (validation OCL) e Fase 3a (PoC karpathy preservation) sono
> riformulati come **opt-in deferred**: eseguibili a discrezione del derivatore della
> factory quando dispone di parametri di baseline adeguati. **Migration v2.14 →
> v2.15 = no-op di codice** (le factory v2.14 si comportano identiche su v2.15).

## §0 — Cambiamenti v2.15 vs v2.14

### Consolidation (nessuna nuova feature)

- **Bump versione PATTERN** 2.14 → 2.15. Tutti i deliverable v2.14 restano in vigore
  identici (skill, agent, command, blocco config, side-channel).
- **Tutte le invarianti preservate**: R.C1-R.C6 (output) + R.G1-R.G6 (context) +
  R.A1-R.A6 (multi-adapter) + R.B1-R.B6 (multi-repo) + R.Q1-R.Q7 (CQRL) + 18 §7
  rules.
- **Default invariati**: `compression.output.enabled: false` +
  `compression.context.enabled: false`.

### Riformulazione gate empirici

- **Fase 1.5 validation** (template [[compression-validation-template]]) → **opt-in
  deferred**. Resta setup-ready ma **non blocca** il consolidamento del PATTERN.
  Eseguibile a discrezione del derivatore della factory quando dispone di kanban
  significativo + sprint reale + capacità di misurazione delle 3 metriche (saving
  combined ≥ 50%, drift critici = 0, qualità invariata). L'esito è input per
  v2.16+, non per v2.15.
- **Fase 3a karpathy preservation PoC** (template [[wiki-as-graph-poc-template]] +
  [[wiki-as-graph-poc-sub-corpus-snapshot]]) → **opt-in deferred**. Resta
  setup-ready ma **non blocca** il consolidamento del PATTERN. **R.K1 invariante
  karpathy non comprimibile preservato**: Fase 3b wiki-as-graph resta
  **non-attivabile** in assenza di un run con esito GO (4 check non-negoziabili:
  citation / wikilink / frontmatter / layering).

### Motivazione del passaggio a opt-in deferred

Il meta-framework stesso (questo repo) **non è candidate di validation Fase 1.5**:
non ha kanban significativo né sprint reale. Le factory derivate dal framework
hanno parametri di baseline misurabili **non garantiti** — dipende dal progetto
reale. Bloccare il consolidamento del PATTERN sulla validation empirica avrebbe
lasciato v2.14 in stato «WIP» indefinitamente, mentre il framework è già stato
applicato a progetti reali con esito ragionevole anche senza metriche formali.

La riformulazione **non altera invarianti né defaults**, solo lo *status* dei gate:
da «pending run empirico» (blocker implicito della versione) a «opt-in deferred»
(gate aperto, eseguibile da chiunque abbia setup adeguato).

Backward compat preservata da v2.14 (compression a due assi), v2.13 (multi-adapter
§12, R.A1-R.A6), v2.12 (CQRL §19, multi-repo §13, R.B1-R.B6), v2.11 (`code_path:`
singolare, `vcs:` top-level). **Factory v2.14 si comportano identiche su v2.15**
senza alcuna migration.

## §0-bis — Cambiamenti v2.14 vs v2.13 (eredità storica)

### Fase 1 — Output Compression Layer (OCL) via Caveman

- **Nuova §20 PATTERN** «Output Compression Layer». 6 invarianti R.C1-R.C6
  (allow-list channel-aware, chain-depth ceiling, cross-factory off, drift fallback,
  invarianti `to_user`/`to_artifact`/`propagate-resolution` non overridabili neppure
  in `policy_profile: custom`, opt-in totale).
- **Nuova §7 r.18**: compression mai sugli artefatti persistenti (`wiki/**`,
  `management/kanban/**`, `<code_path>/**`, `design_&_architecture/**`,
  `code_quality/**`, `memory/**`), mai su output verso utente, mai su
  `propagate-resolution`.
- **3 policy_profile** selezionabili: `conservative` (default, drift minimo +
  chain-depth severity ceiling), `aggressive` (factory mature), `custom` (matrice
  esplicita).
- **Topology-aware default**: `knowledge-only` → `aggressive`; `full-stack` / `hybrid`
  → `conservative`.
- **Nuova skill `caveman-protocol`** (5 fasi: Bootstrap → Identify Channel → Apply
  Compression → Drift Check → Log).
- **Nuovo comando `/compression`** (`show` / `set` / `policy` / `dry-run`).
- **Hook in `parallel-scheduling`** (§20.7): intercept inline + stats
  `tokens_compressed/tokens_raw` nel `wave_report.md`.
- **Lint Check 4k**: coerenza `policy_profile == custom` ⇒ `channels` block completo;
  R.C1 invariants enforced.

### Fase 2 — Context Compression Layer (CCL) via Graphify

- **Nuova §16 estesa** con `graphify-sync` come **4° sync adapter** (PDF / Figma /
  Repo / Graph).
- **Nuova §20.10-§20.11 PATTERN** «Context Compression Layer». 6 invarianti R.G1-R.G6
  (filesystem single source of truth, confidence-gated dispatch obbligatorio, blast
  radius pre-check, drift mitigation con cron weekly + monitoring, side-channel
  write-restricted, opt-in totale).
- **Confidence-gated dispatch**: executor (dev) → `EXTRACTED` only; explorer
  (lead-architect, wiki-query) → `EXTRACTED + INFERRED`; reviewer (code-reviewer) →
  tutto con flag.
- **Nuovo agent `graphify-sync`** (thin, analogo a `repo-sync` v2.12 + writes
  side-channel).
- **Nuova skill `graphify-extraction-protocol`** (5 fasi: Bootstrap → Discovery+Cost
  → Build Graph → Side-channel write+Summary → Log).
- **Nuovo comando `/graphify-sync`** (`sync` / `show` / `status` / `refresh`).
- **Side-channel `.graphify-state/code_paths/<slug>/`** (`graph.json`,
  `GRAPH_REPORT.md`, `last_full_rebuild.txt`) — non versionato in git (R.G6).
- **CQRL integration (§20.10.3)**: `graphify affected "<X>"` pre-check incluso nel
  `task_package` come `blast_radius_warning` constraint (R.Q4-ter regression
  mitigation).
- **CI strategy `cache-with-fallback`**: zero token su cache hit, fallback scansione
  filesystem su stale > 7gg, full rebuild solo on-demand (cron weekly).
- **Provider opt-in**: `graphify-cloud` (default) | `graphify-ollama` (enterprise data
  residency, 16+ GB VRAM).
- **MCP server**: `per-agent` (default, isolato) | `shared` (factory mature).
- **Lint Check 4l**: graphify deliverables coerenza.

### Tooling install

- **Graphify v0.8.22+** installabile via `pip install graphifyy` (PyPI doppia-y,
  binario `graphify` singola-y).
- Runbook scaffoldato: `wiki/runbooks/graphify-installation.md` (procedura standard +
  provider LLM cloud/Ollama + smoke test + CI cache-with-fallback + hook git
  auto-update + troubleshooting).

### Gate empirici (setup-ready, run deferred)

- **Fase 1.5 validation** (template [[compression-validation-template]]): gate
  empirico OCL su factory derivata con sprint reale.
- **Fase 3a karpathy preservation PoC** (template [[wiki-as-graph-poc-template]] +
  [[wiki-as-graph-poc-sub-corpus-snapshot]]): gate per Fase 3b wiki-as-graph (v2.15+),
  con 4 check non-negoziabili (citation / wikilink / frontmatter / layering).

Backward compat preservata da v2.13 (multi-adapter §12, R.A1-R.A6), v2.12 (CQRL
§19, multi-repo §13, R.B1-R.B6), v2.11 (`code_path:` singolare, `vcs:` top-level).
Factory v2.13 senza blocchi `compression.*` si comportano identiche su v2.14.

## §1 — How to use this seed (qualunque agent)

1. **Apri il seed** con il tuo AI agent (es. lo passi come system prompt o lo fai
   leggere come file context).
2. **Dichiara l'intento**: «Esegui factory-bootstrap v2.15: scaffolda una nuova
   factory in `<path-destinazione>` per il progetto `<nome>`».
3. **Rispondi alle domande** che l'agente porrà (vedi §3 Fase 1).
4. **Scegli gli adapter da scaffoldare** (§3 Fase 1.bis, v2.13).
5. **Configura il Compression Layer** (§3 Fase 1.ter, NUOVO in v2.14) — opt-in,
   default off su entrambi gli assi.
6. L'agente scaffolda i file e produce un report finale (§3 Fase 7).

## §2 — Runtime conversion table (agent-agnostic)

Il seed è scritto in Markdown standard. Per ogni costrutto runtime-specifico, ecco
le equivalenze fra i principali agent runtime.

| Concetto | Claude Code | Cursor | OpenAI Assistants | Aider | Gemini Code | ChatGPT |
|---|---|---|---|---|---|---|
| Agente specializzato | sub-agent `.claude/agents/<name>.md` + Agent tool | rule `.cursor/rules/<name>.mdc` | Assistant via API | prompt `.aider/prompts/<name>.md` + `/read` | Custom Gem | Custom GPT |
| Skill / procedura | `.claude/skills/<name>.md` | rule `.cursor/rules/skills/<name>.mdc` | Function tool | `.aider/skills/<name>.md` + `/read` | Gem instructions | GPT instructions |
| Slash command | `.claude/commands/<name>.md` | `.cursor/commands/<name>.md` | Custom action | shell wrapper `.aider/commands/<name>.sh` | Custom Gem function | Custom action |
| File read | `Read` tool | `@<file>` mention | `code_interpreter` / `file_search` | `/add` o `--read` | `read_file` | Code Interpreter |
| File write | `Write`/`Edit` | Edit/Apply | `code_interpreter` exec | built-in | `write_file` | Code Interpreter |
| Shell | `Bash` tool | Terminal | `code_interpreter` exec | `/run` | Code Execution | Code Interpreter |
| Multi-tool parallel | "Multiple tool uses in one message" | Multi-action | Parallel function calls | sequential | parallel tool calls | sequential |
| Sub-agent fan-out | `Agent(subagent_type=...)` | "Compose agent" | "Run sub-assistant" | manual | "Spawn sub-Gem" | manual |

**Adapter di reference scaffoldato**: `.claude/`. Per altri adapter, il
`bootstrap-multiadapter-protocol` traduce i `.claude/` templates ai costrutti del
runtime target seguendo questa tabella + le mappature in `adapters/<name>/manifest.yaml`.

## §3 — Bootstrap procedure (~8 fasi)

### Fase 0 — Setup

Parsing argomenti `$ARGUMENTS`:
- Primo argomento → **Nome progetto** (se assente, chiedi).
- Secondo argomento → **Path destinazione assoluto** (default: cwd).

Verifica preliminari:
- Path destinazione esiste o è creabile.
- Hai accesso a network (per fetch §4) oppure hai pre-clonato il repo meta-framework.

### Fase 1 — Input collection (Quick path o Linear path)

**Quick path** — proponi 5 archetipi pre-impostati:

```
SCEGLI ARCHETIPO O 'custom':
1. knowledge-only      — solo wiki/ingest, no codice
2. greenfield-full     — nuovo progetto, full-stack agentico in monorepo
3. existing-monolith   — repo monolite esistente, retrofit con factory
4. microservices       — N microservizi BE + (opzionale) 1 FE
5. micro-frontend      — N FE indipendenti + 1+ BE shared
6. custom              — flusso completo A→G
```

**Linear path A→G** (se `custom` o override):

A. **Lingua** (`it`/`en`/altro)
B. **Owner**
C. **Topologia** (`knowledge-only | plan-only | full-stack-agents | hybrid-be-agents | hybrid-fe-agents | custom`)
D. **Code path (L5)** — SKIP se G=`existing-repo` (derivato da coupling)
D-bis. **VCS mode** — SKIP se G=`existing-repo`
D-ter. **External task tracker** (kanban_publish, opt-in)
D-quater. **Parallel scheduler** (v2.11)
D-quinquies. **Code Quality Review Layer** (v2.12, opt-in)
E. **Stack mode** (`manual | guided | auto`)
F. **Standards verbatim** (§11)
G. **Wiki feeding source** (v2.12): `empty | pdf | figma | existing-repo`. Se `existing-repo` → vai a Fase 2.

### Fase 1.bis — Adapter selection (NUOVO in v2.13)

Chiedi quali adapter installare:

```
SELEZIONA ADAPTER DA SCAFFOLDARE (multi-select):

  [x] claude       (full reference)             — .claude/
  [ ] cursor       (full v2.13)                 — .cursor/
  [ ] aider        (full v2.13)                 — .aider/
  [ ] openai       (partial — setup.py stub)    — .openai/
  [ ] gemini       (manifest-only)              — .gemini/
  [ ] chatgpt      (manifest-only)              — .chatgpt/

Default: [claude]. Multi-adapter use case (raccomandato per team):
  [claude, cursor] — Claude Code per agentic + Cursor per refactoring manuale
  [claude, aider]  — Claude Code per dev + Aider per quick edits
```

R.A6 — Agent-agnostic: la factory funziona con qualunque combinazione.
R.A1 — Isolamento: ogni adapter scrive solo nel proprio folder.

### Fase 1.ter — Compression Layer setup (NUOVO in v2.14, opt-in)

Chiedi se attivare il Compression Layer (default: entrambi gli assi off).

```
COMPRESSION LAYER (PATTERN §20, v2.14 — opt-in totale, R.C6 + R.G6)

Asse OUTPUT (Fase 1 OCL — Caveman):
  [ ] enabled?  (default: no)
  Se sì:
    provider:        caveman (fisso v2.14)
    policy_profile:  [conservative (default) | aggressive | custom]
                       — topology-aware suggestion:
                         knowledge-only  → aggressive
                         full-stack      → conservative
                         hybrid-*        → conservative
    drift_fallback:  ambiguous_handoff_marker (R.C5 default)

Asse CONTEXT (Fase 2 CCL — Graphify):
  [ ] enabled?  (default: no)
  Se sì:
    provider:        [graphify-cloud (default) | graphify-ollama (enterprise)]
    targets:         derivate da code_paths (kind: code_path; kind: wiki → v2.15+)
    update_strategy: incremental (default) + full_rebuild_cron weekly
    ci_strategy:     cache-with-fallback (default)
    confidence_gating:
      executor: EXTRACTED only
      explorer: EXTRACTED + INFERRED
      reviewer: tutto + flag
    mcp_server:      [per-agent (default) | shared]
    full_rebuild_cost_warn: 5$ (USD, default)
```

**Default sicuri**:
- `compression.output.enabled: false`
- `compression.context.enabled: false`
- Se l'utente attiva un asse senza valori, applica i default (`policy_profile:
  conservative`, `provider: graphify-cloud`, etc.).

**Invarianti R.C1-R.C6 (output)** non overridabili neppure in `policy_profile:
custom`:
- `to_user`, `to_artifact`, `propagate_resolution` → sempre `off`.
- Cross-factory → sempre `off` (R.C4) — in federated mode.
- Drift fallback → sempre attivo (R.C5) con marker `AMBIGUOUS_HANDOFF` /
  `REQUEST_CLARIFY`.

**Invarianti R.G1-R.G6 (context)** non overridabili:
- Filesystem single source of truth (R.G1): `.graphify-state/` è cache, mai
  authoritative.
- Confidence-gated dispatch obbligatorio (R.G2) per ogni agente che consuma graph.
- Blast radius pre-check (R.G3) prima di modifiche significative (CQRL integration).
- Drift mitigation obbligatoria (R.G4): cron weekly full rebuild + drift
  monitoring.
- Side-channel `.graphify-state/` write-restricted (R.G5) — solo `graphify-sync`
  scrive.
- Opt-in totale (R.G6): factory senza blocco `compression.context` si comporta
  identica a pre-v2.14.

**Tooling check**: se l'utente attiva CCL, verifica disponibilità Graphify:

```bash
graphify --version
# atteso: graphify 0.8.22 o superiore (binario singola-y, da pip install graphifyy doppia-y)
# se non installato: scaffolda wiki/runbooks/graphify-installation.md e raccomanda
# l'installazione prima di usare /graphify-sync
```

### Fase 2 — Multi-repo + coupling (solo se G=`existing-repo`)

Identico a v2.12 — vedi seed v2-12 §Fase 2 per i dettagli (loop N repo, coupling
modes `monorepo` / `sibling-new-repo` / `submodule-new-repo`, R.B1-R.B6).

### Fase 3 — Read templates (fetch da GitHub o fallback)

**Method A — Git clone (preferito)**:

```bash
TMPDIR=$(mktemp -d)
git clone --depth=1 --branch=main https://github.com/soli92/soli-multi-agents-factory.git "$TMPDIR/meta-framework"
META="$TMPDIR/meta-framework"
```

Poi leggi:
- `$META/PATTERN.md` (v2.15 contratto universale — consolidation release)
- `$META/factory.config.yaml` (template con code_paths + adapters + **compression** blocks)
- `$META/adapters/README.md` (registry adapter)
- Per ciascun adapter selezionato:
  - `$META/adapters/<name>/manifest.yaml`
  - `$META/adapters/<name>/templates/**/*` (file template starter, dove presenti)
- `$META/.claude/agents/*.md` (template di reference per gli altri adapter, **incluso `graphify-sync.md` v2.14**)
- `$META/.claude/skills/*.md` (incluso **`caveman-protocol.md`** + **`graphify-extraction-protocol.md`** v2.14)
- `$META/.claude/commands/*.md` (inclusi **`compression.md`** + **`graphify-sync.md`** v2.14)
- `$META/.gitignore` (include **`.graphify-state/`** v2.14 — R.G6)
- `$META/wiki/runbooks/graphify-installation.md` (runbook tooling v2.14)
- Template gate empirici v2.14:
  - `$META/wiki/runbooks/compression-validation-template.md`
  - `$META/wiki/runbooks/wiki-as-graph-poc-template.md`
  - `$META/wiki/runbooks/wiki-as-graph-poc-sub-corpus-snapshot.md`

**Method B — Curl da raw GitHub**: stesso pattern URL ma fetch HTTP individuale.

**Method C — WebFetch tool**: come Method B via WebFetch.

**Method D — Fallback offline**: utente fornisce path del repo meta-framework pre-clonato.

### Fase 4 — Scaffolding (template → destinazione)

In ordine:

**4.a — Root files**:

| File | Source |
|---|---|
| `PATTERN.md` | `$META/PATTERN.md` (copia integrale verbatim) |
| `CLAUDE.md` | template breve |
| `README.md` | template progetto |
| `factory.config.yaml` | da template + sostituzione valori raccolti (`topology`, `code_paths`, `adapters[]`, **`compression.output.*` + `compression.context.*` v2.14**, ecc.) |
| `.gitignore` | include `.graphify-state/` (R.G6 v2.14) |

**4.b — Directory L1-L5 + side-channel**: come v2.12.

**4.c — Multi-adapter scaffolding** (NUOVO in v2.13):

Per ciascun adapter in `adapters_selected`, invoca **`bootstrap-multiadapter-protocol`**
(skill in `$META/.claude/skills/bootstrap-multiadapter-protocol.md`).

Per ciascun adapter:
- Legge `adapters/<name>/manifest.yaml`.
- Risolve i template condizionali (in base a topology + opt-in features).
- Scaffolda nel `<factory_dest>/<adapter_folder>` (es. `.claude/`, `.cursor/`, `.aider/`).
- Aggiorna `factory.config.yaml.adapters[]` con la nuova entry.

**Caso speciale per `.claude/`**: copia direttamente dal meta-framework (file già pronti).

**Caso `.cursor/` / `.aider/` / `.openai/`**: il manifest ha alcuni template starter in
`adapters/<name>/templates/`; per i template mancanti, traduce automaticamente dal
`.claude/<corrispondente>.md` applicando `manifest.mappings`.

**Caso `.gemini/` / `.chatgpt/`** (manifest-only): crea solo `<folder>/README.md` con
le `scaffolding_instructions` del manifest. L'utente scaffolda manualmente.

**4.d — Compression Layer artefatti** (NUOVO in v2.14):

Per ciascun adapter selezionato (almeno `.claude/`), copia:

- **OCL deliverable**:
  - `.<adapter>/skills/caveman-protocol.md` (5 fasi, mappato per adapter via manifest)
  - `.<adapter>/commands/compression.md` (`show` / `set` / `policy` / `dry-run`)
  - Frontmatter agent: aggiungi campo opzionale `caveman_policy:` ai template `orchestrator`
    + `wiki-keeper` (dev-agent ereditano dal config globale).
- **CCL deliverable** (se `compression.context.enabled: true`):
  - `.<adapter>/agents/graphify-sync.md` (4° sync adapter, thin)
  - `.<adapter>/skills/graphify-extraction-protocol.md` (5 fasi)
  - `.<adapter>/commands/graphify-sync.md` (`sync` / `show` / `status` / `refresh`)
  - `.<adapter>/agents/code-reviewer.md`: includi blast radius pre-check (R.G3,
    `graphify affected` integration nel `task_package`).
  - `.<adapter>/skills/parallel-scheduling.md`: Step 1 nuovo Fase 5 (context
    compression resolve confidence-gated, fallback automatico a scansione filesystem).

**Side-channel**:
- Crea `.graphify-state/` (non versionato — registrato in `.gitignore` da step 4.a).
- Lascia vuoto al bootstrap; popolato dal primo `/graphify-sync <target>`.

**Lint extensions**:
- `.<adapter>/skills/lint-checks.md` esteso con Check 4k (OCL coerenza) + Check 4l
  (CCL graphify deliverables).

**Memory primer**:
- `code_quality/rules/canonical/` + `code_quality/rules/team-specific/`: invariate
  da v2.12. La CCL si integra via `task_package` constraint, non via nuove regole.

### Fase 5 — VCS bootstrap

Identico a v2.12 — vedi seed v2-12 §Fase 5.

### Fase 6 — Validation + wiki feeding + report

Aggiunge ai 28 check di v2.13 i seguenti (v2.14):

29. **R.C6 OCL opt-in**: `factory.config.yaml.compression.output.enabled` esiste con
    valore esplicito `true|false` (default `false`).
30. **R.C1 OCL invariants**: se `compression.output.enabled: true` e
    `policy_profile: custom`, il blocco `channels:` esiste con almeno
    `to_user: off`, `to_artifact: off`, `propagate_resolution: off` (non
    overridabili, R.C1).
31. **R.G6 CCL opt-in**: `factory.config.yaml.compression.context.enabled` esiste
    con valore esplicito `true|false` (default `false`).
32. **R.G5 side-channel**: `.graphify-state/` registrato in `.gitignore`.
33. **Tooling (se CCL on)**: `wiki/runbooks/graphify-installation.md` scaffoldato;
    `graphify --version` documentato (no enforcement runtime — facoltativo
    pre-uso effettivo).
34. **R.G2 confidence gating**: se `compression.context.enabled: true`, il blocco
    `confidence_gating:` esiste con almeno `executor`/`explorer`/`reviewer` definiti.

Nuovo check v2.15:

35. **Gate banner v2.15**: i template `wiki/runbooks/compression-validation-template.md`
    e `wiki/runbooks/wiki-as-graph-poc-template.md` contengono il banner
    «Status v2.15 — Gate riformulato come opt-in deferred» in testa al file
    (verificabile via grep). I template restano scaffoldati come riferimento
    operativo, ma il loro stato non è bloccante per il consolidamento.

Wiki feeding source bootstrap (post-scaffolding) come v2.12. **NUOVO in v2.14**:
se `compression.context.enabled: true` e l'utente ha confermato availability di
Graphify, suggerisci l'esecuzione di `/graphify-sync <target>` su ciascun `code_path`
attivo come step di warm-up del side-channel (zero token su cache hit successivi).

### Fase 7 — Report finale

Includi info multi-adapter (NUOVO):

```
========================================
BOOTSTRAP COMPLETATO — Agentic Factory llm-wiki++ v2.15
========================================
Progetto: <project_name>
Destinazione: <factory_dest_path>

[ADAPTER INSTALLATI]
| Adapter | Folder    | Maturity      | File creati |
|---------|-----------|---------------|-------------|
| claude  | .claude/  | full reference| 45          |
| cursor  | .cursor/  | full v2.13    | 38          |
| aider   | .aider/   | full v2.13    | 23          |

[ALBERO]
<find <dest> -maxdepth 2 -type d>

[CONFIGURAZIONE]
... (come v2.13)

[COMPRESSION LAYER v2.15 — consolidation]
| Asse                          | Enabled | Provider        | Profile        |
|-------------------------------|---------|-----------------|----------------|
| compression.output (OCL)      | false   | caveman         | conservative   |
| compression.context (CCL)     | false   | none            | -              |
| Gate Fase 1.5 (validation)    | opt-in deferred — eseguibile a discrezione      |
| Gate Fase 3a (karpathy PoC)   | opt-in deferred — R.K1 preservato (Fase 3b OFF) |

[CHECK ACCETTAZIONE]
35/35 PASS  (34 di v2.14 + 1 nuovo v2.15)

[PROSSIMI STEP]
- Wiki feeding: <empty|pdf|figma|existing-repo> → <suggerimento>
- Adapter primario per la sessione: scegli quale runtime usare (es. Claude Code,
  Cursor, Aider).
- {se .openai/ scaffoldato}: esegui `python .openai/setup.py` per creare gli
  Assistant via OpenAI API (richiede OPENAI_API_KEY).
- {se .gemini/ o .chatgpt/}: scaffolding manuale richiesto, vedi <folder>/README.md.
- {se compression.output.enabled: true}: smoke test con `/compression dry-run` su
  una wave significativa prima del primo `/run` produttivo.
- {se compression.context.enabled: true}: esegui `/graphify-sync <target>` su
  ciascun `code_path` attivo per popolare `.graphify-state/`. Verifica
  `graphify --version >= 0.8.22`.
- {se compression.output.enabled: true E factory derivata reale}: considera
  esecuzione opzionale di Fase 1.5 validation
  (wiki/runbooks/compression-validation-template.md → copia in
  compression-validation-YYYY-MM-DD-<factory>.md). Opt-in deferred (no blocker).
- {se interesse wiki-as-graph futuro}: Fase 3a karpathy preservation PoC
  disponibile (wiki/runbooks/wiki-as-graph-poc-template.md). Opt-in deferred
  (gate non-attivabile fino a esito GO, R.K1).

[REMINDER]
- Agent-agnostic preservato (R.A6): PATTERN.md è il contratto, runtime mappato via adapter.
- Multi-adapter coexistence (R.A1-R.A6): ogni adapter scrive solo nel proprio folder;
  filesystem state è condiviso (wiki/, management/, raw/, memory/, code_quality/).
- Single-committer wiki/ enforced globalmente (R.A3): mai invocare wiki-keeper da
  due adapter contemporaneamente.
- Compression Layer R.C1-R.C6 (output) + R.G1-R.G6 (context): vedi PATTERN §20.
- R.C1 invariants: `to_user`, `to_artifact`, `propagate_resolution` sempre `off`
  (non overridabili neppure in `policy_profile: custom`).
- R.G5 side-channel: `.graphify-state/` write-restricted (solo `graphify-sync`).
- {se monorepo existing-repo}: commit dedicato per isolare aggiunta factory.
- {se CQRL on}: popolare code_quality/rules/canonical/ per lo stack prima del primo /review.
- {se submodule}: esegui git submodule add stampato prima di consumare TSK.
```

## §4 — Inline templates

### §4.1 — PATTERN essentials (concetti chiave per orientamento)

Per il PATTERN.md completo (1500+ righe), fetch via §3 Fase 3 e scrivi verbatim. Qui
solo i concetti essenziali per orientare l'agent durante il bootstrap.

**Modello a layer**:
- L1 `raw/` — input multi-sorgente (PDF / Figma / repo). Read-only (solo Sync agents).
- L2 `wiki/` — wiki llm-style append-only `log.md`. Single-committer (wiki-keeper).
- L3 `management/` — kanban EP/US, roadmap, questions (PM).
- L4 `design_&_architecture/` + `kanban/**/TSK-*.md` (Arch + TPM).
- L5 `<code_paths>/` — codice (v2.12 multi-repo).
- `memory/`, `code_quality/` — side-channel.

**17 regole inviolabili §7** (non bypassabili — vedi PATTERN.md fetched).

**Ruoli** (PATTERN §2):
- Orchestrator, Sync (sync-docs / figma-sync / repo-sync), Analyst (wiki-keeper),
  PM, Arch, TPM, Dev (be/fe/db/qa opzionali), Code Reviewer (CQRL opt-in v2.12),
  Publisher (opzionale).

**v2.13**: contratto multi-adapter §12.0-§12.4 con manifest formale + R.A1-R.A6 invarianti.

**v2.14**: Compression Layer a due assi opt-in §20.
- §20.1-§20.9: Output Compression Layer (Caveman, 6 R.C1-R.C6).
- §20.10-§20.11: Context Compression Layer (Graphify, 6 R.G1-R.G6).
- §16 esteso: `graphify-sync` come 4° sync adapter (PDF / Figma / Repo / Graph).
- §7 r.18: compression mai sugli artefatti persistenti.

**v2.15** (questa): consolidation release. Nessuna nuova feature di framework.
- Bump PATTERN.md §0 a 2.15 + nuova entry §21 changelog.
- Gate Fase 1.5 + 3a riformulati come opt-in deferred (template scaffoldati con
  banner «Status v2.15 — Gate riformulato come opt-in deferred»).
- R.K1 invariante karpathy preservato: Fase 3b wiki-as-graph resta non-attivabile
  in assenza di run con esito GO della Fase 3a PoC.
- Migration v2.14 → v2.15 = no-op di codice.

### §4.2 — CLAUDE.md template + README.md template

Come v2.12, con aggiunta riga:
- `adapters/` registry referenziato in CLAUDE.md.
- Lista adapter installati in `factory.config.yaml.adapters[]`.

### §4.3 — Fallback offline manifest

Se l'agente non ha network, l'utente pre-clona:

```bash
git clone --depth=1 https://github.com/soli92/soli-multi-agents-factory.git /tmp/meta-framework
```

Poi il bootstrap usa `/tmp/meta-framework` come source.

### §4.4 — Manifest file list

Lista template necessari (oltre a quelli di v2.12):

**`adapters/`**:
- `adapters/README.md`
- `adapters/cursor/{manifest.yaml,README.md,templates/}`
- `adapters/aider/{manifest.yaml,README.md,templates/}`
- `adapters/openai/{manifest.yaml,README.md,templates/}`
- `adapters/gemini/{manifest.yaml,README.md}`
- `adapters/chatgpt/{manifest.yaml,README.md}`

**`.claude/skills/`** (nuova in v2.13):
- `bootstrap-multiadapter-protocol.md`

**`.claude/agents/`** (v2.14):
- `graphify-sync.md` (4° sync adapter, thin)

**`.claude/skills/`** (v2.14):
- `caveman-protocol.md` (OCL, 5 fasi)
- `graphify-extraction-protocol.md` (CCL, 5 fasi)

**`.claude/commands/`** (v2.14):
- `compression.md` (`show` / `set` / `policy` / `dry-run`)
- `graphify-sync.md` (`sync` / `show` / `status` / `refresh`)

**`wiki/runbooks/`** (v2.14):
- `graphify-installation.md` (procedura standard tooling)
- `compression-validation-template.md` (Fase 1.5 — opt-in deferred)
- `wiki-as-graph-poc-template.md` (Fase 3a — opt-in deferred)
- `wiki-as-graph-poc-sub-corpus-snapshot.md` (baseline 20 pagine)
- `migration-v214.md` (Fase 1) + `migration-v214-fase2.md` (Fase 2)

**Wiki concept core (v2.14)**:
- `wiki/concepts/factory-compression-layer.md` (design doc + decisioni + roadmap)
- `wiki/concepts/token-compression.md` (concetto a due assi ortogonali)
- `wiki/concepts/knowledge-graph-codebase.md` (AST + confidence tagging)
- `wiki/entities/{julius-brussee,caveman,graphify}.md`
- `wiki/syntheses/token-reduction-tools.md` (guida comparativa Caveman vs Graphify)

## §5 — Self-test esteso (35 check)

Vedi §3 Fase 6 per la lista completa. Tutti devono essere PASS prima di dichiarare
bootstrap completato.

## §6 — Note di portabilità

- **Replicabile**: questo seed funziona da qualsiasi cwd, qualsiasi macchina con
  network (o repo pre-clonato).
- **Agent-agnostic**: la procedura §3 funziona con qualsiasi agent runtime.
- **Multi-adapter**: scegli uno o più adapter al bootstrap (R.A5: aggiungibili a
  runtime con `bootstrap-multiadapter-protocol` standalone).
- **Versioned**: meta-prompt seeds in `<meta-framework>/meta-prompts/{v2-11,v2-12,v2-13,v2-14,v2-15}/`.
- **Source of truth**: PATTERN.md fetched è la fonte canonica. Adapter manifests in
  `adapters/<name>/manifest.yaml`.

## Vincoli inviolabili (top-level, riassunto)

Da PATTERN §7 (18 regole inviolabili, +r.18 v2.14) + §12.2 (6 multi-adapter) +
§20.4 (6 OCL) + §20.11 (6 CCL):

**Regole inviolabili §7**:
- R.1 — L1 read-only (eccetto Sync).
- R.2 — Zero invenzione.
- R.3 — Citazione obbligatoria.
- R.5 — Append-only su wiki/log.md / gaps.md / incidents.
- R.7 — Update non distruttivo su review|approved.
- R.8 — Scope di scrittura chiuso per ruolo.
- R.12 — wiki/ single-committer.
- R.14 — VCS gate umano (mai operazioni distruttive automatiche).
- R.15 — Cross-tool publish gate umano.
- R.16 (v2.12) — CQRL verdict `reject` = gate umano.
- R.17 (v2.12) — Sync read-only verso sorgente.
- **R.18 (v2.14) — Compression mai sugli artefatti** persistenti, mai verso utente,
  mai su `propagate-resolution`.

**Multi-repo R.B1-R.B6 (v2.12)** + **Multi-adapter R.A1-R.A6 (v2.13)**:
- R.A1 — Isolamento cartella per adapter.
- R.A2 — State filesystem condiviso.
- R.A3 — Single-committer preservato globalmente.
- R.A4 — Manifest immutabile a runtime.
- R.A5 — Adapter aggiungibili a runtime.
- R.A6 — Agent-agnostic preservato (PATTERN.md mai runtime-specific).

**Output Compression R.C1-R.C6 (v2.14)** + **Context Compression R.G1-R.G6 (v2.14)**:
- R.C1 — Invarianti `to_user`/`to_artifact`/`propagate_resolution` sempre off, non
  overridabili neppure in `policy_profile: custom`.
- R.C2 — Allow-list channel-aware (solo canali messaging agent-to-agent comprimibili).
- R.C3 — Chain-depth severity ceiling (compressione decresce con la profondità della catena).
- R.C4 — Cross-factory off in federated mode.
- R.C5 — Drift fallback automatico con marker `AMBIGUOUS_HANDOFF` / `REQUEST_CLARIFY`.
- R.C6 — Opt-in totale (default off).
- R.G1 — Filesystem single source of truth (`.graphify-state/` è cache, mai authoritative).
- R.G2 — Confidence-gated dispatch obbligatorio (executor → EXTRACTED only; explorer
  → +INFERRED; reviewer → all + flag).
- R.G3 — Blast radius pre-check obbligatorio prima di modifiche significative (CQRL
  integration via `task_package` constraint).
- R.G4 — Drift mitigation obbligatoria (cron weekly full rebuild + drift monitoring).
- R.G5 — Side-channel `.graphify-state/` write-restricted (solo `graphify-sync`).
- R.G6 — Opt-in totale (default off).

Vedi PATTERN.md fetched in destinazione per dettagli completi.
