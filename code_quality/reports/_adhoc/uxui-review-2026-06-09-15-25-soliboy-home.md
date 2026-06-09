---
report_id: uxui-review-2026-06-09-15-25-soliboy-home
target: http://127.0.0.1:4317/ (build dist servita via vite preview)
agent: ux-ui-reviewer (pipeline ADR-064, esecuzione reale)
mode: visual
rubric_strict: true
timestamp: 2026-06-09 15:25
verdict: conditional
evidence_dir: uxui-review-2026-06-09-15-25-soliboy-home/
supersedes_context: ep012-windowB-uxui-review-iter-1 (ALLUCINATO) + iter-2 (no-visual)
---

# UX/UI Review — soli-boy home (PRIMA review VISIVA reale, post ADR-064)

> **Significato di questo report**: è la prima review UX/UI di soli-boy prodotta con **evidenza
> visiva reale** (screenshot Playwright su build servita) + axe reale, dopo il fix ADR-064 che ha
> reso i tool effettivamente eseguibili (`Bash` + binding). iter-1 (EP-012) era ALLUCINATO
> (tool_uses:0), iter-2 era `no-visual` (tool non callable). Questo è ciò che gli agenti avrebbero
> dovuto fare dall'inizio: **guardare l'app che gira**.

## Evidenza (reale, verificabile)

- `uxui-review-2026-06-09-15-25-soliboy-home/screenshot_desktop_*.png` (1280×800, fullPage)
- `uxui-review-2026-06-09-15-25-soliboy-home/screenshot_mobile_*.png` (375×812, fullPage)
- `uxui-review-2026-06-09-15-25-soliboy-home/a11y.json` (axe wcag2a/aa/21aa/22aa, interactive)

## Esito: **conditional** — 0 critical, 1 major, 2 minor, 3 open_questions

| ID | rubric_ref | severità | evidenza | sintesi |
|---|---|---|---|---|
| F-01 | nielsen-8 (aesthetic-minimalist) + ui-visual-hierarchy | **major** | screenshot_desktop/_mobile | Lo stato idle (nessuna ROM) è dominato da un **muro di configurazione** completamente espanso (rimappatura controlli + BIOS + save-state + impostazioni video/tema/filtri). L'azione primaria (caricare una ROM / il viewport di gioco) non ha prominenza gerarchica: l'utente atterra su una parete di form. Manca progressive disclosure (settings dietro un accordion/tab). |
| F-02 | nielsen-2 (match real world) | minor | `Settings.tsx:397-411` (`<span class=sb-key>{key}</span>`) + screenshot | La sezione «Controlli — rimappatura» renderizza la **chiave grezza del profilo** come etichetta di riga, non un nome di controllo leggibile. Doppia evidenza: visiva (colonna di label tecniche) + codice. |
| F-03 | (a11y, delega EP-007) | minor | `a11y.json` → `landmark-unique` | Più landmark `section[role=region]` senza nome accessibile univoco. Da gestire nella capability a11y. |

## open_questions (richiedono contesto / fuori scope visivo)

1. **Stato funzionale con ROM caricata NON catturato.** Lo screenshot è lo stato idle: il viewport
   di emulazione, i controlli runtime e l'usabilità *del gioco in esecuzione* richiedono di caricare
   una ROM e guidare l'interazione → **oracolo funzionale**, fuori dallo scope di ADR-064 (review
   visiva). È la lacuna che spiega «funzionalmente non usabile»: nessuna capability attuale esercita
   il flusso load-ROM → play → save → resume. Candidato EP separata.
2. **Temi dark/light non differenziati** in questa passata (un solo theme catturato).
3. **Leggibilità fine** (contrasto, spaziatura, tipografia) limitata dalla risoluzione del fullPage:
   per giudizio puntuale servirebbero crop per-sezione.

## Finding SCARTATO (guard anti-fabbricazione ADR-063 §B — funzionante)

In prima lettura del thumbnail mobile avevo ipotizzato «etichette controlli corrotte/duplicate
(Accendi/Accelerati/AccelerSghi)». **Verifica `Grep` sul sorgente: 0 occorrenze** di quelle stringhe
→ era un **misread della bassa risoluzione**, non un difetto reale. Il finding **non è stato emesso**.
Questo è esattamente il guard di evidence-provenance che mancava in iter-1: nessun finding senza
evidenza tracciabile (screenshot esistente + riscontro nel sorgente).

## Raccomandazioni (non auto-applicate — R.P1)

1. **F-01**: portare load-ROM/viewport come azione primaria above-the-fold; spostare
   rimappatura/BIOS/save-state/impostazioni dietro tab o accordion (progressive disclosure).
2. **F-02**: mappare le chiavi profilo a label leggibili (es. tabella `key → nome controllo`).
3. **Funzionale (open_question 1)**: introdurre un oracolo funzionale che carichi una ROM di test
   ed esegua lo smoke del flusso di gioco — è ciò che chiude il gap «non funzionalmente usabile».
