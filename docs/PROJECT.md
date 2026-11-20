# DOMINO project

## Vision and delivery

Build a polished emergency command center where a viewer can trigger a geothermal failure, inspect its 72-hour cascade, and compare resource plans and power policies through computed human impact. Deadline: Friday, November 20, 2026, at 11 PM Eastern (America/New_York). Two developers, one on macOS and one on Windows, collaborate through GitHub. Favor a working MVP and understandable code over abstraction or spectacle.

## MVP

- Five stacked underground levels with population, delivered power fraction, temperature, water quality, and hazard status.
- One 30% geothermal failure, hour-0 initial state, hours 1–72, and timeline inspection.
- Charts for power, temperature, water quality, unsafe population, and level differences, all derived from simulation snapshots.
- A 100-credit planner with exactly ventilation restoration, recycler repairs, and power redistribution.
- Exhaustive evaluation of 66 exact-budget plans per policy; Directorate and Equity comparison.
- A fairness slider from 0 to 2 that re-ranks cached outcomes, with total harm, deep-level harm, and score shown separately.
- Computed explanations and comparison against 40/30/30 and the three all-in plans.

## Architecture

React, strict TypeScript, Next.js, Recharts, Vitest and local CSS power the dashboard. Next.js Server Actions handle registration, sign-in and sign-out. The server checks an expiring opaque session before rendering the simulator. A persistent SQLite file stores salted password hashes and session digests. Only accounts need the server. All simulation and optimization runs locally after hydration. After assets load, simulation must work without internet. Offline installation or guaranteed offline cold-start hosting is not an MVP promise.

Proposed module boundaries for approval in Stage 1:

| Area | Responsibility |
| --- | --- |
| Domain types and model configuration | Level, policy, allocation, hourly snapshot, outcomes; constants traceable to SPEC |
| Pure power allocator | Weighted allocation with caps and redistribution |
| Pure simulation | Ordered hourly updates and snapshots, no React or browser dependencies |
| Pure metrics | Hazard unions, level harm, total harm, deep-level harm |
| Pure planner | Plan enumeration, cached outcomes, score and deterministic ranking |
| Presentation selectors | Convert snapshots and outcome comparisons into chart data and factual explanations |
| React dashboard | Inputs and rendering; no duplicate model equations |

Precompute 132 disaster outcomes (66 plans × 2 policies). Cache independently of lambda; re-rank on slider changes without rerunning physics. A selected plan's trajectory can be retained with its outcome. A no-intervention reference and normal-operation scenario are separate from the exact-budget search. No worker, state library, router, or persistence dependency is required initially; measure responsiveness before adding infrastructure.

Separate current-hour metrics from cumulative 72-hour metrics. Use one selected snapshot for synchronized charts, indicators, and stacked levels. Maintain one source of UI state for policy, plan, lambda, disaster state, and selected hour. The user triggers the single predefined failure; selectable onset times or repeated failures are outside the initial model.

## Collaboration

Agree on shared input/output types in Stage 1 before parallel implementation. Developer A owns domain logic, power allocation, simulation, planner, and numerical tests. Developer B owns React layout, interactions, chart adapters, accessibility, and integration checks. Both review equations and boundary cases; B reviews planner assumptions and A reviews data wiring. Before Stage 5, B can review documentation, define interface contracts, and prepare the demo within the active stage rather than starting later-stage application work. A developer's OS does not constrain ownership.

Use one agreed Node version and package manager, commit its lockfile, and document portable package scripts in Stage 1. Do not require shell-specific environment assignment or Unix commands for normal development. Use short branches and small PRs; one owner per shared file during an edit. Run checks on both operating systems before the demo. Stop for approval at each stage boundary.

## Boundaries and future extensions

No illness progression, epidemiology, medical demand simulation, medicine relocation, robustness/sensitivity features, ML predictions, live external data, or database-backed simulation. Each requires approval. A future sensitivity feature must vary copies of selected coefficients without changing the baseline specification. No fabricated forecasts or favorable comparisons.

## Current readiness

Use [PROGRESS.md](PROGRESS.md) for the current stage, ownership, verification evidence, and next actions. Keep this document's architecture current as approved changes land; preserve their rationale in [DECISIONS.md](DECISIONS.md).

Stage 1 foundation is authorized and being verified. See PROGRESS for actual results and outstanding cross-platform checks. The reference simulation is implemented; interventions and planner await later stage approvals. SPEC records numerical limitations and unresolved model choices; no proposed model amendment has been adopted.

### Foundation contracts

`src/lib/simulation/types.ts` defines readonly, framework-independent contracts. `FiveLevels<T>` preserves the five-entry top-to-bottom shape; each entry also carries a level identifier. `SimulationInput` distinguishes a normal reference (no allocation) from the failure scenario (allocation required). Hazard flags preserve overlapping causes. Current unsafe population is separate from cumulative person-hours; deep harm is explicitly named in hours per resident. Ranked plans wrap cached outcomes rather than modifying physics results when lambda changes.

The tuple does not prove matching level IDs at runtime. Number ranges, budgets, snapshot counts/order, and matching planner metadata also require runtime validation in later stages. No engine functions or duplicate configuration constants are introduced in Stage 1.

