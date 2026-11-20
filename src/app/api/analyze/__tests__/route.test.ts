import { afterEach, expect, it, vi } from 'vitest';
const user = vi.hoisted(()=>vi.fn());
vi.mock('../../../../lib/auth/session',()=>({currentUser:user}));
import { POST } from '../route';
const allocation={ventilationCredits:40,recyclerCredits:30,redistributionCredits:30};
const harm={totalUnsafePersonHours:100,deepUnsafeHoursPerCapita:1};
const request=()=>new Request('http://localhost/api/analyze',{method:'POST',body:JSON.stringify({
  policy:'equity',allocation,fairnessWeight:0,before:harm,after:harm,bestPlan:{allocation,harm}
})});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();user.mockReset();});
it('requires a session and reports missing configuration',async()=>{
  user.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(401);
  user.mockResolvedValue({name:'Tester'});
  vi.stubEnv('GEMINI_API_KEY','');
  expect((await POST(request())).status).toBe(503);
});
it('returns generated explanation text from the provider',async()=>{
  user.mockResolvedValue({name:'Tester'});vi.stubEnv('GEMINI_API_KEY','test-only');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({candidates:[{content:{parts:[{text:'Example explanation.'}]}}]})));
  expect(await (await POST(request())).json()).toEqual({explanation:'Example explanation.'});
});
it('passes follow-up questions and bounded history to Gemini before a plan is applied',async()=>{
  user.mockResolvedValue({name:'Tester'});vi.stubEnv('GEMINI_API_KEY','test-only');
  const provider=vi.fn().mockResolvedValue(Response.json({candidates:[{content:{parts:[{text:'Answer'}]}}]}));
  vi.stubGlobal('fetch',provider);
  const payload={...await request().json(),scenario:'normal',allocation:null,question:'Why?',history:[{question:'What is harm?',answer:'Unsafe resident-hours.'}]};
  const post=(data:unknown)=>POST(new Request('http://localhost/api/analyze',{method:'POST',body:JSON.stringify(data)}));
  expect((await post(payload)).status).toBe(200);
  expect(JSON.parse(provider.mock.calls[0]![1].body).contents.map((c:{parts:{text:string}[]})=>c.parts[0]!.text)).toEqual(['What is harm?','Unsafe resident-hours.','Why?']);
  expect((await post({...payload,question:'  '})).status).toBe(400);
});
