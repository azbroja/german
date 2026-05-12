// ── State ──────────────────────────────────────────────────
let view = 'home';
let testState = null;
let reviewState = null;
let lessonId = null;

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  setupNav();
  navigate('home');
});

function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });
}

function navigate(v, params = {}) {
  view = v;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));

  const content = document.getElementById('content');
  if (v === 'home')     content.innerHTML = renderHome();
  if (v === 'lesson')   content.innerHTML = params.id ? renderLesson(params.id) : renderLessonList();
  if (v === 'review')   content.innerHTML = renderReview();
  if (v === 'progress') content.innerHTML = renderProgress();

  bindEvents();
  content.scrollTop = 0;
}

function bindEvents() {
  // Lesson start
  document.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', () => handleAction(el.dataset.action, el.dataset));
  });
}

function handleAction(action, data) {
  if (action === 'go-lesson')    navigate('lesson', {id: data.id});
  if (action === 'go-review')    navigate('review');
  if (action === 'start-test')   startTest(data.id);
  if (action === 'export-anki')  downloadAnki();
  if (action === 'export-json')  downloadJSON();
  if (action === 'import-json')  importJSON();
  if (action === 'toggle-grammar') toggleGrammar();
}

// ── Home ───────────────────────────────────────────────────
function renderHome() {
  const p = Progress.get();
  const cards = p.flashcards || [];
  const dueCards = SRS.getDueCards(cards);
  const lesson = CURRICULUM.getLesson(p.currentLesson);
  const today = new Date().toLocaleDateString('pl-PL', {weekday:'long', day:'numeric', month:'long'});

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';

  return `
    <div class="streak-banner">
      <div>
        <div style="font-size:14px;opacity:.8">${greeting}! 👋</div>
        <div style="font-size:13px;opacity:.7;margin-top:2px">${today}</div>
      </div>
      <div style="text-align:right">
        <div class="streak-count">${p.streak}</div>
        <div class="streak-label">🔥 dni z rzędu</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-val">${p.completedLessons.length}</div>
        <div class="stat-lbl">Lekcje ukończone</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${cards.length}</div>
        <div class="stat-lbl">Słówka w SRS</div>
      </div>
      <div class="stat-box">
        <div class="stat-val" style="color:${dueCards.length > 0 ? 'var(--danger)' : 'var(--success)'}">${dueCards.length}</div>
        <div class="stat-lbl">Do powtórki dziś</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${p.totalSessions}</div>
        <div class="stat-lbl">Sesje łącznie</div>
      </div>
    </div>

    <p class="section-title">Dzisiaj do zrobienia</p>
    <div class="card" style="padding:0">
      ${lesson ? `
      <div class="task-row" data-action="go-lesson" data-id="${lesson.id}" style="padding:12px 16px">
        <div class="task-icon">📖</div>
        <div>
          <div class="task-title">${lesson.title}</div>
          <div class="task-sub"><span class="badge badge-${lesson.level}">${lesson.level}</span> Lekcja ${lesson.num}</div>
        </div>
        <div class="task-arrow">›</div>
      </div>` : '<div class="task-row" style="padding:12px 16px"><div class="task-icon">🏆</div><div class="task-title">Ukończono wszystkie lekcje!</div></div>'}

      <div class="task-row" data-action="go-review" style="padding:12px 16px; ${dueCards.length === 0 ? 'opacity:.5' : ''}">
        <div class="task-icon" style="background:${dueCards.length > 0 ? '#fde8e8' : 'var(--primary-light)'}">🃏</div>
        <div>
          <div class="task-title">Powtórki SRS</div>
          <div class="task-sub">${dueCards.length > 0 ? `${dueCards.length} kart czeka` : cards.length === 0 ? 'Ukończ lekcję żeby dodać słówka' : 'Wszystko na bieżąco ✓'}</div>
        </div>
        <div class="task-arrow">›</div>
      </div>
    </div>

    ${renderLevelProgress(p)}
  `;
}