Use Node 22.14.0 and npm 11.3.0 as the team baseline, with a committed npm lockfile and portable npm scripts. Build runs strict type-checking before Vite. Vitest uses a Node environment for future pure domain tests; the starter screen smoke test uses React's static renderer without a DOM test dependency. Browser interaction tests remain separate from this tooling smoke check.

### Stage 2 implementation

`src/lib/simulation/simulation.ts` contains fixed model constants, capped allocation, hazard classification, and `simulateReference(scenario, policy)`. It returns hourly snapshots without React imports. It intentionally exposes only normal and untreated-failure references at this stage. Paid interventions and the full SimulationResult metrics API follow in later stages. Constants and level definitions are frozen against mutation. Tests use absolute tolerance 1e-9 for conservation; strict hazard comparisons never use a tolerance. Model equations remain as specified.

### Stage 3 implementation

`interventions.ts` owns the specified effects, protective weights and allocation validation. `simulateTrajectory` accepts diagnostic zero/partial allocations up to 100 credits; normal scenarios reject paid interventions. `planner.ts` validates exact budgets and enumerates all 66 plans. Each `createPlannerCache()` instance lazily computes 132 trajectories once and freezes the nested outputs against accidental UI mutation. The cache is local to its instance and contains no lambda; a fresh instance is required if configurable scenarios are introduced. `CandidateTrajectory` is the intermediate contract until Stage 4 computes harm and integrates the existing PlanOutcome/RankedPlan contracts. No ranking or tie rule is implemented yet.

### Stage 4 implementation

`metrics.ts` calculates per-level and district harm from the union of hazard flags, excludes hour 0, and validates timeline sequence/level order. `ranking.ts` converts cached trajectories into frozen PlanOutcome records once; ranking uses those records without recomputing physics. `comparePolicies` explicitly returns same-plan and independently optimized results. Scores retain full precision. The proposed ascending V/R/X exact-tie convention is implemented for review, not claimed as a substantive improvement among tied plans.

### The Handoff

The optional field-operations mode presents two briefings from the untreated Directorate trajectory. Level 5 compares a rounded hour-1 official sample with resident observations at hour 12. Level 4 compares hour 2 with hour 36. Paired participants can swap duties inside their original room once both confirm readiness. Each mutation checks the round and current duty. Players assess each threshold and select a budget. The reveal compares that assessment with the actual state, then evaluates a full-horizon counterfactual from hour 1. Solo resident dispatches use deterministic templates. Hot-seat uses a covered pass screen. Paired rooms synchronize reports and the committed decision on one Node process, expire after 30 minutes and end if the server restarts. Simulations still run on the client.

### Stage 5 dashboard

The dashboard’s optional advisor sends a validated numerical scenario summary through an authenticated Next.js route to Gemini. Data panels also generate local readings from their current simulation state. Signed-in users can request a brief Gemini interpretation of one panel through the same route. The key is server-only.

The replay shows an illustrative hourly severity index and each active hazard’s current threshold excursion and consecutive duration. The formula and interpretation are in [SPEC.md](SPEC.md#approved-illustrative-floor-severity). The challenge renders per-hour physical overlays, an interactive exposure matrix, before/after split, modeled dependency and power-flow diagrams, selectable optimizer scatter and local PNG results. Population-weighted safe-hours Gini is a presentation metric independent of ranking. The optional 500-run ensemble uses a local seed and a sampled trajectory entry point that shares the baseline recurrence. It runs only when enabled. Results are summarized per level/hour and per pathway; baseline scores and replay use the deterministic cache. See SPEC for sampling and proxy definitions.

The homepage and guest challenge render the interactive architectural section. Five selectable floor overlays use the selected snapshot for power shading and hazard labels. The funding screen previews the current exact-budget draft at the inspected hour and floor. Incomplete budgets show a labeled untreated reference. Changing the draft clears the comparison and pauses playback. Playback advances through the 72 hourly snapshots using elapsed time. The optional first-hazard pause stops at the exact onset, including when a browser callback arrives late. Funded and untreated runs share a single inspection hour and floor. The scenario introduction is at /brief and Inspect data opens the account-protected dashboard.

The public challenge at `/challenge` uses the existing client-side simulation and ranking cache. The player commits to a level, policy and allocation before seeing results. District impact compares with the zero-spend failure. The optimizer comparison holds policy and budget fixed and uses a fairness weight of zero. The full dashboard retains its adjustable fairness control and account gate.


App owns policy, selected hour, disaster state, draft/applied allocation, and lambda. Cached outcomes drive rankings; the selected trajectory drives cards, levels and Recharts data. Current-hour indicators and full-horizon harm are labeled separately. Zero-spend reference comparisons are explicit. Native controls provide keyboard affordances, with responsive CSS and horizontally scrollable comparison tables. See PROGRESS for interaction and responsive verification.

### Next.js migration

App Router now owns the root page and layout. The dashboard is a client component; calculations, charts, and interactions remain browser-side after hydration. Routes that read an account session render at request time. `vitest.config.ts` retains the Vite React plugin strictly for tests. Original stage descriptions referring to Vite record the previous foundation.

### Current source organization

`src/app/` contains page/layout and global styles. `src/components/dashboard/Dashboard.tsx` owns the interactive UI. `src/lib/simulation/` contains the pure engine, planner, metrics, ranking, interventions and types. Each module group keeps tests in `__tests__/`. Root configuration stays in standard locations. See README for the folder map and docs/README.md for the documentation index.
