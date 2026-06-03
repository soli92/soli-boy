# /visual-oracle

> **Adapter Cursor** del comando `/visual-oracle`. Invoca il visual oracle su un TSK FE: render headless + screenshot multi-viewport/tema + critica visiva → verdict pass | conditional | reject. Funziona indipendentemente da fe_correctness.enabled (esecuzione esplicita = volontà esplicita).
> Invocazione: `/visual-oracle <TSK-id> [--dry-run]` (Cursor custom command).

# /visual-oracle — Verifica visiva di un TSK FE (PATTERN §3, v2.17)

Argomenti utente: `$ARGUMENTS`

Sintassi:

```
/visual-oracle <TSK-id>            → visual oracle standard (aggiorna visual_status nel frontmatter TSK)
/visual-oracle <TSK-id> --dry-run  → esegue la skill ma NON aggiorna il frontmatter (solo logging)
```

## Comportamento

1. **Risoluzione TSK** — cerca `management/kanban/**/TSK-<id>.md`: 0 o >1 match → ABORT. Estrai `layer:`.
2. **Fail-loud su layer** — `layer ≠ fe` → ABORT «Visual oracle applicabile solo a TSK FE».
3. **Invoca la skill** [visual-oracle-protocol](mdc:.cursor/rules/skills/visual-oracle-protocol.mdc)
   sul TSK target (5 fasi). È il single-writer di `visual_status:`.
4. **Aggiornamento frontmatter** — la skill scrive `visual_status:` + `updated:` (salvo `--dry-run`).
5. **Output chat**:

```
VISUAL ORACLE — <TSK-id> (iter <N>)
verdict:        pass | conditional | reject
defects_count:  <N>
report_path:    code_quality/reports/<TSK-id>-visual-iter-<N>.md
```

## Indipendenza da `fe_correctness.enabled`

L'invocazione esplicita bypassa il master switch (analogia con `/review`). Utile come gate
manuale o re-check su regressione anche a flag spento.

## Prerequisiti (fail-loud)

- Skill `visual-oracle-protocol` presente; browser headless (Playwright/Chromium); TSK `layer: fe`.

## Vincoli

- **Single-writer**: solo `visual-oracle-protocol` scrive `visual_status:`.
- Mai modificare il corpo del TSK; mai bypassare `fe_correctness.max_iterations`; `--dry-run`
  side-effect-free sul frontmatter.

Vedi [visual-oracle-protocol](mdc:.cursor/rules/skills/visual-oracle-protocol.mdc) per la procedura completa.
