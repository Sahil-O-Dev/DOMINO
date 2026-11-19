# Required verification plan

Status: this document defines required behavior for the full MVP. Stage 1 now has two passing smoke tests: React static rendering and shared domain type contracts (the latter also checked by TypeScript). The strict type-check and production build pass locally; no simulation, planner, fairness, or interactive dashboard tests are implemented yet. See PROGRESS for current verification and checks not run. Use numerical tolerance for physical arithmetic comparisons when the engine is implemented; never round data before hazard evaluation.

## Core engine

1. **Determinism and purity:** identical inputs yield identical 73-snapshot trajectories, metrics, and orderings on repeated runs. Changing UI selection does not mutate cached outcomes. Inputs and model constants remain unchanged.
2. **Power conservation:** at supplies 0, 84, and 120 under both policies, sum deliveries equals min(supply,120); each delivery lies between zero and demand. An over-demand allocator fixture leaves surplus unused. Exercise multiple cap/redistribution rounds; use simultaneous round shares. Repeat across all 66 interventions per policy. A test arithmetic tolerance must be documented before use.
3. **Hand-check policy distribution:** untreated Directorate at 84 yields `[12,18,24,18,12]`; Equity yields `[8.4,12.6,16.8,21,25.2]`. Full supply satisfies every level under either policy. Level 4 at exactly 0.60 is not power-unsafe.
4. **Normal operation:** no failure keeps supply 120, p = 1, and T equal to base throughout. All levels remain safe, H = D = 0. Under the initial equations, level-5 Q approaches 93.7 instead of staying 95; other Q values remain 95. Revise this expectation only if the user approves a SPEC change.
5. **Failure timing:** hour 0 has full power; hour 1 has supply 84, unchanged through hour 72. There are 73 snapshots and exactly 72 harm opportunities. No repeated multiplication of power by 0.70.
6. **Temperature propagation:** independently calculate one step and its recurrence, including depth multipliers and cooling clamp. For untreated Directorate level 5, target T is 36.466666… and hour-1 T is 30.344. With fixed targets, temperature approaches the target without overshoot; full cooling preserves the base temperature.
7. **Water propagation:** use the new T, not old T. For that same level-5 fixture, hour-1 target Q is 48.619466… and Q is 89.434336. Verify sequential hours, heat penalty onset above 28, and clamps at 0 and 100. Repair bonus belongs in the target, not directly in Q.
8. **Bounds and validation:** accept zero supply and boundary lambda/credit values. Reject nonfinite values, negative credits, fractions or nonmultiples of 10, incorrect budget totals, and unsupported policies at input boundaries. Only documented diagnostic references may bypass the planner's exact-budget rule. Fixed domain inputs need not become a generalized arbitrary district editor.

## Interventions and planner

9. **Diminishing returns:** g(0)=0; g increases toward 1; equal 10-credit increments have decreasing positive gains. Test each scaled effect independently and ensure none exceeds its specified cap. Do not expect spending more on one intervention while reducing another to improve every metric.
10. **Ventilation:** increases effective cooling only, activates at hour 1, cannot exceed effectiveCooling = 1, and leaves delivered power and total supply unchanged.
11. **Repair delay:** compare two diagnostic runs with identical V and X but differing R. Their Q trajectories match through hour 24; their target Q differs at hour 25 if not saturated. Temperature and power are identical. Construct diagnostic inputs explicitly; they are not planner candidates unless their budgets are valid.
12. **Redistribution:** zero X preserves baseline weights; positive X forms the specified elementwise convex mixture. Weights remain positive and sum to 1; cap-and-redistribute still conserves 84 units. Under Equity, redistribution is allowed to disadvantage upper levels rather than magically creating power.
13. **Enumeration:** exactly 66 unique triplets; all nonnegative multiples of 10, each totals 100. Include 40/30/30 and all three all-in endpoints. Independently enumerate integer partitions to detect omissions or duplicates.
14. **Exhaustive evaluation/cache:** both policies produce 132 candidate outcomes with complete timelines and metrics. Changing lambda does not call the simulator again; changing scenario/model inputs invalidates the corresponding cache if such inputs are exposed later. No zero-spend reference enters the exact-budget ranking.

## Human impact and ranking