function renderLevelProgress(p) {
  return CURRICULUM.levels.map(lvl => {
    const L = CURRICULUM[lvl];
    const done = p.completedLessons.filter(id => id.startsWith(lvl + '_')).length;
    const pct = Math.round((done / L.lessonsTotal) * 100);
    const unlocked = CURRICULUM.isLevelUnlocked(lvl, p.completedLessons);
    return `
      <div class="card" style="padding:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div>
            <span class="badge badge-${unlocked ? lvl : 'locked'}">${lvl}</span>
            <span style="font-size:13px;font-weight:600;margin-left:6px">${L.namePl}</span>
          </div>
          <span style="font-size:12px;color:var(--text-muted)">${done}/${L.lessonsTotal}</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-bar${done === L.lessonsTotal ? ' success' : ''}" style="width:${pct}%"></div>
        </div>
        ${!unlocked ? '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">🔒 Ukończ poprzedni poziom</div>' : ''}
      </div>`;
  }).join('');
}

// ── Lesson list ────────────────────────────────────────────
function renderLessonList() {
  const p = Progress.get();
  return CURRICULUM.levels.map(lvl => {
    const L = CURRICULUM[lvl];
    const unlocked = CURRICULUM.isLevelUnlocked(lvl, p.completedLessons);
    const done = p.completedLessons.filter(id => id.startsWith(lvl + '_')).length;
    const pct = Math.round((done / L.lessonsTotal) * 100);
    return `
      <div class="level-section">
        <div class="level-section-header">
          <span class="badge badge-${unlocked ? lvl : 'locked'}">${lvl}</span>
          <span class="level-section-name">${L.namePl}</span>
          <span class="level-section-count">${done}/${L.lessonsTotal}</span>
        </div>
        ${unlocked ? `<div class="progress-wrap" style="margin-bottom:10px"><div class="progress-bar${done === L.lessonsTotal ? ' success' : ''}" style="width:${pct}%"></div></div>` : ''}
        <div class="lesson-list">
          ${L.lessons.map(lesson => {
            const isDone = p.completedLessons.includes(lesson.id);
            const score = p.testScores[lesson.id];
            const isUnlocked = Progress.isLessonUnlocked(lesson.id);
            const isCurrent = p.currentLesson === lesson.id;
            return `
              <div class="lesson-card ${isDone ? 'lesson-done' : ''} ${!isUnlocked ? 'lesson-locked' : ''} ${isCurrent && !isDone ? 'lesson-current' : ''}"
                   ${isUnlocked ? `data-action="go-lesson" data-id="${lesson.id}"` : ''}>
                <div class="lesson-card-icon">${isDone ? '✅' : !isUnlocked ? '🔒' : isCurrent ? '▶️' : '○'}</div>
                <div class="lesson-card-body">
                  <div class="lesson-card-title">${lesson.num}. ${lesson.title}</div>
                  <div class="lesson-card-meta">${lesson.vocab.length} słówek${score ? ` · ${score.score}%` : ''}</div>
                </div>
                ${isUnlocked ? '<div class="lesson-card-arrow">›</div>' : ''}
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }).join('');
}

