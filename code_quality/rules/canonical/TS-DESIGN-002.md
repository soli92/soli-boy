---
id: TS-DESIGN-002
tier: canonical
status: active
applies_to: { language: typescript, framework: any, context: [design, performance] }
severity_default: medium
auto_fixable: false
created: 2026-06-01
---
# TS-DESIGN-002 — Sfruttare gli index/strutture previste invece di full-scan in memoria
**Regola:** quando lo schema dati definisce un index per un campo di filtro, usarlo invece di caricare tutto e filtrare in memoria.
**Rationale:** evita degrado al crescere dei dati e onora il design dello storage.
