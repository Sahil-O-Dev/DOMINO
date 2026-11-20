'use client';

import { PanelExplain } from '../PanelExplain';
import { budgetReading } from '../../lib/simulation/readings';
import { useMemo, useState } from 'react';
import { AttemptComparison } from './AttemptComparison';
import { Replay } from './Replay';
import { ResultCard } from './ResultCard';
import { PlanSpace, allocationText } from './PlanSpace';
import { safeHoursGini } from '../../lib/simulation/equity';
import { DistrictSection } from './DistrictSection';
import { ArrowRight } from 'lucide-react';
import { calculateHarm } from '../../lib/simulation/metrics';
import { createOutcomeCache, rankPlans, sameAllocation } from '../../lib/simulation/ranking';
import { simulateReference } from '../../lib/simulation/simulation';
import type { LevelId, PlanOutcome, PowerPolicy, RankedPlan, ResourceAllocation } from '../../lib/simulation/types';

const initialPlan = { ventilationCredits: 40, recyclerCredits: 30, redistributionCredits: 30 };
const fields = [
  ['ventilationCredits', 'Ventilation', 'Increase cooling efficiency.'],
  ['recyclerCredits', 'Recycler repairs', 'Improve water treatment from hour 25.'],
  ['redistributionCredits', 'Redistribution', 'Shift power priority toward deeper levels.'],
] as const;
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format;
const label = (plan: ResourceAllocation) => fields.map(([key]) => plan[key]).join(' / ');

