/** The resume's short lists: where Jim studied and what he works with. */

export interface Schooling {
  school: string;
  program: string;
  year: string;
}

export const EDUCATION: readonly Schooling[] = [
  { school: 'Galvanize', program: 'Advanced Software Engineering Immersive', year: '2021' },
  { school: 'Murray State University', program: 'B.A. English & Journalism', year: '2007' },
];

export interface SkillGroup {
  area: string;
  skills: string;
}

export const SKILLS: readonly SkillGroup[] = [
  { area: 'Frontend', skills: 'React, TypeScript, Tailwind, Lit / Web Components, design systems, accessibility' },
  { area: 'Backend', skills: 'Node.js, Express, PostgreSQL, Redis, REST APIs, worker queues' },
  { area: 'Infra', skills: 'AWS, Cloudflare Workers, Docker, GitHub Actions, PostHog feature flags' },
  { area: 'AI tooling', skills: 'Claude Code skills and plugins, LLM integration, Ollama' },
  { area: 'Testing', skills: 'Playwright, Cypress, TDD, golden tests' },
];
