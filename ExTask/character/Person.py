from character.PersonADT import PersonADT


def clamp(value, minimum, maximum=None):
    value = max(minimum, value)
    if maximum is not None:
        value = min(maximum, value)
    return value


class Person(PersonADT):
    def __init__(self, name, maxHealth, stress, intelligence, portraitId=None):
        self.__name = name
        self.__maxHealth = clamp(maxHealth, 0)
        self.__stress = clamp(stress, 0, 100)
        self.__intelligence = clamp(intelligence, 0)
        self.__portraitId = portraitId

    @property
    def name(self):
        return self.__name

    @property
    def maxHealth(self):
        return self.__maxHealth

    @property
    def stress(self):
        return self.__stress

    @property
    def intelligence(self):
        return self.__intelligence

    @property
    def portraitId(self):
        return self.__portraitId

    def showStatus(self):
        print(f"Name: {self.__name}")
        print(f"Max health: {self.__maxHealth}")
        print(f"Stress: {self.__stress}")
        print(f"Intelligence: {self.__intelligence}")

    def previewBehavior(self):
        return f"{self.__class__.__name__} base behavior."

    def changeMaxHealth(self, varMH):
        self.__maxHealth = clamp(self.__maxHealth + varMH, 0)

    def changeStress(self, varS):
        self.__stress = clamp(self.__stress + varS, 0, 100)

    def changeIntelligence(self, varI):
        self.__intelligence = clamp(self.__intelligence + varI, 0)
