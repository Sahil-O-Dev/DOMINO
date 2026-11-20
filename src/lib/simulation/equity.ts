import { LEVELS, MODEL } from './simulation';
import type { HarmMetrics } from './types';

/** Relative mean absolute difference in safe hours across resident pairs.
 * When nobody has a safe hour, the relative measure is undefined. */
export function safeHoursGini(harm: HarmMetrics): number | null {
  const groups = harm.levels.map(l => ({hours: MODEL.hours - l.unsafeHours, people: LEVELS[l.levelId - 1]!.population}));
  const population = groups.reduce((sum, g) => sum + g.people, 0);
  const safe = groups.reduce((sum, g) => sum + g.people * g.hours, 0);
  if (!safe) return null;
  let differences = 0;
  for (const a of groups) {
    for (const b of groups) differences += a.people * b.people * Math.abs(a.hours - b.hours);
  }
  return differences / (2 * population * safe);
}
