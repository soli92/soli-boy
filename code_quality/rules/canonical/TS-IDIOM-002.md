---
id: TS-IDIOM-002
tier: canonical
status: active
applies_to: { language: typescript, framework: any, context: [idiomaticity, robustness] }
severity_default: medium
auto_fixable: false
created: 2026-06-01
---
# TS-IDIOM-002 — Evitare `any` e non-null assertion non giustificati
**Regola:** niente `any` impliciti/espliciti né `!` (non-null assertion) senza commento che ne giustifichi la sicurezza.
**Rationale:** preserva la type-safety; le assertion nascondono potenziali null a runtime.
