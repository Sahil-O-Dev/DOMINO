# Implementation stages

Current gate: documentation review. Do not start Stage 1 without approval. Work on one stage at a time; finish its checks, report actual results and limitations, and stop for approval before the next. A cut below is a proposed contingency, not permission to remove a required MVP feature silently. Never cut mathematical correctness, real simulation data, or conservation tests.

## Stage 1 — Project foundation and shared TypeScript types

**Deliverables:** React/TypeScript/Vite foundation, strict compiler configuration, Vitest setup, minimal CSS entry, shared domain input/output types, documented Node/package-manager versions and portable commands. Agree on hour indexing, hazard flags, policy identity, allocation ordering, and snapshot/metric contracts. Resolve pending SPEC interpretations.

**Acceptance:** both developers can install the same lockfile, run a starter screen, execute a test, type-check, and build on their OS. Domain types have no React dependencies. No simulation coefficients are invented.

**Required tests:** tooling smoke test and type-check/build; validate configuration and type contracts where runtime validation exists. Report commands, counts, and failures.

**Completion checklist:**

- [ ] Resolve approval questions and record decisions.
- [ ] Agree on interfaces and file ownership.
- [ ] Verify installation and scripts on macOS and Windows.
- [ ] Run checks, summarize results, request stage approval.

**Cuts if time is limited:** elaborate lint/format tooling, path aliases, reusable design systems, deployment automation. Keep strict typing and basic tests.

## Stage 2 — Core simulation engine with automated tests

**Deliverables:** pure constants/configuration, capped weighted power allocation, normal and untreated-disaster trajectories, ordered temperature/water updates, hour-0 snapshots, hazard flags. Match the unchanged or explicitly revised SPEC.

**Acceptance:** 73 snapshots; failure begins once at hour 1; 120 normal/84 failed supply; power conserved; no mutated input state; correct strict thresholds and use of new-hour T for Q. Healthy Q behavior matches the approved interpretation.

**Required tests:** determinism, power caps/conservation, normal operation, failure onset, hand-calculated first step, depth/thermal response, water recurrence, bounds, and hour indexing. See TESTS.

**Completion checklist:**

- [ ] Implement physics independent of React.
- [ ] Verify boundary and first-step calculations independently.
- [ ] Run tests, type-check, build; report results.
- [ ] Reconcile preliminary audit discrepancies and stop for approval.

**Cuts if time is limited:** arbitrary scenario editors and generic dependency-graph abstractions; retain the fixed five-level model.

## Stage 3 — Interventions and exhaustive planner

**Deliverables:** three intervention effects, repair timing, validated full-budget input, all 66 allocations, simulations for both policies, lambda-independent outcome cache, basic deterministic ranking contract.

**Acceptance:** 132 candidate trajectories use identical supply and scenario. All allocations spend 100 in increments of 10. Cooling does not generate electricity; repair changes targets from hour 25; redistribution conserves power. Planner evaluates every candidate rather than using a heuristic.

**Required tests:** diminishing returns; zero effects at zero spend; hours 24/25; allocation uniqueness/count/budget; policy mixtures and power conservation; no invalid planner inputs; repeatable enumeration and caching inputs.

**Completion checklist:**

- [ ] Implement and test each intervention independently.
- [ ] Enumerate and evaluate every plan for both policies.
- [ ] Verify delay and budget boundaries.
- [ ] Run checks, report findings, stop for approval.

**Cuts if time is limited:** arbitrary budgets, arbitrary credit increments, workers, incremental search, persistence. Keep the specified grid.

## Stage 4 — Human-impact and fairness comparison

**Deliverables:** per-level unsafe hours, H, D, score, lambda-based re-ranking, deterministic ties, same-plan policy comparisons, separate optimized-policy comparisons, comparator outcomes and computed explanation inputs.

**Acceptance:** hazards use a union, hour 0 is excluded, D uses 1,100,000 residents, rankings match independently calculated scores at lambda endpoints and intermediate values. Re-ranking does not rerun simulations. Ties and unchanged winners are represented honestly.

**Required tests:** double-counting prevention, hand-built metric fixtures, score arithmetic, tie ordering, lambda boundaries, synthetic tradeoff ranking, real-model unchanged-winner regression after independent confirmation, and comparable-budget policy comparisons.

**Completion checklist:**

- [ ] Audit units and denominators.
- [ ] Confirm winners and ties independently.
- [ ] Verify cache reuse on lambda changes.
- [ ] Run checks, report limitations, stop for approval.

**Cuts if time is limited:** Pareto visualizations, sensitivity tools, extra fairness objectives, elaborate narrative generation. Keep H, D, score, and truthful explanations.

## Stage 5 — Interactive dashboard and charts

**Deliverables:** dark five-level district, infrastructure indicators, disaster trigger/reset, timeline scrubber, Recharts trajectories, budget planner, ranked plans, fairness slider, policy comparison, human-impact cards, and computed explanations. Include labeled units, keyboard controls, and text/shape hazard cues alongside colors.

**Acceptance:** one selected hour drives all current-state views; cumulative metrics are clearly labeled. Every chart and numeric claim traces to an engine snapshot or outcome. Invalid plans cannot be run. Timeline covers 0–72; reset returns the normal initial district. Recommendation may remain unchanged as lambda varies.

**Required tests:** chart-data mapping, selected-hour synchronization, trigger/reset, input validation, lambda wiring and cache reuse, policy selection, comparison labels, keyboard operation. Use Vitest for pure adapters; perform UI smoke checks manually unless an approved UI-testing dependency is necessary.

**Completion checklist:**

- [ ] Wire every view to real outputs.
- [ ] Verify hour, units, policy, and plan labels.
- [ ] Inspect desktop layout and keyboard controls.
- [ ] Run checks and UI smoke walkthrough; stop for approval.

**Cuts if time is limited:** decorative animation, custom SVG scenes, sound, cinematic transitions, extra chart modes. Simplify visual styling while preserving required controls and comparisons.

## Stage 6 — Integration, validation, and demonstration

**Deliverables:** integrated MVP, regression review, both-OS verification, production build, locally available demo assets, rehearsed two-minute story, known-limitations report, and GitHub handoff instructions.

**Acceptance:** full scripted demonstration works with actual computed values. After assets load, disconnecting the network does not affect simulation or optimization. Both developers can run the demo; no fabricated numbers or unapproved equation changes. Any hosting/publication is handled separately within the user's authorization.

**Required tests:** full Vitest suite, type-check, production build, integrated timeline/planner/policy walkthrough, cached re-ranking, repeated reset/replay determinism, both-OS smoke test, and network-disconnected simulation after load.

**Completion checklist:**

- [ ] Reconcile displayed metrics with engine output.
- [ ] Rehearse DEMO and confirm every numerical claim.
- [ ] Record actual commands/results and known limitations.
- [ ] Review scope cuts and obtain final stage approval.

**Cuts if time is limited:** hosting polish, extra layouts, exports, secondary animations, optional features. Reserve deadline time for correctness fixes and rehearsal.
