---
id: PWA-ROBUST-001
tier: emergent
status: candidate
applies_to: { language: json, context: [robustness, design], platform: web-app-manifest }
severity_default: low
auto_fixable: true
created: 2026-06-01
source_tsk: TSK-045
promoted_from: ""
---
# PWA-ROBUST-001 — Dichiarare `id` nel Web App Manifest per identity stabile

**Regola:** i Web App Manifest devono dichiarare il campo `id` (W3C spec, supportato da
Chrome 96+, Edge 96+) per stabilire un'identita' univoca dell'app indipendente da `start_url`.
Senza `id`, i browser usano `start_url` come identity: se `start_url` cambia in futuro
(es. aggiunta di parametri query, cambio path), il browser tratta l'app come una nuova
installazione e gli utenti che la avevano installata come PWA perdono l'icona e lo stato.

**Rationale:** il campo `id` funge da "primary key" della PWA nel registro del browser.
Un `start_url: "/"` funziona come identity implicita finche' il path rimane `/` — ma
aggiungere un version param, un flag di debug o cambiare il base path invalida l'identity.
Il costo di dichiarare `id` e' zero (una stringa statica); il beneficio e' la protezione
delle installazioni utente contro cambi evolutivi di `start_url`.

**Esempio (bad):**
```json
{
  "name": "MyApp",
  "start_url": "/",
  "display": "standalone"
}
```
(Senza `id`, l'identity e' legata a `start_url: "/"` — fragile su cambi futuri.)

**Esempio (good):**
```json
{
  "id": "/",
  "name": "MyApp",
  "start_url": "/",
  "display": "standalone"
}
```
(Il valore di `id` puo' coincidere con `start_url` iniziale; va cambiato consapevolmente
solo se si vuole forzare una re-installazione. Deve essere un path relativo alla stessa
origin, senza fragment (`#`).)

**Note:** il campo `id` e' ignorato dai browser che non lo supportano (Safari <= 16.3,
Firefox, WebView Android < 96) — non introduce breaking change. Lighthouse audit PWA lo
segnala come advisory se assente.

**Provenienza:** emersa in review di TSK-045 (manifest.webmanifest, US-038/EP-010).
Gate umano richiesto per promozione a canonical (PATTERN §19.5).
