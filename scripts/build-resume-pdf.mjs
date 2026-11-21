// Prints Jim's full resume (scripts/resume/full-resume.html) to
// public/jim-burch-resume.pdf, the resume page's Download PDF. Run it by hand
// (`pnpm resume:pdf`) after editing the resume and commit the PDF: the site
// build itself needs no browser, so any static host can build it.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const SOURCE = fileURLToPath(new URL('./resume/full-resume.html', import.meta.url));
const OUT = fileURLToPath(new URL('../public/jim-burch-resume.pdf', import.meta.url));

async function main() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(SOURCE).href, { waitUntil: 'load' });
    // Page size and margins come from the document's own @page rule.
    await page.pdf({ path: OUT, preferCSSPageSize: true, printBackground: true });
    console.log(`resume pdf: ${OUT}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
