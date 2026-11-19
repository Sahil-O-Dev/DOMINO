import { describe, expect, it } from 'vitest';
import { allocatePower, BASELINE_WEIGHTS, classifyHazards, isUnsafe, LEVELS, simulateReference } from '../simulation';

// Absolute tolerance for physical arithmetic only; hazards use strict comparisons.
const tolerance = 1e-9;
describe('weighted power allocation', () => {
  for (const policy of ['directorate', 'equity'] as const) {
    for (const supply of [0, 1, 84, 120, 150]) {
      it(`conserves and caps ${supply} units under ${policy}`, () => {
        const delivery = allocatePower(supply, BASELINE_WEIGHTS[policy]);
        expect(Math.abs(delivery.reduce((a, b) => a + b, 0) - Math.min(supply, 120))).toBeLessThan(tolerance);
        delivery.forEach((value, i) => { expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThanOrEqual(LEVELS[i]!.essentialPowerDemand); });
      });
    }
  }
  it('matches independently calculated policy shares after caps', () => {
    expect(allocatePower(84, BASELINE_WEIGHTS.directorate)).toEqual([12, 18, 24, 18, 12]);
    allocatePower(84, BASELINE_WEIGHTS.equity).forEach((value, i) => expect(value).toBeCloseTo([8.4, 12.6, 16.8, 21, 25.2][i]!, 10));
  });
  it('rejects invalid inputs', () => {
    for (const supply of [-1, NaN, Infinity]) expect(() => allocatePower(supply, BASELINE_WEIGHTS.equity)).toThrow();
    expect(() => allocatePower(84, [0, 1, 1, 1, 1])).toThrow();
  });
});

describe('reference trajectories', () => {
  it('is deterministic and creates independent snapshots', () => {
    const a = simulateReference('geothermal-failure', 'directorate');
    expect(a).toEqual(simulateReference('geothermal-failure', 'directorate'));
    expect(a[0]!.levels).not.toBe(a[1]!.levels);
    expect(a[0]!.levels[4].temperatureCelsius).toBe(29);
  });
  it('starts a single failure at hour 1 and keeps all 73 snapshots', () => {
    const run = simulateReference('geothermal-failure', 'directorate');
    expect(run.map(s => s.hour)).toEqual(Array.from({ length: 73 }, (_, i) => i));
    expect(run[0]!.availablePower).toBe(120);
    expect(run.slice(1).every(s => s.availablePower === 84)).toBe(true);
    expect(run[1]!.unsafePopulation).toBe(600000);
  });
  for (const policy of ['directorate', 'equity'] as const) {
    it(`keeps normal operation safe under ${policy}, including specified water drift`, () => {
      const run = simulateReference('normal', policy);
      for (const snapshot of run) {
        expect(snapshot.unsafePopulation).toBe(0);
        snapshot.levels.forEach((level, i) => {
          expect(level.powerFraction).toBe(1);
          expect(level.temperatureCelsius).toBe(LEVELS[i]!.baseTemperatureCelsius);
          expect(level.waterQuality).toBeCloseTo(i === 4 ? 93.7 + 1.3 * 0.88 ** snapshot.hour : 95, 10);
        });
      }
    });
    it(`keeps failure values bounded and temperatures approaching their targets under ${policy}`, () => {
      const run = simulateReference('geothermal-failure', policy);
      for (const snapshot of run.slice(1)) {
        snapshot.levels.forEach((level, i) => {
          expect(level.temperatureCelsius).toBeGreaterThanOrEqual(run[snapshot.hour - 1]!.levels[i]!.temperatureCelsius);
          expect(level.temperatureCelsius).toBeLessThanOrEqual(40.2);
          expect(level.waterQuality).toBeGreaterThanOrEqual(0);
          expect(level.waterQuality).toBeLessThanOrEqual(100);
        });
      }
    });
  }
  it('matches hand-calculated first-hour temperature and new-temperature water update', () => {
    const level = simulateReference('geothermal-failure', 'directorate')[1]!.levels[4];
    expect(level.temperatureCelsius).toBeCloseTo(30.344, 10);
    expect(level.waterQuality).toBeCloseTo(89.434336, 10);
  });
  it('matches untreated audit exposure without overlapping hazard counts', () => {
    for (const [policy, expected] of [['directorate', 72700000], ['equity', 36600000]] as const) {
      const run = simulateReference('geothermal-failure', policy);
      expect(run.slice(1).reduce((sum, s) => sum + s.unsafePopulation, 0)).toBe(expected);
    }
  });
  it('uses strict threshold boundaries and a hazard union', () => {
    expect(isUnsafe(classifyHazards(32, 70, 0.60))).toBe(false);
    expect(classifyHazards(33, 69, 0.59)).toEqual({ heat: true, water: true, power: true });
    for (const values of [[32.001,70,.6], [32,69.999,.6], [32,70,.59999]] as const) expect(isUnsafe(classifyHazards(values[0], values[1], values[2]))).toBe(true);
    expect(() => classifyHazards(NaN, 70, 1)).toThrow();
  });
});
