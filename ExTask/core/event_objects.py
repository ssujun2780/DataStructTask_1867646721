class Selection:
    def __init__(self, selectionId, text, available=True, unavailableReason=""):
        self.id = selectionId
        self.text = text
        self.available = available
        self.unavailableReason = unavailableReason

    def toDict(self):
        return {
            "id": self.id,
            "text": self.text,
            "available": self.available,
            "unavailableReason": self.unavailableReason,
        }


class BaseEvent:
    def __init__(self, eventId, title, content, selections, sourceObjectId="player", targetObjectId="player"):
        self.id = eventId
        self.title = title
        self.content = content
        self.selections = selections
        self.sourceObjectId = sourceObjectId
        self.targetObjectId = targetObjectId

    def toDict(self):
        return {
            "id": self.id,
            "type": "object_event",
            "title": self.title,
            "content": self.content,
            "sourceObjectId": self.sourceObjectId,
            "targetObjectId": self.targetObjectId,
            "selections": [selection.toDict() for selection in self.selections],
        }


def buildBurnoutEvent(player):
    if not player.hasStatus("burnout"):
        return None
    return BaseEvent(
        "burnout_warning",
        "번아웃 조짐",
        "무리한 페이스가 누적되어 공부 효율이 흔들리고 있습니다.",
        [
            Selection("rest_now", "이번 턴은 쉬는 쪽을 고려한다"),
            Selection("push_on", "계속 밀어붙인다"),
            Selection(
                "talk_friend",
                "친구에게 연락한다",
                available=bool(getattr(player, "statusEffects", [])),
            ),
        ],
    )
