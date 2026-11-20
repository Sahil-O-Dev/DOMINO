import { LEVELS } from '../../lib/simulation/simulation';
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

/** Group curves only when their readings agree at tooltip precision for the full run. */
export function visibleLevelSeries(points: readonly Record<string, number>[], metric: string) {
  const groups = new Map<string, number[]>();
  for (const level of LEVELS) {
    const signature = points.map(point => point[metric + level.id]!.toFixed(2)).join('|');
    const group = groups.get(signature);
    if (group) group.push(level.id);
    else groups.set(signature, [level.id]);
  }
  return [...groups.values()].map(levels => ({
    key: metric + levels[0], colorIndex: levels[0]! - 1,
    name: (levels.length === 1 ? 'Level ' : 'Levels ') + levels.join(', '),
  }));
}
