---
id: SVG-ASSET-001
tier: emergent
status: candidate
applies_to:
  language: svg
  framework: any
  context: [design, robustness]
severity_default: low
auto_fixable: false
created: 2026-07-03
source_tsk: TSK-169
promoted_from: ""
gate: human
---
# SVG-ASSET-001 — Brand SVG asset devono avere una strategia single-source esplicita

**Regola:** quando lo stesso SVG brand asset esiste a piu' path distinti nel repository
(es. `src/assets/logo.svg` importato da Vite + `public/icons/logo.svg` servito staticamente),
il team deve documentare esplicitamente la strategia di sincronizzazione adottata tra:

- **Opzione A (copy-on-write manuale)**: i file sono copie indipendenti; ogni TSK che modifica
  un file deve aggiornare anche le copie — documentato in `wiki/gaps.md` o nel DoD del TSK.
- **Opzione B (symlink)**: i file sono symlink verso un'unica sorgente; richiede verifica
  che il build tool (Vite) e il sistema di deployment gestiscano i symlink correttamente.
- **Opzione C (source unica + build step)**: un file e' la sorgente; il build step lo copia
  nelle destinazioni richieste (script npm, Vite plugin, ecc.).

In assenza di documentazione, la duplicazione silenziosa crea rischio di divergenza: se un
TSK aggiorna solo una delle copie, le altre restano all'asset precedente senza alcun errore
di build o test.

**Rationale:** i brand asset SVG sono modificati raramente ma in modo critico (redesign logo,
aggiornamento colori, fix accessibilita'). Ogni modifica deve propagarsi a tutte le copie.
La divergenza silenziosa e' particolarmente insidiosa perche':
- Non produce errori di build.
- Non produce fallimenti di test (nessun test verifica la coerenza hash tra copie).
- Puo' passare inosservata attraverso visual oracle (che testa un path, non tutti).
- Viene scoperta solo a runtime, quando un utente vede l'asset vecchio a un URL specifico.

**Esempio (bad — situazione attuale TSK-169, accettata perche' aggiornata contestualmente):**
```
packages/app/src/assets/soliboy-logo-horizontal.svg  ← Vite import in App.tsx
packages/app/public/icons/soliboy-logo-horizontal.svg ← servito a /icons/...
```
Nessuna documentazione della strategia. In TSK-169 entrambi aggiornati contestualmente
(corretto), ma il vincolo non e' enforced automaticamente.

**Esempio (good — Opzione A con documentazione):**
Aggiungere in `wiki/gaps.md` (o nel DoD dei TSK che toccano il logo):
```
INVARIANTE: soliboy-logo-horizontal.svg esiste in src/assets/ (Vite import) e
public/icons/ (static serve). Ogni modifica a uno dei due file DEVE aggiornare anche
l'altro contestualmente nello stesso TSK. [TSK-169, 2026-07-03]
```

**Esempio (good — Opzione C con build step):**
In `vite.config.ts`, usare un plugin che copia `src/assets/soliboy-logo-horizontal.svg`
in `public/icons/soliboy-logo-horizontal.svg` durante il build — eliminando la duplicazione.

**Provenienza:** emersa in review TSK-169 (US-106/EP-022 logo redesign). I file
`src/assets/soliboy-logo-horizontal.svg` e `public/icons/soliboy-logo-horizontal.svg`
hanno contenuto identico dopo TSK-169 ma non documentano la strategia di sincronizzazione.
Stesso pattern per `public/favicon.svg` e `public/icons/soliboy-favicon.svg`.
Gate umano richiesto per promozione a canonical (PATTERN §19.5).
