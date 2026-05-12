#!/usr/bin/env python3
"""
Eksportuje słówka z progress.json do Anki.
Tryby:
  python export_anki.py txt        → vocab_export.txt (import do Anki)
  python export_anki.py apkg       → german_deck.apkg (wymaga: pip install genanki)
  python export_anki.py txt A1     → tylko słówka z poziomu A1
"""

import json
import sys
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROGRESS_FILE = os.path.join(BASE_DIR, "progress.json")
VOCAB_DIR = os.path.join(BASE_DIR, "vocabulary")

def load_flashcards():
    with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("flashcards", {})

def load_all_vocab(level_filter=None):
    """Ładuje słówka z plików vocabulary/*.md"""
    cards = []
    for fname in sorted(os.listdir(VOCAB_DIR)):
        if not fname.endswith(".md"):
            continue
        if level_filter and not fname.startswith(level_filter):
            continue
        with open(os.path.join(VOCAB_DIR, fname), "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("|") and not line.startswith("| Niemiec") and not line.startswith("|---"):
                    parts = [p.strip() for p in line.strip("|").split("|")]
                    if len(parts) >= 2 and parts[0] and parts[1] and parts[0] != "Niemiecki":
                        cards.append((parts[0], parts[1]))
    return cards

def export_txt(cards, output="vocab_export.txt"):
    path = os.path.join(BASE_DIR, output)
    with open(path, "w", encoding="utf-8") as f:
        f.write("#separator:tab\n")
        f.write("#html:false\n")
        f.write("#notetype:Basic\n")
        f.write("#deck:Niemiecki\n")
        f.write("#columns:Front\tBack\n\n")
        for german, polish in cards:
            f.write(f"{german}\t{polish}\n")
    print(f"✓ Wyeksportowano {len(cards)} słówek → {path}")
    print("  Import do Anki: File → Import → wybierz plik → separator: Tab")

def export_apkg(cards, output="german_deck.apkg"):
    try:
        import genanki
    except ImportError:
        print("Brak biblioteki genanki. Zainstaluj: pip install genanki")
        print("Na razie eksportuje do .txt zamiast .apkg")
        export_txt(cards, output.replace(".apkg", ".txt"))
        return

    model = genanki.Model(
        1234567890,
        "Niemicki Model",
        fields=[{"name": "Niemiecki"}, {"name": "Polski"}],
        templates=[{
            "name": "PL→DE",
            "qfmt": "{{Polski}}",
            "afmt": "{{FrontSide}}<hr>{{Niemiecki}}",
        }, {
            "name": "DE→PL",
            "qfmt": "{{Niemiecki}}",
            "afmt": "{{FrontSide}}<hr>{{Polski}}",
        }]
    )

    deck = genanki.Deck(9876543210, "Niemiecki::A1-A2")
    for german, polish in cards:
        note = genanki.Note(model=model, fields=[german, polish])
        deck.add_note(note)

    path = os.path.join(BASE_DIR, output)
    genanki.Package(deck).write_to_file(path)
    print(f"✓ Wyeksportowano {len(cards)} słówek → {path}")
    print("  Import do Anki: File → Import → wybierz .apkg")

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "txt"
    level = sys.argv[2].upper() if len(sys.argv) > 2 else None

    cards = load_all_vocab(level)
    if not cards:
        print("Brak słówek do eksportu. Ukończ najpierw jakąś lekcję.")
        sys.exit(0)

    print(f"Znaleziono {len(cards)} słówek{f' (poziom {level})' if level else ''}.")

    if mode == "apkg":
        export_apkg(cards)
    else:
        export_txt(cards)
