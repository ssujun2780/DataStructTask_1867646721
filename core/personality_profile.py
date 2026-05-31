from dataclasses import dataclass


@dataclass
class PersonalityProfile:
    socialAxis: int = 0
    planningAxis: int = 0
    sensitivityAxis: int = 0
    ambitionAxis: int = 0
    independenceAxis: int = 0

    def toDict(self):
        return {
            "socialAxis": self.socialAxis,
            "planningAxis": self.planningAxis,
            "sensitivityAxis": self.sensitivityAxis,
            "ambitionAxis": self.ambitionAxis,
            "independenceAxis": self.independenceAxis,
        }
