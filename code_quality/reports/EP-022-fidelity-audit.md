# EP-022 Fidelity Audit

**TSK:** TSK-165 (US-104, EP-022)
**Data audit:** 2026-07-03
**Esecutore:** qa-dev (agent)
**Tool:** Playwright headless Chromium + Mobile (iPhone 13 device) — `packages/app/e2e/ep022-fidelity-audit.e2e.ts`
**Screenshot dir:** `code_quality/reports/EP-022-fidelity-audit/` (32 file)
**Riferimento visivo:** `wiki/design/ep020-design-brief.md` (R.D1)

---

## Riepilogo executive

| Viewport | S1 Tab | S2 Header | S3 Logo | S4 Switcher | S5 Touch | S6 Nav | WCAG violazioni |
|----------|--------|-----------|---------|-------------|----------|--------|-----------------|
| mobile-portrait 390×844 | PASS | PASS | PASS | FIXME (pre-TSK-166) | **FAIL** | PASS | 7 (chromium) / 12 (mobile) |
| mobile-landscape 844×390 | PASS | PASS | PASS | PASS | **FAIL** | PASS | 8 (chromium) / 13 (mobile) |
| tablet 768×1024 | PASS | PASS | PASS | PASS | **FAIL** | PASS | 8 (chromium) / 13 (mobile) |
| desktop 1280×800 | PASS | PASS | PASS | PASS | **FAIL** | PASS | 8 (chromium) / 13 (mobile) |

**Totale test:** 112 eseguiti (56 unique × 2 progetti Playwright: chromium + mobile)
**Risultato:** 102 PASS · 8 FAIL (S5 sistematico su tutti i viewport) · 2 SKIP/FIXME (S4 mobile-portrait)
**Screenshots prodotti:** 32 (4 viewport × 4 tab × 2 temi)

**Severità aggregata per viewport:**

| Viewport | Severità aggregata | Driver principale |
|----------|--------------------|-------------------|
| mobile-portrait | **blocker** | Tab triggers 28px + ThemeSwitcher in header (pre-TSK-166) |
| mobile-landscape | **blocker** | Tab triggers 28px + TouchOverlay buttons |
| tablet | **blocker** | Tab triggers 28px + TouchOverlay buttons |
| desktop | **major** | Tab triggers 28px + action buttons |

---

## Delta noti (TSK-165 §DoD): confermati/smentiti

| Delta dichiarato | Esito audit | Severità |
|-----------------|-------------|----------|
| Navbar mobile portrait overlay | **SMENTITO** — S2 PASS: header non fa overflow (usa `overflow-x-auto`). ThemeSwitcher è nell'header ma non causa overflow. | n/a |
| Play tab nascosto | **SMENTITO** — S1 PASS: tab "Play" visibile e cliccabile su tutti i viewport. Il tab è il primo della lista, non viene tagliato dall'overflow scroll. | n/a |
| ThemeSwitcher nell'header su mobile-portrait | **CONFERMATO** — `.theme-switcher` è sempre dentro `.sb-app-header` indipendentemente dal viewport. Fix atteso: TSK-166. | blocker |
| Touch targets < 44px (WCAG 2.5.5) | **CONFERMATO** — tutti i tab trigger sono a 28px, action buttons a 32-40px. Sistemico su tutti i viewport. | blocker |

---

## Mobile Portrait (~390px)

### Tab Play — cyberpunk | 90s-party

**Screenshot:** `mobile-portrait-play-cyberpunk.png` (138KB) · `mobile-portrait-play-90s-party.png` (133KB)

**Check strutturali:** S1 PASS · S2 PASS · S3 PASS · S4 FIXME · S5 FAIL · S6 PASS

**Delta:**
- `[blocker][componente]` ThemeSwitcher dentro `.sb-app-header` su 390px — occupa spazio nell'header riducendo l'area disponibile per i tab. Fix: TSK-166.
- `[blocker][spacing]` 4 tab trigger a 28px ciascuno (WCAG 2.5.5 richiede ≥44px).
- `[major][spacing]` Bottoni "Avvia" (36px), "Schermo intero" (36px), "Vai alla Libreria" (32px) sotto soglia.
- `[minor][layout]` Tab overflow scrollabile orizzontalmente su 390px. L'ultimo tab ("Info & Privacy") potrebbe richiedere scroll ma non è "nascosto" dal DOM.

