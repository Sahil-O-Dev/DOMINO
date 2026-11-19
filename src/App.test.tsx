import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('application foundation', () => {
  it('renders the dashboard with computed initial state', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('<main');
    expect(html).toContain('id="district"');
    expect(html).toContain('DOMINO');
    expect(html).toContain('Ranked response plans');
  });
});
