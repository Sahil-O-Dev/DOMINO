import { expect, it } from 'vitest';
import { elapsedReplayHours, REPLAY_HOUR_MS, replayClock, type ReplayClock } from '../replay-clock';
import { MODEL } from '../../../lib/simulation/simulation';

const initial: ReplayClock = {hour: 0, floor: 2, playing: false};
const running = replayClock(initial, {type:'toggle'});
const advance = {type: 'advance', hours: 1} as const;

it('runs from start through all 72 snapshots with a single play command', () => {
  let state = running;
  for (let hour = 1; hour <= MODEL.hours; hour++) {
    state = replayClock(state, advance);
    expect(state).toEqual({hour, floor: 2, playing: hour < MODEL.hours});
  }
  expect(replayClock(state, advance)).toBe(state);
  expect(replayClock(state, {type:'toggle'})).toEqual(running);
});

it('advances by whole elapsed hours even if the browser delays callbacks', () => {
  expect(elapsedReplayHours(REPLAY_HOUR_MS - 1)).toBe(0);
  const hours = elapsedReplayHours(7.5 * REPLAY_HOUR_MS);
  expect(replayClock(running, {...advance, hours}).hour).toBe(7);
  expect(replayClock(running, {...advance, hours:100})).toEqual({hour:72, floor:2, playing:false});
});

it('honors an optional hazard breakpoint even when a delayed callback passes it', () => {
  const event = {...advance, hours:8, breakpoint:{hour:1, floor:5}} as const;
  const first = replayClock(running, event);
  expect(first).toEqual({hour:1, floor:5, playing:false});
  expect(replayClock(first, event)).toBe(first);
  expect(replayClock(replayClock(first, {type:'toggle'}), event)).toEqual({hour:9, floor:5, playing:true});
});

it('ignores queued advances after pause or seek and resumes at the selected hour', () => {
  const inspected = replayClock(running, {type:'inspect', hour:24, floor:3});
  expect(replayClock(inspected, advance)).toEqual({hour:24, floor:3, playing:false});
  const next = replayClock(replayClock(inspected, {type:'toggle'}), advance);
  expect(next.hour).toBe(25);
  const paused = replayClock(next, {type:'pause'});
  expect(replayClock(paused, advance)).toBe(paused);
});
