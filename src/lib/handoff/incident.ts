import { validateAllocation } from '../simulation/interventions';
import { classifyHazards, simulateReference } from '../simulation/simulation';
import type { HazardFlags, ResourceAllocation } from '../simulation/types';

// Observation conventions for this exercise. The underlying simulation is unchanged.
export const briefingHour = 12;
export const channels = ['heat', 'water', 'power'] as const;
export type Channel = typeof channels[number];
export const names = {heat:'Heat',water:'Water quality',power:'Essential power'};
export type Decision = {belief:HazardFlags; allocation:ResourceAllocation};

export function validDecision(value:Decision) {
  try {
    if (!value || channels.some(k=>typeof value.belief?.[k]!=='boolean')) return false;
    validateAllocation(value.allocation,true);
    return true;
  } catch {return false;}
}

export function incident() {
  const run = simulateReference('geothermal-failure','directorate');
  const actual = run[briefingHour]!.levels[4];
  const previous = run[1]!.levels[4];
  const official = {
    heat: Math.round(previous.temperatureCelsius),
    water: Math.round(previous.waterQuality),
    power: Math.round(previous.powerFraction*100),
  };
  return {run, actual, official, feedFlags:classifyHazards(official.heat,official.water,official.power/100)};
}

export function report(channel:Channel, data:ReturnType<typeof incident>) {
  const level = data.actual;
  const value = {heat:level.temperatureCelsius.toFixed(1)+' °C',water:level.waterQuality.toFixed(1)+' / 100',power:(100*level.powerFraction).toFixed(1)+'%'}[channel];
  return 'Level 5, hour '+briefingHour+' · '+names[channel]+' reads '+value+'. '+(level.hazards[channel]?'Outside the modeled safe range.':'Within the modeled safe range.');
}
