---
name: premortem-protocol
description: Protocollo per eseguire una premortem strutturata su un piano/artefatto via prospective hindsight (PATTERN §3 operazione opzionale, v2.16). 5 fasi (Context Gathering → Frame Setting → Raw Premortem → Parallel Deep-Dives → Sintesi). Output Risk Registry con tassonomia Tigers/Paper Tigers/Elephants. Opt-in totale, niente invariante §7 (R.P1-R.P3 vivono qui).
---

# Protocollo Premortem (analisi del rischio via prospective hindsight)

Riferimenti: PATTERN §3 (operazione opzionale `Premortem` v2.16), §5 (frontmatter
opt-in `risk_classification:`), §7 (no nuova invariante — R.P1-R.P3 vivono in
questa skill), [[premortem-skill]] (concept teorico), [[risk-classification-tigers-paper-tigers-elephants]]
(tassonomia output), [[factory-premortem-integration]] (design doc v2.16).

Questa skill è **provider-agnostic**: l'inferenza viene fatta dall'LLM ospitante.
Definisce le 5 fasi che ogni invocazione di premortem deve seguire. È invocata
dal comando `/premortem` (Claude Code), o direttamente come skill da agent che
ne fanno uso esplicito (PM, Arch, Code Reviewer in modalità suggerimento).

## Chi può eseguirla

| Ruolo | Trigger naturale | Note |
|---|---|---|
| **Utente diretto** | `/premortem <descrizione \| EP-XXX \| US-YYY \| TSK-ZZZ \| wiki-page>` | Modalità on-demand, sempre disponibile |
| **PM** (`product-manager`) | prima di `Promote EP draft → review` su epica `high-impact` | Suggerito, mai automatico |
| **Arch** (`lead-architect`) | prima di `Promote design doc draft → approved` su decisioni cross-cutting | Suggerito, mai automatico |
| **Code Reviewer** (`code-reviewer`) | verdict `conditional` su TSK con `risk_classification.tier: tiger-*` | Solo come suggerimento nel `task_package`; mai esecuzione automatica |
| **Orchestrator** | `/run` su wave con artefatti `risk_classification: high-impact` | Solo come suggerimento in dashboard; mai dispatch automatico |

In tutti i casi: invocazione manuale via `/premortem`. Mai auto-trigger (R.P3 opt-in totale).

## Quando attivarla

**Usare** quando il costo di sbagliare è alto e si può ancora cambiare rotta:

- prima di un PATTERN bump major (es. v2.x → v3.0) o di una nuova invariante §7
- prima di promote di un'**epica `high-impact`** draft → review
- prima di promote di un **design doc** con touchpoint cross-cutting (es. nuova
  operazione canonica §3)
- prima di una migrazione architetturale importante (es. CCL Fase 3b wiki-as-graph
  attivazione, R.K1-type)
- prima di un'assunzione chiave non verificabile a priori
- quando la confidence degli stakeholder è alta e va stress-testata
- quando il team ha una brutta sensazione non articolata

**NON usare** per:
- validazione/feedback generico (usa `/code-review` o discussione libera)
- domande fattuali («come fa X a fare Y?» — usa `/query` su wiki)
- brainstorming creativo (anti-pattern: la premortem è retrospettiva, non
  generativa di alternative)
- decisioni già irrevocabilmente prese (perdita di tempo — la premortem serve a
  cambiare rotta, non a confermare con sensi di colpa)

Regola pratica: invoca premortem **quando hai ancora margine di manovra e la
posta è alta**. [^src: wiki/concepts/premortem-skill.md §Quando usarla]

## Invarianti R.P1-R.P3

Tre regole leggere specifiche di questa skill. **Non sono regole §7 PATTERN** —
vivono qui, possono essere violate in casi specifici senza rompere il framework
(ma con perdita di valore del pattern). [^src: wiki/concepts/factory-premortem-integration.md §5]

- **R.P1 — Output mai auto-applicato**. Il `revised_plan` e la `pre-launch
  checklist` sono **sempre** suggerimenti per l'utente. Mai modifica automatica
  del piano originale (EP/US/TSK body invariato; il frontmatter `risk_classification:`
  può essere suggerito per edit ma mai applicato in autonomia).
- **R.P2 — Bar minimo del contesto**. La skill **non procede** se Fase 1 Context
  Gathering non soddisfa le 3 domande chiave (cosa stai facendo, per chi, come
  appare il successo). Output forzato su contesto insufficiente è sanitizzato →
  preferire fail-loud, non fail-silent. (Logica completa in TSK-005.)
- **R.P3 — Opt-in totale**. Factory v2.15 senza la skill scaffoldata si comporta
  identica. Niente lint ERROR se la skill è assente. Niente trigger automatico
  per parole chiave nel testo (decisione ADR-003: solo `/premortem` esplicito).

## Fase 1 — Context Gathering

**Placeholder** — implementazione completa in TSK-005.

