// Builds the self-contained HTML report attached to each Netlify Forms submission.
// Every dynamic value goes through escapeHtml(), and the report carries its own
// CSP that forbids scripts, so opening it can never execute injected code.

const LABELS = {
  fr: {
    title: "Rapport d'induction sécurité mLNG Tendrara",
    name: 'Nom complet',
    org: 'Organisation',
    result: 'Résultat',
    score: 'Score final',
    duration: 'Durée',
    passed: 'RÉUSSI',
    failed: 'À REFAIRE',
    details: 'Détail des réponses',
    colNo: 'N°',
    colQuestion: 'Question',
    colChosen: 'Réponse donnée',
    colCorrect: 'Bonne réponse',
    colStatus: 'Résultat',
    correct: 'Correcte',
    incorrect: 'Incorrecte',
    timeout: 'Hors délai',
    noAnswer: 'Aucune réponse',
    passRule: (m, t) => `Seuil de réussite : ${m}/${t}`
  },
  en: {
    title: 'Safety induction report mLNG Tendrara',
    name: 'Full name',
    org: 'Organization',
    result: 'Result',
    score: 'Final score',
    duration: 'Duration',
    passed: 'PASSED',
    failed: 'TO BE REPEATED',
    details: 'Answer details',
    colNo: 'No.',
    colQuestion: 'Question',
    colChosen: 'Answer given',
    colCorrect: 'Correct answer',
    colStatus: 'Result',
    correct: 'Correct',
    incorrect: 'Incorrect',
    timeout: 'Timed out',
    noAnswer: 'No answer',
    passRule: (m, t) => `Pass mark: ${m}/${t}`
  }
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Only accept PNG data URIs we generated ourselves.
function safeLogo(dataUri) {
  return typeof dataUri === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(dataUri) ? dataUri : '';
}

export function buildReport({ visitor, result, review, lang, logos, date, duration }) {
  const L = LABELS[lang] || LABELS.fr;
  const e = escapeHtml;
  const mana = safeLogo(logos?.mana);
  const managem = safeLogo(logos?.managem);

  const rows = review
    .map((item) => {
      const v = item[lang] || item.fr;
      const badge =
        item.status === 'correct'
          ? `<span class="b ok">${e(L.correct)}</span>`
          : item.status === 'timeout'
            ? `<span class="b to">${e(L.timeout)}</span>`
            : `<span class="b ko">${e(L.incorrect)}</span>`;
      return `<tr${item.status === 'correct' ? '' : ' class="miss"'}>
<td class="c">Q${item.n}</td>
<td>${e(v.question)}</td>
<td>${v.chosen === null ? e(L.noAnswer) : e(v.chosen)}</td>
<td class="good">${item.status === 'correct' ? '' : e(v.correct)}</td>
<td class="c">${badge}</td>
</tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="${lang === 'en' ? 'en' : 'fr'}">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(L.title)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{margin:8mm}
body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;background:#f1f4f9;color:#1e293b;padding:12px}
.wrap{max-width:960px;margin:0 auto}
.hd{background:linear-gradient(135deg,#EA580C,#C2410C);padding:14px 24px;border-radius:10px 10px 0 0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;color:#fff}
.brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:12px}
.brand span{display:flex;align-items:center;gap:6px}
.brand img{height:24px;width:auto;background:#fff;border-radius:4px;padding:2px}
.meta{text-align:right}.meta b{display:block;font-size:17px}.meta small{opacity:.85;font-size:11px}
.card{background:#fff;padding:20px 24px;border-radius:0 0 10px 10px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.info{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
.info div{flex:1;min-width:140px;padding:10px 14px;background:#f8fafc;border-left:4px solid #EA580C}
.info i{display:block;font-style:normal;font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:4px}
.info strong{font-size:15px;word-break:break-word}
.pass{color:#047857}.fail{color:#b91c1c}
h2{font-size:14px;border-bottom:2px solid #EA580C;padding-bottom:8px;margin-bottom:12px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;background:#f8fafc;border-bottom:2px solid #e5e9f0}
td{padding:8px 10px;border-bottom:1px solid #e5e9f0;vertical-align:top;line-height:1.4}
tr{break-inside:avoid}
tr.miss{background:#fffbeb}
.c{text-align:center}.good{color:#047857;font-weight:600}
.b{display:inline-block;padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700;white-space:nowrap}
.ok{background:#d1fae5;color:#047857}.ko{background:#fee2e2;color:#b91c1c}.to{background:#fef3c7;color:#92400e}
@media(max-width:700px){.meta{text-align:left}.info div{min-width:100%}}
</style>
</head>
<body>
<div class="wrap">
<div class="hd">
<div class="brand"><span>${managem ? `<img src="${managem}" alt="">` : ''}Managem</span><span>${mana ? `<img src="${mana}" alt="">` : ''}ManaEnergy</span></div>
<div class="meta"><b>${e(L.title)}</b><small>${e(date)}</small></div>
</div>
<div class="card">
<div class="info">
<div><i>${e(L.name)}</i><strong>${e(visitor.name)}</strong></div>
<div><i>${e(L.org)}</i><strong>${e(visitor.org)}</strong></div>
<div><i>${e(L.result)}</i><strong class="${result.passed ? 'pass' : 'fail'}">${e(result.passed ? L.passed : L.failed)}</strong></div>
<div><i>${e(L.score)}</i><strong>${result.score}/${result.total} (${result.percentage}%)</strong><br><small>${e(L.passRule(result.passMark, result.total))}</small></div>
<div><i>${e(L.duration)}</i><strong>${e(duration)}</strong></div>
</div>
<h2>${e(L.details)}</h2>
<table>
<thead><tr><th class="c">${e(L.colNo)}</th><th>${e(L.colQuestion)}</th><th>${e(L.colChosen)}</th><th>${e(L.colCorrect)}</th><th class="c">${e(L.colStatus)}</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</div>
</div>
</body>
</html>`;
}
