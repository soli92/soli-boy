# `@soli-boy/app` — README interno

Codice applicativo Soli-boy (Vite + React + TypeScript). Per la panoramica del
progetto vedi il [README di repo](../../README.md); qui sotto solo note
operative per chi lavora dentro `packages/app/`.

> **Runtime:** Node **>=22** (vedi `engines` + `.nvmrc` di repo). Le toolchain
> aggiornate (Vite 8, Vitest 4, Capacitor 8) richiedono Node 22 LTS.

## Script

```bash
npm install
npm run dev        # dev server (vite)
npm test           # unit/integration (vitest)
npm run typecheck  # tsc --noEmit
npm run build      # build produzione (vite build)
npm run e2e        # end-to-end (playwright)
npm run cap:sync   # sincronizza dist/ + plugin nelle piattaforme native (Capacitor)
npm run cap:copy   # copia solo il web asset nelle piattaforme native
```

## Shell mobile — Capacitor (TSK-059, EP-007, ADR-001)

Capacitor è installato e configurato: `capacitor.config.ts` (`appId: com.soli92.soliboy`,
`appName: Soli-boy`, `webDir: dist`). La SPA Vite è il renderer mobile (WebView), riusata
1:1 come per il desktop. Plugin installati: `@capacitor/filesystem`, `@capacitor/app`,
`@capacitor/haptics`.

### Android — device fisico (TSK-178, Sprint 21)

Runbook completo: [`wiki/runbooks/android-device-validation-runbook.md`](../../wiki/runbooks/android-device-validation-runbook.md)

```bash
# Pre-check browser (profilo Pixel 7, non sostituisce device reale)
npm run e2e:android

# Prepara build + sync Capacitor
./scripts/android-device-prepare.sh

# Installa su device USB (Android Studio o CLI)
npm run cap:open:android    # Run ▶ su device in Android Studio
# oppure
npm run cap:run:android     # richiede adb + device autorizzato
```

Report validazione: [`store-assets/android-validation-report.md`](../../store-assets/android-validation-report.md)

### Prerequisiti nativi — gate umano (R.14)

L'aggiunta delle piattaforme native e la verifica su device/emulatore **non** sono
automatizzabili dall'agent (richiedono SDK/IDE nativi). Step a cura dell'owner:

```bash
# Prerequisiti: Android Studio + SDK, Xcode + CocoaPods, JDK 17+.
npm run build                 # produce dist/ (renderer)
npx cap add android           # scaffolding progetto Android (richiede Android SDK)
npx cap add ios               # scaffolding progetto iOS (richiede Xcode + CocoaPods)
npm run cap:sync              # sincronizza dist/ + plugin nelle piattaforme
npx cap run android           # avvio su emulatore Android
npx cap run ios               # avvio su simulatore iOS
```

DoD residua di TSK-059 (verifica su emulatore Android + simulatore iOS): gate umano,
da eseguire quando l'ambiente nativo è disponibile. La configurazione e i plugin sono
già pronti.

## Store submission — metadata (TSK-070, US-034)

Riferimento: TSK-070 §Technical Specs ("Aggiungere `privacy_policy_url` nei
metadati app... documentato nel README.md interno o in un runbook, non
nell'app stessa — l'URL specifico sarà definito dall'owner — gate umano per
la submission").

Quando si prepara la pubblicazione su **Google Play** e **Apple App Store**
l'owner deve fornire i seguenti metadati. L'app NON contiene URL hardcoded:
il cross-link verso la policy privacy resta in-app (sezione "Privacy" di
Settings, TSK-069), mentre l'URL pubblico è metadata della submission.

| Chiave | Valore | Note |
|---|---|---|
| `privacy_policy_url` | _da definire_ | URL pubblico della privacy policy. L'app è on-device (ADR-002 §Conseguenze): la pagina deve riflettere fedelmente il contenuto di `PrivacyNotice` (TSK-069). Gate umano. |
| `app_category` | Utilities / Entertainment | Coerente con la natura emulatore. |
| `content_rating` | da valutare | Procedura standard store; nessun contenuto adulto nell'app. |
| `data_safety` / `app_privacy` | "No data collected" | Coerente con ADR-002 e con il contenuto di `PrivacyNotice` (no account, no tracking, no telemetria). |

### Avviso legale in-app (R.14: no claim non verificabili)

L'app mostra in **Info & Privacy** (tab dedicata) i componenti `StoreComplianceNotice`
(TSK-070) e `LegalNotice` (TSK-006, US-006) con i testi richiesti per la
conformità store, ad esempio:

> Soli-boy non include, distribuisce né supporta ROM o BIOS coperti da
> copyright. Usa solo file di tua legittima proprietà.

Al primo avvio compare il banner privacy (`PrivacyNotice`, TSK-069). Il
`FileLoader` ha la propria nota contestuale al momento del caricamento.

### Checklist di submission (gate umano R.14 / R.15)

- [ ] Hosting pubblico della privacy policy → impostare `privacy_policy_url`.
- [ ] Screenshot delle schermate richieste dagli store (incluse `Settings → Legale` e `Settings → Privacy` per il rating).
- [ ] Compilare data safety (Google Play) / app privacy nutrition label (App Store) come "No data collected".
- [ ] Verificare conformità WebView Capacitor (iOS WKWebView, Android WebView aggiornata).

Fonte: `management/kanban/EP-008-conformita-e-pubblicazione-store/US-034-conformita-store/US-034.md` §Acceptance Criteria.
