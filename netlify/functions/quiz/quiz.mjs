// Netlify Function entry point: POST /api/quiz
// Quiz sessions are kept server-side in Netlify Blobs (no setup required).

import { getStore } from '@netlify/blobs';
import { createHandler } from './core.mjs';

const logoCache = new Map();

async function loadLogo(origin, file) {
  if (logoCache.has(file)) return logoCache.get(file);
  try {
    const res = await fetch(`${origin}/${file}`, { signal: AbortSignal.timeout(5_000) });
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
  async loadLogos(origin) {
    const [mana, managem] = await Promise.all([loadLogo(origin, 'mana.png'), loadLogo(origin, 'managem.png')]);
    return { mana, managem };
  }
});

export const config = { path: '/api/quiz' };
