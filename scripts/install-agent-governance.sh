#!/usr/bin/env bash
# Instala gobernanza IA desde docs/agent-governance/ hacia .cursor/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/docs/agent-governance"
mkdir -p "$ROOT/.cursor/rules" "$ROOT/.cursor/skills" "$ROOT/.cursor/references" "$ROOT/.cursor/agents" "$ROOT/.cursor/commands"
if [[ -d "$SRC/rules" ]]; then cp -f "$SRC/rules/"*.mdc "$ROOT/.cursor/rules/" 2>/dev/null || true; fi
if [[ -d "$SRC/skills" ]]; then cp -R "$SRC/skills/"* "$ROOT/.cursor/skills/" 2>/dev/null || true; fi
if [[ -d "$SRC/references" ]]; then cp -f "$SRC/references/"* "$ROOT/.cursor/references/" 2>/dev/null || true; fi
if [[ -d "$SRC/agents" ]]; then cp -R "$SRC/agents/"* "$ROOT/.cursor/agents/" 2>/dev/null || true; fi
if [[ -d "$SRC/commands" ]]; then cp -R "$SRC/commands/"* "$ROOT/.cursor/commands/" 2>/dev/null || true; fi
if [[ -f "$SRC/mcp.json.example" ]]; then cp -f "$SRC/mcp.json.example" "$ROOT/.cursor/mcp.json"; fi
echo "Gobernanza instalada en .cursor/ (rules, skills, references, agents, commands, mcp.json)."
