import { ILLUSTRATION as C } from './illustrative-config';
import { LEVELS, MODEL, mapLevels, sampledTrajectory, isUnsafe } from './simulation';
import { interventionEffects } from './interventions';
import type { PowerPolicy, ResourceAllocation } from './types';

function generator(seed:number) {
  let state=seed>>>0;
  return () => {
    state=(state+0x6D2B79F5)>>>0;
    let n=Math.imul(state^(state>>>15),1|state);
    n^=n+Math.imul(n^(n>>>7),61|n);
    return (((n^(n>>>14))>>>0)+.5)/4294967296;
  };
}
const range=(a:number,b:number,u:number)=>a+(b-a)*u;
function interval(values:number[]) {
  values.sort((a,b)=>a-b);
  const at=(p:number)=>{const pos=p*(values.length-1);return range(values[Math.floor(pos)]!,values[Math.ceil(pos)]!,pos%1);};
  return {lo:at(.1),hi:at(.9)};
}
export function estimatedCases(population:number,hazard:number) {
  return population * -Math.expm1(-hazard);
}
const emptyCases=()=>({heat:[] as number[],water:[] as number[],respiratory:[] as number[],combined:[] as number[]});
const pathways=['heat','water','respiratory','combined'] as const;
export function illustrate(policy:PowerPolicy, allocation:ResourceAllocation, seed:number=C.seed) {
  const uniform=generator(seed);
  const normal=()=>Math.sqrt(-2*Math.log(uniform()))*Math.cos(2*Math.PI*uniform());
  const clipped=(d:typeof C.fan | typeof C.repair)=>Math.min(d.max,Math.max(d.min,1+d.sd*normal()));
  const data=mapLevels(()=>Array.from({length:MODEL.hours+1},()=>({unsafe:0,safe:[] as number[]})));
  const cases=Array.from({length:LEVELS.length+1},emptyCases);
  const fan=interventionEffects(allocation).fanBonus;
  for(let run=0;run<C.runs;run++){
    const [a,m,b]=C.cut, u=uniform();
    const cut=u<(m-a)/(b-a)?a+Math.sqrt(u*(b-a)*(m-a)):b-Math.sqrt((1-u)*(b-a)*(b-m));
    const levels=mapLevels(()=>({fan:clipped(C.fan),repair:clipped(C.repair),waterRate:Math.exp(C.logWaterSigma*normal()),demand:range(...C.demand,uniform())}));
    const snapshots=sampledTrajectory(policy,allocation,{cut,levels});
    const district={heat:0,water:0,respiratory:0,combined:0};
    LEVELS.forEach((level,i)=>{
      const hazards={heat:0,water:0,respiratory:0,combined:0};
      let safe=0;
      data[i]![0]!.safe.push(0);
      for(let h=1;h<=MODEL.hours;h++){
        const l=snapshots[h]!.levels[i]!;
        const cell=data[i]![h]!;
        if(isUnsafe(l.hazards))cell.unsafe++; else safe++;
        cell.safe.push(safe);
        hazards.heat+=C.lambda.heat*Math.max(0,l.temperatureCelsius-MODEL.unsafeTemperature);
        hazards.water+=C.lambda.water*Math.max(0,MODEL.unsafeWater-l.waterQuality);
        if(h>C.lag){
          const vent=snapshots[h-C.lag]!.levels[i]!.powerFraction+fan*levels[i]!.fan;
          hazards.respiratory+=C.lambda.respiratory*Math.max(0,MODEL.unsafePower-vent);
        }
      }
      hazards.combined=hazards.heat+hazards.water+hazards.respiratory;
      for(const k of pathways){
        const value=estimatedCases(level.population,hazards[k]);
        cases[i]![k].push(value); district[k]+=value;
      }
    });
    for(const k of pathways)cases[LEVELS.length]![k].push(district[k]);
  }
  return {cells:data.map(row=>row.map(c=>({...interval(c.safe),probability:c.unsafe/C.runs}))),
    cases:cases.map(c=>({heat:interval(c.heat),water:interval(c.water),respiratory:interval(c.respiratory),combined:interval(c.combined)}))};
}
