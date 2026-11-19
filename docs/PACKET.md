# The Hollow challenge packet

## Fictional scenario

In 2087, Earth's surface is uninhabitable and two billion people live underground in the Hollow. Aging geothermal plants power ventilation, cooling, water recyclers, and medical infrastructure. Power losses weaken cooling and recycling, increasing heat and degrading water quality. The Directorate favors wealthy upper levels; crowded lower levels bear disproportionate harm.

DOMINO's tagline is **Simulate the Collapse. Prevent the Catastrophe.** The Patriot HackFest Fall 2026 demonstration should make infrastructure interdependence and unequal protection visible, then show how emergency decisions change outcomes.

## Problems addressed

- Make a power-to-temperature-to-water cascade understandable over time.
- Compare favoritism and demand-proportional electricity allocation under the same shortage.
- Allocate scarce emergency resources among three competing interventions.
- Quantify unsafe person-hours without counting one resident multiple times in an hour.
- Expose how a stated fairness objective affects rankings, including when it does not change the winner.

## Prototype assumptions, distinct from fiction

The prototype represents one five-level district with 2,000,000 residents, not the entire Hollow. Its 72-hour deterministic model uses synthetic power units, a synthetic water-quality index, fictional safety thresholds, and specified response equations. It has no calibrated epidemiology, mortality, medical demand, migration, or real engineering forecast. Medical facilities belong to the world story but are not a sixth simulated system.

The emergency budget is 100 abstract credits; it does not represent money or a measured deployment workforce. Every resident of an unsafe level is counted as exposed for that hour. Electricity allocation is immediate and constant after the failure for a fixed plan. The model omits recovery of the geothermal plant and feedback from water failure to power.

These simplifications serve a small, testable hackathon demonstration. Computed harm means modeled exposure, not deaths, injuries, or predicted real-world casualties. The supplied narrative is the challenge context; no separate official challenge packet was provided or independently verified.
