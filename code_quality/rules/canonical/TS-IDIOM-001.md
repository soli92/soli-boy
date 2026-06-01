---
id: TS-IDIOM-001
tier: canonical
status: active
applies_to: { language: typescript, framework: any, context: [idiomaticity, style] }
severity_default: low
auto_fixable: true
created: 2026-06-01
---
# TS-IDIOM-001 — Usare `import type` per import di soli tipi
**Regola:** gli import usati solo come tipi devono usare `import type` (o `type` inline), per chiarezza ed eliminazione a build-time.
**Rationale:** evita import runtime inutili e cicli; idiomatico in TS moderno.
