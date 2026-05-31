from dataclasses import dataclass


@dataclass
class StatusEffect:
    id: str
    name: str
    duration: int
    description: str = ""

    def tick(self):
        self.duration -= 1

    def isExpired(self):
        return self.duration <= 0

    def toDict(self):
        return {
            "id": self.id,
            "name": self.name,
            "duration": self.duration,
            "description": self.description,
        }
