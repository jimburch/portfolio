/** Identity printed on the front of the badge. */
export const SITE = {
  name: 'Jim Burch',
  roleLine: 'BUILDER · TINKERER' /* TODO(jim): final role line wording */,
} as const;

/** Pages on the back of the badge, in menu order. */
export const BACK_ROUTES = [
  { id: 'projects', title: 'PROJECTS', route: '/projects' },
  { id: 'resume', title: 'RESUME', route: '/resume' },
  { id: 'about', title: 'ABOUT', route: '/about' },
  { id: 'contact', title: 'CONTACT', route: '/contact' },
] as const;

export type BackRoute = (typeof BACK_ROUTES)[number];
