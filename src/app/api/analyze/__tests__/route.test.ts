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
it('distinguishes provider quota errors from timeouts',async()=>{
  user.mockResolvedValue({name:'Tester'});
  vi.stubEnv('GEMINI_API_KEY','test-only');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(null,{status:429})));
  expect((await POST(request())).status).toBe(429);
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new DOMException('Timed out','TimeoutError')));
  expect((await POST(request())).status).toBe(504);
});

it('grounds a panel explanation in only the selected reading and rejects empty readings', async () => {
  user.mockResolvedValue({ name: 'Tester' });
  vi.stubEnv('GEMINI_API_KEY', 'test-only');
  const provider = vi.fn().mockResolvedValue(Response.json({candidates:[{content:{parts:[{text:'Brief reading.'}]}}]}));
  vi.stubGlobal('fetch', provider);
  const panel = { title: 'Available power', reading: 'At hour 1, 84 of 120 power units are available.' };
  const post = (reading: string) => POST(new Request('http://localhost/api/analyze', {
    method: 'POST', body: JSON.stringify({panel: {...panel, reading}, history:[{question:'Unrelated',answer:'Earlier answer'}]}),
  }));
  expect((await post(' ')).status).toBe(400);
  expect(provider).not.toHaveBeenCalled();
  expect(await (await post(panel.reading)).json()).toEqual({explanation:'Brief reading.'});
  const {contents} = JSON.parse(provider.mock.calls[0]![1].body);
  expect(contents).toEqual([{role:'user',parts:[{text:JSON.stringify(panel)}]}]);
});
