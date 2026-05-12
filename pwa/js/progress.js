const Progress = (() => {
  const KEY = 'deutsch_progress';

  const defaults = () => ({
    started: new Date().toISOString().slice(0, 10),
    currentLevel: 'A1',
    currentLesson: 'A1_01',
    streak: 0,
    lastStudyDate: null,
    totalSessions: 0,
    totalMinutes: 0,
    completedLessons: [],   // ['A1_01', 'A1_02', ...]
    testScores: {},          // {'A1_01': {score:80, date:'2026-05-12', passed:true}}
    flashcards: [],          // array of SRS card objects
    sessionStarted: null
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
    } catch { return defaults(); }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function get() { return load(); }

  function completeLesson(lessonId, score, cards) {
    const data = load();
    if (!data.completedLessons.includes(lessonId)) {
      data.completedLessons.push(lessonId);
    }
    data.testScores[lessonId] = {
      score,
      date: new Date().toISOString().slice(0, 10),
      passed: score >= 70
    };

    // Add new vocab to flashcards (avoid duplicates)
    const existingDe = new Set(data.flashcards.map(c => c.de));
    for (const card of cards) {
      if (!existingDe.has(card.de)) {
        const newCard = SRS.newCard(card.de, card.pl, card.example || '', lessonId);
        // Lower ease for failed test
        if (score < 70) newCard.ease = 1.8;
        data.flashcards.push(newCard);
      }
    }

    // Advance current lesson pointer
    const nextLesson = _nextLesson(data, lessonId);
    if (nextLesson) data.currentLesson = nextLesson;

    // Update streak
    _updateStreak(data);
    data.totalSessions++;

    save(data);
    return data;
  }

  function recordReview(de, quality) {
    const data = load();
    const idx = data.flashcards.findIndex(c => c.de === de);
    if (idx >= 0) {
      data.flashcards[idx] = SRS.review(data.flashcards[idx], quality);
    }
    _updateStreak(data);
    save(data);
  }

  function recordSession(minutes) {
    const data = load();
    data.totalMinutes += minutes;
    data.totalSessions++;
    _updateStreak(data);
    save(data);
  }

  function _updateStreak(data) {
    const today = new Date().toISOString().slice(0, 10);
    if (data.lastStudyDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    data.streak = data.lastStudyDate === yesterday ? data.streak + 1 : 1;
    data.lastStudyDate = today;
  }

  function _nextLesson(data, currentId) {
    // Find next lesson ID in curriculum
    const allIds = CURRICULUM.levels.flatMap(lvl =>
      CURRICULUM[lvl].lessons.map(l => l.id)
    );
    const idx = allIds.indexOf(currentId);
    return idx >= 0 && idx < allIds.length - 1 ? allIds[idx + 1] : null;
  }

  function isLessonDone(lessonId) {
    return load().completedLessons.includes(lessonId);
  }

  function isLessonUnlocked(lessonId) {
    const data = load();
    const allIds = CURRICULUM.levels.flatMap(lvl =>
      CURRICULUM[lvl].lessons.map(l => l.id)
    );
    const idx = allIds.indexOf(lessonId);
    if (idx === 0) return true;
    return data.completedLessons.includes(allIds[idx - 1]);
  }

  function exportJSON() {
    return JSON.stringify(load(), null, 2);
  }

  function importJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      save({ ...defaults(), ...data });
      return true;
    } catch { return false; }
  }

  function exportAnkiTxt() {
    const data = load();
    const lines = ['#separator:tab', '#html:false', '#notetype:Basic', '#columns:Front\tBack\n'];
    for (const card of data.flashcards) {
      lines.push(`${card.de}\t${card.pl}`);
    }
    return lines.join('\n');
  }

  return { get, save: data => save(data), completeLesson, recordReview, recordSession,
           isLessonDone, isLessonUnlocked, exportJSON, importJSON, exportAnkiTxt };
})();
