# Implementation from The Forge (spec-kit style)

## Document order (mandatory)

1. Read `.specify/memory/constitution.md` (MDD) — single source of truth.
2. Read `spec.md` (what/why) and `plan.md` (blueprint / technical plan) under `specs/001-mkt-agency-os/`.
3. Use `tasks.md` as the execution checklist; always cross-check MDD §3–§4 and `contracts/`.
4. API contracts are binding (methods, paths, DTOs).
5. On conflict between artifacts, **the MDD wins**.

## Path map (spec-kit primary ↔ governance mirror)

| Documento | Primario (spec-kit) | Espejo (gobernanza) |
|-----------|---------------------|---------------------|
| Constitución (MDD) | `.specify/memory/constitution.md` | `docs/sdd/mdd.md` |
| Spec | `specs/001-mkt-agency-os/spec.md` | `docs/sdd/spec.md` |
| Blueprint / Plan | `specs/001-mkt-agency-os/plan.md` | `docs/sdd/blueprint.md` |
| Tasks | `specs/001-mkt-agency-os/tasks.md` | `docs/sdd/tasks.md` |

**The spec-kit layout is canonical.** Files under `docs/sdd/` mirror content for agent rules/skills — not an alternate SSOT.

## Installation order

1. Extract all bundled files at **repo root** (`.specify/`, `specs/001-mkt-agency-os/`, `AGENTS.md`, `docs/agent-governance/`, `docs/sdd/`, `scripts/`). The human unpacks the ZIP; the agent confirms layout at repo root.
2. **Agent — first terminal action:** install governance (request shell permission if prompted):

```bash
chmod +x scripts/install-agent-governance.sh
./scripts/install-agent-governance.sh
```

Verify `.cursor/rules/` exists before coding. Do not ask the user to run the script unless it fails. See `docs/agent-governance/INSTALACION.md` for manual fallback.
3. Verify `docs/sdd/*` mirrors match spec-kit artifacts (optional cross-check).

## Executing tasks (agent workflow)

1. Open `specs/001-mkt-agency-os/tasks.md` and find the first open item (`- [ ]`).
2. Tasks marked `[P]` may run **in parallel** within the same user-story **Checkpoint** block.
3. Each task should list target **file paths** (e.g. `src/...`); edit only those files unless the task explicitly expands scope.
4. After completing a Checkpoint section, run smoke checks from `specs/001-mkt-agency-os/quickstart.md` for that user story.
5. Mark completed items as `- [x]` in `tasks.md` (or track in your agent session) before moving to the next task.
6. If implementation diverges from spec, stop and run **converge** (The Forge) or update the MDD first — do not silently drift.

## Agent governance (if bundled)

If this ZIP includes governance docs at repo root, the **agent** must run `scripts/install-agent-governance.sh` (see Installation order) before coding.
The `docs/sdd/` folder is a **mirror** for rules that reference SDD paths — always prefer spec-kit paths when both exist.

## Git branch naming

Create feature branches as `{NNN}-{slug}` where `NNN` is the 3-digit stage ordinal from The Forge (e.g. `002-discount-module`). One branch per stage change; see `openspec/BRANCH-POLICY.md` when bundled.

## Full consumption rules

See `THEFORGE-DOC-CONSUMPTION-GUIDE.md` at repo root (next to this file) for complete agent consumption rules.
