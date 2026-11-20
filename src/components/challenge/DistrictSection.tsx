'use client';

import { IllustrativeLayer } from './IllustrativeLayer';
import { ZERO_ALLOCATION } from '../../lib/simulation/interventions';
import { Cascade } from './Cascade';
import { FloorLight, SafetyGrid } from './VisualReadings';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, SkipForward } from 'lucide-react';
import { LEVELS, MODEL, isUnsafe } from '../../lib/simulation/simulation';
import type { HourlySnapshot, LevelId, LevelSnapshot, PowerPolicy, ResourceAllocation } from '../../lib/simulation/types';

const format = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format;

function warnings(level: LevelSnapshot) {
  return [
    level.hazards.power && 'power below ' + format(MODEL.unsafePower * 100) + '%',
    level.hazards.heat && 'temperature above ' + MODEL.unsafeTemperature + ' °C',
    level.hazards.water && 'water below ' + MODEL.unsafeWater,
  ].filter(Boolean).join(' · ');
}

interface SectionProps {
  policy:PowerPolicy;
  allocation?:ResourceAllocation;
  autoplay?: boolean;
  untreated: readonly HourlySnapshot[];
  funded?: readonly HourlySnapshot[];
  target: LevelId | null;
  represent?: (level: LevelId) => void;
}

