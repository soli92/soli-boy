---
id: TS-COMMENT-001
tier: emergent
status: candidate
applies_to: { language: typescript, framework: any, context: [idiomaticity, style] }
severity_default: low
auto_fixable: true
created: 2026-06-28
identified_in: TSK-123-iter-1
---
# TS-COMMENT-001 — Evitare riferimenti spaziali ("sopra"/"sotto") nei commenti

**Regola (candidata):** i commenti non devono usare riferimenti spaziali relativi
al layout del file (`// vedi sopra`, `// see below`, `// cfr. riga precedente`)
per puntare ad altro codice o commenti. Usare invece un riferimento esplicito
(nome della costante, del metodo, del tag TSK, oppure un JSDoc `@see`).

**Rationale:** un riferimento come "vedi commento TSK-123 sopra" si rompe silenziosamente
se il codice viene riordinato, estratto in un modulo separato, o se il commento
referenziato viene spostato. Il risultato è un commento fuorviante che punta al nulla.
Un riferimento esplicito (es. `// vedi BTN map — costante sopra si chiama BTN`) o
l'uso di JSDoc `@see {@link sendInput}` è robusto alle refactoring.

**Esempio violante (da TSK-123, wasmboy-engine.ts):**
```typescript
const BTN: Partial<Record<GameButton, keyof WasmBoyJoypadState>> = {
  // ...
  // l, r: assenti volutamente — vedi commento TSK-123 sopra.
};
```

**Fix suggerito:**
```typescript
const BTN: Partial<Record<GameButton, keyof WasmBoyJoypadState>> = {
  // ...
  // l, r: assenti volutamente — L/R: no-op su GB/GBC (hardware non dispone di shoulder).
  //   Le action arrivano dall'InputMapping (TSK-120) e vengono scartate dal guard
  //   in sendInput senza throw né warning (US-062 BR §4).
};
```

**Note per promozione:** pattern osservato 1 volta (TSK-123, wasmboy-engine.ts).
Promuovere a `canonical` solo se ri-osservato in ≥ 2 TSK diversi.
Promozione è gate umano (§19.5 step 4).
