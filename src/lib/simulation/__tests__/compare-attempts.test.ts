import { expect, it } from 'vitest';
import { compareAttempts } from '../compare-attempts';
import { calculateHarm } from '../metrics';
import { LEVELS, MODEL, isUnsafe, simulateTrajectory } from '../simulation';
import type { PowerPolicy, SimulationResult } from '../types';

function run(policy: PowerPolicy, repairs: number): SimulationResult {
  const allocation = { ventilationCredits: 40, recyclerCredits: repairs, redistributionCredits: 60 - repairs };
  const snapshots = simulateTrajectory('geothermal-failure', policy, allocation);
  return { input: { scenario: 'geothermal-failure', policy, allocation }, snapshots, harm: calculateHarm(snapshots) };
}

const initial = run('directorate', 30);
const revised = run('directorate', 20);

it('distinguishes district-wide improvement from a loss of safe hours on an individual floor', () => {
  const { levels, exposureChange } = compareAttempts(initial, revised);
  expect(levels.some(level => level.safeHoursGained < 0)).toBe(true);
  expect(levels.some(level => level.safeHoursGained > 0)).toBe(true);
  expect(exposureChange).toBeLessThan(0);
  expect(levels.reduce((sum, level, i) => sum - level.safeHoursGained * LEVELS[i]!.population, 0)).toBe(exposureChange);
});

it('opens at the earliest changed safety status even when only the policy changed', () => {
  const other = run('equity', 30);
  const { firstDifference } = compareAttempts(initial, other);
  expect(firstDifference).toBeDefined();
  const changedFloors = (hour: number) => LEVELS.filter((_, i) =>
    isUnsafe(initial.snapshots[hour]!.levels[i]!.hazards) !== isUnsafe(other.snapshots[hour]!.levels[i]!.hazards));
  const { hour, levelId } = firstDifference!;
  expect(hour).toBeGreaterThanOrEqual(1);
  expect(hour).toBeLessThanOrEqual(MODEL.hours);
  for (let i = 1; i < hour; i++) expect(changedFloors(i)).toHaveLength(0);
  expect(changedFloors(hour)[0]?.id).toBe(levelId);
});

it('reports zero change and offers no divergence for a repeated response', () => {
  const result = compareAttempts(initial, initial);
  expect(result.exposureChange).toBe(0);
  expect(result.levels.map(level => level.safeHoursGained)).toEqual([0, 0, 0, 0, 0]);
  expect(result.firstDifference).toBeUndefined();
});
