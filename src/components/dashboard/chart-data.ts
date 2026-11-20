import type { HourlySnapshot } from '../../lib/simulation/types';

export function chartData(snapshots: readonly HourlySnapshot[]) {
  return snapshots.map(snapshot => {
    const point: Record<string, number> = { hour: snapshot.hour, unsafe: snapshot.unsafePopulation };
    for (const level of snapshot.levels) {
      point['t' + level.levelId] = level.temperatureCelsius;
      point['q' + level.levelId] = level.waterQuality;
      point['p' + level.levelId] = level.powerFraction * 100;
    }
    return point;
  });
}
