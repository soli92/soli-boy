# /token-ledger

> **Adapter Cursor** del comando `/token-ledger` (EP-022, v2.21).
> Invocazione: `/token-ledger [--full] [--transcript <path>]`

Mostra token reali + costo stimato della sessione corrente (display-only, non scrive
nell'event store EP-013).

## Sintassi

```
/token-ledger [--full] [--transcript <path>]
```

## Flag

- `--full` — box completo con breakdown input/output/cache
- `--transcript <path>` — override path JSONL (Claude Code o Cursor `AGENT_TRANSCRIPTS`)

## Invocazione

```bash
python3 "$REPO_ROOT/.claude/tools/analytics/show-session-tokens.py" $ARGS
```

Se `factory.config.yaml` → `analytics.token_ledger.enabled: false`, eseguire comunque
(query-only).

## Chiusura attività (obbligatorio se capability ON)

A **fine ogni attività completata** (TSK, wave, review, sprint task), l'agente **deve**
invocare lo script in modalità compatta e appendere l'output in coda alla risposta:

```bash
python3 .claude/tools/analytics/show-session-tokens.py 2>/dev/null || true
```

Se stdout vuoto (transcript assente, es. Cloud Agent senza JSONL) → appendere:

```
◉ TOKENS  sessione: n/d (transcript non disponibile)
```

Vedi [token-ledger-display](mdc:.cursor/rules/token-ledger-display.mdc).
