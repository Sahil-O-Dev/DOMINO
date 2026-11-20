'use client';

import { PanelExplain } from '../PanelExplain';
import { budgetReading } from '../../lib/simulation/readings';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { currentPost, channels, incident, names, report } from '../../lib/handoff/incident';
import type { Channel, Decision } from '../../lib/handoff/incident';
import type { RoomView, Ticket } from '../../lib/handoff/rooms';
import { openRoom, enterRoom, readRoom, readyForSecond, sendReport, submitDecision } from '../../app/handoff/actions';
import { MODEL, simulateTrajectory } from '../../lib/simulation/simulation';
import { calculateHarm } from '../../lib/simulation/metrics';
import { safeHoursGini } from '../../lib/simulation/equity';
import { DistrictSection } from '../challenge/DistrictSection';

const initial:Decision={belief:{heat:false,water:false,power:false},allocation:{ventilationCredits:40,recyclerCredits:30,redistributionCredits:30}};
const fields=[['ventilationCredits','Ventilation'],['recyclerCredits','Recycler repairs'],['redistributionCredits','Power redistribution']] as const;
const empty:RoomView={revision:0,round:1,ready:[],joined:false,reports:[],decision:null};
const storageKey='domino-handoff-ticket-v2';

function Reveal({decision,data,restart,next,nextLabel,waiting}:{decision:Decision;data:ReturnType<typeof incident>;restart:()=>void;next:(()=>void)|null;nextLabel:string;waiting:boolean}){
  const funded=useMemo(()=>simulateTrajectory('geothermal-failure','directorate',decision.allocation),[decision.allocation]);
  const harm=useMemo(()=>calculateHarm(funded),[funded]);
  const before=useMemo(()=>calculateHarm(data.run),[data]);
  const correct=channels.filter(k=>decision.belief[k]===data.actual.hazards[k]).length;
  return <><section className="panel"><p className="eyebrow">After-action review · Level {data.levelId}</p>
    <h2>You identified {correct} of 3 conditions correctly.</h2><p>The Directorate displayed rounded readings from hour {data.sampleHour}. The resident observed hour {data.briefingHour}.</p>
    <div className="table-wrap"><table><thead><tr><th>Condition</th><th>Official feed</th><th>Your assessment</th><th>At the scene</th></tr></thead>
    <tbody>{channels.map(k=><tr key={k}><th>{names[k]}</th>{[data.feedFlags[k],decision.belief[k],data.actual.hazards[k]].map((unsafe,i)=><td key={i}>{unsafe?'Unsafe':'Safe'}</td>)}</tr>)}</tbody></table></div>
    <PanelExplain title="after-action review" reading={`Your assessment matched ${correct} of three observed conditions on level ${data.levelId}. The last official sample came from hour ${data.sampleHour}, while the resident saw hour ${data.briefingHour}. The time gap matters when conditions change between readings.`}/>
    <h3>What your response would change</h3><p>Replaying the outage with your plan from hour 1 gives Level {data.levelId} <strong>{harm.levels[data.levelId-1]!.unsafeHours} unsafe hours</strong>, compared with {before.levels[data.levelId-1]!.unsafeHours} untreated. This is a counterfactual replay of the full 72 hours.</p>
    <p>District exposure · {harm.totalUnsafePersonHours.toLocaleString('en-US')} unsafe resident-hours. Safe-hours inequality · {safeHoursGini(harm)?.toFixed(3)??'undefined'} Gini (zero means equal safe hours).</p>
    <div className="actions">{next && <button className="primary" disabled={waiting} onClick={next}>{waiting?'Waiting for the other post…':nextLabel}</button>}<button onClick={restart}>Return to mode selection</button></div></section>
    <DistrictSection key="handoff-result" policy="directorate" allocation={decision.allocation} funded={funded} untreated={data.run} target={data.levelId}/></>;
}

