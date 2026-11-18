import { BACK_ROUTES } from '../../data/site';
import type { AppEntry } from './types';

const flip = (id: (typeof BACK_ROUTES)[number]['id']): AppEntry => {
  const r = BACK_ROUTES.find((b) => b.id === id)!;
  return { id: r.id, title: r.title, kind: 'flip', route: r.route };
};

/** Launcher order. Indices are relied on by e2e tests. Screen entries gain `load` as their apps land. */
export const APPS: AppEntry[] = [
  { id: 'now', title: 'NOW TINKERING', kind: 'screen', load: () => import('../apps/now') },
  flip('projects'),
  flip('resume'),
  flip('about'),
  flip('contact'),
  { id: 'reskin', title: 'RESKIN', kind: 'screen', load: () => import('../apps/reskin') },
  { id: 'break', title: 'BREAK IT', kind: 'screen' },
  { id: 'sensors', title: 'SENSORS', kind: 'screen', hidden: true, load: () => import('../apps/sensors') },
];
