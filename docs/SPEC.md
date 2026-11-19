# DOMINO simulation specification

Status: proposed initial model, preserved verbatim in substance from the user brief; implementation awaits approval. This is the single source of truth for model equations and constants. Audit findings and proposed amendments at the end are **not** changes to the model. No scientific validation is claimed.

## District and units

Levels i = 1 through 5, top to bottom. Deep levels are 4 and 5.

| Level | Population | Essential demand (fictional power units) | Base/initial temperature (°C) | Initial water quality | Directorate weight | Equity weight | Protective weight |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 200000 | 12 | 25 | 95 | 0.30 | 0.10 | 0.06 |
| 2 | 300000 | 18 | 26 | 95 | 0.25 | 0.15 | 0.10 |
| 3 | 400000 | 24 | 27 | 95 | 0.20 | 0.20 | 0.16 |
| 4 | 500000 | 30 | 28 | 95 | 0.15 | 0.25 | 0.28 |
| 5 | 600000 | 36 | 29 | 95 | 0.10 | 0.30 | 0.40 |

Total population = 2,000,000; deep population = 1,100,000; total essential demand = 120. Normal available power = 120. A single 30% geothermal failure reduces available power to 84 = 120 × (1 − 0.30). Water quality is a synthetic 0–100 index.

## Electricity allocation

For the chosen baseline policy, effective weights are defined below. Weights are allocation priorities, not guaranteed consumed shares.

Start with zero delivered power, remaining supply equal to available power, and all levels active. In each round, distribute the remaining supply proportionally to weights among active levels. Cap each increment at that level's remaining essential demand. Remove satisfied levels; redistribute unused supply among the remaining levels in another round. Repeat until supply is exhausted or every demand is met. Shares within a round must use the same starting remaining supply, not a sequentially shrinking balance.

`p_i = clamp(deliveredPower_i / essentialDemand_i, 0, 1)`

`clamp(z, a, b) = min(b, max(a, z))`

Conserve electricity: total delivered = min(available supply, total essential demand); every delivery is nonnegative and at most demand. All specified weight vectors sum to 1 and are positive; mixtures therefore also sum to 1. Redistribution changes priority, never total supply. Floating-point summation requires an implementation test tolerance, to be chosen and documented in Stage 1; it must not redefine the strict safety thresholds.

## Emergency credits and diminishing returns

Exactly three interventions: V ventilation restoration, R recycler repairs, X power redistribution. Each credit value is a nonnegative multiple of 10.

`V + R + X = 100`

`g(c) = 1 - exp(-0.03 * c)`

`fanBonus = 0.12 * g(V)`

`repairBonus = 12 * g(R)`

`redistributionMix = 0.90 * g(X)`

`weights = (1 - redistributionMix) * baselineWeights + redistributionMix * protectiveWeights`

Weight arithmetic is elementwise. Ventilation adds cooling efficiency only; it generates no electricity and does not alter p_i. Recycler repairs improve the quality target after the delay below. Redistribution modifies either policy toward the same protective vector.

A zero-credit reference `(0,0,0)` is used for the untreated disaster and normal-operation review; it is not a legal candidate in the exact-budget planner. Before the disaster, interventions are inactive and supply is normal.

## Hourly temperature

`depthMultiplier_i = 1 + 0.10 * (i - 1)`

`effectiveCooling_i = clamp(p_i + fanBonus, 0, 1)`

`targetTemperature_i = baseTemperature_i + 8 * (1 - effectiveCooling_i) * depthMultiplier_i`

`T_i(next) = T_i(current) + 0.18 * (targetTemperature_i - T_i(current))`

Base temperatures are the initial-temperature vector in the table, not the preceding hour's temperatures.

## Hourly water quality

Recycler repair activation follows completed simulated hours: for evaluated hours 1 through 24, `activeRepairBonus = 0`; for hours 25 through 72, `activeRepairBonus = repairBonus`.

`targetQ_i = clamp(95 - 65 * (1 - p_i) - 1.3 * max(0, T_i(next) - 28) + activeRepairBonus, 0, 100)`

`Q_i(next) = clamp(Q_i(current) + 0.12 * (targetQ_i - Q_i(current)), 0, 100)`

Use the newly computed temperature for that hour. Do not use old temperature or add repairBonus directly to Q.

