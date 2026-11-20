'use server';
import { createRegistry } from '../../lib/handoff/rooms';
import type { Ticket } from '../../lib/handoff/rooms';
import type { Channel, Decision } from '../../lib/handoff/incident';

// The preview and the documented deployment run on a single Node server.
const host=globalThis as typeof globalThis & {dominoHandoffV2?:ReturnType<typeof createRegistry>};
const rooms=host.dominoHandoffV2??=createRegistry();

export async function openRoom(){return rooms.create();}
export async function enterRoom(code:string){return rooms.join(code.trim().toUpperCase());}
export async function readRoom(ticket:Ticket){return rooms.read(ticket);}
export async function sendReport(ticket:Ticket,channel:Channel,round:number){return rooms.send(ticket,channel,round);}
export async function submitDecision(ticket:Ticket,decision:Decision,round:number){return rooms.commit(ticket,decision,round);}

export async function readyForSecond(ticket:Ticket){return rooms.readyForSecond(ticket);}
