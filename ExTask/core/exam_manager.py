import event.examEvent as examEvent
from core.results import GameResult
from core.trace import TraceLog
from gameData import average_gpa, config, text


class ExamManager:
    def predictScores(self, player, semesterProfessorPool):
        professors = semesterProfessorPool or []
        scores = [
            {
                "courseName": professor.courseName,
                "score": self._applyStatusScoreModifier(player, examEvent.calculationExam(player, professor)),
            }
            for professor in professors
        ]
        average = sum(item["score"] for item in scores) / len(scores) if scores else 0.0
        return scores, average

    def calculateSemesterScore(self, player, semesterProfessorPool):
        professors = semesterProfessorPool or []
        result = GameResult(success=True)
        traceLog = TraceLog()
        traceLog.addStep(
            "method_call",
            sourceObjectId="examManager",
            sourceClass="ExamManager",
            methodName="calculateSemesterScore",
            targetObjectId="player",
            message="Semester exam calculation started.",
        )

        scores = [round(self._applyStatusScoreModifier(player, examEvent.calculationExam(player, professor)), 1) for professor in professors]
        score = sum(scores) / len(scores) if scores else 0.0

        beforeGpa = player.gpa
        beforeWarningCount = player.academicWarningCount
        player.changeGpa(score)

        result.addChange("player", "Student", "gpa", beforeGpa, player.gpa, "semester_exam")
        traceLog.addStep(
            "field_write",
            sourceObjectId="player",
            sourceClass="Student",
            methodName="changeGpa",
            targetObjectId="player",
            targetField="gpa",
            before=beforeGpa,
            after=player.gpa,
            message="Semester score added to cumulative GPA.",
        )

        result.message = text("turn", "semesterScore", score=round(score, 1), gpa=average_gpa(player))
        self._appendStatusWarnings(player, result, traceLog)

        if score < config("turn", "academicWarningGpa"):
            player.addAcademicWarningCount()
            result.addChange(
                "player",
                "Student",
                "academicWarningCount",
                beforeWarningCount,
                player.academicWarningCount,
                "low_semester_gpa",
            )
            result.warnings.append(text("turn", "academicWarning", count=player.academicWarningCount))
            traceLog.addStep(
                "field_write",
                sourceObjectId="player",
                sourceClass="Student",
                methodName="addAcademicWarningCount",
                targetObjectId="player",
                targetField="academicWarningCount",
                before=beforeWarningCount,
                after=player.academicWarningCount,
                message="Academic warning count increased.",
            )

        result.occurredEvents.append({"type": "semester_exam", "scores": scores, "average": score})
        result.traceSteps.extend(traceLog.steps)
        return result

    def _applyStatusScoreModifier(self, player, score):
        if player.hasStatus("cold"):
            score -= 0.3
        if player.hasStatus("confident"):
            score += 0.2
        personality = getattr(player, "personality", None)
        if personality is not None:
            if personality.ambitionAxis <= -40:
                score += 0.1
            elif personality.ambitionAxis >= 40:
                score -= 0.1
        return max(0.0, min(4.5, score))

    def _appendStatusWarnings(self, player, result, traceLog):
        if player.hasStatus("cold"):
            result.warnings.append("감기 때문에 시험 점수가 감소했습니다.")
            traceLog.addStep(
                "condition_check",
                sourceObjectId="player",
                sourceClass="Student",
                methodName="hasStatus",
                targetObjectId="player",
                targetField="statusEffects",
                message="Cold reduced exam score.",
            )
        if player.hasStatus("confident"):
            result.warnings.append("자신감 상승으로 시험 점수 보정을 받았습니다.")
            traceLog.addStep(
                "condition_check",
                sourceObjectId="player",
                sourceClass="Student",
                methodName="hasStatus",
                targetObjectId="player",
                targetField="statusEffects",
                message="Confident increased exam score.",
            )
        personality = getattr(player, "personality", None)
        if personality is not None and personality.ambitionAxis <= -40:
            result.warnings.append("야망 성향으로 시험 집중 보정을 받았습니다.")
        elif personality is not None and personality.ambitionAxis >= 40:
            result.warnings.append("안정지향 성향으로 시험 고점이 낮아졌습니다.")
