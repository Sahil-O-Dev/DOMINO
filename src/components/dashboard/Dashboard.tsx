'use client';

import { useMemo, useState } from 'react';
import { Trajectories } from './Trajectories';
import { Activity, RotateCcw } from 'lucide-react';
import { createOutcomeCache, rankPlans, sameAllocation } from '../../lib/simulation/ranking';
import { calculateHarm, fairnessScore } from '../../lib/simulation/metrics';
import { LEVELS, MODEL, simulateReference, isUnsafe } from '../../lib/simulation/simulation';
import type { PowerPolicy, ResourceAllocation } from '../../lib/simulation/types';

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const format = numberFormat.format;
const equalPlan: ResourceAllocation = { ventilationCredits: 40, recyclerCredits: 30, redistributionCredits: 30 };
const planLabel = (p: ResourceAllocation) => `${p.ventilationCredits} / ${p.recyclerCredits} / ${p.redistributionCredits}`;

export function Dashboard() {
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
  const total = draft.ventilationCredits + draft.recyclerCredits + draft.redistributionCredits;
  const winner = ranked[0]!;
  const lowestScoreCount = ranked.filter(row => row.score === winner.score).length;
  const untreatedHarm = useMemo(() => calculateHarm(simulateReference('geothermal-failure', policy)), [policy]);
  const reduction = untreatedHarm.totalUnsafePersonHours - winner.outcome.simulation.harm.totalUnsafePersonHours;
  const apply = (plan: ResourceAllocation) => { setAllocation(plan); setDraft(plan); setFailure(true); setHour(MODEL.hours); };
  const reset = () => { setFailure(false); setAllocation(null); setHour(0); setPolicy('directorate'); setLambda(0); setDraft(equalPlan); };
  return (
    <main className="shell dashboard" id="main-content">
      <section className="command">
        <div><p className="eyebrow accent">The Hollow / District simulator</p><h1>DOMINO control room</h1>
          <span className={failure ? 'status emergency' : 'status'} role="status"><i/>{failure ? 'Geothermal failure scenario' : 'Normal operation'}</span></div>
        <div className="actions"><button className="primary" disabled={failure} onClick={() => { setFailure(true); setHour(1); }}><Activity size={17}/> Trigger geothermal failure</button><button onClick={reset}><RotateCcw size={15}/> Reset district</button></div>
      </section>
      <nav className="section-nav" aria-label="Dashboard sections"><a href="#district">District overview</a><a href="#planner">Resource planner</a><a href="#comparison">Policy comparison</a></nav>
      <section className="controls" aria-label="Scenario controls">
        <label>Power policy<select value={policy} onChange={e => setPolicy(e.target.value as PowerPolicy)}><option value="directorate">Directorate · upper-level priority</option><option value="equity">Equity · demand proportional</option></select></label>
        <label className="timeline">Inspect hour <strong>{hour} / 72</strong><input aria-label="Timeline hour" type="range" min="0" max="72" value={hour} onChange={e => setHour(Number(e.target.value))} /></label>
        <div><span className="eyebrow">Active plan · V / R / X</span><p>{allocation && failure ? planLabel(allocation) : 'No intervention · 0 credits'}</p></div>
      </section>
      <section className="metrics" aria-label="Human impact">
        <article><span>Unsafe residents · hour {hour}</span><strong>{format(current.unsafePopulation)}</strong></article>
        <article><span>Unsafe person-hours · full 72 hours</span><strong>{format(harm.totalUnsafePersonHours)}</strong></article>
        <article><span>Deep unsafe hours per resident · full 72 hours</span><strong>{format(harm.deepUnsafeHoursPerCapita)}</strong></article>
        <article><span>Available power · hour {hour}</span><strong>{format(current.availablePower)} <small>/ 120</small></strong></article>
      </section>
      <div className="workspace">
        <section className="panel" id="district"><p className="eyebrow">Selected hour · {hour}</p><h2>District overview</h2>
          {current.levels.map((level, i) => <article className={`level ${isUnsafe(level.hazards) ? 'unsafe' : ''}`} key={level.levelId}>
            <div className="level-heading"><h3>Level {level.levelId}</h3><span>{format(LEVELS[i]!.population)} residents</span><strong>{isUnsafe(level.hazards) ? 'Unsafe' : 'Safe'}</strong></div>
            <div className="level-values"><span>Power <b>{format(level.powerFraction * 100)}%</b></span><span>Temperature <b>{format(level.temperatureCelsius)}°C</b></span><span>Water <b>{format(level.waterQuality)} / 100</b></span></div>
            <p className="hazards">{[level.hazards.power && 'Power shortage', level.hazards.heat && 'Heat threshold exceeded', level.hazards.water && 'Water below threshold'].filter(Boolean).join(' · ') || 'All modeled thresholds satisfied'}</p>
          </article>)}
          <p className="footnote">Unsafe: temperature &gt; 32°C, water &lt; 70, or power &lt; 60%. Each resident counts once per unsafe hour.</p>
        </section>
        <Trajectories snapshots={snapshots} hour={hour} />
      </div>
      <div className="workspace">
        <section className="panel" id="planner"><p className="eyebrow">Emergency resources</p><h2>Allocate 100 credits</h2><p className="muted">Ventilation improves cooling. Repairs begin at hour 25. Redistribution moves existing electricity.</p>
          {([{key:'ventilationCredits',label:'Ventilation restoration'},{key:'recyclerCredits',label:'Recycler repairs'},{key:'redistributionCredits',label:'Power redistribution'}] as const).map(field=><label className="budget-row" key={field.key}>{field.label}<select value={draft[field.key]} onChange={e=>setDraft({...draft,[field.key]:Number(e.target.value)})}>{Array.from({length:11},(_,i)=><option key={i} value={i*10}>{i*10}</option>)}</select></label>)}
          <p className="footnote">V / R / X lists ventilation, repairs, then redistribution.</p><p role="status">Draft budget · <strong>{total} / 100 credits</strong>{total !== 100 && ' · Adjust to exactly 100 to apply.'}</p><button className="primary" disabled={total!==100} onClick={()=>apply(draft)}>Apply allocation</button><button onClick={()=>{setAllocation(null);setFailure(true);setHour(Math.max(1, hour));}}>Show untreated failure</button>
          <p role="status" className="footnote">{allocation && failure
            ? <>Active plan {planLabel(allocation)} · weighted score {format(fairnessScore(harm, lambda))}</>
            : failure ? 'Viewing the untreated failure.' : 'Viewing normal operation.'}</p>
        </section>
        <section className="panel"><p className="eyebrow">Fairness ranking · {ranked.length} plans</p><h2>Ranked response plans</h2><label>Deep-level fairness weight: <strong>{lambda.toFixed(1)}</strong><input aria-label="Fairness weight" type="range" min="0" max="2" step="0.1" value={lambda} onChange={e=>setLambda(Number(e.target.value))}/></label>
          <p className="muted">Score = total unsafe person-hours + λ × 2,000,000 × deep-level harm. Lower scores rank first. Exact ties use ascending V / R / X.</p>
          <div className="table-wrap"><table><thead><tr><th>V / R / X</th><th>Person-hours</th><th>Deep hours</th><th>Score</th><th>Plan</th></tr></thead><tbody>{ranked.slice(0,5).map(row=><tr key={planLabel(row.outcome.allocation)}><td>{planLabel(row.outcome.allocation)}</td><td>{format(row.outcome.simulation.harm.totalUnsafePersonHours)}</td><td>{format(row.outcome.simulation.harm.deepUnsafeHoursPerCapita)}</td><td>{format(row.score)}</td><td><button aria-label={'Apply plan ' + planLabel(row.outcome.allocation)} onClick={()=>apply(row.outcome.allocation)}>{allocation && sameAllocation(row.outcome.allocation, allocation) ? 'Applied' : 'Apply'}</button></td></tr>)}</tbody></table></div>
          <p role="status" className="footnote">{failure && allocation && <>Applied plan {planLabel(allocation)}. </>}Best within this model and credit grid. {lowestScoreCount === 1 ? 'One plan has the lowest score' : lowestScoreCount + ' plans share the lowest score'} at this weight.</p><p className="muted">Compared with the zero-spend untreated failure, this policy’s leading 100-credit plan reduces modeled exposure by {format(reduction)} person-hours over 72 hours.</p>
        </section>
      </div>
      <section className="panel" id="comparison"><p className="eyebrow">Same disaster · same 100-credit budget</p><h2>Policy comparison</h2><p className="muted">Each row holds the allocation fixed across policies. Policy-specific winners can use different plans.</p><div className="table-wrap"><table><thead><tr><th>Strategy</th><th>V / R / X</th><th>Directorate person-hours</th><th>Equity person-hours</th></tr></thead><tbody>{[{label:'Selected policy’s best',plan:winner.outcome.allocation},...(allocation && !sameAllocation(allocation, winner.outcome.allocation) ? [{label:'Applied plan',plan:allocation}] : []),{label:'Approximately equal',plan:equalPlan},{label:'All ventilation',plan:{ventilationCredits:100,recyclerCredits:0,redistributionCredits:0}},{label:'All repairs',plan:{ventilationCredits:0,recyclerCredits:100,redistributionCredits:0}},{label:'All redistribution',plan:{ventilationCredits:0,recyclerCredits:0,redistributionCredits:100}}].map(row=><tr key={row.label}><td>{row.label}</td><td>{planLabel(row.plan)}</td>{(['directorate','equity'] as const).map(p=><td key={p}>{format(outcomes.find(o=>o.policy===p&&sameAllocation(o.allocation,row.plan))!.simulation.harm.totalUnsafePersonHours)}</td>)}</tr>)}</tbody></table></div>
        <div className="policy-winners">{(['directorate','equity'] as const).map(p=>{const best=rankPlans(outcomes.filter(o=>o.policy===p),lambda)[0]!;return <p key={p}><strong>{p === 'directorate' ? 'Directorate' : 'Equity'} winner:</strong> {planLabel(best.outcome.allocation)} · {format(best.outcome.simulation.harm.totalUnsafePersonHours)} person-hours · {format(best.outcome.simulation.harm.deepUnsafeHoursPerCapita)} deep hours per resident · score {format(best.score)}.</p>;})}</div>
      </section>
      <footer>Fictional scenario · Synthetic thresholds · Exposure estimates, not casualty forecasts.</footer>
    </main>
  );
}
