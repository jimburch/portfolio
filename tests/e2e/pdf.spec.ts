import { expect, test } from '@playwright/test';

test('resume PDF is served and linked', async ({ page, request }) => {
  const res = await request.get('/jim-burch-resume.pdf');
  expect(res.status()).toBe(200);
  expect((await res.body()).subarray(0, 4).toString()).toBe('%PDF');
  await page.goto('/resume');
  await expect(page.getByRole('link', { name: /Download PDF/ })).toHaveAttribute(
    'href',
    '/jim-burch-resume.pdf',
  );
});
