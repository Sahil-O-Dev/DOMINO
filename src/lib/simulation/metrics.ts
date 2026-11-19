import { isUnsafe, LEVELS, mapLevels, MODEL } from './simulation';
import type { HarmMetrics, HourlySnapshot } from './types';

export function calculateHarm(snapshots: readonly HourlySnapshot[]): HarmMetrics {
  if (snapshots.length !== MODEL.hours + 1) throw new RangeError('Expected hours 0 through 72.');
  snapshots.forEach((snapshot, hour) => {
    if (snapshot.hour !== hour || snapshot.levels.length !== 5) throw new RangeError('Invalid snapshot sequence.');
    snapshot.levels.forEach((level, i) => {
      if (level.levelId !== LEVELS[i]!.id) throw new RangeError('Levels must be ordered 1 through 5.');
    });
  });
  const levels = mapLevels((level, i) => {
    const unsafeHours = snapshots.slice(1).reduce((sum, snapshot) => sum + Number(isUnsafe(snapshot.levels[i]!.hazards)), 0);
    return Object.freeze({ levelId: level.id, unsafeHours, unsafePersonHours: level.population * unsafeHours });
  });
  return Object.freeze({ levels: Object.freeze(levels),
    totalUnsafePersonHours: levels.reduce((sum, level) => sum + level.unsafePersonHours, 0),
    deepUnsafeHoursPerCapita: (levels[3].unsafePersonHours + levels[4].unsafePersonHours) / (LEVELS[3].population + LEVELS[4].population),
  });
}

export function fairnessScore(harm: HarmMetrics, fairnessWeight: number): number {
  if (!Number.isFinite(fairnessWeight) || fairnessWeight < 0 || fairnessWeight > 2) throw new RangeError('Fairness weight must be between 0 and 2.');
  return harm.totalUnsafePersonHours + fairnessWeight * LEVELS.reduce((sum, level) => sum + level.population, 0) * harm.deepUnsafeHoursPerCapita;
}