### Tab Library — cyberpunk | 90s-party

**Screenshot:** `mobile-portrait-library-cyberpunk.png` (62KB) · `mobile-portrait-library-90s-party.png` (61KB)

**Delta:**
- Libreria vuota (nessuna ROM) — stato atteso nell'ambiente test. La griglia `[aria-label="Libreria giochi"]` è presente.
- `[cosmetic]` Screenshot piccoli (61-62KB) rispetto agli altri tab — coerente con contenuto minimal (lista ROM vuota + FileLoader).

### Tab Settings — cyberpunk | 90s-party

**Screenshot:** `mobile-portrait-settings-cyberpunk.png` (137KB) · `mobile-portrait-settings-90s-party.png` (133KB)

**Delta:**
- `[blocker][spacing]` Trigger accordion visibili e cliccabili ma altezza non verificata singolarmente (coperti dal S5 sistemico).

### Tab Info — cyberpunk | 90s-party

**Screenshot:** `mobile-portrait-info-cyberpunk.png` (318KB) · `mobile-portrait-info-90s-party.png` (301KB)

**Note:** Screenshot più grandi per questo viewport (contenuto lungo con scroll) — indica rendering completo della pagina informativa.

---

## Mobile Landscape (~844×390)

### Tab Play — cyberpunk | 90s-party

**Screenshot:** `mobile-landscape-play-cyberpunk.png` (112KB) · `mobile-landscape-play-90s-party.png` (106KB)

**Check strutturali:** tutti PASS eccetto S5 FAIL.

**Delta:**
- `[blocker][spacing]` Tab triggers 28px — identico a mobile-portrait.
- `[major][spacing]` ThemeSwitcher in header a 32px (WCAG 2.5.5).
- `[major][spacing]` TouchOverlay buttons (Configura overlay 36px, L 40px, R 40px, SEL 32px, STA 32px).
- `[minor][layout]` L'altezza viewport ridotta (390px) comprime il contenuto. Layout scrollabile verticalmente — accettabile.

### Tab Library — cyberpunk | 90s-party

**Screenshot:** `mobile-landscape-library-cyberpunk.png` · `mobile-landscape-library-90s-party.png`

**Delta:** Nessun delta strutturale oltre a S5 sistematico.

### Tab Settings — cyberpunk | 90s-party

**Screenshot:** `mobile-landscape-settings-cyberpunk.png` · `mobile-landscape-settings-90s-party.png`

**Delta:** S5 sistematico.

### Tab Info — cyberpunk | 90s-party

**Screenshot:** `mobile-landscape-info-cyberpunk.png` · `mobile-landscape-info-90s-party.png`

**Delta:** Nessun delta strutturale.

---

## Tablet (~768px)

### Tab Play — cyberpunk | 90s-party

**Screenshot:** `tablet-play-cyberpunk.png` (175KB) · `tablet-play-90s-party.png` (167KB)

**Check strutturali:** tutti PASS eccetto S5 FAIL.

**Delta:**
- `[blocker][spacing]` Tab triggers 28px — identico agli altri viewport.
- `[major][spacing]` ThemeSwitcher 32px, action buttons 32-40px.
- `[minor][layout]` Su 768px il layout appare più spazioso ma i touch target rimangono invariati.

### Tab Library — cyberpunk | 90s-party

**Screenshot:** `tablet-library-cyberpunk.png` (95KB) · `tablet-library-90s-party.png` (93KB)

### Tab Settings — cyberpunk | 90s-party

**Screenshot:** `tablet-settings-cyberpunk.png` (171KB) · `tablet-settings-90s-party.png` (165KB)

### Tab Info — cyberpunk | 90s-party

**Screenshot:** `tablet-info-cyberpunk.png` (435KB) · `tablet-info-90s-party.png` (419KB)

---

## Desktop (~1280px)

### Tab Play — cyberpunk | 90s-party

**Screenshot:** `desktop-play-cyberpunk.png` · `desktop-play-90s-party.png`

**Check strutturali:** tutti PASS eccetto S5 FAIL.

