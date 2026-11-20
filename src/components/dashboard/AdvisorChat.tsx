'use client';

import { useState } from 'react';
import type { HarmMetrics, PowerPolicy, ResourceAllocation } from '../../lib/simulation/types';

interface Context {
  scenario: string;
  policy: PowerPolicy;
  allocation: ResourceAllocation | null;
  before: HarmMetrics;
  after: HarmMetrics;
  fairnessWeight: number;
  bestPlan: {allocation: ResourceAllocation; harm: HarmMetrics};
}

interface Turn { question: string; answer: string }

export function AdvisorChat({ context }: { context: Context }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');

  async function send(question: string) {
    const message = question.trim();
    if (!message || pending) return;
    setPending(message);
    setDraft(message);
    setError('');
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({...context, question: message, history: turns.slice(-6)}),
      });
      const data = await response.json();
      if (!response.ok || typeof data.explanation !== 'string') throw new Error(data.error || 'The advisor could not answer.');
      setTurns(previous => [...previous, {question: message, answer: data.explanation}]);
      setDraft('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not reach the advisor.');
    } finally {
      setPending('');
    }
  }

  return <div className="advisor-chat">
    <div role="log" aria-label="Advisor conversation">{turns.map((turn,i)=><div key={i}>
      <p><strong>You</strong><br/>{turn.question}</p><p><strong>DOMINO AI</strong><br/>{turn.answer}</p>
    </div>)}</div>
    <form onSubmit={event=>{event.preventDefault();void send(draft);}}>
      <label htmlFor="advisor-question">Ask the advisor</label>
      <textarea id="advisor-question" rows={3} maxLength={2000} disabled={Boolean(pending)} value={draft}
        placeholder="What should I look at first?" onChange={event=>setDraft(event.target.value)}/>
      <div className="actions"><button className="primary" disabled={!draft.trim() || Boolean(pending)}>Send question</button>
      {context.allocation && <button type="button" disabled={Boolean(pending)} onClick={()=>void send('Explain my applied plan and suggest a next action.')}>Analyze my plan</button>}</div>
    </form>
    {pending && <p role="status">Waiting for Gemini…</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
