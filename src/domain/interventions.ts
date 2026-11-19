import type { ResourceAllocation } from './types';

export const INTERVENTIONS = Object.freeze({ budget: 100, step: 10, decay: 0.03,
  fanScale: 0.12, repairScale: 12, redistributionScale: 0.90, repairStartHour: 25 });
export const PROTECTIVE_WEIGHTS = Object.freeze([0.06, 0.10, 0.16, 0.28, 0.40] as const);
export const ZERO_ALLOCATION: ResourceAllocation = Object.freeze({ ventilationCredits: 0, recyclerCredits: 0, redistributionCredits: 0 });

/** Diagnostics may spend less than budget; planner candidates must spend exactly 100. */
export function validateAllocation(allocation: ResourceAllocation, exactBudget = true): void {
  const credits = [allocation.ventilationCredits, allocation.recyclerCredits, allocation.redistributionCredits];
  if (credits.some(c => !Number.isFinite(c) || c < 0 || c % INTERVENTIONS.step !== 0)) {
    throw new RangeError('Credits must be finite nonnegative multiples of 10.');
  }
  const total = credits.reduce((a, b) => a + b, 0);
  if (total > INTERVENTIONS.budget || (exactBudget && total !== INTERVENTIONS.budget)) {
    throw new RangeError(exactBudget ? 'A plan must spend exactly 100 credits.' : 'Credits cannot exceed 100.');
  }
}
export function diminishingReturn(credits: number): number {
  if (!Number.isFinite(credits) || credits < 0 || credits > 100 || credits % 10 !== 0) throw new RangeError('Invalid intervention credits.');
  return 1 - Math.exp(-INTERVENTIONS.decay * credits);
}
export function interventionEffects(allocation: ResourceAllocation) {
  validateAllocation(allocation, false);
  return {
    fanBonus: INTERVENTIONS.fanScale * diminishingReturn(allocation.ventilationCredits),
    repairBonus: INTERVENTIONS.repairScale * diminishingReturn(allocation.recyclerCredits),
    redistributionMix: INTERVENTIONS.redistributionScale * diminishingReturn(allocation.redistributionCredits),
  };
}
