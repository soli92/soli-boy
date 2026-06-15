# TSK-090 — EP-019 Critic Report Globale — soli-boy

**Sprint**: EP-013 Design Intelligence Sprint  
**Pattern**: EP-019 Design Intelligence Layer — critic report aggregato  
**Data**: 2026-06-15  
**Status**: done

---

## §1 — Cosa ha funzionato del pattern EP-019 su soli-boy

### 1.1 Art-director DSL come "gate intenzionale"

Il format ART-DIRECTOR STATEMENT (INTENT/PROBLEM/RATIONALE/CONSTRAINTS) ha
forzato l'esplicitazione del *perché* prima di ogni modifica. Risultato concreto:
TSK-086 (emulator default scale) è stato giustificato con un argomento design
difendibile ("predictable 320px vs unpredictable 100%") invece di una scelta arbitraria.

### 1.2 Critic pass come "rilevatore di stato reale"

I critic pass su TSK-087 e TSK-088 hanno rivelato che 2 dei 3 backlog items
del UX debt erano già risolti in sprint precedenti. L'EP-019 critic ha
**evitato lavoro duplicato** — questo è il ROI più diretto del pattern
in un codebase maturo.

### 1.3 Separazione generatore/critico su DEFAULT_VIDEO_SETTINGS

La sequenza generate → critic → fix ha prodotto un finding reale:
il test esistente documentava un contratto implicito (`scale: "auto"`)
che la modifica ha reso esplicito. Il critic ha identificato il test
prima che l'issue venisse scoperta in produzione.

---

## §2 — Cosa si è rotto / ha richiesto iterazione

### 2.1 Default scale rotto il test suite (finding reale #1)

**Capability impattata**: fe-dev + test documentation  
**Sintomo**: `Player.videoSettings.test.tsx` falliva dopo il cambio
`scale: "auto" → scale: 2`. Il test aveva hardcoded `"auto"` come expected value.  
**Causa**: Il test documentava il comportamento IMPLICITO senza chiarire
che fosse una scelta di design vs un default arbitrario.  
**Risoluzione**: Aggiornato il test con commento esplicito `// TSK-086 EP-019`.  
**Lezione EP-019**: L'art-director deve considerare i test come "design contracts"
da aggiornare quando il design cambia — non solo il codice.

### 2.2 Backlog UX non sincronizzato con implementazione (finding reale #2)

**Capability impattata**: product management / planning  
**Sintomo**: Il backlog EP-013 listava "sezioni info da spostare in nav dedicata"
e "touch overlay mal posizionato" come TODO, ma entrambi erano già implementati
in sprint 9-10.  
**Causa**: Il wiki log aveva gli entry, ma il kanban non era stato aggiornato.  
**Risoluzione**: TSK-087/088 diventano critic passes che documentano lo stato
reale invece di implementare modifiche duplicate.  
**Lezione EP-019**: Il critic pass è utile anche PRIMA di implementare —
serve a verificare lo stato reale prima di assegnare task.

### 2.3 Sub-agent Bash permission blocked (finding meta-framework)

**Capability impattata**: EP-019 esecuzione in meta-framework v2.21  
**Sintomo**: I sub-agent spawned per Run A e Run C non avevano permessi Bash
per eseguire git nei repo esterni — il sandboxing sub-agent non eredita
tutti i permessi della sessione principale.  
**Causa**: `additionalDirectories` in settings.json non garantisce Bash access
ai sub-agent.  
**Risoluzione**: Lavoro eseguito direttamente dalla sessione principale.  
**Lezione**: Documentare in ADR che i sub-agent in factory esterne richiedono
Bash allowlist esplicita o worktree isolation.

---

## §3 — Capability non esercitate in questo run

| Capability | Motivo |
|---|---|
| `visual-oracle` | No render server disponibile nell'ambiente |
| `a11y` scanner | No build headless; audit manuale del codice |
| `compression` | Config ON ma non stressata in questo sprint |
| `code_quality CQRL` | No `/review` invocato (sprint design-doc-heavy) |

---

## §4 — Sintesi EP-019 value su soli-boy

Il pattern Design Intelligence Layer su un codebase maturo (83 TSK esistenti)
ha un ROI diverso rispetto a una factory greenfield:

1. **Audit funzione critica** > generazione: il 66% delle task è stato risolto
   via critic pass (conferma o rejection del backlog)
2. **Rationale esplicito** come artefatto: `ux-design-rationale-ep019.md` è
   ora un documento permanente che documenta le scelte UX fondamentali
3. **Waste prevention**: evitato 2 implementazioni duplicate (TouchOverlay + InfoNav)

**Verdict globale EP-019 su soli-boy**: `pass` con 2 finding non previsti,
1 capability iterata (scale test), 1 finding meta-framework (Bash permission).
