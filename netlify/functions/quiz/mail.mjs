// Professional HTML e-mail sent to the HSE team after each quiz.
// Table-based layout with inline styles so it renders the same in Outlook,
// Gmail and mobile clients. Always written in French (internal recipients).
// Logos are referenced by Content-ID (cid:) attachments, never data: URIs,
// because most mail clients block data: images.

import { escapeHtml as e } from './report.mjs';

const BRAND = '#C2410C';
const STATUS_LABEL = { correct: 'Correcte', incorrect: 'Incorrecte', timeout: 'Hors délai' };
const STATUS_STYLE = {
  correct: 'background:#dcfce7;color:#166534;',
  incorrect: 'background:#fee2e2;color:#991b1b;',
  timeout: 'background:#fef3c7;color:#92400e;'
};

function infoRow(label, value, last = false) {
  const border = last ? '' : 'border-bottom:1px solid #e2e8f0;';
  return `<tr>
<td style="padding:10px 14px;${border}font-size:13px;color:#64748b;width:38%;">${e(label)}</td>
<td style="padding:10px 14px;${border}font-size:14px;color:#0f172a;font-weight:600;">${value}</td>
</tr>`;
}

export function buildEmail({ visitor, result, review, date, duration, hasLogos }) {
  const passed = result.passed;
  const verdict = passed ? 'Induction réussie' : 'Induction à refaire';
  const verdictStyle = passed
    ? 'background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;'
    : 'background:#fef2f2;border:1px solid #fecaca;color:#991b1b;';
  const counts = { correct: 0, incorrect: 0, timeout: 0 };
  for (const r of review) counts[r.status] += 1;

  const subject = `Induction sécurité mLNG Tendrara | ${visitor.name} (${visitor.org}) | ${passed ? 'Réussie' : 'À refaire'} ${result.score}/${result.total}`;

  const rows = review
    .map((item, i) => {
      const v = item.fr;
      const bg = i % 2 ? '#f8fafc' : '#ffffff';
      const correction =
        item.status === 'correct'
          ? ''
          : `<div style="margin-top:4px;font-size:12px;color:#166534;">Bonne réponse : ${e(v.correct)}</div>`;
      return `<tr style="background:${bg};">
<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;vertical-align:top;width:28px;">${item.n}</td>
<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;vertical-align:top;">
<div style="font-weight:600;">${e(v.question)}</div>
<div style="margin-top:4px;font-size:12px;color:#475569;">Réponse donnée : ${v.chosen === null ? 'Aucune réponse' : e(v.chosen)}</div>${correction}
</td>
<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;text-align:right;white-space:nowrap;">
<span style="display:inline-block;padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;${STATUS_STYLE[item.status]}">${STATUS_LABEL[item.status]}</span>
</td>
</tr>`;
    })
    .join('');

  const logos = hasLogos
    ? `<img src="cid:managem-logo" alt="Managem" height="36" style="height:36px;vertical-align:middle;border:0;margin-right:14px;"><img src="cid:mana-logo" alt="ManaEnergy" height="26" style="height:26px;vertical-align:middle;border:0;">`
    : `<span style="font-size:15px;font-weight:700;color:#ffffff;">Managem &nbsp;|&nbsp; ManaEnergy</span>`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(subject)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">

<tr><td style="height:5px;background:${BRAND};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:18px 28px;background:#1e293b;">${logos}</td></tr>

<tr><td style="padding:26px 28px 6px;">
<div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;font-weight:700;">Site mLNG Tendrara</div>
<div style="font-size:21px;font-weight:700;color:#0f172a;margin-top:4px;">Rapport d'induction sécurité visiteur</div>
<div style="font-size:13px;color:#64748b;margin-top:4px;">${e(date)}</div>
</td></tr>

<tr><td style="padding:16px 28px 4px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${verdictStyle}border-radius:6px;">
<tr>
<td style="padding:14px 18px;font-size:16px;font-weight:700;">${verdict}</td>
<td style="padding:14px 18px;font-size:22px;font-weight:700;text-align:right;white-space:nowrap;">${result.score}/${result.total}</td>
</tr>
</table>
</td></tr>

<tr><td style="padding:16px 28px 4px;">
<div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:8px;">Visiteur</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;">
${infoRow('Nom complet', e(visitor.name))}
${infoRow('Organisation', e(visitor.org), true)}
</table>
</td></tr>

<tr><td style="padding:16px 28px 4px;">
<div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:8px;">Résultat</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;">
${infoRow('Score', `${result.score}/${result.total} (${result.percentage} %)`)}
${infoRow('Seuil de réussite', `${result.passMark}/${result.total}`)}
${infoRow('Réponses correctes / incorrectes / hors délai', `${counts.correct} / ${counts.incorrect} / ${counts.timeout}`)}
${infoRow('Durée', e(duration), true)}
</table>
</td></tr>

<tr><td style="padding:16px 28px 24px;">
<div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:8px;">Détail des réponses</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;border-collapse:separate;">
${rows}
</table>
</td></tr>

<tr><td style="padding:14px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
Le rapport complet est joint à ce message.
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    "Rapport d'induction sécurité visiteur - Site mLNG Tendrara",
    date,
    '',
    `${verdict} : ${result.score}/${result.total} (${result.percentage} %)`,
    '',
    `Nom complet : ${visitor.name}`,
    `Organisation : ${visitor.org}`,
    `Seuil de réussite : ${result.passMark}/${result.total}`,
    `Correctes / incorrectes / hors délai : ${counts.correct} / ${counts.incorrect} / ${counts.timeout}`,
    `Durée : ${duration}`,
    '',
    'Détail des réponses :',
    ...review.map((r) => {
      const v = r.fr;
      const base = `${r.n}. ${v.question}\n   Réponse donnée : ${v.chosen ?? 'Aucune réponse'} (${STATUS_LABEL[r.status]})`;
      return r.status === 'correct' ? base : `${base}\n   Bonne réponse : ${v.correct}`;
    }),
    '',
    'Le rapport complet est joint à ce message.'
  ].join('\n');

  return { subject, html, text };
}
