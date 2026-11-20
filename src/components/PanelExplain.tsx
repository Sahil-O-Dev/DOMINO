'use client';

import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { MessageCircleQuestion } from 'lucide-react';

const AdvisorAvailable = createContext(false);

export function AdvisorProvider({ available, children }: { available: boolean; children: React.ReactNode }) {
  return <AdvisorAvailable.Provider value={available}>{children}</AdvisorAvailable.Provider>;
}

interface Props {
  title: string;
  reading: string;
  onOpen?: () => void;
}

export function PanelExplain(props: Props) {
  // A new reading gets its own disclosure and request, including while a replay is moving.
  return <Explanation key={JSON.stringify([props.title, props.reading])} {...props}/>;
}

function Explanation({ title, reading, onOpen }: Props) {
  const useAdvisor = useContext(AdvisorAvailable);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);

  async function generate() {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panel: { title, reading } }), signal: controller.signal,
      });
      if (!response.ok) throw new Error('Advisor unavailable');
      const { explanation } = await response.json();
      if (typeof explanation !== 'string' || !explanation.trim()) throw new Error('Empty explanation');
      setAnswer(explanation);
    } catch {
      if (!controller.signal.aborted) setFailed(true);
    } finally {
      pending.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function toggle() {
    setOpen(!open);
    if (!open) {
      onOpen?.();
      if (useAdvisor && !answer && !failed) void generate();
    }
  }

  return <div className="panel-explain">
    <button type="button" className="explain-trigger" aria-label={(open ? 'Hide explanation for ' : 'Explain ') + title}
      aria-expanded={open} aria-controls={id} onClick={toggle}>
      <MessageCircleQuestion aria-hidden="true" size={14}/>{open ? 'Hide explanation' : 'Explain'}
    </button>
    <div id={id} hidden={!open} className="explain-reading" role="status">
      {open && <>
        <small>{answer ? 'AI Advisor' : 'Simulation reading'}</small>
        <p>{answer || reading}</p>
        {loading && <small>Preparing AI explanation…</small>}
        {failed && <small>AI explanation unavailable. <button type="button" onClick={generate}>Retry</button></small>}
      </>}
    </div>
  </div>;
}