function Debrief({ ranked, chosen, previous, target, retry, outcomes }: {
  previous: PlanOutcome | null; outcomes: readonly PlanOutcome[]; ranked: readonly RankedPlan[]; chosen: RankedPlan; target: LevelId; retry: () => void;
}) {
  const [mode, setMode] = useState<'district' | 'optimizer'>('district');
  const [explored,setExplored] = useState(chosen.outcome);
  const [replayNumber,setReplayNumber] = useState(0);
  const replayBaseline = useMemo(()=>simulateReference('geothermal-failure',explored.policy),[explored.policy]);
  const [alternative, setAlternative] = useState('yours');
  const best = ranked[0]!;
  const ties = ranked.filter(plan => plan !== best && plan.score === best.score);
  const other = ties.find(plan => label(plan.outcome.allocation) === alternative) ?? chosen;
  const { policy, simulation } = chosen.outcome;
  const untreated = useMemo(() => simulateReference('geothermal-failure', policy), [policy]);
  const baseline = useMemo(() => calculateHarm(untreated), [untreated]);
  const exposed = simulation.harm.levels.filter(l=>l.levelId!==target && l.unsafeHours>0);
  const worsened = exposed.filter(l=>l.unsafeHours>baseline.levels[l.levelId-1]!.unsafeHours);
  const protectedHours = simulation.harm.levels[target - 1]!.unsafeHours;
  const gain = baseline.levels[target - 1]!.unsafeHours - protectedHours;
  return <>
    <section className="panel debrief-heading"><p className="eyebrow accent">Response debrief · {policy}</p>
      <h2>{protectedHours === 0 ? 'Level '+target+' stayed safe for all three days.' : 'Level '+target+' spent '+protectedHours+' hours in unsafe conditions.'}</h2>
      <p>{gain > 0 ? 'Your plan gave residents here '+gain+' more safe hours than the untreated outage.' : gain < 0 ? 'Residents here lost '+(-gain)+' safe hours compared with the untreated outage.' : 'Residents here had the same number of safe hours as in the untreated outage.'}
        {' '}{worsened.length > 0 ? 'Unsafe hours increased on '+worsened.map(l=>'level '+l.levelId).join(', ')+'.' :
        exposed.length > 0 ? 'Elsewhere, '+exposed.map(l=>'level '+l.levelId).join(', ')+' still experienced unsafe conditions.' : 'All other levels stayed safe.'}</p>
      <PanelExplain title="response debrief" reading={`Across 72 hours, level ${target} has ${protectedHours} unsafe hours with your plan and ${baseline.levels[target-1]!.unsafeHours} without it. ${exposed.length ? 'Other levels with unsafe hours: ' + exposed.map(l => l.levelId).join(', ') + '.' : 'All other levels remain safe.'}`}/>
      {previous && <AttemptComparison previous={previous} current={chosen.outcome} target={target}/>}
      <div className="actions"><button className="primary" onClick={retry}>Try another response</button><ResultCard plan={chosen} target={target}/></div>
    </section>
    <p id="plan-replay" className="eyebrow">Replay · {explored.policy} · {allocationText(explored)}</p>
    <DistrictSection policy={explored.policy} allocation={explored.allocation} key={replayNumber} autoplay={replayNumber>0} funded={explored.simulation.snapshots} untreated={replayBaseline} target={target}/>
    <details className="investigate"><summary>Compare plans and district outcomes</summary>
      <div className="actions"><button aria-pressed={mode === 'district'} onClick={() => setMode('district')}>District impact</button>
        <button aria-pressed={mode === 'optimizer'} onClick={() => setMode('optimizer')}>Challenge the optimizer</button></div>
    {mode === 'district' ? <div className="workspace"><section className="panel"><h2>Who gained safe hours?</h2>
      <PanelExplain title="safe hours gained" reading={`Changes in safe hours from the untreated outage, from level 1 to 5: ${simulation.harm.levels.map((l,i) => baseline.levels[i]!.unsafeHours - l.unsafeHours).join(', ')}. A negative change means residents on that floor spend more time exposed under the plan.`}/>
      <p className="muted">Unsafe hours across the same failure, with and without your 100 credits.</p>
      <div className="table-wrap"><table><thead><tr><th>Level</th><th>Untreated</th><th>Your plan</th><th>Safe hours gained</th></tr></thead>
        <tbody>{simulation.harm.levels.map((l, i) => {
          const before = baseline.levels[i]!.unsafeHours;
          const gain = before - l.unsafeHours;
          return <tr key={l.levelId}><th>{l.levelId}{l.levelId === target && ' · yours'}</th><td>{before}</td><td>{l.unsafeHours}</td><td>{gain > 0 ? '+' : ''}{gain}</td></tr>;
        })}</tbody></table></div><p>District exposure · <strong>{number(simulation.harm.totalUnsafePersonHours)} person-hours</strong></p>
      </section><section className="panel"><h2>Inspect the replay</h2><Replay a={simulation.snapshots} b={untreated} target={target} names={['Your plan', 'Untreated failure']}/></section></div>
    : <div className="workspace"><section className="panel"><h2>Can you match the best plan?</h2>
      <PanelExplain title="optimizer comparison" reading={`Your response scores ${number(chosen.score)} unsafe person-hours under ${policy}. The best of ${ranked.length} allocations scores ${number(best.score)}. The gap measures extra time residents collectively spend in unsafe conditions.`}/>
      <p className="muted">The optimizer ranks all {ranked.length} allocations under the {policy} policy by total unsafe person-hours. The deep-level fairness weight is zero for this challenge.</p>
      <p>Your score · <strong>{number(chosen.score)}</strong><br/>Best score · <strong>{number(best.score)}</strong></p>
      <p>{chosen.score === best.score ? 'You matched the lowest score.' : 'Your plan adds ' + number(chosen.score - best.score) + ' unsafe person-hours over the best score.'}</p>
      <p>The optimizer picked <strong>{label(best.outcome.allocation)}</strong>. {ties.length ? 'Exact ties are ordered by ventilation, then repairs, then redistribution.' : 'It is the only plan at this score.'}</p>
      <label>Compare with the optimizer <select value={alternative} onChange={e => setAlternative(e.target.value)}>
        <option value="yours">Your submitted plan · {label(chosen.outcome.allocation)}</option>
        {ties.map(row => <option key={label(row.outcome.allocation)} value={label(row.outcome.allocation)}>Tied plan · {label(row.outcome.allocation)}</option>)}
      </select></label>
      {other !== best && other.score === best.score && <p>These allocations tie. Which would you choose after inspecting heat and water quality?</p>}
    </section><section className="panel"><h2>Compare conditions</h2><Replay a={other.outcome.simulation.snapshots} b={best.outcome.simulation.snapshots} target={target} names={[alternative === 'yours' ? 'Your plan' : 'Tied plan', 'Optimizer pick']}/></section></div>}
    <PlanSpace player={chosen} selected={explored} outcomes={outcomes} replay={o=>{setExplored(o);setReplayNumber(n=>n+1);}}/>
    </details>
  </>;
}

