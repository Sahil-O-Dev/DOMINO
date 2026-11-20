import Link from 'next/link';
import { ArrowRight, ArrowDown, Clock3, Layers3, Users, Zap } from 'lucide-react';
import { LEVELS, MODEL } from '../../lib/simulation/simulation';
import { currentUser } from '../../lib/auth/session';

export default async function Home() {
  const population = LEVELS.reduce((total, level) => total + level.population, 0);
  const user = await currentUser();
  return <main id="main-content" className="shell landing">
    <section className="cover" aria-labelledby="cover-title">
      <div className="cover-copy">
        <p className="eyebrow accent">DOMINO / Infrastructure simulator</p>
        <h1 id="cover-title">The Hollow<span>.</span></h1>
        <p>A fictional district built below ground. When geothermal power fails, how will you keep its residents safe?</p>
        <div className="actions"><Link className="primary" href="/challenge">Play the challenge <ArrowRight size={17}/></Link><Link className="text-link" href={user ? '/domino' : '/auth/login'}>Open simulator <ArrowRight size={17}/></Link><a href="#scenario" className="text-link">Scenario brief <ArrowDown size={15}/></a></div>
      </div>
    </section>
    <div className="spec-strip" aria-label="Scenario parameters">
      <div><Layers3/><span>District levels<strong>{LEVELS.length}</strong></span></div>
      <div><Users/><span>Residents<strong>{population.toLocaleString('en-US')}</strong></span></div>
      <div><Clock3/><span>Time horizon<strong>{MODEL.hours} hours</strong></span></div>
      <div><Zap/><span>Supply after failure<strong>{MODEL.failedPower} / {MODEL.normalPower} units</strong></span></div>
    </div>
    <section className="brief" id="scenario"><h2>Scenario brief</h2><p>Trigger a geothermal failure and inspect power, heat and water quality across the district. Allocate 100 emergency credits, then compare how two power policies distribute exposure over {MODEL.hours} hours.</p></section>
    <section className="visual-panel"><h2>Model assumptions</h2>
      <p>Residents stay on their starting level and share its conditions. Demand and population stay fixed. Hour 0 starts at full supply. The geothermal outage begins at hour 1 and lasts through hour {MODEL.hours}.</p>
      <p>Both policies distribute the same finite supply. Ventilation changes cooling efficiency, recycler repairs affect water from hour 25, and redistribution changes the priority weights. Each hour’s temperature feeds that hour’s water update.</p>
      <p>A resident counts once per unsafe hour if temperature exceeds {MODEL.unsafeTemperature} °C, water falls below {MODEL.unsafeWater}, or essential power falls below {MODEL.unsafePower*100}%. Exposure is measured in resident-hours. The thresholds and water index are fictional. The baseline uses fixed inputs. The optional illustrative layer samples 500 alternative runs and reports synthetic health ranges. Its assumptions and coefficients are listed beside the results.</p>
      <p>The hourly severity index adds the size of each threshold crossing relative to its reference scale ({MODEL.heatGain} °C for heat, {MODEL.waterPowerPenalty} points for water, and {MODEL.unsafePower * 100} percentage points for power). Longer exposure appears separately as consecutive hours.</p>
    </section>
  </main>;
}
