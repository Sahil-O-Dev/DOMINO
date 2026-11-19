import { interventionEffects, INTERVENTIONS, PROTECTIVE_WEIGHTS, ZERO_ALLOCATION } from './interventions';
import type { FiveLevels, HazardFlags, HourlySnapshot, LevelDefinition, LevelSnapshot, PowerPolicy, ResourceAllocation } from './types';

export const LEVELS: FiveLevels<LevelDefinition> = [
  { id: 1, population: 200000, essentialPowerDemand: 12, baseTemperatureCelsius: 25 },
  { id: 2, population: 300000, essentialPowerDemand: 18, baseTemperatureCelsius: 26 },
  { id: 3, population: 400000, essentialPowerDemand: 24, baseTemperatureCelsius: 27 },
  { id: 4, population: 500000, essentialPowerDemand: 30, baseTemperatureCelsius: 28 },
  { id: 5, population: 600000, essentialPowerDemand: 36, baseTemperatureCelsius: 29 },
];
for (const level of LEVELS) Object.freeze(level);
Object.freeze(LEVELS);
export const BASELINE_WEIGHTS = Object.freeze({
  directorate: Object.freeze([0.30, 0.25, 0.20, 0.15, 0.10] as const),
  equity: Object.freeze([0.10, 0.15, 0.20, 0.25, 0.30] as const),
});
export const MODEL = Object.freeze({ normalPower: 120, failedPower: 84, hours: 72,
  initialWaterQuality: 95, temperatureResponse: 0.18, waterResponse: 0.12,
  depthIncrement: 0.10, heatGain: 8, waterPowerPenalty: 65, waterHeatPenalty: 1.3,
  waterHeatThreshold: 28, unsafeTemperature: 32, unsafeWater: 70, unsafePower: 0.60 });

export function mapLevels<T>(fn: (level: LevelDefinition, index: number) => T): FiveLevels<T> {
  return [fn(LEVELS[0], 0), fn(LEVELS[1], 1), fn(LEVELS[2], 2), fn(LEVELS[3], 3), fn(LEVELS[4], 4)];
}
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Saturated levels are removed each round; no numerical threshold changes safety rules. */
export function allocatePower(supply: number, weights: FiveLevels<number>): FiveLevels<number> {
  if (!Number.isFinite(supply) || supply < 0) throw new RangeError('Supply must be finite and nonnegative.');
  if (weights.length !== 5 || weights.some(w => !Number.isFinite(w) || w <= 0)) {
    throw new RangeError('Five finite positive priority weights are required.');
  }
  const delivered = [0, 0, 0, 0, 0];
  let active = [0, 1, 2, 3, 4];
  let remaining = Math.min(supply, MODEL.normalPower);
  while (active.length && remaining > 0) {
    const weightSum = active.reduce((sum, i) => sum + weights[i]!, 0);
    if (!Number.isFinite(weightSum)) throw new RangeError('Weight sum must be finite.');
    const capped = active.filter(i => remaining * (weights[i]! / weightSum) >= LEVELS[i]!.essentialPowerDemand);
    if (!capped.length) {
      for (const i of active) delivered[i] = remaining * (weights[i]! / weightSum);
      break;
    }
    for (const i of capped) {
      delivered[i] = LEVELS[i]!.essentialPowerDemand;
      remaining -= delivered[i]!;
    }
    active = active.filter(i => !capped.includes(i));
  }
  return mapLevels((_level, i) => delivered[i]!);
}

export function classifyHazards(temperatureCelsius: number, waterQuality: number, powerFraction: number): HazardFlags {
  if (![temperatureCelsius, waterQuality, powerFraction].every(Number.isFinite)) throw new RangeError('Hazard inputs must be finite.');
  return { heat: temperatureCelsius > MODEL.unsafeTemperature,
    water: waterQuality < MODEL.unsafeWater, power: powerFraction < MODEL.unsafePower };
}
export const isUnsafe = (hazards: HazardFlags): boolean => hazards.heat || hazards.water || hazards.power;

/** Reference wrapper preserves the untreated and normal scenarios. */
export function simulateReference(scenario: 'normal' | 'geothermal-failure', policy: PowerPolicy): readonly HourlySnapshot[] {
  return simulateTrajectory(scenario, policy, ZERO_ALLOCATION);
}

/** Diagnostic trajectory API allows zero/partial spending; planner validates exact budgets. */
export function simulateTrajectory(scenario: 'normal' | 'geothermal-failure', policy: PowerPolicy, allocation: ResourceAllocation): readonly HourlySnapshot[] {
  const effects = interventionEffects(allocation);
  if (scenario === 'normal' && (allocation.ventilationCredits + allocation.recyclerCredits + allocation.redistributionCredits !== 0)) throw new RangeError('Normal references cannot use interventions.');
  if (scenario !== 'normal' && scenario !== 'geothermal-failure') throw new RangeError('Unknown scenario.');
  if (policy !== 'directorate' && policy !== 'equity') throw new RangeError('Unknown power policy.');
  let levels = mapLevels<LevelSnapshot>(level => ({ levelId: level.id,
    deliveredPower: level.essentialPowerDemand, powerFraction: 1,
    temperatureCelsius: level.baseTemperatureCelsius, waterQuality: MODEL.initialWaterQuality,
    hazards: classifyHazards(level.baseTemperatureCelsius, MODEL.initialWaterQuality, 1) }));
  const snapshots: HourlySnapshot[] = [{ hour: 0, availablePower: MODEL.normalPower, levels, unsafePopulation: 0 }];
  const supply = scenario === 'normal' ? MODEL.normalPower : MODEL.failedPower;
  const weights = mapLevels((_level, i) => (1 - effects.redistributionMix) * BASELINE_WEIGHTS[policy][i]! + effects.redistributionMix * PROTECTIVE_WEIGHTS[i]!);
  const delivered = allocatePower(supply, weights);
  for (let hour = 1; hour <= MODEL.hours; hour++) {
    const previous = levels;
    levels = mapLevels((level, i) => {
      const powerFraction = clamp(delivered[i]! / level.essentialPowerDemand, 0, 1);
      const targetTemperature = level.baseTemperatureCelsius + MODEL.heatGain * (1 - clamp(powerFraction + effects.fanBonus, 0, 1)) * (1 + MODEL.depthIncrement * i);
      const temperatureCelsius = previous[i]!.temperatureCelsius + MODEL.temperatureResponse * (targetTemperature - previous[i]!.temperatureCelsius);
      const targetQuality = clamp(MODEL.initialWaterQuality - MODEL.waterPowerPenalty * (1 - powerFraction) - MODEL.waterHeatPenalty * Math.max(0, temperatureCelsius - MODEL.waterHeatThreshold) + (hour >= INTERVENTIONS.repairStartHour ? effects.repairBonus : 0), 0, 100);
      const waterQuality = clamp(previous[i]!.waterQuality + MODEL.waterResponse * (targetQuality - previous[i]!.waterQuality), 0, 100);
      return { levelId: level.id, deliveredPower: delivered[i]!, powerFraction, temperatureCelsius, waterQuality,
        hazards: classifyHazards(temperatureCelsius, waterQuality, powerFraction) };
    });
    const unsafePopulation = levels.reduce((sum, level, i) => sum + (isUnsafe(level.hazards) ? LEVELS[i]!.population : 0), 0);
    snapshots.push({ hour, availablePower: supply, levels, unsafePopulation });
  }
  return snapshots;
}
