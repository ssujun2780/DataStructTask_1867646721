import random

from character.Friend import Friend
from character.Professor import Professor
from character.Student import Student
from gameData import config, load_json, text


FRIEND_NAME_MARKER = text("character", "friendNameMarker")


def _checkDiff(diff):
    validDiff = config("difficulty", "valid")
    if not isinstance(diff, str):
        return config("difficulty", "default")

    diff = diff.strip().lower()
    if diff not in validDiff:
        return config("difficulty", "default")
    return diff


def createStudent(name, maxHealth, difficulty, intelligence):
    diff = load_json("studentInfo.json")
    difficulty = _checkDiff(difficulty)

    if not isinstance(name, str) or name.strip() == "":
        name = config("student", "defaultName")
    if not maxHealth or not isinstance(maxHealth, (int, float)):
        maxHealth = random.randint(*diff["student"][difficulty]["maxHealth"])
    if not intelligence or not isinstance(intelligence, (int, float)):
        intelligence = random.randint(*diff["student"][difficulty]["intelligence"])

    return Student(
        name,
        maxHealth,
        config("student", "startStress"),
        intelligence,
        config("student", "startGrade"),
        config("student", "startSemester"),
        config("student", "startGpa"),
    )


def createFriend(difficulty):
    friendInfo = load_json("friendInfo.json")
    difficulty = _checkDiff(difficulty)
    repeat = random.randint(*config("friend", "countRange"))
    names = random.sample(friendInfo["name"], repeat)

    friends = []
    for name in names:
        friend = createSpecialFriend(difficulty, name, friendInfo)
        if friend is None:
            friend = createNormalFriend(difficulty, name, friendInfo)
        friends.append(friend)

    return friends, repeat


def createNormalFriend(difficulty, name=None, friendInfo=None):
    friendInfo = friendInfo or load_json("friendInfo.json")
    difficulty = _checkDiff(difficulty)
    normalNames = _normalFriendNames(friendInfo)
    name = name or random.choice(normalNames or friendInfo["name"])

    return Friend(
        name,
        random.randint(*friendInfo[difficulty]["maxHealth"]),
        random.randint(*friendInfo[difficulty]["stress"]),
        random.randint(*friendInfo[difficulty]["intelligence"]),
        random.randint(*friendInfo[difficulty]["favor"]),
        True,
        False,
    )


def createSpecialFriend(difficulty, name=None, friendInfo=None):
    friendInfo = friendInfo or load_json("friendInfo.json")
    specialNames = _specialFriendNames(friendInfo)
    if not specialNames:
        return None

    if name is not None and not _isSpecialFriendName(name):
        return None

    chanceRange = friendInfo.get("specialChanceRange", config("professor", "easterEggRange"))
    chanceHit = friendInfo.get("specialChanceHit", config("professor", "easterEggHit"))
    if name is None and random.randint(*chanceRange) != chanceHit:
        return None

    return createNormalFriend(difficulty, name or random.choice(specialNames), friendInfo)


def _isSpecialFriendName(name):
    return FRIEND_NAME_MARKER not in name


def _normalFriendNames(friendInfo):
    return [name for name in friendInfo["name"] if not _isSpecialFriendName(name)]


def _specialFriendNames(friendInfo):
    return [name for name in friendInfo["name"] if _isSpecialFriendName(name)]


def _findProfessorByName(professorPool, name):
    for professor in professorPool:
        if professor.name == name:
            return professor
    return None


def _createProfessorFromExisting(existedProfessor, courseName, courseDifficulty, examDifficulty):
    return Professor(
        existedProfessor.name,
        existedProfessor.maxHealth,
        existedProfessor.stress,
        existedProfessor.intelligence,
        existedProfessor.favorability,
        courseName,
        existedProfessor.tendency,
        courseDifficulty,
        examDifficulty,
    )


def createNormalProfessor(difficulty, courseName, professorInfo=None, professorPool=None, name=None):
    professorInfo = professorInfo or load_json("professorInfo.json")
    professorPool = professorPool or []
    difficulty = _checkDiff(difficulty)
    name = name or random.choice(professorInfo["name"])
    courseDifficulty = random.choice(professorInfo["courseDifficulty"])
    examDifficulty = random.choice(professorInfo["examDifficulty"])

    existedProfessor = _findProfessorByName(professorPool, name)
    if existedProfessor is not None:
        return _createProfessorFromExisting(existedProfessor, courseName, courseDifficulty, examDifficulty)

    return Professor(
        name,
        professorInfo[difficulty]["maxHealth"],
        professorInfo[difficulty]["stress"],
        professorInfo[difficulty]["intelligence"],
        random.randint(*professorInfo[difficulty]["favor"]),
        courseName,
        random.choice(professorInfo["tendency"]),
        courseDifficulty,
        examDifficulty,
    )


def createSpecialProfessor(difficulty, courseName, professorInfo=None, professorPool=None, name=None):
    professorInfo = professorInfo or load_json("professorInfo.json")
    specialNames = professorInfo.get("specialName", [])
    if not specialNames:
        return None

    return createNormalProfessor(
        difficulty,
        courseName,
        professorInfo,
        professorPool,
        name or random.choice(specialNames),
    )


def createProfessor(difficulty, courseName, professorPool):
    professorInfo = load_json("professorInfo.json")
    difficulty = _checkDiff(difficulty)
    names = professorInfo["name"][:]
    specialNames = professorInfo["specialName"][:]
    professors = []

    for _ in range(config("professor", "candidatesPerCourse")):
        easterEgg = random.randint(*config("professor", "easterEggRange"))

        if easterEgg == config("professor", "easterEggHit") and specialNames:
            name = random.choice(specialNames)
            specialNames.remove(name)
            professor = createSpecialProfessor(difficulty, courseName, professorInfo, professorPool, name)
        else:
            name = random.choice(names)
            names.remove(name)
            professor = createNormalProfessor(difficulty, courseName, professorInfo, professorPool, name)

        professors.append(professor)

    return professors


def createProfesser(difficulty, courseName, professorPool):
    return createProfessor(difficulty, courseName, professorPool)


def updateProfessorPool(professorPool, selectedProfessor, courseName):
    for professor in professorPool:
        if professor.name == selectedProfessor.name:
            professor.appendCourseName(courseName)
            return professorPool

    professorPool.append(selectedProfessor)
    return professorPool
