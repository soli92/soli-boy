---
id: REACT-A11Y-001
tier: canonical
status: active
applies_to: { language: typescript, framework: react, framework_version_min: "18", context: [idiomaticity, robustness] }
severity_default: medium
auto_fixable: false
created: 2026-06-01
promoted_from: emergent
promoted_on: 2026-06-01
source_tsk: TSK-003
---
# REACT-A11Y-001 — Elementi con role="button" devono essere attivabili da tastiera
**Regola:** un elemento non-bottone con `role="button"` e `tabIndex={0}` deve gestire `onKeyDown` (Enter/Space) per l'attivazione, oppure usare un `<button>` nativo.
**Rationale:** senza key handler l'azione non è raggiungibile da tastiera (WCAG 2.1.1 Keyboard), in contrasto con l'accessibilità del design system solids (RNF-04).
**Esempio (bad):** `<div role="button" tabIndex={0} onClick={…}>` senza `onKeyDown`.
**Esempio (good):** aggiungere `onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' ') activate() }}` oppure usare `<button>`.
**Provenienza:** emersa in review di TSK-003 (dropzone `FileLoader`), promossa a canonical con gate umano 2026-06-01 (§19.5).
