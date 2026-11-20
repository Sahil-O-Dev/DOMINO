import { useState } from 'react';
import type { LevelId, RankedPlan } from '../../lib/simulation/types';
import { safeHoursGini } from '../../lib/simulation/equity';
import { allocationText } from './PlanSpace';

export function ResultCard({plan,target}:{plan:RankedPlan;target:LevelId}) {
  const [error,setError]=useState('');
  function download() {
    const c=document.createElement('canvas'); c.width=960; c.height=500;
    const ctx=c.getContext('2d'); if(!ctx){setError('Image export is unavailable in this browser.');return;}
    const harm=plan.outcome.simulation.harm;
    ctx.fillStyle='#17241e';ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle='#ece6d8';ctx.font='42px Georgia';ctx.fillText('The Hollow · District response',40,75);
    ctx.font='24px system-ui';
    const lines=[
      'Represented level '+target+' · '+plan.outcome.policy+' policy',
      'Ventilation / repairs / redistribution: '+allocationText(plan.outcome),
      'District exposure: '+harm.totalUnsafePersonHours.toLocaleString('en-US')+' unsafe resident-hours',
      'Level '+target+': '+harm.levels[target-1]!.unsafeHours+' unsafe hours',
      'Population-weighted safe-hours Gini: '+(safeHoursGini(harm)?.toFixed(3) ?? 'undefined'),
      'DOMINO · Fictional 72-hour simulation',
    ];
    lines.forEach((line,i)=>ctx.fillText(line,40,145+54*i));
    const a=document.createElement('a');a.download='domino-response.png';a.href=c.toDataURL('image/png');a.click();
  }
  return <><button onClick={download}>Download result card</button>{error && <span role="status">{error}</span>}</>;
}