// ── Lesson detail ───────────────────────────────────────────
function renderLesson(id) {
  const lesson = CURRICULUM.getLesson(id);
  if (!lesson) return '<div class="empty-state"><div class="empty-icon">🎓</div><p>Nie znaleziono lekcji</p></div>';

  const p = Progress.get();
  const done = p.completedLessons.includes(id);
  const unlocked = Progress.isLessonUnlocked(id);
  const score = p.testScores[id];

  const backBtn = `<button class="btn-back" onclick="navigate('lesson')">‹ Lista lekcji</button>`;

  if (!unlocked) {
    return `${backBtn}<div class="empty-state"><div class="empty-icon">🔒</div><p>Ukończ poprzednią lekcję, żeby odblokować tę.</p></div>`;
  }

  if (lesson.vocab.length === 0 && lesson.level !== 'A1' && lesson.level !== 'A2') {
    return `${backBtn}
      <div class="lesson-header">
        <span class="badge badge-${lesson.level}">${lesson.level}</span>
        <div class="lesson-title">${lesson.num}. ${lesson.title}</div>
        <div class="lesson-meta">🔒 Treść tej lekcji odblokuje się po ukończeniu poprzedniego poziomu.</div>
      </div>`;
  }

  const dialogueHtml = lesson.dialogue ? `
    ${lesson.intro ? `<div class="dialogue-intro">📍 ${lesson.intro}</div>` : ''}
    <div class="dialogue-toggle-row">
      <p class="section-title" style="margin:0">Dialog</p>
      <button class="btn-translate-toggle" id="translate-toggle" onclick="toggleTranslations()">Pokaż tłumaczenie</button>
    </div>
    <div class="dialogue-box">
      ${lesson.dialogue.map((line, i) => `
        <div class="dialogue-line">
          <div class="dialogue-speaker">${line.s}</div>
          <div class="dialogue-bubble">
            <div class="dialogue-de">${line.de}</div>
            <div class="dialogue-pl hidden" id="dl-${i}">${line.pl}</div>
          </div>
        </div>`).join('')}
    </div>
    ${lesson.cultural ? `<div class="cultural-note">🇩🇪 ${lesson.cultural}</div>` : ''}
  ` : '';

  const vocabRows = lesson.vocab.map(([de, pl, ex]) => `
    <tr>
      <td><div class="vocab-de">${de}</div>${ex ? `<div class="vocab-ex">${ex}</div>` : ''}</td>
      <td style="color:var(--text-muted)">${pl}</td>
    </tr>`).join('');

  return `
    ${backBtn}
    <div class="lesson-header">
      <span class="badge badge-${lesson.level}">${lesson.level}</span>
      <div class="lesson-title">${lesson.num}. ${lesson.title}</div>
      <div class="lesson-meta">${lesson.vocab.length} słówek
        ${done ? ' · <span style="color:var(--success)">✓ Ukończona</span>' : ''}
        ${score ? ` · Test: <strong>${score.score}%</strong>` : ''}
      </div>
    </div>

    ${dialogueHtml}

    ${lesson.vocab.length > 0 ? `
    <p class="section-title">${lesson.dialogue ? 'Słownictwo z dialogu' : 'Słownictwo'}</p>
    <div class="card" style="padding:0 12px">
      <table class="vocab-table">
        <thead><tr><th>Niemiecki</th><th>Polski</th></tr></thead>
        <tbody>${vocabRows}</tbody>
      </table>
    </div>` : ''}

    ${lesson.grammar.content ? `
    <div class="grammar-box" data-action="toggle-grammar" id="grammar-box">
      <div class="grammar-title">📐 ${lesson.grammar.title}</div>
      <div class="grammar-content" style="white-space:pre-line">${lesson.grammar.content}</div>
      ${lesson.grammar.note ? `<div class="grammar-note">💡 ${lesson.grammar.note}</div>` : ''}
    </div>` : ''}

    ${lesson.tests.length > 0 ? `
    <div style="margin-top:16px">
      ${!done ? `
        <button class="btn btn-primary btn-full" data-action="start-test" data-id="${id}">
          📝 Zrób test (${lesson.tests.length} pytań)
        </button>` : `
        <div class="flex-gap">
          <button class="btn btn-outline" style="flex:1" data-action="start-test" data-id="${id}">🔁 Powtórz test</button>
          <button class="btn btn-ghost" style="flex:1" data-action="go-lesson" data-id="${_nextLessonId(id)}">Następna →</button>
        </div>`}
    </div>` : ''}
  `;
}

