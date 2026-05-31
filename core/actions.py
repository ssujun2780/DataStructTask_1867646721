from dataclasses import dataclass
from enum import Enum


class PlayerActionType(Enum):
    STUDY = "study"
    PLAY = "play"
    EXERCISE = "exercise"
    REST = "rest"
    INFO = "info"


@dataclass(frozen=True)
class PlayerAction:
    actionType: PlayerActionType
    source: str = "cli"


MENU_ACTIONS = {
    1: PlayerActionType.STUDY,
    2: PlayerActionType.PLAY,
    3: PlayerActionType.EXERCISE,
    4: PlayerActionType.REST,
    5: PlayerActionType.INFO,
}


def playerActionFromMenu(selection):
    return PlayerAction(MENU_ACTIONS[selection])


def validPlayerActionMenus():
    return list(MENU_ACTIONS.keys())
