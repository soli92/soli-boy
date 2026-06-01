# test-roms — ROM per i test e2e

Cartella servita staticamente da Vite (raggiungibile a runtime come `/test-roms/<file>`).
Destinata alle ROM usate dall'e2e di emulazione reale (**TSK-024**, engine `EmulatorJsEngine`).

## Regole (vincolo legale del progetto)

- **Solo ROM con licenza libera / homebrew / pubblico dominio.** Nessun contenuto protetto da copyright.
- Indicare sempre fonte e licenza qui sotto quando si aggiunge un file.

## ROM consigliate (libere)

- **Tobu Tobu Girl** (Game Boy, homebrew, licenza libera) — https://tobutobugirl.itch.io / repo GitHub `SimonLarsen/tobutobugirl`.
- ROM di test/pubblico dominio per GB/GBA per smoke test del core.

## Inventario

| File | Piattaforma | Fonte | Licenza |
|------|-------------|-------|---------|
| dmg-acid2.gb | Game Boy | github.com/mattcurrie/dmg-acid2 (v1.0) | MIT |

> Per l'e2e GBA (TSK-028): aggiungere una ROM GBA libera come `free-gba-demo.gba` (o `SOLIBOY_E2E_GBA_ROM=<file>`) + whitelist in `.gitignore`.
