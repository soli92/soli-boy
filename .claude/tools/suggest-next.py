#!/usr/bin/env python3
"""
suggest-next.py — Runtime Contextual Suggestions hook (EP-033, v2.24)
Invocato da .claude/settings.json hooks.Stop dopo certi comandi.
Opera fuori dal contesto LLM: regole statiche, deterministico, nessuna chiamata API.

Adapter note: questo hook e' specifico di Claude Code (.claude/settings.json).
In Cursor/Aider: adattare al meccanismo di hook post-comando del rispettivo adapter.
L'adapter Cursor puo' usare un .cursorrules post-command hook; Aider non ha hook Stop
nativi — valutare un wrapper shell che invochi questo script dopo ogni sessione aider.

Usage:
  python3 suggest-next.py --command=/dev [--dry-run]

  --command   nome del comando appena eseguito (es. /dev, /lint, /run, /review)
  --dry-run   stampa le regole valutate su stderr, nessun output suggerito (debug)
"""

import sys
import os
import re
import argparse
from pathlib import Path
from datetime import datetime, timedelta


def find_project_root():
    """Risale dal cwd finche' trova una directory contenente .claude/."""
    current = Path(os.getcwd()).resolve()
    for candidate in [current, *current.parents]:
        if (candidate / ".claude").is_dir():
            return candidate
    return None


def read_log_tail(log_path, n=100):
    """Legge le ultime n righe di wiki/log.md. Restituisce stringa o '' se assente."""
    try:
        p = Path(log_path)
        if not p.exists():
            return ""
        lines = p.read_text(encoding="utf-8", errors="replace").splitlines()
        return "\n".join(lines[-n:])
    except Exception:
        return ""


def read_config_flags(config_path):
    """
    Parsing YAML manuale di factory.config.yaml per le chiavi rilevanti.
    Restituisce dict con chiavi booleane; default False se file assente o chiave assente.
    """
    flags = {
        "a11y_enabled": False,
        "ux_ui_enabled": False,
        "visual_oracle_enabled": False,
        "code_quality_enabled": False,
        "analytics_enabled": False,
    }
    try:
        p = Path(config_path)
        if not p.exists():
            return flags
        text = p.read_text(encoding="utf-8", errors="replace")
        if re.search(r"a11y\s*:\s*\n(?:.*\n)*?\s*enabled:\s*true", text) or \
           re.search(r"a11y\.enabled:\s*true", text):
            flags["a11y_enabled"] = True
        if re.search(r"ux_ui\s*:\s*\n(?:.*\n)*?\s*enabled:\s*true", text) or \
           re.search(r"ux_ui\.enabled:\s*true", text):
            flags["ux_ui_enabled"] = True
        if re.search(r"visual_oracle\s*:\s*\n(?:.*\n)*?\s*enabled:\s*true", text) or \
           re.search(r"fe_correctness\.visual_oracle\.enabled:\s*true", text):
            flags["visual_oracle_enabled"] = True
        if re.search(r"code_quality\s*:\s*\n(?:.*\n)*?\s*enabled:\s*true", text) or \
           re.search(r"code_quality\.enabled:\s*true", text):
            flags["code_quality_enabled"] = True
        if re.search(r"analytics\s*:\s*\n(?:.*\n)*?\s*enabled:\s*true", text) or \
           re.search(r"analytics\.measurement\.enabled:\s*true", text):
            flags["analytics_enabled"] = True
    except Exception:
        pass
    return flags


def command_installed(root, cmd_name):
    """
    Verifica se .claude/commands/<cmd_name>.md esiste.
    cmd_name deve essere senza slash (es. 'a11y', 'semantic-drift-scan').
    """
    try:
        cmd_file = root / ".claude" / "commands" / f"{cmd_name}.md"
        return cmd_file.exists()
    except Exception:
        return False


