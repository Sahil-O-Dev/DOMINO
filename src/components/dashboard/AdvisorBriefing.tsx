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

export function AdvisorBriefing({ context }: { context: Context }) {
  const [explanation, setExplanation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function analyze() {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...context,
          question: context.allocation
            ? 'Explain the impact of my applied plan compared with the untreated outage and suggest a next action.'
            : 'Explain the displayed scenario and suggest a next action.',
        }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.explanation !== 'string' || !data.explanation.trim()) {
        throw new Error(data.error || 'The advisor could not generate a briefing. Please retry.');
      }
      setExplanation(data.explanation);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not reach the advisor.');
    } finally {
      setPending(false);
    }
  }

  return <div>
    <button type="button" className="primary" disabled={pending} onClick={analyze}>
      {context.allocation ? 'Analyze my plan' : 'Explain this scenario'}
    </button>
    <div role="status" className="advisor-briefing">
      {pending ? <p>Preparing your briefing…</p> : explanation && <p>{explanation}</p>}
    </div>
    {error && <p role="alert">{error}</p>}
  </div>;
}
