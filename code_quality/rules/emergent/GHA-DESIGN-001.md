---
id: GHA-DESIGN-001
tier: emergent
status: candidate
applies_to: { language: yaml, context: [design, robustness], platform: github-actions }
severity_default: minor
auto_fixable: false
created: 2026-06-01
source_tsk: TSK-049
promoted_from: ""
---
# GHA-DESIGN-001 — Dichiarare `concurrency` group nei workflow GitHub Actions

**Regola:** i workflow GitHub Actions che si attivano su `push` e `pull_request` devono
dichiarare un blocco `concurrency:` con `cancel-in-progress: true` (almeno per le PR)
per evitare che sequenze rapide di commit creino code di run obsoleti che consumano
runner-minutes inutilmente.

**Rationale:** senza `concurrency`, ogni push crea una run indipendente. Su una PR con
force-push o rebase frequente si accumulano run parallele tutte invalide tranne l'ultima.
Il costo e' doppio: runner-minutes sprecati e feedback latente (la run corretta e' in coda).

**Esempio (bad):**
```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
# nessun blocco concurrency
jobs:
  ci:
    runs-on: ubuntu-latest
    steps: [...]
```

**Esempio (good):**
```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  ci:
    runs-on: ubuntu-latest
    steps: [...]
```

**Note:** `cancel-in-progress: ${{ github.event_name == 'pull_request' }}` cancella le run
obsolete sulle PR ma non interrompe le run su `push main` (che spesso alimentano deployment
o status check post-merge che non si vogliono cancellare).

**Provenienza:** emersa in review di TSK-049 (workflow CI GitHub Actions, EP-011).
Gate umano richiesto per promozione a canonical (PATTERN §19.5).