## Timing and snapshots

Hour 0 is the initial pre-failure state: normal supply, full essential demand delivered, base temperatures, Q = 95, interventions inactive. The failure begins at hour 1; evaluate hours 1–72, yielding 73 snapshots including hour 0. Supply remains 84 throughout the failure; do not multiply supply by 0.70 again each hour. Ventilation and redistribution start at hour 1. Repair effects start at hour 25. Use one immutable prior snapshot per hourly update; compute each level's new T, then new Q, then hazards.

A normal-operation reference keeps supply at 120 throughout, disables the disaster and interventions, and otherwise uses the same update equations. Hour 0 is displayed but excluded from harm accumulation. This normal reference behavior is an explicit interpretation for review, not permission to add an alternate water equation.

## Unsafe conditions and harm

A level is unsafe in an evaluated hour if at least one is true:

- `temperature > 32°C`
- `waterQuality < 70`
- `powerFraction < 0.60`

Equality at a threshold is safe for that hazard. These are fictional modeling thresholds, not validated safety standards. Each resident is counted at most once per hour even if hazards overlap. All residents of a level share its state; no mobility or illness progression is modeled.

`levelHarm_i = population_i * numberOfUnsafeHours_i`

`H = sum(levelHarm_i)` (total unsafe person-hours)

`D = (levelHarm_4 + levelHarm_5) / (population_4 + population_5)` (deep-level unsafe hours per resident)

`score = H + lambda * 2000000 * D`

Lower is better. The fairness slider controls lambda in [0, 2]; its step size is a UI choice, not a new physical parameter. Show H, D, and score separately. H ranges from 0 to 144,000,000 person-hours; D from 0 to 72 hours per resident. At lambda = 2, the maximum possible score is 432,000,000 weighted person-hours. The deep component adds extra priority to deep residents already included in H; it is deliberate weighting, not another exposure count.

Current unsafe population = sum of populations whose current hazard union is true. It differs from cumulative person-hours. Hazard-specific exposure totals overlap and must not be added to obtain H.

## Exhaustive optimization and comparison

Enumerate nonnegative integers a, b, c with a + b + c = 10, then set `(V,R,X) = (10a,10b,10c)`. There are `(12 choose 2) = 66` plans. For each plan under each policy, run 72 hours, compute H and D, and store the outcome and trajectory: 132 candidate outcomes. Lambda changes only scores and rankings, never cached simulations.

Tie-breaking is required by the brief but its ordering is unspecified. **Proposed for approval:** score ascending, then V ascending, R ascending, X ascending. This lexicographic order is used in the preliminary review below and carries no claim that a tied plan is better. Compare scores at full calculation precision; round only for display. Tie handling at floating-point precision remains an implementation detail to review in Stage 1.

Compare the selected winner with `(40,30,30)`, `(100,0,0)`, `(0,100,0)`, and `(0,0,100)` in V/R/X order. Show the other policy with the identical plan, supply, scenario, lambda, and budget to isolate policy effects. Separately label each policy's own optimized winner so changes in both policy and plan are not confused. The untreated `(0,0,0)` reference must be labeled zero-spend, not equal-budget.

Optimal means minimum chosen score within this specified model and 66-plan grid for one policy. It is not a continuous, real-world, or universally humanitarian optimum.

## Preliminary mathematical review — November 18, 2026

A temporary, in-memory Python arithmetic evaluation of the equations above examined all 132 candidates, plus untreated references. No application source or simulation module was created. Results below are preliminary calculations, not passing Vitest results; verify independently against the future implementation before displaying them in the product or demo.

| Policy / plan (V/R/X) | H (unsafe person-hours) | D (hours per deep resident) |
| --- | ---: | ---: |
| Directorate untreated reference | 72,700,000 | 66.090909… |
| Directorate 40/20/40 | 2,000,000 | 0 |
| Directorate 40/30/30 | 37,900,000 | 34.454545… |
| Directorate 100/0/0 | 71,700,000 | 65.181818… |
| Directorate 0/100/0 | 72,700,000 | 66.090909… |
| Directorate 0/0/100 | 50,400,000 | 0 |
| Equity untreated reference | 36,600,000 | 33.272727… |
| Equity 0/90/10 | 0 | 0 |
| Equity 40/30/30 | 36,800,000 | 0 |
| Equity 100/0/0 | 0 | 0 |
| Equity 0/100/0 | 36,600,000 | 33.272727… |
| Equity 0/0/100 | 64,800,000 | 0 |

