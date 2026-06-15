---
type: episodic
created: 2026-06-15 15:30
tags: [dashboard, run, v2.21, design-intelligence, functional-oracle, token-ledger]
---

# Dashboard Completo — soli-boy v2.21 (2026-06-15)

## 1. STATE SCAN — Layer L1-L5

### L1 (raw/) — Input Multi-source
- **Total files**: 43 (2 .docx, 2 .txt, 18 mockup HTML, 12 brand SVG/PNG, tech_stack.md, manifest.json)
- **Status**: Read-only archive (no write)
- **Freshness**: Last ingest 2026-06-01 (Specifiche funzionali, Integrazione mobile, Mockup SoliDS, Brand assets)

### L2 (wiki/) — Wiki llm-style, Append-only
- **Pages**: 52 (runbooks, syntheses, sources, entities, concepts, index.md, log.md, gaps.md)
- **Last log entry**: TSK-084 done (2026-06-15, color-contrast WCAG AA fix globale)
- **Log entries since v2.18 upgrade**: 145+ (action trail: ingest, plan, execute, review, promote, /a11y, /ux-ui-review)
- **Health**: Clean, single-committer enforced (wiki-keeper)

### L3 (management/kanban/) — Kanban + TSK frontmatter
- **Epics**: 13 (EP-001..008, EP-010..012, EP-013)
- **User Stories**: 49 mapped
- **TSK**: 91 total (20 done mvp, 11 done brand+ci, 6 done ep-012 a11y/ux, 7 ep-013 design-intel done, 41 todo)
- **Sprint structure**:
  - Sprint 1 (Core MVP): 20/20 done, 19/20 review passed
  - Sprint 6 (Brand+CI): 11/11 done
  - Sprint 10 (A11y/UX remediation): 6/6 done (5 scan + fix)
  - Sprint 11 (Design Intelligence EP-019): 7/7 done (TSK-085..091)
  - Sprint 3-9 backlog: 47 todo (in sequence, parallel-safe DAG)
- **Frontmatter state**: All TSK have `status:`, `layer:`, `consumer:`, `depends_on:` populated

### L4 (design_&_architecture/) — Architecture + ADR
- **Files**: 9 (architecture-overview.md, 3 API spec, 1 db schema, 6 ADR documented)
- **ADR New (v2.21)**:
  - ADR-064 (ui-designer tool callable via callable-tool)
  - ADR-066 (Functional Oracle dominio scheduler serial same-app, ADR-067 executor fallback)
  - ADR-067 (qa-dev executor FO, fe-dev fallback, critic advisory not in verdict path)
  - ADR-068 (art-director-coordination-protocol, DSL design rationale)
  - ADR-070 (6 principi critic, intention economy rubric)
  - ADR-071 (design_intelligence.enabled requires ux_ui.enabled, fail-loud boot)
- **EP-019 Design Rationale**: `ux-design-rationale-ep019.md` (art-director statement, INTENT/PROBLEM/RATIONALE/CONSTRAINTS, Design Spec DSL, critic pass)
- **EP-019 Critic Report**: `ep019-critic-report.md` (what worked, what broke, lessons learned, verdict PASS)

### L5 (packages/app/) — Codebase
- **Monorepo type**: typescript/react/vite (full-stack-agents topology)
- **Test suite**: 279 unit test (vitest+jsdom), 8 e2e (playwright chromium)
- **Build status**: ✓ Typecheck OK, ✓ Build OK, ✓ Test suite green (279/279)
- **Code Quality Reports**: 91 reports (TSK-001..084), 0 high findings, 25 medium resolved
- **Commit history**: Main branch clean, squash-merge strategy active
- **Dependencies**: updated per CLAUDE.md (Node 24 LTS, Playwright 1.48+, axe-playwright)

---

## 2. MEMORY EPISODIC — Continuity Check

**Last episodic state**: 2026-06-03-13-00-run.md (Sprint 6 Brand+CI completion)

**Transition Sprint 6→11**:
- Sprint 6 done (2026-06-03)
- Sprint 9 done (2026-06-09): visual oracle, a11y fix, privacy/legal components, desktop storage, ci improvements
- Sprint 10 done (2026-06-09): 5 a11y+ux scan TSK, 1 color-contrast fix TSK (all done)
- Sprint 11 done (2026-06-15): EP-013 Design Intelligence (7 TSK-085..091, all done, critic report finalized)

