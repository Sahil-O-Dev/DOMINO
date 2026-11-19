# DOMINO development instructions

DOMINO models cascading infrastructure failures and emergency allocation in a fictional underground district.
Use React, strict TypeScript, Vite, Recharts, Vitest, and CSS or lightweight styling.
Keep simulation and optimization pure TypeScript, deterministic, and independent of React.
Run entirely client-side; no backend, database, randomness, or external AI calls.
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