Input atteso:
- Descrizione libera, oppure
- ID artefatto kanban (`EP-XXX`, `US-YYY`, `TSK-ZZZ`), oppure
- Path pagina wiki

Output prodotto:
- Dossier in memoria con: target, stakeholder, criteri di successo, contesto
  storico (memory/episodic ultime 10 entry), wikilink di primo hop.

Criterio di completamento:
- Le 3 domande del bar minimo soddisfatte (cosa / per chi / come appare il
  successo). Se manca un elemento → fail-loud, una domanda alla volta finché
  il bar è soddisfatto. Niente premortem su contesto sotto-bar.

Vedi TSK-005 per la procedura completa del bar minimo + fail-loud.

## Fase 2 — Frame Setting

Il **meccanismo psicologico centrale**: la skill enuncia esplicitamente la frase
chiave verbatim:

> «È [N mesi] da oggi. Questo piano è fallito.»

Senza questa frase, il modello LLM resta in modalità ottimistica (pianificazione)
invece di passare in modalità retrospettiva (spiegazione del fallimento come
fatto compiuto). [^src: wiki/concepts/premortem-skill.md §Fase 2]

### Timeframe-default per tipologia di target

| Target | Timeframe default | Override flag |
|---|---|---|
| TSK singolo | 2-4 settimane | `--timeframe=2w` |
| US singola | 1-3 mesi | `--timeframe=2mo` |
| EP completa | 6 mesi | `--timeframe=6mo` |
| PATTERN bump major (R.K1-type) | 12-18 mesi | `--timeframe=12mo` |
| Strategia / nuova adapter | 12-18 mesi | `--timeframe=18mo` |

Il timeframe è inferito automaticamente dal target ma sempre override-abile
inline con `--timeframe=<N>w|<N>mo`. [^src: design_&_architecture/proposta-premortem-integration-v216.md §3.2 Fase 2]

Input atteso: dossier di Fase 1.
Output prodotto: frase verbatim emessa al modello + timeframe selezionato.
Criterio di completamento: la frase è stata enunciata letteralmente nel contesto
dell'inferenza successiva (verifica grep sulla trascrizione interna se necessario).

## Fase 3 — Raw Premortem

Genera failure reasons per categoria. Cinque categorie standard. Numero non
fisso: **completezza, non padding**. Stop quando la skill non genera più
ragioni non-banali. [^src: wiki/concepts/premortem-skill.md §Fase 3]

### Le 5 categorie di failure reasons

#### Execution

Cosa va male nell'esecuzione del piano (risorse, tempo, processo).

- *Esempio 1*: «La timeline di 3 mesi era irrealistica perché abbiamo
  sottostimato il refactor delle dipendenze legacy. A 6 settimane eravamo già
  al 70% del budget di tempo con il 30% del lavoro fatto.»
- *Esempio 2*: «Scope creep silenzioso: ogni sprint il PM ha aggiunto 1-2 US
  "piccole" senza re-stimare. A fine quarter avevamo raddoppiato lo scope
  iniziale senza accorgercene.»

#### External

Eventi esterni alla tua zona di controllo (mercato, normativa, competitor).

- *Esempio 1*: «Un competitor ha rilasciato la stessa feature 2 settimane prima
  di noi, in versione gratis. Il nostro pricing è diventato insostenibile.»
- *Esempio 2*: «Una nuova normativa GDPR-bis ha richiesto un audit obbligatorio
  prima del lancio che non avevamo pianificato. Slittamento di 4 mesi.»

#### People

Disallineamento, key person leaves, skill gap, dynamic interpersonali.

- *Esempio 1*: «Il tech lead che aveva progettato l'architettura ha lasciato
  l'azienda a metà progetto. Nessun altro aveva il mental model completo, e
  abbiamo speso 3 sprint a ricostruirlo.»
- *Esempio 2*: «Gli stakeholder business e tech non hanno mai allineato sulla
  definizione di "MVP". A fine quarter c'erano 2 prodotti diversi nelle teste,
  e il delivery non corrispondeva a nessuno dei due.»

#### Technical

Debito tecnico, dipendenze fragili, scalabilità, sicurezza, integrazione.

- *Esempio 1*: «Il database scelto in fase di design non scalava oltre 10k
  utenti concorrenti. Quando il lancio ha portato 50k al picco, il sistema è
  collassato e abbiamo perso le prime 6 ore di traffico.»
- *Esempio 2*: «Una dipendenza esterna (OAuth provider) ha deprecato l'API che
  usavamo a 3 mesi dalla nostra release. Migrazione non pianificata, debito
  esploso.»

#### Assumptions

Assunzioni implicite sul mercato, costi, comportamento utente, prerequisiti taciti.

- *Esempio 1*: «Assumevamo che gli utenti enterprise volessero SSO. Survey
  post-rilascio: il 70% usa account locali per ragioni di policy IT. Feature
  SSO sviluppata per 2 mesi, usata dal 30%.»
