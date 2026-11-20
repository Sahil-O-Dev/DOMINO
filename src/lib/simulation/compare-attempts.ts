import { isUnsafe } from './simulation';
import type { LevelId, SimulationResult } from './types';

export function compareAttempts(previous: SimulationResult, current: SimulationResult) {
  const levels = current.harm.levels.map(({ levelId, unsafeHours }, index) => ({
    levelId,
    safeHoursGained: previous.harm.levels[index]!.unsafeHours - unsafeHours,
  }));

  let firstDifference: { hour: number; levelId: LevelId } | undefined;
  for (const snapshot of current.snapshots) {
    if (snapshot.hour === 0) continue;
    const before = previous.snapshots[snapshot.hour]!;
    const changed = snapshot.levels.find((level, index) =>
      isUnsafe(level.hazards) !== isUnsafe(before.levels[index]!.hazards));
    if (changed) {
      firstDifference = { hour: snapshot.hour, levelId: changed.levelId };
      break;
    }
  }

  return {
    levels,
    firstDifference,
    exposureChange: current.harm.totalUnsafePersonHours - previous.harm.totalUnsafePersonHours,
  };
}
