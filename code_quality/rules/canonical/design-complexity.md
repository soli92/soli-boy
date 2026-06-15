---
tier: canonical
applies_to:
  language: "*"
  context: ["design", "architecture"]
status: active
created: 2026-06-15
sources:
  - wiki/concepts/cyclomatic-complexity.md
  - wiki/concepts/cognitive-complexity.md
  - wiki/runbooks/code-complexity-review-rules.md
---

# Regole di complessità — Design & Manutenibilità

Regole language-agnostiche per la Passata 2 del CQRL. Ogni regola si applica a qualunque
stack (`language: "*"`); il reviewer usa le metriche pre-calcolate da tool deterministici
(tabella in `code-review-protocol.md §Passata 2`) per il rilevamento.

---

## `*.design.complexity.cyclomatic_violation`

```yaml
rule_id: "*.design.complexity.cyclomatic_violation"
version: v1
tier: canonical
title: "Complessità ciclomatica eccessiva"
applies_to:
  language: "*"
  context: ["design"]
severity_default: high
auto_fixable: false
```

**Rationale**: una funzione/metodo con complessità ciclomatica > 10 richiede il numero
minimo di test-case per coprire tutti i rami, rendendo il testing costoso e la
manutenzione fragile. Oltre 20 è un segnale di God Function.

**Soglie**:
- > 10 → `severity: medium` (attenzione, refactoring raccomandato)
- > 20 → `severity: high` (blocco, refactoring obbligatorio)

**Detection hints**:
- Contare `if`, `else if`, `for`, `while`, `case`, `catch`, `&&`, `||` + 1 (base)
- Tool deterministici: `radon cc -s <file>` (python), `gocyclo <file>` (go), `lizard <file>` (multi)
- Output atteso da `metrics_input`: `{ "function": "nome", "cyclomatic": N, "file": "path", "line": L }`

**Refactoring suggeriti**:
- Guard clauses / Early return (riduce nesting e rami `else`)
- Extract Function (scomponi in funzioni con singola responsabilità)
- Strategy / Policy pattern (sostituisce grandi `switch`/`if-elif`)
- Lookup table (per mapping dato → valore senza logica condizionale)

---

## `*.design.complexity.cognitive_violation`

```yaml
rule_id: "*.design.complexity.cognitive_violation"
version: v1
tier: canonical
title: "Complessità cognitiva eccessiva"
applies_to:
  language: "*"
  context: ["design"]
severity_default: high
auto_fixable: false
```

**Rationale**: la complessità cognitiva (Campbell/SonarSource 2016) misura lo sforzo
mentale richiesto per *leggere* il codice, non solo per testarlo. È complementare alla
ciclomatica: un ciclo con penalità di nesting profondo può avere ciclomatica bassa ma
cognitiva elevata.

**Soglie**:
- > 15 → `severity: medium` (attenzione, difficoltà di comprensione rilevante)
- > 30 → `severity: high` (blocco, codice non manutenibile)

**Detection hints**:
- Ogni struttura di controllo +1; ogni livello di nesting aggiuntivo +N (penalità cumulativa)
- Tool: SonarQube, `lizard --CCN <file>` (approssimazione)
- Output atteso da `metrics_input`: `{ "function": "nome", "cognitive": N, "file": "path", "line": L }`

**Refactoring suggeriti**:
- Flatten early (guard clauses prima dei blocchi profondi)
- Extract nested logic in funzioni con nome esplicito
- Introduce Explaining Variable (per condizioni composte che aumentano il cognitive score)

---

## `*.design.complexity.nesting_depth_violation`

```yaml
rule_id: "*.design.complexity.nesting_depth_violation"
version: v1
tier: canonical
title: "Nesting depth eccessivo"
applies_to:
  language: "*"
  context: ["design"]
severity_default: medium
auto_fixable: false
```

**Rationale**: nesting > 3 livelli aumenta drasticamente il cognitive score e rende
difficile tracciare il flusso di controllo a colpo d'occhio. Spesso è un proxy per
responsabilità non separate.

**Soglie**:
- > 3 → `severity: low` (attenzione)
- > 4 → `severity: medium` (refactoring raccomandato)

**Detection hints**:
- Contare la profondità massima di `{`, `[` o equivalente per lo stack
- Tool: `lizard --length <file>` (stima), analisi AST manuale
- Output atteso da `metrics_input`: `{ "function": "nome", "max_nesting": N, "file": "path", "line": L }`

**Refactoring suggeriti**:
- Guard clauses / Early return per eliminare il ramo `else` esterno
- Extract Function sul corpo del loop o del blocco innestato più profondo
- Inversione della condizione (evita nesting quando il caso negativo è triviale)

---

## `*.design.complexity.double_violation`

```yaml
rule_id: "*.design.complexity.double_violation"
version: v1
tier: canonical
title: "Doppia violazione ciclomatica + cognitiva"
applies_to:
  language: "*"
  context: ["design"]
severity_default: high
auto_fixable: false
```

**Rationale**: quando una funzione supera *entrambe* le soglie di attenzione (ciclomatica
> 10 E cognitiva > 15) il rischio di regressione è moltiplicativo: la funzione è difficile
da testare (ciclomatica alta) *e* difficile da capire (cognitiva alta). Questo pattern
merita escalation a `high` indipendentemente dal valore assoluto dei singoli indici.

**Detection hints**:
- Trigger automatico: sia `cyclomatic_violation` sia `cognitive_violation` attivi sulla stessa funzione
- Emetti questo finding *in aggiunta* ai due finding individuali, non in sostituzione

**Refactoring suggeriti**:
- Priorità massima: scomponi prima per responsabilità (Extract Function), poi valuta
  Guard clauses e Explaining Variable sul risultato
- Considera una sessione di pair-review con l'autore prima del refactoring

---

## `*.design.complexity.undocumented_recursion`

```yaml
rule_id: "*.design.complexity.undocumented_recursion"
version: v1
tier: canonical
title: "Ricorsione non documentata senza base-case esplicita"
applies_to:
  language: "*"
  context: ["design"]
severity_default: medium
auto_fixable: false
```

**Rationale**: la ricorsione aumenta la complessità cognitiva in modo non lineare perché
il lettore deve simulare la call stack mentalmente. Senza un commento che documenti
esplicitamente il base-case e la garanzia di terminazione, diventa un rischio latente
(stack overflow, logica non ovvia).

**Detection hints**:
- Funzione che chiama se stessa senza un commento/docstring che descriva base-case e
  garanzia di terminazione
- Rilevamento statico: grep per `def <nome>` + occorrenza di `<nome>(` nel corpo

**Refactoring suggeriti**:
- Aggiungi un commento che documenta: (1) base-case, (2) invariante che garantisce la
  terminazione, (3) complessità attesa
- Valuta se un approccio iterativo con stack esplicito sia più leggibile per lo stack
  tecnologico in uso
