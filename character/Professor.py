from character.Person import Person, clamp


class Professor(Person):
    def __init__(self, name, maxHealth, stress, intelligence, favorability, coursName, tendency, courseDifficulty, examDifficulty, portraitId=None):
        super().__init__(name, maxHealth, stress, intelligence, portraitId)
        self.__favorability = clamp(favorability, 0, 100)
        self.__courseName = [coursName]
        self.__tendency = tendency
        self.__courseDifficulty = courseDifficulty
        self.__examDifficulty = examDifficulty
        self.__statusEffects = []

    def showStatus(self):
        print(f"Name: {self.name}")
        print(f"Max health: {self.maxHealth}")
        print(f"Stress: {self.stress}")
        print(f"Intelligence: {self.intelligence}")
        print(f"Favorability: {self.favorability}")
        print(f"Course: {self.courseName}")
        print(f"Tendency: {self.tendency}")
        print(f"Course difficulty: {self.courseDifficulty}")
        print(f"Exam difficulty: {self.examDifficulty}")

    def previewBehavior(self):
        return f"Course behavior: {self.courseName}, tendency {self.tendency}, exam {self.examDifficulty}."

    @property
    def favorability(self):
        return self.__favorability

    @property
    def courseName(self):
        return self.__courseName[-1]

    @property
    def tendency(self):
        return self.__tendency

    @property
    def courseDifficulty(self):
        return self.__courseDifficulty

    @property
    def examDifficulty(self):
        return self.__examDifficulty

    @property
    def statusEffects(self):
        return self.__statusEffects

    def changeFavorability(self, varF):
        self.__favorability = clamp(self.__favorability + varF, 0, 100)

    def changeCoureDiff(self, varCD):
        self.__courseDifficulty = varCD

    def changeExamDiff(self, varED):
        self.__examDifficulty = varED

    def appendCourseName(self, courseName):
        self.__courseName.append(courseName)

    def addStatus(self, status):
        self.__statusEffects.append(status)

    def removeStatus(self, statusId):
        self.__statusEffects = [status for status in self.__statusEffects if status.id != statusId]

    def hasStatus(self, statusIdOrName):
        return any(status.id == statusIdOrName or status.name == statusIdOrName for status in self.__statusEffects)

    def updateStatuses(self):
        expired = []
        for status in self.__statusEffects:
            status.tick()
            if status.isExpired():
                expired.append(status.id)
        if expired:
            self.__statusEffects = [status for status in self.__statusEffects if status.id not in expired]
        return expired
