import { compareAttempts } from '../../lib/simulation/compare-attempts';
import { MODEL } from '../../lib/simulation/simulation';
import type { LevelId, PlanOutcome } from '../../lib/simulation/types';
import { allocationText } from './PlanSpace';
import { Replay } from './Replay';

export function AttemptComparison({ previous, current, target }: {
  previous: PlanOutcome; current: PlanOutcome; target: LevelId;
}) {
  const { levels, exposureChange, firstDifference } = compareAttempts(previous.simulation, current.simulation);
  const exposure = Math.abs(exposureChange).toLocaleString('en-US');

  return <section className="attempt-comparison" aria-label="Comparison with your previous response">
    <p className="eyebrow">Since your previous response</p>
    <h3>{exposureChange === 0 ? 'District exposure stayed the same.' :
      `The district experienced ${exposure} ${exposureChange < 0 ? 'fewer' : 'more'} unsafe resident-hours.`}</h3>
    {firstDifference && <div>
      <p>Change in safe hours on each level</p>
      <dl className="floor-changes">{levels.map(({ levelId, safeHoursGained }) =>
        <div key={levelId}>
          <dt>Level {levelId}</dt>
          <dd className={safeHoursGained > 0 ? 'improved' : safeHoursGained < 0 ? 'worsened' : undefined}>
            {safeHoursGained > 0 && '+'}{safeHoursGained} h
          </dd>
        </div>)}</dl>
    </div>}
    <p>{firstDifference
      ? `The first safety difference appears on level ${firstDifference.levelId} at hour ${firstDifference.hour}.`
      : 'Both responses have the same hour-by-hour safety status on all five levels.'}</p>
    <details className="level-details">
      <summary>Replay both responses</summary>
      <p className="footnote">Credits for ventilation / repairs / redistribution<br/>
        Previous · {previous.policy} · {allocationText(previous)}<br/>
        Current · {current.policy} · {allocationText(current)}</p>
      <Replay a={previous.simulation.snapshots} b={current.simulation.snapshots}
        names={['Previous response', 'Current response']} target={firstDifference?.levelId ?? target}
        initialHour={firstDifference?.hour ?? MODEL.hours}/>
    </details>
  </section>;
}
