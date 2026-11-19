# DOMINO

**Simulate the Collapse. Prevent the Catastrophe.**

A fictional underground infrastructure failure simulator and emergency resource planner for Patriot HackFest Fall 2026.

## Development setup

Use Node.js **22.14.0** and npm **11.3.0** for a matching team environment. `.nvmrc` records the Node version for compatible version managers; on Windows, installing that version directly also works. No global Vite installation is needed.

From the repository folder on macOS or Windows:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Stop the server with Ctrl+C. On a fresh clone, `npm ci` installs the exact dependencies in the committed lockfile; do not commit `node_modules`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm test` | Run tests once |
| `npm run test:watch` | Watch tests while developing |
| `npm run typecheck` | Check strict TypeScript contracts |
| `npm run build` | Type-check and produce the static site in `dist/` |
| `npm run preview` | Preview an existing production build locally |

Dependencies require internet for installation. After site assets load, planned simulation functionality will run locally without external APIs. There is no backend or database.

## Current scope

Interactive dashboard with a five-level district, disaster trigger/reset, timeline, charts, resource allocation, fairness rankings and policy comparisons. All physical outputs come from the pure domain engine. Run `npm run dev` to explore it locally.

The implementation uses the fictional equations in SPEC. Integration validation and Windows checks remain; see PROGRESS for evidence and limitations.

## Team handoff

Read [the specification](docs/SPEC.md), [stages](docs/STAGES.md), [test plan](docs/TESTS.md), [project architecture](docs/PROJECT.md), then [current progress](docs/PROGRESS.md). Follow [development instructions](AGENTS.md).

Agree on shared types before both developers build against them. Pull the latest changes, work on a task branch, run checks, and request review before merging. Update progress with related work. Equations stay unchanged unless explicitly approved and recorded in [DECISIONS](docs/DECISIONS.md).
