import { expect, it } from 'vitest';
import { simulateReference } from '../../../lib/simulation/simulation';
import { chartData } from '../chart-data';

it('maps each hour and level to its chart series including percent of essential demand', () => {
  const snapshots = simulateReference('geothermal-failure', 'directorate');
  const points = chartData(snapshots);
  expect(points).toHaveLength(snapshots.length);
  for (const snapshot of snapshots) {
    const point = points[snapshot.hour]!;
    expect(point.hour).toBe(snapshot.hour);
    expect(point.unsafe).toBe(snapshot.unsafePopulation);
    for (const level of snapshot.levels) {
      expect(point['p' + level.levelId]).toBe(level.powerFraction * 100);
      expect(point['q' + level.levelId]).toBe(level.waterQuality);
      expect(point['t' + level.levelId]).toBe(level.temperatureCelsius);
    }
  }
});
