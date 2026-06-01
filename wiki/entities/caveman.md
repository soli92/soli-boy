---
id: caveman
type: entity
kind: product
title: "Caveman"
status: draft
created: 2026-05-28
updated: 2026-05-28
sources: ["raw/caveman_deep_dive.md"]
aliases: ["caveman-skill", "caveman-compression"]
related:
  - julius-brussee
  - token-compression
  - knowledge-graph-codebase
  - factory-compression-layer
tags: [prodotto, skill, token-compression, multi-agent, open-source, MIT]
---

# Caveman

Skill open-source (MIT) di **compressione linguistica** per agenti AI da codice. Autore: [[julius-brussee]]. Diventata virale tra marzo e aprile 2026. Agisce sull'output degli agenti, applicando una grammatica di compressione che mantiene la sostanza tecnica e taglia il fraseggio destinato agli umani. [^src: raw/caveman_deep_dive.md §Cos'è Caveman]

## Logica di funzionamento

Caveman **non è un modello**: è un set di regole stilistiche encoded in un prompt skill. Le quattro operazioni grammaticali: [^src: raw/caveman_deep_dive.md §Architettura interna]

1. **Rimozione funzioni grammaticali** — articoli, verbi essere, preposizioni deducibili dal contesto
2. **Eliminazione padding sociale** — hedging, cortesia, preamboli, postamboli
3. **Abbreviazioni convenzionali** — `fn`, `ret`, `→`, simboli quantificatori
4. **Strutturazione tabellare/list** — prosa non informativa → pipe table o lista minimale

**Tre livelli di intensità**: `lite` / `full` / `ultra` (progressivamente aggressivi).

## Installazione

```bash
# Cross-platform (macOS/Linux/WSL)
curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash

# Solo un agent specifico
curl -fsSL ... | bash -s -- --only openclaw

# Via skill manager
npx skills add JuliusBrussee/caveman
```

Prerequisito: Node ≥18. Installer auto-rileva ~30 agent. [^src: raw/caveman_deep_dive.md §Installazione e setup]

## Benchmark (claim ufficiali vs stima realistica)

| Scenario | Claim ufficiale | Stima realistica |
|---|---|---|
| Range generale | 65–87% risparmio output | 50–70% mediamente |
| Risposte conversazionali | fino a 87% latenza | 80–90% picchi |
| Output densi (codice/diff) | non specificato | 10–30% |
| Velocità risposta | 2.4× faster | confermato (token∝latenza) |

[^src: raw/caveman_deep_dive.md §Numeri reali]

## Casi d'uso ottimi vs da evitare

| Ottimo | Da evitare |
|---|---|
| Comunicazione agent-to-agent | Documentation generation deliverable |
| Tool result post-processing | Output customer-facing |
| Status update, log strutturati | Code review commenti per sviluppatori |
| Sub-agent dispatch | Audit trail normativo |
| Debugging interattivo con esperto | Pair-programming con utente non tecnico |

[^src: raw/caveman_deep_dive.md §Quando usarlo]

## Pattern di integrazione in factory multi-agent

**Layered application**: livelli di intensità differenziati per canale (orchestratore↔utente: off; orchestratore↔sub-agent: full; sub-agent↔tool: ultra). [^src: raw/caveman_deep_dive.md §Integrazione in framework multi-agentici]

**Allow-list per task type**: policy `CAVEMAN_POLICY` come mappa `task_type → caveman_level`, ad esempio `agent_handoff: "ultra"`, `documentation: "off"`. [^src: raw/caveman_deep_dive.md §Integrazione in framework multi-agentici]

## Rischi principali

- **Drift cumulativo** su chain lunghe: compressione riduce disambiguazione, sub-agent downstream possono interpretare diversamente output ellittici
- **Non comprime input**: agisce solo sull'output; su task input-heavy (large context windows) il guadagno è marginale — per quello serve [[knowledge-graph-codebase]] (Graphify/LSP)
- **Coupling implicito** sul modello: progettato per fraseggio Claude/GPT; modelli diversamente fine-tunati possono produrre output ambigui

[^src: raw/caveman_deep_dive.md §Contro]

## Componenti dell'ecosistema

Vedi [[julius-brussee]] per la tabella completa dell'ecosistema (caveman-code, cavekit, cavegemma, memory layer).
