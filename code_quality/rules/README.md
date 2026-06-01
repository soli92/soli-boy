# Code Quality Rules — KB evolutiva (CQRL v2.12, PATTERN §19.5)

Knowledge base filesystem-based delle regole di qualità consumate dal `code-reviewer`.
Side-channel (non un layer del cascade L1→L5), analogo a `memory/`.

## Tassonomia tier

- `canonical/` — regole universali per lo stack (idiomaticità, design, robustezza).
  Curate a mano. Da popolare per lo stack scelto **prima del primo `/review`**.
- `emergent/` — regole emerse automaticamente dai pattern ricorrenti nei report
  (loop evolutivo §19.5, gate umano per la promozione a canonical).
- `team-specific/` — convenzioni del team, curate a mano.

## Struttura file regola

Ogni regola è un file `<rule_id>.md` con frontmatter:

```markdown
---
id: <STACK>-<AREA>-<NNN>      # es. PY-DESIGN-001
tier: canonical | emergent | team-specific
stack: [python, ...]
area: idiomaticity | design | robustness
severity: critical | major | minor
status: active | deprecated
created: YYYY-MM-DD
---

# <Titolo regola>

**Regola**: <enunciato>
**Razionale**: <perché>
**Esempio (bad/good)**: ...
```

Riferimento: `PATTERN.md §19.5`.
