---
type: concept
sources: ["raw/soliboy-mockups/README.md", "raw/soliboy-mockups/assets/solids-theme.css"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [design-token, temi, solids, accessibilita]
---

# Temi e design token SoliDS
> Le schermate applicano il design system SoliDS token-based, con temi dark e cyberpunk selezionabili via attributo.

## Contesto

Le schermate applicano SoliDS (`@soli92/solids`), il design system token-based del progetto, con token semantici, classi utility e temi globali. [^src: raw/soliboy-mockups/README.md §Design system]

## Token e classi

I token semantici includono categorie colore (`--sd-color-text-*`, `--sd-color-bg-*`, `--sd-color-border-*`, `--sd-color-intent-*`, `--sd-color-primary-*`), spaziature (`--sd-space-*`), raggi (`--sd-radius-*`) e tipografia (`--sd-font-*`, font Inter / DM Sans / JetBrains Mono). [^src: raw/soliboy-mockups/README.md §Design system]

Sono presenti classi utility `sd-*` (es. `sd-card`, `sd-badge`, `sd-flex`). [^src: raw/soliboy-mockups/README.md §Design system]

## Temi

I temi globali sono applicati tramite l'attributo `data-theme` su `<html>`, con i valori `dark` e `cyberpunk`. [^src: raw/soliboy-mockups/README.md §Design system]

## Accessibilità

Il target touch minimo è 44px (`--sd-layout-touch-target-min`), a supporto dell'accessibilità (WCAG 2.5.8 / Apple HIG). [^src: raw/soliboy-mockups/README.md §Design system]

## Nota di integrazione reale

I valori esadecimali nei mockup sono approssimati; nell'app reale va importato il CSS di `@soli92/solids` e selezionato il tema via `data-theme`, mantenendo fedeli nomi di token e classi. [^src: raw/soliboy-mockups/README.md §IMPORTANTE per il progetto reale]

## Concetti correlati
[[layout-responsive]]

## Pagine collegate
[[solids]]
[[2026-06-01-mockups-ui]]
