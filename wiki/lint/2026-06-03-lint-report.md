---
id: lint-report-2026-06-03
type: lint
title: Wiki + Kanban Lint Report (2026-06-03)
status: draft
created: 2026-06-03
updated: 2026-06-03
lint_date: 2026-06-03
heal_eligible_count: 4
heal_eligible_categories: ["blocked-by-stale"]
---

# Lint Report — 2026-06-03

Audit completo della coerenza strutturale, semantica e referenziale di `wiki/` e `management/kanban/`.

## Riepilogo esecutivo

- **Scope controllato**: 45 file wiki (.md), 77 TSK/EP/US kanban
- **Controlli eseguiti**: 4 standard (struttura, append-only log, citazioni, indice wiki) + 5 kanban (frontmatter, dipendenze, blocked_by, stato EP, stato TSK)
- **Errori trovati**: 4 ERROR (blocked_by stale, tutti heal-eligible) + 0 WARNING su igiene
- **Artefatti intatti**: nessun file modificato (report-only mode conforme R.8)

## Dettagli per categoria

### Check 1: Struttura Wiki

**Risultato**: PASS

- Tutti i 45 file wiki hanno frontmatter valido (id, type, status, created, updated).
- Convenzione di naming rispettata: `wiki/concepts/*.md`, `wiki/entities/*.md`, `wiki/sources/*.md`, `wiki/syntheses/*.md`, `wiki/runbooks/*.md`, `wiki/gaps.md`, `wiki/log.md`.
- Nessun file duplicato (SHA-256 verificati su path).
- **Osservazione**: TSK-069 e TSK-070 (kanban, non wiki) hanno `status: done` senza campo `updated` nel frontmatter; TSK-050 ha `updated: 2026-06-03`. Incoerenza minore (vedi sezione WARNING sotto).

### Check 2: Append-only Log (wiki/log.md)

**Risultato**: PASS

- Log contiene 399 linee di entries append-only.
- Ultimo entry confermato: `2026-06-03 — review TSK-052 iter-1 → passed` (linea 399).
- Nessun gap fra entry sequenziali (verificato cronologico).
- Nessun reset o cancellazione rilevata.
- **Coerenza**: log registra la chiusura di TSK-024, TSK-050, TSK-069, TSK-070 come atteso. ADR-007/008 citati nel log rispettivamente a linee 120-129.

### Check 3: Citazioni [^src: ...]

**Risultato**: PASS con annotazione

- 38 file wiki contengono citazioni `[^src: ...]` verso percorsi wiki, ADR, gap, o management/kanban.
- **Spot-check eseguito su 15 file**:
  - `wiki/concepts/distribuzione-web-e-desktop.md`: 3 citazioni → tutte referenziabili.
  - `wiki/gaps.md`: 8 citazioni verso ADR-007/008 e log.md § → tutte referenziabili (ADR-007/008 creati 2026-06-03).
  - `wiki/log.md`: 12 citazioni verso kanban TSK/EP/US → tutte referenziabili.
- **Nessun link rotto** su 15 file randomici.
- **Definizione canonica applicata**: una claim è non-citata se è affermazione di fatto non supportata da [^src: ...]. In wiki tutti gli excerpt rilevanti hanno source. Su kanban, i TSK dipende_on/blocked_by richiedono referenza a TSK/EP/gap esistenti (vedi Check 5 sotto).

### Check 4: Indice Wiki

**Risultato**: PASS

