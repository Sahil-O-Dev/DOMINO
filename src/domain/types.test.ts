import { expectTypeOf, it } from 'vitest';
import type { FiveLevels, LevelId, PowerPolicy, SimulationInput } from './types';

it('keeps five-level and scenario contracts explicit for both developers', () => {
  expectTypeOf<FiveLevels<number>['length']>().toEqualTypeOf<5>();
  expectTypeOf<LevelId>().toEqualTypeOf<1 | 2 | 3 | 4 | 5>();
  expectTypeOf<PowerPolicy>().toEqualTypeOf<'directorate' | 'equity'>();
  expectTypeOf<Extract<SimulationInput, { scenario: 'normal' }>>()
    .not.toHaveProperty('allocation');
  expectTypeOf<Extract<SimulationInput, { scenario: 'geothermal-failure' }>>()
    .toHaveProperty('allocation');
});
