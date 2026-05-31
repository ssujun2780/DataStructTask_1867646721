from gameData import config, text


def checkTurnEnding(player):
    if player.stress >= config("ending", "stressOver"):
        return "STRESS_OVER"
    if player.maxHealth <= config("ending", "maxHealthZero"):
        return "MAX_HEALTH_ZERO"
    return None


def checkSemesterEnding(player):
    if player.academicWarningCount >= config("ending", "expelledWarningCount"):
        return "EXPELLED"
    return None


def checkFinalEnding(gpa):
    if gpa >= config("ending", "goodGraduationGpa"):
        return "GOOD_GRADUATION"
    else:
        return "NORMAL_GRADUATION"


def printEnding(endingType):
    print(text("ending", endingType))
