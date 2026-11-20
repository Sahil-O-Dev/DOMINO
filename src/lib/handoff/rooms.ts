import { randomBytes } from 'node:crypto';
import { channels, currentPost, validDecision } from './incident';
import type { Channel, Decision } from './incident';

export type Ticket = {code:string; role:'operator'|'resident'; token:string};
export type RoomView = {round:number; revision:number; ready:Ticket['role'][]; joined:boolean; reports:Channel[]; decision:Decision|null};
type Room = RoomView & {operator:string; resident:string|null; expires:number};

export function createRegistry() {
  const rooms = new Map<string,Room>();
  const token = () => randomBytes(24).toString('hex');
  function room(code:string) {
    const r=rooms.get(code);
    if(!r || r.expires<=Date.now()) throw new Error('Room expired or unavailable.');
    return r;
  }
  function authorize(ticket:Ticket) {
    const r=room(ticket.code);
    if(!ticket.token || !['operator','resident'].includes(ticket.role) || r[ticket.role]!==ticket.token) throw new Error('Invalid room ticket.');
    return r;
  }
  function view(r:Room):RoomView {
    return {round:r.round,revision:r.revision,ready:[...r.ready],joined:r.joined,reports:[...r.reports],decision:r.decision};
  }
  return {
    create():Ticket {
      for(const [code,r] of rooms) if(r.expires<=Date.now())rooms.delete(code);
      if(rooms.size>=500)throw new Error('All rooms are busy.');
      let code= randomBytes(3).toString('hex').toUpperCase();
      while(rooms.has(code))code=randomBytes(3).toString('hex').toUpperCase();
      const operator=token();
      rooms.set(code,{round:1,revision:0,ready:[],operator,resident:null,expires:Date.now()+30*60_000,joined:false,reports:[],decision:null});
      return {code,role:'operator',token:operator};
    },
    join(code:string):Ticket {
      const r=room(code);
      if(r.joined)throw new Error('This room already has a resident.');
      r.resident=token();r.joined=true;r.revision++;
      return {code,role:'resident',token:r.resident};
    },
    readyForSecond(ticket:Ticket) {
      const r=authorize(ticket);
      if(r.round===2)return view(r);
      if(!r.decision)throw new Error('Finish the first briefing first.');
      if(!r.ready.includes(ticket.role)){r.ready.push(ticket.role);r.revision++;}
      if(r.ready.length===2){r.round=2;r.ready=[];r.reports=[];r.decision=null;}
      return view(r);
    },
    read(ticket:Ticket) {return view(authorize(ticket));},
    send(ticket:Ticket,channel:Channel,round=1) {
      const r=authorize(ticket);
      if(r.round!==round || currentPost(ticket.role,round)!=='resident' || !channels.includes(channel) || r.decision)throw new Error('Report unavailable.');
      if(!r.reports.includes(channel)){r.reports.push(channel);r.revision++;}
      return view(r);
    },
    commit(ticket:Ticket,decision:Decision,round=1) {
      const r=authorize(ticket);
      if(r.round!==round || currentPost(ticket.role,round)!=='operator' || !r.joined || !validDecision(decision))throw new Error('Decision unavailable.');
      if(!r.decision){r.decision=decision;r.revision++;}
      return view(r);
    },
  };
}
