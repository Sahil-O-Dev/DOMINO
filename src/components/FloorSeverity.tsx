import { displayMagnitude } from '../lib/simulation/readings';
import { consecutiveHazardHours, floorSeverity } from '../lib/simulation/severity';
import { MODEL } from '../lib/simulation/simulation';
import type { HourlySnapshot, LevelId, LevelSnapshot } from '../lib/simulation/types';

export function severityLabel(level: LevelSnapshot) {
  const { index } = floorSeverity(level);
  return index === 0 ? 'Safe' : 'Unsafe · severity ' + displayMagnitude(index);
}

export function FloorSeverity({ series, hour, floor }: {
  series: readonly HourlySnapshot[]; hour: number; floor: LevelId;
}) {
  const severity = floorSeverity(series[hour]!.levels[floor - 1]!);
  const causes = [
    { key: 'heat', excess: severity.heat, description: '°C above the heat limit' },
    { key: 'water', excess: severity.water, description: 'points below the water limit' },
    { key: 'power', excess: 100 * severity.power, description: 'percentage points below minimum power' },
  ] as const;

  return <div className="floor-severity">
    <p><strong>Severity {displayMagnitude(severity.index)}</strong> · Hour {hour}</p>
    {severity.index > 0 ? <ul>{causes.filter(cause => cause.excess > 0).map(cause => {
      const hours = consecutiveHazardHours(series, hour, floor, cause.key);
      return <li key={cause.key}>{displayMagnitude(cause.excess)} {cause.description} now · outside the limit for {hours} {hours === 1 ? 'hour' : 'consecutive hours'}</li>;
    })}</ul> : <p>All three readings meet the modeled limits.</p>}
    <details><summary>How severity is calculated</summary>
      <p>Zero means all readings are within limits. Each {MODEL.heatGain} °C of excess heat, {MODEL.waterPowerPenalty} points of water shortfall, or {MODEL.unsafePower * 100} percentage points of power shortfall adds one unit. Smaller shortfalls add proportionally.</p>
      <p>This illustrative index measures conditions during one hour. It can exceed one. The optimizer counts residents and hours of exposure.</p>
    </details>
  </div>;
}
