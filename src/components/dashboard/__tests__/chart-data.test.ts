import { expect, it } from 'vitest';
import { simulateReference } from '../../../lib/simulation/simulation';
import { chartData, visibleLevelSeries } from '../chart-data';

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

it('labels overlapping power curves together and keeps distinct heat trajectories separate', () => {
  const points = chartData(simulateReference('geothermal-failure', 'equity'));
  expect(visibleLevelSeries(points, 'p').map(s => s.name)).toEqual(['Levels 1, 2, 3, 4, 5']);
  expect(visibleLevelSeries(points, 't')).toHaveLength(5);
});
