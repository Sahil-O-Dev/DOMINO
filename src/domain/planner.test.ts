import { describe, expect, it } from 'vitest';
import { diminishingReturn, interventionEffects, validateAllocation, ZERO_ALLOCATION } from './interventions';
import { createPlannerCache, enumerateAllocations } from './planner';
import { simulateReference, simulateTrajectory, LEVELS } from './simulation';

describe('interventions', () => {
  it('starts at zero with decreasing gains', () => {
    expect(diminishingReturn(0)).toBe(0);
    let previousGain = Infinity;
    for (let c = 10; c <= 100; c += 10) {
      const gain = diminishingReturn(c) - diminishingReturn(c - 10);
      expect(gain).toBeGreaterThan(0); expect(gain).toBeLessThan(previousGain); previousGain = gain;
    }
    expect(interventionEffects(ZERO_ALLOCATION)).toEqual({ fanBonus: 0, repairBonus: 0, redistributionMix: 0 });
  });
  it('rejects invalid budgets and credit values', () => {
    for (const c of [-10, 1, 10.5, NaN, Infinity, 110]) expect(() => validateAllocation({ ...ZERO_ALLOCATION, ventilationCredits: c })).toThrow();
    expect(() => validateAllocation(ZERO_ALLOCATION)).toThrow();
    expect(() => validateAllocation({ ventilationCredits: 100, recyclerCredits: 10, redistributionCredits: 0 }, false)).toThrow();
  });
  it('applies repairs first at hour 25 without changing temperature or power', () => {
    const baseline = simulateReference('geothermal-failure', 'equity');
    const repaired = simulateTrajectory('geothermal-failure', 'equity', { ...ZERO_ALLOCATION, recyclerCredits: 100 });
    expect(repaired.slice(0,25)).toEqual(baseline.slice(0,25));
    expect(repaired[25]!.levels[4].waterQuality - baseline[25]!.levels[4].waterQuality).toBeCloseTo(.12 * 12 * (1 - Math.exp(-3)), 10);
    repaired.forEach((s,h) => s.levels.forEach((l,i) => {
      expect(l.temperatureCelsius).toBe(baseline[h]!.levels[i]!.temperatureCelsius);
      expect(l.deliveredPower).toBe(baseline[h]!.levels[i]!.deliveredPower);
    }));
  });
  it('ventilation begins at hour 1 and creates no power', () => {
    const baseline = simulateReference('geothermal-failure', 'equity');
    const cooled = simulateTrajectory('geothermal-failure', 'equity', { ...ZERO_ALLOCATION, ventilationCredits: 100 });
    expect(cooled[0]).toEqual(baseline[0]);
    expect(cooled[1]!.levels[4].temperatureCelsius).toBeLessThan(baseline[1]!.levels[4].temperatureCelsius);
    cooled.forEach((s,h) => s.levels.forEach((l,i) => expect(l.deliveredPower).toBe(baseline[h]!.levels[i]!.deliveredPower)));
  });
  it('rejects paid interventions in normal references', () => {
    expect(() => simulateTrajectory('normal', 'equity', { ...ZERO_ALLOCATION, recyclerCredits: 100 })).toThrow();
  });
});

describe('exhaustive planner cache', () => {
  it('enumerates exactly the complete 66-plan grid', () => {
    const plans = enumerateAllocations();
    const expected = new Set<string>();
    for (let v=0;v<=100;v+=10) for (let r=0;r<=100;r+=10) for(let x=0;x<=100;x+=10) if(v+r+x===100) expected.add(`${v}/${r}/${x}`);
    expect(new Set(plans.map(p => `${p.ventilationCredits}/${p.recyclerCredits}/${p.redistributionCredits}`))).toEqual(expected);
    expect(plans).toHaveLength(66); plans.forEach(p => validateAllocation(p));
  });
  it('precomputes 132 immutable trajectories and reuses them', () => {
    const cache = createPlannerCache();
    const candidates = cache.getCandidates();
    expect(candidates).toHaveLength(132); expect(cache.getCandidates()).toBe(candidates);
    expect(Object.isFrozen(candidates[0]!.snapshots[1]!.levels[0].hazards)).toBe(true);
    for (const candidate of candidates) {
      expect(candidate.snapshots).toHaveLength(73);
      for (const snapshot of candidate.snapshots.slice(1)) {
        expect(Math.abs(snapshot.levels.reduce((sum,l) => sum+l.deliveredPower,0)-84)).toBeLessThan(1e-9);
        snapshot.levels.forEach((level,i) => {
          expect(level.deliveredPower).toBeLessThanOrEqual(LEVELS[i]!.essentialPowerDemand);
          expect(level.waterQuality).toBeGreaterThanOrEqual(0); expect(level.waterQuality).toBeLessThanOrEqual(100);
          expect(level.temperatureCelsius).toBeGreaterThanOrEqual(LEVELS[i]!.baseTemperatureCelsius);
        });
      }
    }
  });
});