export function Challenge() {
  const [target, setTarget] = useState<LevelId | null>(null);
  const [policy, setPolicy] = useState<PowerPolicy>('directorate');
  const [openingOutage, setOpeningOutage] = useState(true);
  const [draft, setDraft] = useState<ResourceAllocation>(initialPlan);
  const [chosen, setChosen] = useState<RankedPlan | null>(null);
  const [previous, setPrevious] = useState<PlanOutcome | null>(null);
  const [cache] = useState(createOutcomeCache);
  const [ranked, setRanked] = useState<readonly RankedPlan[]>([]);
  const total = fields.reduce((sum, [key]) => sum + draft[key], 0);
  const replayPolicy = openingOutage ? 'directorate' : policy;
  const untreated = useMemo(() => simulateReference('geothermal-failure', replayPolicy), [replayPolicy]);
  const preview = useMemo(()=> total===100 ? cache.getOutcomes().find(o=>o.policy===policy && sameAllocation(o.allocation,draft)) : undefined,[cache,policy,draft,total]);
  function revise() {
    if (!chosen) return;
    setOpeningOutage(false);
    setPrevious(chosen.outcome);
    setChosen(null);
    requestAnimationFrame(() => document.getElementById('fund-response')?.scrollIntoView());
  }

  function commit() {
    if (!target || total !== 100) return;
    const plans = rankPlans(cache.getOutcomes().filter(p => p.policy === policy), 0);
    setRanked(plans);
    setChosen(plans.find(p => sameAllocation(p.outcome.allocation, draft))!);
    window.scrollTo(0, 0);
  }
  return <main id="main-content" className="shell challenge">
    {chosen && target ? <Debrief outcomes={cache.getOutcomes()} ranked={ranked} chosen={chosen} target={target} previous={previous} retry={revise}/> : <>
      <DistrictSection policy={replayPolicy} untreated={untreated} target={target} represent={setTarget}
        openingOutage={openingOutage} funded={openingOutage ? undefined : preview?.simulation.snapshots} allocation={draft}/>
      <section className="panel funding" id="fund-response"><h2>Fund your response</h2>
          <p>Allocate 100 emergency credits for the district. {target ? 'You represent level ' + target + '.' : 'Choose the floor you represent in the section above.'}</p>
          {previous && <p className="footnote">When you commit, you’ll see how this response compares with your last one.</p>}
          <PanelExplain title="response budget" reading={budgetReading(draft) + (preview ? ' Under ' + policy + ', this draft produces ' + number(preview.simulation.harm.totalUnsafePersonHours) + ' unsafe resident-hours.' : '')}/>
          <label>Power policy <select value={policy} onChange={e => {setPolicy(e.target.value as PowerPolicy); setOpeningOutage(false);}}><option value="directorate">Directorate · upper levels first</option><option value="equity">Equity · proportional to demand</option></select></label>
          {fields.map(([key, title, detail]) => <label key={key} className="budget-row"><span><strong>{title}</strong><small>{detail}</small></span>
            <select aria-label={title} value={draft[key]} onChange={e => {setDraft({...draft, [key]: Number(e.target.value)}); setOpeningOutage(false);}}>{Array.from({length:11}, (_, i) => <option key={i}>{i * 10}</option>)}</select></label>)}
          <p role="status">{total} / 100 credits · {total !== 100 ? 'Allocate exactly 100 to preview your response.' : !target ? 'Choose a level to represent.' : 'Ready to commit for level ' + target + '.'}</p>
          {preview && <p className="draft-replay-summary">Draft forecast · Unsafe hours per floor · {preview.simulation.harm.levels.map(l => 'L' + l.levelId + ' ' + l.unsafeHours + 'h').join(' · ')}<br/>
            <a href="#city-replay" onClick={() => setOpeningOutage(false)}>Inspect this draft in the city ↑</a></p>}
          {!openingOutage && <p><a href="#city-replay" onClick={() => setOpeningOutage(true)}>View the opening Directorate outage</a></p>}
          {preview && <details className="level-details"><summary>Preview this allocation</summary><p className="preview-result">72-hour draft preview · <strong>{number(preview.simulation.harm.totalUnsafePersonHours)} unsafe resident-hours</strong> · Safe-hours Gini {safeHoursGini(preview.simulation.harm)?.toFixed(3) ?? 'undefined'}. Zero indicates equal safe hours across residents.</p></details>}
          <button className="primary" disabled={!target || total !== 100} onClick={commit}>Commit response <ArrowRight size={16}/></button></section></>}
  </main>;
}
