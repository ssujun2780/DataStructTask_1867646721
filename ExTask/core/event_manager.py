import random

import event.friendEvent as friendEvent
import event.professorEvent as professorEvent
import event.studentEvent as studentEvent
from core.results import GameResult
from core.trace import TraceLog
from gameData import config


class EventManager:
    def applyTurnEvents(self, player, friends, semesterProfessorPool, graduateRouteStep):
        result = GameResult(success=True, message="Turn events processed.")
        traceLog = TraceLog()
        traceLog.addStep(
            "method_call",
            sourceObjectId="eventManager",
            sourceClass="EventManager",
            methodName="applyTurnEvents",
            message="Turn event processing started.",
        )

        player = self._applyStudentEvent(player, result, traceLog)
        player, friends = self._applyFriendEvents(player, friends, result, traceLog)

        professorResult = professorEvent.callProfessorEvent(player, semesterProfessorPool or [], graduateRouteStep)
        if professorResult is not None:
            player, semesterProfessorPool, graduateRouteStep, professorEventCheck = professorResult
            if professorEventCheck:
                result.occurredEvents.append({"type": "professor_event", "eventCheck": professorEventCheck})
                traceLog.addStep(
                    "event_trigger",
                    sourceObjectId="eventManager",
                    sourceClass="EventManager",
                    methodName="callProfessorEvent",
                    message="Professor event triggered.",
                )

        result.traceSteps.extend(traceLog.steps)
        return result, player, friends, semesterProfessorPool, graduateRouteStep

    def _applyStudentEvent(self, player, result, traceLog):
        eventFunctions = {
            "eureca": studentEvent.eurecaEvent,
            "concentration": studentEvent.explosionConcentrationEvent,
            "goodHealth": studentEvent.goodHealthEvent,
            "sick": studentEvent.sickEvent,
            "slump": studentEvent.slumpEvent,
            "hyeonta": studentEvent.hyeontaEvent,
            "doomsDay": studentEvent.DoomsDayEvent,
        }

        playerEvent = random.random()
        for eventInfo in config("turn", "events"):
            if playerEvent <= eventInfo["maxRoll"]:
                eventName = eventInfo["name"]
                eventFunction = eventFunctions.get(eventName)
                if eventFunction is None:
                    break
                nextPlayer = eventFunction(player)
                result.occurredEvents.append({"type": "student_event", "name": eventName})
                traceLog.addStep(
                    "event_trigger",
                    sourceObjectId="eventManager",
                    sourceClass="EventManager",
                    methodName=eventFunction.__name__,
                    targetObjectId="player",
                    message=f"Student event triggered: {eventName}.",
                )
                return nextPlayer if nextPlayer is not None else player
        return player

    def _applyFriendEvents(self, player, friends, result, traceLog):
        friends = friends or []
        for index, friend in enumerate(friends):
            roll = random.random()

            nextFriend = friendEvent.suddenRelationChange(friend)
            if nextFriend is not None:
                friend = nextFriend

            if roll <= config("turn", "friendExerciseEventChance"):
                eventResult = friendEvent.adviceExerciseFriendEvent(player, friend)
                if eventResult is not None:
                    player, friend = eventResult
                    result.occurredEvents.append({"type": "friend_event", "name": "advice_exercise", "friend": friend.name})
                    self._traceFriendEvent(traceLog, "adviceExerciseFriendEvent", friend)
            elif config("turn", "friendExerciseEventChance") < roll < config("turn", "friendStudyEventChance"):
                eventResult = friendEvent.adviceStudyFriendEvent(player, friend)
                if eventResult is not None:
                    player, friend = eventResult
                    result.occurredEvents.append({"type": "friend_event", "name": "advice_study", "friend": friend.name})
                    self._traceFriendEvent(traceLog, "adviceStudyFriendEvent", friend)

            friends[index] = friend
        return player, friends

    def _traceFriendEvent(self, traceLog, methodName, friend):
        traceLog.addStep(
            "event_trigger",
            sourceObjectId="eventManager",
            sourceClass="EventManager",
            methodName=methodName,
            targetObjectId=f"friend:{friend.name}",
            message=f"Friend event triggered for {friend.name}.",
        )
