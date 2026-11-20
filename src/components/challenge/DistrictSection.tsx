'use client';

import { FloorSeverity, severityLabel } from '../FloorSeverity';
import { PanelExplain } from '../PanelExplain';
import { floorReading } from '../../lib/simulation/readings';
import { IllustrativeLayer } from './IllustrativeLayer';
import { ZERO_ALLOCATION } from '../../lib/simulation/interventions';
import { Cascade } from './Cascade';
import { FloorLight, SafetyGrid } from './VisualReadings';
import Link from 'next/link';
import { elapsedReplayHours, REPLAY_HOUR_MS, replayClock } from './replay-clock';
import { useEffect, useMemo, useReducer, useState } from 'react';
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
  funded?: readonly HourlySnapshot[] | undefined;
  target: LevelId | null;
  represent?: (level: LevelId) => void;
}

export function DistrictSection({ untreated, funded, target, represent, policy, allocation=ZERO_ALLOCATION, autoplay = false }: SectionProps) {
  const [{ hour, floor, playing }, dispatch] = useReducer(replayClock, {
    hour: 0, floor: target ?? 1, playing: autoplay,
  });
  const [pauseAtHazard, setPauseAtHazard] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [holding, setHolding] = useState(false);
  const [split, setSplit] = useState(0);
  const response = funded ?? untreated;
  const [previousResponse, setPreviousResponse] = useState(response);
  if (previousResponse !== response) {
    setPreviousResponse(response);
    dispatch({ type: 'pause' });
    setPinned(false);
    setHolding(false);
    setSplit(0);
  }
  const comparison = pinned || holding;
  const showingUntreated = !funded || comparison || split === 100;
  const series = showingUntreated ? untreated : funded;
  const runLabel = showingUntreated ? 'Untreated outage' : represent ? 'Draft response' : 'Funded response';
  const current = series[hour]!;
  const reading = current.levels[floor - 1]!;
  const firstHazard = useMemo(() => series.find(s => s.hour > 0 && s.levels.some(l => isUnsafe(l.hazards))), [series]);
  const firstLevels = useMemo(() => firstHazard?.levels.filter(l => isUnsafe(l.hazards)), [firstHazard]);
  const first = firstLevels?.[0];
  const atThreshold = first && hour === firstHazard?.hour;

  useEffect(() => {
    if (!playing) return;
    const breakpoint = pauseAtHazard && firstHazard && first ? { hour: firstHazard.hour, floor: first.levelId } : undefined;
    const startedAt = performance.now();
    let advanced = 0;
    const timer = window.setInterval(() => {
      const elapsed = elapsedReplayHours(performance.now() - startedAt);
      if (elapsed > advanced) {
        dispatch({ type: 'advance', hours: elapsed - advanced, breakpoint });
        advanced = elapsed;
      }
    }, REPLAY_HOUR_MS);
    return () => window.clearInterval(timer);
  }, [playing, pauseAtHazard, firstHazard, first]);

  function pause() { dispatch({ type: 'pause' }); }
  function seek(hour: number) { dispatch({ type: 'inspect', hour }); }
  function inspect(floor: LevelId, hour: number) { dispatch({ type: 'inspect', floor, hour }); }

  return <section className="exhibit" aria-label="Interactive district section">
    <div className="exhibit-heading">
      <div><p className="eyebrow">DOMINO / District section</p><h1>The Hollow</h1></div>
      <div className="actions"><Link className="primary" href="/handoff">Start The Handoff</Link><Link className="text-link" href="/domino#ai-advisor">AI Advisor</Link><Link className="text-link" href="/brief">Scenario brief</Link><Link className="outline-link" href="/domino">Inspect data ↗</Link></div>
    </div>
    {represent && <p className="scene-prompt">{funded && showingUntreated
      ? 'Comparing with the untreated outage. Return the comparison controls to the draft to inspect funded conditions.'
      : funded ? 'Your 100-credit draft is ready. Play the outage or scrub to an hour, then change the funding to compare the same moment.'
      : 'Allocate exactly 100 credits to preview your draft. The city currently shows the untreated outage.'}</p>}
    <div className="section-stage" id="city-replay">
      <div className="section-plate" role="group" aria-label="Select a district floor">
        {current.levels.map(level => {
          const unsafe = isUnsafe(level.hazards);
          return <button key={level.levelId} type="button" className="section-floor" aria-pressed={floor === level.levelId}
            aria-label={'Inspect level ' + level.levelId + ', ' + severityLabel(level).toLowerCase()} data-unsafe={unsafe}

            onClick={() => dispatch({type: 'inspect', floor: level.levelId})}>
            <FloorLight level={level}/>
            {funded && !comparison && split > 0 && <span className="split-layer" style={{clipPath: 'inset(0 ' + (100 - split) + '% 0 0)'}}><FloorLight level={untreated[hour]!.levels[level.levelId - 1]!}/></span>}
            {funded && !comparison && split > 0 && <i className="split-line" style={{left: split + '%'}}/>}
            <span className="floor-id">Level {level.levelId}</span>
            {funded && !comparison && split>0 && <span className="left-safety">Untreated · {severityLabel(untreated[hour]!.levels[level.levelId-1]!)}</span>}
            {!(funded && !comparison && split===100) && <span className={unsafe ? 'floor-alert' : 'floor-safe'}>{unsafe ? '△ ' + severityLabel(level) : '✓ Safe'}</span>}
          </button>;
        })}
        {funded && !comparison && <button type="button" className="split-grip" role="slider" aria-label="Drag cutaway comparison" aria-valuemin={0} aria-valuemax={100} aria-valuenow={split}
          style={{left:'clamp(16px, '+split+'%, calc(100% - 16px))'}}
          onPointerDown={e=>{pause();e.currentTarget.setPointerCapture(e.pointerId);}}
          onPointerMove={e=>{
            if(!e.currentTarget.hasPointerCapture(e.pointerId))return;
            const rect=e.currentTarget.parentElement!.getBoundingClientRect();
            setSplit(Math.max(0,Math.min(100,Math.round(100*(e.clientX-rect.left)/rect.width))));
          }}
          onKeyDown={e=>{
            const change=({ArrowLeft:split-1,ArrowRight:split+1,Home:0,End:100} as Record<string,number>)[e.key];
            if(change!==undefined){e.preventDefault();pause();setSplit(Math.max(0,Math.min(100,change)));}
          }}>↔</button>}
      </div>
      <aside className="section-inspector">
        <p className="eyebrow">{runLabel} · {policy} · Hour {hour}</p>
        {!showingUntreated && <p className="footnote">{allocation.ventilationCredits} ventilation · {allocation.recyclerCredits} repairs · {allocation.redistributionCredits} redistribution</p>}
        <h2>Level {floor}</h2>
        <FloorSeverity series={series} hour={hour} floor={floor}/>
        <PanelExplain title={'level ' + floor + ' conditions'} onOpen={pause}
          reading={runLabel + '. ' + floorReading(reading, hour)}/>
        <details className="level-details"><summary>View floor readings</summary>
        <p>{format(LEVELS[floor - 1]!.population)} residents</p><strong className={isUnsafe(reading.hazards) ? 'warning-text' : ''}>{isUnsafe(reading.hazards) ? 'Unsafe · ' + warnings(reading) : 'Within modeled limits'}</strong>
        <dl>{[
          ['Essential power', format(reading.powerFraction * 100) + '%'],
          ['Temperature', format(reading.temperatureCelsius) + ' °C'],
          ['Water quality', format(reading.waterQuality) + ' / 100'],
        ].map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl></details>
        {represent && <a className="outline-link" href="#fund-response" onClick={() => {pause(); represent(floor);}}>Plan a response for level {floor} ↓</a>}
        {funded && <details className="level-details"><summary>Compare with no intervention</summary><div className="compare-controls">
          <button type="button" disabled={pinned} onPointerDown={e => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId); pause(); setHolding(true);
          }} onLostPointerCapture={() => setHolding(false)} onPointerUp={() => setHolding(false)}
            onPointerCancel={() => setHolding(false)} onBlur={() => setHolding(false)}
            onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pause(); setHolding(true); } }}
            onKeyUp={() => setHolding(false)}>Hold to compare</button>
          <label>Untreated on left · {split}%<input type="range" aria-label="Before and after split" min="0" max="100" value={split} disabled={comparison} onChange={e => {pause(); setSplit(Number(e.target.value));}}/></label>
          <label><input type="checkbox" checked={pinned} onChange={e => { pause(); setPinned(e.target.checked); }}/> Show untreated</label>
        </div></details>}
      </aside>
    </div>
    <div className="exhibit-transport">
      <button className="primary" onClick={() => dispatch({ type: 'toggle' })}>{playing ? <Pause size={16}/> : <Play size={16}/>}
        {playing ? 'Pause' : hour === 0 ? represent || !funded ? 'Trigger failure' : 'Play response' : hour === MODEL.hours ? 'Replay' : 'Resume'}</button>
      <label>Hour {hour} / {MODEL.hours}<input type="range" aria-label="District replay hour" min={0} max={MODEL.hours} value={hour} onPointerDown={pause} onChange={e => seek(Number(e.target.value))}/></label>
      <button aria-label="Skip to final hour" onClick={() => seek(MODEL.hours)}><SkipForward size={16}/></button>
      <div className="supply"><span>District supply</span><strong>{current.availablePower} / {MODEL.normalPower}</strong><meter min={0} max={MODEL.normalPower} value={current.availablePower} aria-label="Available district power"/>
        <PanelExplain title="district supply" onOpen={pause} reading={`At hour ${hour}, the district can supply ${current.availablePower} of the ${MODEL.normalPower} units residents need. Redistributing power changes which floors receive it.`}/></div>
    </div>
    <label className="hazard-pause"><input type="checkbox" checked={pauseAtHazard}
      onChange={e => setPauseAtHazard(e.target.checked)}/> Pause at the first unsafe hour</label>
    <p className="section-caption" role="status">{atThreshold
      ? (playing ? 'First unsafe hour' : 'First unsafe hour · Paused · Resume to continue') + ' · Level ' + first.levelId + ' · ' + warnings(first) + (firstLevels && firstLevels.length > 1 ? '. Also unsafe: ' + firstLevels.slice(1).map(l => 'Level ' + l.levelId).join(', ') : '')
      : hour === 0 && !showingUntreated ? 'Before the outage. Power, cooling and repairs start from the same initial conditions in every plan.'
      : hour === 0 ? 'Before the outage. Select a floor to inspect it, or trigger the failure to watch the district respond.'
      : hour === MODEL.hours ? 'Replay complete. Scrub the timeline to inspect any hour.' : playing ? 'Playing the outage hour by hour.' : 'Replay paused at hour ' + hour + '.'}</p>
    <details className="investigate"><summary>Explore the data behind the replay</summary>
    <p className="footnote">Warm upper tint shows warming above baseline. Blue lower tint shows water quality loss. Dimming and subtle flicker track the unmet share of essential power.</p>
    <SafetyGrid series={series} hour={hour} inspect={inspect}/>
    <Cascade series={series} untreated={untreated} funded={funded} hour={hour} floor={floor} playing={playing} seek={seek}/>
    <IllustrativeLayer policy={policy} allocation={showingUntreated ? ZERO_ALLOCATION : allocation} series={series} floor={floor} hour={hour} inspect={inspect}/>
    </details>
  </section>;
}
