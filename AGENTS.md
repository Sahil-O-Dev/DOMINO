# DOMINO development instructions

DOMINO models cascading infrastructure failures and emergency allocation in a fictional underground district.
Use React, strict TypeScript, Vite, Recharts, Vitest, and CSS or lightweight styling.
Keep simulation and optimization pure TypeScript, deterministic, and independent of React.
Run entirely client-side; no backend, database, randomness, or external AI calls.
The UI must never hardcode simulation results, chart curves, or favorable statistics.
Read in order: `docs/SPEC.md`, `docs/STAGES.md`, `docs/TESTS.md`, `docs/PROJECT.md`.
Work on one development stage at a time; stop for user approval between stages.
Current authorization is documentation only. Do not begin Stage 1 until approved.
Never modify equations, constants, or assumptions without approval and a `docs/DECISIONS.md` entry.
Report suspicious mathematics and incorrect assumptions before implementation.
Once tests exist, run applicable tests after code changes and report actual output and failures.
Never change test expectations to conceal bugs or describe fictional outputs as real forecasts.
Favor readable modules, descriptive names, minimal dependencies, and macOS/Windows compatibility.
Keep future features out of scope unless approved; consult `docs/PROJECT.md`.
