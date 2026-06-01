---
id: GHA-DESIGN-002
tier: canonical
status: active
applies_to: { language: yaml, context: [design], platform: github-actions }
severity_default: minor
auto_fixable: false
created: 2026-06-01
source_tsk: TSK-049
promoted_from: ""
---
# GHA-DESIGN-002 — Dichiarare `permissions:` espliciti nei workflow GitHub Actions

**Regola:** i workflow GitHub Actions devono dichiarare esplicitamente un blocco
`permissions:` con i privilegi minimi necessari. Per workflow CI read-only (nessun deploy,
nessuna scrittura di release) e' sufficiente `permissions: contents: read`.

**Rationale:** i permessi di default del `GITHUB_TOKEN` variano in base alle impostazioni
dell'organizzazione/repo. Un workflow senza `permissions:` esplicito eredita i default del
contesto di esecuzione, che possono cambiare su modifica delle impostazioni org. Dichiarare
i permessi minimi e' defense-in-depth: riduce il blast radius di una action compromessa o
di una dependency supply-chain injection.

**Esempio (bad):**
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
# nessun permissions — eredita default org/repo
jobs:
  ci:
    runs-on: ubuntu-latest
    steps: [...]
```

**Esempio (good — CI read-only):**
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  ci:
    runs-on: ubuntu-latest
    steps: [...]
```

**Note:** se il workflow necessita di scrivere commenti su PR o pubblicare check results,
aggiungere `pull-requests: write` o `checks: write` a livello di job, non globale,
seguendo il principio del minimo privilegio.

**Provenienza:** emersa in review di TSK-049 (workflow CI GitHub Actions, EP-011).
Gate umano richiesto per promozione a canonical (PATTERN §19.5).
