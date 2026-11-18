import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://jimburch.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
