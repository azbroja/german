# Nauka Niemieckiego — A1 → A2 → B1

## Jak korzystać (komendy dla Claude)

| Komenda | Co robi |
|---------|---------|
| `/lekcja` | Kontynuuj bieżącą lekcję (Claude sprawdza progress.json) |
| `/test` | Test z bieżącej lekcji (10 pytań, próg 70%) |
| `/powtorki` | Wbudowane powtórki SRS — słówka, które dziś przypadają |
| `/postep` | Pokaż statystyki i co dalej |
| `/slowka [temat]` | Przeglądaj słówka z danego tematu |
| `/rozmowa` | Ćwiczenie konwersacyjne na bieżącym poziomie |
| `/gramatyka [temat]` | Wyjaśnienie zagadnienia gramatycznego |

## Eksport do Anki

```bash
# Plik .txt (import ręczny do Anki)
python scripts/export_anki.py txt

# Plik .apkg (gotowy deck — wymaga: pip install genanki)
python scripts/export_anki.py apkg

# Tylko słówka z A1
python scripts/export_anki.py apkg A1
```

## Statystyki z terminala

```bash
python scripts/update_progress.py status
```

---

## Plan A1 — 12 lekcji

| # | Temat | Status | Test |
|---|-------|--------|------|
| 1 | Powitania i przedstawianie się | ⬜ | ⬜ |
| 2 | Liczby 1–100 | ⬜ | ⬜ |
| 3 | Kolory i kształty | ⬜ | ⬜ |
| 4 | Rodzina | ⬜ | ⬜ |
| 5 | Jedzenie i napoje | ⬜ | ⬜ |
| 6 | Dni tygodnia, miesiące, czas | ⬜ | ⬜ |
| 7 | Dom i meble | ⬜ | ⬜ |
| 8 | Praca i zawody | ⬜ | ⬜ |
| 9 | Zakupy i pieniądze | ⬜ | ⬜ |
| 10 | Pogoda i przyroda | ⬜ | ⬜ |
| 11 | Transport i kierunki | ⬜ | ⬜ |
| 12 | Powtórzenie A1 + Egzamin końcowy | ⬜ | ⬜ |

## Plan A2 — 16 lekcji 🔒
*Odblokuje się po zdaniu egzaminu końcowego A1.*

---

## Legenda
- ⬜ Nie zaczęto
- 🔄 W trakcie
- ✅ Ukończono
- ✗ Test oblany (do powtórki)
