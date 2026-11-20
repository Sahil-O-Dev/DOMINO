'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Flag } from 'lucide-react';
import { calculateHarm } from '../../lib/simulation/metrics';
import { createOutcomeCache, rankPlans, sameAllocation } from '../../lib/simulation/ranking';
import { LEVELS, MODEL, isUnsafe, simulateReference } from '../../lib/simulation/simulation';
import type { HourlySnapshot, LevelId, PowerPolicy, RankedPlan, ResourceAllocation } from '../../lib/simulation/types';

const initialPlan = { ventilationCredits: 40, recyclerCredits: 30, redistributionCredits: 30 };
const fields = [
  ['ventilationCredits', 'Ventilation', 'Increase cooling efficiency.'],
  ['recyclerCredits', 'Recycler repairs', 'Improve water treatment from hour 25.'],
  ['redistributionCredits', 'Redistribution', 'Shift power priority toward deeper levels.'],
] as const;
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format;
const label = (plan: ResourceAllocation) => fields.map(([key]) => plan[key]).join(' / ');

function Replay({ a, b, names, target }: {
  a: readonly HourlySnapshot[]; b: readonly HourlySnapshot[];
  names: [string, string]; target: LevelId;
}) {
  const [level, setLevel] = useState(target);
  const [hour, setHour] = useState(MODEL.hours as number);
  const index = level - 1;
  const first = a.findIndex((snapshot, i) =>
    isUnsafe(snapshot.levels[index]!.hazards) !== isUnsafe(b[i]!.levels[index]!.hazards));
  return <div className="replay">
    <label>Inspect district level <select value={level} onChange={e => setLevel(Number(e.target.value) as LevelId)}>
      {LEVELS.map(l => <option key={l.id} value={l.id}>Level {l.id}</option>)}
    </select></label>
    <p className="footnote">Each strip shows all {MODEL.hours} hours. Hatched amber hours are unsafe.</p>
    {[a, b].map((series, i) => <div key={i}>
      <h3>{names[i]}</h3>
      <div className="hour-strip" aria-hidden="true">{series.slice(1).map(s =>
        <i key={s.hour} className={isUnsafe(s.levels[index]!.hazards) ? 'hazard' : ''} />)}</div>
    </div>)}
    <label>Inspect hour <strong>{hour}</strong><input type="range" min="0" max={MODEL.hours} value={hour} onChange={e => setHour(Number(e.target.value))}/></label>
    {first >= 0 ? <button onClick={() => setHour(first)}>Jump to first safety difference · hour {first}</button>
      : <p className="footnote">Both runs have the same safety status at every hour on this level.</p>}
    <div className="reading-pair">{[a, b].map((series, i) => {
      const reading = series[hour]!.levels[index]!;
      const hazards = [reading.hazards.heat && 'heat', reading.hazards.water && 'water', reading.hazards.power && 'power'].filter(Boolean);
      return <article key={i}><h3>{names[i]}</h3><strong>{hazards.length ? 'Unsafe · ' + hazards.join(', ') : 'Safe'}</strong>
        <p>{number(reading.temperatureCelsius)} °C<br/>Water {number(reading.waterQuality)} / 100<br/>Power {number(reading.powerFraction * 100)}%</p></article>;
    })}</div>
    <p className="footnote">Modeled hazards begin above {MODEL.unsafeTemperature} °C, below water index {MODEL.unsafeWater}, or below {number(MODEL.unsafePower * 100)}% essential power. Readings are rounded for display.</p>
  </div>;
}

