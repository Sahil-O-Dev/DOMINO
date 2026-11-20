import { safeHoursGini } from '../../lib/simulation/equity';
import type { PlanOutcome } from '../../lib/simulation/types';

export function allocationPlot(outcomes: readonly PlanOutcome[]) {
  const points = outcomes.map(outcome => ({
    outcome, x: outcome.simulation.harm.totalUnsafePersonHours, y: safeHoursGini(outcome.simulation.harm),
  }));
  const maxHarm = Math.max(1, Math.ceil(Math.max(...points.map(p => p.x)) / 1e6)) * 1e6;
  const maxGini = Math.max(1, Math.ceil(10 * Math.max(...points.map(p => p.y ?? 0)))) / 10;
  return { points, maxHarm, maxGini };
}
