import sys

import independentEvent.checkEnding as cE
import independentEvent.checkTurn as cT
import independentEvent.initGame as ig
from core.game_state import GameState
from gameData import average_gpa


if __name__ == "__main__":
    if not ig.checkLibraries():
        sys.exit(0)

    if ig.startConsole():
        gameState = GameState.fromInitResult(ig.initGame())

        while True:
            ending = cT.turnState(gameState)
            if ending is not None:
                cE.printEnding(ending)
                sys.exit(0)
            if gameState.grade == 5:
                break

        ending = cE.checkFinalEnding(average_gpa(gameState.player))
        cE.printEnding(ending)
    else:
        sys.exit(0)