let translationsVisible = false;
function toggleTranslations() {
  translationsVisible = !translationsVisible;
  document.querySelectorAll('[id^="dl-"]').forEach(el => el.classList.toggle('hidden', !translationsVisible));
  const btn = document.getElementById('translate-toggle');
  if (btn) btn.textContent = translationsVisible ? 'Ukryj tłumaczenie' : 'Pokaż tłumaczenie';
}

function toggleGrammar() {
  const box = document.getElementById('grammar-box');
  if (box) {
    const content = box.querySelector('.grammar-content');
    const note = box.querySelector('.grammar-note');
    if (content) content.classList.toggle('hidden');
    if (note)    note.classList.toggle('hidden');
  }
}

function _nextLessonId(currentId) {
  const all = CURRICULUM.allIds();
  const idx = all.indexOf(currentId);
  return idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
}

// ── Test ───────────────────────────────────────────────────
function startTest(id) {
  const lesson = CURRICULUM.getLesson(id);
  if (!lesson || lesson.tests.length === 0) return;

  const questions = [...lesson.tests].sort(() => Math.random() - 0.5);
  testState = { lessonId: id, questions, current: 0, score: 0, answered: false };

  const overlay = document.getElementById('test-overlay');
  overlay.classList.remove('hidden');
  renderTestQuestion();
}

function renderTestQuestion() {
  if (!testState) return;
  const { questions, current } = testState;
  const total = questions.length;
  const q = questions[current];

  const overlay = document.getElementById('test-overlay');
  overlay.querySelector('#test-header-info').innerHTML = `
    <span style="flex:1;font-weight:700">Test — Lekcja ${CURRICULUM.getLesson(testState.lessonId)?.num}</span>
    <span style="color:var(--text-muted)">${current + 1}/${total}</span>`;
  overlay.querySelector('#test-progress').style.width = `${((current) / total) * 100}%`;

  const body = overlay.querySelector('#test-body');

  if (q.type === 'choice') {
    const opts = [...q.opts].sort(() => Math.random() - 0.5);
    body.innerHTML = `
      <div class="test-q-num">Pytanie ${current + 1} z ${total}</div>
      <div class="test-q-text">${q.q}</div>
      <div class="choice-grid">
        ${opts.map(opt => `<button class="choice-btn" data-opt="${opt}">${opt}</button>`).join('')}
      </div>
      <div id="feedback" class="feedback-box hidden"></div>
      <div id="next-btn" class="mt-12 hidden">
        <button class="btn btn-primary btn-full" onclick="nextQuestion()">Dalej →</button>
      </div>`;

    body.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (testState.answered) return;
        testState.answered = true;
        const correct = btn.dataset.opt === q.a;
        if (correct) testState.score++;
        btn.classList.add(correct ? 'correct' : 'wrong');
        if (!correct) {
          body.querySelectorAll('.choice-btn').forEach(b => {
            if (b.dataset.opt === q.a) b.classList.add('reveal');
          });
        }
        showFeedback(correct, q.a);
      });
    });
  } else {
    body.innerHTML = `
      <div class="test-q-num">Pytanie ${current + 1} z ${total} — ${q.type === 'pl_de' ? '🇵🇱→🇩🇪' : q.type === 'de_pl' ? '🇩🇪→🇵🇱' : '📝 Uzupełnij'}</div>
      <div class="test-q-text">${q.q}</div>
      ${q.hint ? `<div class="test-q-hint">💡 ${q.hint}</div>` : ''}
      <input class="answer-input" id="answer-input" type="text" placeholder="Wpisz odpowiedź..." autocomplete="off" autocorrect="off">
      <div class="mt-8">
        <button class="btn btn-primary btn-full" id="submit-btn">Sprawdź</button>
      </div>
      <div id="feedback" class="feedback-box hidden"></div>
      <div id="next-btn" class="mt-12 hidden">
        <button class="btn btn-primary btn-full" onclick="nextQuestion()">Dalej →</button>
      </div>`;

    const input = body.querySelector('#answer-input');
    const submitBtn = body.querySelector('#submit-btn');

    const check = () => {
      if (testState.answered) return;
      testState.answered = true;
      const val = input.value.trim();
      const correct = normalize(val) === normalize(q.a);
      if (correct) testState.score++;
      input.classList.add(correct ? 'correct' : 'wrong');
      input.disabled = true;
      submitBtn.classList.add('hidden');
      showFeedback(correct, q.a);
    };

    submitBtn.addEventListener('click', check);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    input.focus();
  }
}

