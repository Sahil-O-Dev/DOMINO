import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LEVELS, MODEL } from '../../lib/simulation/simulation';
import type { HourlySnapshot } from '../../lib/simulation/types';
import { PanelExplain } from '../PanelExplain';
import { displayNumber } from '../../lib/simulation/readings';
import { chartData, visibleLevelSeries } from './chart-data';

const metrics = [
  { key: 't', name: 'Temperature', unit: '°C', domain: ['auto', 'auto'] },
  { key: 'q', name: 'Water quality', unit: 'Index (0–100)', domain: [0, 100] },
  { key: 'p', name: 'Power', unit: '% of essential demand', domain: [0, 100] },
  { key: 'unsafe', name: 'Unsafe population', unit: 'Residents', domain: [0, LEVELS.reduce((n, l) => n + l.population, 0)] },
];
const colors = ['#efb481', '#8fd5bd', '#a3bbf5', '#d6a8e5', '#e2dd87'] as const;
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export function Trajectories({ snapshots, hour }: { snapshots: readonly HourlySnapshot[]; hour: number }) {
  const [metric, setMetric] = useState(metrics[0]!);
  const points = useMemo(() => chartData(snapshots), [snapshots]);
  const series = useMemo(() => metric.key === 'unsafe' ? [] : visibleLevelSeries(points, metric.key), [points, metric]);
  const current = points[hour]!;
  const reading = metric.key === 'unsafe'
    ? `At hour ${hour}, ${displayNumber(current.unsafe!)} residents are on unsafe floors. The district total peaks at ${displayNumber(Math.max(...points.map(p => p.unsafe!)))} during the run. This line counts people at each hour.`
    : `At hour ${hour}, ${metric.name.toLowerCase()} across levels 1 through 5 is ${LEVELS.map(l => displayNumber(current[metric.key + l.id]!)).join(', ')} (${metric.unit}). Levels with matching displayed readings throughout share a line. ${metric.key === 't' ? 'Higher values mean hotter conditions.' : 'Lower values mean worse conditions.'}`;
  return <section className="panel plot-panel" aria-label="Hourly trajectories">
    <p className="eyebrow">Full simulation</p><h2>Hourly trajectories</h2>
    <div className="metric-picker" role="group" aria-label="Chart metric">{metrics.map(m =>
      <button key={m.key} aria-pressed={m.key === metric.key} onClick={() => setMetric(m)}>{m.name}</button>
    )}</div>
    <h3 className="chart-title">{metric.name} · {metric.unit}</h3>
    <PanelExplain title={metric.name + " chart"} reading={reading}/>
    <div className="chart"><ResponsiveContainer width="100%" height="100%" initialDimension={{width: 430, height: 250}}>
      <LineChart data={points} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
        <CartesianGrid stroke="#34413c" strokeDasharray="3 5" vertical={false}/>
        <XAxis type="number" domain={[0, MODEL.hours]} ticks={[0, 12, 24, 36, 48, 60, MODEL.hours]} dataKey="hour" stroke="#a5b4aa" tick={{ fontSize: 11 }}/>
        <YAxis domain={metric.domain} stroke="#a5b4aa" width={40} tick={{ fontSize: 11 }} tickFormatter={v => compact.format(v)}/>
        <Tooltip contentStyle={{ background: '#17211d', borderColor: '#52645a' }} formatter={v => Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 })} labelFormatter={v => 'Hour ' + v}/>
        {metric.key === 'unsafe' ? <Line type="stepAfter" dataKey="unsafe" name="Unsafe residents" stroke={colors[0]} dot={false} isAnimationActive={false}/> :
          series.map(s => <Line type="stepAfter" key={s.key} dataKey={s.key} name={s.name} stroke={colors[s.colorIndex]!} strokeWidth={2} dot={false} isAnimationActive={false}/>)}
        <ReferenceLine x={hour} stroke="#fff" strokeDasharray="4 4"/>
      </LineChart>
    </ResponsiveContainer></div>
    <p className="axis-label">Hourly snapshots · marker at hour {hour}</p>
    <div className="legend">{metric.key === 'unsafe' ? 'District total' : series.map(s => <span key={s.key}><i style={{ background: colors[s.colorIndex] }}/>{s.name}</span>)}</div>
  </section>;
}
