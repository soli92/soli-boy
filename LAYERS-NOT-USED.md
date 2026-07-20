---
factory: soli-boy
date: 2026-07-20
pattern_version: "2.33"
---
# Layer Opt-In Non Esercitati — soli-boy

Lista dei layer opt-in della factory v2.33 non attivati su questo progetto al 2026-07-20.
Questo file e' l'input per la sunset policy (US-186 → TSK-429): i layer qui elencati
sono candidati alla rimozione del blocco config dalla factory se rimangono `enabled: false`
per tutta la durata del progetto.

## Layer non usati

| Layer | Epica origine | Flag config | Motivo |
|-------|---------------|-------------|--------|
| VCS Branch Awareness | EP-034 (v2.25) | `code_paths[app].vcs.branch_awareness.enabled: false` | Monorepo single-HEAD: layer degenere, nessun submodule da allineare |
| Semantic Drift Detection L3 (embedding) | EP-031 (v2.23) | `wiki_lint.semantic_check.enabled: false` | Verifica semantica embedding opt-in: L1 staleness always-on sufficiente per il volume wiki corrente |
| Tavola Rotonda Mode | EP-039 (v2.27) | `tavola_rotonda.enabled: false` | Dominio single-dev: problemi multi-dominio genuinamente complessi non si presentano in questo progetto |
| Hybrid Wiki Search | EP-042 (v2.29) | `wiki_search.enabled: false` | Volume wiki (57 pagine) gestibile con ricerca testuale; overhead LanceDB non giustificato |
| Temporal Estimate Protocol | EP-043 (v2.30) | `temporal.estimate_protocol.enabled: false` | Pipeline non richiede stima adattiva elapsed/progress (sprint brevi, nessun budget time critico) |
| Sprint Progress Signal | EP-043 (v2.30) | `analytics.sprint_progress.enabled` assente (default `false`) | Dipendente da Temporal; non scaffolded per la stessa ragione |
| Capability Formativa (Tutoring) | EP-045 (v2.32) | `capability_formativa.enabled: false` | Progetto app: nessun use case tutoring adattivo o sessioni di apprendimento strutturate |
| Content Share Consumer Layer | EP-048 (v2.33) | `content_share.enabled: false` | Dispatch verso soli-frames non attivato: nessun artefatto da pubblicare automaticamente al momento |
| Voice Channel Layer | EP-041 (v2.28) | non scaffolded | Progetto non-voice (web app / emulatore): nessun I/O audio agente |
| Voice Handsfree Improvements | EP-044 (v2.31) | non scaffolded | Dipende da Voice Channel; non applicabile |
| Voice Hardening | EP-046 (v2.32) | non scaffolded | Dipende da Voice Channel; non applicabile |

## Layer usati

| Layer | Epica origine | Flag config | Note |
|-------|---------------|-------------|------|
| Code Quality Review (CQRL) | EP-005 (v2.12) | `code_quality.enabled: true` | Attivo con 3 pass (idiomaticity/design/robustness); 176 TSK passati |
| FE Visual Oracle | EP-006 (v2.17) | `fe_correctness.enabled: true` | Render headless multi-viewport/tema + critica LLM su ogni TSK FE |
| Accessibility Testing (A11y) | EP-007 (v2.18) | `a11y.enabled: true` | WCAG 2.2 AA via axe-playwright; agente a11y-specialist attivo |
| UX/UI Review & Design | EP-008 (v2.18) | `ux_ui.enabled: true` | Rubrica anti-soggettivita' (Nielsen + UI + flusso); agenti ux-ui-reviewer + ui-designer attivi |
| Design Intelligence Layer | EP-019 (v2.21) | `design_intelligence.enabled: true` | Art-director DSL + Critic/Judge 6 principi visivi + Intention Economy |
| FE Functional Oracle | EP-018 (v2.20) | `fe_correctness.functional_oracle.enabled: true` | Esercita il flusso reale (carica ROM → avvia → asserzioni); verdict deterministico |
| Prototype Generation Layer | EP-035 (v2.26) | `prototyping.enabled: true` | Cascata figma→penpot→react→html attiva per mockup iterativi |
| Compression Output (Caveman) | EP-014 (v2.14) | `compression.output.enabled: true` | Policy conservative; riduce overhead messaggi agent-to-agent |
| Compression Context (Graphify) | EP-014 (v2.14) | `compression.context.enabled: true` | Knowledge graph di `packages/app` come context replacement, confidence-gated |
| Task Analytics + Dogfooding | EP-009/013 (v2.19) | `analytics.measurement.enabled: true` + `analytics.dogfooding.enabled: true` | Misura costo reale agenti; harvest token su SessionEnd |
| Token Ledger | EP-022 (v2.21) | `analytics.token_ledger.enabled: true` | Display token reali inline dopo ogni operazione |
| Kanban Publish (GitHub) | EP-010 (v2.10) | `kanban_publish.provider: github` | Mirror push-only su `soli92/soli-boy` GH Issues/Milestones |

## Esenzioni dalla sunset policy

I seguenti layer sono attualmente off in soli-boy ma mantenuti nel config per uno
dei seguenti motivi — non sono candidati immediati alla rimozione del blocco:

- **VCS Branch Awareness** (`branch_awareness.enabled: false`): il blocco e' documentato
  come "layer degenere su monorepo single-HEAD" (PATTERN §15). Rimozione non richiede
  TSK dedicato; il blocco e' piccolo e non introduce overhead.
- **Tavola Rotonda** (`tavola_rotonda.enabled: false`): il blocco config definisce
  anche i parametri strutturali (max_round, critico, budget) che potrebbero servire
  se il progetto crescesse. Candidato a rimozione se il progetto rimane single-dev.
- **Content Share** (`content_share.enabled: false`): potrebbe essere attivato in
  futuro per pubblicare prototipi su soli-frames. Mantenere il blocco.

I layer **non scaffolded** (Voice Channel / Voice Handsfree / Voice Hardening) non
hanno un blocco config da rimuovere: sono semplicemente assenti perche' non applicabili
a un progetto non-voice. Nessuna azione necessaria.
