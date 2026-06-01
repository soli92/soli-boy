---
id: PWA-DESIGN-002
tier: canonical
status: active
applies_to: { language: json, context: [design], platform: web-app-manifest }
severity_default: low
auto_fixable: true
created: 2026-06-01
source_tsk: TSK-045
promoted_from: ""
---
# PWA-DESIGN-002 — Dichiarare `lang` nel Web App Manifest per app localizzate

**Regola:** i Web App Manifest di app con lingua dichiarata (es. `<html lang="it">` nel
documento radice) devono dichiarare il campo `lang` corrispondente nel manifest, per
comunicare la lingua principale ai browser e agli store di app (ChromeOS, Play Store
via TWA, Edge Add-ons).

**Rationale:** il campo `lang` (BCP 47, es. `"it"`) nel manifest e' usato da alcuni
browser e aggregatori per presentare l'app nella lingua corretta agli utenti e per
l'indicizzazione nelle gallerie di app installabili. Omettere `lang` mentre il documento
HTML lo dichiara crea incoerenza tra manifest e documento — potenzialmente rilevata come
warning nei Lighthouse audit e negli audit di accessibilita' store.

**Esempio (bad):**
```json
{
  "name": "Soli-boy",
  "short_name": "Soli-boy",
  "display": "standalone",
  "start_url": "/"
}
```
(Il documento HTML ha `<html lang="it">` ma il manifest non dichiara `lang`.)

**Esempio (good):**
```json
{
  "lang": "it",
  "name": "Soli-boy",
  "short_name": "Soli-boy",
  "display": "standalone",
  "start_url": "/"
}
```

**Note:** il campo `lang` e' ignorato in contesti Electron/Capacitor (le shell native
non leggono il manifest per l'internazionalizzazione). Non introduce breaking change.

**Provenienza:** emersa in review di TSK-045 (manifest.webmanifest, US-038/EP-010).
Gate umano richiesto per promozione a canonical (PATTERN §19.5).
