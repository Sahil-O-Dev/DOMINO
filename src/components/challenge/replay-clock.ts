import { MODEL } from '../../lib/simulation/simulation';
import type { LevelId } from '../../lib/simulation/types';

export interface ReplayClock {
  hour: number;
  floor: LevelId;
  playing: boolean;
}
export const REPLAY_HOUR_MS = 260;

export function elapsedReplayHours(milliseconds: number) {
  return Math.floor(milliseconds / REPLAY_HOUR_MS);
}
type Action =
  | { type: 'advance'; hours: number; breakpoint?: { hour: number; floor: LevelId } | undefined }
  | { type: 'toggle' }
  | { type: 'pause' }
  | { type: 'inspect'; hour?: number; floor?: LevelId };

export function replayClock(state: ReplayClock, action: Action): ReplayClock {
  switch (action.type) {
    case 'toggle':
      return { ...state, playing: !state.playing, hour: state.hour === MODEL.hours ? 0 : state.hour };
    case 'pause':
      return state.playing ? { ...state, playing: false } : state;
    case 'inspect':
      return { hour: action.hour ?? state.hour, floor: action.floor ?? state.floor, playing: false };
    case 'advance': {
      if (!state.playing || action.hours <= 0) return state;
      const hour = Math.min(state.hour + action.hours, MODEL.hours);
      const stop = action.breakpoint;
      if (stop && state.hour < stop.hour && stop.hour <= hour) {
        return { hour: stop.hour, floor: stop.floor, playing: false };
      }
      return { ...state, hour, playing: hour < MODEL.hours };
    }
  }
}
