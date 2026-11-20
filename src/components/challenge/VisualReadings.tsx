import { useMemo } from 'react';
import { calculateHarm } from '../../lib/simulation/metrics';
import { LEVELS, MODEL, isUnsafe } from '../../lib/simulation/simulation';
import type { HourlySnapshot, LevelId, LevelSnapshot } from '../../lib/simulation/types';

export function FloorLight({ level, clip = 100 }: {level: LevelSnapshot; clip?: number}) {
  const heat = Math.max(0, level.temperatureCelsius - LEVELS[level.levelId - 1]!.baseTemperatureCelsius);
  const waterLoss = Math.max(0, MODEL.initialWaterQuality - level.waterQuality);
  const shade = 1 - level.powerFraction;
  return <span aria-hidden="true" className="floor-veil" style={{clipPath: 'inset(0 ' + (100 - clip) + '% 0 0)',
    backgroundImage: 'linear-gradient(180deg,rgba(232,91,46,' + Math.min(.65, heat / 14) + '),transparent 75%),linear-gradient(0deg,rgba(78,123,188,' + Math.min(.65, waterLoss / 85) + '),transparent 65%)',
    backgroundColor: 'rgba(0,0,0,' + shade * .72 + ')'}}>
    {shade > .01 && <i style={{opacity: shade * .3}}/>}
  </span>;
}

export function SafetyGrid({ series, hour, inspect }: {series: readonly HourlySnapshot[]; hour: number; inspect: (id: LevelId, hour: number) => void}) {
  const harm = useMemo(() => calculateHarm(series), [series]);
  return <section className="visual-panel"><h3>District exposure</h3><p>Hours 1–{MODEL.hours} · hatching marks unsafe hours. Select a strip to inspect a level and hour.</p>
    {harm.levels.map((level, i) => <div className="exposure-row" key={level.levelId}>
      <span>L{level.levelId}</span>
      <button className="safety-strip" aria-label={'Inspect level ' + level.levelId + ' at hour ' + Math.max(1,hour)} onClick={e => {
        const box = e.currentTarget.getBoundingClientRect();
        const selected = e.detail ? Math.min(MODEL.hours, Math.max(1, 1 + Math.floor(MODEL.hours * (e.clientX - box.left) / box.width))) : Math.max(1,hour);
        inspect(level.levelId, selected);
      }}>{series.slice(1).map(s => <i key={s.hour} data-active={s.hour === hour} data-risk={isUnsafe(s.levels[i]!.hazards)}/>)}</button>
      <div className="harm-bar"><span>{level.unsafePersonHours.toLocaleString('en-US')}</span><meter aria-label={'Level ' + level.levelId + ' unsafe resident-hours'} min={0} max={Math.max(1,...harm.levels.map(l=>l.unsafePersonHours))} value={level.unsafePersonHours}/></div>
    </div>)}<small>Bars show residents × unsafe hours over the entire run.</small></section>;
}
