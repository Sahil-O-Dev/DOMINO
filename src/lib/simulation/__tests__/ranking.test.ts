import { describe, expect, it } from 'vitest';
import { calculateHarm, fairnessScore } from '../metrics';
import { comparePolicies, createOutcomeCache, rankPlans } from '../ranking';
import { simulateReference } from '../simulation';
import type { PlanOutcome } from '../types';

const cache = createOutcomeCache();
describe('harm metrics', () => {
  it('unions overlapping hazards, excludes hour zero, and weights deep residents correctly', () => {
    const fixture = simulateReference('normal','equity').map(snapshot => ({ ...snapshot,
      levels: snapshot.levels.map(level => ({ ...level, hazards: { heat: snapshot.hour === 0 || (level.levelId === 4 && snapshot.hour <= 2), water: snapshot.hour === 0 || (level.levelId === 4 && snapshot.hour <= 2), power: false } })) as unknown as typeof snapshot.levels,
    }));
    const harm = calculateHarm(fixture);
    expect(harm.totalUnsafePersonHours).toBe(1000000);
    expect(harm.deepUnsafeHoursPerCapita).toBe(1000000/1100000);
    expect(harm.levels[3].unsafeHours).toBe(2);
  });
  it('calculates zero exposure and rejects malformed timelines', () => {
    const normal = simulateReference('normal','equity');
    expect(calculateHarm(normal).totalUnsafePersonHours).toBe(0);
    expect(() => calculateHarm(normal.slice(1))).toThrow();
    expect(() => calculateHarm([...normal].reverse())).toThrow();
  });
  it('matches maximum exposure bounds', () => {
    const allUnsafe = simulateReference('normal','equity').map(snapshot => ({ ...snapshot,
      levels: snapshot.levels.map(level => ({ ...level, hazards: { heat:true,water:true,power:true } })) as unknown as typeof snapshot.levels,
    }));
    const harm = calculateHarm(allUnsafe);
    expect(harm.totalUnsafePersonHours).toBe(144000000);
    expect(harm.deepUnsafeHoursPerCapita).toBe(72);
    expect(fairnessScore(harm,2)).toBe(432000000);
  });
});
describe('fairness ranking', () => {
  it('changes synthetic tradeoff rankings and breaks exact ties deterministically', () => {
    const base = cache.getOutcomes()[0]!;
    const a: PlanOutcome = { ...base, allocation:{ ventilationCredits:0,recyclerCredits:100,redistributionCredits:0 }, simulation:{...base.simulation, harm:{...base.simulation.harm,totalUnsafePersonHours:1000000,deepUnsafeHoursPerCapita:1}} };
    const b: PlanOutcome = { ...base, allocation:{ ventilationCredits:100,recyclerCredits:0,redistributionCredits:0 }, simulation:{...base.simulation, harm:{...base.simulation.harm,totalUnsafePersonHours:2000000,deepUnsafeHoursPerCapita:0}} };
    expect(rankPlans([b,a],0)[0]!.outcome).toBe(a);
    expect(rankPlans([a,b],2)[0]!.outcome).toBe(b);
    expect(rankPlans([b,a],.5)[0]!.outcome).toBe(a);
    for (const lambda of [-1,3,NaN,Infinity]) expect(() => rankPlans([],lambda)).toThrow();
  });
  it('reuses cached physics and preserves the actual unchanged winners', () => {
    const outcomes = cache.getOutcomes();
    expect(outcomes).toHaveLength(132);
    for(const lambda of [0,.5,1,2]) {
      const d = rankPlans(outcomes.filter(o=>o.policy==='directorate'),lambda)[0]!;
      const e = rankPlans(outcomes.filter(o=>o.policy==='equity'),lambda)[0]!;
      expect(d.outcome.allocation).toEqual({ventilationCredits:40,recyclerCredits:20,redistributionCredits:40});
      expect(d.outcome.simulation.harm.totalUnsafePersonHours).toBe(2000000);
      expect(d.outcome.simulation.harm.deepUnsafeHoursPerCapita).toBe(0);
      expect(e.outcome.allocation).toEqual({ventilationCredits:0,recyclerCredits:90,redistributionCredits:10});
      expect(e.score).toBe(0);
    }
    expect(cache.getOutcomes()).toBe(outcomes);
  });
  it('separates same-plan comparison from independently optimized policies', () => {
    const allocation = {ventilationCredits:40,recyclerCredits:30,redistributionCredits:30};
    const comparison = comparePolicies(cache.getOutcomes(),allocation,1);
    expect(comparison.directorate.samePlan.outcome.allocation).toEqual(allocation);
    expect(comparison.equity.samePlan.outcome.allocation).toEqual(allocation);
    expect(comparison.directorate.samePlan.outcome.simulation.harm.totalUnsafePersonHours).toBe(37900000);
    expect(comparison.equity.samePlan.outcome.simulation.harm.totalUnsafePersonHours).toBe(36800000);
  });
});
