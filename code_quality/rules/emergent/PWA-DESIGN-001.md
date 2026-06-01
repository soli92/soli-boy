---
id: PWA-DESIGN-001
tier: emergent
status: candidate
applies_to: { language: json, context: [design, robustness], platform: web-app-manifest }
severity_default: low
auto_fixable: true
created: 2026-06-01
source_tsk: TSK-045
promoted_from: ""
---
# PWA-DESIGN-001 — Dichiarare `purpose` esplicito su ogni icon entry del Web App Manifest

**Regola:** ogni entry nell'array `icons` di un Web App Manifest deve dichiarare esplicitamente
il campo `purpose` (`"any"`, `"maskable"`, o `"any maskable"`). Un'entry senza `purpose`
agisce implicitamente come `"any"` ma non comunica l'intenzione al dev successivo e puo'
causare ambiguita' nei browser che selezionano l'icona in base al contesto (launcher Android,
splash screen, pinned tab).

**Rationale:** la specifica W3C Web App Manifest (https://w3c.github.io/manifest/#purpose-member)
permette il campo `purpose` come string space-separated oppure come entry distinte. Senza
`purpose` dichiarato, il browser assume `"any"` — che include usi non-maskable. Avere un'entry
senza `purpose` accanto a un'entry con `purpose: "maskable"` sullo stesso `src` crea
ridondanza non dichiarata e puo' confondere il browser nella selezione dell'icona corretta.
La best practice e' una entry per purpose, con `purpose` sempre esplicito.

**Esempio (bad):**
```json
{
  "icons": [
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```
(La prima entry non ha `purpose` esplicito — agisce come `any` ma non e' dichiarato.)

**Esempio (good):**
```json
{
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Note:** `"purpose": "any maskable"` in una singola entry e' valido ma deprecato dai Lighthouse
audit moderni (preferisce entry distinte per `any` e `maskable`).

**Provenienza:** emersa in review di TSK-045 (manifest.webmanifest, US-038/EP-010).
Gate umano richiesto per promozione a canonical (PATTERN §19.5).
