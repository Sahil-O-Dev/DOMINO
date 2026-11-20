# DOMINO development instructions

DOMINO models cascading infrastructure failures and emergency allocation in a fictional underground district.
Use React, strict TypeScript, Next.js, Recharts, Vitest, and CSS or lightweight styling.
Keep simulation and optimization pure TypeScript, deterministic, and independent of React.
Run the simulation entirely client-side with no randomness in the baseline or external AI calls. The approved account backend may use persistent SQLite storage and cryptographic randomness for authentication.
The UI must never hardcode simulation results, chart curves, or favorable statistics.
Read in order: `docs/SPEC.md`, `docs/STAGES.md`, `docs/TESTS.md`, `docs/PROJECT.md`.
Work on one development stage at a time; stop for user approval between stages.
Stage 5 dashboard is implemented; integration checks remain. Stage 6 requires approval.
Never modify equations, constants, or assumptions without approval and a `docs/DECISIONS.md` entry.
Report suspicious mathematics and incorrect assumptions before implementation.
Once tests exist, run applicable tests after code changes and report actual output and failures.
Never change test expectations to conceal bugs or describe fictional outputs as real forecasts.
Favor readable modules, descriptive names, minimal dependencies, and macOS/Windows compatibility.
Keep future features out of scope unless approved; consult `docs/PROJECT.md`.
After the required reading order, read `docs/PROGRESS.md` for current status and handoff.
Update PROGRESS after meaningful work or handoff with actual checks, next actions, and owners.
Keep current architecture in PROJECT and approved decision history in DECISIONS; link rather than duplicate.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
