import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Jobs on the resume. `end: null` means the role is current. */
const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    company: z.string(),
    role: z.string(),
    start: z.string(),
    end: z.string().nullable(),
    order: z.number(),
    link: z.url().optional(),
    summary: z.string(),
  }),
});

/** Build logs. Each body follows: What I wanted, How I built it, What broke, How it turned out. */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      status: z.enum(['shipped', 'on-the-bench']),
      summary: z.string(),
      order: z.number(),
      cover: image().optional(),
      links: z.array(z.object({ label: z.string(), url: z.url() })).optional(),
    }),
});

/** What Jim is tinkering on right now (the front's "now" app reads this too). */
const now = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/now' }),
  schema: z.object({
    title: z.string(),
    blurb: z.string(),
    project: reference('projects'),
  }),
});

export const collections = { work, projects, now };
