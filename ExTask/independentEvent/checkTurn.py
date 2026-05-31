from core.action_manager import ActionManager
from core.actions import PlayerActionType, playerActionFromMenu, validPlayerActionMenus
from core.event_manager import EventManager
from core.exam_manager import ExamManager
from core.interaction_manager import InteractionManager
from core.semester_manager import SemesterManager
from core.turn_manager import TurnManager
from cli.info_view import showInfoMenu
from cli.turn_view import printTurnScreen
import event.friendEvent as fE
import independentEvent.checkEnding as cE
from gameData import clear_screen, config, pause, read_choice, text
from richCompat import Console


console = Console()

turnManager = TurnManager(
    actionManager=ActionManager(),
    interactionManager=InteractionManager(),
    examManager=ExamManager(),
    eventManager=EventManager(),
    semesterManager=SemesterManager(),
    printTurnScreen=printTurnScreen,
    showInfoMenu=showInfoMenu,
    readChoice=read_choice,
    validPlayerActionMenus=validPlayerActionMenus,
    playerActionFromMenu=playerActionFromMenu,
    playerActionType=PlayerActionType,
    callFriend=fE.callFriend,
    advicePlayFriendEvent=fE.advicePlayFriendEvent,
    checkSemesterEnding=cE.checkSemesterEnding,
    checkTurnEnding=cE.checkTurnEnding,
    clearScreen=clear_screen,
    pause=pause,
    config=config,
    text=text,
    printMessage=print,
    printWarning=console.print,
)


def turnState(gameState):
    return turnManager.runTurn(gameState)


def turn(player, friend, repeat, professorPool, semesterProfessorPool, grade, semester, semesterTurn, maxTurn, difficulty, graduateRouteStep):
    return turnManager.runLegacyTurn(
        player,
        friend,
        repeat,
        professorPool,
        semesterProfessorPool,
        grade,
        semester,
        semesterTurn,
        maxTurn,
        difficulty,
        graduateRouteStep,
    )[0]
