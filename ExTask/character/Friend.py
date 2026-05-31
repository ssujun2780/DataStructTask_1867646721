from character.Person import Person, clamp


class Friend(Person):
    def __init__(self, name, maxHealth, stress, intelligence, favorability, isConnect, isArmy, portraitId=None):
        super().__init__(name, maxHealth, stress, intelligence, portraitId)
        self.__favorability = clamp(favorability, 0, 100)
        self.__isConnect = isConnect
        self.__isArmy = isArmy
        self.__statusEffects = []

    def showStatus(self):
        print(f"Name: {self.name}")
        print(f"Max health: {self.maxHealth}")
        print(f"Stress: {self.stress}")
        print(f"Intelligence: {self.intelligence}")
        print(f"Favorability: {self.favorability}")
        print(f"Connectable: {self.isConnect}")

    def previewBehavior(self):
        return f"Relationship behavior: favorability {self.favorability}, connectable {self.isConnect}."

    @property
    def favorability(self):
        return self.__favorability

    @property
    def isConnect(self):
        return self.__isConnect

    @property
    def isArmy(self):
        return self.__isArmy

    @property
    def statusEffects(self):
        return self.__statusEffects

    def changeFavorability(self, varF):
        self.__favorability = clamp(self.__favorability + varF, 0, 100)

    def changeIsConnect(self):
        self.__isConnect = False

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
