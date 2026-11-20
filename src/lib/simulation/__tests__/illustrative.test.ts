import {describe,it,expect} from 'vitest';
import {illustrate,estimatedCases} from '../illustrative';
import {ZERO_ALLOCATION} from '../interventions';
import {isUnsafe,simulateReference} from '../simulation';
import {ILLUSTRATION as C} from '../illustrative-config';

describe('illustrative ensemble',()=>{
  const result=illustrate('equity',ZERO_ALLOCATION);
  it('reproduces all curves, probabilities and health intervals with the same seed',()=>{
    expect(illustrate('equity',ZERO_ALLOCATION,C.seed)).toEqual(result);
  });
  it('maps zero and increasing cumulative exposure to zero and increasing cases',()=>{
    expect(estimatedCases(100000,0)).toBe(0);
    expect(estimatedCases(100000,.02)).toBeGreaterThan(estimatedCases(100000,.01));
    expect(estimatedCases(100000,C.lambda.respiratory*.6*60)).toBeCloseTo(10000);
  });
  it('covers the deep-level reference safe hours at the 72-hour endpoint of the untreated Equity scenario',()=>{
    const baseline=simulateReference('geothermal-failure','equity');
    const hours=baseline.slice(1).filter(s=>!isUnsafe(s.levels[4].hazards)).length;
    const band=result.cells[4]!.at(-1)!;
    expect(hours).toBeGreaterThanOrEqual(band.lo);
    expect(hours).toBeLessThanOrEqual(band.hi);
  });
});
