---
id: knowledge-graph-codebase
type: concept
title: "Knowledge Graph per Codebase"
status: draft
created: 2026-05-28
updated: 2026-05-28
sources:
  - "raw/graphify_deep_dive.md"
  - "raw/caveman_deep_dive.md"
related:
  - graphify
  - andrej-karpathy
  - token-compression
  - parallel-scheduler
  - orchestrator-workers
tags: [concetto, knowledge-graph, codebase, ast, llm, multi-agent, context]
---

# Knowledge Graph per Codebase

Rappresentazione strutturata di una codebase (e del materiale associato: docs, paper, immagini) come grafo di entità e relazioni, pensata per essere data come contesto a un agente AI al posto dei file sorgente raw. L'obiettivo è ridurre drasticamente il numero di token di contesto mantenendo o aumentando la qualità della navigazione. [^src: raw/graphify_deep_dive.md §Cos'è Graphify]

Origine concettuale: [[andrej-karpathy]] aveva pubblicamente richiesto un tool che facesse esattamente questo per codebase e materiale di ricerca. [[graphify]] è la prima implementazione open-source matura della sua visione. [^src: raw/graphify_deep_dive.md §Cos'è Graphify]

## Struttura del grafo

| Elemento | Tipo | Sorgente |
|---|---|---|
| File, funzioni, classi | Nodi | AST (tree-sitter, deterministica) |
| Concetti semantici | Nodi | Estrazione LLM su non-code |
| Import, chiamate, ereditarietà | Archi | AST |
| Relazioni semantiche | Archi | LLM con confidence tag |
| Community (cluster logici) | Meta-nodi | Community detection (Louvain/Leiden) |

Ogni arco porta un tag di confidenza: `EXTRACTED` (deterministico, affidabile), `INFERRED` (LLM, esplorativo), `AMBIGUOUS` (conflitto tra sorgenti). [^src: raw/graphify_deep_dive.md §Architettura — la pipeline a tre passi]

## God nodes e surprising connections

Il `GRAPH_REPORT.md` include:

- **God nodes**: concetti con alta centralità nel grafo; tutto il sistema dipende da essi — identificarli è critico per refactor e onboarding
- **Surprising connections**: link tra elementi in file/moduli distanti, ranked per inaspettatezza — rivelano accoppiamenti impliciti
- **The "why"**: commenti `# NOTE:`, `# WHY:`, `# HACK:` estratti come nodi separati linkati al codice — contesto architetturale preservato

[^src: raw/graphify_deep_dive.md §Output e artefatti]

## Proprietà chiave per sistemi multi-agent

### Determinismo parziale

La parte AST è deterministica: stesso input → stesso output. Critica per CI/CD, regression testing e confronto tra versioni del grafo. La parte semantica è LLM-driven quindi variabile. [^src: raw/graphify_deep_dive.md §Pro]

### Privacy del codice

Il codice non lascia la macchina (tree-sitter è locale). Solo docs/immagini passano per API LLM. Per docs sensibili: patterns `.gitignore`-style o variante Ollama. [^src: raw/graphify_deep_dive.md §Pro]

### Aggiornamento incrementale

Update AST a costo zero (SHA256 cache, ~0.4s/1k file). Solo full rebuild include re-estrazione semantica. Git hooks automatizzano l'update post-commit. [^src: raw/graphify_deep_dive.md §Strategia di update]

## Pattern di utilizzo in framework multi-agent

### Orchestrator query layer

L'orchestratore fa **una sola** `graph_query` per identificare i symbol rilevanti, poi passa ai sub-agent **solo i nodi rilevanti**, non i file raw. Questo è il pattern chiave per riduzione token cumulativa in sistemi [[orchestrator-workers]]. [^src: raw/graphify_deep_dive.md §Integrazione in framework multi-agentici]

### Confidence-gated dispatch

Agenti "executor" ricevono solo nodi `EXTRACTED` (per agire su codice); agenti "explorer" ricevono anche `INFERRED` (per suggerire e scoprire). Questo evita che relazioni inferite causino modifiche errate. [^src: raw/graphify_deep_dive.md §Integrazione in framework multi-agentici]

### Blast radius analysis

Prima che un agente modifichi un file, `get_impact_radius(file)` restituisce tutti i symbol dipendenti. Previene regressioni silenziose in codebase con dipendenze implicite. [^src: raw/graphify_deep_dive.md §Integrazione MCP]

## Limiti critici

- **Drift asincrono**: nodi code si aggiornano ad ogni commit (AST); nodi concept rimangono alla versione dell'ultimo full rebuild. Su domini dove concept↔code sono critici, serve uno scheduler di re-extract semantici periodici [^src: raw/graphify_deep_dive.md §Contro]
- **Ghost duplicates**: bug documentato — entità duplicate quando AST e semantica disagree sull'ID [^src: raw/graphify_deep_dive.md §Contro]
- **Clustering rumoroso su monorepo**: community detection confonde path-proximity con semantic similarity [^src: raw/graphify_deep_dive.md §Contro]
- **Non adatto a microrepo**: overhead di setup non giustificato su <20 file o codebase throwaway [^src: raw/graphify_deep_dive.md §Quando usarlo]

## Composabilità con token-compression

Vedi [[token-compression]] per la composizione con [[caveman]]: knowledge graph riduce il contesto in input, caveman riduce l'output prodotto. I due approcci sono ortogonali e si sommano.

Il design concreto di integrazione nella factory è in [[factory-compression-layer]] (Fase 0, draft): Graphify diventa il quarto adapter della famiglia [[sync-adapters]] (PDF + Figma + Repo + **Graph**), con confidence gating per ruolo agent (executor/explorer/reviewer) e side-channel storage `.graphify-state/`.
