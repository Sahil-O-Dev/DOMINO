import { allocationPlot } from './allocation-plot';
import { PanelExplain } from '../PanelExplain';
import { useMemo, useState } from 'react';
import { safeHoursGini } from '../../lib/simulation/equity';
import { rankPlans } from '../../lib/simulation/ranking';
import type { PlanOutcome, RankedPlan } from '../../lib/simulation/types';

export const allocationText = (o: PlanOutcome) => [o.allocation.ventilationCredits,o.allocation.recyclerCredits,o.allocation.redistributionCredits].join(' / ');
export function PlanSpace({ outcomes, player, selected, replay }: {outcomes: readonly PlanOutcome[]; player: RankedPlan; selected: PlanOutcome; replay:(o:PlanOutcome)=>void}) {
  const [policy,setPolicy] = useState(player.outcome.policy);
  const ranked = useMemo(()=>rankPlans(outcomes.filter(o=>o.policy===policy),0),[outcomes,policy]);
  const best = ranked[0]!.outcome;
  const plot = useMemo(() => allocationPlot(outcomes), [outcomes]);
  const points = plot.points.filter(p => p.outcome.policy === policy);
  const groups = new Map<string, typeof points>();
  for (const point of points) {
    if (point.y === null) continue;
    const key = [point.x, point.y].join('/');
    const group = groups.get(key);
    if (group) group.push(point);
    else groups.set(key, [point]);
  }
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const overlapping = activeGroup ? groups.get(activeGroup) : undefined;
  const x = (value: number) => 50 + 394 * value / plot.maxHarm;
  const y = (value: number) => 172 - 147 * value / plot.maxGini;
  function choose(o: PlanOutcome) {
    setActiveGroup(null);
    replay(o);
    requestAnimationFrame(() => document.getElementById('plan-replay')?.scrollIntoView());
  }
  return <section className="visual-panel"><h2>Allocation space</h2>
    <label>Explore policy <select value={policy} onChange={e=>{setPolicy(e.target.value as typeof policy);setActiveGroup(null);}}><option value="equity">Equity</option><option value="directorate">Directorate</option></select></label>
    <p>{points.length} plans · Lower left combines lower exposure with more evenly distributed safe hours. Select a point to load its replay. Plans at identical coordinates share a point.</p>
    <PanelExplain title="allocation space" reading={`Under ${policy}, the lowest exposure among ${points.length} plans is ${best.simulation.harm.totalUnsafePersonHours.toLocaleString('en-US')} unsafe resident-hours. Moving left means less exposure and moving down means safe hours are distributed more evenly. The replay uses ${allocationText(selected)} under ${selected.policy}.`}/>
    <svg className="allocation-plot" viewBox="0 0 475 212" aria-label="Total unsafe resident-hours against population-weighted safe-hours Gini">
      <path d="M50 25 V172 H444" fill="none" stroke="#87988d"/>
      <g fill="#cfdbd0" fontSize="10"><text x="4" y="15">Safe-hours Gini</text><text x="10" y="32">{plot.maxGini.toFixed(1)}</text><text x="30" y="174">0</text><text x="48" y="189">0</text><text x="444" y="189" textAnchor="end">{plot.maxHarm/1e6}M</text><text x="245" y="207" textAnchor="middle">Unsafe resident-hours</text></g>
      {Array.from(groups, ([key, group]) => {
        const p = group[0]!;
        const title = group.length === 1 ? allocationText(p.outcome) : group.length + ' allocations';
        const activate = () => group.length === 1 ? choose(p.outcome) : setActiveGroup(key);
        return <circle key={key} cx={x(p.x)} cy={y(p.y!)} r="4.5" fill="#9ccdb6" stroke="#17241e"
          role="button" tabIndex={0} aria-label={title + ' at ' + p.x + ' resident-hours and Gini ' + p.y!.toFixed(3)}
          onClick={activate} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } }}>
          <title>{title + ' · ' + p.x.toLocaleString('en-US') + ' resident-hours · Gini ' + p.y!.toFixed(3)}</title>
        </circle>;
      })}
      {[best,player.outcome,selected].map((o,i)=>{
        const g=safeHoursGini(o.simulation.harm);
        if(o.policy!==policy || g===null)return null;
        const cx=x(o.simulation.harm.totalUnsafePersonHours), cy=y(g);
        return i===1 ? <rect key={i} x={cx-6} y={cy-6} width={12} height={12} fill="none" stroke="#fff" pointerEvents="none"/> :
          <circle key={i} cx={cx} cy={cy} r={i===0?9:12} fill="none" stroke={i===0?'#efb481':'#bdd2ff'} strokeDasharray={i===2?'3 3':undefined} pointerEvents="none"/>;
      })}
    </svg><p>□ Submitted plan ({player.outcome.policy}) · ○ Optimizer · Dashed ring: replay</p>
    {overlapping && <label>Replay one of {overlapping.length} plans at this point
      <select value="" onChange={e => choose(overlapping[Number(e.target.value)]!.outcome)}>
        <option value="" disabled>Choose an allocation</option>
        {overlapping.map((p, i) => <option key={i} value={i}>{allocationText(p.outcome)}</option>)}
      </select></label>}
    <label>Replay any allocation (ventilation / repairs / redistribution)<select value={selected.policy===policy?allocationText(selected):''} onChange={e=>{const o=points.find(p=>allocationText(p.outcome)===e.target.value);if(o)choose(o.outcome);}}>
      <option value="" disabled>Choose a plan</option>{points.map(p=><option key={allocationText(p.outcome)}>{allocationText(p.outcome)}</option>)}</select></label>
  </section>;
}
