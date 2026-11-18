import { expect, test } from 'vitest';
import { CONTACT, CONTACT_LINKS, buildVCard } from '../../src/data/contact';

test('vCard has required fields and CRLF endings', () => {
  const v = buildVCard(CONTACT);
  expect(v.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true);
  expect(v).toContain('FN:Jim Burch\r\n');
  expect(v).toContain(`URL:${CONTACT.linkedin}\r\n`);
  expect(v.endsWith('END:VCARD\r\n')).toBe(true);
});

test('vCard carries email, LinkedIn and GitHub only: no address or phone', () => {
  const v = buildVCard(CONTACT);
  expect(v).toContain(`EMAIL;TYPE=INTERNET:${CONTACT.email}\r\n`);
  expect(v).toContain(`URL:${CONTACT.github}\r\n`);
  expect(v).not.toMatch(/^(ADR|TEL|LABEL|GEO)[:;]/m);
  expect(v).not.toContain('Mesa');
});

test('contact links cover email, LinkedIn and GitHub with readable text', () => {
  expect(CONTACT_LINKS).toEqual([
    { label: 'Email', href: `mailto:${CONTACT.email}`, text: CONTACT.email },
    { label: 'LinkedIn', href: CONTACT.linkedin, text: 'linkedin.com/in/jimburch1' },
    { label: 'GitHub', href: CONTACT.github, text: 'github.com/jimburch' },
  ]);
});
