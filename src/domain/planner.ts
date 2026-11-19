import { INTERVENTIONS, validateAllocation } from './interventions';
import { simulateTrajectory } from './simulation';
import type { HourlySnapshot, PowerPolicy, ResourceAllocation } from './types';

export interface CandidateTrajectory {
  readonly policy: PowerPolicy;
  readonly allocation: ResourceAllocation;
  readonly snapshots: readonly HourlySnapshot[];
}
export function enumerateAllocations(): readonly ResourceAllocation[] {
  const allocations: ResourceAllocation[] = [];
  for (let ventilationCredits = 0; ventilationCredits <= INTERVENTIONS.budget; ventilationCredits += INTERVENTIONS.step) {
    for (let recyclerCredits = 0; recyclerCredits <= INTERVENTIONS.budget - ventilationCredits; recyclerCredits += INTERVENTIONS.step) {
      allocations.push(Object.freeze({ ventilationCredits, recyclerCredits,
        redistributionCredits: INTERVENTIONS.budget - ventilationCredits - recyclerCredits }));
    }
  }
  return Object.freeze(allocations);
}

/** Instance-local cache; lambda is deliberately absent. No browser/React dependencies. */
export function createPlannerCache() {
  let cached: readonly CandidateTrajectory[] | undefined;
  return {
    getCandidates(): readonly CandidateTrajectory[] {
      if (cached) return cached;
      const candidates: CandidateTrajectory[] = [];
      for (const policy of ['directorate', 'equity'] as const) {
        for (const allocation of enumerateAllocations()) {
          validateAllocation(allocation);
          const snapshots = simulateTrajectory('geothermal-failure', policy, allocation);
          for (const snapshot of snapshots) {
            for (const level of snapshot.levels) { Object.freeze(level.hazards); Object.freeze(level); }
            Object.freeze(snapshot.levels);
            Object.freeze(snapshot);
          }
          candidates.push(Object.freeze({ policy, allocation, snapshots: Object.freeze(snapshots) }));
        }
      }
      cached = Object.freeze(candidates);
      return cached;
    },
  };
}
