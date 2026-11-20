import { defineConfig } from 'astro/config';
import { customMedia } from './scripts/postcss-custom-media.mjs';
import { CUSTOM_MEDIA } from './src/scene/gate.ts';

export default defineConfig({
  output: 'static',
  site: 'https://jimburch.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  vite: {
    css: { postcss: { plugins: [customMedia(CUSTOM_MEDIA)] } },
  },
});
