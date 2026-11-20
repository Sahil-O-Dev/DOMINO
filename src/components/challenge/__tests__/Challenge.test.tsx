import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Challenge } from '../Challenge';
import { simulateTrajectory } from '../../../lib/simulation/simulation';
import { calculateHarm } from '../../../lib/simulation/metrics';

it('uses the funding draft for both the editable city replay and the full-run exposure bars', () => {
  const html = renderToStaticMarkup(<Challenge/>);
  const draft = { ventilationCredits: 40, recyclerCredits: 30, redistributionCredits: 30 };
  const harm = calculateHarm(simulateTrajectory('geothermal-failure', 'equity', draft));
  expect(html).toContain('Draft response');
  const barValues = [...html.matchAll(/<meter aria-label="Level (\d+) unsafe resident-hours"[^>]+value="(\d+)"/g)];
  expect(barValues.map(([, id, value]) => [Number(id), Number(value)])).toEqual(
    harm.levels.map(level => [level.levelId, level.unsafePersonHours]),
  );
});
