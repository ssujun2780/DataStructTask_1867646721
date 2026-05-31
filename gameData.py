import json
import os
from functools import lru_cache
from pathlib import Path

from core.text_manager import TextManager


PROJECT_ROOT = Path(__file__).resolve().parent
JSON_DIR = PROJECT_ROOT / "json"
LOCALISATION_DIR = PROJECT_ROOT / "localisation"


@lru_cache(maxsize=None)
def load_json(filename):
    path = JSON_DIR / filename
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


@lru_cache(maxsize=None)
def load_localised_json(language, *path_parts):
    path = LOCALISATION_DIR / language
    for part in path_parts:
        path = path / part
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


_text_manager = TextManager(load_localised_json, language="ko")


def config(*keys):
    value = load_json("gameConfig.json")
    for key in keys:
        value = value[key]
    return value


def text(*keys, **values):
    return _text_manager.render(*keys, **values)


def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")


def pause(message=None):
    input(message or text("common", "continue"))


def read_int(prompt=None, eof_message=None, value_message=None):
    while True:
        try:
            return int(input(prompt or text("common", "prompt")))
        except EOFError:
            print(eof_message or text("common", "eofPrintRetry"))
        except ValueError:
            print(value_message or text("common", "valuePrintRetry"))


def pause_for_int(prompt=None, eof_message=None, value_message=None):
    while True:
        try:
            return int(input(prompt or text("common", "prompt")))
        except EOFError:
            input(eof_message or text("common", "eofRetry"))
        except ValueError:
            input(value_message or text("common", "valueRetry"))


def read_choice(valid_choices, prompt=None, invalid_message=None):
    valid_choices = set(valid_choices)
    while True:
        choice = pause_for_int(prompt)
        if choice in valid_choices:
            return choice
        input(invalid_message or text("common", "invalidAction"))


def read_yes_no(prompt=None):
    while True:
        try:
            choice = input(prompt or text("common", "yesNoPrompt")).strip().lower()
        except EOFError:
            print(text("common", "eofPrintRetry"))
            continue
        if choice in {"y", "n"}:
            return choice
        print(text("init", "retry"))


def average_gpa(player):
    completed_semesters = max(1, player.semester - 1)
    return round(player.gpa / completed_semesters, 1)