function normalize(s) {
  return s.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/\(.*?\)/g,'').replace(/\s+/g,' ').trim();
}

function showFeedback(correct, answer) {
  testState.answered = true;
  const fb = document.getElementById('feedback');
  fb.className = `feedback-box ${correct ? 'correct' : 'wrong'}`;
  fb.innerHTML = correct ? '✓ Poprawnie!' : `✗ Poprawna odpowiedź: <strong>${answer}</strong>`;
  fb.classList.remove('hidden');
  document.getElementById('next-btn').classList.remove('hidden');
}

function nextQuestion() {
  testState.current++;
  testState.answered = false;
  if (testState.current >= testState.questions.length) {
    finishTest();
  } else {
    renderTestQuestion();
  }
}

function finishTest() {
  const { lessonId, score, questions } = testState;
  const total = questions.length;
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 70;
  const lesson = CURRICULUM.getLesson(lessonId);

  // Save progress
  Progress.completeLesson(lessonId, pct, lesson.vocab.map(([de, pl, ex]) => ({de, pl, example: ex})));

  const overlay = document.getElementById('test-overlay');
  overlay.querySelector('#test-body').innerHTML = `
    <div class="score-card">
      <div class="score-num ${passed ? 'score-pass' : 'score-fail'}">${pct}%</div>
      <div class="score-msg">${passed ? '🎉 Zaliczono!' : '😕 Niezaliczono'}</div>
      <div class="score-sub">${score} / ${total} poprawnych odpowiedzi · Próg: 70%</div>
      ${passed
        ? `<div class="mt-16" style="color:var(--success);font-size:14px">✓ Słówka dodane do powtórek SRS</div>`
        : `<div class="mt-16" style="color:var(--text-muted);font-size:14px">Słówka dodane do SRS z niższą łatwością. Spróbuj ponownie!</div>`}
      <div class="flex-gap mt-16" style="flex-direction:column">
        <button class="btn btn-primary btn-full" onclick="closeTest()">
          ${passed ? '→ Następna lekcja' : '🔁 Spróbuj ponownie'}
        </button>
        <button class="btn btn-outline btn-full" onclick="closeTest(true)">Wróć do lekcji</button>
      </div>
    </div>`;

  overlay.querySelector('#test-header-info').textContent = 'Wynik';
  overlay.querySelector('#test-progress').style.width = '100%';
}

function closeTest(stayOnLesson = false) {
  document.getElementById('test-overlay').classList.add('hidden');
  const p = Progress.get();
  if (stayOnLesson) {
    navigate('lesson', {id: testState.lessonId});
  } else {
    navigate('lesson', {id: p.currentLesson});
  }
  testState = null;
}

// ── Review (SRS) ───────────────────────────────────────────
function renderReview() {
  const p = Progress.get();
  const due = SRS.getDueCards(p.flashcards || []);

  if (due.length === 0) {
    const stats = SRS.getStats(p.flashcards || []);
    return `
      <div class="empty-state">
        <div class="empty-icon">🎉</div>
        <p style="font-weight:700;font-size:18px">Wszystko na bieżąco!</p>
        <p style="margin-top:8px">Brak kart do powtórki na dziś.</p>
        <div class="stats-grid mt-16">
          <div class="stat-box"><div class="stat-val">${stats.total}</div><div class="stat-lbl">Wszystkie</div></div>
          <div class="stat-box"><div class="stat-val">${stats.learning}</div><div class="stat-lbl">W nauce</div></div>
          <div class="stat-box"><div class="stat-val">${stats.mature}</div><div class="stat-lbl">Opanowane</div></div>
          <div class="stat-box"><div class="stat-val">${stats.new}</div><div class="stat-lbl">Nowe</div></div>
        </div>
      </div>`;
  }

  reviewState = { cards: [...due].sort(() => Math.random() - 0.5), current: 0, revealed: false, sessionDone: 0 };
  return renderReviewCard();
}

