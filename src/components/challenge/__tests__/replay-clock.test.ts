import { expect, it } from 'vitest';
import { replayClock, type ReplayClock } from '../replay-clock';

const initial: ReplayClock = {hour: 0, floor: 2, playing: false};
const tick = {type: 'tick', first: {hour: 1, floor: 5}} as const;

it('pauses on the first hazard, ignores queued ticks, and resumes into the following hour', () => {
  const first = replayClock(replayClock(initial, {type:'toggle'}), tick);
  expect(first).toEqual({hour:1, floor:5, playing:false});
  expect(replayClock(first, tick)).toBe(first);
  expect(replayClock(replayClock(first, {type:'toggle'}), tick)).toEqual({hour:2, floor:5, playing:true});
});

it('stops when inspecting, finishes at 72, and restarts at the pre-failure snapshot', () => {
  const inspected = replayClock({...initial, playing:true}, {type:'inspect', hour:71, floor:3});
  expect(replayClock(inspected, tick)).toEqual({hour:71, floor:3, playing:false});
  const end = replayClock(replayClock(inspected, {type:'toggle'}), tick);
  expect(end).toEqual({hour:72, floor:3, playing:false});
  expect(replayClock(end, tick)).toBe(end);
  expect(replayClock(end, {type:'toggle'})).toEqual({hour:0, floor:3, playing:true});
});
