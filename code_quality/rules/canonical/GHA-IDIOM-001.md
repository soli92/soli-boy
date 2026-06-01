---
id: GHA-IDIOM-001
tier: canonical
status: active
applies_to: { language: yaml, context: [idiomaticity, robustness], platform: github-actions }
severity_default: low
auto_fixable: false
created: 2026-06-01
source_tsk: TSK-051
promoted_from: ""
---
# GHA-IDIOM-001 — Evitare `npx <tool>@latest` nei workflow GitHub Actions: usare pin major o devDependency

**Regola:** nei workflow GitHub Actions, i tool invocati via `npx <tool>@latest`
non sono deterministici: il tag `latest` risolve sempre all'ultima versione pubblicata
su npm al momento del run, indipendentemente dalla major. Usare invece:
- `npx <tool>@<major>` (es. `npx vercel@39`) per pin alla major, oppure
- installare il tool come `devDependency` con versione `^X.0.0` in `package.json`
  e richiamare `npx <tool>` (risolve la versione dal `node_modules` installato da `npm ci`).

**Rationale:** `@latest` non e' equivalente a "pin sulla major corrente": se il
tool rilascia una nuova major (es. vercel v40), `npx vercel@latest` inizia
immediatamente a usare v40 senza alcuna modifica al workflow YAML o al lockfile.
Un breaking change (cambio formato artefatti, rimozione flag, cambio exit code)
puo' causare un fallimento silenzioso in produzione al momento del deploy.
Il costo di fissare la major e' minimo (aggiornamento deliberato e versionato
quando si vuole adottare la nuova major); il beneficio e' build riproducibili
run-over-run.

**Esempio (bad):**
```yaml
- name: Vercel pull
  run: npx vercel@latest pull --yes --token="${VERCEL_TOKEN}"

- name: Vercel build
  run: npx vercel@latest build --token="${VERCEL_TOKEN}"

- name: Vercel deploy
  run: npx vercel@latest deploy --prebuilt --token="${VERCEL_TOKEN}"
```

**Esempio (good — opzione A: pin major via npx):**
```yaml
- name: Vercel pull
  run: npx vercel@39 pull --yes --token="${VERCEL_TOKEN}"

- name: Vercel build
  run: npx vercel@39 build --token="${VERCEL_TOKEN}"

- name: Vercel deploy
  run: npx vercel@39 deploy --prebuilt --token="${VERCEL_TOKEN}"
```

**Esempio (good — opzione B: devDependency — piu' deterministico):**
```json
// packages/app/package.json
{
  "devDependencies": {
    "vercel": "^39.0.0"
  }
}
```
```yaml
# workflow: npm ci installa vercel, npx usa la versione locale
- name: Vercel pull
  run: npx vercel pull --yes --token="${VERCEL_TOKEN}"
```

**Note:** il tag `@latest` e' accettabile in script di sviluppo locale one-shot,
dove la riproducibilita' non e' critica. In CI/CD dove la build deve essere
riproducibile run-over-run (e in particolare in deploy di produzione), il pin
e' necessario per correttezza. La major corrente di un tool npm e' verificabile
con `npm view <tool> dist-tags.latest`.

**Provenienza:** emersa in review di TSK-051 (workflow CD Vercel, EP-011).
Gate umano richiesto per promozione a canonical (PATTERN §19.5).
