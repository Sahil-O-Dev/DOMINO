import { expect, it } from 'vitest';
import { budgetReading, floorReading } from '../readings';
import { simulateReference } from '../simulation';

it('explains the selected floor and hour using the modeled hazard flags', () => {
  const snapshots = simulateReference('geothermal-failure', 'directorate');
  expect(floorReading(snapshots[0]!.levels[4], 0)).toContain('All three readings meet');
  const reading = floorReading(snapshots[1]!.levels[4], 1);
  expect(reading).toContain('hour 1, level 5');
  expect(reading).toContain('power below 60%');
});

it('explains incomplete and over-budget drafts without treating them as applied plans', () => {
  const draft = { ventilationCredits: 40, recyclerCredits: 20, redistributionCredits: 30 };
  expect(budgetReading(draft)).toContain('Assign 10 more');
  expect(budgetReading({...draft, redistributionCredits: 50})).toContain('Remove 10');
});
