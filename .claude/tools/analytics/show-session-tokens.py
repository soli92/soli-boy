#!/usr/bin/env python3
"""
show-session-tokens.py — display real-time token usage dalla sessione corrente.

Sorgenti (in ordine):
  1. Cloud Agents API (Cursor Cloud + CURSOR_API_KEY)
  2. Transcript Claude Code JSONL (message.usage)
  3. Side-channel .cursor/.token-ledger-state.json (hook afterAgentResponse/stop desktop)
  4. --always-print → messaggio esplicito se nessuna sorgente disponibile

USO:
  show-session-tokens.py [--full] [--always-print] [--transcript <path>]
  echo '<hook-json>' | show-session-tokens.py --from-hook [--record-only]
"""
import sys
import json
import pathlib
import os
import re
import argparse
import base64
import urllib.error
import urllib.request

TOKEN_LEDGER_STATE = ".cursor/.token-ledger-state.json"
# ---------------------------------------------------------------------------
# Ricerca transcript
# ---------------------------------------------------------------------------

def find_transcript(cwd: str | None = None) -> str | None:
    """Trova il transcript JSONL più recente per la cwd corrente."""
    base = cwd or os.getcwd()
    # Claude Code mangling: rimpiazza sia '/' che '.' con '-' nel path
    mangled = base.replace("/", "-").replace(".", "-")
    pdir = os.path.expanduser(f"~/.claude/projects/{mangled}")
    try:
        cand = sorted(
            pathlib.Path(pdir).glob("*.jsonl"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        if cand:
            return str(cand[0])
    except OSError:
        pass
    return find_cursor_transcript()


def find_cursor_transcript() -> str | None:
    """Cursor — AGENT_TRANSCRIPTS o ~/.cursor/projects/**/agent-transcripts/*.jsonl."""
    roots: list[pathlib.Path] = []
    env_base = os.environ.get("AGENT_TRANSCRIPTS")
    if env_base:
        roots.append(pathlib.Path(env_base))
    cursor_projects = pathlib.Path.home() / ".cursor" / "projects"
    if cursor_projects.is_dir():
        roots.extend(cursor_projects.glob("*/agent-transcripts"))
    cand: list[pathlib.Path] = []
    for root in roots:
        if not root.is_dir():
            continue
        try:
            cand.extend(root.rglob("*.jsonl"))
        except OSError:
            continue
    if not cand:
        return None
    try:
        return str(sorted(cand, key=lambda p: p.stat().st_mtime, reverse=True)[0])
    except OSError:
        return None


def project_dir() -> str:
    return os.environ.get("CLAUDE_PROJECT_DIR") or os.environ.get("REPO_ROOT") or os.getcwd()


def state_path(project_root: str) -> pathlib.Path:
    return pathlib.Path(project_root) / TOKEN_LEDGER_STATE


def load_state(project_root: str) -> tuple[dict, set] | None:
    path = state_path(project_root)
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        totals = data.get("totals") or {}
        if not any(int(totals.get(k, 0) or 0) for k in ("input", "output", "cache_read", "cache_write")):
            return None
        models = set(data.get("models") or ["cursor-agent"])
        return {
            "input": int(totals.get("input", 0) or 0),
            "output": int(totals.get("output", 0) or 0),
            "cache_read": int(totals.get("cache_read", 0) or 0),
            "cache_write": int(totals.get("cache_write", 0) or 0),
        }, models
    except (OSError, json.JSONDecodeError, TypeError, ValueError):
        return None


def save_state(project_root: str, totals: dict, models: set[str], source: str) -> None:
    path = state_path(project_root)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "totals": totals,
        "models": sorted(models),
        "source": source,
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _hook_int(hook: dict, *keys: str) -> int | None:
    for key in keys:
        if key in hook and hook[key] is not None:
            try:
                return int(hook[key])
            except (TypeError, ValueError):
                return None
    return None


def extract_hook_usage(hook: dict) -> tuple[dict, set] | None:
    """Token da hook Cursor (afterAgentResponse / stop) — snake_case o camelCase."""
    inp = _hook_int(hook, "input_tokens", "inputTokens")
    out = _hook_int(hook, "output_tokens", "outputTokens")
    cr = _hook_int(hook, "cache_read_tokens", "cacheReadTokens") or 0
    cw = _hook_int(hook, "cache_write_tokens", "cacheWriteTokens") or 0
    if inp is None and out is None:
        return None
    model = str(hook.get("model") or "cursor-agent")
    totals = {
        "input": inp or 0,
        "output": out or 0,
        "cache_read": cr,
        "cache_write": cw,
    }
    return totals, {model}


def record_hook_usage(project_root: str, hook: dict) -> None:
    """Accumula usage per-turn nel side-channel (desktop Cursor hooks)."""
    parsed = extract_hook_usage(hook)
    if not parsed:
        return
    delta, models_delta = parsed
    existing = load_state(project_root)
    if existing:
        totals, models = existing
        totals = dict(totals)
        models = set(models)
        for k in delta:
            totals[k] = totals.get(k, 0) + delta[k]
        models |= models_delta
    else:
        totals, models = delta, set(models_delta)
    save_state(project_root, totals, models, "cursor-hook")


def decode_broker_agent_id() -> str | None:
    token = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN")
    if not token or token.count(".") < 2:
        return None
    try:
        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        data = json.loads(base64.urlsafe_b64decode(payload))
        return data.get("cloudAgentId") or data.get("agentId")
    except (json.JSONDecodeError, ValueError, TypeError):
        return None


def resolve_cursor_agent_id() -> str | None:
    for env in ("CURSOR_CONVERSATION_ID", "CURSOR_AGENT_ID", "CLOUD_AGENT_ID"):
        val = os.environ.get(env)
        if val:
            return val
    return decode_broker_agent_id()


def resolve_cursor_api_key() -> str | None:
    for env in ("CURSOR_API_KEY", "CURSOR_USER_API_KEY", "TOKEN_LEDGER_API_KEY"):
        val = os.environ.get(env)
        if val:
            return val
    return None


def diagnose_cursor_ledger() -> None:
    """Diagnostica non sensibile — utile in Cloud Agent."""
    agent_id = resolve_cursor_agent_id()
    api_key = resolve_cursor_api_key()
    secret_names = os.environ.get("CLOUD_AGENT_ALL_SECRET_NAMES", "")
    print("◉ TOKEN LEDGER — diagnostica")
    print(f"  CURSOR_AGENT={os.environ.get('CURSOR_AGENT', '')}")
    print(f"  agent_id={agent_id or 'n/d'}")
    print(f"  api_key={'presente' if api_key else 'ASSENTE'}")
    print(f"  secrets_iniettati={secret_names or '(nessuno)'}")
    if api_key and agent_id:
        result = fetch_cloud_agent_usage(agent_id, api_key)
        print(f"  api_usage={'OK' if result else 'fallita (id o permessi)'}")
    elif not api_key:
        print("  azione: Dashboard → Cloud Agents → Secrets → aggiungi CURSOR_API_KEY")
        print("  poi riavvia il Cloud Agent (questa VM non ricarica i secret a caldo)")


def fetch_cloud_agent_usage(agent_id: str, api_key: str) -> tuple[dict, set] | None:
    """GET /v1/agents/{id}/usage — token reali Cloud Agent (EP-022 adapter Cursor)."""
    url = f"https://api.cursor.com/v1/agents/{agent_id}/usage"
    cred = base64.b64encode(f"{api_key}:".encode()).decode()
    req = urllib.request.Request(url, headers={"Authorization": f"Basic {cred}"})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, OSError):
        return None
    usage = data.get("totalUsage") or {}
    totals = {
        "input": int(usage.get("inputTokens", 0) or 0),
        "output": int(usage.get("outputTokens", 0) or 0),
        "cache_read": int(usage.get("cacheReadTokens", 0) or 0),
        "cache_write": int(usage.get("cacheWriteTokens", 0) or 0),
    }
    if not any(totals.values()):
        return None
    save_state(project_dir(), totals, {"cursor-cloud-api"}, "cursor-cloud-api")
    return totals, {"cursor-cloud-api"}


def display_unavailable(reason: str, agent_id: str | None = None) -> None:
    hint = ""
    if os.environ.get("CURSOR_AGENT") == "1":
        hint = "  │  hint: aggiungi CURSOR_API_KEY ai secrets Cloud Agent (Dashboard → API Keys)"
        if agent_id:
            hint = f"  │  agent:{agent_id[:20]}…{hint}"
    print(f"◉ TOKENS  sessione: n/d ({reason}){hint}")


def resolve_usage(
    transcript: str | None,
    project_root: str,
) -> tuple[dict, set] | None:
    """Risoluzione sorgente token: API Cloud → transcript Claude → side-channel."""
    api_key = resolve_cursor_api_key()
    agent_id = resolve_cursor_agent_id()
    if api_key and agent_id:
        cloud = fetch_cloud_agent_usage(agent_id, api_key)
        if cloud:
            return cloud

    if transcript and os.path.exists(transcript):
        totals, models = parse_tokens(transcript)
        if totals["input"] or totals["output"]:
            return totals, models

    return load_state(project_root)

# ---------------------------------------------------------------------------
# Parsing transcript
# ---------------------------------------------------------------------------

def parse_tokens(path: str) -> tuple[dict, set]:
    """
    Aggrega token usage da tutti i messaggi assistant nel transcript.
    Ritorna (totals_dict, models_seen_set).
    """
    totals = {"input": 0, "output": 0, "cache_read": 0, "cache_write": 0}
    models_seen: set[str] = set()
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    d = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if d.get("type") != "assistant":
                    continue
                msg = d.get("message") or {}
                usage = msg.get("usage") or {}
                if not usage:
                    continue
                model = msg.get("model") or "unknown"
                models_seen.add(model)
                totals["input"]       += int(usage.get("input_tokens", 0) or 0)
                totals["output"]      += int(usage.get("output_tokens", 0) or 0)
                totals["cache_read"]  += int(usage.get("cache_read_input_tokens", 0) or 0)
                totals["cache_write"] += int(usage.get("cache_creation_input_tokens", 0) or 0)
    except (FileNotFoundError, PermissionError, OSError):
        pass
    return totals, models_seen


# ---------------------------------------------------------------------------
# Pricing
# ---------------------------------------------------------------------------

_FALLBACK_PRICING = {
    # Sonnet 4.6 come fallback ragionevole (USD/1M)
    "in":  3.0,
    "out": 15.0,
    "cr":  0.3,    # cache read
    "cw":  3.75,   # cache write
}

_MODEL_FALLBACKS: dict[str, dict] = {
    "claude-opus":   {"in": 5.0,  "out": 25.0, "cr": 0.5,  "cw": 6.25},
    "claude-sonnet": {"in": 3.0,  "out": 15.0, "cr": 0.3,  "cw": 3.75},
    "claude-haiku":  {"in": 1.0,  "out": 5.0,  "cr": 0.1,  "cw": 1.25},
    "claude-fable":  {"in": 3.0,  "out": 15.0, "cr": 0.3,  "cw": 3.75},
}


def normalize_model(raw: str) -> str:
    """claude-sonnet-4-6[1m] → claude-sonnet-4-6"""
    return re.sub(r"\[.*?\]$", "", raw.strip().lower())


def load_pricing(project_dir: str) -> dict[str, dict]:
    """Legge analytics/pricing.yaml → dict {model_id_or_alias: pricing_entry}."""
    result: dict[str, dict] = {}
    pricing_path = pathlib.Path(project_dir) / "analytics" / "pricing.yaml"
    if not pricing_path.exists():
        return result
    try:
        import yaml  # type: ignore
        with open(pricing_path) as f:
            data = yaml.safe_load(f)
        for m in data.get("models", []):
            mid = m.get("id", "")
            p_list = m.get("pricing", [])
            if not p_list:
                continue
            p = p_list[-1]
            entry = {
                "in":  float(p.get("input_per_1m_tokens", 0) or 0),
                "out": float(p.get("output_per_1m_tokens", 0) or 0),
                "cr":  float(p.get("cache_read_per_1m_tokens", 0) or 0),
                "cw":  float(p.get("cache_write_per_1m_tokens", 0) or 0),
            }
            result[mid] = entry
            for alias in m.get("aliases", []):
                result[normalize_model(alias)] = entry
    except (ImportError, Exception):
        pass
    return result


def get_pricing(models_seen: set[str], pricing: dict) -> dict:
    """Risolve il pricing per il/i modelli della sessione."""
    for raw in models_seen:
        norm = normalize_model(raw)
        if norm in pricing:
            return pricing[norm]
        # fallback prefix-based
        for prefix, p in _MODEL_FALLBACKS.items():
            if norm.startswith(prefix):
                return p
    return _FALLBACK_PRICING


def calc_cost(totals: dict, models_seen: set, pricing: dict) -> float:
    p = get_pricing(models_seen, pricing)
    return (
        totals["input"]       / 1_000_000 * p["in"]
        + totals["output"]    / 1_000_000 * p["out"]
        + totals["cache_read"] / 1_000_000 * p["cr"]
        + totals["cache_write"]/ 1_000_000 * p["cw"]
    )


def cache_savings(totals: dict, models_seen: set, pricing: dict) -> float:
    """Risparmio vs. pagare tutto come input normale (senza cache)."""
    if totals["cache_read"] == 0:
        return 0.0
    p = get_pricing(models_seen, pricing)
    delta = p["in"] - p["cr"]
    return totals["cache_read"] / 1_000_000 * max(delta, 0)


# ---------------------------------------------------------------------------
# Formatting
# ---------------------------------------------------------------------------

def fmt_k(n: int) -> str:
    if n >= 1_000_000:
        return f"{n/1_000_000:.2f}M"
    if n >= 1000:
        return f"{n/1000:.1f}k"
    return str(n)


# ---------------------------------------------------------------------------
# Display
# ---------------------------------------------------------------------------

def display_compact(totals: dict, cost: float, savings: float, as_json: bool = False) -> None:
    cache_note = f"  💾 -{savings:.4f}$" if savings > 0.0001 else ""
    text = (
        f"◉ TOKENS  "
        f"in:{fmt_k(totals['input'])}  "
        f"out:{fmt_k(totals['output'])}"
        f"{cache_note}"
        f"  │  sessione: ~${cost:.4f}"
    )
    if as_json:
        print(json.dumps({"systemMessage": text}))
    else:
        print(text)


def display_full(totals: dict, cost: float, savings: float, models_seen: set, as_json: bool = False) -> None:
    model_str = ", ".join(sorted(normalize_model(m) for m in models_seen)) or "unknown"
    border = "─" * 52
    lines = [
        f"\n╭{border}╮",
        f"│  TOKEN LEDGER — sessione corrente              │",
        f"│  Modelli: {model_str[:40]:<40}│",
        f"├{border}┤",
        f"│  Input:       {fmt_k(totals['input']):>10}  tokens                  │",
        f"│  Output:      {fmt_k(totals['output']):>10}  tokens                  │",
    ]
    if totals["cache_read"] > 0:
        lines.append(f"│  Cache read:  {fmt_k(totals['cache_read']):>10}  tokens                  │")
        lines.append(f"│  Risparmio:   ${savings:>10.4f}                         │")
    if totals["cache_write"] > 0:
        lines.append(f"│  Cache write: {fmt_k(totals['cache_write']):>10}  tokens                  │")
    lines += [
        f"├{border}┤",
        f"│  Costo sessione:  ~${cost:>8.4f}                    │",
        f"╰{border}╯",
    ]
    if as_json:
        print(json.dumps({"systemMessage": "\n".join(lines)}))
    else:
        print("\n".join(lines))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(
        description="Mostra token usage real-time (Claude Code, Cursor Cloud, hook Cursor)."
    )
    ap.add_argument("--from-hook", action="store_true",
                    help="Leggi hook JSON da stdin (Stop/afterAgentResponse)")
    ap.add_argument("--record-only", action="store_true",
                    help="Con --from-hook: registra nel side-channel senza stampare")
    ap.add_argument("--always-print", action="store_true",
                    help="Stampa sempre (default ON se CURSOR_AGENT=1)")
    ap.add_argument("--full", action="store_true",
                    help="Display box completo (default: one-liner compatto)")
    ap.add_argument("--transcript", default=None,
                    help="Path esplicito al transcript JSONL (override auto-discovery)")
    ap.add_argument("--diag", action="store_true",
                    help="Stampa diagnostica Cloud Agent (no valori secret)")
    args = ap.parse_args()

    if args.diag:
        diagnose_cursor_ledger()
        return 0

    root = project_dir()
    always_print = args.always_print or os.environ.get("CURSOR_AGENT") == "1"
    hook: dict = {}
    transcript: str | None = args.transcript

    if args.from_hook:
        try:
            raw = sys.stdin.read()
            hook = json.loads(raw) if raw.strip() else {}
            transcript = transcript or hook.get("transcript_path")
            record_hook_usage(root, hook)
            if args.record_only:
                return 0
        except Exception:
            if args.record_only:
                return 0

    if not transcript or not os.path.exists(transcript):
        transcript = find_transcript()

    resolved = resolve_usage(transcript, root)
    if not resolved:
        if always_print:
            if resolve_cursor_api_key():
                display_unavailable("API usage non disponibile (agent id o permessi)", resolve_cursor_agent_id())
            else:
                display_unavailable("transcript/hook assenti — Cloud Agent richiede CURSOR_API_KEY", resolve_cursor_agent_id())
        return 0

    totals, models_seen = resolved
    pricing = load_pricing(root)
    cost = calc_cost(totals, models_seen, pricing)
    savings = cache_savings(totals, models_seen, pricing)

    as_json = args.from_hook and not args.record_only
    if args.full:
        display_full(totals, cost, savings, models_seen, as_json=as_json)
    else:
        display_compact(totals, cost, savings, as_json=as_json)

    return 0


if __name__ == "__main__":
    sys.exit(main())
