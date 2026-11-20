'use server';
import { createRegistry } from '../../lib/handoff/rooms';
import type { Ticket } from '../../lib/handoff/rooms';
import type { Channel, Decision } from '../../lib/handoff/incident';

// The preview and the documented deployment run on a single Node server.
const host=globalThis as typeof globalThis & {dominoHandoff?:ReturnType<typeof createRegistry>};
const rooms=host.dominoHandoff??=createRegistry();

export async function openRoom(){return rooms.create();}
export async function enterRoom(code:string){return rooms.join(code.trim().toUpperCase());}
export async function readRoom(ticket:Ticket){return rooms.read(ticket);}
export async function sendReport(ticket:Ticket,channel:Channel){return rooms.send(ticket,channel);}
export async function submitDecision(ticket:Ticket,decision:Decision){return rooms.commit(ticket,decision);}
