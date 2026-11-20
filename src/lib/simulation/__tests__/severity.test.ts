import { expect, it } from 'vitest';
import { consecutiveHazardHours, floorSeverity } from '../severity';
import { mapLevels, simulateReference, simulateTrajectory } from '../simulation';
import { createOutcomeCache } from '../ranking';

const baseline = simulateReference('geothermal-failure', 'directorate');
const threshold = {...baseline[0]!.levels[4], temperatureCelsius:32, waterQuality:70, powerFraction:0.6};

it('is zero at the exact safety thresholds and adds scaled shortfalls without a cap at one', () => {
  expect(floorSeverity(threshold).index).toBe(0);
  expect(floorSeverity({...threshold, temperatureCelsius:36}).index).toBe(.5);
  expect(floorSeverity({...threshold, waterQuality:37.5}).index).toBe(.5);
  expect(floorSeverity({...threshold, powerFraction:0.3}).index).toBe(.5);
  expect(floorSeverity({...threshold, temperatureCelsius:36, waterQuality:37.5, powerFraction:0.3}).index).toBe(1.5);
  expect(floorSeverity({...threshold, temperatureCelsius:32.000001}).index).toBeGreaterThan(0);
});

it('matches unsafe status across every floor of all legal plans and both policies', () => {
  let inconsistencies = 0;
  for (const outcome of createOutcomeCache().getOutcomes()) {
    for (const snapshot of outcome.simulation.snapshots) {
      for (const level of snapshot.levels) {
        const { index } = floorSeverity(level);
        if (!Number.isFinite(index) || (index > 0) !== Object.values(level.hazards).some(Boolean)) inconsistencies++;
      }
    }
  }
  expect(inconsistencies).toBe(0);
});

it('shows the benefit of repairs while the power hazard keeps level 5 unsafe', () => {
  const repaired = simulateTrajectory('geothermal-failure', 'directorate', {ventilationCredits:0, recyclerCredits:100, redistributionCredits:0});
  const floor = (run: typeof baseline, hour: number) => floorSeverity(run[hour]!.levels[4]);
  expect(floor(repaired,24)).toEqual(floor(baseline,24));
  expect(floor(repaired,72).index).toBeLessThan(floor(baseline,72).index);
  expect(floor(repaired,72).water).toBeLessThan(floor(baseline,72).water);
  expect(floor(repaired,72).power).toBe(floor(baseline,72).power);
  expect(consecutiveHazardHours(repaired,72,5,'power')).toBe(72);
});

it('counts each uninterrupted hazard separately and resets its duration on recovery', () => {
  const history = [false,true,true,false,true].map((hot, hour) => {
    const snapshot = baseline[hour]!;
    return {...snapshot, levels: mapLevels(({id}, i) => id === 5
      ? {...snapshot.levels[i]!, hazards: {power:hour>0, heat:hot, water:false}}
      : snapshot.levels[i]!)};
  });
  expect(consecutiveHazardHours(history,0,5,'heat')).toBe(0);
  expect(consecutiveHazardHours(history,2,5,'heat')).toBe(2);
  expect(consecutiveHazardHours(history,3,5,'heat')).toBe(0);
  expect(consecutiveHazardHours(history,4,5,'heat')).toBe(1);
  expect(consecutiveHazardHours(history,4,5,'power')).toBe(4);
});