function Debrief({ ranked, chosen, target, retry }: {
  ranked: readonly RankedPlan[]; chosen: RankedPlan; target: LevelId; retry: () => void;
}) {
  const [mode, setMode] = useState<'district' | 'optimizer'>('district');
  const [alternative, setAlternative] = useState('yours');
  const best = ranked[0]!;
  const ties = ranked.filter(plan => plan !== best && plan.score === best.score);
  const other = ties.find(plan => label(plan.outcome.allocation) === alternative) ?? chosen;
  const { policy, simulation } = chosen.outcome;
  const untreated = useMemo(() => simulateReference('geothermal-failure', policy), [policy]);
  const baseline = useMemo(() => calculateHarm(untreated), [untreated]);
  const protectedHours = simulation.harm.levels[target - 1]!.unsafeHours;
  return <>
    <section className="challenge-intro"><p className="eyebrow accent">Response debrief · {policy}</p>
      <h1>Level {target} review</h1><p>Your level spent <strong>{protectedHours} of {MODEL.hours} hours</strong> under unsafe conditions. Your allocation was {label(chosen.outcome.allocation)} in ventilation, repairs and redistribution.</p>
      <div className="actions"><button aria-pressed={mode === 'district'} onClick={() => setMode('district')}>District impact</button>
        <button aria-pressed={mode === 'optimizer'} onClick={() => setMode('optimizer')}>Challenge the optimizer</button><button onClick={retry}>Revise response</button></div>
    </section>
    {mode === 'district' ? <div className="workspace"><section className="panel"><h2>Who gained safe hours?</h2>
      <p className="muted">Unsafe hours across the same failure, with and without your 100 credits.</p>
      <div className="table-wrap"><table><thead><tr><th>Level</th><th>Untreated</th><th>Your plan</th><th>Safe hours gained</th></tr></thead>
        <tbody>{simulation.harm.levels.map((l, i) => {
          const before = baseline.levels[i]!.unsafeHours;
          const gain = before - l.unsafeHours;
          return <tr key={l.levelId}><th>{l.levelId}{l.levelId === target && ' · yours'}</th><td>{before}</td><td>{l.unsafeHours}</td><td>{gain > 0 ? '+' : ''}{gain}</td></tr>;
        })}</tbody></table></div><p>District exposure · <strong>{number(simulation.harm.totalUnsafePersonHours)} person-hours</strong></p>
      </section><section className="panel"><h2>Inspect the replay</h2><Replay a={simulation.snapshots} b={untreated} target={target} names={['Your plan', 'Untreated failure']}/></section></div>
    : <div className="workspace"><section className="panel"><h2>Can you match the best plan?</h2>
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
  </>;
}

export function Challenge() {
  const [target, setTarget] = useState<LevelId | null>(null);
  const [policy, setPolicy] = useState<PowerPolicy>('equity');
  const [draft, setDraft] = useState<ResourceAllocation>(initialPlan);
  const [chosen, setChosen] = useState<RankedPlan | null>(null);
  const [cache] = useState(createOutcomeCache);
  const [ranked, setRanked] = useState<readonly RankedPlan[]>([]);
  const total = fields.reduce((sum, [key]) => sum + draft[key], 0);
  function commit() {
    if (!target || total !== 100) return;
    const plans = rankPlans(cache.getOutcomes().filter(p => p.policy === policy), 0);
    setRanked(plans);
    setChosen(plans.find(p => sameAllocation(p.outcome.allocation, draft))!);
    window.scrollTo(0, 0);
  }
  return <main id="main-content" className="shell challenge">
    {chosen && target ? <Debrief ranked={ranked} chosen={chosen} target={target} retry={() => setChosen(null)}/> : <>
      <section className="challenge-intro"><p className="eyebrow accent">The Hollow / Emergency response challenge</p>
        <h1>Protect a level.</h1><p>A geothermal failure leaves {MODEL.failedPower} of {MODEL.normalPower} power units. Choose the residents you’ll represent and commit a district-wide response. You’ll see who gained safe hours and who lost them.</p></section>
      <div className="workspace"><section className="panel"><h2>Which level is yours?</h2>
        <div className="level-picks">{LEVELS.map(l => <button key={l.id} aria-pressed={target === l.id} onClick={() => setTarget(l.id)}>
          <strong>Level {l.id}</strong><span>{number(l.population)} residents</span>{target === l.id && <Flag size={16}/>}</button>)}</div></section>
        <section className="panel"><h2>Fund your response</h2>
          <label>Power policy <select value={policy} onChange={e => setPolicy(e.target.value as PowerPolicy)}><option value="equity">Equity · proportional to demand</option><option value="directorate">Directorate · upper levels first</option></select></label>
          {fields.map(([key, title, detail]) => <label key={key} className="budget-row"><span><strong>{title}</strong><small>{detail}</small></span>
            <select aria-label={title} value={draft[key]} onChange={e => setDraft({...draft, [key]: Number(e.target.value)})}>{Array.from({length:11}, (_, i) => <option key={i}>{i * 10}</option>)}</select></label>)}
          <p role="status">{total} / 100 credits · {!target ? 'Choose a level to represent.' : total !== 100 ? 'Allocate exactly 100 to continue.' : 'Ready to commit for level ' + target + '.'}</p>
          <button className="primary" disabled={!target || total !== 100} onClick={commit}>Commit response <ArrowRight size={16}/></button></section></div></>}
  </main>;
}
