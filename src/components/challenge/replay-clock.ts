import { MODEL } from '../../lib/simulation/simulation';
import type { LevelId } from '../../lib/simulation/types';

export interface ReplayClock {
  hour: number;
  floor: LevelId;
  playing: boolean;
}
type FirstHazard = { hour: number; floor: LevelId } | undefined;
type Action =
  | { type: 'tick'; first: FirstHazard }
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
    case 'tick': {
      if (!state.playing) return state;
      const hour = Math.min(state.hour + 1, MODEL.hours);
      if (action.first?.hour === hour) return { hour, floor: action.first.floor, playing: false };
      return { ...state, hour, playing: hour < MODEL.hours };
    }
  }
}
