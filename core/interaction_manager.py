import random

from core.results import GameResult
from core.trace import TraceLog
from gameData import config, text


class InteractionManager:
    def playWithFriend(self, player, friend):
        if self._checkPlayAcceptance(friend):
            return self._acceptPlay(player, friend)
        return self._rejectPlay(player, friend)

    def _checkPlayAcceptance(self, friend):
        favor = friend.favorability
        chance = next(
            item["chance"]
            for item in config("friend", "playAcceptance")
            if favor >= item["minFavor"]
        )
        return random.random() < chance

    def _acceptPlay(self, player, friend):
        playConfig = config("friend", "play")
        result = GameResult(
            success=True,
            message=text("interaction", "friendAccepted", friend_name=friend.name),
        )
        traceLog = TraceLog()
        traceLog.addStep(
            "method_call",
            sourceObjectId="player",
            sourceClass="Student",
            methodName="InteractionManager.playWithFriend",
            targetObjectId=f"friend:{friend.name}",
            message="Friend accepted play invitation.",
        )

        beforeHealth = player.currentHealth
        beforeStress = player.stress
        beforeIntelligence = player.intelligence
        beforeFavorability = friend.favorability

        player.changeCurrentHealth(playConfig["health"])
        player.changeStress(playConfig["stress"])
        friend.changeFavorability(playConfig["favor"])

        result.addChange("player", "Student", "currentHealth", beforeHealth, player.currentHealth, "play")
        result.addChange("player", "Student", "stress", beforeStress, player.stress, "play")
        result.addChange(f"friend:{friend.name}", "Friend", "favorability", beforeFavorability, friend.favorability, "play")
        self._addFieldWrite(traceLog, "Student", "changeCurrentHealth", "currentHealth", beforeHealth, player.currentHealth)
        self._addFieldWrite(traceLog, "Student", "changeStress", "stress", beforeStress, player.stress)
        self._addFieldWrite(traceLog, "Friend", "changeFavorability", "favorability", beforeFavorability, friend.favorability, f"friend:{friend.name}")

        result.warnings.append(
            text("interaction", "playRecovered", health=abs(playConfig["health"]), stress=abs(playConfig["stress"]))
        )
        result.warnings.append(text("interaction", "favorUp", friend_name=friend.name, favor_delta=playConfig["favor"]))

        if random.random() < playConfig["forgetChance"]:
            player.changeIntelligence(playConfig["forgetIntelligence"])
            result.addChange("player", "Student", "intelligence", beforeIntelligence, player.intelligence, "play_forget")
            self._addFieldWrite(traceLog, "Student", "changeIntelligence", "intelligence", beforeIntelligence, player.intelligence)
            result.warnings.append(
                text("interaction", "forgotClass", intelligence_delta=abs(playConfig["forgetIntelligence"]))
            )

        result.traceSteps.extend(traceLog.steps)
        return result

    def _rejectPlay(self, player, friend):
        playConfig = config("friend", "play")
        result = GameResult(
            success=True,
            message=text("interaction", "friendRejected", friend_name=friend.name),
        )
        traceLog = TraceLog()
        traceLog.addStep(
            "method_call",
            sourceObjectId="player",
            sourceClass="Student",
            methodName="InteractionManager.playWithFriend",
            targetObjectId=f"friend:{friend.name}",
            message="Friend rejected play invitation.",
        )

        beforeStress = player.stress
        player.changeStress(playConfig["rejectStress"])
        result.addChange("player", "Student", "stress", beforeStress, player.stress, "play_rejected")
        self._addFieldWrite(traceLog, "Student", "changeStress", "stress", beforeStress, player.stress)
        result.warnings.append(text("interaction", "rejectStress", stress_delta=playConfig["rejectStress"]))
        result.traceSteps.extend(traceLog.steps)
        return result

    def _addFieldWrite(self, traceLog, sourceClass, methodName, targetField, before, after, targetObjectId="player"):
        traceLog.addStep(
            "field_write",
            sourceObjectId=targetObjectId,
            sourceClass=sourceClass,
            methodName=methodName,
            targetObjectId=targetObjectId,
            targetField=targetField,
            before=before,
            after=after,
            message=f"{targetField} changed.",
        )
