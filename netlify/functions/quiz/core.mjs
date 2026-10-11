// Quiz engine. Everything that decides a result lives here, on the server:
// the answer key, the per-question and total time limits, and the score.
// The browser only receives question texts and shuffled options.

import { randomInt, randomUUID } from 'node:crypto';
import { QUESTIONS } from './questions.mjs';
import { buildReport } from './report.mjs';

export const RULES = Object.freeze({
  total: QUESTIONS.length,
  passMark: 7,
  perQuestionMs: 30_000,
  totalMs: 300_000,
  // Tolerance for network latency before the server considers a limit exceeded.
  graceMs: 3_000
});

const MAX_BODY_BYTES = 2_048;
const MAX_FIELD_LENGTH = 100;
const LANGS = new Set(['fr', 'en']);
const SID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
// Control characters, zero-width characters and bidi overrides (spoofing).
const UNSAFE_CHARS_RE = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;

class HttpError extends Error {
  constructor(status, code, details) {
    super(code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ---------- helpers ----------

export function cleanText(value, max = MAX_FIELD_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFC').replace(UNSAFE_CHARS_RE, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

// Prevents spreadsheet formula injection when the Netlify Forms export is opened in Excel.
function csvSafe(value) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function shuffled(length) {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatDuration(ms) {
  const sec = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function formatDate(ms, lang) {
  return new Date(ms).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR', {
    timeZone: 'Africa/Casablanca',
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

function totalElapsed(s, now) {
  return now - s.startedAt;
}

function totalExpired(s, now) {
  return totalElapsed(s, now) > RULES.totalMs + RULES.graceMs;
}

function questionExpired(s, now) {
  return now - s.questionStartedAt > RULES.perQuestionMs + RULES.graceMs;
}

function expireRemaining(s, now) {
  for (const item of s.items) {
    if (!item.status) {
      item.status = 'timeout';
      item.choice = null;
      item.answeredAt = now;
    }
  }
}

function timing(s, now) {
  return {
    questionRemainingMs: Math.max(0, RULES.perQuestionMs - (now - s.questionStartedAt)),
    totalRemainingMs: Math.max(0, RULES.totalMs - totalElapsed(s, now))
  };
}

function publicQuestion(s, now) {
  const item = s.items[s.index];
  const q = QUESTIONS[item.qi];
  const view = (lang) => ({ text: q[lang].text, options: item.perm.map((i) => q[lang].options[i]) });
  return { index: s.index, total: RULES.total, fr: view('fr'), en: view('en'), ...timing(s, now) };
}

function feedback(s, index, now) {
  const item = s.items[index];
  const q = QUESTIONS[item.qi];
  return {
    index,
    status: item.status,
    choice: item.choice,
    correctChoice: item.perm.indexOf(q.answer),
    explanation: { fr: q.fr.explanation, en: q.en.explanation },
    isLast: index === RULES.total - 1,
    totalRemainingMs: timing(s, now).totalRemainingMs
  };
}

function buildReview(s) {
  return s.items.map((item, n) => {
    const q = QUESTIONS[item.qi];
    const view = (lang) => ({
      question: q[lang].text,
      chosen: item.choice === null ? null : q[lang].options[item.perm[item.choice]],
      correct: q[lang].options[q.answer],
      explanation: q[lang].explanation
    });
    return { n: n + 1, status: item.status, fr: view('fr'), en: view('en') };
  });
}

function computeResult(s, now) {
  const score = s.items.filter((i) => i.status === 'correct').length;
  return {
    score,
    total: RULES.total,
    percentage: Math.round((score / RULES.total) * 100),
    passed: score >= RULES.passMark,
    passMark: RULES.passMark,
    durationMs: Math.min(now - s.startedAt, RULES.totalMs + RULES.graceMs),
    finishedAt: now
  };
}

// ---------- actions ----------

async function loadSession(store, sid) {
  if (typeof sid !== 'string' || !SID_RE.test(sid)) throw new HttpError(400, 'invalid_session');
  const s = await store.get(sid);
  if (!s) throw new HttpError(404, 'session_not_found');
  return s;
}

async function actionStart(store, body, now) {
  const visitor = {
    name: cleanText(body.name),
    position: cleanText(body.position),
    org: cleanText(body.org)
  };
  const missing = Object.entries(visitor).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new HttpError(400, 'invalid_visitor', { missing });

  const order = shuffled(QUESTIONS.length);
  const s = {
    v: 1,
    sid: randomUUID(),
    lang: LANGS.has(body.lang) ? body.lang : 'fr',
    visitor,
    startedAt: now,
    questionStartedAt: now,
    index: 0,
    items: order.map((qi) => ({
      qi,
      perm: shuffled(QUESTIONS[qi].fr.options.length),
      choice: null,
      status: null,
      answeredAt: null
    })),
    finished: false,
    result: null,
    reportSent: false
  };
  await store.set(s.sid, s);
  return {
    sid: s.sid,
    rules: {
      total: RULES.total,
      passMark: RULES.passMark,
      perQuestionSec: RULES.perQuestionMs / 1000,
      totalSec: RULES.totalMs / 1000
    },
    question: publicQuestion(s, now)
  };
}

async function actionAnswer(store, body, now) {
  const s = await loadSession(store, body.sid);
  if (s.finished) throw new HttpError(409, 'already_finished');

  const { index, choice } = body;
  if (!Number.isInteger(index) || index < 0 || index >= RULES.total) throw new HttpError(400, 'invalid_index');
  // Idempotent retry: an already-recorded answer is returned unchanged, never overwritten.
  if (s.items[index].status) return feedback(s, index, now);
  if (index !== s.index) throw new HttpError(409, 'out_of_sync');

  if (totalExpired(s, now)) {
    expireRemaining(s, now);
    await store.set(s.sid, s);
    return { expired: true };
  }

  const item = s.items[index];
  const optionCount = item.perm.length;
  if (choice !== null && !(Number.isInteger(choice) && choice >= 0 && choice < optionCount)) {
    throw new HttpError(400, 'invalid_choice');
  }

  if (choice === null || questionExpired(s, now)) {
    item.status = 'timeout';
    item.choice = null;
  } else {
    item.choice = choice;
    item.status = item.perm[choice] === QUESTIONS[item.qi].answer ? 'correct' : 'incorrect';
  }
  item.answeredAt = now;
  await store.set(s.sid, s);
  return feedback(s, index, now);
}

async function actionNext(store, body, now) {
  const s = await loadSession(store, body.sid);
  if (s.finished) throw new HttpError(409, 'already_finished');

  const { index } = body;
  if (!Number.isInteger(index)) throw new HttpError(400, 'invalid_index');
  // Idempotent retry: the server already moved on, resend the current question.
  if (index === s.index - 1) return { question: publicQuestion(s, now) };
  if (index !== s.index) throw new HttpError(409, 'out_of_sync');

  if (totalExpired(s, now)) {
    expireRemaining(s, now);
    await store.set(s.sid, s);
    return { expired: true };
  }

  const item = s.items[s.index];
  if (!item.status) {
    if (!questionExpired(s, now)) throw new HttpError(409, 'not_answered');
    item.status = 'timeout';
    item.answeredAt = now;
  }
  if (s.index >= RULES.total - 1) throw new HttpError(409, 'no_more_questions');

  s.index += 1;
  s.questionStartedAt = now;
  await store.set(s.sid, s);
  return { question: publicQuestion(s, now) };
}

async function actionFinish(store, body, now, deps, origin) {
  const s = await loadSession(store, body.sid);
  if (LANGS.has(body.lang)) s.lang = body.lang;

  if (!s.finished) {
    // Any question left unanswered (total time out) counts as wrong.
    expireRemaining(s, now);
    s.finished = true;
    s.result = computeResult(s, now);
    await store.set(s.sid, s);
  }

  const review = buildReview(s);
  if (!s.reportSent) {
    s.reportSent = await submitReport(s, review, deps, origin);
    await store.set(s.sid, s);
  }
  return { result: s.result, review, reportSent: s.reportSent };
}

// ---------- Netlify Forms submission ----------

async function submitReport(s, review, deps, origin) {
  try {
    const r = s.result;
    const date = formatDate(r.finishedAt, s.lang);
    const duration = formatDuration(r.durationMs);
    const logos = await deps.loadLogos(origin);
    const html = buildReport({ visitor: s.visitor, result: r, review, lang: s.lang, logos, date, duration, sid: s.sid });

    const fields = {
      'form-name': 'quiz-report',
      'bot-field': '',
      fullname: s.visitor.name,
      function: s.visitor.position,
      organization: s.visitor.org,
      score: `${r.score}/${r.total}`,
      percentage: `${r.percentage}%`,
      resultat: r.passed ? 'SUCCESS' : 'FAILED',
      date,
      duration,
      langue: s.lang.toUpperCase(),
      attempt_id: s.sid
    };
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, csvSafe(String(v)));
    const safeName = s.visitor.name.replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 40) || 'visiteur';
    form.append('report', new Blob([html], { type: 'text/html' }), `Rapport_Securite_LNG_${safeName}.html`);

    const res = await deps.fetch(`${origin}/`, { method: 'POST', body: form, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) console.error('Netlify Forms submission failed', res.status);
    return res.ok;
  } catch (err) {
    console.error('Netlify Forms submission error', err);
    return false;
  }
}

// ---------- HTTP handler ----------

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export function createHandler(deps) {
  const now = deps.now ?? Date.now;

  return async function handler(req) {
    try {
      if (req.method !== 'POST') throw new HttpError(405, 'method_not_allowed');

      const url = new URL(req.url);
      const originHeader = req.headers.get('origin');
      if (originHeader && originHeader !== url.origin) throw new HttpError(403, 'forbidden_origin');
      if (!(req.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
        throw new HttpError(415, 'unsupported_media_type');
      }

      const raw = await req.text();
      if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw new HttpError(413, 'payload_too_large');
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        throw new HttpError(400, 'invalid_json');
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'invalid_json');

      const store = deps.openStore();
      const t = now();
      switch (body.action) {
        case 'start':
          return json(200, await actionStart(store, body, t));
        case 'answer':
          return json(200, await actionAnswer(store, body, t));
        case 'next':
          return json(200, await actionNext(store, body, t));
        case 'finish':
          return json(200, await actionFinish(store, body, t, deps, url.origin));
        default:
          throw new HttpError(400, 'unknown_action');
      }
    } catch (err) {
      if (err instanceof HttpError) {
        return json(err.status, { error: err.code, ...(err.details ? { details: err.details } : {}) });
      }
      console.error('Unhandled quiz error', err);
      return json(500, { error: 'server_error' });
    }
  };
}
