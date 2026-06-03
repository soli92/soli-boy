# `@soli-boy/app` — README interno

Codice applicativo Soli-boy (Vite + React + TypeScript). Per la panoramica del
progetto vedi il [README di repo](../../README.md); qui sotto solo note
operative per chi lavora dentro `packages/app/`.

## Script

```bash
npm install
npm run dev        # dev server (vite)
npm test           # unit/integration (vitest)
npm run typecheck  # tsc --noEmit
npm run build      # build produzione (vite build)
npm run e2e        # end-to-end (playwright)
```

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

L'app mostra in `Settings → Legale` (componente `StoreComplianceNotice`,
TSK-070) il testo verbatim richiesto dal TSK:

> Soli-boy non include, distribuisce né supporta ROM o BIOS coperti da
> copyright. Usa solo file di tua legittima proprietà.

Il componente `LegalNotice` (TSK-006, US-006) resta visibile in calce a
ogni schermata come nota breve. Il `FileLoader` ha la propria nota
contestuale al momento del caricamento.

### Checklist di submission (gate umano R.14 / R.15)

- [ ] Hosting pubblico della privacy policy → impostare `privacy_policy_url`.
- [ ] Screenshot delle schermate richieste dagli store (incluse `Settings → Legale` e `Settings → Privacy` per il rating).
- [ ] Compilare data safety (Google Play) / app privacy nutrition label (App Store) come "No data collected".
- [ ] Verificare conformità WebView Capacitor (iOS WKWebView, Android WebView aggiornata).

Fonte: `management/kanban/EP-008-conformita-e-pubblicazione-store/US-034-conformita-store/US-034.md` §Acceptance Criteria.
