---
id: graphify
type: entity
kind: product
title: "Graphify"
status: draft
created: 2026-05-28
updated: 2026-05-28
sources: ["raw/graphify_deep_dive.md"]
aliases: ["graphify-ts", "safishamsi/graphify", "Howell5/graphify-ts"]
related:
  - andrej-karpathy
  - knowledge-graph-codebase
  - token-compression
  - factory-compression-layer
tags: [prodotto, knowledge-graph, codebase, open-source, MIT, mcp, tree-sitter]
---

# Graphify

Skill open-source (MIT) che trasforma una cartella — codice, schemi SQL, documenti, paper, immagini, video — in un **knowledge graph queryabile** per AI assistant. Rilasciata il 3 aprile 2026. Ispirata direttamente da una richiesta pubblica di [[andrej-karpathy]] di tool per "LLM knowledge graphs". [^src: raw/graphify_deep_dive.md §Cos'è Graphify]

## Due varianti canoniche

| Variante | Linguaggio | Linguaggi codice | Storage |
|---|---|---|---|
| `safishamsi/graphify` | Python (`pip install graphifyy`) | 20 | JSON + Neo4j export |
| `Howell5/graphify-ts` | TypeScript (`npm i -g graphify-ts`) | 12 (tree-sitter WASM) | JSON |

**Nota critica PyPI**: il pacchetto ufficiale è `graphifyy` (doppia y). Altri pacchetti `graphify*` su PyPI non sono affiliati. [^src: raw/graphify_deep_dive.md §Cos'è Graphify]

## Architettura a tre passi

### Pass 1 — AST Extraction (deterministica, zero token)

Tree-sitter parsa i sorgenti e estrae classi, funzioni, metodi (nodi) + import, chiamate, ereditarietà (archi) + docstring rationale (`# NOTE:`, `# WHY:`, `# HACK:`). **Nessun byte di codice lascia la macchina.** [^src: raw/graphify_deep_dive.md §Architettura — la pipeline a tre passi]

### Pass 2 — Semantic Extraction (LLM-driven)

Per file non-code (markdown, PDF, immagini, video): estrazione via LLM con confidence score su ogni elemento. Audio/video: trascritti localmente via `faster-whisper`. [^src: raw/graphify_deep_dive.md §Architettura — la pipeline a tre passi]

### Pass 3 — Fusion + Clustering

Nodi (file, funzioni, classi, concetti) + archi taggati `EXTRACTED` / `INFERRED` / `AMBIGUOUS` + community detection (Louvain/Leiden) per clustering logico. [^src: raw/graphify_deep_dive.md §Architettura — la pipeline a tre passi]

## Output principali

- **`graph.json`** — grafo machine-readable con nodi, archi, metadata
- **`GRAPH_REPORT.md`** — god nodes, surprising connections, confidence tags, suggested questions; da passare all'AI **al posto** dei file sorgente
- **`graph.html`** — visualizzazione interattiva browser
- **Wiki markdown** (flag `--wiki`) — `graphify-out/wiki/` con articolo per ogni community e god node

[^src: raw/graphify_deep_dive.md §Output e artefatti]

## Benchmark dichiarati vs realtà

| Metrica | Dichiarato | Realtà |
|---|---|---|
| Riduzione token per query | 71.5× | Plausibile su codebase grandi |
| Primo build (1000 file misto) | — | 2–5 $ di token |
| Update incrementale (1000 file) | — | 0.4s, gratis (solo AST) |
| ROI break-even | — | 3–5 sessioni intensive |

[^src: raw/graphify_deep_dive.md §Numeri dichiarati e benchmark]

## Strategia di update

| Modalità | Costo | Quando |
|---|---|---|
| `graphify update .` (incremental SHA256) | Zero token | File modificati daily |
| `graphify update . --force` (full rebuild) | Costoso | Post-refactor maggiori |
| Git hooks (`post-commit`, `post-checkout`) | Zero token (AST only) | Automatico per-commit |
| SessionStart hook (Claude Code) | Zero token | Automatico per-sessione |

[^src: raw/graphify_deep_dive.md §Strategia di update]

## Integrazione MCP

Esposto come MCP server condiviso tra tutti gli agent; code-review-graph (CRG) espone ~25 tool riducibili a ~8 via `CRG_TOOLS`. Tool chiave: `get_impact_radius` per blast radius analysis prima di modifiche. [^src: raw/graphify_deep_dive.md §Integrazione MCP]

## Export Neo4j

```bash
graphify ./src --neo4j-push bolt://localhost:7687
```

Permette query Cypher arbitrarie da agent su Neo4j condiviso. [^src: raw/graphify_deep_dive.md §Export Neo4j]

## Rischi principali

- **Costo primo build** — su repo grandi con docs: 5–20 $ di token
- **Drift asincrono** — nodi concept (semantica) rimangono vecchi mentre nodi code (AST) si aggiornano ad ogni commit; richiede scheduler manuale di re-extract periodici
- **INFERRED edges** — utili per esplorazione, pericolosi per azioni; filtrare solo `EXTRACTED` per operazioni su codice
- **Ghost duplicates** — nodi duplicati quando AST e estrazione semantica disagree sull'ID; richiede full re-extract
- **Privacy parziale** — codice locale, ma docs/immagini vanno all'API; per docs sensibili usare `.gitignore`-style patterns o variante Ollama (problematica VRAM)

[^src: raw/graphify_deep_dive.md §Contro]

## Casi d'uso ottimi vs da evitare

| Ottimo | Da evitare |
|---|---|
| Codebase medie-grandi (>10k LOC) | Microrepo (<20 file) |
| Sessioni prolungate stesso repo | Codebase throwaway |
| Multi-agent con modello mentale condiviso | Linguaggi non supportati |
| Legacy/onboarding/refactor | Workflow real-time sub-secondo |
| Research codebase con paper/immagini eterogenei | Docs sensibili non sanitizzabili |

[^src: raw/graphify_deep_dive.md §Quando usarlo]
