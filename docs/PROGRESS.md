# Project progress and handoff

Last updated: November 19, 2026 (America/New_York).

This file answers: where are we, what changed, who owns the next task, and what needs a decision? Keep the current snapshot short. Equations live in [SPEC.md](SPEC.md), architecture in [PROJECT.md](PROJECT.md), approved decisions in [DECISIONS.md](DECISIONS.md), and acceptance criteria in [STAGES.md](STAGES.md).

## Migration update — November 19, 2026

User authorized Next.js reconfiguration. App Router page/layout and client dashboard are in place; Vite application entry files were removed and Vitest configuration retained separately. All 36 tests and the Next.js production build passed, including TypeScript validation. No equations changed. Teammate must run `npm ci` after receiving this change and use port 3000. Migration was committed and pushed as `423bf78`. Browser interactions and Windows checks remain pending.

## Source organization update — November 19, 2026

Reorganized source by responsibility: Next.js routes/global styles in `src/app`, dashboard UI in `src/components/dashboard`, pure engine modules in `src/lib/simulation`, and tests in each module's `__tests__` directory. Imports and documentation references were updated. Added a documentation index and root folder guide. Generated files are hidden in VS Code's explorer via workspace settings but remain on disk.

Verification: all 36 existing tests passed in 5 files; Next.js production build and TypeScript checks passed. The earlier uncommitted redesign was rolled back before this task, so its additional conversion test is not part of this baseline. No model behavior changed. Organization changes remain local and uncommitted.

## Current snapshot

- Added The Handoff as a separate guest mode at `/handoff`, linked from the district opener. Solo and hot-seat briefings work on one device. Paired mode uses a six-character code. Local Chrome checks covered report delivery between separate browser contexts, resident refresh, hot-seat privacy, identical debriefs and 375 px layout. All 47 tests, strict type checking and production build passed. Project owner to rehearse on the venue network with a physical phone or use hot-seat. Windows verification remains with the teammate.

- Fixed the opaque floor buttons that covered four floors of the cutaway. The guest flow now labels every floor’s safety, offers readings and charts on demand, and leads the debrief with the represented level’s outcome relative to the untreated outage. Chrome verified selecting all five floors at both 1280 px and 375 px, the first hazard, plan commitment, opening analyses and revising a plan. All 45 tests, strict type checking and production build passed. Project owner to review the simplified Stage 5 flow.

- Implemented visual diagnostics, 66-plan scatter/replay for either policy, live budget/equity preview, and the approved illustrative uncertainty and health layer. The local production build, strict type check and 45 Vitest tests in 9 files passed. The original 40 checks are intact. Additional tests cover weighted Gini, reproducibility, zero/monotone risk, illustrative calibration and baseline coverage of the untreated Equity level-5 endpoint. Coverage at other points is empirical.
- Local Chrome checks passed 360 heat cells, synced level/hour selection, split overlays, flow bands, cross-policy replay, PNG card download, opt-in health ranges and assumptions, plus a 375 px layout. A server-rendered SVG tooltip mismatch found in the first walkthrough was corrected and rechecked. Owner to review the expanded visuals; Windows verification remains with the teammate.

- Implemented the five-floor cutaway on the homepage and guest challenge. Local Chrome walkthrough passed at 1280 px and 375 px, including the first-hazard pause, playback, selection, funding and same-hour comparison. All 40 Vitest tests, strict type checking and production build passed. Owner to review the new Stage 5 presentation.

- The guest challenge at `/challenge` now offers level selection, exact-budget commitment, all-level impact versus untreated failure, hourly inspection, and comparisons with the optimizer and alternative exact-score winners. Verified 40/40 Vitest tests, strict type checking and production build. A 375 px Chrome walkthrough passed guest entry, invalid-budget blocking, first safety difference, keyboard scrubbing, revision, both policies and tied/unique winner handling. Project owner to review the challenge before Stage 6.


