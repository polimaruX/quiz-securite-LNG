'use strict';

// Quiz client. It never knows the answer key: questions, correction, timing
// enforcement and scoring all come from the server function at /api/quiz.
// All dynamic text is written with textContent (no innerHTML), so visitor input
// can never be interpreted as HTML.
(() => {
    const API_URL = '/api/quiz';
    const TICK_MS = 200;
    const STORAGE_KEYS = { lang: 'quiz.lang', theme: 'quiz.theme' };

    // ---------- TRANSLATIONS ----------
    const I18N = {
        fr: {
            ui: {
                langTitle: 'Changer la langue',
                themeTitle: 'Changer le thème'
            },
            registration: {
                title: 'QUIZ DE SÉCURITÉ VISITEUR',
                subtitle: 'Veuillez remplir vos informations avant de commencer le quiz de sécurité.',
                name: 'Nom complet',
                namePlaceholder: 'Ex : Jean Dupont',
                org: 'Organisation',
                orgPlaceholder: 'Ex : ManaEnergy',
                start: 'Commencer le quiz',
                welcomeTitle: 'Bienvenue !',
                welcomeText1: 'Avant de débuter votre visite, prenez quelques instants pour tester vos connaissances en sécurité.',
                welcomeText2: 'Votre vigilance est essentielle : ensemble, assurons une visite en toute sécurité.',
                welcomeGoodQuiz: 'Bon quiz !',
                rule1: "10 questions basées sur l'induction sécurité mLNG Tendrara",
                rule2: 'Seuil de réussite : 7 bonnes réponses sur 10',
                rule3: '30 secondes par question : passé ce délai, la question est comptée fausse',
                rule4: 'Durée totale maximale : 5 minutes'
            },
            quiz: {
                progress: 'Question {current}/{total}',
                totalTime: 'Temps total restant :',
                questionTime: 'Temps restant pour cette question :',
                next: 'Question suivante',
                seeResults: 'Voir le résultat',
                timeoutNotice: 'Temps écoulé pour la question {n} : elle est comptée fausse.'
            },
            feedback: {
                correct: 'Bonne réponse.',
                incorrect: 'Réponse incorrecte. La bonne réponse est : {answer}',
                timeout: 'Temps écoulé, réponse comptée fausse. La bonne réponse est : {answer}'
            },
            results: {
                title: 'Résultat du quiz',
                score: 'Score',
                percentage: 'Pourcentage',
                correct: 'Correctes',
                incorrect: 'Incorrectes',
                timeout: 'Temps écoulé',
                duration: 'Durée',
                pass: 'Induction sécurité réussie',
                fail: 'Induction à refaire',
                sent: 'Résultat transmis au service HSE.',
                notSent: "Le résultat n'a pas pu être transmis. Merci de prévenir l'accueil.",
                review: 'Voir la correction',
                yourAnswer: 'Votre réponse :',
                correctAnswer: 'Bonne réponse :',
                noAnswer: 'Aucune réponse',
                chipCorrect: 'Correcte',
                chipIncorrect: 'Incorrecte',
                chipTimeout: 'Hors délai',
                restart: 'Nouvelle inscription'
            },
            validation: {
                name: 'Veuillez entrer votre nom complet.',
                org: 'Veuillez entrer votre organisation.'
            },
            errors: {
                network: 'Connexion au serveur impossible. Vérifiez la connexion internet puis réessayez.',
                server: 'Le serveur a rencontré une erreur. Veuillez réessayer.',
                session: 'Votre session a expiré ou n’est plus valide. Merci de recommencer l’inscription.',
                retry: 'Réessayer',
                restart: 'Recommencer'
            },
            leaveWarning: 'Le quiz est en cours. Quitter la page annulera votre tentative.'
        },
        en: {
            ui: {
                langTitle: 'Change language',
                themeTitle: 'Change theme'
            },
            registration: {
                title: 'VISITOR SAFETY QUIZ',
                subtitle: 'Please fill in your details before starting the safety quiz.',
                name: 'Full name',
                namePlaceholder: 'E.g. John Doe',
                org: 'Organization',
                orgPlaceholder: 'E.g. ManaEnergy',
                start: 'Start the quiz',
                welcomeTitle: 'Welcome!',
                welcomeText1: 'Before starting your visit, take a few moments to test your safety knowledge.',
                welcomeText2: "Your vigilance is essential: together, let's ensure a safe visit.",
                welcomeGoodQuiz: 'Enjoy the quiz!',
                rule1: '10 questions based on the mLNG Tendrara safety induction',
                rule2: 'Passing score: 7 correct answers out of 10',
                rule3: '30 seconds per question: after that, the question counts as wrong',
                rule4: 'Maximum total duration: 5 minutes'
            },
            quiz: {
                progress: 'Question {current}/{total}',
                totalTime: 'Total time remaining:',
                questionTime: 'Time remaining for this question:',
                next: 'Next question',
                seeResults: 'See my result',
                timeoutNotice: 'Time is up for question {n}: it counts as wrong.'
            },
            feedback: {
                correct: 'Correct answer.',
                incorrect: 'Incorrect answer. The correct answer is: {answer}',
                timeout: 'Time is up, counted as wrong. The correct answer is: {answer}'
            },
            results: {
                title: 'Quiz result',
                score: 'Score',
                percentage: 'Percentage',
                correct: 'Correct',
                incorrect: 'Incorrect',
                timeout: 'Timed out',
                duration: 'Duration',
                pass: 'Safety induction passed',
                fail: 'Induction must be repeated',
                sent: 'Result sent to the HSE department.',
                notSent: 'The result could not be sent. Please inform the reception desk.',
                review: 'See the correction',
                yourAnswer: 'Your answer:',
                correctAnswer: 'Correct answer:',
                noAnswer: 'No answer',
                chipCorrect: 'Correct',
                chipIncorrect: 'Wrong',
                chipTimeout: 'Timed out',
                restart: 'New registration'
            },
            validation: {
                name: 'Please enter your full name.',
                org: 'Please enter your organization.'
            },
            errors: {
                network: 'Cannot reach the server. Check the internet connection and try again.',
                server: 'The server encountered an error. Please try again.',
                session: 'Your session has expired or is no longer valid. Please register again.',
                retry: 'Try again',
                restart: 'Start over'
            },
            leaveWarning: 'The quiz is in progress. Leaving the page will cancel your attempt.'
        }
    };

    // ---------- STORAGE (best effort) ----------
    function readPref(key) {
        try {
            return window.localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    function writePref(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch {
            /* storage unavailable: preference is simply not remembered */
        }
    }

    // ---------- STATE ----------
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const savedLang = readPref(STORAGE_KEYS.lang);
    const savedTheme = readPref(STORAGE_KEYS.theme);

    const state = {
        lang: savedLang === 'en' ? 'en' : 'fr',
        theme: savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null, // null = follow system
        view: 'registration',
        busy: false,
        sid: null,
        question: null, // { index, total, fr: {text, options}, en: {...} }
        feedback: null, // server feedback for the current question once answered
        pendingChoice: null,
        notice: null, // { n } after an automatic skip
        perQuestionMs: 30000,
        qDeadline: 0,
        totalDeadline: 0,
        timerId: null,
        finishing: false,
        outcome: null, // { result, review, reportSent }
        error: null // { key, action: 'retry' | 'restart', retry: fn }
    };

    // ---------- DOM ----------
    const $ = (id) => document.getElementById(id);
    const el = {
        views: {
            registration: $('view-registration'),
            quiz: $('view-quiz'),
            results: $('view-results')
        },
        langToggle: $('langToggle'),
        langLabel: $('langLabel'),
        themeToggle: $('themeToggle'),
        errorBox: $('errorBox'),
        errorText: $('errorText'),
        errorAction: $('errorAction'),
        regForm: $('regForm'),
        startBtn: $('startQuizBtn'),
        inputs: { name: $('visitorName'), org: $('visitorOrg') },
        fieldErrors: { name: $('err-name'), org: $('err-org') },
        progressText: $('quizProgressText'),
        progressBar: $('progressBar'),
        totalTimer: $('totalTimer'),
        totalTimerValue: $('totalTimerValue'),
        questionTimer: $('questionTimer'),
        questionTimerBar: $('questionTimerBar'),
        questionTimerValue: $('questionTimerValue'),
        notice: $('notice'),
        questionText: $('questionText'),
        options: $('optionsContainer'),
        feedback: $('feedbackMessage'),
        feedbackTitle: $('feedbackTitle'),
        feedbackExplanation: $('feedbackExplanation'),
        nextBtn: $('nextBtn'),
        nextBtnLabel: $('nextBtnLabel'),
        resultBadge: $('resultBadge'),
        score: $('scoreDisplay'),
        percentage: $('percentageDisplay'),
        correctCount: $('correctCount'),
        incorrectCount: $('incorrectCount'),
        timeoutCount: $('timeoutCount'),
        duration: $('durationDisplay'),
        sendStatus: $('sendStatus'),
        reviewDetails: $('reviewDetails'),
        reviewList: $('reviewList'),
        restartBtn: $('restartBtn')
    };

    // ---------- I18N ----------
    function t(key, vars) {
        let value = key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined), I18N[state.lang]);
        if (typeof value !== 'string') return key;
        if (vars) {
            for (const [k, v] of Object.entries(vars)) value = value.split(`{${k}}`).join(String(v));
        }
        return value;
    }

    function applyStaticTexts() {
        document.documentElement.lang = state.lang;
        document.querySelectorAll('[data-i18n]').forEach((node) => {
            node.textContent = t(node.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
            node.placeholder = t(node.dataset.i18nPlaceholder);
        });
        document.querySelectorAll('[data-i18n-title]').forEach((node) => {
            node.title = t(node.dataset.i18nTitle);
            if (node.hasAttribute('aria-label')) node.setAttribute('aria-label', node.title);
        });
        el.langLabel.textContent = state.lang.toUpperCase();
    }

    // ---------- THEME ----------
    function currentTheme() {
        return state.theme || (darkQuery.matches ? 'dark' : 'light');
    }

    function applyTheme() {
        document.documentElement.dataset.theme = currentTheme();
    }

    // ---------- HELPERS ----------
    function formatClock(ms) {
        const sec = Math.max(0, Math.ceil(ms / 1000));
        return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function showView(name) {
        state.view = name;
        for (const [key, node] of Object.entries(el.views)) node.hidden = key !== name;
    }

    function setBusy(busy) {
        state.busy = busy;
        el.startBtn.disabled = busy;
        el.nextBtn.disabled = busy;
    }

    // ---------- API ----------
    class ApiError extends Error {
        constructor(code, status, details) {
            super(code);
            this.code = code;
            this.status = status;
            this.details = details;
        }
    }

    async function api(payload, retries = 2) {
        for (let attempt = 0; ; attempt++) {
            let res;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000);
            try {
                res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    cache: 'no-store',
                    credentials: 'same-origin',
                    signal: controller.signal
                });
            } catch {
                clearTimeout(timeout);
                if (attempt < retries) {
                    await sleep(700 * (attempt + 1));
                    continue;
                }
                throw new ApiError('network', 0);
            }
            clearTimeout(timeout);

            let data = null;
            try {
                data = await res.json();
            } catch {
                /* non-JSON response */
            }
            if (res.ok && data) return data;
            if (res.status >= 500 && attempt < retries) {
                await sleep(700 * (attempt + 1));
                continue;
            }
            throw new ApiError((data && data.error) || `http_${res.status}`, res.status, data && data.details);
        }
    }

    // ---------- ERRORS ----------
    function showError(err, retry) {
        const sessionCodes = ['session_not_found', 'invalid_session', 'out_of_sync', 'already_finished', 'no_more_questions'];
        if (sessionCodes.includes(err.code)) {
            state.error = { key: 'errors.session', action: 'restart' };
        } else if (err.code === 'network') {
            state.error = { key: 'errors.network', action: 'retry', retry };
        } else {
            state.error = { key: 'errors.server', action: 'retry', retry };
        }
        renderError();
    }

    function clearError() {
        state.error = null;
        renderError();
    }

    function renderError() {
        if (!state.error) {
            el.errorBox.hidden = true;
            return;
        }
        el.errorText.textContent = t(state.error.key);
        el.errorAction.textContent = t(state.error.action === 'restart' ? 'errors.restart' : 'errors.retry');
        el.errorBox.hidden = false;
    }

    el.errorAction.addEventListener('click', () => {
        const error = state.error;
        clearError();
        if (!error) return;
        if (error.action === 'restart') restart();
        else if (typeof error.retry === 'function') error.retry();
    });

    // ---------- REGISTRATION ----------
    function readVisitor() {
        const visitor = {};
        let firstInvalid = null;
        for (const [key, input] of Object.entries(el.inputs)) {
            const value = input.value.replace(/\s+/g, ' ').trim();
            visitor[key] = value;
            const invalid = value.length === 0;
            input.setAttribute('aria-invalid', String(invalid));
            el.fieldErrors[key].hidden = !invalid;
            el.fieldErrors[key].textContent = invalid ? t(`validation.${key}`) : '';
            if (invalid && !firstInvalid) firstInvalid = input;
        }
        if (firstInvalid) {
            firstInvalid.focus();
            return null;
        }
        return visitor;
    }

    function refreshFieldErrors() {
        for (const [key, node] of Object.entries(el.fieldErrors)) {
            if (!node.hidden) node.textContent = t(`validation.${key}`);
        }
    }

    async function startQuiz() {
        if (state.busy) return;
        const visitor = readVisitor();
        if (!visitor) return;
        clearError();
        setBusy(true);
        try {
            const data = await api({ action: 'start', lang: state.lang, ...visitor });
            state.sid = data.sid;
            state.perQuestionMs = data.rules.perQuestionSec * 1000;
            state.outcome = null;
            state.finishing = false;
            state.totalDeadline = performance.now() + data.question.totalRemainingMs;
            loadQuestion(data.question);
            showView('quiz');
            startTimer();
            el.questionText.focus();
        } catch (err) {
            if (err.code === 'invalid_visitor' && err.details) {
                for (const key of err.details.missing || []) {
                    if (el.inputs[key]) el.inputs[key].value = '';
                }
                readVisitor();
            } else {
                showError(err, startQuiz);
            }
        } finally {
            setBusy(false);
        }
    }

    // ---------- QUIZ ----------
    function loadQuestion(question) {
        const now = performance.now();
        state.question = question;
        state.feedback = null;
        state.pendingChoice = null;
        state.qDeadline = now + question.questionRemainingMs;
        state.totalDeadline = now + question.totalRemainingMs;
        renderQuestion();
        tick();
    }

    function renderQuestion() {
        const q = state.question;
        if (!q) return;
        const view = q[state.lang];
        const fb = state.feedback;

        el.progressText.textContent = t('quiz.progress', { current: q.index + 1, total: q.total });
        el.progressBar.style.width = `${((q.index + (fb ? 1 : 0)) / q.total) * 100}%`;
        el.questionText.textContent = view.text;

        if (state.notice) {
            el.notice.textContent = t('quiz.timeoutNotice', { n: state.notice.n });
            el.notice.hidden = false;
        } else {
            el.notice.hidden = true;
        }

        el.options.replaceChildren(
            ...view.options.map((text, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'option-btn';
                const letter = document.createElement('span');
                letter.className = 'option-letter';
                letter.setAttribute('aria-hidden', 'true');
                letter.textContent = String.fromCharCode(65 + idx);
                const label = document.createElement('span');
                label.textContent = text;
                btn.append(letter, label);

                if (fb) {
                    btn.disabled = true;
                    if (idx === fb.correctChoice) btn.classList.add('correct');
                    else if (idx === fb.choice) btn.classList.add('incorrect');
                    else btn.classList.add('dimmed');
                } else if (state.pendingChoice !== null) {
                    btn.disabled = true;
                    if (idx === state.pendingChoice) btn.classList.add('pending');
                } else {
                    btn.addEventListener('click', () => selectAnswer(idx));
                }
                return btn;
            })
        );

        if (fb) {
            const correctText = view.options[fb.correctChoice];
            el.feedback.className = 'feedback';
            if (fb.status === 'correct') {
                el.feedback.classList.add('correct-fb');
                el.feedbackTitle.textContent = t('feedback.correct');
            } else if (fb.status === 'timeout') {
                el.feedback.classList.add('timeout-fb');
                el.feedbackTitle.textContent = t('feedback.timeout', { answer: correctText });
            } else {
                el.feedback.classList.add('incorrect-fb');
                el.feedbackTitle.textContent = t('feedback.incorrect', { answer: correctText });
            }
            const explanation = fb.explanation[state.lang];
            el.feedbackExplanation.textContent = explanation || '';
            el.feedbackExplanation.hidden = !explanation;
            el.feedback.hidden = false;

            el.nextBtnLabel.textContent = t(fb.isLast ? 'quiz.seeResults' : 'quiz.next');
            el.nextBtn.hidden = false;
        } else {
            el.feedback.hidden = true;
            el.nextBtn.hidden = true;
        }
    }

    // Sends the answer (choice = null means "time is up"). Returns the server
    // feedback, or null when the quiz ended or the request failed.
    async function sendAnswer(choice) {
        const index = state.question.index;
        let fb;
        setBusy(true);
        try {
            fb = await api({ action: 'answer', sid: state.sid, index, choice });
        } catch (err) {
            state.pendingChoice = null;
            renderQuestion();
            showError(err, () => (choice === null ? onQuestionTimeout() : sendAnswer(choice).then(showFeedback)));
            return null;
        } finally {
            setBusy(false);
        }
        if (fb.expired) {
            await finish();
            return null;
        }
        state.feedback = fb;
        state.pendingChoice = null;
        state.totalDeadline = performance.now() + fb.totalRemainingMs;
        return fb;
    }

    function showFeedback(fb) {
        if (!fb) return;
        renderQuestion();
        el.nextBtn.focus();
    }

    async function selectAnswer(choice) {
        if (state.busy || state.feedback || state.finishing) return;
        state.pendingChoice = choice;
        renderQuestion();
        showFeedback(await sendAnswer(choice));
    }

    async function goNext() {
        if (state.busy || !state.feedback) return;
        if (state.feedback.isLast) return finish();
        state.notice = null;
        await requestNext();
    }

    async function requestNext() {
        let data;
        setBusy(true);
        try {
            data = await api({ action: 'next', sid: state.sid, index: state.question.index });
        } catch (err) {
            // Fall back to showing the recorded answer so the visitor can retry "next".
            renderQuestion();
            showError(err, requestNext);
            return;
        } finally {
            setBusy(false);
        }
        if (data.expired) return finish();
        loadQuestion(data.question);
        el.questionText.focus();
    }

    // Question time is up: the answer is recorded as wrong and the next question
    // is shown straight away, with a notice about the skipped one.
    async function onQuestionTimeout() {
        const index = state.question.index;
        const fb = await sendAnswer(null);
        if (!fb || state.finishing) return;
        if (fb.isLast) return finish();
        state.notice = { n: index + 1 };
        await requestNext();
    }

    // ---------- TIMERS ----------
    function startTimer() {
        stopTimer();
        state.timerId = window.setInterval(tick, TICK_MS);
    }

    function stopTimer() {
        if (state.timerId !== null) window.clearInterval(state.timerId);
        state.timerId = null;
    }

    function tick() {
        if (state.view !== 'quiz' || !state.question) return;
        const now = performance.now();
        const totalLeft = state.totalDeadline - now;
        el.totalTimerValue.textContent = formatClock(totalLeft);
        el.totalTimer.classList.toggle('warn', totalLeft <= 60000);

        const answered = Boolean(state.feedback);
        const qLeft = Math.max(0, state.qDeadline - now);
        el.questionTimer.classList.toggle('paused', answered);
        if (!answered) {
            el.questionTimerValue.textContent = String(Math.ceil(qLeft / 1000));
            el.questionTimerBar.style.width = `${Math.min(100, (qLeft / state.perQuestionMs) * 100)}%`;
            el.questionTimer.classList.toggle('warn', qLeft <= 15000 && qLeft > 5000);
            el.questionTimer.classList.toggle('danger', qLeft <= 5000);
        }

        if (state.busy || state.finishing || state.error) return;
        if (totalLeft <= 0) {
            finish();
        } else if (!answered && state.pendingChoice === null && qLeft <= 0) {
            onQuestionTimeout();
        }
    }

    // ---------- RESULTS ----------
    async function finish() {
        if (state.finishing && state.busy) return;
        state.finishing = true;
        stopTimer();
        setBusy(true);
        try {
            const outcome = await api({ action: 'finish', sid: state.sid, lang: state.lang }, 3);
            state.outcome = outcome;
            state.question = null;
            state.feedback = null;
            state.notice = null;
            renderResults();
            showView('results');
            el.restartBtn.focus();
        } catch (err) {
            showError(err, finish);
        } finally {
            setBusy(false);
        }
    }

    function renderResults() {
        const outcome = state.outcome;
        if (!outcome) return;
        const { result, review, reportSent } = outcome;
        const count = (status) => review.filter((r) => r.status === status).length;

        el.resultBadge.textContent = t(result.passed ? 'results.pass' : 'results.fail');
        el.resultBadge.className = `result-badge ${result.passed ? 'pass' : 'fail'}`;
        el.score.textContent = `${result.score}/${result.total}`;
        el.percentage.textContent = `${result.percentage}%`;
        el.correctCount.textContent = String(result.score);
        el.incorrectCount.textContent = String(count('incorrect'));
        el.timeoutCount.textContent = String(count('timeout'));
        el.duration.textContent = formatClock(result.durationMs);
        el.sendStatus.textContent = t(reportSent ? 'results.sent' : 'results.notSent');
        el.sendStatus.className = `send-status ${reportSent ? 'ok' : 'ko'}`;

        const chipKey = { correct: 'results.chipCorrect', incorrect: 'results.chipIncorrect', timeout: 'results.chipTimeout' };
        el.reviewList.replaceChildren(
            ...review.map((item) => {
                const v = item[state.lang];
                const li = document.createElement('li');

                const q = document.createElement('p');
                q.className = 'review-q';
                q.textContent = v.question;
                const chip = document.createElement('span');
                chip.className = `chip ${item.status}`;
                chip.textContent = t(chipKey[item.status]);
                q.append(chip);
                li.append(q);

                const line = (labelKey, text) => {
                    const p = document.createElement('p');
                    p.className = 'review-line';
                    const strong = document.createElement('strong');
                    strong.textContent = `${t(labelKey)} `;
                    p.append(strong, document.createTextNode(text));
                    return p;
                };
                li.append(line('results.yourAnswer', v.chosen === null ? t('results.noAnswer') : v.chosen));
                if (item.status !== 'correct') li.append(line('results.correctAnswer', v.correct));
                if (v.explanation) {
                    const ex = document.createElement('p');
                    ex.className = 'review-line';
                    ex.textContent = v.explanation;
                    li.append(ex);
                }
                return li;
            })
        );
    }

    function restart() {
        stopTimer();
        clearError();
        el.regForm.reset();
        for (const [key, input] of Object.entries(el.inputs)) {
            input.removeAttribute('aria-invalid');
            el.fieldErrors[key].hidden = true;
        }
        Object.assign(state, {
            sid: null,
            question: null,
            feedback: null,
            pendingChoice: null,
            notice: null,
            finishing: false,
            outcome: null
        });
        setBusy(false);
        el.reviewDetails.open = false;
        el.progressBar.style.width = '0%';
        showView('registration');
        el.inputs.name.focus();
    }

    function rerender() {
        applyStaticTexts();
        refreshFieldErrors();
        renderError();
        if (state.view === 'quiz') renderQuestion();
        if (state.view === 'results') renderResults();
    }

    // ---------- EVENTS ----------
    el.langToggle.addEventListener('click', () => {
        state.lang = state.lang === 'fr' ? 'en' : 'fr';
        writePref(STORAGE_KEYS.lang, state.lang);
        rerender();
    });

    el.themeToggle.addEventListener('click', () => {
        state.theme = currentTheme() === 'dark' ? 'light' : 'dark';
        writePref(STORAGE_KEYS.theme, state.theme);
        applyTheme();
    });

    darkQuery.addEventListener('change', () => {
        if (!state.theme) applyTheme();
    });

    el.regForm.addEventListener('submit', (event) => {
        event.preventDefault();
        startQuiz();
    });

    for (const [key, input] of Object.entries(el.inputs)) {
        input.addEventListener('input', () => {
            if (input.value.trim()) {
                input.removeAttribute('aria-invalid');
                el.fieldErrors[key].hidden = true;
            }
        });
    }

    el.nextBtn.addEventListener('click', goNext);
    el.restartBtn.addEventListener('click', restart);

    window.addEventListener('beforeunload', (event) => {
        if (state.view === 'quiz') {
            event.preventDefault();
            event.returnValue = t('leaveWarning');
        }
    });

    // ---------- INIT ----------
    applyTheme();
    applyStaticTexts();
    showView('registration');
})();
