---
type: runbook
sources: ["management/kanban/EP-007-esperienza-mobile/US-111-validazione-device-android/US-111.md"]
status: draft
created: 2026-07-16
updated: 2026-07-16
tags: [android, mobile, capacitor, device, validation, runbook, ep-022]
---

# Android device validation — Runbook operativo

> Guida end-to-end per installare Soli-boy su un **dispositivo Android fisico** e
> completare TSK-178 (US-111). Checklist dettagliata:
> [`store-assets/device-validation-checklist.md`](../../store-assets/device-validation-checklist.md).
> Report da compilare: [`store-assets/android-validation-report.md`](../../store-assets/android-validation-report.md).

## Obiettivo

Confermare su hardware reale che i fix EP-022 (in particolare tab **Play** cliccabile in
portrait, US-105) e l'emulazione GB funzionano nel WebView Capacitor — non solo nel browser
emulato da Playwright.

## Cosa NON sostituisce questo runbook

| Strumento | Copertura | Limite |
|-----------|-----------|--------|
| Playwright `e2e:android` (profilo Pixel 7) | Pre-check responsive in Chromium | Non è WebView Capacitor né device fisico |
| `ep022-multi-viewport.e2e.ts` in CI | Regression browser | Stesso limite |
| Emulatore Android Studio | Utile per smoke TSK-059 | Non sostituisce TSK-178 su device fisico |

## Prerequisiti (Linux / CachyOS)

### Software

```bash
# JDK 17+ (Android Gradle Plugin)
sudo pacman -S jdk17-openjdk

# Android Studio (include SDK + platform-tools)
# Da AUR o installer ufficiale:
# paru -S android-studio
```

Variabili d'ambiente (aggiungi a `~/.bashrc`):

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
```

### Device fisico

1. **Impostazioni → Info telefono** → tap 7× su "Numero build" → modalità sviluppatore
2. **Opzioni sviluppatore** → **Debug USB** attivo
3. Collega via USB; accetta il prompt "Consenti debug USB"
4. Verifica:

```bash
adb devices
# Deve mostrare il device come "device" (non "unauthorized")
```

## Build e installazione

Tutti i comandi da `packages/app/`:

```bash
cd packages/app

# 1. Prepara web + sync Capacitor (script helper)
./scripts/android-device-prepare.sh

# 2. Apri Android Studio sul progetto nativo
npm run cap:open:android
```

In **Android Studio**:

1. Attendi Gradle sync
2. Seleziona il **device fisico** nel menu run (non solo emulatore)
3. **Run** (▶) — prima installazione può richiedere 2–5 min
4. L'app "Soli-boy" si apre nel WebView

### Installazione rapida da CLI (alternativa)

Con device collegato e progetto già generato:

```bash
npm run cap:run:android
```

## Pre-check agent (opzionale, prima del device)

Smoke Playwright su profilo **Pixel 7** (browser, non Capacitor):

```bash
cd packages/app
npm run e2e:android
```

Se fallisce qui, correggere prima di passare al device fisico.

## Sessione di validazione (TSK-178)

Segui la checklist in `store-assets/device-validation-checklist.md`.

### Ordine consigliato

1. **Portrait — 4 tab** (priorità P0: tab Play cliccabile, logo non in overlay)
2. **Portrait — ThemeSwitcher** solo in Impostazioni → accordion "Tema"
3. **Landscape — 4 tab** + TouchOverlay con ROM avviata
4. **Emulazione GB** con `dmg-acid2.gb`:
   - Carica ROM (file picker o asset pre-caricato)
   - Libreria → seleziona tile → Play
   - **Avvia** → canvas deve renderizzare (non nero) entro ~30s
5. **Pausa / background** — home button → riapri app → stato coerente
6. **Tema 90s-party** — ripeti almeno tab Play portrait

### ROM di test

| File | Path | Licenza |
|------|------|---------|
| `dmg-acid2.gb` | `packages/app/public/test-roms/dmg-acid2.gb` | MIT |

Trasferimento sul device: carica via **Carica ROM** nell'app (picker nativo Capacitor).

### Criteri pass/fail critici (US-105)

- **PASS**: in portrait, tap su tab **Play** attiva il pannello Play senza dover scrollare o zoomare
- **FAIL**: logo o header coprono il tab Play; tap non ricevuto; tab fuori viewport

## Compilazione report

Compila `store-assets/android-validation-report.md`:

- Modello device, versione Android, data
- Esito per ogni riga della checklist
- Screenshot opzionali (adb: `adb exec-out screencap -p > screenshot.png`)
- Blocker eventuali → issue GitHub o gap in `wiki/gaps.md`

Al completamento, aggiorna TSK-178 frontmatter `status: done` (gate umano).

## Troubleshooting

| Sintomo | Causa probabile | Azione |
|---------|-----------------|--------|
| `adb devices` vuoto | Cavo USB dati / driver | Cambia cavo/porta; `adb kill-server && adb start-server` |
| `unauthorized` | Prompt non accettato | Sblocca telefono, accetta debug USB |
| Gradle sync fail | SDK mancante | Android Studio → SDK Manager → API 34+ |
| Canvas nero in Play | Engine CDN invece di real | Su web: `?engine=real`; in Capacitor i core sono bundled — verifica build `npm run build` prima di sync |
| `android/` assente | Gitignored, non generato | `npx cap add android && npm run cap:sync` |
| WebView bianco | `dist/` stale | `npm run cap:build` |

## Riferimenti

- TSK-178: `management/kanban/EP-007-esperienza-mobile/US-111-validazione-device-android/TSK-178.md`
- Capacitor config: `packages/app/capacitor.config.ts`
- ADR-001 mobile shell: `design_&_architecture/decisions/ADR-001.md`
- Store checklist: `store-assets/checklist.md`