export function Handoff(){
  const [localRound,setLocalRound]=useState(1);
  const [mode,setMode]=useState<'menu'|'solo'|'hot-seat'|'paired'>('menu');
  const [seat,setSeat]=useState<'resident'|'pass'|'operator'>('resident');
  const [ticket,setTicket]=useState<Ticket|null>(null);
  const [room,setRoom]=useState<RoomView>(empty);
  const [code,setCode]=useState('');
  const [reports,setReports]=useState<Channel[]>([]);
  const [draft,setDraft]=useState(initial);
  const [decision,setDecision]=useState<Decision|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [offline,setOffline]=useState(false);

  const round=mode==='paired'?room.round:localRound;
  const data=useMemo(()=>incident(round),[round]);
  const acceptView=(view:RoomView)=>setRoom(previous=>view.revision>=previous.revision?view:previous);

  useEffect(()=>{if(round===2){setDraft(initial);setReports([]);setDecision(null);setSeat('resident');window.scrollTo(0,0);}},[round]);
  useEffect(()=>{
    try{const saved=sessionStorage.getItem(storageKey);if(saved){setTicket(JSON.parse(saved));setMode('paired');}}catch{/* Local modes work without storage. */}
  },[]);
  useEffect(()=>{
    if(!ticket || (room.round===2 && room.decision))return;
    let active=true;
    let timer:ReturnType<typeof setTimeout>;
    async function poll(){
      try{const next=await readRoom(ticket!);if(active){acceptView(next);setOffline(false);}}
      catch{if(active)setOffline(true);}
      if(active)timer=setTimeout(poll,1200);
    }
    void poll();
    return ()=>{active=false;clearTimeout(timer);};
  },[ticket,room.round,room.decision]);

  function reset(){
    try{sessionStorage.removeItem(storageKey);}catch{}
    setLocalRound(1);setMode('menu');setTicket(null);setRoom(empty);setReports([]);setDecision(null);setDraft(initial);setError('');setOffline(false);setSeat('resident');
  }
  async function request(action:()=>Promise<void>){
    setBusy(true);setError('');
    try{await action();}catch{setError('Could not complete the room request. Check the connection and room code, or use one device.');}
    finally{setBusy(false);}
  }
  async function pair(join:boolean){
    await request(async()=>{
      const next=join?await enterRoom(code):await openRoom();
      setTicket(next);setMode('paired');
      try{sessionStorage.setItem(storageKey,JSON.stringify(next));}catch{}
    });
  }
  const paired=mode==='paired';
  const post=ticket?currentPost(ticket.role,round):null;
  const resident=paired?post==='resident':mode==='hot-seat' && seat==='resident';
  const sent=paired?room.reports:reports;
  const final=paired?room.decision:decision;
  const total=Object.values(draft.allocation).reduce((a,b)=>a+b,0);
  function dispatch(k:Channel){
    if(paired && ticket)void request(async()=>{acceptView(await sendReport(ticket,k,round));});
    else setReports(prev=>prev.includes(k)?prev:[...prev,k]);
  }
  return <main className="shell handoff" id="main-content">
    <header><p className="eyebrow accent">DOMINO / Field operations</p><h1>The Handoff</h1>
      <p>The Directorate has the budget. Residents have the latest readings. Reconcile the two before you authorize a response.</p><Link href="/">Return to district</Link></header>
    {error && <p role="alert">{error}</p>}
    {mode==='menu'?<section className="panel"><h2>Take a post</h2><p>Alone, request field reports from a simulated resident. Together, one person observes the Hollow and the other operates the control room.</p>
      <div className="actions"><button className="primary" onClick={()=>setMode('solo')}>Begin solo briefing</button><button onClick={()=>setMode('hot-seat')}>Share one device</button><button disabled={busy} onClick={()=>void pair(false)}>Open a paired room</button></div>
      <form className="join-form" onSubmit={e=>{e.preventDefault();void pair(true);}}><label>Resident room code<input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="6 characters"/></label><button disabled={busy||!/^[A-F0-9]{6}$/.test(code)}>Join as resident</button></form>
    </section>:<>
    {paired && <section className="room-strip"><strong>Room {ticket?.code}</strong> · {post} · {offline?'Connection interrupted. Reconnecting…':room.joined?'Both posts assigned':'Waiting for the resident'}<p>Open /handoff on the other device using the same reachable server address and enter this code.</p></section>}
    {final?<Reveal decision={final} data={data} restart={reset}
      next={round!==1?null:()=>{if(ticket)void request(async()=>acceptView(await readyForSecond(ticket)));else {setDecision(null);setLocalRound(2);}}}
      nextLabel={paired?'Ready to swap posts':mode==='hot-seat'?'Swap posts for the Level 4 briefing':'Begin the Level 4 briefing'}
      waiting={busy||Boolean(ticket&&room.ready.includes(ticket.role))}/>:resident?<section className="panel field-post"><p className="eyebrow">Resident post · Current hour {data.briefingHour}</p>
      <div className="field-window" style={{backgroundPosition:'center '+((data.levelId-1)*25)+'%'}} role="img" aria-label={'District level '+data.levelId}/><h2>Report from Level {data.levelId}</h2><p>Choose the observations to hand to the operator. You can also describe them aloud.</p>
      {channels.map(k=><div key={k} className="field-line"><p>{report(k,data)}</p><button disabled={busy||sent.includes(k)} onClick={()=>dispatch(k)}>{sent.includes(k)?'Sent':'Send '+names[k]}</button></div>)}
      <PanelExplain title="field observations" reading={`At hour ${data.briefingHour} on level ${data.levelId}, the current field reports say: ${channels.map(k => report(k,data)).join(' ')} Select an observation to share it with the operator.`}/>
      {!paired&&<button className="primary" onClick={()=>setSeat('pass')}>Cover readings and pass device</button>}
    </section>:mode==='hot-seat'&&seat==='pass'?<section className="panel"><h2>Pass to the operator</h2><p>The resident’s screen is covered.</p><button className="primary" onClick={()=>setSeat('operator')}>Open control room</button></section>:
    <section className="panel"><p className="eyebrow">Directorate control room · Hour {data.briefingHour}</p><h2>Assess Level {data.levelId}</h2>
      <p>Last official sample · hour {data.sampleHour}. Flag each condition you believe is unsafe now.</p>
      <div className="dispatch-feed">{channels.map(k=><label key={k}><span>{names[k]}</span><strong>{data.official[k]}{k==='heat'?' °C':k==='power'?'%':' / 100'}</strong><small>Unsafe {k==='heat'?'above '+MODEL.unsafeTemperature+' °C':k==='water'?'below '+MODEL.unsafeWater:'below '+(MODEL.unsafePower*100)+'%'}</small><span><input type="checkbox" checked={draft.belief[k]} onChange={e=>setDraft({...draft,belief:{...draft.belief,[k]:e.target.checked}})}/> Flag unsafe</span></label>)}</div>
      <PanelExplain title="official feed" reading={`At hour ${data.briefingHour}, the newest official sample for level ${data.levelId} is from hour ${data.sampleHour}: ${data.official.heat} °C, water quality ${data.official.water}/100 and ${data.official.power}% power. The readings describe the sample hour. A resident dispatch can help you assess conditions now.`}/>
      <h3>Resident dispatches</h3>
      {mode==='solo'&&<div className="actions">{channels.map(k=><button key={k} disabled={sent.includes(k)} onClick={()=>dispatch(k)}>Ask about {names[k].toLowerCase()}</button>)}</div>}
      <div aria-live="polite">{sent.length?sent.map(k=><p key={k}>{report(k,data)}</p>):<p>No field reports received.</p>}</div>
      <h3>Authorize a 100-credit response</h3><p>Your plan will be evaluated as if it had been in place at the start of the outage.</p>
      {fields.map(([key,name])=><label className="budget-row" key={key}>{name}<select value={draft.allocation[key]} onChange={e=>setDraft({...draft,allocation:{...draft.allocation,[key]:Number(e.target.value)}})}>{Array.from({length:11},(_,i)=><option key={i}>{i*10}</option>)}</select></label>)}
      <PanelExplain title="handoff allocation" reading={budgetReading(draft.allocation)}/>
      <p role="status">{total} / 100 credits</p><button className="primary" disabled={total!==100||busy||(paired&&!room.joined)} onClick={()=>{
        if(ticket)void request(async()=>acceptView(await submitDecision(ticket,draft,round)));else setDecision(draft);
      }}>Commit assessment and plan</button>
    </section>}
    {!final&&<button disabled={busy} onClick={reset}>Return to mode selection</button>}</>}
  </main>;
}