**Episodic memory files created/updated**:
- memory/episodic/2026-06-01-*-run.md (5 files, initial sprints)
- memory/episodic/2026-06-03-13-00-run.md (Sprint 6 snapshot)
- memory/episodic/ux-ui-runs.md (adhoc design run logged 2026-06-09)
- **NEW**: memory/episodic/2026-06-15-dashboard-run.md (this file, v2.21 state snapshot)

---

## 3. DASHBOARD TABELLARE — Layer Status

| Layer | Type | Items | Status | Freshness | Health | Notes |
|-------|------|-------|--------|-----------|--------|-------|
| **L1** | Input | 43 files | Archive | 2026-06-01 | ✓ Clean | Read-only; no drift |
| **L2** | Wiki | 52 pages | Active | 2026-06-15 | ✓ Append-only | 145+ entries since v2.18 upgrade |
| **L3** | Kanban | 91 TSK | Mixed | 2026-06-15 | ✓ Synced | 37 done, 54 todo (DAG verified) |
| **L4** | Design | 9 files | Extended | 2026-06-15 | ✓ v2.21 ADR | EP-019 rationale + critic report active |
| **L5** | Code | 23 components | Green | 2026-06-15 | ✓ 279/279 test | Typecheck OK, build OK, 0 high findings |
| **Side-ch** | code_quality/ | 91 reports | Archive | 2026-06-15 | ✓ Immutable | 25 medium resolved |
| **Side-ch** | memory/ | 6 episodic | Active | 2026-06-15 | ✓ Logged | New dashboard + 1 ux-ui run logged |
| **.graphify** | Context | State cache | Synced | 2026-06-09* | ✓ Incremental | Last warm-up (not git-tracked) |

*last graphify-sync run needed — optional for next `/run`

---

## 4. CAPABILITY ANALYSIS — v2.21 Focus

### A. Design Intelligence Layer (v2.21, EP-019)
- **Status**: ✓ ACTIVE — art-director-coordination + design-rationale + critic/judge
- **Deployed TSK**: TSK-085..091 (7 task, all done)
- **Deliverables**:
  - `ux-design-rationale-ep019.md` (art-director statement, design spec DSL, critic pass)
  - `ep019-critic-report.md` (findings, lessons learned, verdict PASS)
- **Pattern efficacy**: 66% of work resolved via critic pass (audit+validation > generation); prevented 2 duplicate implementations
- **Gaps identified**: Bash permission sandboxing for sub-agent, visual-oracle not available in env
- **Next-step**: Run visual-oracle on selected FE TSK (TSK-003/006/008) to exercise oracle gate cascade

### B. Functional Oracle (v2.20, EP-018)
- **Status**: ✓ ACTIVE — qa-dev executor (fe-dev fallback), critic advisory
- **Acceptance-spec**: `code_quality/acceptance/soliboy.acceptance.yaml` (robust assert fix: Pausa button vs HUD text)
- **Re-verified**: TSK-091 (2026-06-15) — spec VALID, verdict PASS, no code changes
- **Verdict path**: Blocking assertions only (button visibility), advisory critic (frame variance)
- **Recommendation**: Run `/functional-oracle app` on next scheduled dev wave to validate e2e flow (carica→avvia→emula)

### C. Token Ledger (v2.21, EP-022)
- **Status**: ✓ CONFIGURED — enabled: true, display_mode: compact, show_cache_savings: true
- **Hook integration**: `.claude/settings.json` has Stop hook configured
- **Display format**: one-liner `◉ TOKENS in:Xk out:Xk │ sessione: ~$X`
- **Usage**: Auto-display post-response, **NOT** storing in event_store (display-only, no duplication with EP-013 harvest)
- **Next-step**: Invoke `/token-ledger --full` for detailed breakdown of this dashboard run

### D. A11y Specialist (v2.18, EP-007)
- **Status**: ✓ ACTIVE — a11y.agent: true, standard: wcag22aa
- **Dispatched TSK**: TSK-079..083 (5 scan + 1 fix, all done)
- **Manifest**: Fallback chain a11y-specialist > qa-dev > fe-dev active; a11y-specialist available in topology
- **Lint check 4o**: WCAG required_on_fe_done → 0 WARNING (21 FE TSK scanned + 6 skip motivated, all clear)
- **Next-step**: Optional /a11y scan on TSK-058 (e2e Electron, todo) when TSK-059 (device setup) completes