**Delta:**
- `[major][spacing]` Tab triggers 28px — il problema non è viewport-specifico ma di stile CSS globale del `TabsTrigger` Radix (non è stato sovrascritta l'altezza minima).
- `[major][spacing]` ThemeSwitcher 32px, Avvia 36px, Schermo intero 36px.
- `[minor][spacing]` "Vai alla Libreria" 32px.

### Tab Library — cyberpunk | 90s-party

**Screenshot:** `desktop-library-cyberpunk.png` · `desktop-library-90s-party.png`

### Tab Settings — cyberpunk | 90s-party

**Screenshot:** `desktop-settings-cyberpunk.png` · `desktop-settings-90s-party.png`

### Tab Info — cyberpunk | 90s-party

**Screenshot:** `desktop-info-cyberpunk.png` · `desktop-info-90s-party.png`

---

## Checklist raccomandazioni per viewport (input a US-107/108/109)

### Raccomandazioni globali (tutti i viewport)

- [ ] **[blocker][spacing]** Aumentare altezza minima `TabsTrigger` a ≥44px via CSS Tailwind o override Radix. Attualmente 28px su tutti i viewport. Impatta: tutti e 4 i tab, tutti i viewport. → **US-107**
- [ ] **[major][spacing]** Aumentare altezza minima bottoni `<Button>` (Avvia, Schermo intero, Vai alla Libreria) a ≥44px. Attualmente 32-36px. → **US-107**
- [ ] **[major][spacing]** Aumentare altezza `ThemeSwitcher` (`.theme-switcher`) a ≥44px. Attualmente 32px. → **US-107**

### Raccomandazioni mobile-portrait (390px)

- [ ] **[blocker][componente]** Spostare `ThemeSwitcher` fuori dall'header su mobile-portrait. Il fix è in coda su TSK-166. Quando TSK-166 è done, rimuovere `test.fixme()` in S4 di `ep022-fidelity-audit.e2e.ts`. → **TSK-166** (blocco)
- [ ] **[minor][layout]** Valutare se `overflow-x-auto` sulla TabsList è sufficiente o se servono tab più compatte / icone su mobile-portrait per ridurre scroll orizzontale. → **US-108**

### Raccomandazioni mobile (mobile-portrait + mobile-landscape)

- [ ] **[major][spacing]** TouchOverlay buttons (L, R, SEL, STA, Configura overlay) sotto i 44px. Attualmente 32-40px. Impatta l'usabilità touch. → **US-108**
- [ ] **[minor][layout]** Su mobile-landscape (390px height), il contenuto del tab Info è molto lungo e richiede scroll esteso. Valutare summarization o accordion. → **US-108**

### Raccomandazioni tablet (768px)

- [ ] **[minor][layout]** Il tablet a 768px usa il medesimo layout mobile. Valutare se introdurre un breakpoint intermedio che sfrutti meglio lo spazio orizzontale. → **US-109**

### Raccomandazioni desktop (1280px)

- [ ] **[minor][spacing]** I touch target < 44px su desktop sono meno critici (pointer:fine) ma violano comunque WCAG 2.5.5. Alzare la priorità se l'app è target di hybrid mouse/touch. → **US-109**

---

## Note metodologiche

- **Tipo di audit:** strutturale (DOM marker + accessibilità) — non pixel-diff.
- **Delta visivi tema:** I 32 screenshot mostrano le differenze cromatiche tra `cyberpunk` e `90s-party` (background, primary, font-heading) — la migrazione EP-020 risulta correttamente applicata.
- **S5 (WCAG 2.5.5):** le violazioni sono rilevate via `getBoundingClientRect().height`. Alcuni elementi potrebbero usare pseudo-element `::before`/`::after` per estendere il touch target: la verifica manuale è raccomandata prima di classificare come blocker definitivo.
- **Pre-TSK-166:** il test S4 su mobile-portrait è marcato `test.fixme()`. Non modificare il test — il fixme codifica il TARGET post-fix.
- **Prossima wave:** i delta `blocker` (tab triggers + ThemeSwitcher mobile-portrait) devono essere risolti in Wave B (US-107/108) prima di poter marcare EP-022 come done.