export function DistrictSection({ untreated, funded, target, represent, policy, allocation=ZERO_ALLOCATION, autoplay = false }: SectionProps) {
  const [floor, setFloor] = useState<LevelId>(target ?? 1);
  const [hour, setHour] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [pinned, setPinned] = useState(false);
  const [holding, setHolding] = useState(false);
  const [split, setSplit] = useState(0);
  const comparison = pinned || holding;
  const series = comparison || !funded ? untreated : funded;
  const current = series[hour]!;
  const reading = current.levels[floor - 1]!;
  const firstHazard = useMemo(() => series.find(s => s.hour > 0 && s.levels.some(l => isUnsafe(l.hazards))), [series]);
  const firstLevels = useMemo(() => firstHazard?.levels.filter(l => isUnsafe(l.hazards)), [firstHazard]);
  const first = firstLevels?.[0];
  const atThreshold = first && hour === firstHazard?.hour;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      const next = Math.min(hour + 1, MODEL.hours);
      setHour(next);
      if (next === MODEL.hours || next === firstHazard?.hour) setPlaying(false);
      if (next === firstHazard?.hour && first) setFloor(first.levelId);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [playing, hour, firstHazard, first]); // Advance only on explicit playback.

  function seek(value: number) {
    setPlaying(false);
    setHour(value);
  }

  return <section className="exhibit" aria-label="Interactive district section">
    <div className="exhibit-heading">
      <div><p className="eyebrow">DOMINO / District section</p><h1>The Hollow</h1></div>
      <div className="actions"><Link className="text-link" href="/brief">Scenario brief</Link><Link className="outline-link" href="/domino">Inspect data ↗</Link></div>
    </div>
    <div className="section-stage">
      <div className="section-plate" role="group" aria-label="Select a district floor">
        {current.levels.map(level => {
          const unsafe = isUnsafe(level.hazards);
          return <button key={level.levelId} type="button" className="section-floor" aria-pressed={floor === level.levelId}
            aria-label={'Inspect level ' + level.levelId + (unsafe ? ', unsafe' : ', safe')} data-unsafe={unsafe}

            onClick={() => {setFloor(level.levelId); setPlaying(false);}}>
            <FloorLight level={level}/>
            {funded && !comparison && split > 0 && <span className="split-layer" style={{clipPath: 'inset(0 ' + (100 - split) + '% 0 0)'}}><FloorLight level={untreated[hour]!.levels[level.levelId - 1]!}/></span>}
            {funded && !comparison && split > 0 && <i className="split-line" style={{left: split + '%'}}/>}
            <span className="floor-id">L0{level.levelId}</span>
            {funded && !comparison && split>0 && <span className="left-safety">Untreated · {isUnsafe(untreated[hour]!.levels[level.levelId-1]!.hazards) ? '△ Unsafe' : 'Safe'}</span>}
            {unsafe && !(funded && !comparison && split===100) && <span className="floor-alert">△ Unsafe</span>}
          </button>;
        })}
        {funded && !comparison && <button type="button" className="split-grip" role="slider" aria-label="Drag cutaway comparison" aria-valuemin={0} aria-valuemax={100} aria-valuenow={split}
          style={{left:'clamp(16px, '+split+'%, calc(100% - 16px))'}}
          onPointerDown={e=>{setPlaying(false);e.currentTarget.setPointerCapture(e.pointerId);}}
          onPointerMove={e=>{
            if(!e.currentTarget.hasPointerCapture(e.pointerId))return;
            const rect=e.currentTarget.parentElement!.getBoundingClientRect();
            setSplit(Math.max(0,Math.min(100,Math.round(100*(e.clientX-rect.left)/rect.width))));
          }}
          onKeyDown={e=>{
            const change=({ArrowLeft:split-1,ArrowRight:split+1,Home:0,End:100} as Record<string,number>)[e.key];
            if(change!==undefined){e.preventDefault();setPlaying(false);setSplit(Math.max(0,Math.min(100,change)));}
          }}>↔</button>}
      </div>
      <aside className="section-inspector">
        <p className="eyebrow">{funded ? comparison ? 'Untreated comparison' : 'Funded response' : 'Untreated scenario'} · Hour {hour}</p>
        <h2>Level {floor}</h2><p>{format(LEVELS[floor - 1]!.population)} residents</p>
        <strong className={isUnsafe(reading.hazards) ? 'warning-text' : ''}>{isUnsafe(reading.hazards) ? 'Unsafe · ' + warnings(reading) : 'Within modeled limits'}</strong>
        <dl>{[
          ['Essential power', format(reading.powerFraction * 100) + '%'],
          ['Temperature', format(reading.temperatureCelsius) + ' °C'],
          ['Water quality', format(reading.waterQuality) + ' / 100'],
        ].map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
        {represent && <a className="outline-link" href="#fund-response" onClick={() => represent(floor)}>Represent level {floor} ↓</a>}
        {funded && <div className="compare-controls">
          <button type="button" disabled={pinned} onPointerDown={e => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId); setPlaying(false); setHolding(true);
          }} onLostPointerCapture={() => setHolding(false)} onPointerUp={() => setHolding(false)}
            onPointerCancel={() => setHolding(false)} onBlur={() => setHolding(false)}
            onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setPlaying(false); setHolding(true); } }}
            onKeyUp={() => setHolding(false)}>Hold to compare</button>
          <label>Untreated on left · {split}%<input type="range" aria-label="Before and after split" min="0" max="100" value={split} disabled={comparison} onChange={e => {setPlaying(false); setSplit(Number(e.target.value));}}/></label>
          <label><input type="checkbox" checked={pinned} onChange={e => { setPlaying(false); setPinned(e.target.checked); }}/> Show untreated</label>
        </div>}
      </aside>
    </div>
    <div className="exhibit-transport">
      <button className="primary" onClick={() => {
        if (hour === MODEL.hours) setHour(0);
        setPlaying(!playing);
      }}>{playing ? <Pause size={16}/> : <Play size={16}/>}
        {playing ? 'Pause' : hour === 0 ? 'Trigger failure' : hour === MODEL.hours ? 'Replay' : 'Resume'}</button>
      <label>Hour {hour} / {MODEL.hours}<input type="range" aria-label="District replay hour" min={0} max={MODEL.hours} value={hour} onChange={e => seek(Number(e.target.value))}/></label>
      <button aria-label="Skip to final hour" onClick={() => seek(MODEL.hours)}><SkipForward size={16}/></button>
      <div className="supply"><span>District supply</span><strong>{current.availablePower} / {MODEL.normalPower}</strong><meter min={0} max={MODEL.normalPower} value={current.availablePower} aria-label="Available district power"/></div>
    </div>
    <p className="section-caption" role="status">{atThreshold
      ? 'First unsafe hour · Level ' + first.levelId + ' · ' + warnings(first) + (firstLevels && firstLevels.length > 1 ? '. Also unsafe: ' + firstLevels.slice(1).map(l => 'Level ' + l.levelId).join(', ') : '')
      : hour === 0 ? 'Before the outage. Select a floor to inspect it, or trigger the failure to watch the district respond.'
      : hour === MODEL.hours ? 'Replay complete. Scrub the timeline to inspect any hour.' : 'Geothermal outage in progress.'}</p>
    <p className="footnote">Warm upper tint shows warming above baseline. Blue lower tint shows water quality loss. Dimming and subtle flicker track the unmet share of essential power.</p>
    <SafetyGrid series={series} hour={hour} inspect={(id,h) => {setFloor(id); seek(h);}}/>
    <Cascade series={series} untreated={untreated} funded={funded} hour={hour} floor={floor} playing={playing} seek={seek}/>
    <IllustrativeLayer policy={policy} allocation={comparison ? ZERO_ALLOCATION : allocation} series={series} floor={floor} hour={hour} inspect={(id,h)=>{setFloor(id);seek(h);}}/>
  </section>;
}
