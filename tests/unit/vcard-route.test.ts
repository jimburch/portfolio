import { expect, test } from 'vitest';
import type { APIContext } from 'astro';
import { GET } from '../../src/pages/jim-burch.vcf';
import { CONTACT, buildVCard } from '../../src/data/contact';

// The preview server (and static hosts) pick Content-Type from the file
// extension, so the header the route itself declares is asserted here.
test('the vCard route returns the card as text/vcard', async () => {
  const res = await GET({} as APIContext);
  expect(res.headers.get('content-type')).toBe('text/vcard; charset=utf-8');
  expect(await res.text()).toBe(buildVCard(CONTACT));
});
