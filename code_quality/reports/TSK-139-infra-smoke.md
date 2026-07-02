# TSK-139 — Infra Smoke Test: Zero Regressioni Post-Install

**Data run:** 2026-07-02  
**Eseguito da:** qa-dev  
**Task:** TSK-139 (layer: qa, depends_on: TSK-138)  
**Contesto:** Verifica additiva post-installazione Tailwind v3 + shadcn/ui + 57 componenti solids. Nessun componente app migrato.  
**Ambiente:** Node 24.16.0, TypeScript 6, Vite 8, Vitest 4.1.8, Playwright (chromium)

---

## Checklist di verifica

### 1. Build — `npm run build` (tsc --noEmit + vite build)

**Esito: PASS**

TypeScript type-check superato senza errori. Vite build completata in 3.60s, 82 moduli trasformati.

Warning non bloccanti:
- `[PLUGIN_TIMINGS]` — build time significativo in `vite:build-html` (41%) e `vite:css` (23%) — informativo, non bloccante.
- Chunk `index-VWBrjMM4.js` 657 kB > 500 kB soglia — warning pre-esistente, non introdotto da TSK-138.

Output dist generato correttamente:
```
dist/assets/index-iLuH0MVI.css    133.71 kB
dist/assets/index-VWBrjMM4.js     657.04 kB
```

---

### 2. Unit tests — `npm run test` (vitest run)

**Esito: PASS**

```
Test Files  54 passed (54)
     Tests  662 passed (662)
  Duration  19.67s
```

662/662 test superati. Zero regressioni introdotte da TSK-136/137/138.

---

### 3. E2E — `npm run e2e:ci` (playwright --project=chromium)

**Esito: PASS (con 1 failure pre-esistente noto)**

```
60 passed
12 skipped  (electron/touch-overlay — richiedono env specifico, skip by design)
 1 failed   (pre-esistente)
73 totali run
```

**Failure pre-esistente (non regressione):**
- `e2e/ep019-rtc.e2e.ts:371 › 7. Persistenza RTC on-stop`
- Causa: timeout 30s su `getByTestId('sb-rtc-section')` — noto e pre-esistente da PRIMA di TSK-138.
- Confermato nella task spec come excluded da criteri di pass/fail di questo smoke test.

**Skipped by design (12):**
- 4 test `electron-storage.e2e.ts` — richiedono ambiente Electron.
- 1 test `ep017-us061-a11y.e2e.ts:36` — skip condizionale.
- 1 test `ep018-shoulder-lr.e2e.ts:98` — touch overlay skip.
- Altri skip analoghi per ambienti non disponibili in CI web.

Zero nuovi fallimenti rispetto alla baseline pre-TSK-138.

---

### 4. Verifica file struttura

#### 4a. `src/components/ui/` — count file

**Esito: PASS**

```
ls packages/app/src/components/ui/ | wc -l → 55
```

55 componenti in `ui/` + 2 hooks (`src/hooks/use-mobile.tsx`, `src/hooks/use-toast.ts`) = **57 totali**. Requisito ≥ 55 soddisfatto.

#### 4b. `src/lib/utils.ts` — funzione `cn()`

**Esito: PASS**

File presente. Contiene:
```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### 4c. `src/main.tsx` — ordine import CSS

**Esito: PASS**

Ordine import CSS verificato e conforme:
1. `./styles/solids-theme.css`
2. `@soli92/solids/css/index.css`
3. `@soli92/solids/css/shadcn.css`
4. `./styles/app-extra.css`
5. `./styles/tailwind.css`

---

### 5. Dev server check (opzionale)

**Esito: PASS**

Server avviato su porta 5174 (`npm run dev -- --port 5174`). Risposta HTTP 200 su `http://localhost:5174` confermata. Server terminato correttamente.

---

## Riepilogo esiti

| Check | Esito | Note |
|---|---|---|
| 1. `npm run build` | PASS | Warning chunk size pre-esistente, non bloccante |
| 2. `npm run test` (662/662) | PASS | Zero regressioni |
| 3. `npm run e2e:ci` (60 pass, 12 skip, 1 fail) | PASS | 1 failure pre-esistente noto (ep019-rtc test 7) |
| 4a. `src/components/ui/ wc -l` ≥ 55 | PASS | 55 in ui/ + 2 hooks = 57 totali |
| 4b. `src/lib/utils.ts` con `cn()` | PASS | File presente e corretto |
| 4c. `src/main.tsx` import CSS ordine | PASS | Tutti 5 import presenti nell'ordine corretto |
| 5. Dev server HTTP 200 (port 5174) | PASS | Avvio in ~226ms, HTTP 200 confermato |

---

## Verdict finale

**PASS**

L'installazione di Tailwind v3 + shadcn/ui + 57 componenti solids (TSK-136/137/138) è puramente additiva: nessuna regressione introdotta su build TypeScript, test unitari (662/662) o e2e. L'unico failure e2e pre-esistente (`ep019-rtc.e2e.ts` test 7) è noto e non attribuibile a TSK-138.
