---
id: GHA-ROBUST-001
tier: emergent
status: candidate
applies_to: { language: yaml, context: [robustness], platform: github-actions }
severity_default: minor
auto_fixable: false
created: 2026-06-01
source_tsk: TSK-049
promoted_from: ""
---
# GHA-ROBUST-001 — Dichiarare `timeout-minutes` sui job GitHub Actions

**Regola:** ogni job GitHub Actions deve dichiarare un `timeout-minutes` esplicito.
Il default di GitHub Actions e' 360 minuti (6 ore): un job bloccato (hang su Playwright,
WASM indefinito, runner zombie) consuma risorse per ore prima di essere terminato.

**Rationale:** step pesanti come install browser + test e2e con engine WASM possono bloccarsi
per race condition o hang infrastrutturali. Un timeout esplicito (15–30 minuti per workflow
typecheck+unit+e2e+build tipici) bound il failure time, libera il runner e fornisce
feedback immediato al dev invece di un'attesa silente di ore.

**Esempio (bad):**
```yaml
jobs:
  ci:
    runs-on: ubuntu-latest
    # nessun timeout — default 360 min
    steps: [...]
```

**Esempio (good):**
```yaml
jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps: [...]
```

**Linee guida dimensionamento:** checkout + setup-node + npm ci + typecheck + unit +
playwright install + e2e chromium + build tipicamente < 8 min. Un timeout di 20 min
lascia 2.5x di slack per variabilita' runner senza esporre all'hang silente.

**Provenienza:** emersa in review di TSK-049 (workflow CI GitHub Actions, EP-011).
Gate umano richiesto per promozione a canonical (PATTERN §19.5).
