# TSK-166 — A11y Audit WCAG 2.2 AA — iter-1

**Target:** `packages/app/dist/index.html` (build locale) + analisi statica
`packages/app/src/App.tsx`, `Settings/Settings.tsx`, `styles/app-extra.css`
**Standard:** WCAG 2.2 AA
**Data:** 2026-07-03
**Agente:** a11y-specialist (EP-007, ADR-014 modalità 3)
**Contesto:** Fix P0 mobile portrait navbar — ThemeSwitcher rimosso da header su ≤640px,
aggiunto AccordionItem "Tema" in Settings, CSS difensivo `overflow-x: auto` su nav.

---

## Summary

| Metrica | Valore |
|---|---|
| Critical | 0 |
| Major | 0 |
| Minor | 2 |
| Manual checks | 6 |
| Verdict | **conditional** |

Nessun errore automatico critico o major rilevato; restano 6 verifiche manuali.

> Regola di neutralità (ADR-016 §G): nessun errore automatico rilevato nei range
> critical/major NON equivale a conformità. I 2 finding minor sono pre-esistenti
> (non introdotti da TSK-166). Le 6 verifiche manuali sono obbligatorie prima di
> chiudere il giudizio definitivo.

---

## Automated Findings

Scan eseguito via `axe-playwright` su `dist/index.html` (file://) con
`runOnly: wcag2a, wcag2aa, wcag21aa, wcag22aa` e flag `--include-interactive`.

### AF-01 — landmark-one-main

| Campo | Valore |
|---|---|
| id | `landmark-one-main` |
| severity | Minor |
| wcag | n/a (axe best practice) |
| location | `html` |
| description | Document should have one main landmark |
| suggested_fix | Verificare che un solo elemento `<main>` sia presente e visibile al momento della scansione. Il codice (App.tsx) contiene `<main className="sb-app-main">`: il finding può essere un artefatto di timing su file:// (React non ancora montato) o di doppio-role (`StorageInitErrorFallback` usa `role="alert"` su un elemento `<main>`, potenziale conflitto semantico). |
| introdotto da TSK-166 | No — pre-esistente |

### AF-02 — page-has-heading-one

| Campo | Valore |
|---|---|
| id | `page-has-heading-one` |
| severity | Minor |
| wcag | n/a (axe best practice) |
| location | `html` |
| description | Page should contain a level-one heading |
| suggested_fix | Il `<h1>` presente in App.tsx (`<h1 className="sb-title sb-title--logo m-0"><img alt="Soli-boy" /></h1>`) contiene solo un'immagine con alt text. Alcuni motori axe-rule best-practice non considerano img-only come heading con testo visibile. Valutare aggiunta di uno span visually-hidden: `<span class="sr-only">Soli-boy</span>` accanto all'img per soddisfare la best practice senza alterare il layout. |
| introdotto da TSK-166 | No — pre-esistente |

---

## Manual Checks

*Status: `to_verify` — nessuna verifica manuale eseguita in questo iter.*
*N = 6 (invariante ADR-016 §G: N ≥ 1, mai vuota).*

| # | wcag | item | status |
|---|---|---|---|
| MC-01 | 2.1.1 | **Keyboard scroll — nav overflow-x:auto mobile**: su viewport 375px, verificare che tutti e 4 i tab (Play, Libreria, Impostazioni, Info & Privacy) siano raggiungibili e attivabili con solo tastiera. Il `.sb-app-header__nav` ha `overflow-x: auto` su ≤639px senza `tabindex="0"` sul contenitore; la navigazione tab-key deve portare il focus nel TabsList e le Arrow keys devono far scorrere il viewport al tab correntemente focalizzato (browser auto-scroll). Test con tastiera fisica su breakpoint 375px. | to_verify |
| MC-02 | 2.4.3 | **Focus order mobile** — su viewport ≤639px, verificare che il focus sequenziale (Tab key) attraversi: (1) logo/header → (2) tab attivo nel TabsList → (3) elementi interattivi nel pannello Settings (AccordionTrigger "Tema", altri trigger) in ordine logico left-to-right/top-to-bottom. Nessuna trappola focus, nessun salto. | to_verify |
| MC-03 | 1.4.11 | **Non-text contrast — focus ring AccordionTrigger "Tema"**: verificare su tutti e 3 i temi (cyberpunk, 90s-party, dark) che il focus ring dell'AccordionTrigger "Tema" abbia rapporto di contrasto ≥ 3:1 rispetto allo sfondo adiacente (WCAG 1.4.11). Il focus ring è quello fornito da Radix/shadcn (`focus-visible:ring-2 focus-visible:ring-ring`). | to_verify |
| MC-04 | 2.5.5 | **Touch target size — TabsTrigger**: misurare l'altezza renderizzata effettiva dei TabsTrigger (Play/Libreria/Impostazioni/Info & Privacy) su viewport 390px. Finding carry-over da TSK-165: altezza ~28px stimata (py-1 = 4px×2 + testo ~20px, nessun h-full nel trigger). WCAG 2.5.8 AA (24px minimo) è soddisfatto; WCAG 2.5.5 AAA (44px raccomandato) non è soddisfatto. Misurare con DevTools e documentare il valore esatto. Se < 24px: major; se 24–43px: minor advisory. | to_verify |
| MC-05 | 1.3.1 | **Screen reader — accordion "Tema" aria-expanded**: con VoiceOver (iOS/macOS) o NVDA (Windows), verificare che all'attivazione dell'AccordionTrigger "Tema" (Enter/Space) il cambio di stato `aria-expanded` (true↔false) sia annunciato correttamente, e che il ThemeSwitcher button dentro l'AccordionContent sia raggiungibile e il suo `aria-label` sia letto correttamente. | to_verify |
| MC-06 | 2.1.1 | **`display:none` screen reader hiding — ThemeSwitcher header**: su viewport ≤639px (mobile), verificare con screen reader che il ThemeSwitcher dell'header (wrapper `<div className="hidden sm:block">`) NON sia annunciato né raggiungibile con screen reader. `display:none` via Tailwind `hidden` dovrebbe escludere l'elemento dall'albero di accessibilità; la verifica su dispositivo fisico (o BrowserStack) è necessaria per escludere override CSS imprevisti. | to_verify |

---

## Positive Findings

Risultati positivi emergenti dall'analisi statica del codice TSK-166 e dalla scansione:

| # | wcag | item | note |
|---|---|---|---|
| PF-01 | 4.1.2 | **AccordionTrigger "Tema" — semantica corretta**: Radix `AccordionPrimitive.Trigger` renderizza come `<button>` nativo con `aria-expanded` e `aria-controls` gestiti automaticamente. Enter/Space toggle e Arrow/Home/End navigation sono nativi (WAI-ARIA APG Accordion pattern). | Verificato da `accordion.tsx` + Radix APG |
| PF-02 | 4.1.2 | **ThemeSwitcher — aria-label contestuale**: il button ThemeSwitcher in Settings ha `aria-label={`Tema corrente: ${THEME_LABELS[current]}. Clicca per passare a ${THEME_LABELS[next]}`}` — label descrittiva che comunica stato corrente e azione attesa. Pattern corretto per toggle button con due stati. | Verificato da `ThemeSwitcher.tsx:39` |
| PF-03 | 1.3.1 | **`display:none` hiding simmetrico**: sia il ThemeSwitcher nell'header (`hidden sm:block`) che l'AccordionItem "Tema" in Settings (`block sm:hidden`) usano `display:none` per la visibilità condizionale — metodo corretto per rimuovere elementi anche dall'albero AT. Nessuna "zona morta" viewport: su mobile il toggle è in Settings; su desktop è nell'header. | Verificato da `App.tsx:445`, `Settings.tsx:417` |
| PF-04 | 2.4.1 | **Nav landmark con aria-label**: `<nav aria-label="Navigazione principale">` wrappa il TabsList; il TabsList ha `aria-label="Sezioni app"`. Le due etichette servono elementi diversi (landmark nav e widget tablist) senza sovrapposizione semantica. | Verificato da `App.tsx:425-427` |
| PF-05 | 2.4.3 | **Radix Tabs WAI-ARIA APG**: TabsList/TabsTrigger/TabsContent usano Radix `TabsPrimitive` che implementa il pattern APG (roving tabindex, `aria-selected`, `role=tablist/tab/tabpanel`, Arrow key navigation). Focus order dei tab è logico (Play → Libreria → Impostazioni → Info & Privacy). | Verificato da `tabs.tsx` + Radix APG |
| PF-06 | 1.3.1 | **Emoji aria-hidden**: il `<div class="drop-zone">` nel pannello Play usa `<div aria-hidden="true">📁</div>` — corretto, l'emoji decorativo è escluso dall'AT. La funzionalità navigare-alla-libreria è accessibile via il Button interno "Vai alla Libreria" (elemento semantico nativo, focusabile). | Verificato da `App.tsx:499` |
| PF-07 | 4.1.3 | **Live regions sui messaggi stato**: il feedback "Profilo salvato" usa `role="status"` (non-disruptive); i messaggi di errore I/O dati usano `role="alert"` (interruptive). Distinzione corretta tra notifiche e errori. | Verificato da `Settings.tsx:478,727` |

---

## Note di contesto

- **Scan environment**: `file://` su `dist/index.html`; React bootstrapping completo richiede
  la verifica che `waitUntil: 'load'` sia sufficiente o che sia necessario `waitUntil: 'networkidle'`.
  Per un audit di produzione, preferire scan su server locale (`npm run preview` su porta).
- **Carry-over TSK-165**: il finding touch target TabsTrigger (~28px vs 44px) è noto.
  WCAG 2.5.8 AA (24px) è soddisfatto; WCAG 2.5.5 AAA non lo è. MC-04 richiede misura puntuale.
- **Pre-existing minor (AF-01/AF-02)**: entrambi non introdotti da TSK-166; richiedono fix
  separato in un TSK dedicato se si vuole portare a zero i finding axe best-practice.
- **Conformità legale**: questo report è un pre-screening interno. Non sostituisce un audit
  indipendente per obblighi EAA, ADA o normative locali.

---

*Report generato da `a11y-specialist` (EP-007, ADR-014 modalità 3) — 2026-07-03*
*Tool: `axe-playwright` via `a11y-scan.sh` — Standard: WCAG 2.2 AA*
