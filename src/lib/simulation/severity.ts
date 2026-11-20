import { MODEL } from './simulation';
import type { HazardFlags, HourlySnapshot, LevelId, LevelSnapshot } from './types';

export function floorSeverity(level: LevelSnapshot) {
  const heat = Math.max(0, level.temperatureCelsius - MODEL.unsafeTemperature);
  const water = Math.max(0, MODEL.unsafeWater - level.waterQuality);
  const power = Math.max(0, MODEL.unsafePower - level.powerFraction);
  const index = heat / MODEL.heatGain + water / MODEL.waterPowerPenalty + power / MODEL.unsafePower;
  return { index, heat, water, power };
}

export function consecutiveHazardHours(series: readonly HourlySnapshot[], hour: number, floor: LevelId, hazard: keyof HazardFlags) {
  let start = hour;
  while (start > 0 && series[start]!.levels[floor - 1]!.hazards[hazard]) start--;
  return hour - start;
}
