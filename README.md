# Quiz sécurité visiteur — Induction mLNG Tendrara

Quiz d'induction sécurité pour les visiteurs du site mLNG Tendrara (ManaEnergy / Managem), en français et en anglais.

## Règles du quiz

- 10 questions tirées de l'induction mLNG Tendrara. L'ordre des questions et des réponses est mélangé à chaque tentative.
- **Réussite : 7 bonnes réponses sur 10.**
- **30 secondes par question.** Passé ce délai, la question est comptée fausse et la suivante s'affiche automatiquement.
- **5 minutes au total.** À la fin du temps, les questions restantes sont comptées fausses et le résultat s'affiche.
- La bonne réponse (et une explication quand il y en a une) s'affiche après chaque réponse. La correction complète est disponible à la fin.

## Architecture

```
public/                      ← seul dossier publié (site statique)
  index.html
  assets/app.js              ← interface ; ne connaît PAS les bonnes réponses
  assets/styles.css
  mana.png, managem.png
netlify/functions/quiz/      ← Netlify Function  POST /api/quiz
  quiz.mjs                   ← point d'entrée (Netlify Blobs)
  core.mjs                   ← moteur : chronos, score, validation
  questions.mjs              ← banque de questions + corrigé (côté serveur uniquement)
  report.mjs                 ← rapport HTML joint à chaque soumission
netlify.toml                 ← configuration du build + en-têtes de sécurité (CSP…)
```

Déroulement : `start` → (`answer` → `next`) × 10 → `finish`. Le serveur enregistre chaque tentative dans Netlify Blobs (store `quiz-sessions`). Il contrôle les délais, calcule le score, puis envoie le résultat et le rapport HTML à **Netlify Forms** (formulaire `quiz-report`).

## Sécurité

- **Le corrigé, les chronomètres et le score sont gérés côté serveur.** Le navigateur ne reçoit jamais les bonnes réponses avant d'avoir répondu, et ne peut ni modifier une réponse déjà enregistrée ni prolonger les délais.
- **Protection XSS** :
  - Côté interface, tout le texte est inséré avec `textContent`.
  - Côté rapport, toutes les valeurs sont échappées et une CSP interdit tout script.
- **CSP stricte** et en-têtes de sécurité (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, HSTS…) via `netlify.toml`. Aucune ressource externe (CDN, polices).
- **Validation des entrées** :
  - longueur maximale, suppression des caractères de contrôle et des caractères bidi ;
  - taille du corps de requête limitée ;
  - vérification de l'origine des requêtes.
- **Protection contre l'injection de formules** (CSV/Excel) dans l'export Netlify Forms.

## Déploiement sur Netlify

1. Netlify → **Add new site → Import an existing project → GitHub**, puis choisir ce dépôt.
2. Garder les réglages proposés (ils viennent de `netlify.toml`) : aucune commande de build, dossier publié `public`.
3. Après le premier déploiement : **Site configuration → Forms → Enable form detection**, puis **redéployer** (Deploys → Trigger deploy) pour que le formulaire `quiz-report` soit détecté.
4. Ouvrir l'URL du site et passer le quiz. Les résultats apparaissent dans **Forms → quiz-report**, avec le rapport HTML en pièce jointe.
   - Pour être prévenu par e-mail : **Forms → Form notifications → Add notification → Email notification**.
   - Si une soumission manque, regarder aussi l'onglet **Spam** du formulaire.

Netlify Blobs ne demande aucune configuration. Aucune variable d'environnement n'est nécessaire.

## E-mail professionnel au service HSE (recommandé)

L'e-mail automatique de Netlify Forms a un format fixe : une liste brute de champs, qu'on ne peut pas mettre en forme. Le quiz peut envoyer à la place son propre e-mail mis en page. Il contient les logos, un bandeau « Induction réussie » ou « à refaire », les informations du visiteur, le score, le détail des réponses et le rapport en pièce jointe.

Dans Netlify, ouvrez **Site configuration → Environment variables** et ajoutez :

| Variable | Exemple | Obligatoire |
|---|---|---|
| `SMTP_HOST` | `smtp.gmail.com` / `smtp.office365.com` | oui |
| `SMTP_PORT` | `587` (ou `465`) | non, 587 par défaut |
| `SMTP_USER` | `induction@votre-domaine.com` | oui |
| `SMTP_PASS` | mot de passe d'application | oui (cocher « Secret ») |
| `MAIL_TO` | `hse@managem.com, accueil@managem.com` | oui, plusieurs adresses séparées par des virgules |
| `MAIL_FROM` | `Induction Sécurité <induction@votre-domaine.com>` | non, `SMTP_USER` par défaut |

Ensuite :
1. **Deploys → Trigger deploy**.
2. Désactivez l'e-mail de Netlify (**Forms → Form notifications**) pour ne pas recevoir deux messages.

Netlify Forms continue d'archiver chaque résultat.

- **Gmail** : activez la validation en deux étapes, puis créez un *mot de passe d'application* (Compte Google → Sécurité → Mots de passe des applications). C'est lui qu'il faut mettre dans `SMTP_PASS`, pas le mot de passe du compte.
- **Microsoft 365** : l'envoi SMTP authentifié doit être autorisé pour la boîte d'envoi. Voyez avec le service informatique.

Si l'e-mail échoue, l'écran de résultat affiche `Code : mail_error` et le bouton « Réessayer l'envoi ». La cause exacte est dans **Logs → Functions → quiz**.

## Dépannage : « Le résultat n'a pas pu être transmis »

Le résultat du quiz est toujours enregistré côté serveur. Seul l'envoi vers Netlify Forms a échoué. Le message affiche un code, et le bouton **Réessayer l'envoi** relance l'envoi sans refaire le quiz.

| Code | Cause probable | Solution |
|---|---|---|
| `forms_404` ou `forms_405` | Le formulaire `quiz-report` n'est pas détecté par Netlify | **Forms → Enable form detection**, puis **Deploys → Trigger deploy → Clear cache and deploy site**. Vérifier que `quiz-report` apparaît dans l'onglet **Forms**. |
| `forms_timeout` / `forms_network` | Netlify n'a pas répondu à temps | Cliquer sur **Réessayer l'envoi**. |
| autre `forms_xxx` | Refus de Netlify Forms | Consulter **Logs → Functions → quiz** : la réponse exacte de Netlify y est enregistrée. |

Si la pièce jointe est refusée, les champs (nom, score, résultat…) sont envoyés seuls, pour que le résultat ne soit jamais perdu.

## Modifier les questions

Éditer `netlify/functions/quiz/questions.mjs`. Chaque question contient le texte et les 4 options en `fr` et en `en`, dans le même ordre. `answer` est l'index (0 à 3) de la bonne réponse. Le seuil et les délais se règlent dans `RULES`, dans `core.mjs`. Il faut alors mettre à jour les textes des règles dans `public/assets/app.js`.

## Données personnelles

Le nom, l'organisation et les résultats sont conservés dans Netlify Forms et dans le store Netlify Blobs `quiz-sessions`. On peut les supprimer depuis le tableau de bord Netlify.
