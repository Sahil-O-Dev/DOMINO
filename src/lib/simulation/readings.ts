import { LEVELS, MODEL } from './simulation';
import type { LevelSnapshot, ResourceAllocation } from './types';

export const displayNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format;

export function floorReading(level: LevelSnapshot, hour: number) {
  const reasons = [
    level.hazards.power && 'power below ' + displayNumber(MODEL.unsafePower * 100) + '%',
    level.hazards.heat && 'heat above ' + MODEL.unsafeTemperature + ' °C',
    level.hazards.water && 'water quality below ' + MODEL.unsafeWater,
  ].filter(Boolean);
  const status = reasons.length ? 'Its residents count as exposed because of ' + reasons.join(' and ') : 'All three readings meet the modeled safety thresholds';
  return `At hour ${hour}, level ${level.levelId} has ${displayNumber(level.powerFraction * 100)}% of essential power, a temperature of ${displayNumber(level.temperatureCelsius)} °C and water quality of ${displayNumber(level.waterQuality)}/100. ${status}.`;
}

export function budgetReading(draft: ResourceAllocation) {
  const { ventilationCredits: v, recyclerCredits: r, redistributionCredits: x } = draft;
  const remaining = 100 - v - r - x;
  const action = remaining === 0 ? 'The full budget is assigned.' :
    remaining > 0 ? `Assign ${remaining} more credits before applying it.` : `Remove ${-remaining} credits before applying it.`;
  return `The draft puts ${v} credits into cooling, ${r} into water repairs starting at hour 25, and ${x} into shifting power toward deeper levels. ${action}`;
}

export function exposureReading(personHours: number) {
  return `Over ${MODEL.hours} hours the district accumulates ${displayNumber(personHours)} unsafe resident-hours. A resident contributes one for each hour their floor is unsafe, even if several hazards overlap.`;
}

export function deepReading(hours: number) {
  const population = LEVELS.filter(l => l.id >= 4).reduce((sum, l) => sum + l.population, 0);
  return `Across the ${displayNumber(population)} residents of levels 4 and 5, modeled exposure averages ${displayNumber(hours)} hours per person over the full run. This average gives more weight to the more populous floor.`;
}
