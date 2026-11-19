import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { createOutcomeCache, rankPlans, sameAllocation } from './domain/ranking';
import { calculateHarm } from './domain/metrics';
import { LEVELS, simulateReference, isUnsafe } from './domain/simulation';
import type { PowerPolicy, ResourceAllocation } from './domain/types';

const format = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
const colors = ['#c1e69b', '#74c9b8', '#86b9ed', '#d8afe9', '#f5b57e'];
const equalPlan: ResourceAllocation = { ventilationCredits: 40, recyclerCredits: 30, redistributionCredits: 30 };
const planLabel = (p: ResourceAllocation) => `${p.ventilationCredits} / ${p.recyclerCredits} / ${p.redistributionCredits}`;

export function App() {
  const [cache] = useState(createOutcomeCache);
  const [failure, setFailure] = useState(false);
  const [policy, setPolicy] = useState<PowerPolicy>('directorate');
  const [hour, setHour] = useState(0);
  const [lambda, setLambda] = useState(0);
  const [allocation, setAllocation] = useState<ResourceAllocation | null>(null);
  const [draft, setDraft] = useState(equalPlan);
  const outcomes = useMemo(() => cache.getOutcomes(), [cache]);
  const ranked = useMemo(() => rankPlans(outcomes.filter(o => o.policy === policy), lambda), [outcomes, policy, lambda]);
  const reference = useMemo(() => simulateReference(failure ? 'geothermal-failure' : 'normal', policy), [failure, policy]);
  const selected = outcomes.find(o => o.policy === policy && allocation && sameAllocation(o.allocation, allocation));
  const snapshots = failure && selected ? selected.simulation.snapshots : reference;
  const harm = useMemo(() => calculateHarm(snapshots), [snapshots]);
  const current = snapshots[hour]!;
  const chartData = useMemo(() => snapshots.map(snapshot => ({ hour: snapshot.hour, unsafe: snapshot.unsafePopulation,
    ...Object.fromEntries(snapshot.levels.flatMap(level => [[`t${level.levelId}`, level.temperatureCelsius], [`q${level.levelId}`, level.waterQuality], [`p${level.levelId}`, level.powerFraction * 100]])),
  })), [snapshots]);
  const total = draft.ventilationCredits + draft.recyclerCredits + draft.redistributionCredits;
  const winner = ranked[0]!;
  const untreatedHarm = calculateHarm(simulateReference('geothermal-failure', policy));
  const reduction = untreatedHarm.totalUnsafePersonHours - winner.outcome.simulation.harm.totalUnsafePersonHours;
  const apply = (plan: ResourceAllocation) => { setAllocation(plan); setFailure(true); setHour(72); };
  const reset = () => { setFailure(false); setAllocation(null); setHour(0); };
  return (
    <main className="dashboard">
      <header className="masthead"><a className="wordmark" href="#district">DOMINO /</a><span className="eyebrow">Hollow · District command</span><span className="status">{failure ? 'Emergency scenario' : 'Normal operation'}</span></header>
      <section className="command">
        <div><p className="eyebrow accent">Simulate the collapse. Prevent the catastrophe.</p><h1>Every level counts.</h1><p className="muted">Follow the cascade. Compare the choices. Protect the district.</p></div>
        <div className="actions"><button className="primary" disabled={failure} onClick={() => { setFailure(true); setHour(1); }}>Trigger geothermal failure</button><button onClick={reset}>Reset district</button></div>
      </section>
      <section className="controls" aria-label="Scenario controls">
        <label>Power policy<select value={policy} onChange={e => setPolicy(e.target.value as PowerPolicy)}><option value="directorate">Directorate · upper-level priority</option><option value="equity">Equity · demand proportional</option></select></label>
        <label className="timeline">Inspect hour <strong>{hour} / 72</strong><input aria-label="Timeline hour" type="range" min="0" max="72" value={hour} onChange={e => setHour(Number(e.target.value))} /></label>
        <div><span className="eyebrow">Active plan · V / R / X</span><p>{allocation && failure ? planLabel(allocation) : 'No intervention · 0 credits'}</p></div>
      </section>
      <section className="metrics" aria-label="Human impact">
        <article><span>Unsafe residents · hour {hour}</span><strong>{format(current.unsafePopulation)}</strong></article>
        <article><span>Unsafe person-hours · full 72 hours</span><strong>{format(harm.totalUnsafePersonHours)}</strong></article>
        <article><span>Deep-level unsafe hours per resident</span><strong>{format(harm.deepUnsafeHoursPerCapita)}</strong></article>
        <article><span>Available power · hour {hour}</span><strong>{format(current.availablePower)} <small>/ 120</small></strong></article>
      </section>
      <div className="workspace">
        <section className="panel" id="district"><p className="eyebrow">Live district cross-section</p><h2>Below the surface</h2>
          {current.levels.map((level, i) => <article className={`level ${isUnsafe(level.hazards) ? 'unsafe' : ''}`} key={level.levelId}>
            <div className="level-heading"><h3>Level {level.levelId}</h3><span>{format(LEVELS[i]!.population)} residents</span><strong>{isUnsafe(level.hazards) ? 'Unsafe' : 'Safe'}</strong></div>
            <div className="level-values"><span>Power <b>{format(level.powerFraction * 100)}%</b></span><span>Temperature <b>{format(level.temperatureCelsius)}°C</b></span><span>Water <b>{format(level.waterQuality)} / 100</b></span></div>
            <p className="hazards">{[level.hazards.power && 'Power shortage', level.hazards.heat && 'Heat threshold exceeded', level.hazards.water && 'Water below threshold'].filter(Boolean).join(' · ') || 'All modeled thresholds satisfied'}</p>
          </article>)}
          <p className="footnote">Unsafe: temperature &gt; 32°C, water &lt; 70, or power &lt; 60%. Each resident counts once per unsafe hour.</p>
        </section>
        <section className="panel"><p className="eyebrow">Hour-by-hour consequences</p><h2>The cascade</h2><div className="legend">{LEVELS.map((l,i)=><span key={l.id} style={{color:colors[i]}}>● Level {l.id}</span>)}</div>
          {[{title:'Temperature · °C',prefix:'t',domain:['auto','auto']},{title:'Water quality · synthetic index',prefix:'q',domain:[0,100]},{title:'Delivered essential power · %',prefix:'p',domain:[0,100]},{title:'Unsafe residents',prefix:'unsafe',domain:[0,2000000]}].map(chart => <div key={chart.prefix}><h3 className="chart-title">{chart.title}</h3><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{left:0,right:12,top:8,bottom:0}}><CartesianGrid stroke="#293c36" strokeDasharray="3 3"/><ReferenceLine x={hour} stroke="#ffffff" strokeDasharray="4 4"/><XAxis type="number" domain={[0,72]} dataKey="hour" stroke="#a6b6b0" tick={{fontSize:11}}/><YAxis domain={chart.domain} stroke="#a6b6b0" width={38} tick={{fontSize:11}}/><Tooltip contentStyle={{background:'#172522',border:'1px solid #52675d'}} formatter={value=>format(Number(value))} labelFormatter={value=>`Hour ${value}`}/>{chart.prefix === 'unsafe' ? <Line dataKey="unsafe" name="Unsafe residents" stroke="#f5b57e" dot={false} isAnimationActive={false}/> : LEVELS.map((l,i)=><Line key={l.id} name={`Level ${l.id}`} type="linear" dataKey={`${chart.prefix}${l.id}`} stroke={colors[i]!} dot={false} strokeWidth={2} isAnimationActive={false}/>)}</LineChart></ResponsiveContainer></div></div>)}
        </section>
      </div>
      <div className="workspace">
        <section className="panel"><p className="eyebrow">Emergency resources</p><h2>Allocate 100 credits</h2><p className="muted">Ventilation improves cooling. Repairs begin at hour 25. Redistribution moves existing electricity.</p>
          {([{key:'ventilationCredits',label:'Ventilation restoration'},{key:'recyclerCredits',label:'Recycler repairs'},{key:'redistributionCredits',label:'Power redistribution'}] as const).map(field=><label className="budget-row" key={field.key}>{field.label}<select value={draft[field.key]} onChange={e=>setDraft({...draft,[field.key]:Number(e.target.value)})}>{Array.from({length:11},(_,i)=><option key={i} value={i*10}>{i*10}</option>)}</select></label>)}
          <p role="status">Allocated: <strong>{total} / 100 credits</strong>{total !== 100 && ' · Adjust to exactly 100 to apply.'}</p><button className="primary" disabled={total!==100} onClick={()=>apply(draft)}>Apply allocation</button><button onClick={()=>{setAllocation(null);setFailure(true);}}>Show untreated failure</button>
        </section>
        <section className="panel"><p className="eyebrow">Fairness-aware search · 66 plans per policy</p><h2>Ranked response plans</h2><label>Deep-level fairness weight: <strong>{lambda.toFixed(1)}</strong><input aria-label="Fairness weight" type="range" min="0" max="2" step="0.1" value={lambda} onChange={e=>setLambda(Number(e.target.value))}/></label>
          <p className="muted">Score = total unsafe person-hours + λ × 2,000,000 × deep-level harm. Lower is better. Exact ties use ascending V / R / X.</p>
          <div className="table-wrap"><table><thead><tr><th>V / R / X</th><th>Person-hours</th><th>Deep hours</th><th>Score</th><th>Plan</th></tr></thead><tbody>{ranked.slice(0,5).map(row=><tr key={planLabel(row.outcome.allocation)}><td>{planLabel(row.outcome.allocation)}</td><td>{format(row.outcome.simulation.harm.totalUnsafePersonHours)}</td><td>{format(row.outcome.simulation.harm.deepUnsafeHoursPerCapita)}</td><td>{format(row.score)}</td><td><button onClick={()=>apply(row.outcome.allocation)}>Apply</button></td></tr>)}</tbody></table></div>
          <p className="footnote">Best within this model and credit grid. The leading plan may stay unchanged as fairness increases.</p><p className="muted">Compared with the zero-spend untreated failure, this policy’s leading 100-credit plan reduces modeled exposure by {format(reduction)} person-hours over 72 hours.</p>
        </section>
      </div>
      <section className="panel"><p className="eyebrow">Same disaster · same 100-credit budget</p><h2>Compare the choices</h2><p className="muted">Each row holds the allocation fixed across policies. Policy-specific winners can use different plans.</p><div className="table-wrap"><table><thead><tr><th>Strategy</th><th>V / R / X</th><th>Directorate person-hours</th><th>Equity person-hours</th></tr></thead><tbody>{[{label:'Selected policy’s best',plan:winner.outcome.allocation},{label:'Approximately equal',plan:equalPlan},{label:'All ventilation',plan:{ventilationCredits:100,recyclerCredits:0,redistributionCredits:0}},{label:'All repairs',plan:{ventilationCredits:0,recyclerCredits:100,redistributionCredits:0}},{label:'All redistribution',plan:{ventilationCredits:0,recyclerCredits:0,redistributionCredits:100}}].map(row=><tr key={row.label}><td>{row.label}</td><td>{planLabel(row.plan)}</td>{(['directorate','equity'] as const).map(p=><td key={p}>{format(outcomes.find(o=>o.policy===p&&sameAllocation(o.allocation,row.plan))!.simulation.harm.totalUnsafePersonHours)}</td>)}</tr>)}</tbody></table></div>
        <div className="policy-winners">{(['directorate','equity'] as const).map(p=>{const best=rankPlans(outcomes.filter(o=>o.policy===p),lambda)[0]!;return <p key={p}><strong>{p === 'directorate' ? 'Directorate' : 'Equity'} winner:</strong> {planLabel(best.outcome.allocation)} · {format(best.outcome.simulation.harm.totalUnsafePersonHours)} person-hours · {format(best.outcome.simulation.harm.deepUnsafeHoursPerCapita)} deep hours per resident.</p>;})}</div>
      </section>
      <footer>Fictional scenario · Synthetic thresholds · Exposure estimates, not casualty forecasts.</footer>
    </main>
  );
}
