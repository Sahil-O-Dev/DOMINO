import { expect, it } from 'vitest';
import { incident, report, type Decision } from './incident';
import { createRegistry } from './rooms';

const plan:Decision={belief:{heat:true,water:true,power:true},allocation:{ventilationCredits:40,recyclerCredits:30,redistributionCredits:30}};
it('derives stale official readings and current field evidence from the same reference',()=>{
  const data=incident();
  expect(data.official.heat).toBe(Math.round(data.run[1]!.levels[4].temperatureCelsius));
  expect(data.feedFlags.heat).toBe(false);
  expect(data.actual.hazards.heat).toBe(true);
  expect(report('heat',data)).toContain(data.actual.temperatureCelsius.toFixed(1));
});
it('pairs one resident, keeps roles distinct and locks both views to the committed decision',()=>{
  const rooms=createRegistry();
  const operator=rooms.create();
  expect(()=>rooms.commit(operator,plan)).toThrow();
  const resident=rooms.join(operator.code);
  expect(()=>rooms.join(operator.code)).toThrow();
  expect(()=>rooms.send(operator,'heat')).toThrow();
  expect(()=>rooms.commit(resident,plan)).toThrow();
  expect(()=>rooms.read({...operator,token:'invalid'})).toThrow();
  rooms.send(resident,'water');rooms.send(resident,'water');
  expect(rooms.read(operator).reports).toEqual(['water']);
  expect(()=>rooms.commit(operator,{...plan,allocation:{...plan.allocation,recyclerCredits:0}})).toThrow();
  rooms.commit(operator,plan);
  expect(rooms.commit(operator,{...plan,belief:{heat:false,water:false,power:false}}).decision).toEqual(plan);
  expect(rooms.read(resident).decision).toEqual(plan);
  expect(()=>rooms.send(resident,'heat')).toThrow();
});
