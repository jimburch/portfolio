// Renders /resume from the built site to dist/jim-burch-resume.pdf.
// Runs after `astro build`: serves dist/ in-process, prints the page with the
// print stylesheet, then shuts everything down, even on failure.
import { fileURLToPath } from 'node:url';
import { preview } from 'astro';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('..', import.meta.url));
const PORT = 4399;
const OUT = fileURLToPath(new URL('../dist/jim-burch-resume.pdf', import.meta.url));

async function main() {
  const server = await preview({ root, server: { port: PORT } });
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(`http://localhost:${PORT}/resume`, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: OUT,
      format: 'Letter',
      printBackground: false,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    });
    console.log(`resume pdf: ${OUT}`);
  } finally {
    try {
      await browser?.close();
    } finally {
      await server.stop();
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
