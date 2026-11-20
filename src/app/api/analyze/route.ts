import { currentUser } from '../../../lib/auth/session';
import { validateAllocation } from '../../../lib/simulation/interventions';
import type { ResourceAllocation, HarmMetrics } from '../../../lib/simulation/types';

function allocationFields(value:ResourceAllocation) {
  validateAllocation(value);
  return {ventilationCredits:value.ventilationCredits,recyclerCredits:value.recyclerCredits,redistributionCredits:value.redistributionCredits};
}
function harmFields(value:HarmMetrics) {
  const {totalUnsafePersonHours,deepUnsafeHoursPerCapita}=value;
  if(!Number.isFinite(totalUnsafePersonHours)||totalUnsafePersonHours<0||totalUnsafePersonHours>144000000 ||
     !Number.isFinite(deepUnsafeHoursPerCapita)||deepUnsafeHoursPerCapita<0||deepUnsafeHoursPerCapita>72) throw new Error('Invalid exposure');
  return {totalUnsafePersonHours,deepUnsafeHoursPerCapita};
}
export async function POST(request:Request) {
  if(!await currentUser())return Response.json({error:'Sign in to use the advisor.'},{status:401});
  const apiKey=process.env.GEMINI_API_KEY;
  if(!apiKey)return Response.json({error:'The server needs a Gemini API key to generate an explanation.'},{status:503});
  let summary;
  try {
    const {policy,allocation,fairnessWeight,before,after,bestPlan}=await request.json();
    if(!['directorate','equity'].includes(policy)||!Number.isFinite(fairnessWeight)||fairnessWeight<0||fairnessWeight>2)throw new Error('Invalid scenario');
    summary={policy,allocation:allocationFields(allocation),fairnessWeight,before:harmFields(before),after:harmFields(after),
      bestPlan:{allocation:allocationFields(bestPlan.allocation),harm:harmFields(bestPlan.harm)}};
  } catch {
    return Response.json({error:'Invalid simulation data.'},{status:400});
  }
  const prompt=`You are DOMINO's AI emergency response advisor.

DOMINO simulates a fictional underground city with five levels.
A geothermal failure affects electricity, temperature, and water.

The user has 100 credits to allocate between:
- Ventilation restoration
- Recycler repairs
- Power redistribution

Here are the actual simulation results:

${JSON.stringify(summary)}

Your tasks:

1. BEFORE VS AFTER
Compare unsafe person-hours before and after intervention.
Explain whether the selected plan improved conditions.

2. WHY THIS PLAN
Explain why the allocation may be effective.
Discuss benefits and trade-offs.

3. SUGGESTED NEXT ACTION
Recommend what the user should do next.
Use the bestPlan data when suggesting a better allocation.

IMPORTANT RULES:
- Only use the simulation data provided.
- Never invent numbers or improvements.
- If the plan performs worse, clearly explain that.
- Do not claim real lives were saved.
- This is a fictional simulation, not a real disaster forecast.
- Keep your entire response under 180 words.
- Use simple language suitable for a hackathon demo.
`;
  try {
    const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',{
      method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}]}),signal:AbortSignal.timeout(30000),cache:'no-store',
    });
    if(!response.ok)throw new Error('Provider unavailable');
    const result=await response.json();
    const parts=result.candidates?.[0]?.content?.parts ?? [];
    const explanation=parts.filter((p:{text?:string;thought?:boolean})=>!p.thought && typeof p.text==='string').map((p:{text:string})=>p.text).join('').trim();
    if(!explanation)throw new Error('Empty response');
    return Response.json({explanation});
  } catch {
    return Response.json({error:'Gemini could not generate an explanation. Check the server key and quota, then retry.'},{status:502});
  }
}
