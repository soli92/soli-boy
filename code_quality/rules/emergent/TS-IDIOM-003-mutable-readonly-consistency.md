---
id: TS-IDIOM-003
tier: emergent
status: candidate
applies_to: { language: typescript, framework: any, context: [idiomaticity, robustness] }
severity_default: low
auto_fixable: true
created: 2026-06-28
source_tsk: TSK-122
promoted_from: ""
---
# TS-IDIOM-003 (candidate) — Exported constant maps: usare `ReadonlyArray` per gli array interni

**Regola (candidate):** un modulo che esporta una mappa costante (`Record<K, T[]>` o
`Map<K, T[]>`) dovrebbe tipizzare gli array interni come `ReadonlyArray<T>` o
`readonly T[]` per prevenire mutazione accidentale da parte dei consumer.

**Rationale:** `Record<Core, VirtualButton[]>` permette a qualunque consumer di fare
`BUTTON_MAP["mgba"].push(...)`, alterando silenziosamente tutti i render che dipendono
dalla mappa. Se la stessa mappa usa `ReadonlySet` per altri campi (come
`CORES_WITH_SHOULDER_BUTTONS`), l'inconsistenza è un segnale di policy non completata.
TypeScript modern idiom: `readonly` array su exported constants è il pattern standard
per evitare mutazione non intenzionale.

**Esempio (bad):**
```typescript
export const BUTTON_MAP: Record<Core, VirtualButton[]> = { ... };
// consumer può fare: BUTTON_MAP["mgba"].push({ button: "x", label: "X" })
```

**Esempio (good):**
```typescript
export const BUTTON_MAP: Record<Core, ReadonlyArray<VirtualButton>> = { ... };
// o: Record<Core, readonly VirtualButton[]>
// consumer: BUTTON_MAP["mgba"].push(...) → errore di compilazione TS
```

**Provenienza:** rilevato in review TSK-122 (`button-map.ts` line 61, inconsistenza
con `ReadonlySet<Core>` usato su `CORES_WITH_SHOULDER_BUTTONS`). Gate umano obbligatorio
per promozione (PATTERN §19.5). Non applicabile nel round corrente.
