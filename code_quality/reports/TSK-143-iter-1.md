# CQRL Report — TSK-143 iter-1

**TSK**: TSK-143 — App shell + Tabs navigation migration  
**Iter**: 1 / 3  
**Verdict**: `conditional`  
**Data**: 2026-07-02  
**Reviewer version**: 2.26

---

## Stack rilevato

| Campo | Valore |
|---|---|
| Language | TypeScript |
| Framework | React 18 |
| UI primitive | Radix UI Tabs (`@radix-ui/react-tabs`) + shadcn/ui wrapper |
| Build | Vite 5 |
| Test | Vitest + Testing Library + Playwright e2e |
| Confidence | high |
| Blast-radius pre-check | skip (`.graphify-state/code_paths/app/` assente) |

---

## Verdict

**`conditional`** — 3 finding (0 high · 1 medium · 2 low).

La migrazione Radix Tabs e' idiomaticamente corretta. La pipeline precedente ha validato tutti i comportamenti chiave:
- Visual Oracle iter-2 `pass` — tab bar full-width, layout, temi
- A11y iter-2 `pass` — 0 critical/major, ARIA wiring Radix corretto
- UX/UI Review iter-2 `pass` — overflow-x-auto mobile, bg-transparent flush nav

Il verdict `conditional` e' determinato da F-3 (medium, QA-TEST-001): manca il test unitario per l'invariante `forceMount`. Il task viene delegato a **qa-dev** — il fe-dev non e' bloccato su merge.

I finding F-1 e F-2 sono advisory low per fe-dev (nessun bug, type safety idiomatica).

---

## Finding (ordinati per severity)

### F-3 — medium | QA-TEST-001 | Passata: robustezza

**Manca test unitario per l'invariante `forceMount` — panel Play deve restare montato al cambio tab**

- File: `packages/app/src/App.gameChangeDialog.test.tsx` (gap, non un bug)
- Regola: [^rule: code_quality/rules/canonical/QA-TEST-001.md §Rationale]
- Confidence: 0.78
- Assignee: **qa-dev**

`forceMount` su `<TabsContent value="play">` e' l'invariante architetturale piu' critica introdotta da TSK-143: garantisce che il Player (e lo stato WasmBoy interno) non venga smontato quando l'utente cambia tab. I test unitari esistenti verificano la navigazione tra tab e i flussi Library→Player, ma nessun caso verifica esplicitamente che `[data-testid="panel-play"]` rimanga nel DOM quando la tab attiva e' Library, Settings o Info.

Una rimozione accidentale di `forceMount` in future iterazioni non sarebbe intercettata dai test unitari.

**Fix suggerito (qa-dev)**: aggiungere in un test file App un caso che verifica l'invariante:
```tsx
// forceMount invariant: Play panel must remain in DOM on tab switch
clickTab(/libreria/i);
expect(screen.getByTestId("panel-play")).toBeInTheDocument();

clickTab(/impostazioni/i);
expect(screen.getByTestId("panel-play")).toBeInTheDocument();
```

---

### F-1 — low | TS-IDIOM-002 | Passata: idiomaticita'

**Type assertion `value as Tab` in `onValueChange` senza commento giustificativo**

- File: `packages/app/src/App.tsx:603` [^src5: packages/app/src/App.tsx:603]
- Regola: [^rule: code_quality/rules/canonical/TS-IDIOM-002.md §Rationale]
- Confidence: 0.72
- Assignee: fe-dev (advisory)

Il cast `value as Tab` e' de facto sicuro (Radix emette `onValueChange` solo con i valori dei `TabsTrigger` dell'array `TABS`), ma l'invariante non e' documentato inline. TS-IDIOM-002 richiede che le type assertion siano giustificate.

**Fix suggerito (minimo)**: `// Safe: Radix emits only values from TABS.map(t => t.id)`  
**Fix suggerito (idiomatico)**: risolvere insieme con F-2 via `as const` derivation.

---

### F-2 — low | TS-IDIOM-002 | Passata: design

**`Tab` type e `TABS` array — doppia sorgente di verita', tipo non derivato**

- File: `packages/app/src/App.tsx:115-122` [^src5: packages/app/src/App.tsx:115]
- Regola: [^rule: code_quality/rules/canonical/TS-IDIOM-002.md §Rationale]
- Confidence: 0.76
- Assignee: fe-dev (advisory)

`type Tab = "play" | "library" | "settings" | "info"` e `TABS: { id: Tab; label: string }[]` sono due definizioni separate. TypeScript vincola le tab dichiarate in TABS via il tipo Tab, ma il contrario non vale: aggiungere un letterale a Tab senza una entry in TABS e' silenziosamente valido. Il pattern idiomatico e' derivare il tipo dall'array:

```tsx
const TABS = [
  { id: "play" as const, label: "Play" },
  { id: "library" as const, label: "Libreria" },
  { id: "settings" as const, label: "Impostazioni" },
  { id: "info" as const, label: "Info & Privacy" },
] as const;
type Tab = (typeof TABS)[number]["id"];
```

Questo risolve anche il cast di F-1 (il type di `id` nel TABS array diventa la union esatta).

---

## Comportamenti validati dalla pipeline — non in scope CQRL

I seguenti comportamenti sono stati esplicitamente validati dal pipeline pre-review e non sono oggetto di finding:

| Comportamento | Validazione |
|---|---|
| Radix ARIA wiring (`role="tablist"`, `aria-selected`, `aria-controls`) | a11y iter-2 pass |
| Keyboard navigation Arrow/Home/End gestita da Radix | a11y iter-2 pass |
| `data-testid="panel-*"` come locator e2e | ux-ui iter-2 pass |
| `overflow-x-auto` su TabsList per mobile 375px | ux-ui iter-2 pass (F-01 closed) |
| `forceMount` + `data-[state=inactive]:hidden` (pattern difensivo) | visual-oracle iter-2 pass |
| Rimozione `id` espliciti su TabsTrigger/TabsContent | a11y iter-2 pass (F-01 closed) |

---

## Task package — qa-dev

```json
{
  "assignee": "qa-dev",
  "tsk_id": "TSK-143",
  "iter": 1,
  "constraint": {
    "scope": "add forceMount invariant test only; no opportunistic refactor",
    "max_diff_lines": 20,
    "blast_radius_warning": [],
    "blast_radius_note": "Modifica test-only — nessun impatto su codice di produzione"
  },
  "findings": ["F-3"]
}
```

---

## Loop status

| Campo | Valore |
|---|---|
| Iterazione corrente | 1 |
| Max iterazioni | 3 |
| No-progress detected | false |
| Regression detected | false |

---

## Prossimo step

1. **qa-dev**: aggiungere il test unitario `forceMount` invariant (F-3, max 20 righe diff).
2. **fe-dev (opzionale)**: applicare fix F-1/F-2 (type assertion comment + `as const` derivation).
3. **CQRL iter-2**: dopo che qa-dev ha chiuso F-3, re-review per verificare il test aggiunto. Se F-3 chiuso e nessun nuovo finding → verdict `pass`.
