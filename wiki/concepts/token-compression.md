---
id: token-compression
type: concept
title: "Token Compression"
status: draft
created: 2026-05-28
updated: 2026-05-28
sources:
  - "raw/caveman_deep_dive.md"
  - "raw/graphify_deep_dive.md"
related:
  - caveman
  - knowledge-graph-codebase
  - parallel-scheduler
tags: [concetto, token, ottimizzazione, llm, multi-agent, efficienza]
---

# Token Compression

Famiglia di tecniche per ridurre il numero di token consumati (in input o in output) da un LLM, senza perdere l'informazione tecnica necessaria all'esecuzione del task. Rilevante sia per ridurre costi (billing API) sia per ridurre latenza (generazione lineare rispetto ai token). [^src: raw/caveman_deep_dive.md §Cos'è Caveman]

## Due assi ortogonali

### Compressione dell'output

Agisce sui token **generati** dall'agente. L'approccio canonico è [[caveman]]: grammatica stilistica che elimina fraseggio non informativo (padding sociale, articoli, preposizioni deducibili) mantenendo la sostanza tecnica.

- Risparmio tipico: 50–70% output mediamente; picchi 80–90% su risposte conversazionali
- Costo di setup: zero infrastruttura (è un prompt skill)
- Limite: non riduce il costo del contesto in input

[^src: raw/caveman_deep_dive.md §Numeri reali]

### Compressione dell'input (contesto)

Agisce sui token **passati come contesto** all'agente. L'approccio canonico è [[knowledge-graph-codebase]] ([[graphify]]): invece dei file sorgente raw, l'agente riceve un knowledge graph pre-estratto (`GRAPH_REPORT.md`) con god nodes, relazioni e confidence tags.

- Risparmio tipico: fino a 71.5× su query (claim ufficiale); realismo: ordini di grandezza su codebase grandi
- Costo di setup: primo build 2–20 $ di token; update incrementali praticamente gratis
- Limite: costo iniziale non giustificato su microrepo o codebase throwaway

[^src: raw/graphify_deep_dive.md §Numeri dichiarati e benchmark]

## Composabilità

I due assi sono **ortogonali e componibili**: una factory multi-agent può applicare:

1. [[knowledge-graph-codebase]] per ridurre il contesto dato agli agenti
2. [[caveman]] per ridurre l'output prodotto dagli agenti
3. RAG / LSP per retrieval selettivo come terzo layer

Questa composizione è citata esplicitamente nei deep dive come "Graphify + Caveman framework" per stack multi-agent. [^src: raw/caveman_deep_dive.md §Pro] [^src: raw/graphify_deep_dive.md §Pro]

## Rilevanza per la factory

Nella `soli-multi-agents-factory` la token compression è rilevante in due contesti:

- **[[parallel-scheduler]]**: wave dispatch parallelo moltiplicano i token consumati per sessione; compressione output via caveman sulle comunicazioni agent-to-agent può abbassare il costo complessivo del wave
- **Context management**: agent come `wiki-keeper` e `wiki-query` operano su un corpus crescente di pagine wiki; passare un `GRAPH_REPORT.md` del corpus invece dei file raw è il pattern Graphify applicato alla knowledge base

Il design di integrazione concreto è in [[factory-compression-layer]] (Fase 0, draft).

## Anti-pattern

- Applicare [[caveman]] always-on senza allow-list: rompe doc generation, code review commenti, output customer-facing
- Applicare [[graphify]] su codebase piccole (<20 file): overhead non giustificato
- Assumere "100% accuratezza tecnica" dichiarata da Caveman: drift cumulativo su chain lunghe è documentato; su agent-to-agent il rischio di ambiguità va monitorato

[^src: raw/caveman_deep_dive.md §Contro]
