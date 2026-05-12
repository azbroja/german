#!/usr/bin/env python3
"""
Aktualizuje progress.json po lekcji lub teście.
Użycie (wywołuje Claude po każdej sesji):
  python update_progress.py lesson <numer>
  python update_progress.py test <numer> <wynik_procent>
  python update_progress.py review <slowo> <wynik: 0-5>
  python update_progress.py add_words <plik_vocab.md>
  python update_progress.py status
"""

import json
import sys
import os
from datetime import datetime, date, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROGRESS_FILE = os.path.join(BASE_DIR, "progress.json")

def load():
    with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save(data):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def today():
    return date.today().isoformat()

def complete_lesson(lesson_num):
    data = load()
    lesson_num = int(lesson_num)
    if lesson_num not in data["completed_lessons"]:
        data["completed_lessons"].append(lesson_num)
    data["current_lesson"] = lesson_num + 1
    data["last_session"] = today()
    data["total_sessions"] += 1

    level = data["current_level"]
    data["levels"][level]["lessons_done"] = len(
        [l for l in data["completed_lessons"] if l <= data["levels"][level]["lessons_total"]]
    )
    if data["levels"][level]["lessons_done"] >= data["levels"][level]["lessons_total"]:
        data["levels"][level]["status"] = "completed"
        data["levels"][level]["completed"] = today()
    save(data)
    print(f"✓ Lekcja {lesson_num} oznaczona jako ukończona. Następna: {lesson_num + 1}")

def record_test(lesson_num, score):
    data = load()
    data["test_scores"][str(lesson_num)] = {
        "score": int(score),
        "date": today(),
        "passed": int(score) >= 70
    }
    save(data)
    passed = "ZALICZONY ✓" if int(score) >= 70 else "NIEZALICZONY ✗ (próg: 70%)"
    print(f"✓ Test lekcji {lesson_num}: {score}% — {passed}")

def sm2_review(word, quality):
    """Algorytm SM-2 dla spaced repetition."""
    data = load()
    quality = int(quality)  # 0-5 (0=kompletnie nie wiem, 5=idealnie)

    cards = data.get("flashcards", {})
    card = cards.get(word, {
        "interval": 1, "ease": 2.5, "reviews": 0, "due": today(), "correct": 0, "wrong": 0
    })

    if quality >= 3:
        if card["reviews"] == 0:
            card["interval"] = 1
        elif card["reviews"] == 1:
            card["interval"] = 6
        else:
            card["interval"] = round(card["interval"] * card["ease"])
        card["ease"] = max(1.3, card["ease"] + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        card["correct"] = card.get("correct", 0) + 1
    else:
        card["interval"] = 1
        card["ease"] = max(1.3, card["ease"] - 0.2)
        card["wrong"] = card.get("wrong", 0) + 1

    card["reviews"] += 1
    card["due"] = (date.today() + timedelta(days=card["interval"])).isoformat()
    cards[word] = card
    data["flashcards"] = cards
    save(data)
    print(f"✓ {word}: następna powtórka za {card['interval']} dni ({card['due']})")

def add_words_from_vocab(vocab_file):
    """Dodaje słówka z pliku .md do flashcards."""
    data = load()
    cards = data.get("flashcards", {})
    added = 0
    with open(vocab_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("|") and not line.startswith("| Niemiec") and not line.startswith("|---"):
                parts = [p.strip() for p in line.strip("|").split("|")]
                if len(parts) >= 2 and parts[0] and parts[1] and parts[0] != "Niemiecki":
                    word = parts[0]
                    if word not in cards:
                        cards[word] = {
                            "translation": parts[1],
                            "interval": 1,
                            "ease": 2.5,
                            "reviews": 0,
                            "due": today(),
                            "correct": 0,
                            "wrong": 0
                        }
                        added += 1
    data["flashcards"] = cards
    save(data)
    print(f"✓ Dodano {added} nowych słówek do powtórek.")

def show_status():
    data = load()
    print(f"\n{'='*40}")
    print(f"  POSTĘP NAUKI — {data['user']}")
    print(f"{'='*40}")
    print(f"  Poziom:        {data['current_level']}")
    print(f"  Bieżąca lekcja: {data['current_lesson']}")
    print(f"  Ukończone:     {len(data['completed_lessons'])}/{data['levels'][data['current_level']]['lessons_total']} lekcji")
    print(f"  Sesje łącznie: {data['total_sessions']}")
    print(f"  Ostatnia sesja: {data['last_session'] or 'brak'}")

    cards = data.get("flashcards", {})
    due_today = [w for w, c in cards.items() if c.get("due", "9999") <= today()]
    print(f"\n  Słówka w systemie: {len(cards)}")
    print(f"  Do powtórki dziś: {len(due_today)}")

    scores = data.get("test_scores", {})
    if scores:
        print(f"\n  Testy:")
        for lesson, result in sorted(scores.items(), key=lambda x: int(x[0])):
            status = "✓" if result["passed"] else "✗"
            print(f"    Lekcja {lesson}: {result['score']}% {status}")
    print(f"{'='*40}\n")

COMMANDS = {
    "lesson": lambda args: complete_lesson(args[0]),
    "test": lambda args: record_test(args[0], args[1]),
    "review": lambda args: sm2_review(args[0], args[1]),
    "add_words": lambda args: add_words_from_vocab(args[0]),
    "status": lambda args: show_status(),
}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print("Użycie: python update_progress.py <komenda> [argumenty]")
        print("Komendy:", ", ".join(COMMANDS.keys()))
        sys.exit(1)
    COMMANDS[sys.argv[1]](sys.argv[2:])
