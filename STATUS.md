# Projekt: Nauka Niemieckiego A1→B2

**URL aplikacji:** https://azbroja.github.io/german/  
**Repo:** https://github.com/azbroja/german  
**Lokalizacja plików:** `/Users/andrzejzbroja/learning_german/`

---

## Co zostało zbudowane

### PWA (pwa/)
Progresywna aplikacja webowa do nauki niemieckiego, działa offline na iOS i Android.

| Plik | Opis |
|------|------|
| `pwa/index.html` | Shell aplikacji, bottom nav, test overlay |
| `pwa/manifest.json` | Konfiguracja PWA (`scope: /german/`) |
| `pwa/sw.js` | Service worker, cache-first, działa offline |
| `pwa/icon.svg` | Ikona (flaga DE + napis) |
| `pwa/css/app.css` | Cały styl: mobile-first, iOS safe-area, dialogue, lesson cards |
| `pwa/js/data.js` | Pełny program A1–B2: 12+16+20+20 lekcji, słownictwo, gramatyka, testy |
| `pwa/js/srs.js` | Algorytm SM-2 (spaced repetition, jak Anki) |
| `pwa/js/progress.js` | localStorage: postęp, SRS, serie, eksport |
| `pwa/js/app.js` | SPA: widoki Home / Lista lekcji / Lekcja / Powtórki / Postęp |

### 4 widoki aplikacji
1. **Główna** — streak, statystyki, zadania na dziś, progress poziomów
2. **Lekcja** — lista wszystkich lekcji pogrupowanych A1/A2/B1/B2 z ikonami statusu (▶️/🔒/✅)
3. **Powtórki** — fiszki SRS z oceną 0–5 (nie wiem / prawie / ok / dobrze / idealnie)
4. **Postęp** — wykresy postępu + eksport Anki (.txt) + backup JSON

### Treść lekcji (book-style)
Każda lekcja A1 ma:
- **Intro** — kontekst sytuacyjny (praca w berlińskiej firmie IT)
- **Dialog** — realistyczna rozmowa z przełącznikiem tłumaczenia PL/DE
- **Nota kulturowa** — wskazówka o kulturze niemieckiej
- **Słownictwo z dialogu** — tabela DE / PL z przykładami
- **Gramatyka** — z możliwością rozwinięcia/zwinięcia
- **Test** — 10 pytań, próg zaliczenia 70%

### Lekcje z pełną treścią
- **A1**: 12/12 lekcji — kompletne słownictwo + testy + dialog
- **A2**: 16/16 lekcji — kompletne słownictwo + testy (dialogi do dodania)
- **B1/B2**: 20+20 — tytuły i gramatyka (treść odblokuje się po A2)

### GitHub Actions (.github/workflows/)
| Workflow | Opis |
|----------|------|
| `pages.yml` | Deploy `pwa/` → GitHub Pages po każdym pushu na `main` |
| `reminder.yml` | Codzienne przypomnienie o nauce jako GitHub Issue (9:00 CET) |

### Skrypty (scripts/)
- `export_anki.py` — eksport słówek do `.txt` (Anki import) lub `.apkg`

---

## Architektura danych

```
localStorage['deutsch_progress'] = {
  currentLevel, currentLesson,
  completedLessons: ['A1_01', ...],
  testScores: { 'A1_01': { score: 85, date, passed: true } },
  flashcards: [{ de, pl, example, lessonId, interval, ease, reviews, due }],
  streak, lastStudyDate, totalSessions, totalMinutes
}
```

---

## Co zostało do zrobienia

- [ ] Dodać dialogi do lekcji A2 (styl taki sam jak A1)
- [ ] Dodać IPA do słówek (Fluent Forever: wymowa przed znaczeniem)
- [ ] Moduł wymowy A0 — dźwięki DE dla Polaków, minimalne pary
- [ ] Uzupełnić treść B1 (pierwsze 5 lekcji z pełnym słownictwem)
- [ ] Subskrybować GitHub Issue z reminderam (label: `study-journal`)
- [ ] Zainstalować PWA na telefonie: Safari → Share → "Dodaj do ekranu głównego"

---

## Jak odpalić lokalnie

```bash
cd /Users/andrzejzbroja/learning_german
python3 -m http.server 8080 --directory pwa/
# otwórz http://localhost:8080
```
