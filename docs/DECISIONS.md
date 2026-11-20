# Decision log

Only user-authorized decisions belong in the table. The initial brief authorizes the baseline below; it does not approve any amendment proposed during review. Dates use America/New_York.

| Date | Change | Reason |
| --- | --- | --- |
| 2026-11-18 | Adopt the user-specified project direction: a fictional five-level district, 72-hour deterministic model, 100-credit three-intervention planner, and Directorate/Equity comparison. | Initial project brief defines the MVP and limits the prototype to one district. |
| 2026-11-18 | Use React, strict TypeScript, Vite, Recharts, Vitest, and lightweight styling; keep pure simulation/optimization separate from React and entirely client-side. | Initial brief requires testability, offline simulation functionality, no backend/database, and no external AI calls. |
| 2026-11-18 | Preserve the exact proposed equations/constants in SPEC as the review baseline; numerical review does not authorize calibration changes. | User explicitly prohibits silent coefficient changes and requires approval before implementation. |
| 2026-11-18 | Create documentation only and require approval before Stage 1 and between later stages. | Initial task explicitly limits current work to documentation. |
| 2026-11-19 | Keep planning documentation for private collaboration and review its exclusion from the public submission. | User chose to retain the documents for teamwork and remove them for submission; publishing method and history cleanup remain to be settled before publication. |
| 2026-11-19 | Begin Stage 1 foundation and shared domain contracts; do not start the simulation stage yet. | User requested starting the build. Existing stage order establishes foundation first; this does not approve optional model amendments. |

| 2026-11-19 | Proceed with Stage 2 reference simulation using original equations, including normal-operation water drift. | User requested continued building; no coefficient changes adopted. |

| 2026-11-19 | Proceed with Stage 3 interventions and exhaustive candidate simulation using the unchanged equations. | User authorized continued work after Stage 2; fairness scoring remains Stage 4. |

| 2026-11-19 | Proceed with Stage 4 harm metrics, fairness scores and policy comparisons. | User requested continued work after Stage 3; original model equations retained. |

| 2026-11-19 | Build Stage 5 dashboard using engine outcomes and cached rankings. | User requested continued work after Stage 4. |

| 2026-11-19 | Replace Vite app tooling with Next.js App Router; retain Vite tooling for Vitest only. | User explicitly requested migration while preserving the existing application. Simulation remains client-side with no application backend. |

| 2026-11-19 | Organize source into App Router files, dashboard components and a pure simulation library, with grouped module tests. | User requested a clearer file system; no behavior or model changes. |

| 2026-11-19 | Enable real accounts and lift the client-only constraint for authentication. | The project owner selected real accounts. The simulation and planner continue to run locally in the browser. See [PROJECT.md](PROJECT.md) for the implementation. |

| 2026-11-19 | Add an opt-in illustrative uncertainty and health layer with 500 fixed-seed runs, the owner-specified distributions, a 12-hour respiratory lag and illustrative excess-exposure coefficients. | Owner authorized synthetic risk ranges separately from deterministic replay, optimizer and scores. See SPEC for interpretation. |

| 2026-11-20 | Permit on-demand external Gemini explanations in the signed-in dashboard. | Owner approved AI for the advisor. Simulation and scoring remain deterministic. |

## Pending review — not approved decisions

- Review Stage 5 and authorize Stage 6 separately from any model amendment.
- Accept unchanged fairness winners and threshold plateaus, or explicitly request model redesign. Recommended MVP path: retain equations and explain outcomes honestly.
- Approve score/V/R/X ascending tie order. The brief requires deterministic ties but does not choose an order.
- Confirm normal operation uses the same water equation (including level-5 drift), and zero-spend reference scenarios are separate from the exact-budget search.
- Optional model changes in SPEC: baseline-relative water heat penalty; power-proportional cooling bonus; or a separately designed graded exposure objective. None has been adopted or numerically validated as a replacement.

For each approved change, add a dated row stating the exact equation/constant/architecture change and reason, update SPEC first, then update implementation and meaningful tests in the authorized stage. Do not treat an audit observation or a proposal as an approval.
