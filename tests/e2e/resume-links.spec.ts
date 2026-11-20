import { expect, test } from '@playwright/test';
import { CONTACT } from '../../src/data/contact';

test('resume links sit at the top, visible without scrolling', async ({ page }) => {
  await page.goto('/resume');
  const viewport = page.viewportSize()!;
  const links = page.getByRole('list', { name: 'Resume links' });
  const pdf = links.getByRole('link', { name: 'Download PDF' });
  const linkedin = links.getByRole('link', { name: 'LinkedIn' });
  const github = links.getByRole('link', { name: 'GitHub' });

  await expect(pdf).toHaveAttribute('href', '/jim-burch-resume.pdf');
  await expect(linkedin).toHaveAttribute('href', CONTACT.linkedin);
  await expect(github).toHaveAttribute('href', CONTACT.github);

  for (const link of [pdf, linkedin, github]) {
    await expect(link).toBeInViewport({ ratio: 1 });
    const box = (await link.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  }
});

test('resume links are keyboard reachable', async ({ page }) => {
  await page.goto('/resume');
  const links = page.getByRole('list', { name: 'Resume links' }).getByRole('link');
  for (let i = 0; i < 3; i++) {
    await links.nth(i).focus();
    await expect(links.nth(i)).toBeFocused();
  }
});