- Stage 5 is ready for owner review on macOS. The DAYLIGHT landing page and account screens now lead into a protected DOMINO dashboard. See [PROJECT.md](PROJECT.md) for the account boundary and [README.md](../README.md) for local setup.
- The dashboard now groups the four chart metrics in a keyboard-operable selector, labels the selected hour and full-horizon exposure, shows the applied draft and score, and resets the scenario, policy, fairness weight and credit controls together.
- On Node 22.14.0 with npm 11.3.0, `npm test` passed **40 tests in 7 files**. `npm run typecheck` and `npm run build` passed. Node reports an experimental-feature notice for its built-in SQLite driver. Authentication tests cover persistence across database reopens, duplicate accounts, credential rejection, expiring sessions and sign-out. The chart adapter test checks all five levels at every hour.
- A production Chrome walkthrough using a temporary account database passed registration, password confirmation, sign-in errors, sign-out, reload, and protected-route redirects. It verified the hour-1 Directorate reference, manual and ranked plan application, invalid budgets, keyboard timeline, policy and fairness controls, all four charts and offline reset/replay. Desktop at 1280 px and mobile at 360 px were inspected. The final walkthrough recorded zero browser errors or warnings.
- Earlier checks exposed stale Next.js route types, a missing icon and transient chart overflow on mobile. The final type check regenerates route types, the app serves a local icon, and the chart fits its resized container.
- Windows verification belongs to the teammate. Stage 6 and the proposed V/R/X tie order await project-owner review. Local branch: `codex/accounts-dashboard`.

## Stage status

| Stage | Status | Owner | Evidence / next gate |
| --- | --- | --- | --- |
| Documentation review | Foundation authorized; model choices pending | Both developers | SPEC audit and DECISIONS pending items |
| 1. Foundation and shared types | Awaiting review | Local implementation; teammate review pending | 2 tests passed, type-check/build passed, browser smoke check passed; Windows verification pending |
| 2. Simulation and tests | Awaiting review | Local implementation | 23 tests and type-check/build passed |
| 3. Interventions and planner | Awaiting review | Local implementation | 30 tests, type-check and build passed; scoring follows Stage 4 |
| 4. Human impact and fairness | Awaiting review | Local implementation | 36 tests, type-check/build passed; tie convention pending review |
| 5. Dashboard and charts | Awaiting review | Project owner | Local browser and build checks passed; teammate Windows check pending |
| 6. Integration and demonstration | Not started | Both developers | Stage 5 acceptance and approval |

Use “In progress,” “Awaiting review,” “Complete,” or “Blocked” when applicable. A completed implementation needs evidence from the required checks; a planned task is not completed work.

## Next actions and open questions

| Action / question | Owner | Dependency |
| --- | --- | --- |
| Run `npm ci`, `npm test`, `npm run build`, and `npm run dev` on Windows | Teammate | Share foundation changes first |
| Review shared contracts in `src/lib/simulation/types.ts` and agree on ownership | Both developers | Foundation review |
| Review SPEC limitations and pending interpretations | Both developers | Before simulation implementation |
| Approve baseline equations, tie ordering, and reference conventions | Project owner | See DECISIONS pending review |
| Review Stage 5 and decide whether to authorize Stage 6 | Project owner | Simulation review; Windows checks remain pending |
| Confirm teammate access and private repository visibility | Repository owner | GitHub settings |
| Review submission rules and public repository contents/history | Both developers | Before publishing for submission |

## Recent progress

| Date | Completed change | Verification / reference |
| --- | --- | --- |
| 2026-11-18 | Created the eight requested project documents and reviewed the proposed mathematics. | Initial inventory check; SPEC preliminary audit. No application tests. |
| 2026-11-19 | Confirmed local main tracks origin/main and planning documents are committed. | Local Git inspection; remote visibility not checked. |
| 2026-11-19 | Added shared progress tracking and maintenance instructions. | Documentation-only change; verification reported with this update. |
| 2026-11-19 | Implemented Stage 1 locally: starter screen, shared types, strict tooling, lockfile, and setup instructions. | 2/2 Vitest tests passed; TypeScript and Vite build passed; browser render verified. Windows check pending. |

Add a concise row for meaningful milestones, not every edit. Link to real commits, PRs, issues, or check results when available; do not invent identifiers. Git already retains detailed edit history.

## Update routine

1. Before starting, pull the latest agreed branch and read this snapshot plus the current stage.
2. After a meaningful work session or before handing off, update stage status, completed work, next actions, owners, and the date.
3. Record actual checks and any failures or checks not run. Include a branch/PR link for work not merged; label it accordingly.
4. For an approved architectural decision, update PROJECT's current architecture and append DECISIONS with the change and reason. For a model change, update SPEC first and follow its approval rules. Link here rather than duplicating the decision.
5. Keep unapproved ideas in open questions. Progress updates never grant stage or model approval.
6. Commit the progress update with the related work so the teammate receives both together. Each person updates the rows they own; reconcile concurrent edits before merging.

This is maintained by the developers and their coding assistants during work sessions; it does not update itself in the background. Keep it lightweight so maintaining documentation does not displace building and testing the MVP.
