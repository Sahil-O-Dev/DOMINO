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

Entirely client-side: React + strict TypeScript + Vite; Recharts for charts; Vitest for tests; CSS or lightweight styling for a dark dashboard. No backend, database, external AI API, LLM-generated explanations, or live data. After assets load, simulation must work without internet. Offline installation or guaranteed offline cold-start hosting is not an MVP promise.

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

No illness progression, epidemiology, medical demand simulation, medicine relocation, robustness/sensitivity features, ML predictions, live external data, backend, authentication, or complex database. Each requires approval. A future sensitivity feature must vary copies of selected coefficients without changing the baseline specification. No fabricated forecasts or favorable comparisons.

## Current readiness

Documentation is complete for review; application implementation is not authorized. SPEC records numerical limitations and unresolved choices. No automated application tests exist or have passed. The preliminary arithmetic review is evidence about the proposed model, not implementation validation.
