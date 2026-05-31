from core.exam_manager import ExamManager
from gameData import config, text
from richCompat import Console


console = Console()
examManager = ExamManager()


def printTurnScreen(player, semesterProfessorPool, grade, semester, semesterTurn, maxTurn):
    print("-----------------------------")
    print(text("turn", "turnHeader", grade=grade, semester=semester, turns=maxTurn - semesterTurn))
    player.printInfo()
    predictedGpa = printPredictedScores(player, semesterProfessorPool)
    printWarnings(player, predictedGpa)
    printActionMenu()


def printPredictedScores(player, semesterProfessorPool):
    print(text("turn", "predictedScore"))
    predictedScores, predictedGpa = examManager.predictScores(player, semesterProfessorPool)
    for item in predictedScores:
        print(f"{item['courseName']}: {item['score']}")
    print()
    return predictedGpa


def printWarnings(player, predictedGpa):
    if player.academicWarningCount == config("ending", "expelledWarningCount") - 1:
        console.print(text("turn", "lastWarning"))
    if player.currentHealth < config("turn", "healthDanger"):
        console.print(text("turn", "healthDanger"))
    elif player.currentHealth < config("turn", "healthLow"):
        console.print(text("turn", "healthLow"))
    if round(predictedGpa, 1) < config("turn", "academicWarningGpa"):
        console.print(text("turn", "lowPredictedGpa"))
    if player.stress >= config("turn", "stressWarning"):
        console.print(text("turn", "stressHigh"))


def printActionMenu():
    print(text("turn", "actionsTitle"))
    print(text("turn", "actionStudy"))
    print(text("turn", "actionPlay"))
    print(text("turn", "actionExercise"))
    print(text("turn", "actionRest"))
    print(text("turn", "actionInfo"))
    print(text("common", "enterNumber"))
