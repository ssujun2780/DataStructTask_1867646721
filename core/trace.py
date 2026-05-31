from dataclasses import dataclass, field


@dataclass(frozen=True)
class TraceStep:
    stepId: int
    type: str
    sourceObjectId: str = ""
    sourceClass: str = ""
    methodName: str = ""
    targetObjectId: str = ""
    targetField: str = ""
    before: object = None
    after: object = None
    message: str = ""
    order: int = 0

    def toDict(self):
        return {
            "stepId": self.stepId,
            "type": self.type,
            "sourceObjectId": self.sourceObjectId,
            "sourceClass": self.sourceClass,
            "methodName": self.methodName,
            "targetObjectId": self.targetObjectId,
            "targetField": self.targetField,
            "before": self.before,
            "after": self.after,
            "message": self.message,
            "order": self.order,
        }


@dataclass
class TraceLog:
    steps: list[TraceStep] = field(default_factory=list)

    def addStep(self, stepType, **values):
        stepId = len(self.steps) + 1
        step = TraceStep(
            stepId=stepId,
            type=stepType,
            order=stepId,
            **values,
        )
        self.steps.append(step)
        return step

    def toDict(self):
        return [step.toDict() for step in self.steps]
