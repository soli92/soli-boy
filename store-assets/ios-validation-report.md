# iOS device validation report — Soli-Boy

> Template TSK-177. Sezioni compilate da:
> - **§Responsive fidelity** → TSK-182 (US-113)
> - **§WASM benchmark** → TSK-072 (US-035, EP-008)
>
> Checklist: [`device-validation-checklist.md`](device-validation-checklist.md)

## Metadata

| Campo | Valore |
|-------|--------|
| **Data** | YYYY-MM-DD |
| **Validatore** | |
| **Device model** | es. iPhone 15 Pro |
| **iOS version** | es. 17.5 |
| **Build app** | es. Capacitor debug da Xcode, commit `________` |
| **Temi testati** | ☐ cyberpunk · ☐ 90s-party |

---

## §Responsive fidelity (TSK-182 / US-113)

### Esito per area

| Area | Portrait | Landscape | Note |
|------|----------|-----------|------|
| Tab Play (US-105 anti-regressione) | ☐ Pass · ☐ Fail | ☐ Pass · ☐ Fail | |
| Tab Libreria | ☐ Pass · ☐ Fail | ☐ Pass · ☐ Fail | |
| Tab Impostazioni | ☐ Pass · ☐ Fail | ☐ Pass · ☐ Fail | |
| Tab Info | ☐ Pass · ☐ Fail | ☐ Pass · ☐ Fail | |
| ThemeSwitcher in Settings (portrait) | ☐ Pass · ☐ Fail | N/A | |
| Safe area (notch / home indicator) | ☐ Pass · ☐ Fail | ☐ Pass · ☐ Fail | |
| TouchOverlay | ☐ Pass · ☐ Fail | ☐ Pass · ☐ Fail | |

### Emulazione GB (`dmg-acid2.gb`)

| Step | Esito | Note |
|------|-------|------|
| Carica ROM | ☐ Pass · ☐ Fail | |
| Avvio da Libreria | ☐ Pass · ☐ Fail | |
| Canvas renderizzato | ☐ Pass · ☐ Fail | |
| Pausa / Riprendi | ☐ Pass · ☐ Fail | |
| Input touch | ☐ Pass · ☐ Fail | |
| Background / foreground | ☐ Pass · ☐ Fail | |

### Giudizio responsive

- **Esito:** ☐ Pass · ☐ Fail · ☐ Parziale
- **Blocker:** ☐ Sì · ☐ No

### Azioni correttive (responsive)

| # | Descrizione | Priorità | Issue/TSK |
|---|-------------|----------|-----------|
| 1 | | | |

---

## §WASM benchmark (TSK-072 / US-035)

### Metriche gameplay

| Piattaforma emulata | ROM | FPS misurato | Target | Pass |
|--------------------|-----|--------------|--------|------|
| Game Boy | `dmg-acid2.gb` | | 60 fps stabile | ☐ |
| GBA | `gba-tests-thumb.gba` | | 60 ± 5 fps | ☐ |

### Altre metriche

| Metrica | Misurato | Target | Pass |
|---------|----------|--------|------|
| Latenza input touch | | < 100 ms percepita | ☐ |
| CPU/batteria in background (dopo pausa) | | ~0 | ☐ |

### Policy App Store §4.7 (emulatori)

- **Stato al momento della validazione:** ☐ Conforme · ☐ Da verificare · ☐ Non conforme
- **Note / link linee guida consultate:** |

### Giudizio WASM

- **Esito:** ☐ Accettabile · ☐ Non accettabile
- **Blocker per App Store:** ☐ Sì · ☐ No

### Azioni correttive (WASM)

| # | Descrizione | Priorità | Issue/TSK |
|---|-------------|----------|-----------|
| 1 | | | |

---

## Screenshot (opzionale)

| Sezione | Viewport | File / link |
|---------|----------|-------------|
| Responsive | Portrait — tab Play | |
| Responsive | Gameplay portrait | |
| WASM | GB gameplay | |
| WASM | GBA gameplay | |
