from character.Person import Person, clamp
from core.personality_profile import PersonalityProfile
from gameData import average_gpa, text
from richCompat import Console, Panel, Text


console = Console()


class Student(Person):
    def __init__(self, name, maxHealth, stress, intelligence, grade, semester, gpa, portraitId=None, personality=None):
        super().__init__(name, maxHealth, stress, intelligence, portraitId)
        self.__currentHealth = clamp(maxHealth, 0, self.maxHealth)
        self.__grade = grade
        self.__semester = semester
        self.__gpa = round(gpa, 1)
        self.__academicWarningCount = 0
        self.__statusEffects = []
        self.__personality = personality or PersonalityProfile()

    def showStatus(self):
        print(f"Name: {self.name}")
        print(f"Max health: {self.maxHealth}, Current health: {self.currentHealth}")
        print(f"Stress: {self.stress}")
        print(f"Intelligence: {self.intelligence}")
        print(f"Semester: {self.grade}-{self.semester}")
        print(f"GPA sum: {self.gpa}")
        print(f"Academic warnings: {self.academicWarningCount}")

    def previewBehavior(self):
        return f"Study-focused behavior: stress {self.stress}, intelligence {self.intelligence}, GPA sum {self.gpa}."

    def printInfo(self):
        body = Text()
        body.append(f"{text('labels', 'name')} : {self.name}\n")
        body.append(f"{text('labels', 'maxHealth')} : {self.maxHealth}\n")
        body.append(f"{text('labels', 'currentHealth')} : {self.currentHealth}\n")
        body.append(f"{text('character', 'currentPrefix')}{text('labels', 'stress')} : {self.stress}\n")
        body.append(f"{text('labels', 'intelligence')} : {self.intelligence}\n")
        if self.semester != 1:
            body.append(f"{text('labels', 'gpa')} : {average_gpa(self)}\n")
        body.append(f"{text('labels', 'academicWarning')}: {self.academicWarningCount}")

        panel = Panel(
            body,
            title=text("character", "studentPanelTitle"),
            expand=False
        )

        console.print()
        console.print(panel)
        console.print()

    @property
    def currentHealth(self):
        return self.__currentHealth

    @property
    def grade(self):
        return self.__grade

    @property
    def semester(self):
        return self.__semester

    @property
    def gpa(self):
        return self.__gpa

    @property
    def academicWarningCount(self):
        return self.__academicWarningCount

    @property
    def personality(self):
        return self.__personality

    @property
    def statusEffects(self):
        return self.__statusEffects

    def changeCurrentHealth(self, varCH):
        self.__currentHealth = clamp(self.__currentHealth + varCH, 0, self.maxHealth)

    def changeMaxHealth(self, varMH):
        super().changeMaxHealth(varMH)
        self.__currentHealth = clamp(self.__currentHealth, 0, self.maxHealth)

    def nextGrade(self):
        self.__grade += 1

    def nextSemester(self):
        self.__semester += 1

    def changeGpa(self, varGpa):
        self.__gpa = round(self.__gpa + varGpa, 1)

    def addAcademicWarningCount(self):
        self.__academicWarningCount += 1

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
