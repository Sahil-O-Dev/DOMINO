import { randomBytes } from 'node:crypto';
import { channels, validDecision } from './incident';
import type { Channel, Decision } from './incident';

export type Ticket = {code:string; role:'operator'|'resident'; token:string};
export type RoomView = {joined:boolean; reports:Channel[]; decision:Decision|null};
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
    return {joined:r.joined,reports:[...r.reports],decision:r.decision};
  }
  return {
    create():Ticket {
      for(const [code,r] of rooms) if(r.expires<=Date.now())rooms.delete(code);
      if(rooms.size>=500)throw new Error('All rooms are busy.');
      let code= randomBytes(3).toString('hex').toUpperCase();
      while(rooms.has(code))code=randomBytes(3).toString('hex').toUpperCase();
      const operator=token();
      rooms.set(code,{operator,resident:null,expires:Date.now()+30*60_000,joined:false,reports:[],decision:null});
      return {code,role:'operator',token:operator};
    },
    join(code:string):Ticket {
      const r=room(code);
      if(r.joined)throw new Error('This room already has a resident.');
      r.resident=token();r.joined=true;
      return {code,role:'resident',token:r.resident};
    },
    read(ticket:Ticket) {return view(authorize(ticket));},
    send(ticket:Ticket,channel:Channel) {
      const r=authorize(ticket);
      if(ticket.role!=='resident' || !channels.includes(channel) || r.decision)throw new Error('Report unavailable.');
      if(!r.reports.includes(channel))r.reports.push(channel);
      return view(r);
    },
    commit(ticket:Ticket,decision:Decision) {
      const r=authorize(ticket);
      if(ticket.role!=='operator' || !r.joined || !validDecision(decision))throw new Error('Decision unavailable.');
      r.decision??=decision;
      return view(r);
    },
  };
}