function renderReviewCard() {
  const { cards, current, sessionDone } = reviewState;
  const total = cards.length;
  if (current >= total) return renderReviewDone(sessionDone, total);

  const card = cards[current];
  const showFront = !reviewState.revealed;

  return `
    <div style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:13px;color:var(--text-muted)">${current}/${total} ukończono</span>
      <span class="badge badge-${card.lessonId?.slice(0,2) || 'A1'}">${card.lessonId?.slice(0,2) || 'A1'}</span>
    </div>
    <div class="progress-wrap" style="margin-bottom:16px">
      <div class="progress-bar" style="width:${(current/total)*100}%"></div>
    </div>

    <div class="flashcard" id="flashcard" onclick="revealCard()">
      ${showFront
        ? `<div class="flashcard-front">${card.de}</div>
           <div class="flashcard-hint">👆 Dotknij żeby odsłonić</div>`
        : `<div class="flashcard-front">${card.de}</div>
           <div class="flashcard-back">${card.pl}</div>
           ${card.example ? `<div class="flashcard-example">${card.example}</div>` : ''}`
      }
    </div>

    ${showFront ? '' : `
    <p class="section-title" style="text-align:center">Jak dobrze wiedziałeś/aś?</p>
    <div class="rating-grid">
      <button class="rating-btn rating-1" onclick="rateCard(0)">😰<span>Nie wiem</span></button>
      <button class="rating-btn rating-2" onclick="rateCard(2)">🤔<span>Trudne</span></button>
      <button class="rating-btn rating-3" onclick="rateCard(3)">🙂<span>Umiałem/am</span></button>
      <button class="rating-btn rating-4" onclick="rateCard(4)">😊<span>Dobrze</span></button>
      <button class="rating-btn rating-5" onclick="rateCard(5)">🚀<span>Idealnie</span></button>
      <button class="rating-btn" style="background:var(--border);color:var(--text-muted)" onclick="rateCard(1)">↩️<span>Prawie</span></button>
    </div>`}
  `;
}

function revealCard() {
  if (reviewState.revealed) return;
  reviewState.revealed = true;
  document.getElementById('content').innerHTML = renderReviewCard();
  bindEvents();
}

function rateCard(quality) {
  const card = reviewState.cards[reviewState.current];
  Progress.recordReview(card.de, quality);
  if (quality >= 3) reviewState.sessionDone++;
  reviewState.current++;
  reviewState.revealed = false;
  document.getElementById('content').innerHTML = renderReviewCard();
  bindEvents();
}

function renderReviewDone(done, total) {
  return `
    <div class="empty-state">
      <div class="empty-icon">✅</div>
      <p style="font-weight:700;font-size:18px">Sesja ukończona!</p>
      <div class="stats-grid mt-16">
        <div class="stat-box"><div class="stat-val">${total}</div><div class="stat-lbl">Kart przejrzanych</div></div>
        <div class="stat-box"><div class="stat-val">${done}</div><div class="stat-lbl">Poprawnych</div></div>
      </div>
      <button class="btn btn-primary btn-full mt-16" onclick="navigate('home')">Wróć do głównej</button>
    </div>`;
}

