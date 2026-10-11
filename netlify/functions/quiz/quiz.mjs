// Netlify Function entry point: POST /api/quiz
// Quiz sessions are kept server-side in Netlify Blobs (no setup required).

import { getStore } from '@netlify/blobs';
import nodemailer from 'nodemailer';
import { createHandler } from './core.mjs';

// Optional e-mail report over SMTP. Enabled only when SMTP_HOST, SMTP_USER,
// SMTP_PASS and MAIL_TO are set in Netlify (Site configuration → Environment variables).
function createMailer() {
  const env = process.env;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.MAIL_TO) return undefined;
  const port = Number(env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 4_000,
    greetingTimeout: 4_000,
    socketTimeout: 6_000
  });
  const from = env.MAIL_FROM || { name: 'Induction Sécurité mLNG Tendrara', address: env.SMTP_USER };
  const to = env.MAIL_TO.split(/[;,]/).map((a) => a.trim()).filter(Boolean);
  return (message) => transport.sendMail({ from, to, ...message });
}

const logoCache = new Map();

async function loadLogo(origin, file) {
  if (logoCache.has(file)) return logoCache.get(file);
  try {
    const res = await fetch(`${origin}/${file}`, { signal: AbortSignal.timeout(2_500) });
    if (!res.ok || !(res.headers.get('content-type') || '').startsWith('image/png')) return '';
    const dataUri = `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
    logoCache.set(file, dataUri);
    return dataUri;
  } catch {
    return '';
  }
}

export default createHandler({
  openStore() {
    const store = getStore({ name: 'quiz-sessions', consistency: 'strong' });
    return {
      get: (key) => store.get(key, { type: 'json' }),
      set: (key, value) => store.setJSON(key, value)
    };
  },
  fetch: (...args) => fetch(...args),
  sendMail: createMailer(),
  async loadLogos(origin) {
    const [mana, managem] = await Promise.all([loadLogo(origin, 'mana.png'), loadLogo(origin, 'managem.png')]);
    return { mana, managem };
  }
});

export const config = { path: '/api/quiz' };
