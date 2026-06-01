---
id: TS-ROBUST-001
tier: canonical
status: active
applies_to: { language: typescript, framework: any, context: [robustness, reliability] }
severity_default: medium
auto_fixable: false
created: 2026-06-01
---
# TS-ROBUST-001 — Validare input ai confini e gestire gli errori asincroni
**Regola:** ai confini (I/O, file, storage) validare gli input e gestire/propagare gli errori in modo esplicito.
**Rationale:** previene stati incoerenti e fallimenti silenziosi.