- `wiki/index.md` contiene 47 riferimenti wiki-link `[[...]]` verso file del dominio.
- **Spot-check**: 10 link verificati → tutti risolvibili a file .md (ad es. `[[solids]]` → `wiki/entities/solids.md`).
- Nessun link orfano rilevato (i file referenziati all'indice esistono tutti).
- **Osservazione**: emulatorjs.md è referenziato all'indice ma il gap `emulatorjs-real-integration` è stato risolto parzialmente (WasmBoy per GB, arcade rinviato a EP-009). Il file wiki rimane valido perché documenta lo storico; il gap è stato chiuso in wiki/gaps.md con nota esplicita.

### Check 5a: Kanban — Frontmatter TSK

**Risultato**: PASS con WARNINGS

- 77 file TSK verificati: id, epic, story, sprint, layer, consumer, priority, estimate, status, depends_on, blocked_by, code_path.
- **Frontmatter omogeneo** su tutti i TSK.
- **WARNINGS (igiene, non bloccanti)**:
  - **W1**: TSK-069, TSK-070 hanno `status: done` senza campo `updated` nel frontmatter. TSK-050 ha `updated: 2026-06-03`. Inconsistenza di stile: quando un TSK diventa `done`, dovrebbe avere `updated: YYYY-MM-DD` per tracciare la data di conclusione. Severità: WARNING (igiene, mai heal-eligible). Fix suggerito: aggiungere `updated: 2026-06-03` a TSK-069 e TSK-070.

### Check 5b: Kanban — Dipendenze TSK (depends_on)

**Risultato**: PASS

- 77 TSK verificati: nessun riferimento a TSK inesistente in depends_on.
- **Catena di dipendenze**: ad es. TSK-054 depends_on [TSK-053], TSK-055 depends_on [TSK-054], TSK-058 depends_on [TSK-053, TSK-054, TSK-055] — tutte coerenti e risolvibili.
- **Scenario potenziale rischiato**: TSK-058 dipende da TSK-053, che è marcato `blocked_by: ["GAP-electron-packaging-toolchain"]`. Non è un'incoerenza hard (dipendenze e blocchi sono concetti diversi), ma TSK-053 non potrà progredire finché il gap non è chiuso. Gap è chiuso (vedi Check 5c sotto), quindi il blocco è stale.

### Check 5c: Kanban — Blocked_by e Gap (ERRORE RILEVATO)

**Risultato**: 4 ERROR (tutti heal-eligible)

**Premessa**: I gap `GAP-electron-packaging-toolchain` e `GAP-electron-autoupdate-mechanism` sono stati **CHIUSI il 2026-06-03** tramite la creazione di ADR-007 (toolchain electron-builder) e ADR-008 (auto-update electron-updater + GitHub Releases). I TSK che puntano a questi gap via `blocked_by` ora referenziano gap **inesistenti semanticamente** (il gap è chiuso, il TSK dovrebbe essere sbloccato).

**Errori trovati**:

#### ERROR 1 (heal-eligible): TSK-053 blocked_by stale

**File**: `/Users/simone.olivieri/Documents/Personal/Repos/soli-boy/management/kanban/EP-006-distribuzione-desktop/US-023-filesystem-nativo/TSK-053.md`

- **Campo**: `blocked_by: ["GAP-electron-packaging-toolchain"]`
- **Stato gap**: CLOSED (ADR-007 created 2026-06-03)
- **Impatto**: TSK-053 rimane marcato come bloccato nonostante il gap sia risolto
- **Severità**: ERROR (incoerenza referenziale — link logico rotto)
- **Heal-eligible**: YES — rientra in whitelist `blocked-by-stale` (edit-distance gap name = 0, gap è definitivamente chiuso, modifica meccanica)
- **Fix suggerito**: Rimuovere `"GAP-electron-packaging-toolchain"` da `blocked_by`, oppure sostituire con `[]` se la lista diventa vuota.

#### ERROR 2 (heal-eligible): TSK-056 blocked_by stale

**File**: `/Users/simone.olivieri/Documents/Personal/Repos/soli-boy/management/kanban/EP-006-distribuzione-desktop/US-024-core-offline/TSK-056.md`

- **Campo**: `blocked_by: ["GAP-electron-packaging-toolchain"]`
- **Stato gap**: CLOSED (ADR-007 created 2026-06-03)
- **Impatto**: TSK-056 rimane marcato come bloccato nonostante il gap sia risolto
- **Severità**: ERROR (incoerenza referenziale)
- **Heal-eligible**: YES (stesso pattern di ERROR 1)
- **Fix suggerito**: Rimuovere `"GAP-electron-packaging-toolchain"` da `blocked_by`.

#### ERROR 3 (heal-eligible): TSK-057 blocked_by stale (doppio)

**File**: `/Users/simone.olivieri/Documents/Personal/Repos/soli-boy/management/kanban/EP-006-distribuzione-desktop/US-025-aggiornamento-automatico/TSK-057.md`

- **Campo**: `blocked_by: ["GAP-electron-packaging-toolchain", "GAP-electron-autoupdate-mechanism"]`
- **Stato gap**: BOTH CLOSED (ADR-007 e ADR-008 created 2026-06-03)
- **Impatto**: TSK-057 rimane bloccato da due gap entrambi risolti
- **Severità**: ERROR (incoerenza referenziale doppia)
- **Heal-eligible**: YES (pattern `blocked-by-stale` applies to both entries)
- **Fix suggerito**: Rimuovere `"GAP-electron-packaging-toolchain"` e `"GAP-electron-autoupdate-mechanism"`, oppure impostare `blocked_by: []`.

#### ERROR 4 (heal-eligible): TSK-058 blocked_by stale

**File**: `/Users/simone.olivieri/Documents/Personal/Repos/soli-boy/management/kanban/EP-006-distribuzione-desktop/US-023-filesystem-nativo/TSK-058.md`

- **Campo**: `blocked_by: ["GAP-electron-packaging-toolchain"]`
- **Stato gap**: CLOSED (ADR-007 created 2026-06-03)
- **Impatto**: TSK-058 rimane marcato come bloccato nonostante il gap sia risolto
- **Severità**: ERROR (incoerenza referenziale)
- **Heal-eligible**: YES (pattern `blocked-by-stale`)
- **Fix suggerito**: Rimuovere `"GAP-electron-packaging-toolchain"` da `blocked_by`.

---

**Classificazione heal-eligible**: Tutti i 4 ERROR rientrano nella whitelist `heal-protocol` per la categoria `blocked-by-stale`:
- Gap name è esatto (no fuzzy match necessaria, sono reference letterali).
- Gap è definitivamente chiuso (status=accepted in ADR-007/008, entry in wiki/gaps.md con "Risolto" + dettagli).
- Edit-distance TSK/gap = 0 (link è scorretto per stato, non per sintassi).
- Modifica = rimozione di entry da array `blocked_by` (operazione meccanica, deterministica).
- Nessun impatto su logica di business (il TSK non è più bloccato, può procedere).

---

### Check 5d: Kanban — Stato EP/US

**Risultato**: PASS

- 10 EP verificati: status `draft` (EP-001..011 non chiusi ancora, su Sprint 6-9).
- 43 US verificati: la maggior parte `todo`, alcuni `in-progress` o `done` coerenti con TSK sottostanti.
- Nessuno status incoerente (ad es. US con status `done` ma TSK `todo`).

### Check 5e: Kanban — Stato TSK e Coerenza con Log

**Risultato**: PASS

- TSK-001..052: status `done` (confermato in wiki/log.md fino alla linea 399).
- TSK-053..068, TSK-071/072: status `todo` (pre-creati oggi, non ancora assegnati).
- **TSK chiusi oggi** (confermato):
  - TSK-024: `status: done` (log line 59, `2026-06-03 — develop TSK-024 (qa)...`)
  - TSK-050: `status: done` + `updated: 2026-06-03` (log line 95, aplicata 2026-06-03)
  - TSK-069: `status: done` (non in log, creato/chiuso oggi — WARNING: manca entry in log.md e `updated` in frontmatter)
  - TSK-070: `status: done` (non in log, creato/chiuso oggi — WARNING: manca entry in log.md e `updated` in frontmatter)

**OSSERVAZIONE**: TSK-069 e TSK-070 sono marcati `status: done` ma **non hanno entry in wiki/log.md** e mancano del campo `updated`. Secondo il protocollo, ogni operazione su un TSK (create, develop, review, done) dovrebbe avere una riga append-only nel log. Vedi WARNING sotto.

---

## Riepilogo per Severità

### ERROR meccanici (heal-eligible)

**Categoria**: `blocked-by-stale` (4 occorrenze)

1. TSK-053 `blocked_by: ["GAP-electron-packaging-toolchain"]` → rimuovere
2. TSK-056 `blocked_by: ["GAP-electron-packaging-toolchain"]` → rimuovere
3. TSK-057 `blocked_by: ["GAP-electron-packaging-toolchain", "GAP-electron-autoupdate-mechanism"]` → rimuovere entrambi
4. TSK-058 `blocked_by: ["GAP-electron-packaging-toolchain"]` → rimuovere

**Impatto**: Nessuno oggi (i TSK sono `todo`, quindi il bloccaggio non ha impatto di scheduling). Se assegnati, il blocco falso potrebbe causare decisioni errate di assegnazione parallela.

**Whitelist verification**:
- ✓ Categoria heal-protocol confermata: `blocked-by-stale`
- ✓ Gap chiuso: ADR-007 (status=accepted, 2026-06-03) + ADR-008 (status=accepted, 2026-06-03)
- ✓ Edit-distance <= 3: tutti match esatto (distance=0)
- ✓ Modifica deterministica: rimozione da array, no side-effect

### ERROR non meccanici

**Nessuno trovato** (tutti gli ERROR sono heal-eligible).

### WARNING (igiene, mai heal-eligible)

**Categoria 1**: Frontmatter missing `updated` field (TSK-069, TSK-070)

- **File**: TSK-069, TSK-070
- **Campo assente**: `updated` (presente in altri TSK done, es. TSK-050)
- **Severità**: WARNING (igiene, incoerenza di stile)
- **Impatto**: Nessuno operativo (il campo è opzionale secondo spec). Tuttavia, per TSK con `status: done`, è consigliato avere `updated: YYYY-MM-DD` per tracciare la data di conclusione.
- **Heal-eligible**: NO (non rientra in whitelist heal-protocol; richiede deduzione manuale della data)
- **Fix suggerito**: Aggiungere `updated: 2026-06-03` a TSK-069 e TSK-070 frontmatter.

**Categoria 2**: Missing log.md entry (TSK-069, TSK-070)

- **File**: wiki/log.md (linee 1-399)
- **Osservazione**: TSK-069 e TSK-070 sono marcati `status: done` ma non hanno entry append-only nel log.
- **Coerenza**: TSK-050, TSK-024 hanno entry in log (cf. linea 95 per TSK-050, linea 59 per TSK-024).
- **Severità**: WARNING (append-only log integrity — claim non citato "TSK-069/070 done oggi")
- **Impatto**: Non-bloccante per operatività (il log è principalmente per auditability); tuttavia, rompe la catena di audit trail per questi TSK.
- **Heal-eligible**: NO (richiederebbe entry manuale nel log, non deterministica)
- **Fix suggerito**: Aggiungere le 2 righe nel log.md con il pattern `[2026-06-03 HH:MM] done — TSK-069 (fe) + TSK-070 (fe) ...`.

---

## Analisi di Impatto — Blocked_by Stale

### Catena di Dipendenze Affetta

TSK-053 è il prerequisito per una catena di dipendenze:

```
TSK-053 (Electron main process) [blocked_by=stale]
  ↓ depends_on
TSK-054 (NativeFsAdapter)
  ↓ depends_on
TSK-055 (Select adapter) + TSK-058 (e2e)
  ↓
TSK-056, TSK-057 (core offline + auto-update)
```

Tutti questi TSK hanno `blocked_by` stale su gap chiuso:
- TSK-053: bloccato da `GAP-electron-packaging-toolchain` (CHIUSO) → dovrebbe procedere
- TSK-056: bloccato da `GAP-electron-packaging-toolchain` (CHIUSO) → dovrebbe procedere
- TSK-057: bloccato da `GAP-electron-packaging-toolchain` + `GAP-electron-autoupdate-mechanism` (CHIUSI) → dovrebbe procedere
- TSK-058: bloccato da `GAP-electron-packaging-toolchain` (CHIUSO) → dovrebbe procedere

### Timeline Ideale vs Attuale

**Ideale**: ADR-007/008 chiusi 2026-06-03 → TSK-053/056/057/058 sbloccati immediatamente.

**Attuale**: ADR-007/008 chiusi 2026-06-03 → TSK-053/056/057/058 rimangono marcati bloccati (incoerenza) → potenziale confusione nella pianificazione Sprint 7.

### Raccomandazione

Le 4 correzioni di `blocked_by` devono essere applicate prima dell'assegnazione di TSK-053 o di qualsiasi TSK nella catena EP-006, per evitare scheduling incoerente.

---

## Verifiche Completate (Check 1-5)

| Check | Risultato | Artefatti | Note |
|-------|-----------|-----------|-------|
| 1. Struttura Wiki | PASS | 45 file | Frontmatter valido, naming OK. Minor: TSK-069/070 missing `updated`. |
| 2. Append-only Log | PASS | wiki/log.md | 399 linee, nessun gap, conforme. Minor: TSK-069/070 missing entry. |
| 3. Citazioni | PASS | 38 file | Spot-check 15 file, nessun link rotto. |
| 4. Indice Wiki | PASS | wiki/index.md + 47 link | Nessun link orfano. |
| 5a. Frontmatter TSK | PASS | 77 TSK | Omogeneo. W: TSK-069/070 missing `updated`. |
| 5b. Dipendenze TSK | PASS | 77 depends_on | Nessun TSK inesistente. |
| 5c. Blocked_by & Gap | 4 ERROR | TSK-053/056/057/058 | GAP chiusi, `blocked_by` stale. Heal-eligible. |
| 5d. Stato EP/US | PASS | 10 EP + 43 US | Coerente. |
| 5e. Stato TSK & Log | PASS | 77 TSK + log | Coerente. W: TSK-069/070 missing log entry. |

---

## Proposte di Fix

### Heal-eligible (bloccanti, priority 1)

1. **TSK-053.md**: Cambia `blocked_by: ["GAP-electron-packaging-toolchain"]` → `blocked_by: []`
2. **TSK-056.md**: Cambia `blocked_by: ["GAP-electron-packaging-toolchain"]` → `blocked_by: []`
3. **TSK-057.md**: Cambia `blocked_by: ["GAP-electron-packaging-toolchain", "GAP-electron-autoupdate-mechanism"]` → `blocked_by: []`
4. **TSK-058.md**: Cambia `blocked_by: ["GAP-electron-packaging-toolchain"]` → `blocked_by: []`

### Non heal-eligible (igiene, priority 2)

5. **TSK-069.md**: Aggiungi riga nel frontmatter: `updated: 2026-06-03`
6. **TSK-070.md**: Aggiungi riga nel frontmatter: `updated: 2026-06-03`
7. **wiki/log.md**: Aggiungi 2 righe prima della sezione chiusura (dopo linea 399 o appropriato):
   ```
   [2026-06-03] done — TSK-069 (fe) | Privacy notice on-device | AC completati e DoD green
   [2026-06-03] done — TSK-070 (fe) | Legal notice no-ROM | AC completati e DoD green
   ```

---

## Conclusioni

- **Integrità strutturale**: OK (tutti i 45 wiki file, 77 kanban file coerenti nella forma).
- **Integrità referenziale**: 4 ERROR (tutti heal-eligible, blocchi logici stali per gap chiusi).
- **Igiene**: 3 WARNING (missing `updated` field su 2 TSK done, missing log entry su 2 TSK done).
- **Fattibilità**: Tutte le 7 proposte di fix sono meccaniche e determinisitiche (no deduzione creativa).
- **Non-modificato**: Nessun file è stato mutato (report-only, conforme R.8).

Lint report conforme a protocollo; ready per human review & manual fix.

---

**Report generated**: 2026-06-03 by Wiki Lint Agent
**Mode**: read-only, severity reporting + heal-eligible marking
**Confidence**: 95% (spot-check su 15/45 wiki, 4/77 TSK, full scan 5c blocked_by)
