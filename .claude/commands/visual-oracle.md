---
description: Invoca il visual oracle su un TSK FE. Esegue visual-oracle-protocol (render headless + screenshot multi-viewport/tema + critica visiva) e ritorna verdict pass | conditional | reject. Funziona indipendentemente da fe_correctness.enabled (esecuzione esplicita = volontà esplicita).
argument-hint: <TSK-id> [--dry-run]
allowed-tools: Read, Write, Edit, Bash, Glob
---

Sintassi:

```
/visual-oracle <TSK-id>            → visual oracle standard (aggiorna visual_status nel frontmatter TSK)
/visual-oracle <TSK-id> --dry-run  → esegue la skill ma NON aggiorna il frontmatter (solo logging)
```

Argomenti utente: `$ARGUMENTS`

- Primo argomento: **TSK-id** (es. `TSK-042`), obbligatorio.
- Flag opzionale: `--dry-run` → esegue il protocollo ma non scrive `visual_status:` (solo
  logging in chat + report side-channel).

## Comportamento

1. **Risoluzione TSK** — `Glob management/kanban/**/TSK-<id>.md`: 0 o >1 match → ABORT
   «TSK non trovato / ambiguo». Leggi frontmatter, estrai `layer:`.
2. **Fail-loud su layer** — se `layer ≠ fe` → ABORT «Visual oracle applicabile solo a TSK FE
   (layer attuale: <X>)».
3. **Invoca la skill [`visual-oracle-protocol`](../skills/visual-oracle-protocol.md)** sul TSK
   target. Esegue le 5 fasi (Bootstrap → Render → Screenshot [+ Fase 3-bis] → Critica → Diff +
   Loop) ed è il single-writer di `visual_status:`.
4. **Aggiornamento frontmatter** — la skill scrive `visual_status:` (`pending|pass|conditional|
   reject`) + `updated:`. Con `--dry-run` il frontmatter **non** viene aggiornato.
5. **Output chat**:

```
VISUAL ORACLE — <TSK-id> (iter <N>)
===================================
verdict:        pass | conditional | reject
defects_count:  <N critic_findings>
report_path:    code_quality/reports/<TSK-id>-visual-iter-<N>.md
```

(con `--dry-run` aggiunge la nota «dry-run: frontmatter NON aggiornato»). Il JSON gemello
vive in `code_quality/reports/<TSK-id>-visual-iter-<N>.json`.

## Indipendenza da `fe_correctness.enabled`

L'invocazione esplicita di `/visual-oracle` **bypassa** il master switch (esecuzione esplicita
= volontà esplicita, analogia con `/review`). Utile come gate manuale o re-check su regressione
anche a flag spento.

## Prerequisiti (fail-loud)

- Skill `visual-oracle-protocol` presente → altrimenti ABORT «Skill non scaffoldata».
- Browser headless disponibile (Playwright/Chromium) → altrimenti ABORT.
- TSK con `layer: fe` (vedi punto 2).

## Vincoli

- **Single-writer**: solo `visual-oracle-protocol` scrive `visual_status:`.
- Mai modificare il corpo del TSK (solo frontmatter `visual_status:` + `updated:`, via skill).
- Mai bypassare `fe_correctness.max_iterations`.
- `--dry-run` è sempre side-effect-free sul frontmatter.

Vedi [`visual-oracle-protocol`](../skills/visual-oracle-protocol.md) per la procedura completa.
