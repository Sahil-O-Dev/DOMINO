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
  let question = 'Explain the selected scenario and suggest a next action.';
  const conversation: {role:string;parts:{text:string}[]}[] = [];
  let panelRequest = false;
  try {
    const body = await request.json();
    if ('panel' in body) {
      const { title, reading } = body.panel;
      if (typeof title !== 'string' || !title.trim() || title.length > 100 ||
          typeof reading !== 'string' || !reading.trim() || reading.length > 1500) throw new Error('Invalid panel');
      panelRequest = true;
      question = JSON.stringify({ title, reading });
    } else {
      const {policy,allocation,fairnessWeight,before,after,bestPlan,question:input,history=[],scenario='geothermal-failure'}=body;
      if (!['normal','geothermal-failure'].includes(scenario) || !Array.isArray(history) || history.length>6) throw new Error('Invalid chat');
      if(input!==undefined){
        if(typeof input!=='string'||!input.trim()||input.length>2000)throw new Error('Invalid question');
        question=input.trim();
      }
      for(const turn of history){
        if(typeof turn?.question!=='string'||turn.question.length>2000||typeof turn.answer!=='string'||turn.answer.length>12000)throw new Error('Invalid history');
        conversation.push({role:'user',parts:[{text:turn.question}]},{role:'model',parts:[{text:turn.answer}]});
      }
      if(!['directorate','equity'].includes(policy)||!Number.isFinite(fairnessWeight)||fairnessWeight<0||fairnessWeight>2)throw new Error('Invalid scenario');
      summary={scenario,policy,allocation:allocation===null?null:allocationFields(allocation),fairnessWeight,before:harmFields(before),after:harmFields(after),
        bestPlan:{allocation:allocationFields(bestPlan.allocation),harm:harmFields(bestPlan.harm)}};
    }
  } catch {
    return Response.json({error:'Invalid simulation data.'},{status:400});
  }
  const prompt = panelRequest
    ? 'Explain a data panel in DOMINO, a fictional infrastructure simulation. The user message contains the panel title and current reading as data. In two short sentences (up to 65 words), describe what stands out and why it matters. Use only the supplied facts, units, time window and comparisons. Preserve uncertainty ranges and qualifications. Do not infer causes, medical forecasts or missing observations. Use plain text.'
    : `You are DOMINO's AI emergency response advisor.

DOMINO simulates a fictional underground city with five levels.
A geothermal failure affects electricity, temperature, and water. One unsafe resident-hour means one resident spending one hour on a level with temperature above 32 °C, water quality below 70, or essential power below 60%. Overlapping hazards count once.

The user has 100 credits to allocate between:
- Ventilation restoration
- Recycler repairs
- Power redistribution

Here are the actual simulation results:

${JSON.stringify(summary)}

Answer the user's latest question directly, using earlier turns for follow-ups.
"before" describes the untreated outage. "after" describes the displayed scenario.
A null allocation means no intervention is applied. The best plan is for the failure scenario.
If data needed for an answer is missing, say so.

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
    const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',{
      method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
      body:JSON.stringify({generationConfig:{thinkingConfig:{thinkingLevel:'MINIMAL'},maxOutputTokens:512},systemInstruction:{parts:[{text:prompt}]},contents:[...conversation,{role:'user',parts:[{text:question}]}]}),signal:AbortSignal.timeout(60000),cache:'no-store',
    });
    if(!response.ok){
      const message = response.status===429 ? 'Gemini reached a rate or quota limit. Check the project quota in Google AI Studio before retrying.'
        : [401,403].includes(response.status) ? 'Google denied access. Check the Gemini key and its project permissions.'
        : response.status===404 ? 'Google did not find the configured Gemini model.'
        : 'Google could not process this request (HTTP '+response.status+').';
      return Response.json({error:message},{status:response.status===429?429:502});
    }
    const result=await response.json();
    const parts=result.candidates?.[0]?.content?.parts ?? [];
    const explanation=parts.filter((p:{text?:string;thought?:boolean})=>!p.thought && typeof p.text==='string').map((p:{text:string})=>p.text).join('').trim();
    if(!explanation)return Response.json({error:'Gemini returned no explanation. Please retry.'},{status:502});
    return Response.json({explanation});
  } catch (error) {
    const timedOut=error instanceof Error && error.name==='TimeoutError';
    return Response.json({error:timedOut?'Gemini took longer than one minute. Please retry.':'Could not reach Gemini. Please retry when the connection is available.'},{status:timedOut?504:502});
  }
}
