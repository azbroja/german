// SM-2 spaced repetition algorithm
const SRS = {
  // quality: 0=kompletnie nie wiem, 1=źle, 2=trudne, 3=ok, 4=dobrze, 5=idealnie
  review(card, quality) {
    const q = Math.max(0, Math.min(5, quality));
    let { interval = 1, ease = 2.5, reviews = 0 } = card;

    if (q >= 3) {
      if (reviews === 0)      interval = 1;
      else if (reviews === 1) interval = 6;
      else                    interval = Math.round(interval * ease);
      ease = Math.max(1.3, ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    } else {
      interval = 1;
      ease = Math.max(1.3, ease - 0.2);
    }

    const due = new Date();
    due.setDate(due.getDate() + interval);

    return {
      ...card,
      interval,
      ease: Math.round(ease * 100) / 100,
      reviews: reviews + 1,
      due: due.toISOString().slice(0, 10),
      lastQuality: q
    };
  },

  isDue(card) {
    const today = new Date().toISOString().slice(0, 10);
    return !card.due || card.due <= today;
  },

  newCard(de, pl, example = '', lessonId = '') {
    const today = new Date().toISOString().slice(0, 10);
    return { de, pl, example, lessonId, interval: 1, ease: 2.5, reviews: 0, due: today, lastQuality: null };
  },

  getDueCards(cards) {
    return cards.filter(c => SRS.isDue(c));
  },

  getStats(cards) {
    const today = new Date().toISOString().slice(0, 10);
    const due = cards.filter(c => SRS.isDue(c)).length;
    const new_ = cards.filter(c => c.reviews === 0).length;
    const learning = cards.filter(c => c.reviews > 0 && c.interval < 21).length;
    const mature = cards.filter(c => c.interval >= 21).length;
    return { total: cards.length, due, new: new_, learning, mature };
  }
};
