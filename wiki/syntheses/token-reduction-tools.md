---
id: token-reduction-tools
type: synthesis
title: "Caveman e Graphify: riduzione token in stack multi-agent"
status: draft
created: 2026-05-28
updated: 2026-05-28
sources:
  - "raw/caveman_deep_dive.md"
  - "raw/graphify_deep_dive.md"
related:
  - token-compression
  - knowledge-graph-codebase
  - caveman
  - graphify
  - julius-brussee
  - andrej-karpathy
  - parallel-scheduler
  - orchestrator-workers
question: "Come posso ridurre il consumo di token in una factory multi-agent, e quando ha senso usare Caveman vs Graphify vs entrambi?"
tags: [synthesis, token-reduction, multi-agent, ottimizzazione, caveman, graphify]
---

# Caveman e Graphify: riduzione token in stack multi-agent

Sintesi comparativa di due tool open-source complementari per la riduzione del consumo di token in sistemi agentici: [[caveman]] (compressione output) e [[graphify]] (compressione contesto input). Entrambi MIT, entrambi diventati virali nel 2026, progettati per stack con AI coding assistant.

## Il problema

I modelli LLM sono ottimizzati per parlare con umani. In workflow agent-to-agent o agent-to-tool, gran parte del fraseggio non contribuisce alle decisioni. Allo stesso tempo, dare a un agente tutti i file sorgente di una codebase come contesto è proibitivamente costoso su repo medio-grandi. [^src: raw/caveman_deep_dive.md §Cos'è Caveman] [^src: raw/graphify_deep_dive.md §Cos'è Graphify]

## Confronto asse per asse

| Dimensione | [[caveman]] | [[graphify]] |
|---|---|---|
| Asse di ottimizzazione | Output (token generati) | Input (token di contesto) |
| Meccanismo | Grammatica stilistica via prompt skill | Knowledge graph da AST + LLM semantica |
| Risparmio tipico | 50–70% output; picchi 80–90% | Fino a 71.5× per query su codebase grandi |
| Costo di setup | Zero (skill markdown) | Primo build 2–20 $ di token |
| Costo operativo | Zero (prompt skill attivo) | Update incrementali gratis; full rebuild costoso |
| Privacy codice | N/A (agisce sull'output) | Codice locale (tree-sitter); docs via API |
| Infrastruttura | Nessuna | `graphify-out/` su filesystem; opzionale MCP server |
| Licenza | MIT | MIT |
| Autore | [[julius-brussee]] | Community (safishamsi, Howell5) |
| GitHub stars (maggio 2026) | ~65.7k | ~54.5k |
| Rischio progetto | Single-maintainer, 457+ issue aperti | Doppia implementazione, API giovane |

[^src: raw/caveman_deep_dive.md §Numeri reali] [^src: raw/graphify_deep_dive.md §Numeri dichiarati e benchmark]

## Quando usare quale

### Solo Caveman

- Hai un codebase piccolo (<10k LOC) o cambia spesso (overhead Graphify non giustificato)
- Il bottleneck è la verbosità degli output degli agenti (status update, handoff, log)
- Workflow batch dove nessuno legge gli output direttamente
- Budget zero per setup aggiuntivo

### Solo Graphify

- Hai un codebase grande (>10k LOC) con sessioni prolungate
- Il bottleneck è il costo del contesto passato agli agenti (file sorgente raw nel prompt)
- Lavori su codebase legacy dove l'orientamento iniziale è costoso
- Hai bisogno di blast radius analysis prima delle modifiche

### Entrambi (stack ottimale)

- Factory multi-agent con pipeline lunga (orchestratore + sub-agent multipli)
- Sessioni intensive su codebase medie-grandi
- Vuoi ridurre il costo sia dell'input (Graphify) sia dell'output (Caveman)

La composizione è naturale e esplicitamente citata in entrambi i deep dive: "Graphify + Caveman framework". [^src: raw/caveman_deep_dive.md §Pro] [^src: raw/graphify_deep_dive.md §Pro]

## Architettura di integrazione consigliata

```
Contesto in entrata all'orchestratore:
  GRAPH_REPORT.md  ←── Graphify (riduce da file raw a god nodes + relazioni)

Comunicazioni interne:
  Orchestratore → Sub-agent:  caveman full
  Sub-agent → Tool:           caveman ultra
  Tool result → Orchestratore: caveman lite

Output verso utente:
  normal mode (no caveman)
```

[^src: raw/caveman_deep_dive.md §Integrazione in framework multi-agentici] [^src: raw/graphify_deep_dive.md §Integrazione in framework multi-agentici]

## Interazione con il parallel-scheduler della factory

Con il [[parallel-scheduler]] attivo (v2.11), le wave dispatch moltiplicano i token consumati per sessione (N agenti in parallelo × costo singolo agente). La token compression diventa moltiplicativamente più efficace:

- Caveman applicato a tutti i canali agent-to-agent riduce il costo di ogni agente nella wave
- Graphify come MCP server condiviso evita che ogni sub-agent rilegga i file sorgente indipendentemente

L'effetto è cumulativo: in una wave di 4 agenti, risparmio del 60% per agente = risparmio del 60% sulla wave intera. [^src: raw/caveman_deep_dive.md §Pro]

## Rischi da monitorare

### Drift cumulativo Caveman

Su chain agentiche lunghe, la compressione ellittica di Caveman può introdurre ambiguità interpretative che si cumulano. Mitigation: keep audit trail in normal mode per le decisioni finali; allow-list rigorosa per task dove la disambiguazione è critica. [^src: raw/caveman_deep_dive.md §Contro]

### Drift asincrono Graphify

I nodi concept (estratti via LLM) rimangono alla versione del last full rebuild mentre i nodi code (AST) si aggiornano ad ogni commit. Mitigation: cron settimanale per full rebuild dei semantici; monitorare il delta tra date di aggiornamento AST vs semantica. [^src: raw/graphify_deep_dive.md §Contro]

### Non usare Graphify su codebase piccole

Overhead non giustificato su repo <20 file o prototipi. Il threshold pratico è ~10k LOC / 50+ file con sessioni multiple. [^src: raw/graphify_deep_dive.md §Quando usarlo]

## Pagine correlate

- [[token-compression]] — framework concettuale sui due assi
- [[knowledge-graph-codebase]] — meccanismo e proprietà del grafo
- [[caveman]] — entity product con dettagli installazione + policy
- [[graphify]] — entity product con dettagli architettura + MCP
- [[julius-brussee]] — autore Caveman
- [[andrej-karpathy]] — ispirazione Graphify
- [[parallel-scheduler]] — interazione con wave dispatch
- [[orchestrator-workers]] — pattern dove questi tool sono più efficaci
- [[factory-compression-layer]] — design doc di integrazione Caveman + Graphify nella factory (Fase 0, draft)