### E. UX/UI Review & Design (v2.18, EP-008)
- **Status**: ✓ ACTIVE — ux_ui.enabled: true, agents.reviewer: true, agents.designer: true
- **Dispatched TSK**: TSK-079..083 (review scans), adhoc /ux-ui-design run logged (2026-06-09)
- **Review spec**: Nielsen 10 euristiche + 6 dimensioni UI + 5 flusso (rubric_strict: true)
- **Design capability**: callable-tool ui-designer via ADR-064 (off-DAG, no auto-eval)
- **Lint check 4p**: WCAG required_on_fe_done → 0 WARNING (same 21 FE TSK, all clear)
- **Next-step**: `/ux-ui-review TSK-060` (TouchOverlay mobile, todo) when prerequisite TSK-059 completes; design-spec from adhoc run already logged

### F. Code Quality Review Loop (CQRL, v2.19)
- **Status**: ✓ ACTIVE — code_quality.enabled: true, max_iterations: 3
- **Reports**: 91 total (TSK-001..084), 0 high, 25 medium resolved iteratively
- **Passes**: idiomaticity (default), design (default), robustness (default), accessibility (false, separate /a11y)
- **Confidence**: min 0.6, batching split 7, rules path ./code_quality/rules/
- **Next-step**: Invoke `/review TSK-058` (e2e Electron, post-completion)

### G. Compression Layer
- **Output axis (Caveman)**: ✓ ON — conservative profile, R.C1 invariants enforced (to_user/to_artifact/propagate_resolution off)
- **Context axis (Graphify)**: ✓ ON — graphify-cloud, target app, confidence-gated by role, incremental update strategy
- **Status**: Configured but not stress-tested in current sprint (design-doc-heavy workload)
- **Next-step**: `/compression dry-run` on next wave A dispatch (TSK-021..024) to exercise parallel scheduler

### H. Parallel Scheduler (v2.11+, §18)
- **Status**: ✓ ACTIVE — enabled: true, max_parallel: 4, parallel_gate_threshold: 3
- **Scheduler domains**: develop, lint, query, review, visual-oracle, a11y, ux-ui-review, functional-oracle all ON
- **DAG validation**: No cycles detected; Sprint 3-9 backlog verified for parallelizability
- **Wave dispatch readiness**: TSK-021..024 (Sprint 3) can dispatch as Wave A (3 tasks, below threshold; fe-dev, be-dev, qa-dev)
- **Next-step**: `/run --wave` to trigger Wave A dispatch with optional `--dry-run` gate preview

---

## 5. NEXT-STEP RECOMMENDATIONS (Prioritized)

### ★ Immediate (Ready to execute)

1. **`/run --wave --dry-run`** (Parallel scheduler verification)
   - **Scope**: Sprint 3 Wave A (TSK-021, TSK-022, TSK-023) + Optional Wave gate preview
   - **Rationale**: Verify parallel scheduler logic; TSK-021 and TSK-022 are independent, TSK-023 is serial (TSK-021 dep)
   - **v2.21 component exercised**: Parallel scheduler v2.11 with new domains (functional-oracle)
   - **Estimated impact**: Risk LOW, benefit HIGH (validates DAG)

2. **`/functional-oracle app` OR `/functional-oracle TSK-024`** (FE Functional Oracle execution)
   - **Scope**: End-to-end acceptance-spec validation (carica ROM → avvia → emula → engine RUNNING)
   - **Prerequisite**: app build verde (✓ confirmed)
   - **Rationale**: TSK-091 verified acceptance-spec correctness; run validates full flow with real browser
   - **v2.21 component exercised**: Functional Oracle v2.20 executor (qa-dev fallback fe-dev), advisor critic
   - **Estimated impact**: Risk MEDIUM (browser env required), benefit HIGH (verdict + insights)

3. **`/token-ledger --full`** (Session economics reporting)
   - **Scope**: Detailed breakdown of token usage this session (input, output, cache savings)
   - **Rationale**: v2.21 Token Ledger live display; one-liner compact mode vs detailed breakdown
   - **v2.21 component exercised**: Token Ledger v2.21 (EP-022) full report
   - **Estimated impact**: Risk NONE, benefit MEDIUM (cost tracking)

### ★ Near-term (Next sprint, prerequisites clearing)

4. **`/dev TSK-021`** (EmulatorJsEngine real adapter)
   - **Prerequisite**: Wave A gate approval (from step 1)
   - **Rationale**: Sprint 3 lead task; unblocks TSK-022, TSK-023, TSK-024
   - **Estimated impact**: Risk MEDIUM (new engine integration), benefit HIGH (MVP feature complete)

