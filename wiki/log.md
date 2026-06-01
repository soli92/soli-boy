---
id: log
type: log
title: Wiki Log
status: draft
created: 2026-06-01
updated: 2026-06-01
sources: []
tags: [audit]
---

# Wiki Log

Audit trail append-only. Una riga per operazione canonica (ingest, query salvata
come synthesis, lint report, plan/design/execute run, promote). Formato:

`YYYY-MM-DD HH:MM | <agent> | <operazione> | <target> | <note>`

## Entries

2026-06-01 | factory-bootstrap | bootstrap | soli-boy | Factory llm-wiki++ v2.15 scaffoldata (topology full-stack-agents, adapters claude+cursor, compression OCL+CCL ON, CQRL ON, scheduler ON, vcs github).

## [2026-06-01] ingest | Soli-boy_Specifiche_Funzionali.docx
Pagine create: 15 | Figure: 0 | Aggiornamenti: 1 (index.md) | Gap nuovi: 0 | Gap chiusi: 0

## [2026-06-01] ingest | Soli-boy_Integrazione_Mobile.docx
Pagine create: 7 | Figure: 0 | Aggiornamenti: 3 (distribuzione-web-e-desktop, requisiti-funzionali, index.md) | Gap nuovi: 0 | Gap chiusi: 0

[2026-06-01 13:00] plan — EP-001 created (6 stories) — files touched: 7
[2026-06-01 13:00] plan — EP-002 created (3 stories) — files touched: 4
[2026-06-01 13:00] plan — EP-003 created (6 stories) — files touched: 7
[2026-06-01 13:00] plan — EP-004 created (4 stories) — files touched: 5
[2026-06-01 13:00] plan — EP-005 created (3 stories) — files touched: 4
[2026-06-01 13:00] plan — EP-006 created (3 stories) — files touched: 4
[2026-06-01 13:00] plan — EP-007 created (7 stories) — files touched: 8
[2026-06-01 13:00] plan — EP-008 created (3 stories) — files touched: 4
[2026-06-01 14:00] design — Core web MVP (BE/FE/DB/API EP-001+EP-003) + ADR-001/002/003 — files touched: 9

## [2026-06-01] ingest | soliboy-mockups (UI SoliDS, 18 schermate)
Pagine create: 6 | Figure: 0 | Aggiornamenti: 2 (solids, index.md) | Gap nuovi: 0 | Gap chiusi: 0

[2026-06-01 15:00] execute — sprint 1 (11 task) + sprint 2 lookahead (8 task) per EP-001+EP-003 — files touched: 20

## 2026-06-01 16:00 — publish github (created=8, updated=0)
**Operatore:** github-publisher
**Provider:** github @ soli92/soli-boy
**Operazioni:**
- CREATE (milestone): EP-001..EP-008 → github:milestone-2..9
- SKIP (scope): US×35, TSK×19 (publish limitato alle epiche su richiesta)
**Link al provider:** https://github.com/soli92/soli-boy/milestones
