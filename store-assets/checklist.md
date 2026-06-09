# Store submission checklist — Soli-Boy (TSK-071, US-034)

> Package metadata per la submission su Google Play e Apple App Store.
> La submission effettiva è **gate umano** (account developer, firma, review store).
> Stato asset: ✅ pronto · 🟡 bozza/da rifinire · ⛔ gate umano (tooling/account).

## Google Play (Android)

| Requisito | Stato | Note |
|---|---|---|
| Package name | ✅ | `com.soli92.soliboy` (coerente con electron-builder appId + capacitor.config) |
| Hi-res icon 512×512 PNG | 🟡 | base in `packages/app/public/icons/icon-1024.png` → downscale a 512 (gate tooling immagine) |
| Feature graphic 1024×500 | ⛔ | da generare (design) — gate umano |
| Screenshot phone (≥2) | ⛔ | da catturare su device/emulatore reale (gate umano, no display in CI) |
| Screenshot tablet (≥2) | ⛔ | idem |
| Descrizione breve (80) | ✅ | vedi `listing-it.md` / `listing-en.md` |
| Descrizione completa (4000) | ✅ | vedi listing |
| Privacy policy URL | 🟡 | privacy on-device in-app (TSK-069) + URL pubblico da pubblicare (placeholder sotto) |
| Age rating (IARC) | ✅ | nessun contenuto 18+ → questionario IARC = PEGI 3 / Everyone |
| Data safety form | ✅ | nessuna raccolta dati: invariante on-device verificata (TSK-068 audit) |

## Apple App Store (iOS)

| Requisito | Stato | Note |
|---|---|---|
| App Store icon 1024×1024 PNG (no alpha) | ✅ | `packages/app/public/icons/icon-1024.png` (verificare assenza canale alpha in submission) |
| Screenshot 6.7" iPhone (≥1) | ⛔ | gate umano (device/simulatore) |
| Screenshot 12.9" iPad (≥1) | ⛔ | gate umano |
| Descrizione + keywords (100) | ✅ | vedi listing |
| Privacy policy URL | 🟡 | come sopra |
| Age rating 4+ | ✅ | nessun contenuto sensibile |
| Privacy nutrition label | ✅ | "Data Not Collected" — invariante on-device (TSK-068) |
| NSPhotoLibraryUsageDescription | 🟡 | richiesto solo se il file picker accede alla libreria foto; il caricamento ROM usa document picker (TSK-063) → usage string da aggiungere in Info.plist se Capacitor lo richiede |

## Privacy policy URL (placeholder)

Soli-Boy è **on-device**: nessun dato utente (ROM, salvataggi, BIOS) lascia il dispositivo
(verificato dall'audit TSK-068, invariante RISPETTATA). La policy completa è mostrata in-app
(TSK-069, PrivacyNotice). URL pubblico da pubblicare prima della submission:
`https://soli92.github.io/soli-boy/privacy` (da creare — gate umano).

## Note legali (TSK-070)

- Nessun core di emulazione proprietario o BIOS protetto incluso (core mGBA/WasmBoy open).
- L'utente fornisce le proprie ROM/BIOS legali (avviso no-ROM-protette già in-app, TSK-070).

## Riepilogo gate residui (umani)

1. Generazione feature graphic + screenshot reali su device (no display in ambiente agent).
2. Pubblicazione URL privacy policy pubblico.
3. Downscale icona 512 + verifica no-alpha 1024 (tooling immagine).
4. Submission effettiva con account developer + firma (Apple/Google).
