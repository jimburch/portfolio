import type { APIRoute } from 'astro';
import { CONTACT, buildVCard } from '../data/contact';

/** Jim's contact card, prerendered to a static file. */
export const GET: APIRoute = () =>
  new Response(buildVCard(CONTACT), {
    headers: { 'Content-Type': 'text/vcard; charset=utf-8' },
  });
