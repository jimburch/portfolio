/**
 * Public contact details for the back of the badge, the contact QR code and
 * the downloadable vCard. Public repo: email, LinkedIn and GitHub only, never a
 * phone number or street address.
 */
export const CONTACT = {
  name: 'Jim Burch',
  email: 'hello@jimburch.com',
  linkedin: 'https://www.linkedin.com/in/jimburch1/',
  github: 'https://github.com/jimburch',
  city: 'Mesa, AZ',
} as const;

export type Contact = typeof CONTACT;

/** A web address as people read it: no scheme, no `www.`, no trailing slash. */
function readableUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

/** The contact links every back page shows, in display order. */
export const CONTACT_LINKS = [
  { label: 'Email', href: `mailto:${CONTACT.email}`, text: CONTACT.email },
  { label: 'LinkedIn', href: CONTACT.linkedin, text: readableUrl(CONTACT.linkedin) },
  { label: 'GitHub', href: CONTACT.github, text: readableUrl(CONTACT.github) },
] as const;

/** Escapes a vCard 3.0 text value (RFC 2426 §5): backslash, comma, semicolon, newline. */
function escapeText(value: string): string {
  return value.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
}

/** Splits "Given Family" into the structured N property (family;given;;;). */
function structuredName(name: string): string {
  const cut = name.lastIndexOf(' ');
  const given = cut === -1 ? name : name.slice(0, cut);
  const family = cut === -1 ? '' : name.slice(cut + 1);
  return `${escapeText(family)};${escapeText(given)};;;`;
}

/**
 * A vCard 3.0 contact card with CRLF line endings, as phones expect. Contact
 * is email, LinkedIn and GitHub only: no address (not even the city shown on
 * the badge), no phone.
 */
export function buildVCard(c: Contact): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${structuredName(c.name)}`,
    `FN:${escapeText(c.name)}`,
    `EMAIL;TYPE=INTERNET:${c.email}`,
    `URL:${c.linkedin}`,
    `URL:${c.github}`,
    'END:VCARD',
  ];
  return lines.map((line) => `${line}\r\n`).join('');
}
