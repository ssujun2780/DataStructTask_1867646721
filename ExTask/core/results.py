from dataclasses import dataclass, field


@dataclass(frozen=True)
class ValueChange:
    objectId: str
    objectType: str
    fieldName: str
    before: object
    after: object
    delta: object
    reason: str

    def toDict(self):
        return {
            "objectId": self.objectId,
            "objectType": self.objectType,
            "fieldName": self.fieldName,
            "before": self.before,
            "after": self.after,
            "delta": self.delta,
            "reason": self.reason,
        }


@dataclass
class GameResult:
    success: bool
    message: str = ""
    changedValues: list[ValueChange] = field(default_factory=list)
    occurredEvents: list[object] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    traceSteps: list[object] = field(default_factory=list)

    def addChange(self, objectId, objectType, fieldName, before, after, reason):
        self.changedValues.append(
            ValueChange(
                objectId=objectId,
                objectType=objectType,
                fieldName=fieldName,
                before=before,
                after=after,
                delta=_calculateDelta(before, after),
                reason=reason,
            )
        )

    def toDict(self):
        return {
            "success": self.success,
            "message": self.message,
            "changedValues": [change.toDict() if hasattr(change, "toDict") else change for change in self.changedValues],
            "occurredEvents": list(self.occurredEvents),
            "warnings": list(self.warnings),
            "traceSteps": [
                step.toDict() if hasattr(step, "toDict") else dict(step.__dict__) if hasattr(step, "__dict__") else step
                for step in self.traceSteps
            ],
        }


def _calculateDelta(before, after):
    if isinstance(before, (int, float)) and isinstance(after, (int, float)):
        return after - before
    return None
