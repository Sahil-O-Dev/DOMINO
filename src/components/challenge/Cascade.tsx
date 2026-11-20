import { PanelExplain } from '../PanelExplain';
import { useMemo } from 'react';
import { MODEL } from '../../lib/simulation/simulation';
import type { HourlySnapshot, LevelId } from '../../lib/simulation/types';

export function hazardEvents(series: readonly HourlySnapshot[]) {
  return series.slice(1).flatMap((s,i)=>s.levels.flatMap((l,j)=>
    (['heat','water','power'] as const).filter(k=>l.hazards[k]!==series[i]!.levels[j]!.hazards[k])
      .map(k=>({hour:s.hour,level:l.levelId,hazard:k,unsafe:l.hazards[k]}))));
}

function PowerFlow({ snapshot, title }: {snapshot:HourlySnapshot; title:string}) {
  const scale = 1.1;
  let offset = 0;
  return <figure><figcaption>{title} · {snapshot.availablePower} units</figcaption><svg viewBox="0 0 240 200" role="img" aria-label={title+' delivered power by level'}>
    {snapshot.levels.map((l,i)=>{
      const thickness=l.deliveredPower*scale;
      const sy=25+offset+thickness/2;
      const ey=19+i*38;
      offset+=thickness;
      return <g key={l.levelId}><path d={`M10 ${sy} C85 ${sy} 90 ${ey} 153 ${ey}`} fill="none" stroke={['#afc9b1','#87aca5','#8ca5c7','#b3a4bf','#cab28d'][i]} strokeWidth={thickness}><title>{'Level '+l.levelId+': '+l.deliveredPower.toFixed(2)+' power units'}</title></path>
        <text x="160" y={ey+4} fill="#eee9de" fontSize="11">L{l.levelId} · {l.deliveredPower.toFixed(1)}</text></g>;
    })}
  </svg></figure>;
}

export function Cascade({series, untreated, funded, hour, floor, playing, seek}: {
  series:readonly HourlySnapshot[]; untreated:readonly HourlySnapshot[]; funded?:readonly HourlySnapshot[] | undefined;
  hour:number; floor:LevelId; playing:boolean; seek:(h:number)=>void;
}) {
  const events=useMemo(()=>hazardEvents(series),[series]);
  const past=events.filter(e=>e.hour<=hour);
  const next=events.find(e=>e.level===floor && e.unsafe && e.hour>hour);
  const s=series[hour]!, l=s.levels[floor-1]!;
  const nodes=[
    {x:4,y:40,name:'Shared supply',value:s.availablePower+' units'},
    {x:142,y:40,name:'Level '+floor+' power',value:(l.powerFraction*100).toFixed(1)+'%'},
    {x:283,y:4,name:'Temperature',value:l.temperatureCelsius.toFixed(2)+' °C'},
    {x:425,y:66,name:'Water quality',value:l.waterQuality.toFixed(2)+' / 100'},
  ];
  return <details className="visual-panel" open><summary>Infrastructure cascade &amp; warnings</summary>
    <p>All levels draw from one supply. Within level {floor}, power affects cooling and water treatment; heat also affects water quality.</p>
    <PanelExplain title="infrastructure cascade" onOpen={() => seek(hour)} reading={`At hour ${hour}, level ${floor} receives ${(l.powerFraction * 100).toFixed(1)}% of essential power, which affects both cooling and water treatment. ${next ? 'Its next modeled hazard onset is ' + next.hazard + ' at hour ' + next.hour + '.' : 'No additional hazard begins on this level during the rest of this run.'}`}/>
    <svg className={'cascade-graph '+(playing?'running':'')} viewBox="0 0 550 125" role="img" aria-label={'Power, cooling and water dependencies at hour '+hour}>
      <path d="M114 62 H142 M252 58 L283 28 M252 70 L425 89 M393 29 L425 77" stroke="#c7c7b3" fill="none" strokeWidth="2" strokeDasharray="6 4"/>
      {nodes.map(n=><g key={n.name}><rect x={n.x} y={n.y} width="110" height="48" rx="3" fill="#253029" stroke="#54635b"/><text x={n.x+6} y={n.y+16} fill="#ced8cf" fontSize="12">{n.name}</text><text x={n.x+6} y={n.y+36} fill="#fff" fontSize="14">{n.value}</text></g>)}
    </svg>
    <h3>Next modeled threshold · level {floor}</h3>
    <p>{next ? <>At hour {next.hour}, {next.hazard} becomes unsafe under this run. <button onClick={()=>seek(next.hour)}>Inspect hour {next.hour}</button></> : 'No further hazard onset on this level through hour '+MODEL.hours+'.'}</p>
    <h3>Power distribution · hour {hour}</h3><p>Band widths show delivered power in the same units across both diagrams.</p>
    <PanelExplain title="power distribution" onOpen={() => seek(hour)} reading={`Level ${floor} receives ${untreated[hour]!.levels[floor-1]!.deliveredPower.toFixed(1)} units in the untreated outage at hour ${hour}. The ${funded ? 'funded allocation at the same hour' : 'normal hour-zero reference'} supplies ${(funded?.[hour] ?? untreated[0])!.levels[floor-1]!.deliveredPower.toFixed(1)} units to that floor. Wider bands mean more power delivered.`}/>
    <div className="flow-pair"><PowerFlow snapshot={untreated[hour]!} title="Untreated"/><PowerFlow snapshot={funded?.[hour] ?? untreated[0]!} title={funded?'Funded allocation':'Normal reference (hour 0)'}/></div>
    <h3>Event log through hour {hour}</h3>
    <ol className="event-log">{past.slice().reverse().map(e=><li key={[e.hour,e.level,e.hazard].join('-')}>Hour {e.hour} · L{e.level} · {e.hazard} {e.unsafe?'crossed threshold':'returned to safe range'}</li>)}
      {hour>=1 && <li>Hour 1 · District supply fell to {series[1]!.availablePower} units</li>}<li>Hour 0 · Normal supply</li></ol>
  </details>;
}
