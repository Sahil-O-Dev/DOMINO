import type { MouseEvent } from 'react';
import { MODEL } from '../../lib/simulation/simulation';

export function stripHour(event: MouseEvent<HTMLButtonElement>, currentHour: number) {
  if (!event.detail) return Math.max(1, currentHour);
  if (event.target instanceof HTMLElement && event.target.dataset.hour) {
    return Number(event.target.dataset.hour);
  }
  const strip = event.currentTarget;
  const offset = event.clientX - strip.getBoundingClientRect().left - strip.clientLeft;
  return Math.max(1, Math.min(MODEL.hours, 1 + Math.floor(MODEL.hours * offset / strip.clientWidth)));
}