5. **`/visual-oracle --dry-run TSK-003`** (FileLoader FE visual audit)
   - **Scope**: Render headless + screenshot multi-viewport/theme + critica visiva
   - **Prerequisite**: build dev-server available (vite dev or preview)
   - **Rationale**: TSK-003 completed Sprint 1, never visual-oracle audited; exercise oracle gate (v2.17)
   - **v2.21 component exercised**: Oracle Pre-Check FE (dispatch_gate: false, but can enable for next run)
   - **Estimated impact**: Risk LOW, benefit MEDIUM (retroactive coverage)

6. **`/a11y TSK-060`** (TouchOverlay a11y scan, when TSK-059 ready)
   - **Prerequisite**: TSK-059 (Capacitor init, human, in-progress) completes
   - **Rationale**: TSK-060 is todo, mobile FE layer; a11y_status field not yet populated
   - **v2.21 component exercised**: A11y specialist dispatch via fallback chain
   - **Estimated impact**: Risk LOW, benefit MEDIUM (mobile a11y coverage)

### ★ Strategic (Cross-sprint planning)

7. **Graphify context warm-up** (Optional, performance optimization)
   - **Command**: `/graphify-sync app`
   - **Rationale**: .graphify-state/ cache stale (last 2026-06-09); incremental update improves context compression
   - **Estimated impact**: Risk NONE, benefit MEDIUM (faster future runs)

8. **Design Intelligence Layer on next FE TSK** (When TSK-021 FE ready)
   - **Scope**: TSK-022 or TSK-060 → art-director statement → design rationale → critic pass
   - **Rationale**: EP-019 pattern proven on soli-boy (66% ROI); apply to next major FE iteration
   - **v2.21 component exercised**: Full EP-019 cycle (art-director + critic + intention economy)
   - **Estimated impact**: Risk LOW, benefit HIGH (design quality + waste prevention)

---

## 6. FACTORY STATE SUMMARY — v2.21 Complete

| Aspect | Status | Quality | Drift | Action needed |
|--------|--------|---------|-------|----------------|
| **Topology** | full-stack-agents | 5/5 agents active | ✓ Synced | None |
| **Code path** | ./packages/app (monorepo) | 279 test, 0 high findings | ✓ Clean | None |
| **VCS** | GitHub soli92/soli-boy | Push-only mirror, clean | ✓ Clean | None |
| **Scheduler** | Parallel v2.11 | DAG verified, 4-max, gate ON | ✓ Validated | Run Wave A |
| **CQRL** | v2.19 ON | 91 reports, 25 medium resolved | ✓ Active | Review TSK-058 |
| **Visual Oracle** | v2.17 ON | 1 TSK with visual_status | ⚠ Partial coverage | Audit TSK-003,006,008 |
| **Functional Oracle** | v2.20 ON | Spec verified, ready | ✓ Ready | Execute full flow |
| **A11y** | v2.18 ON | 21 FE scan complete, 0 WARNING | ✓ Complete | TSK-060 when ready |
| **UX/UI** | v2.18 ON | 21 FE scan complete, 0 WARNING | ✓ Complete | TSK-060 design when ready |
| **Design Intel** | v2.21 ON | 7 TSK done, critic report | ✓ Deployed | Apply to TSK-022 |
| **Token Ledger** | v2.21 ON | Display hook configured | ✓ Ready | Run --full |
| **Compression** | v2.20 ON (OCL+CCL) | Configured, not stressed | ⚠ Untested | Dry-run next wave |

---

## 7. EPISODIC MEMORY — Logged Entry

**Date**: 2026-06-15 15:30  
**Run type**: Dashboard complete  
**Factory version**: v2.21 (EP-018 Functional Oracle + EP-019 Design Intelligence + EP-022 Token Ledger)  
**TSK state**: 37 done (including 7 new EP-013), 54 todo  
**Epics completed**: EP-001 MVP (20 TSK), EP-010/011 Brand+CI (11 TSK), EP-012 A11y/UX (6 TSK), EP-013 Design-Intel (7 TSK)  
**New capabilities live**: Design Intelligence rationale+critic protocol, Functional Oracle re-verification, Token Ledger display hook  
**Recommendations**: `/run --wave --dry-run` (scheduler) > `/functional-oracle app` (e2e) > `/token-ledger --full` (economics)

---

## Notes

- **Adapter status**: claude (.claude/) + cursor (.cursor/) both full maturity, state filesystem shared
- **V2.21 highlights**: Art-director DSL enforces design intent before implementation; critic pass prevents duplicate work; token ledger provides real-time economics
- **Known limitations**: visual-oracle not available in current env; sub-agent Bash permission sandboxing documented in ADR; compression layer not stress-tested
- **Readiness for next wave**: High (DAG clean, dependencies clear, scheduler gate ready, CQRL loop active)
