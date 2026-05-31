import random

from core.results import GameResult
from core.trace import TraceLog
from gameData import config, text


class ActionManager:
    def doStudy(self, player):
        action = config("actions", "study")
        healthDelta = action["health"]
        stressDelta = action["stress"]
        intelligenceDelta = action["intelligence"]
        result = GameResult(
            success=True,
            message=text(
                "turn",
                "studyResult",
                health=abs(healthDelta),
                stress=stressDelta,
                intelligence=intelligenceDelta,
            ),
        )
        traceLog = TraceLog()
        traceLog.addStep(
            "method_call",
            sourceObjectId="player",
            sourceClass="Student",
            methodName="ActionManager.doStudy",
            message="Player selected study action.",
        )
        healthDelta, stressDelta, intelligenceDelta = self._applyStudyStatusModifiers(
            player,
            healthDelta,
            stressDelta,
            intelligenceDelta,
            result,
            traceLog,
        )
        intelligenceDelta, stressDelta = self._applyStudyPersonalityModifiers(
            player,
            intelligenceDelta,
            stressDelta,
            result,
            traceLog,
        )

        result.message = text(
            "turn",
            "studyResult",
            health=abs(healthDelta),
            stress=stressDelta,
            intelligence=intelligenceDelta,
        )

        beforeHealth = player.currentHealth
        beforeStress = player.stress
        beforeIntelligence = player.intelligence

        player.changeCurrentHealth(healthDelta)
        player.changeStress(stressDelta)
        player.changeIntelligence(intelligenceDelta)

        result.addChange("player", "Student", "currentHealth", beforeHealth, player.currentHealth, "study")
        result.addChange("player", "Student", "stress", beforeStress, player.stress, "study")
        result.addChange("player", "Student", "intelligence", beforeIntelligence, player.intelligence, "study")

        traceLog.addStep(
            "field_write",
            sourceObjectId="player",
            sourceClass="Student",
            methodName="changeCurrentHealth",
            targetObjectId="player",
            targetField="currentHealth",
            before=beforeHealth,
            after=player.currentHealth,
            message="Study consumed current health.",
        )
        traceLog.addStep(
            "field_write",
            sourceObjectId="player",
            sourceClass="Student",
            methodName="changeStress",
            targetObjectId="player",
            targetField="stress",
            before=beforeStress,
            after=player.stress,
            message="Study increased stress.",
        )
        traceLog.addStep(
            "field_write",
            sourceObjectId="player",
            sourceClass="Student",
            methodName="changeIntelligence",
            targetObjectId="player",
            targetField="intelligence",
            before=beforeIntelligence,
            after=player.intelligence,
            message="Study increased intelligence.",
        )
        statusChange = self._updateStatusLifecycleAfterStudy(player)
        if statusChange == "burnout_added":
            result.warnings.append("스트레스가 높아 번아웃 상태가 생겼습니다.")
        elif statusChange == "cold_added":
            result.warnings.append("무리한 페이스로 감기 상태가 생겼습니다.")
        elif statusChange == "confident_removed":
            result.warnings.append("공부 후 자신감 상승 상태가 사라졌습니다.")
        result.traceSteps.extend(traceLog.steps)
        return result

    def doExercise(self, player):
        action = config("actions", "exercise")
        healthDelta = action["health"]
        maxHealthDelta = action["maxHealth"]
        result = GameResult(
            success=True,
            message=text(
                "turn",
                "exerciseResult",
                health=abs(healthDelta),
                maxHealth=maxHealthDelta,
            ),
        )
        traceLog = TraceLog()
        traceLog.addStep(
            "method_call",
            sourceObjectId="player",
            sourceClass="Student",
            methodName="ActionManager.doExercise",
            message="Player selected exercise action.",
        )
        healthDelta, maxHealthDelta = self._applyExerciseStatusModifiers(
            player,
            healthDelta,
            maxHealthDelta,
            result,
            traceLog,
        )

        result.message = text(
            "turn",
            "exerciseResult",
            health=abs(healthDelta),
            maxHealth=maxHealthDelta,
        )

        beforeHealth = player.currentHealth
        beforeMaxHealth = player.maxHealth
        beforeStress = player.stress

        player.changeCurrentHealth(healthDelta)
        player.changeMaxHealth(maxHealthDelta)

        result.addChange("player", "Student", "currentHealth", beforeHealth, player.currentHealth, "exercise")
        result.addChange("player", "Student", "maxHealth", beforeMaxHealth, player.maxHealth, "exercise")
        traceLog.addStep(
            "field_write",
            sourceObjectId="player",
            sourceClass="Student",
            methodName="changeCurrentHealth",
            targetObjectId="player",
            targetField="currentHealth",
            before=beforeHealth,
            after=player.currentHealth,
            message="Exercise consumed current health.",
        )
        traceLog.addStep(
            "field_write",
            sourceObjectId="player",
            sourceClass="Student",
            methodName="changeMaxHealth",
            targetObjectId="player",
            targetField="maxHealth",
            before=beforeMaxHealth,
            after=player.maxHealth,
            message="Exercise increased max health.",
        )

        if random.random() < action["stressChanceWeight"] * player.maxHealth:
            player.changeStress(action["stressDown"])
            result.warnings.append(text("turn", "exerciseStressDown", amount=abs(action["stressDown"])))
        elif random.random() < action["stressChanceWeight"] * (player.maxHealth - player.currentHealth):
            player.changeStress(action["stressUp"])
            result.warnings.append(text("turn", "exerciseStressUp", amount=action["stressUp"]))

        if beforeStress != player.stress:
            result.addChange("player", "Student", "stress", beforeStress, player.stress, "exercise")
            traceLog.addStep(
                "field_write",
                sourceObjectId="player",
                sourceClass="Student",
                methodName="changeStress",
                targetObjectId="player",
                targetField="stress",
                before=beforeStress,
                after=player.stress,
                message="Exercise adjusted stress.",
            )

        result.traceSteps.extend(traceLog.steps)
        return result

    def doRest(self, player):
        action = config("actions", "rest")
        result = GameResult(success=True, message=text("turn", "restHealth"))
        traceLog = TraceLog()
        traceLog.addStep(
            "method_call",
            sourceObjectId="player",
            sourceClass="Student",
            methodName="ActionManager.doRest",
            message="Player selected rest action.",
        )

        beforeHealth = player.currentHealth
        beforeStress = player.stress

        player.changeCurrentHealth(player.maxHealth - player.currentHealth)
        result.addChange("player", "Student", "currentHealth", beforeHealth, player.currentHealth, "rest")
        traceLog.addStep(
            "field_write",
            sourceObjectId="player",
            sourceClass="Student",
            methodName="changeCurrentHealth",
            targetObjectId="player",
            targetField="currentHealth",
            before=beforeHealth,
            after=player.currentHealth,
            message="Rest restored current health.",
        )

        if random.random() < action["stressDownChance"]:
            player.changeStress(action["stressDown"])
            result.warnings.append(text("turn", "restStress", amount=abs(action["stressDown"])))

        if beforeStress != player.stress:
            result.addChange("player", "Student", "stress", beforeStress, player.stress, "rest")
            traceLog.addStep(
                "field_write",
                sourceObjectId="player",
                sourceClass="Student",
                methodName="changeStress",
                targetObjectId="player",
                targetField="stress",
                before=beforeStress,
                after=player.stress,
                message="Rest reduced stress.",
            )

        result.warnings.append(
            text(
                "turn",
                "restTip",
                chance=int(action["stressDownChance"] * 100),
                amount=abs(action["stressDown"]),
            )
        )
        if player.hasStatus("burnout"):
            result.warnings.append("번아웃 상태라 회복 효율이 낮습니다.")
            traceLog.addStep(
                "condition_check",
                sourceObjectId="player",
                sourceClass="Student",
                methodName="hasStatus",
                targetObjectId="player",
                targetField="statusEffects",
                message="Burnout status checked during rest.",
            )
        removedStatuses = self._updateStatusLifecycleAfterRest(player)
        if removedStatuses:
            result.warnings.append("휴식으로 상태가 회복되었습니다.")
        result.traceSteps.extend(traceLog.steps)
        return result

    def _applyStudyStatusModifiers(self, player, healthDelta, stressDelta, intelligenceDelta, result, traceLog):
        if player.hasStatus("burnout"):
            intelligenceDelta = max(1, intelligenceDelta - 2)
            stressDelta += 2
            result.warnings.append("번아웃 때문에 공부 효율이 감소했습니다.")
            traceLog.addStep(
                "condition_check",
                sourceObjectId="player",
                sourceClass="Student",
                methodName="hasStatus",
                targetObjectId="player",
                targetField="statusEffects",
                message="Burnout reduced study efficiency.",
            )
        if player.hasStatus("cold"):
            healthDelta -= 2
            result.warnings.append("감기 때문에 체력이 더 소모되었습니다.")
            traceLog.addStep(
                "condition_check",
                sourceObjectId="player",
                sourceClass="Student",
                methodName="hasStatus",
                targetObjectId="player",
                targetField="statusEffects",
                message="Cold increased study health cost.",
            )
        return healthDelta, stressDelta, intelligenceDelta

    def _applyExerciseStatusModifiers(self, player, healthDelta, maxHealthDelta, result, traceLog):
        if player.hasStatus("cold"):
            healthDelta -= 2
            maxHealthDelta = max(0, maxHealthDelta - 1)
            result.warnings.append("감기 때문에 운동 효율이 감소했습니다.")
            traceLog.addStep(
                "condition_check",
                sourceObjectId="player",
                sourceClass="Student",
                methodName="hasStatus",
                targetObjectId="player",
                targetField="statusEffects",
                message="Cold reduced exercise efficiency.",
            )
        return healthDelta, maxHealthDelta

    def _applyStudyPersonalityModifiers(self, player, intelligenceDelta, stressDelta, result, traceLog):
        personality = getattr(player, "personality", None)
        if personality is None:
            return intelligenceDelta, stressDelta
        if personality.planningAxis <= -40:
            intelligenceDelta += 1
            result.warnings.append("성실한 성향으로 공부 효율이 증가했습니다.")
            traceLog.addStep(
                "condition_check",
                sourceObjectId="player",
                sourceClass="Student",
                methodName="personality.planningAxis",
                targetObjectId="player",
                targetField="personality",
                message="Planning axis increased study efficiency.",
            )
        elif personality.planningAxis >= 40:
            stressDelta += 1
            result.warnings.append("즉흥적인 성향으로 스트레스가 더 올랐습니다.")
            traceLog.addStep(
                "condition_check",
                sourceObjectId="player",
                sourceClass="Student",
                methodName="personality.planningAxis",
                targetObjectId="player",
                targetField="personality",
                message="Planning axis increased study stress.",
            )
        return intelligenceDelta, stressDelta

    def _updateStatusLifecycleAfterStudy(self, player):
        if player.stress >= 80 and not player.hasStatus("burnout"):
            from core.status_effect import StatusEffect

            player.addStatus(StatusEffect("burnout", "Burnout", 3, "과로로 공부 효율이 떨어집니다."))
            return "burnout_added"
        if player.stress >= 60 and not player.hasStatus("cold"):
            from core.status_effect import StatusEffect

            player.addStatus(StatusEffect("cold", "Cold", 2, "체력 소모가 증가합니다."))
            return "cold_added"
        if player.hasStatus("confident"):
            player.removeStatus("confident")
            return "confident_removed"
        return None

    def _updateStatusLifecycleAfterRest(self, player):
        removed = []
        if player.hasStatus("burnout") and player.stress <= 40:
            player.removeStatus("burnout")
            removed.append("burnout")
        if player.hasStatus("cold") and player.currentHealth >= player.maxHealth:
            player.removeStatus("cold")
            removed.append("cold")
        if not player.hasStatus("confident") and player.currentHealth >= player.maxHealth and player.stress <= 20:
            from core.status_effect import StatusEffect

            player.addStatus(StatusEffect("confident", "Confident", 2, "시험 점수 보정을 받습니다."))
        return removed