Findings:

1. **Fairness cannot change the winning plan under the proposed tie rule.** Directorate 40/20/40 has the minimum H and D = 0. Equity has plans with H = D = 0; lexicographic selection chooses 0/90/10. Because D is nonnegative and lambda is nonnegative, these winners minimize score for every lambda in [0,2], not just sampled slider positions. Other ranks can change. The demo must not promise a changing recommendation.
2. **Threshold plateaus are substantial.** The 66 Directorate plans produce 34 distinct (H,D) pairs; Equity produces 25. Equal harm does not imply identical temperature or water trajectories. Show ties honestly.
3. **Power violations can mask benefits.** Untreated Directorate delivers `[12,18,24,18,12]`, so p = `[1,1,1,0.60,1/3]`. Level 5 is unsafe for all 72 hours regardless of ventilation or repairs if X = 0, imposing at least 43,200,000 person-hours. Ventilation and repairs never directly remove power hazards. This does not dominate every plan: Directorate 40/20/40 has no power-threshold violations and only five unsafe hours on level 3 due to water quality.
4. **Repairs can have no marginal effect on H or D.** All-in repairs equal untreated harm under both policies, despite improved Q. Directorate level 4 remains thermally unsafe after repair; level 5 remains power-unsafe. Under Equity, deep heat exposure persists. Do not describe repairs as ineffective in all physical outputs.
5. **Redistribution can relocate vulnerability.** All-in redistribution makes Directorate levels 2 and 3 power-unsafe and Equity levels 1–3 power-unsafe for all 72 hours. Protecting the deepest levels alone does not ensure low total harm. Electricity is conserved; the protective vector is deliberately stronger than demand-proportional Equity.
6. **Normal operation is safe but not a Q = 95 equilibrium.** With full power and no interventions, level 5 stays at 29°C. Its water target is `95 - 1.3*(29-28) = 93.7`; Q relaxes downward from 95. Other levels remain at Q = 95. An assertion that all healthy values remain constant would contradict the equations.
7. **No numerical instability is evident.** Each temperature step is a convex combination with coefficients 0.82 and 0.18, and water with 0.88 and 0.12. With valid inputs, T remains between its initial value and bounded targets (at most 40.2°C over the allowed p/fan bounds); Q stays in [0,100]. These are mathematically bounded fictional outputs, not evidence of real-world realism.
8. **Ventilation at zero delivered power still cools.** The additive fanBonus can reduce the target even when p = 0. This is an abstract efficiency assumption; the brief does not account for fan energy or model backup power. Do not silently add a power source.

## Approval proposals — none adopted

- **Recommended:** retain the supplied constants and equations for the MVP, accept thresholds and unchanged winners, show physical trajectories alongside harm, and explain ties and fairness truthfully. This resolves demonstration expectations without inventing model behavior.
- Approve the proposed lexicographic tie rule and reference-scenario interpretations explicitly before implementation.
- If healthy water must be stationary, replace only the thermal penalty term with `1.3 * max(0, T_i(next) - max(28, baseTemperature_i))`. This makes every base temperature penalty-free; it also improves level-5 disaster water targets by up to 1.3 points. This is a model change needing approval and a fresh full-grid review.
- If cooling must vanish at zero power, replace `clamp(p_i + fanBonus,0,1)` with `clamp(p_i * (1 + fanBonus),0,1)`. This changes intervention strength and requires recalibration and approval, not an implementation fix.
- If a winner that changes with fairness is essential, request a separate model-design stage. One specific candidate is replacing binary per-hour harm with graded exposure `population_i * (max(0,(T_i-32)/8) + max(0,(70-Q_i)/65) + max(0,(0.60-p_i)/0.60))`, and deriving H and D from those values. Denominators use existing scales, but this changes units, removes the union-based person-hour interpretation, and needs new names, tests, calibration, and approval. It is not part of this SPEC and does not guarantee a ranking crossover. Prefer retaining the current MVP over this scope expansion.

No amendment is authorized by its appearance here. Record any approval in DECISIONS before changing this specification or implementing a revised model.
