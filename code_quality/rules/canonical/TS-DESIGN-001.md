---
id: TS-DESIGN-001
tier: canonical
status: active
applies_to: { language: typescript, framework: any, context: [design, architecture] }
severity_default: low
auto_fixable: false
created: 2026-06-01
---
# TS-DESIGN-001 — Niente codice test-only esportato da moduli di produzione
**Regola:** hook/helper a uso esclusivo dei test (es. reset di stato) non vanno esportati dal modulo di produzione; isolarli o documentarli esplicitamente.
**Rationale:** riduce la superficie pubblica e l'uso improprio in produzione.
