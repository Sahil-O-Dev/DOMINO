import { PanelExplain } from '../PanelExplain';
import { floorReading } from '../../lib/simulation/readings';
import { useState } from 'react';
import { LEVELS, MODEL, isUnsafe } from '../../lib/simulation/simulation';
import type { HourlySnapshot, LevelId } from '../../lib/simulation/types';

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format;

export function Replay({ a, b, names, target, initialHour = MODEL.hours }: {
  a: readonly HourlySnapshot[]; b: readonly HourlySnapshot[];
  names: [string, string]; target: LevelId; initialHour?: number;
}) {
  const [level, setLevel] = useState(target);
  const [hour, setHour] = useState(initialHour);
  const index = level - 1;
  const first = a.findIndex((snapshot, i) =>
    isUnsafe(snapshot.levels[index]!.hazards) !== isUnsafe(b[i]!.levels[index]!.hazards));
  return <div className="replay">
    <label>Inspect district level <select value={level} onChange={e => setLevel(Number(e.target.value) as LevelId)}>
      {LEVELS.map(l => <option key={l.id} value={l.id}>Level {l.id}</option>)}
    </select></label>
    <p className="footnote">Each strip shows all {MODEL.hours} hours. Hatched amber hours are unsafe. The outline marks the inspected hour. Hour 0 precedes both strips.</p>
    {[a, b].map((series, i) => <div key={i}>
      <h3>{names[i]}</h3>
      <div className="hour-strip" aria-hidden="true">{series.slice(1).map(s =>
        <i key={s.hour} data-active={s.hour === hour} className={isUnsafe(s.levels[index]!.hazards) ? 'hazard' : ''} />)}</div>
    </div>)}
    <label>Inspect hour <strong>{hour}</strong><input type="range" min="0" max={MODEL.hours} value={hour} onChange={e => setHour(Number(e.target.value))}/></label>
    {first >= 0 ? <button onClick={() => setHour(first)}>Jump to first safety difference · hour {first}</button>
      : <p className="footnote">Both runs have the same safety status at every hour on this level.</p>}
    <div className="reading-pair">{[a, b].map((series, i) => {
      const reading = series[hour]!.levels[index]!;
      const hazards = [reading.hazards.heat && 'heat', reading.hazards.water && 'water', reading.hazards.power && 'power'].filter(Boolean);
      return <article key={i}><h3>{names[i]}</h3><strong>{hazards.length ? 'Unsafe · ' + hazards.join(', ') : 'Safe'}</strong>
        <p>{number(reading.temperatureCelsius)} °C<br/>Water {number(reading.waterQuality)} / 100<br/>Power {number(reading.powerFraction * 100)}%</p>
        <PanelExplain title={names[i] + ' replay'} reading={names[i] + '. ' + floorReading(reading, hour)}/></article>;
    })}</div>
    <p className="footnote">Modeled hazards begin above {MODEL.unsafeTemperature} °C, below water index {MODEL.unsafeWater}, or below {number(MODEL.unsafePower * 100)}% essential power. Readings are rounded for display.</p>
  </div>;
}
