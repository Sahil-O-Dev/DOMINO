import { expect,it } from 'vitest';
import { calculateHarm } from '../metrics';
import { simulateReference, MODEL } from '../simulation';
import { safeHoursGini } from '../equity';
const base=calculateHarm(simulateReference('normal','equity'));
it('gives zero for equal positive safe hours',()=>expect(safeHoursGini(base)).toBe(0));
it('weights inequality by residents and handles zero safe hours',()=>{
  const h=structuredClone(base);
  for(const l of h.levels)Object.assign(l,{unsafeHours:MODEL.hours});
  expect(safeHoursGini(h)).toBeNull();
  Object.assign(h.levels[0],{unsafeHours:0});
  expect(safeHoursGini(h)).toBeCloseTo(.9);
});
