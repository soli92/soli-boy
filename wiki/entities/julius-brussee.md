---
id: julius-brussee
type: entity
kind: person
title: "Julius Brussee"
status: draft
created: 2026-05-28
updated: 2026-05-28
sources: ["raw/caveman_deep_dive.md"]
aliases: ["JuliusBrussee", "Julius"]
related:
  - caveman
  - token-compression
tags: [persona, sviluppatore, open-source, llm, tool]
---

# Julius Brussee

Sviluppatore open-source, autore dell'ecosistema [[caveman]] — skill di compressione linguistica per agenti AI. Licenza MIT, progetto rilasciato e diventato virale tra marzo e aprile 2026. [^src: raw/caveman_deep_dive.md §Cos'è Caveman]

## Progetti principali

| Progetto | Tipo | Note |
|---|---|---|
| `caveman` (skill) | Skill cross-agent | Compressione output agenti, tre livelli lite/full/ultra |
| `caveman-code` | Terminal coding agent | ~2× meno token di Codex; 20+ provider; plan mode + autopilot |
| `cavekit` | Plugin Claude Code | Workflow spec-driven: spec → blueprint → build parallelo → validazione + peer review cross-model |
| `cavegemma` | LoRA fine-tune | Gemma 4 31B fine-tuned su alignment pair baseline↔caveman; `JBrussee/gemma-4-31B-caveman` su HuggingFace |
| Memory layer | MCP server locale | SQLite + FTS5 per osservazioni cross-sessione compresse; cross-tool Claude Code/Cursor/Codex |

[^src: raw/caveman_deep_dive.md §La famiglia di prodotti Caveman]

## Stats (maggio 2026)

- 65.7k GitHub stars su `caveman` principale
- 3.7k fork
- ~30 agent supportati nativamente dall'installer
- 457+ issue aperti (segnale di debito tecnico, single-maintainer)

[^src: raw/caveman_deep_dive.md §Pro] [^src: raw/caveman_deep_dive.md §Contro]

## Rischio progetto

Single-maintainer project con alta adozione. La velocità di evoluzione potrebbe rallentare o frammentare in fork. [^src: raw/caveman_deep_dive.md §Contro]
