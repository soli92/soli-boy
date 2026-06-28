---
id: TS-DESIGN-003
tier: emergent
status: candidate
applies_to: { language: typescript, framework: react, context: [design, architecture] }
severity_default: medium
auto_fixable: false
created: 2026-06-28
source_tsk: TSK-122
promoted_from: ""
---
# TS-DESIGN-003 (candidate) — Usare la funzione helper di dominio invece di literal string per l'identità di entità

**Regola (candidate):** quando un modulo espone un helper come single source of truth per
l'identità di un insieme di entità (es. `coreHasShoulderButtons`, `isShoulderButton`),
ogni consumer downstream deve usare quell'helper piuttosto che replicare la conoscenza
con confronti di literal string.

**Rationale:** confronti letterali (`button === "l" || button === "r"`) duplicano la
knowledge domain a livello di modulo. Se la definizione di "shoulder button" cambia
(nuovo core, nuovi button name come `l2`/`r2`), il literal check in un componente
downstream è silenziosamente obsoleto — la funzione helper sarebbe aggiornata ma il
consumer no.

**Esempio (bad):**
```typescript
// TouchOverlay.tsx — conosce i literal "l"/"r" indipendentemente da button-map.ts
const isShoulder = button === "l" || button === "r";
```

**Esempio (good, opzione A):** esportare `isShoulderButton(btn: GameButton): boolean`
da `button-map.ts` e usarla nel consumer:
```typescript
import { isShoulderButton } from "./button-map";
const isShoulder = isShoulderButton(button);
```

**Esempio (good, opzione B):** aggiungere `shoulderSide?: "left" | "right"` a
`VirtualButton` in button-map.ts — il consumer non deve "sapere" i nomi:
```typescript
const isShoulder = !!vb.shoulderSide;
const side = vb.shoulderSide ?? "left";
```

**Provenienza:** rilevato in review TSK-122 (TouchOverlay.tsx line 360). Gate umano
obbligatorio per promozione a `canonical` o `team-specific` (PATTERN §19.5).
Non applicabile nel round corrente.
