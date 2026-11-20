// Fictional calibration. Each lambda yields 10% risk for its reference exposure:
// heat 8 degree-hours per hour, water 60 index points, ventilation 0.6 fraction.
// Only 60 respiratory exposures are observable within 72 hours after the lag.
const calibration = -Math.log(.9);
export const ILLUSTRATION = {
  seed: 2087, runs: 500, cut: [.25,.30,.38],
  fan: {sd:.08, min:.75, max:1.15}, repair: {sd:.15,min:.6,max:1.3},
  logWaterSigma:.2, demand:[.95,1.05], lag:12,
  lambda:{heat:calibration/(8*72), water:calibration/(60*72), respiratory:calibration/(.6*60)},
} as const;