// ── Progress ───────────────────────────────────────────────
function renderProgress() {
  const p = Progress.get();

  return `
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-val">${p.completedLessons.length}</div><div class="stat-lbl">Lekcje</div></div>
      <div class="stat-box"><div class="stat-val">${(p.flashcards||[]).length}</div><div class="stat-lbl">Słówka</div></div>
      <div class="stat-box"><div class="stat-val">${p.streak}</div><div class="stat-lbl">Dni z rzędu 🔥</div></div>
      <div class="stat-box"><div class="stat-val">${p.totalSessions}</div><div class="stat-lbl">Sesje</div></div>
    </div>

    ${CURRICULUM.levels.map(lvl => {
      const L = CURRICULUM[lvl];
      const unlocked = CURRICULUM.isLevelUnlocked(lvl, p.completedLessons);
      const done = p.completedLessons.filter(id => id.startsWith(lvl + '_')).length;
      return `
        <p class="section-title"><span class="badge badge-${unlocked ? lvl : 'locked'}">${lvl}</span> ${L.namePl} — ${done}/${L.lessonsTotal}</p>
        <div class="lesson-grid">
          ${L.lessons.map(lesson => {
            const isDone = p.completedLessons.includes(lesson.id);
            const score = p.testScores[lesson.id];
            const isUnlocked = Progress.isLessonUnlocked(lesson.id);
            return `
              <div class="lesson-item ${isDone ? 'done' : ''} ${!isUnlocked ? 'locked' : ''}"
                   data-action="go-lesson" data-id="${lesson.id}">
                <div class="lesson-num">${lesson.num}</div>
                <div class="lesson-name">${lesson.title}</div>
                <div style="display:flex;align-items:center;gap:6px">
                  ${score ? `<span class="lesson-score">${score.score}%</span>` : ''}
                  <span>${isDone ? '✅' : !isUnlocked ? '🔒' : '⬜'}</span>
                </div>
              </div>`;
          }).join('')}
        </div>`;
    }).join('')}

    <p class="section-title">Eksport</p>
    <div class="card" style="padding:0 16px">
      <div class="export-row">
        <div>
          <div style="font-weight:600;font-size:14px">📦 Eksport do Anki</div>
          <div style="font-size:12px;color:var(--text-muted)">Plik .txt gotowy do importu</div>
        </div>
        <button class="btn btn-sm btn-ghost" data-action="export-anki">Pobierz</button>
      </div>
      <div class="export-row">
        <div>
          <div style="font-weight:600;font-size:14px">💾 Kopia zapasowa</div>
          <div style="font-size:12px;color:var(--text-muted)">Zapisz progress.json</div>
        </div>
        <button class="btn btn-sm btn-ghost" data-action="export-json">Pobierz</button>
      </div>
      <div class="export-row">
        <div>
          <div style="font-weight:600;font-size:14px">📥 Przywróć kopię</div>
          <div style="font-size:12px;color:var(--text-muted)">Wczytaj progress.json</div>
        </div>
        <button class="btn btn-sm btn-outline" data-action="import-json">Wczytaj</button>
      </div>
    </div>
  `;
}

// ── Export / Import ────────────────────────────────────────
function downloadAnki() {
  const txt = Progress.exportAnkiTxt();
  const blob = new Blob([txt], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'deutsch_anki.txt';
  a.click(); URL.revokeObjectURL(url);
}

function downloadJSON() {
  const json = Progress.exportJSON();
  const blob = new Blob([json], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'progress.json';
  a.click(); URL.revokeObjectURL(url);
}

function importJSON() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const ok = Progress.importJSON(ev.target.result);
      if (ok) { alert('✓ Postęp przywrócony!'); navigate('progress'); }
      else    { alert('✗ Błąd wczytywania pliku'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// expose globals for inline onclick
window.nextQuestion = nextQuestion;
window.closeTest = closeTest;
window.revealCard = revealCard;
window.rateCard = rateCard;
window.navigate = navigate;
window.toggleTranslations = toggleTranslations;
