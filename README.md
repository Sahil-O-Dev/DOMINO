# DOMINO

**Simulate the Collapse. Prevent the Catastrophe.**

A fictional underground infrastructure failure simulator and emergency resource planner for Patriot HackFest Fall 2026.

## Development setup

Use Node.js **22.14.0** and npm **11.3.0** for a matching team environment. `.nvmrc` records the Node version for compatible version managers; on Windows, installing that version directly also works. No global Next.js installation is needed.

From the repository folder on macOS or Windows:

```sh
npm ci
npm run dev
```

Open the local URL printed by Next.js (normally http://localhost:3000). Stop the server with Ctrl+C. On a fresh clone, `npm ci` installs the exact dependencies in the committed lockfile; do not commit `node_modules`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm test` | Run tests once |
| `npm run test:watch` | Watch tests while developing |
| `npm run typecheck` | Check strict TypeScript contracts |
| `npm run build` | Build and type-check the Next.js app in `.next/` |
| `npm run preview` | Serve an existing production build locally |

## Accounts and local storage

Open the local app and choose **Create account**. Registration signs you into the simulator. Use **Sign out** in the navigation to end the session. Returning users can sign in with the same email and password.

Next.js creates `.data/accounts.sqlite` in the project directory on the first account operation. The directory is ignored by Git. Set `DOMINO_AUTH_DB` in `.env.local` to use a different file. Accounts persist across restarts of that server. Each teammate’s local install has its own account database. A shared deployment requires one Node server with a persistent writable volume and HTTPS. Node 22.14 prints an experimental-feature notice for its built-in SQLite driver.

Authentication needs the server. Once the signed-in simulator has loaded, changing the policy, inspecting hours, and comparing allocations work offline.

## Current scope

Interactive dashboard with a five-level district, disaster trigger/reset, timeline, charts, resource allocation, fairness rankings and policy comparisons. All physical outputs come from the pure domain engine. Run `npm run dev` to explore it locally.

The implementation uses the fictional equations in SPEC. Integration validation and Windows checks remain; see PROGRESS for evidence and limitations.

## Team handoff

Read [the specification](docs/SPEC.md), [stages](docs/STAGES.md), [test plan](docs/TESTS.md), [project architecture](docs/PROJECT.md), then [current progress](docs/PROGRESS.md). Follow [development instructions](AGENTS.md).

Agree on shared types before both developers build against them. Pull the latest changes, work on a task branch, run checks, and request review before merging. Update progress with related work. Equations stay unchanged unless explicitly approved and recorded in [DECISIONS](docs/DECISIONS.md).

## Next.js setup

The app now uses Next.js App Router. `src/app/layout.tsx` supplies metadata and global CSS, while `src/app/page.tsx` renders the scenario introduction. Domain calculations remain pure TypeScript. The protected dashboard is served at `/domino`. Account handling lives in `src/lib/auth/`. Vite and its React plugin remain development dependencies solely for Vitest.

After pulling this migration, stop the old Vite server, run `npm ci`, then `npm run dev`. Use port 3000 instead of 5173. For a production preview, run `npm run build` followed by `npm start`.

## Where files belong

```text
src/
  app/                          Next.js routes, root layout and global CSS
  components/
    dashboard/
      Dashboard.tsx             Interactive dashboard UI
      __tests__/                Dashboard rendering checks
  lib/
    simulation/                 Pure TypeScript model and optimization
      simulation.ts             Hourly physics and power allocation
      interventions.ts          Resource effects and budget validation
      planner.ts                Allocation enumeration and trajectory cache
      metrics.ts                Human-impact calculations
      ranking.ts                Fairness rankings and policy comparisons
      types.ts                  Shared data contracts
      __tests__/                Engine and contract tests
docs/                           Specification, plan, decisions and progress
```

Start frontend work in `src/components/dashboard/`; start model work in `src/lib/simulation/`. Keep routes in `src/app/` thin. Add tests in the corresponding `__tests__/` folder; Vitest discovers them automatically. See [the documentation index](docs/README.md) for planning files.

Root files such as `package.json`, its lockfile, `tsconfig.json`, `vitest.config.ts`, and `next-env.d.ts` are tooling configuration. Keep them at the root. `.next/`, `node_modules/`, `dist/`, and TypeScript build caches are generated and ignored by Git; VS Code workspace settings hide them from the explorer. They remain on disk and can be shown by changing `.vscode/settings.json`.
