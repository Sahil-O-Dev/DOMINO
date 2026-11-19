import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Dashboard } from '../Dashboard';

describe('dashboard', () => {
  it('renders the dashboard with computed initial state', () => {
    const html = renderToStaticMarkup(<Dashboard />);
    expect(html).toContain('<main');
    expect(html).toContain('id="district"');
    expect(html).toContain('DOMINO');
    expect(html).toContain('Ranked response plans');
  });
});
