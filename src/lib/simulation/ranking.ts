import { fairnessScore, calculateHarm } from './metrics';
import { createPlannerCache } from './planner';
import type { PlanOutcome, PowerPolicy, RankedPlan, ResourceAllocation } from './types';

export function sameAllocation(a: ResourceAllocation, b: ResourceAllocation): boolean {
  return a.ventilationCredits === b.ventilationCredits && a.recyclerCredits === b.recyclerCredits && a.redistributionCredits === b.redistributionCredits;
}

/** Exact-score ties use ascending V, R, X; ties carry no claim of superior outcomes. */
export function rankPlans(outcomes: readonly PlanOutcome[], fairnessWeight: number): readonly RankedPlan[] {
  // Validate even an empty result set.
  if (!Number.isFinite(fairnessWeight) || fairnessWeight < 0 || fairnessWeight > 2) throw new RangeError('Fairness weight must be between 0 and 2.');
  return outcomes.map(outcome => Object.freeze({ outcome, fairnessWeight, score: fairnessScore(outcome.simulation.harm, fairnessWeight) }))
    .sort((a, b) => a.score - b.score ||
      a.outcome.allocation.ventilationCredits - b.outcome.allocation.ventilationCredits ||
      a.outcome.allocation.recyclerCredits - b.outcome.allocation.recyclerCredits ||
      a.outcome.allocation.redistributionCredits - b.outcome.allocation.redistributionCredits);
}

export function createOutcomeCache() {
  const trajectories = createPlannerCache();
  let outcomes: readonly PlanOutcome[] | undefined;
  return {
    getOutcomes(): readonly PlanOutcome[] {
      if (!outcomes) outcomes = Object.freeze(trajectories.getCandidates().map(candidate => Object.freeze({
        policy: candidate.policy, allocation: candidate.allocation,
        simulation: Object.freeze({
          input: Object.freeze({ scenario: 'geothermal-failure' as const, policy: candidate.policy, allocation: candidate.allocation }),
          snapshots: candidate.snapshots, harm: calculateHarm(candidate.snapshots),
        }),
      })));
      return outcomes;
    },
  };
}

export function comparePolicies(outcomes: readonly PlanOutcome[], allocation: ResourceAllocation, fairnessWeight: number) {
  const forPolicy = (policy: PowerPolicy) => {
    const policyOutcomes = outcomes.filter(outcome => outcome.policy === policy);
    const selected = policyOutcomes.find(outcome => sameAllocation(outcome.allocation, allocation));
    const winner = rankPlans(policyOutcomes, fairnessWeight)[0];
    if (!selected || !winner) throw new RangeError('Missing policy or allocation outcomes.');
    return { samePlan: { outcome: selected, fairnessWeight, score: fairnessScore(selected.simulation.harm, fairnessWeight) }, optimized: winner };
  };
  return { directorate: forPolicy('directorate'), equity: forPolicy('equity') };
}
