/** Domain contracts only. Runtime validation and equations belong to later stages. */
export type LevelId = 1 | 2 | 3 | 4 | 5;

/** Entries are always ordered top to bottom: levels 1, 2, 3, 4, 5. */
export type FiveLevels<T> = readonly [T, T, T, T, T];

export type PowerPolicy = 'directorate' | 'equity';

export interface ResourceAllocation {
  readonly ventilationCredits: number;
  readonly recyclerCredits: number;
  readonly redistributionCredits: number;
}

/** Normal references have no intervention allocation; disaster references may spend zero. */
export type SimulationInput =
  | { readonly scenario: 'normal'; readonly policy: PowerPolicy }
  | {
      readonly scenario: 'geothermal-failure';
      readonly policy: PowerPolicy;
      readonly allocation: ResourceAllocation;
    };

export interface LevelDefinition {
  readonly id: LevelId;
  readonly population: number;
  readonly essentialPowerDemand: number;
  readonly baseTemperatureCelsius: number;
}

/** Flags can overlap; a future hazard union must count a resident only once per hour. */
export interface HazardFlags {
  readonly heat: boolean;
  readonly water: boolean;
  readonly power: boolean;
}

export interface LevelSnapshot {
  readonly levelId: LevelId;
  readonly deliveredPower: number;
  readonly powerFraction: number;
  readonly temperatureCelsius: number;
  readonly waterQuality: number;
  readonly hazards: HazardFlags;
}

export interface HourlySnapshot {
  /** 0 is pre-failure; 1–72 are evaluated hours. */
  readonly hour: number;
  readonly availablePower: number;
  readonly levels: FiveLevels<LevelSnapshot>;
  /** Current exposure only, never cumulative person-hours. */
  readonly unsafePopulation: number;
}

export interface LevelHarm {
  readonly levelId: LevelId;
  readonly unsafeHours: number;
  readonly unsafePersonHours: number;
}

export interface HarmMetrics {
  readonly levels: FiveLevels<LevelHarm>;
  readonly totalUnsafePersonHours: number;
  /** Unsafe hours per deep-level resident, not a person-hour count. */
  readonly deepUnsafeHoursPerCapita: number;
}

export interface SimulationResult {
  readonly input: SimulationInput;
  /** Includes hour 0; runtime checks will enforce 73 sequential snapshots. */
  readonly snapshots: readonly HourlySnapshot[];
  readonly harm: HarmMetrics;
}

/** Planner results use exact-budget allocations; references are excluded at runtime. */
export interface PlanOutcome {
  readonly policy: PowerPolicy;
  readonly allocation: ResourceAllocation;
  readonly simulation: SimulationResult;
}

/** Derived ranking data stays separate from lambda-independent simulation outcomes. */
export interface RankedPlan {
  readonly outcome: PlanOutcome;
  readonly fairnessWeight: number;
  readonly score: number;
}