def evaluate_rules(command, log_tail, flags, root):
    """
    Applica le regole statiche per il comando ricevuto.
    Restituisce lista di stringhe di suggerimento.
    """
    suggestions = []
    cmd = command.lstrip("/")

    # --- /dev rules ---
    if cmd == "dev":
        fe_in_log = bool(
            re.search(r"layer:\s*fe\b|layer=fe\b|TSK.*\bfe\b", log_tail, re.IGNORECASE)
        )
        if fe_in_log:
            a11y_in_log = bool(re.search(r"/a11y\b|a11y.*done|a11y.*completat", log_tail, re.IGNORECASE))
            if not a11y_in_log and command_installed(root, "a11y"):
                suggestions.append("Considera /a11y: TSK FE completato.")
            ux_in_log = bool(re.search(r"/ux-ui-review\b|ux-ui-review.*done|ux.ui.*review.*completat", log_tail, re.IGNORECASE))
            if not ux_in_log and command_installed(root, "ux-ui-review"):
                suggestions.append("Considera /ux-ui-review: componenti UI prodotti.")

    # --- /lint rules ---
    elif cmd == "lint":
        staleness_in_log = bool(re.search(r"staleness|WARNING staleness", log_tail, re.IGNORECASE))
        if staleness_in_log and command_installed(root, "semantic-drift-scan"):
            suggestions.append("Considera /semantic-drift-scan: il lint segnala staleness.")

    # --- /run rules ---
    elif cmd == "run":
        epic_open = re.findall(r"(EP-\d+).*status:\s*open|status:\s*open.*(EP-\d+)", log_tail, re.IGNORECASE)
        premortem_in_log = bool(re.search(r"premortem", log_tail, re.IGNORECASE))
        if epic_open and not premortem_in_log and command_installed(root, "premortem"):
            epic_id = ""
            for m in epic_open:
                epic_id = m[0] if m[0] else m[1]
                if epic_id:
                    break
            if epic_id:
                suggestions.append(f"Considera /premortem {epic_id}: epic aperta senza premortem.")
            else:
                suggestions.append("Considera /premortem <epic-id>: epic aperta senza premortem.")

    # --- /review rules ---
    elif cmd == "review":
        pass_in_log = bool(re.search(r"\bpass\b", log_tail, re.IGNORECASE))
        if pass_in_log:
            today = datetime.utcnow().date()
            week_start = today - timedelta(days=today.weekday())
            week_pattern = re.compile(
                r"\[(\d{4}-\d{2}-\d{2})[^\]]*\].*\bdone\b", re.IGNORECASE
            )
            done_this_week = 0
            for m in week_pattern.finditer(log_tail):
                try:
                    entry_date = datetime.strptime(m.group(1), "%Y-%m-%d").date()
                    if entry_date >= week_start:
                        done_this_week += 1
                except ValueError:
                    pass
            if done_this_week >= 3 and command_installed(root, "analytics"):
                suggestions.append(
                    "Considera /analytics: settimana produttiva — un report costi potrebbe essere utile."
                )

    return suggestions


def main():
    parser = argparse.ArgumentParser(
        description="suggest-next.py — Runtime Contextual Suggestions (EP-033, v2.24)"
    )
    parser.add_argument(
        "--command",
        required=True,
        help="Nome del comando appena eseguito (es. /dev, /lint, /run, /review)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Stampa le regole valutate su stderr, nessun output suggerito (debug)",
    )
    args = parser.parse_args()

    root = find_project_root()
    if root is None:
        sys.exit(0)

    log_path = root / "wiki" / "log.md"
    config_path = root / "factory.config.yaml"

    log_tail = read_log_tail(log_path, n=100)
    flags = read_config_flags(config_path)

    if args.dry_run:
        print(f"[dry-run] command={args.command}", file=sys.stderr)
        print(f"[dry-run] root={root}", file=sys.stderr)
        print(f"[dry-run] log_tail_len={len(log_tail)}", file=sys.stderr)
        print(f"[dry-run] flags={flags}", file=sys.stderr)

    suggestions = evaluate_rules(args.command, log_tail, flags, root)

    if args.dry_run:
        print(f"[dry-run] suggestions={suggestions}", file=sys.stderr)
        sys.exit(0)

    for s in suggestions:
        print(f"\U0001F4A1 {s}")

    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
