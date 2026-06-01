---
id: QA-TEST-001
tier: canonical
status: active
applies_to: { language: typescript, framework: any, context: [robustness] }
severity_default: medium
auto_fixable: false
created: 2026-06-01
---
# QA-TEST-001 — La logica non banale deve avere test
**Regola:** funzioni con branching/logica non banale devono avere copertura di test unitari.
**Rationale:** regressioni intercettate; segnalare al qa-dev se il test manca.
