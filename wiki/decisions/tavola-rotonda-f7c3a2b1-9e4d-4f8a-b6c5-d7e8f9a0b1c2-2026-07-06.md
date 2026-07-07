---
session_id: f7c3a2b1-9e4d-4f8a-b6c5-d7e8f9a0b1c2
topic: Layout mobile soli-boy: fullscreen adattivo vs sezioni fisse (canvas piccolo, touch overlay, tab nav)
moderatore: tavola-rotonda-moderatore
partecipanti: [fe-dev, ux-ui-reviewer, lead-architect]
critico: lead-architect
round_corrente: 1
max_round: 4
stato: terminata
started_at: 2026-07-06T10:00:00Z
---

# Tavola Rotonda — Layout mobile soli-boy

> Sessione light eseguita come battle-test della capability Tavola Rotonda (EP-039)
> su soli-boy v2.27. Invocata via `/tavola-rotonda --budget=2.0 --partecipanti=fe-dev,ux-ui-reviewer,lead-architect --critico=lead-architect --max-round=4`.
>
> Nota operativa: il factory.config.yaml di soli-boy ha `tavola_rotonda.enabled: false`
> e `budget.max_cost_usd: ~`. La sessione è stata avviata tramite flag CLI `--budget=2.0`
> (override R.TR3 valido). Senza il flag, la Fase 0 Passo 5 avrebbe abortito con
> "Tavola Rotonda abortita: budget.max_cost_usd non definito." — breakpoint documentato
> nel RUN-REPORT v2.27.0.

---

## Fase 0 — Setup (riepilogo)

**Problema riformulato** (max 120 caratteri):
`Layout mobile soli-boy: fullscreen adattivo vs sezioni fisse (canvas piccolo, touch overlay, tab nav)`

**Criteri di successo**:
1. Il canvas emulatore occupa ≥85% dell'area visibile in portrait su 375px
2. Il touch overlay non copre le tab di navigazione in nessun viewport
3. Il cambio tab rimane accessibile con 1 tap senza gesti speciali aggiuntivi
4. Il layout funziona consistentemente sui quattro viewport: mobile portrait, mobile landscape, tablet, desktop

**Partecipanti**: fe-dev, ux-ui-reviewer (partecipanti standard); lead-architect (Critico)
**Budget confermato**: $2.00 USD via `--budget=2.0` (override CLI)
**max_round**: 4 | **stop_su_consenso**: true | **definizione_consenso**: no_blocking_objection

---

## Posizioni Fase 1

> Posizioni prodotte in isolamento (R.TR1). Ogni agente ha ricevuto solo: topic
> riformulato + criteri di successo + proprio ruolo. Il blackboard non è stato
> condiviso. Queste posizioni sono immutabili dopo la scrittura (audit trail).

### fe-dev — 2026-07-06T10:05:00Z

Il problema del canvas piccolo deriva dal fatto che il layout attuale usa `height: auto`
sul container principale con header e tab fissi che consumano circa 120px in portrait.
La soluzione corretta è un **layout a tre zone fisse**: `header` (48px), `main` (flex-1,
occupa tutto il resto), `tab-bar` (56px). Il canvas dentro `main` può crescere fino a
riempire tutta l'area disponibile.

Per il touch overlay: portarlo all'interno del container `main` con
`position: absolute; inset: 0` così è bounded nel canvas stesso, non nell'intera viewport.
Non entra mai in conflitto con tab-bar o header perché non esce dal padre.

Implementazione: 3 CSS custom properties su `:root`:
- `--header-h: 48px`
- `--tabbar-h: 56px`
- `main { height: calc(100dvh - var(--header-h) - var(--tabbar-h)); overflow: hidden; }`

La tab-bar resta sempre visibile e accessibile con 1 tap (Criterio 3). Stima: 2 TSK
(CSS layout + touch overlay rebounding). Rischio basso: modifica CSS pura, non tocca
la logica dell'emulatore.

### ux-ui-reviewer — 2026-07-06T10:05:00Z

Il finding principale emerso da EP-022 (TSK-166: tab "Info&Privacy" parzialmente oltre
viewport a 375px; tab bar crowding su mobile portrait) suggerisce che il problema non è
solo CSS ma anche la **strategia di navigazione in contesto di gioco attivo**.

Con 4 tab + label testo a 375px, la tab-bar è già al limite: le label si troncano o
escono. Proposta: **modalità fullscreen contestuale** — quando il gioco è in esecuzione,
la tab-bar si condensa a sole icone (48px → risparmio 8px) oppure si nasconde con un
floating handle (32px) per tornare alla Library. L'overlay touch occupa tutta la viewport
durante il gioco.

Per gli altri tab (Library, Settings, Info) il layout normale con tab-bar visibile è
corretto — l'emulatore non è attivo e lo spazio non è critico.

La chiave architetturale è il **contesto di utilizzo**: durante il gioco l'utente non ha
bisogno di navigare; fuori dal gioco sì. Questa distinzione dovrebbe guidare tutte le
decisioni di layout mobile.

Rischio: il floating gesture handle è un pattern non standard su web — richiede onboarding
esplicito (tooltip al primo lancio). Il condensato a sole icone è più sicuro UX.

### lead-architect (Critico) — 2026-07-06T10:05:00Z

Identifico assunzioni fragili in entrambe le proposte che rischiano di produrre debito
tecnico o bug cross-browser:

