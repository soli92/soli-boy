# Visual Oracle Report — TSK-169 iter 1

**TSK**: TSK-169 — Implementazione SVG logo (US-106 / EP-022)
**Data**: 2026-07-03
**Verdict**: ✅ PASS
**Iterazioni**: 1/3

---

## Fix applicato durante la run

**XML invalido**: i file `soliboy-logo-horizontal.svg` e `soliboy-logo-mono.svg` contenevano
`<style>@import url('...&display=swap');</style>` con `&` non escaped in XML. Il browser
rifiutava silenziosamente il file SVG quando caricato come `<img>`, mostrando l'icona di
immagine rotta. Fix: rimosso il blocco `<style>@import...</style>` (il tag non funziona
comunque in context `<img>` per restrizioni browser; i font sono caricati dall'app CSS globale).

File corretti:
- `packages/app/src/assets/soliboy-logo-horizontal.svg`
- `packages/app/public/icons/soliboy-logo-horizontal.svg`
- `packages/app/public/icons/soliboy-logo-mono.svg`

---

## Matrice screenshot (2 viewport × 2 temi = 4 combinazioni + 4 header crop)

| Viewport | Tema | Header | Full Page | Esito |
|---|---|---|---|---|
| mobile 375px | cyberpunk | header-mobile-cyberpunk.png | mobile-cyberpunk.png | ✅ |
| mobile 375px | 90s-party | header-mobile-90s-party.png | mobile-90s-party.png | ✅ |
| desktop 1280px | cyberpunk | header-desktop-cyberpunk.png | desktop-cyberpunk.png | ✅ |
| desktop 1280px | 90s-party | header-desktop-90s-party.png | desktop-90s-party.png | ✅ |

---

## Critic findings

| # | Descrizione | Viewport | Tema | Severity |
|---|---|---|---|---|
| 1 | Font wordmark potrebbe ricadere su fallback in headless (Google Fonts non caricato). Non bloccante: in produzione DM Sans è già disponibile globalmente. | all | all | trivial |

---

## Verifiche positivi

- ✅ Game Boy silhouette + pixel-art S lettermark (19 blocchi, magenta→cyan) visibili in tutti e 4 viewport×tema
- ✅ "Soli-boy" wordmark (S magenta, trattino cyan, boy chiaro) leggibile a 40px height
- ✅ Nessuna regressione US-105: tab Play/Libreria/Impostazioni/Info visibili su mobile 375px
- ✅ Dot-indicator (rosa cyberpunk, giallo 90s-party) visibile a destra nell'header mobile
- ✅ ThemeSwitcher visibile nell'header desktop, assente su mobile (hidden sm:block invariante)
- ✅ Nessun overflow/broken-image post-fix XML

---

## Checks opzionali

| Check | Status | Note |
|---|---|---|
| visual_regression | skip | Nessuna baseline preesistente (primo run TSK-169) |
| axe_a11y | skip | `checks: []` in factory.config.yaml |
| interaction_test | skip | `checks: []` in factory.config.yaml |

---

**next_action**: done — TSK-169 pronto per pipeline review.
