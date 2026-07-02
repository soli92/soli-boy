---
id: ep020-design-brief
type: design-brief
title: EP-020 — Art-Director DSL Design Brief
epic: EP-020
status: review-ready
created: 2026-07-02
updated: 2026-07-02
tags: [design-intelligence, art-director, ep020, tailwind, solids]
---

# EP-020 — Art-Director DSL Design Brief

Contratto visivo vincolante per la migrazione CSS-only → `@soli92/solids` + Tailwind.
Nessun agente FE può ignorare questo documento (R.D1 — Design Intelligence Layer §24).

---

## 1. Brand Identity Constraints

### Tema cyberpunk (showcase primario)

| Token | Valore | Ruolo |
|-------|--------|-------|
| `--sd-color-bg-canvas` | `#0C0E12` | Background canvas principale |
| `--sd-color-primary-default` | `#06b6d4` | Neon cyan — CTA, focus ring, link attivi |
| Accent danger | Magenta elettrico | Azioni distruttive / state danger |
| Radii sm | `2px` | Contrasto intenzionale con layout organico |
| Radii md | `4px` | Contrasto intenzionale con layout organico |
| Font heading | Orbitron | Titoli sezione, screen titles |
| Font body | Space Grotesk | Testo UI generale |
| Font mono | JetBrains Mono | HUD (fps, core, slot) — invariante gaming |
| Shadow interattivi | `box-shadow` neon cyan | Elementi interattivi attivi |

**Rationale:** Il tema cyberpunk è il tema showcase per le demo EP-020. Il contrasto tra i radii sharp (2-4px) e il layout organico dell'emulatore è intenzionale — evoca l'estetica HUD degli anni '90 senza regressioni sull'usabilità.

### Tema 90s-party (brand default)

| Token | Valore | Ruolo |
|-------|--------|-------|
| Canvas | Saturated purple | Background principale |
| Primary | Vivid magenta | CTA, link attivi |
| Radii md | `12px` | "Rave" — arrotondati |
| Radii lg | `16px` | Card, dialog |
| Font heading | DM Sans | Standard DS |
| Font body | Inter | Standard DS |
| Shadow | `--sd-shadow-sm/md` | Standard DS |

---

## 2. Component-to-Surface Mapping

| Superficie attuale | Componente solids target | Note |
|--------------------|--------------------------|------|
| `.sb-tab-bar` + `.sb-tab` | `<Tabs>` (Radix Tabs) | keyboard Arrow/Home/End |
| `.sb-dialog` overlay | `<AlertDialog>` (Radix) | focus trap + Esc + Portal |
| `.sb-switch` toggle | `<Switch>` (Radix) | Space keyboard |
| `.sb-slider` | `<Slider>` (Radix) | Arrow keyboard |
| `.sb-select` | `<Select>` (Radix) | Enter/arrow keyboard |
| `.sb-badge` | `<Badge>` | font xs, token-based |
| `.sb-button` | `<Button>` | varianti: default/ghost/destructive |
| HUD fps/core/slot | preservato CSS-only | font-mono invariante — non migrare |
| `.sb-screen` canvas | **invariante** | posizionamento, aspect-ratio, safe-area non toccati |
| TouchOverlay | styling → Tailwind, posizionamento → CSS-only | no JS motion |

---

## 3. Token Contract

### Autoritativi (`--sd-*`)

- Tutti i colori UI devono leggere da `--sd-*` CSS variables — **nessun colore hardcoded**.
- Le shadcn variables bridge (`--background`, `--primary`, `--card`, `--border`, `--ring`, `--muted`, `--accent`, ...) leggono da `--sd-*` tramite `@soli92/solids/css/shadcn.css`.

### Token invarianti (non rimpiazzabili da solids)

| Token | Motivo di preservazione |
|-------|------------------------|
| `--sd-color-accent-1..5` | Game tile art — palette per artwork ROM |
| `--sd-screen-bg` / `--sd-screen-accent` | Viewport emulatore — invariante visivo |
| `--sd-color-pad-a` / `--sd-color-pad-b` | TouchOverlay controller buttons |

### Cascade CSS (ordine di import in main.tsx / tailwind.css)

```
1. solids-theme.css       — token app-specific (override DS defaults)
2. @soli92/solids/css/index.css   — DS themes (--sd-* variables, tutti i temi)
3. @soli92/solids/css/shadcn.css  — bridge --sd-* → shadcn variables
4. app-extra.css          — WCAG AA overrides (alto specificità, non modificare)
5. tailwind.css           — @tailwind base/components/utilities (last)
```

**Regola:** nessun agente FE può riordinare questa cascade o spostare import in ordine diverso.

---

## 4. Tipografia

| Contesto | Font variable | Scale | Note |
|----------|---------------|-------|------|
| HUD (fps, core, slot, timing) | `var(--sd-font-mono)` | xs | Invariante gaming — JetBrains Mono |
| Headings (section title, screen title) | `var(--sd-font-heading)` | lg | DM Sans / Orbitron (cyberpunk) |
| Body / UI labels | `var(--sd-font-body)` | sm/md | Inter / Space Grotesk (cyberpunk) |
| Badge / Caption | `var(--sd-font-body)` | xs | |
| Button labels | `var(--sd-font-body)` | md | |

**Scala Tailwind:** `text-xs` (caption/badge), `text-sm` (body), `text-base` (button), `text-lg` (section heading).

---

## 5. Principi di Interazione

### Navigation & Focus

- **Tab navigation:** Radix Tabs con keyboard `Arrow` / `Home` / `End` — preserva ARIA `tablist` semantics. Nessun reimplementazione custom.
- **Focus visible:** `ring-2 ring-[--sd-color-primary-default]` su tutti gli elementi interattivi (WCAG AA 2.4.11).

### Dialogs & Overlays

- **Azioni distruttive:** Radix `AlertDialog` — focus trap obbligatorio, `Esc` per dismissal, Portal nativo (evita z-index wars).
- **Overlay non-distruttivi:** Radix `Dialog` — stesse garanzie di focus trap.

### Form Controls

- **Toggle:** Radix `Switch` — `Space` per toggle, aria-checked nativo.
- **Range:** Radix `Slider` — `Arrow` per incremento/decremento, step configurabile.
- **Select:** Radix `Select` — `Enter`/`Arrow` per navigazione, aria-expanded nativo.

### Superfici invarianti

- **TouchOverlay:** solo styling CSS migrato a Tailwind utilities. Posizionamento (absolute/fixed, safe-area inset) rimane CSS-only. **Nessun JS motion introdotto.**
- **Game canvas `.sb-screen`:** posizionamento, `aspect-ratio`, `object-fit`, safe-area padding — **non toccati da nessun TSK di Phase 2**.

---

## 6. Gating Rules (R.D1)

1. Ogni TSK FE di Phase 2 deve citare questo documento nel proprio frontmatter o corpo.
2. Nessun override di token `--sd-*` è ammesso senza ADR aggiuntivo.
3. Il `critic/judge` (TSK-142) valuterà il prototipo contro queste specifiche — il verdict è **non bloccante** (R.D3), advisory.
4. Qualsiasi deroga a questa spec richiede approvazione umana esplicita prima del merge.
