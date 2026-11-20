import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Challenge } from '../Challenge';
import { DistrictSection } from '../DistrictSection';
import { isUnsafe, simulateReference, simulateTrajectory } from '../../../lib/simulation/simulation';
import { calculateHarm } from '../../../lib/simulation/metrics';

function checkBars(html: string, series: ReturnType<typeof simulateReference>) {
  const bars = [...html.matchAll(/<meter aria-label="Level (\d+) unsafe resident-hours"[^>]+value="(\d+)"/g)];
  expect(bars.map(([, id, value]) => [Number(id), Number(value)])).toEqual(
    calculateHarm(series).levels.map(level => [level.levelId, level.unsafePersonHours]),
  );
}

it('opens on a zero-credit Directorate outage with the deepest floor hit first', () => {
  const html = renderToStaticMarkup(<Challenge/>);
  const outage = simulateReference('geothermal-failure', 'directorate');
  expect(html).toContain('Opening outage · 0 credits');
  expect(html).toContain('Trigger failure');
  checkBars(html, outage);
  expect(outage[0]!.unsafePopulation).toBe(0);
  expect(outage[1]!.levels.filter(l => isUnsafe(l.hazards)).map(l => l.levelId)).toEqual([5]);
});

it('shows the selected response trajectory when the operator previews a funded draft', () => {
  const allocation = { ventilationCredits: 40, recyclerCredits: 30, redistributionCredits: 30 };
  const funded = simulateTrajectory('geothermal-failure', 'equity', allocation);
  const html = renderToStaticMarkup(<DistrictSection policy="equity" target={null} represent={() => {}}
    funded={funded} untreated={simulateReference('geothermal-failure', 'equity')} allocation={allocation}/>);
  expect(html).toContain('Draft response');
  expect(html).toContain('Play response');
  checkBars(html, funded);
});