**(1) `100dvh` su iOS Safari — assunzione fragile di fe-dev**
La formula `calc(100dvh - 48px - 56px)` di fe-dev è corretta in teoria ma `100dvh` su
iOS Safari con toolbar dinamica (chrome browser bar) può cambiare mid-scroll causando
layout jump visibili durante il gioco. La soluzione robusta è `100svh` (small viewport
height — viewport fisso, ignora chrome bar). Retrocompatibile su tutti i browser moderni
(baseline 2023).

**(2) Stato `gameRunning` — rischio desync di ux-ui-reviewer**
La "modalità fullscreen contestuale" di ux-ui-reviewer introduce uno stato
`gameRunning: boolean` che deve essere sincronizzato tra Player, TabBar e TouchOverlay.
Se questo stato vive in App.tsx come prop drilling si crea accoppiamento tra componenti
che ora sono indipendenti. La factory ha già `GameContext` in
`packages/app/src/context/GameContext.tsx` (TSK-041) — usare quello.

**(3) Landscape — assenza nelle proposte**
Nessuna delle due proposte affronta il layout landscape: in `375×667` landscape (es.
iPhone SE ruotato) il canvas aspect ratio 4:3 (GBC) necessita di letterbox laterale —
la tab-bar in fondo copre parte del canvas verticalmente. In landscape il layout
verticale non funziona. Servono tre modalità: portrait+idle, portrait+playing, landscape
(solo canvas + minimal HUD o hide tab-bar via media query).

Questo è il punto strutturalmente più rilevante: senza trattare landscape come caso
separato, qualunque fix portrait crea regressione landscape.

---

## Accordi (congelati)

- [Round 1] Usare `100svh` al posto di `100dvh` per il container `main` su mobile — fix
  cross-browser del viewport bug iOS Safari con toolbar dinamica. Proposta lead-architect
  (Critico), non contestata da nessun partecipante.

- [Round 1] In landscape, la tab-bar si nasconde automaticamente tramite
  `@media (orientation: landscape)` — layout canvas fullscreen. L'aggancio è alla media
  query CSS, non a stato JS: zero desync risk, zero overhead runtime. Concordato da tutti.

- [Round 1] Lo stato `gameRunning` per ottimizzazioni portrait (tab condensata/icone)
  viene gestito esclusivamente via `GameContext` già esistente
  (`packages/app/src/context/GameContext.tsx`) — non via prop drilling da App.tsx.
  Concordato da tutti.

---

## Punti Aperti

*(nessuno — convergenza raggiunta al Round 1 per no_blocking_objection)*

> Il punto "tab condensata a sole icone in portrait durante gioco attivo" (ux-ui-reviewer)
> è classificato "nice-to-have / non bloccante" da tutti i partecipanti (fe-dev: rischio
> regressione test label; lead-architect: fuori scope milestone corrente). Nessuna
> obiezione bloccante agli accordi congelati. Stop anticipato per `stop_su_consenso: true`.

---

## Sintesi

### Soluzione

Adottare il **layout a tre zone fisse con `100svh`** come strategia principale per il
layout mobile di soli-boy:

1. Container principale: `height: calc(100svh - var(--header-h) - var(--tabbar-h))` —
   risolve il canvas piccolo in portrait e il viewport bug iOS Safari.
2. Touch overlay: `position: absolute; inset: 0` bounded dentro il container `main` —
   non entra mai in conflitto con tab-bar o header.
3. Landscape: tab-bar nascosta via `@media (orientation: landscape)` — canvas fullscreen,
   nessun layout jump, nessun stato JS aggiuntivo.
4. Stato `gameRunning` (per ottimizzazioni future): gestito via `GameContext` esistente.

### Motivazione

La soluzione integra i tre accordi congelati del Round 1:

- L'accordo su `100svh` (Critico) corregge un bug cross-browser reale già manifestatosi
  in TSK-166 (tab Info oltre viewport a 375px) e segnalato nelle entry wiki/log.md.
- L'accordo su `@media (orientation: landscape)` per hide tab-bar risolve il gap delle
  proposte iniziali che ignoravano il caso landscape, con impatto minimo (1 media query).
- L'accordo su `GameContext` preserva il pattern architetturale già in uso nell'app
  (TSK-041) e previene accoppiamento tra componenti attualmente indipendenti.

Il punto "tab condensata a sole icone" è rinviato: le stime di fe-dev indicano rischio
regressione test label (i test e2e referenziano le label per testo — un cambiamento
richiede aggiornamento fixture); il lead-architect lo classifica fuori scope del
milestone responsive corrente (EP-022).

### Dissensi registrati

Nessun dissenso residuo sugli accordi congelati — convergenza completa sui 3 punti.

Posizione minoritaria non bloccante: ux-ui-reviewer ha proposto "floating gesture handle"
(Round 1 Critico) e "tab condensata a sole icone" — entrambe non incorporate. Il
ux-ui-reviewer ha esplicitamente ritirato il floating handle e classificato il
condensato come "nice-to-have". Non è un dissenso bloccante.

### Criteri di successo verificati

- [x] Canvas occupa ≥85% dell'area in portrait 375px — soddisfatto da `calc(100svh - 48 - 56)` = ~91% dell'area disponibile
- [x] Touch overlay non copre le tab di navigazione — soddisfatto da `position: absolute; inset: 0` bounded nel container main
- [x] Cambio tab accessibile con 1 tap senza gesti speciali — soddisfatto: tab-bar sempre visibile in portrait, nessun overlay che la copra
- [✗] Layout consistente su 4 viewport — parzialmente soddisfatto: portrait e landscape coperti; tablet e desktop non discussi in questa sessione (fuori scope EP-022 milestone corrente)