- *Esempio 2*: «Stima costi infrastruttura basata su prezzi cloud 2024 senza
  considerare che il nostro pattern di traffico (bursty) avrebbe fatto scattare
  tariffe premium. Costo reale 3x stimato.»

Input atteso: frase Fase 2 emessa + dossier Fase 1.
Output prodotto: lista di failure reasons per ciascuna categoria, ognuna in
forma narrativa breve (1-3 frasi).
Criterio di completamento: ogni categoria ha ≥ 1 reason esplorata (anche se la
risposta è «non applicabile a questo target» — esplicito > tacito).

## Fase 4 — Parallel Deep-Dives

**Placeholder** — implementazione completa in TSK-003.

Input atteso: lista failure reasons di Fase 3.

Output prodotto: per ciascuna failure reason, un mini-dossier con (a) storia
del fallimento narrativa, (b) assunzione nascosta alla base, (c) 1-2 early
warning signs osservabili.

Criterio di completamento: spawning di sub-agent investigatori in parallelo
(cap `max_parallel: 8` hardcoded — ADR-001), risultati aggregati al caller.

Vedi TSK-003 per la procedura completa del pattern sub-agent fan-out (analogo
a `wiki-keeper-worker` di v2.4).

## Fase 5 — Sintesi

**Placeholder** — implementazione completa in TSK-004.

Input atteso: aggregato dei mini-dossier di Fase 4.

Output prodotto strutturato in 6 elementi:
1. **Most Likely Failure** — quello con maggior confidence di trigger
2. **Most Dangerous Failure** — maggior impatto (non necessariamente più probabile)
3. **Hidden Assumption** — l'assunzione root-cause cross-cutting
4. **Revised Plan** — modifiche concrete (3-7 azioni)
5. **Pre-Launch Checklist** — 3-5 item actionable (formato «Verifica che X»)
6. **Risk Registry** — Tigers/Paper Tigers/Elephants con urgency, schema canonico
   (vedi TSK-012 per template)

Criterio di completamento: tutti i 6 elementi prodotti, Risk Registry calibrato
(mix dei tre tier non degenere — se tutto Tiger o tutto Paper Tiger, riemissione
con frame più forte).

Vedi TSK-004 per la procedura completa di Sintesi e schema Risk Registry.

## Output side-effects

| Canale | Sempre attivo | Note |
|---|---|---|
| **Inline in chat** | ✓ | Risk Registry completo + Revised Plan + Pre-Launch Checklist visibili all'utente |
| **Append `wiki/log.md`** | ✓ | Marker `premortem <target> → <tier-counts>` (es. `premortem EP-001 → T:5 LB:2 FF:2 Tr:1 PT:2 E:1`) |
| **Append `memory/episodic/premortem-runs.md`** | ✓ | Metadata only (timestamp, target, tier counts, no body) — ADR-006, per telemetria evolutiva v2.17+ |
| **Append `management/risk-registry.md`** | opt-in | Solo se l'utente lo richiede esplicitamente o il file esiste. Niente auto-creazione (R.P1) |
| **Suggerimento edit frontmatter target** | suggerito | La skill emette in chat «Considera di aggiungere `risk_classification.tier: tiger-launch-blocking` al frontmatter di EP-XXX». Mai applicato in autonomia (R.P1) |

## Anti-pattern

Comportamenti vietati di questa skill:

| Anti-pattern | Motivo | Cosa fare invece |
|---|---|---|
| Auto-apply del `revised_plan` modificando il file target | Viola R.P1 (output mai auto-applicato) | Emetti suggerimenti in chat, lascia all'utente l'edit |
| Output sanitizzato con contesto insufficiente | Viola R.P2 (bar minimo) — produce premortem inutile | Fail-loud, chiedi 1 domanda alla volta finché il bar è soddisfatto |
| Trigger automatico su parole chiave (es. "what could go wrong" nel chat) | Viola R.P3 (opt-in) — ADR-003 ha scartato phrase-trigger v2.16 | Solo `/premortem` esplicito |
| Modifica del body di EP/US/TSK target | Viola R.7 PATTERN (update non-distruttivo su review/approved) | Edita solo frontmatter (e solo se l'utente conferma); body intoccabile |
| Risk Registry con calibrazione degenere (tutto Tiger o tutto Paper Tiger) | Indica che il frame Fase 2 non ha funzionato o che il modello è sotto-calibrato | Riemetti la frase Fase 2 verbatim e richiedi a Fase 3 una passata più severa, oppure fail-loud |
| Premortem su decisione già irrevocabile (es. commit già pushato) | Spreca token e produce ansia inutile | Suggerisci `/premortem` per la prossima decisione, non per quella appena chiusa |
| Sovrapposizione con CQRL (premortem applicata al codice post-merge) | CQRL fa già evaluation post-fact; la premortem è pre-fact (livello decisionale diverso) | Usa CQRL pass `premortem-on-merge` (ADR-005, opt-in v2.16) per integrazione chirurgica; non duplicare |
