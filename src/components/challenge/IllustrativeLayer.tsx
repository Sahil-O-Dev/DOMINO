import { PanelExplain } from '../PanelExplain';
import { useMemo, useState } from 'react';
import { illustrate } from '../../lib/simulation/illustrative';
import { ILLUSTRATION as C } from '../../lib/simulation/illustrative-config';
import { LEVELS, MODEL, isUnsafe } from '../../lib/simulation/simulation';
import type { HourlySnapshot, LevelId, PowerPolicy, ResourceAllocation } from '../../lib/simulation/types';

interface Props {
  series:readonly HourlySnapshot[]; policy:PowerPolicy; allocation:ResourceAllocation;
  floor:LevelId; hour:number; inspect:(id:LevelId,h:number)=>void;
}
const integer=new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format;
const endpoints=(r:{lo:number;hi:number},scale=1)=>integer(r.lo*scale)+'–'+integer(r.hi*scale);
function Ensemble({series,policy,allocation,floor,hour,inspect}:Props) {
  const results=useMemo(()=>illustrate(policy,allocation),[policy,allocation]);
  const [path,setPath]=useState<'combined'|'heat'|'water'|'respiratory'>('combined');
  const row=results.cells[floor-1]!;
  let count=0;
  const safe=series.map((s,i)=>{if(i>0 && !isUnsafe(s.levels[floor-1]!.hazards))count++;return count;});
  const x=(h:number)=>38+h/MODEL.hours*410;
  const y=(v:number)=>158-v/MODEL.hours*140;
  const ribbon=row.map((c,i)=>[x(i),y(c.hi)].join(',')).concat(row.map((c,i)=>[x(i),y(c.lo)].join(',')).reverse()).join(' ');
  return <>
    <h3>Level {floor} · cumulative safe hours</h3>
    <PanelExplain title="safe-hour uncertainty" onOpen={() => inspect(floor, hour)} reading={`By hour ${hour}, level ${floor} has accumulated ${safe[hour]} safe hours in the deterministic run. The middle 80% of illustrative runs span ${endpoints(row[hour]!)} safe hours. ${(row[hour]!.probability*100).toFixed(1)}% of runs are unsafe on this floor at this particular hour.`}/>
    <svg viewBox="0 0 470 187" className="allocation-plot" role="img" aria-label="Deterministic cumulative safe hours and simulated P10 to P90 band">
      <path d="M38 17V158H448" fill="none" stroke="#a3b5a7"/><polygon fill="#659e96" points={ribbon}/>
      <polyline fill="none" stroke="#f1d3ab" strokeWidth="2.5" points={safe.map((v,i)=>[x(i),y(v)].join(',')).join(' ')}/>
      <path d={'M'+x(hour)+' 17V158'} stroke="white" strokeDasharray="3 4"/>
      <g fill="#ddd" fontSize="11"><text x="10" y="23">{MODEL.hours}</text><text x="22" y="157">0</text><text x="38" y="177">Hour 0</text><text x="405" y="177">Hour {MODEL.hours}</text></g>
    </svg><p>Hour {hour} · deterministic {safe[hour]} safe hours · ensemble P10–P90 {endpoints(row[hour]!)}. The shaded band contains the central 80% of sampled outcomes.</p>
    <h3>Hourly safety across {C.runs} runs</h3><p>Light cells are predominantly safe. Hatched cells span safe and unsafe within P10–P90. Dark cells are predominantly unsafe. The percentage at right follows the replay hour.</p>
    {results.cells.map((cells,i)=><div className="exposure-row" key={i}><span>L{i+1}</span>
      <button className="safety-strip" aria-label={'Inspect uncertainty for level '+(i+1)} onClick={e=>{
        const box=e.currentTarget.getBoundingClientRect();
        inspect(LEVELS[i]!.id,e.detail?Math.max(1,Math.min(MODEL.hours,1+Math.floor((e.clientX-box.left)/box.width*MODEL.hours))):hour);
      }}>{cells.slice(1).map((c,j)=><i key={j} data-band={c.probability>.9?'unsafe':c.probability>=.1?'mixed':'safe'} data-active={j+1===hour} title={'Hour '+(j+1)+' · '+(c.probability*100).toFixed(1)+'% unsafe'}/>)}</button>
      <span>{(cells[hour]!.probability*100).toFixed(1)}% unsafe</span></div>)}
    <h3>Illustrative cases over {MODEL.hours} hours</h3>
    <label>Pathway <select value={path} onChange={e=>setPath(e.target.value as typeof path)}><option value="combined">Any modeled pathway</option><option value="heat">Heat stress</option><option value="water">Waterborne illness</option><option value="respiratory">Respiratory</option></select></label>
    <PanelExplain title="illustrative health outcomes" reading={`For level ${floor}, the middle 80% of sampled 72-hour estimates span ${endpoints(results.cases[floor-1]![path])} cases for the ${path} pathway. The range comes from fictional exposure assumptions and cannot predict actual illness.`}/>
    <div className="table-wrap"><table><thead><tr><th>Residents</th><th>Cases / 100,000 · P10–P90</th><th>Estimated cases · P10–P90</th></tr></thead><tbody>
    {results.cases.map((r,i)=>{
      const level=LEVELS[i],pop=level?.population??LEVELS.reduce((s,l)=>s+l.population,0);
      return <tr key={i}><th>{level?'Level '+level.id:'District'}</th><td>{endpoints(r[path],100000/pop)}</td><td>{endpoints(r[path])}</td></tr>;
    })}</tbody></table></div>
    <details><summary>Sampling and health assumptions</summary><p>Seed {C.seed}. Each run draws one shared geothermal cut from Triangular(25%, mode 30%, 38%). Each level draws independent multipliers once for the run. Ventilation bonus uses Normal(1, 0.08) clipped to [0.75, 1.15]; repair bonus uses Normal(1, 0.15) clipped to [0.6, 1.3]. Downward water adjustment uses Lognormal(median 1, log sigma 0.2), capped at full adjustment per hour. Demand uses Uniform(0.95, 1.05). The population stays fixed.</p>
      <p>Illustrative hourly hazard coefficients: heat {C.lambda.heat.toPrecision(4)} per degree above {MODEL.unsafeTemperature} °C, water {C.lambda.water.toPrecision(4)} per point below {MODEL.unsafeWater}, respiratory {C.lambda.respiratory.toPrecision(4)} per fraction of effective ventilation below {MODEL.unsafePower}, lagged {C.lag} hours. Ventilation uses power fraction plus the scaled fan bonus. Coefficients give roughly 10% risk for sustained excesses of 8 degrees, 60 index points, or a 0.6 ventilation shortfall over the observable exposure window.</p>
      <p>Within each run, estimated cases equal population × (1 − exp(−cumulative hazard)). The combined estimate sums hazards before converting to cases. District intervals use per-run district totals. Rankings always use the baseline.</p></details>
  </>;
}
export function IllustrativeLayer(props:Props) {
  const [enabled,setEnabled]=useState(false);
  return <section className="visual-panel"><label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Show uncertainty and health</label>
    <p>Illustrative model, not real epidemiology.</p>{enabled&&<Ensemble {...props}/>}</section>;
}
