---
id: REACT-IDIOM-001
tier: canonical
status: active
applies_to: { language: typescript, framework: react, framework_version_min: "18", context: [idiomaticity, design] }
severity_default: low
auto_fixable: false
created: 2026-06-01
---
# REACT-IDIOM-001 — Componenti funzionali con props tipizzate, render puro
**Regola:** componenti funzionali con interfaccia props tipizzata; nessun side-effect nel corpo del render.
**Rationale:** idiomatico in React 18; render prevedibile e testabile.
