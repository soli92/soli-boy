---
id: onboarding-alessandro-musio
type: runbook
title: Onboarding — Alessandro Musio
status: active
layer: meta
created: 2026-07-20
---

# Onboarding — Alessandro Musio

Ciao Alessandro! Questo documento ti guida al tuo primo TSK done su soli-boy in ~30 minuti.

## Cos'è soli-boy (in 3 righe)

Emulatore multipiattaforma (web app, desktop Electron, mobile Capacitor) per Game Boy, GBC e GBA.
Stack: TypeScript · React · design system `@soli92/solids` · Vite · EmulatorJS (core WASM Libretro).
Il codice applicativo vive in `packages/app/src/` — lì che lavori tu come FE developer.

## Come funziona il framework (per uno sviluppatore FE)

- La factory produce artefatti a più livelli: wiki (L2) → epiche (L3) → task (L4) → codice (L5)
- Tu operi su **L5 (Develop)**: ricevi un TSK con specifiche precise e produci codice FE in `packages/app/`
- Il tuo layer è `fe` — il tuo agente è `fe-dev`, il tuo comando è `/dev <TSK-id>`
- **Pipeline FE attiva su questo progetto**: `develop → visual-oracle → ux-ui-review/a11y → functional-oracle → code-review`
  — ogni TSK FE attraversa tutti questi gate automaticamente (tutti `enabled: true` in `factory.config.yaml`)
- CQRL è attivo: dopo ogni TSK done un `code-reviewer` valuta il codice (max 3 iterazioni, poi gate umano)

## Setup (5 minuti)

```bash
# 1. Claude Code — se non l'hai: https://claude.ai/code
# 2. Clona il repo (se non l'hai già)
git clone https://github.com/soli92/soli-boy.git
cd soli-boy

# 3. Installa le dipendenze dell'app
cd packages/app && npm install && cd ../..

# 4. Verifica che i test girino
cd packages/app && npm test && cd ../..

# 5. Apri la factory in Claude Code
claude .
```

## Il tuo primo TSK

Sprint 21 ha solo gate umani aperti (validazione device fisico — non per te).
Usa `/run` all'avvio: l'orchestrator ti mostra il prossimo TSK pronto per il layer `fe`.

I TSK sono in `management/kanban/EP-*/US-*/TSK-*.md`. Quando trovi un TSK FE con
`status: todo` e `consumer: agent`, verificane il frontmatter (`layer: fe`) e avvialo con:

```
/dev <TSK-id>
```

L'agente `fe-dev` legge le `Technical Specs` del TSK, implementa in `packages/app/`, esegue i test
e passa automaticamente ai gate successivi (visual-oracle → ux-ui-review → functional-oracle → code-review).

## Comandi essenziali

- `/run` — dashboard di stato + wave dispatch: mostra TSK pronti e suggerisce il prossimo
- `/dev <TSK-id>` — esegui un TSK come agente fe-dev (include tutti i gate FE automaticamente)
- `/lint` — health check della factory (18+ check; attenzione ai WARNING su Check 4o/4p se WCAG/UX)
- `/query <domanda>` — interroga la wiki (`/query "come funziona TouchOverlay?"`)
- `/review <TSK-id>` — avvia code review manuale se non scattato automaticamente

## Cosa fare se sei bloccato

- **Wiki**: `wiki/syntheses/stack-tecnologico-soli-boy.md` per lo stack; `wiki/` ha 57+ pagine
- **ADR**: `design_&_architecture/decisions/` — capire le scelte architetturali
- **Gaps**: se trovi qualcosa di non documentato, aggiungilo in `wiki/gaps.md` (append)
- **Domande aperte**: crea `management/questions/Q_XXX.md` (skill `apri-question`)
- **Contatto**: Simone Olivieri (maintainer principale) — simone.olivieri@accenture.com
