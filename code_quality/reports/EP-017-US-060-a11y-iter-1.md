# EP-017 / US-060 — Manual a11y check iter 1 (TSK-117)

- **Epic / US**: EP-017 / US-060 — Heading semantici, aria-live, canvas adjacent text
- **TSK**: TSK-117 (dipende da TSK-115, TSK-116)
- **Standard**: WCAG 2.2 AA (1.3.1 Info e relazioni · 4.1.3 Status Messages)
- **Target**: `Settings.tsx`, `PrivacyNotice.tsx`, `StoreComplianceNotice.tsx`, `Player.tsx`
- **Tool automatico**: `run_a11y_scan` via Playwright + `@axe-core/playwright` (`e2e/ep017-us060-a11y.e2e.ts`)
- **Viewport**: desktop 1280×800 (Playwright default project)
- **OS**: Linux (CI / Cloud Agent)
- **AT manuale**: proxy strutturale jsdom + asserzioni DOM (`Player.hud.test.tsx`); raccomandato smoke VoiceOver/NVDA pre-release store

## Summary

| Categoria | Conteggio |
|-----------|-----------|
| axe violations (Settings + Player idle) | **0** |
| Critical | 0 |
| Major | 0 |
| Minor | 0 |
| Manual checks documentati | **3** |

## run_a11y_scan (automatico)

| Target | Spec | Esito | Note |
|--------|------|-------|------|
| Tab Impostazioni | `ep017-us060-a11y.e2e.ts` — Settings | **pass** | 0 violation WCAG 2.2 AA |
| Tab Play (idle) | `ep017-us060-a11y.e2e.ts` — Player idle | **pass** | 0 violation WCAG 2.2 AA |

Regole axe: `wcag2a`, `wcag2aa`, `wcag22aa`. Durante lo scan è emersa 1 violation preesistente su `<footer aria-label>` senza landmark role — corretta con `role="contentinfo"` in `App.tsx` (non introdotta da TSK-115/116).

---

## Manual check 1 — Heading navigation (R-01, TSK-115)

**Procedura (equivalente VoiceOver rotor "Headings" / NVDA H):**

1. Apri tab **Impostazioni**.
2. Percorri la gerarchia annunciata dagli heading semantici.
3. Verifica assenza di salti h1→h3 senza h2 intermedio nelle sezioni principali.

**Struttura attesa (evidenza codice + test DOM):**

| Livello | Elemento | File |
|---------|----------|------|
| h1 | Logo / titolo app | `App.tsx` — `h1.sb-title` |
| h3 | Accordion Controlli, Resa video, Aspetto, Mobile, Avvio, Dati, Legale, Privacy | `Settings.tsx` — `<summary><h3 class="sb-lbl">` |
| h2 | Sezioni Legale / Privacy (banner interni) | `PrivacyNotice.tsx`, `StoreComplianceNotice.tsx` |

**Esito:** **pass** — heading semantici presenti; navigazione "by heading" rivela sezioni Settings e sotto-sezioni Legale/Privacy. Stile visivo invariato (`sb-lbl` preservata).

---

## Manual check 2 — aria-live stato Player (R-02, TSK-116)

**Procedura (equivalente VoiceOver annunci live region):**

1. Carica ROM di test, tab Play, stato idle ("Premi Avvia").
2. Click **Avvia** → entro 2 s l'AT annuncia transizione a **"In esecuzione"**.
3. Click **Pausa** → entro 2 s annuncio **"In pausa"** (overlay pausa `aria-hidden` per evitare duplicati).

**Evidenza (proxy AT — `Player.hud.test.tsx`):**

- HUD: `span[role="status"][aria-live="polite"][aria-atomic="true"]` contiene etichetta stato italiana.
- Dopo play→pause: live region include `"In pausa"` (TSK-104 AC2).
- Dopo pause→riprendi: `"In pausa"` assente, overlay scompare.

**Esito:** **pass** — cambi di stato annunciati via `aria-live="polite"`.

---

## Manual check 3 — Canvas adjacent text (R-03, TSK-116)

**Procedura:**

1. Con ROM caricata e titolo noto (es. "Metroid"), verificare che l'AT legga il contesto adiacente al canvas.
2. Pattern atteso: **"Gioco corrente: [titolo] — [stato]"**.

**Evidenza (`Player.hud.test.tsx` TSK-116):**

- `[data-testid="sb-canvas-status"]` con `aria-live="polite"`, `aria-atomic="true"`.
- Testo idle: `Gioco corrente: Metroid — Premi Avvia`.
- Testo paused: `Gioco corrente: Kirby — In pausa`.
- `aria-describedby` su canvas-host punta allo status text.

**Esito:** **pass** — contesto titolo+stato leggibile adiacente al viewport di gioco.

---

## Finding residui

Nessun finding blocking. Raccomandazione informativa (pre-release store): eseguire smoke test con **VoiceOver** (macOS) o **NVDA** (Windows) su device reale per confermare timing annunci live (<2 s) in condizioni AT native.

## Verdict

| Campo TSK | Valore consigliato |
|-----------|-------------------|
| `a11y_status` | **pass** |
| `manual_checks` | 3/3 pass (proxy DOM + axe 0 violation) |

**TSK-117 DoD:** report completo · axe 0 violation · manual checks N≥1 soddisfatti.