15. **Hazard union:** on a constructed hour with all three hazards, count each resident once; repeat with one hazard and no hazards. Boundary T = 32, Q = 70, p = 0.60 is safe; independently cross each threshold. Exclude hour 0.
16. **Harm arithmetic:** a constructed case where only level 4 is unsafe for two hours produces level harm 1,000,000 person-hours, H = 1,000,000 and D = 1,000,000 / 1,100,000 hours per resident. All 72 hours unsafe everywhere yields H = 144,000,000 and D = 72. Current unsafe population cannot exceed 2,000,000.
17. **Policy comparison:** same scenario, plan, total supply, budget, and lambda under each policy; compare their actual states and harms. Separately compare each policy's own winner. Do not assert Equity always improves every level or every allocation.
18. **Score:** at lambda = 0, score equals H; at lambda = 2, score equals H + 4,000,000 D. Verify lower is better. Reject lambda outside [0,2]. Deep harm is already included in H and is deliberately weighted again in score.
19. **Ranking and ties:** test approved deterministic tie ordering, repeatability, full-precision scores, and display-only rounding. Use synthetic outcomes A: H=1,000,000,D=1; B: H=2,000,000,D=0. A wins at lambda=0, B at lambda=2, and their scores tie at lambda=0.5. This tests ranking logic without fabricating a crossover in the actual model.
20. **Audit reconciliation:** independently verify SPEC's preliminary results before adopting regression fixtures. Check unchanged winners throughout nonnegative lambda by confirming a minimum-H plan also attains D=0. Preserve legitimate tied or unchanged outcomes; investigate discrepancies instead of editing expectations to force agreement.

## Presentation and integration

21. **Real data in charts:** feed a known engine trajectory through chart adapters and compare every hour/value with snapshots. Changing policy/plan must update chart data; no hardcoded output arrays. Check all 73 points and correct units.
22. **Timeline:** hour 0 displays initial conditions; hour 72 displays final conditions. Chart markers, stacked-level state, hazard indicators, and current unsafe population all use the selected snapshot. Whole-horizon H/D do not change when scrubbing.
23. **Controls:** trigger starts one failure, repeated rendering does not stack it, reset restores initial display; budget controls enforce the grid and sum; lambda re-ranks cached results; a fixed winner remains displayed honestly.
24. **Explanation accuracy:** any claimed reduction equals comparator H minus selected H. Percentage reductions handle zero comparator harm without division by zero. Distinguish tied plans, current state, cumulative harm, same-plan policy comparison, and separately optimized plans. Never translate person-hours into deaths.
25. **Demo environment:** both developers install from the lockfile and run documented scripts on macOS/Windows. Type-check and production build pass. Test keyboard controls, readable chart legends and units, text hazard cues, reset/replay, and simulation with the network disconnected after initial asset load.

Integration/UI checks may initially be manual and recorded honestly. Add a UI test dependency only when it materially verifies behavior and is approved within the active stage; do not add a large test stack merely for decorative elements.

## Stage 2 verification

23 tests in 3 files passed, including the original two foundation checks. Engine checks cover supply conservation/caps, both policies, invalid allocator inputs, determinism, snapshot independence, timing, normal water drift, bounded trajectories, hand-calculated first-hour T/Q, untreated audit exposure, and strict hazard boundaries. Build and TypeScript checks passed. Conservation tolerance is absolute 1e-9; no tolerance or rounding is applied to hazard classification. Intervention, planner, fairness, and interactive chart tests remain pending. Windows verification remains pending.

## Stage 3 verification

30 tests in 4 files passed; strict TypeScript and Vite build passed. New tests cover diminishing gains, invalid credits/budgets, exact repair onset with an independently calculated Q increment, cooling without additional power, normal-reference restrictions, independent full-grid enumeration, all 132 trajectories, power conservation and physical bounds across every evaluated hour, nested cache freezing, and reuse by identity. Fairness scoring and UI interaction checks remain pending.

## Stage 4 verification

36 tests in 5 files passed; TypeScript and production build passed. Added coverage includes overlapping hazards, exclusion of hour zero, hand-calculated deep denominator, zero/maximum exposure, malformed timeline rejection, score endpoints, synthetic crossover and ties, invalid lambda, all 132 outcome records, cached identity, actual winning allocations and same-plan policy comparisons. Dashboard behavior and Windows checks remain pending.
