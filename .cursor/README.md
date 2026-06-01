# Cursor adapter — soli-boy

Adapter Cursor (≥0.45) della factory llm-wiki++ v2.15. Tradotto dall'adapter reference
`.claude/` preservando il contenuto dei ruoli (PATTERN §12, R.A1-R.A6).

- `rules/*.mdc` — agenti (PATTERN §2) attivati per glob o @-mention.
- `rules/skills/*.mdc` — procedure riusabili, referenziate dagli agenti.
- `commands/*.md` — slash command (`/run`, `/dev`, `/review`, …).

**Coesistenza (R.A1)**: questo adapter scrive solo in `.cursor/`. Lo state filesystem
(`wiki/`, `management/`, `raw/`, `memory/`, `code_quality/`) è condiviso con `.claude/`.
Single-committer `wiki/` enforced globalmente (R.A3): non invocare `wiki-keeper` da Cursor
e Claude Code contemporaneamente.

**Limiti runtime**: il fan-out parallelo dei sub-agent (es. wave dispatch §18,
wiki-keeper-worker) è `partial` in Cursor — emulato via Compose o attivazione sequenziale
delle rule. Vedi `adapters/cursor/manifest.yaml` nel meta-framework per i dettagli.
