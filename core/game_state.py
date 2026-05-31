from dataclasses import dataclass, field
from core.event_objects import buildBurnoutEvent


@dataclass
class GameState:
    difficulty: str
    player: object
    friends: list
    professorPool: list
    semesterProfessorPool: list
    grade: int
    semester: int
    semesterTurn: int
    maxTurn: int
    repeat: int
    graduateRouteStep: int = 0
    activeEvent: object = None
    logs: list = field(default_factory=list)

    @classmethod
    def fromInitResult(cls, initResult, semesterTurn=1, graduateRouteStep=0):
        difficulty, player, friends, professorPool, semesterProfessorPool, grade, semester, maxTurn, repeat = initResult
        return cls(
            difficulty=difficulty,
            player=player,
            friends=friends,
            professorPool=professorPool,
            semesterProfessorPool=semesterProfessorPool,
            grade=grade,
            semester=semester,
            semesterTurn=semesterTurn,
            maxTurn=maxTurn,
            repeat=repeat,
            graduateRouteStep=graduateRouteStep,
        )

    def applyTurnResult(self, turnResult):
        (
            self.player,
            self.friends,
            self.professorPool,
            self.semesterProfessorPool,
            self.grade,
            self.semester,
            self.semesterTurn,
            ending,
            self.graduateRouteStep,
        ) = turnResult
        return ending

    def addLogEntry(self, phase, result):
        if result is None:
            return
        payload = result.toDict() if hasattr(result, "toDict") else result
        entry = {
            "turn": {
                "grade": self.grade,
                "semester": self.semester,
                "semesterTurn": self.semesterTurn,
            },
            "phase": phase,
            "result": payload,
        }
        self.logs.append(entry)
        events = payload.get("occurredEvents", []) if isinstance(payload, dict) else []
        self.activeEvent = events[-1] if events else None

    def refreshActiveEvent(self):
        event = buildBurnoutEvent(self.player) if self.player is not None else None
        self.activeEvent = event.toDict() if event is not None else None

    def toDict(self):
        self.refreshActiveEvent()
        return {
            "difficulty": self.difficulty,
            "grade": self.grade,
            "semester": self.semester,
            "semesterTurn": self.semesterTurn,
            "maxTurn": self.maxTurn,
            "graduateRouteStep": self.graduateRouteStep,
            "player": serializeStudent(self.player),
            "friends": [serializeFriend(friend) for friend in (self.friends or [])],
            "professorPool": [serializeProfessor(professor) for professor in (self.professorPool or [])],
            "semesterProfessorPool": [serializeProfessor(professor) for professor in (self.semesterProfessorPool or [])],
            "activeEvent": self.activeEvent,
            "logs": [serializeLog(log) for log in self.logs],
        }


def serializeLog(log):
    if isinstance(log, dict):
        return {
            key: serializeLog(value)
            for key, value in log.items()
        }
    if isinstance(log, list):
        return [serializeLog(item) for item in log]
    if hasattr(log, "toDict"):
        return log.toDict()
    if hasattr(log, "__dict__"):
        return {
            key: serializeLog(value)
            for key, value in log.__dict__.items()
        }
    return log


def serializeStudent(student):
    return {
        "id": "player",
        "className": student.__class__.__name__,
        "name": student.name,
        "maxHealth": student.maxHealth,
        "currentHealth": student.currentHealth,
        "stress": student.stress,
        "intelligence": student.intelligence,
        "grade": student.grade,
        "semester": student.semester,
        "gpa": student.gpa,
        "academicWarningCount": student.academicWarningCount,
        "personality": serializePersonality(getattr(student, "personality", None)),
        "statusEffects": [serializeStatusEffect(status) for status in getattr(student, "statusEffects", [])],
        "portraitId": student.portraitId,
    }


def serializeFriend(friend):
    return {
        "id": f"friend:{friend.name}",
        "className": friend.__class__.__name__,
        "name": friend.name,
        "maxHealth": friend.maxHealth,
        "stress": friend.stress,
        "intelligence": friend.intelligence,
        "favorability": friend.favorability,
        "isConnect": friend.isConnect,
        "isArmy": friend.isArmy,
        "statusEffects": [serializeStatusEffect(status) for status in getattr(friend, "statusEffects", [])],
        "portraitId": friend.portraitId,
    }


def serializeProfessor(professor):
    return {
        "id": f"professor:{professor.name}:{professor.courseName}",
        "className": professor.__class__.__name__,
        "name": professor.name,
        "maxHealth": professor.maxHealth,
        "stress": professor.stress,
        "intelligence": professor.intelligence,
        "favorability": professor.favorability,
        "courseName": professor.courseName,
        "tendency": professor.tendency,
        "courseDifficulty": professor.courseDifficulty,
        "examDifficulty": professor.examDifficulty,
        "statusEffects": [serializeStatusEffect(status) for status in getattr(professor, "statusEffects", [])],
        "portraitId": professor.portraitId,
    }


def serializeStatusEffect(status):
    if hasattr(status, "toDict"):
        return status.toDict()
    return {
        "id": getattr(status, "id", ""),
        "name": getattr(status, "name", ""),
        "duration": getattr(status, "duration", 0),
        "description": getattr(status, "description", ""),
    }


def serializePersonality(personality):
    if personality is None:
        return None
    if hasattr(personality, "toDict"):
        return personality.toDict()
    return {
        "socialAxis": getattr(personality, "socialAxis", 0),
        "planningAxis": getattr(personality, "planningAxis", 0),
        "sensitivityAxis": getattr(personality, "sensitivityAxis", 0),
        "ambitionAxis": getattr(personality, "ambitionAxis", 0),
        "independenceAxis": getattr(personality, "independenceAxis", 0),
    }
