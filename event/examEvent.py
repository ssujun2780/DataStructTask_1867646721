import random

from gameData import config


def calculationExam(player, semesterProfessor):
    examConfig = config("exam")
    gradePoint = examConfig["baseGradePoint"]

    gradePoint += (player.intelligence - examConfig["intelligenceBase"]) * examConfig["intelligenceWeight"]

    examDifficulty = getattr(semesterProfessor, "examDifficulty", None)
    gradePoint -= examConfig["difficultyMap"].get(examDifficulty, 0) * examConfig["difficultyWeight"]

    gradePoint -= player.stress * examConfig["stressWeight"]

    if player.maxHealth > 0:
        gradePoint += (player.currentHealth / player.maxHealth - examConfig["healthCenter"]) * examConfig["healthWeight"]

    gradePoint += random.uniform(*examConfig["luckRange"])

    favorability = getattr(semesterProfessor, "favorability", examConfig["favorBase"])
    gradePoint += ((favorability - examConfig["favorBase"]) / examConfig["favorBase"]) * examConfig["favorWeight"]

    gradePoint = max(examConfig["minGradePoint"], min(examConfig["maxGradePoint"], gradePoint))
    return round(gradePoint, 1)
