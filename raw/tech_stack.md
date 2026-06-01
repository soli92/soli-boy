# Tech Stack — soli-boy (vincoli inviolabili)

Stack derivato verbatim dalle Specifiche Funzionali v1.0 e dall'integrazione mobile
(vedi `raw/2026-06-01-specifiche-funzionali.txt §5` e `raw/2026-06-01-integrazione-mobile.txt §3`).
Fonte #1 inviolabile per il `lead-architect` (PATTERN §11 / §14, stack_mode: guided → confermato).

## Vincoli confermati

| Livello | Tecnologia | Note vincolo |
|---|---|---|
| Linguaggio | TypeScript | Tipizzazione statica su tutta la codebase. |
| Framework UI | React | Interfaccia a componenti. |
| Design system | solids (soli92/solids) v1.14.1 | Fonte unica di verità UI: componenti, token, temi, accessibilità. Uso esclusivo dei token, no stili hard-coded. |
| Build tool | Vite | Bundling, dev server, build di produzione. |
| Emulazione | EmulatorJS (core Libretro WASM) | Gambatte (GB/GBC), mGBA (GBA), FBNeo/MAME (arcade). No core proprietari. |
| Persistenza | IndexedDB (via idb) | ROM, save state, SRAM, configurazioni — on-device. |
| Input | Gamepad API | Tastiera + gamepad; identico web/desktop; controller BT su mobile. |
| Shell desktop | Electron | Filesystem nativo, IPC, packaging, core offline. |
| Shell mobile | Capacitor | WebView + plugin nativi (Android/iOS). React Native esplicitamente sconsigliato. |

## Vincoli trasversali (non funzionali)

- **Privacy/Sicurezza**: nessun invio dei file utente a server esterni; core in contesto isolato; dati e salvataggi solo on-device.
- **Legale**: nessuna distribuzione di ROM/BIOS protetti; avviso esplicito in app.
- **Portabilità**: codebase condivisa web/desktop/mobile; pacchetti Win/macOS/Linux + Android/iOS.
- **Cross-Origin**: per i core WASM con threading, header COOP/COEP sul server web.
- **iOS**: WebAssembly via WebView di sistema; limiti JIT/prestazioni e policy App Store da validare (rischio aperto).

## Note di governance

- SAML/OIDC/SOAP: non applicabili (nessuna autenticazione richiesta dalle specifiche).
- Tecnologie esplicitate nei requisiti = obbligatorie, non sostituibili con alternative (PATTERN §11).
