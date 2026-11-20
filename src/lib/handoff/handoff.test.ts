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

it('opens Level 4 only after both posts are ready and rejects actions from the old round',()=>{
  const rooms=createRegistry(), operator=rooms.create(), resident=rooms.join(operator.code);
  expect(()=>rooms.readyForSecond(operator)).toThrow();
  rooms.commit(operator,plan);
  expect(rooms.readyForSecond(resident).round).toBe(1);
  expect(rooms.readyForSecond(resident).ready).toEqual(['resident']);
  const next=rooms.readyForSecond(operator);
  expect(next).toMatchObject({round:2,reports:[],ready:[],decision:null});
  expect(rooms.readyForSecond(operator)).toEqual(next);
  expect(()=>rooms.commit(operator,plan,1)).toThrow();
  expect(()=>rooms.commit(operator,plan,2)).toThrow();
  expect(()=>rooms.send(resident,'heat',1)).toThrow();
  expect(rooms.send(operator,'heat',2).reports).toEqual(['heat']);
  expect(rooms.commit(resident,plan,2).decision).toEqual(plan);
  expect(rooms.read(operator).round).toBe(2);
});

it('derives the second field report from Level 4 at hour 36',()=>{
  const second=incident(2);
  expect(second.actual).toEqual(second.run[36]!.levels[3]);
  expect(second.official.water).toBe(Math.round(second.run[2]!.levels[3].waterQuality));
  expect(second.actual.hazards).not.toEqual(incident(1).actual.hazards);
  expect(report('power',second)).toContain('Level 4, hour 36');
});
