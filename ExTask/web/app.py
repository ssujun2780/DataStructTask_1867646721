import contextlib
import io
import json
import os
import sys
import uuid
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import character.createCharacter as characterFactory
from core.action_manager import ActionManager
from core.event_manager import EventManager
from core.exam_manager import ExamManager
from core.game_state import GameState
from core.interaction_manager import InteractionManager
from core.results import GameResult
from core.trace import TraceLog
from gameData import average_gpa, config, load_json
import independentEvent.checkEnding as endingChecker
import event.Event as eventModule

SESSIONS = {}

actionManager = ActionManager()
interactionManager = InteractionManager()
examManager = ExamManager()
eventManager = EventManager()


def buildInitialGameState(payload):
    difficulty = payload.get("difficulty") or "easy"
    name = payload.get("name") or "Player"
    maxHealth = int(payload.get("maxHealth") or 70)
    intelligence = int(payload.get("intelligence") or 70)
    player = characterFactory.createStudent(name, maxHealth, difficulty, intelligence)
    friends, repeat = characterFactory.createFriend(difficulty)
    professorPool, semesterProfessorPool, pendingChoices, choicePools = buildInitialProfessors(difficulty, 1, 1)
    gameState = GameState(
        difficulty=difficulty,
        player=player,
        friends=friends,
        professorPool=professorPool,
        semesterProfessorPool=semesterProfessorPool,
        grade=1,
        semester=1,
        semesterTurn=1,
        maxTurn=int(load_json("studentInfo.json")["turn"]),
        repeat=repeat,
    )
    gameState.addLogEntry("init", buildInitTrace(name, friends, semesterProfessorPool, pendingChoices))
    return gameState, pendingChoices, choicePools


def buildInitTrace(name, friends, semesterProfessorPool, pendingChoices):
    result = GameResult(success=True, message="Initial objects created.")
    traceLog = TraceLog()
    traceLog.addStep(
        "panel_input",
        sourceObjectId="runtime",
        targetObjectId="player",
        methodName="createStudent",
        message=f"Student name selected: {name}.",
    )
    traceLog.addStep("method_call", sourceObjectId="runtime", targetObjectId="player", methodName="createStudent", message="Student object created.")
    for friend in friends or []:
        traceLog.addStep("method_call", sourceObjectId="runtime", targetObjectId=f"friend:{friend.name}", methodName="createFriend", message=f"Friend object created: {friend.name}.")
    for professor in semesterProfessorPool or []:
        traceLog.addStep("method_call", sourceObjectId="runtime", targetObjectId=f"professor:{professor.name}:{professor.courseName}", methodName="createProfessor", message=f"Professor selected for {professor.courseName}.")
    for choice in pendingChoices or []:
        traceLog.addStep("panel_output", sourceObjectId="runtime", targetObjectId="runtime", methodName="selectProfessor", message=f"Professor candidates prepared: {choice.get('courseName', '')}.")
    result.traceSteps.extend(traceLog.steps)
    return result


def buildInitialProfessors(difficulty, grade, semester):
    professorPool = []
    semesterProfessorPool = []
    pendingChoices = []
    choicePools = {}
    courseNames = load_json("professorInfo.json")["courseName"][str(grade)][str(semester)]
    for courseName in courseNames:
        candidates = characterFactory.createProfessor(difficulty, courseName, professorPool)
        choicePools[courseName] = candidates
        selectedProfessor = candidates[0]
        semesterProfessorPool.append(selectedProfessor)
        professorPool = characterFactory.updateProfessorPool(professorPool, selectedProfessor, courseName)
        pendingChoices.append(
            {
                "kind": "professor_select",
                "courseName": courseName,
                "selectedIndex": 0,
                "candidates": [serializeProfessorChoice(candidate) for candidate in candidates],
            }
        )
    return professorPool, semesterProfessorPool, pendingChoices, choicePools


def buildTurnAdvanceTrace(beforeTurn, afterTurn):
    result = GameResult(success=True, message=f"Turn advanced: {beforeTurn} -> {afterTurn}.")
    traceLog = TraceLog()
    traceLog.addStep(
        "method_call",
        sourceObjectId="turnManager",
        sourceClass="TurnManager",
        methodName="advanceTurn",
        targetObjectId="gameState",
        message="TurnManager advanced the semester turn.",
    )
    traceLog.addStep(
        "field_write",
        sourceObjectId="turnManager",
        sourceClass="TurnManager",
        methodName="advanceTurn",
        targetObjectId="gameState",
        targetField="semesterTurn",
        before=beforeTurn,
        after=afterTurn,
        message="GameState.semesterTurn changed.",
    )
    result.addChange("gameState", "GameState", "semesterTurn", beforeTurn, afterTurn, "turn_advance")
    result.traceSteps.extend(traceLog.steps)
    return result


def applyWebAction(session, actionName):
    gameState = session["gameState"]
    session.pop("polymorphismResult", None)
    if session.get("pendingChoices"):
        result = GameResult(success=False, message="교수 선택을 먼저 완료해야 합니다.")
        gameState.addLogEntry("runtime_guard", result)
        return result
    if gameState.grade > 4 or session.get("ending"):
        result = GameResult(success=False, message="게임이 이미 종료되었습니다.")
        gameState.addLogEntry("runtime_guard", result)
        return result

    result = None
    if actionName == "study":
        result = actionManager.doStudy(gameState.player)
    elif actionName == "exercise":
        result = actionManager.doExercise(gameState.player)
    elif actionName == "rest":
        result = actionManager.doRest(gameState.player)
    elif actionName == "play":
        friend = next((item for item in (gameState.friends or []) if item.isConnect), None)
        if friend is not None:
            result = interactionManager.playWithFriend(gameState.player, friend)
    if result is not None:
        gameState.addLogEntry("player_action", result)

    originalOccurEvent = eventModule.Event.occurEvent
    eventModule.Event.occurEvent = lambda self: 1 if self.options else None
    eventBuffer = io.StringIO()
    try:
        with contextlib.redirect_stdout(eventBuffer):
            eventResult, gameState.player, gameState.friends, gameState.semesterProfessorPool, gameState.graduateRouteStep = eventManager.applyTurnEvents(
                gameState.player,
                gameState.friends,
                gameState.semesterProfessorPool,
                gameState.graduateRouteStep,
            )
    finally:
        eventModule.Event.occurEvent = originalOccurEvent
    eventOutput = [line.strip() for line in eventBuffer.getvalue().splitlines() if line.strip()]
    if eventOutput:
        eventResult.warnings.extend(eventOutput[-3:])
    gameState.addLogEntry("turn_event", eventResult)

    if gameState.graduateRouteStep >= config("ending", "graduateRouteCompleteStep"):
        session["ending"] = "GRADUATE_SCHOOL"
        return result

    beforeTurn = gameState.semesterTurn
    gameState.semesterTurn += 1
    gameState.addLogEntry("turn_advance", buildTurnAdvanceTrace(beforeTurn, gameState.semesterTurn))

    turnEnding = endingChecker.checkTurnEnding(gameState.player)
    if turnEnding is not None:
        session["ending"] = turnEnding
        return result

    if gameState.semesterTurn >= gameState.maxTurn:
        if gameState.grade == 4 and gameState.semester == 2:
            gameState.grade += 1
            session["ending"] = endingChecker.checkFinalEnding(average_gpa(gameState.player))
            return result

        examResult = examManager.calculateSemesterScore(gameState.player, gameState.semesterProfessorPool)
        gameState.addLogEntry("semester_exam", examResult)
        gameState.semesterTurn = 1
        gameState.player.nextSemester()

        semesterEnding = endingChecker.checkSemesterEnding(gameState.player)
        if semesterEnding is not None:
            session["ending"] = semesterEnding
            return result

        if gameState.semester > 1:
            gameState.semester = 1
            gameState.grade += 1
        else:
            gameState.semester = 2

        if gameState.grade > 4:
            session["ending"] = endingChecker.checkFinalEnding(average_gpa(gameState.player))
            return result

        (
            gameState.professorPool,
            gameState.semesterProfessorPool,
            session["pendingChoices"],
            session["choicePools"],
        ) = buildInitialProfessors(gameState.difficulty, gameState.grade, gameState.semester)

    for target in [gameState.player, *(gameState.friends or []), *(gameState.semesterProfessorPool or [])]:
        if hasattr(target, "updateStatuses"):
            target.updateStatuses()
    return result


def buildGraphState(gameState):
    return {
        "classes": [
            {"id": "PersonADT", "label": "PersonADT", "kind": "adt"},
            {"id": "Person", "label": "Person", "kind": "base"},
            {"id": "Student", "label": "Student", "kind": "class"},
            {"id": "Friend", "label": "Friend", "kind": "class"},
            {"id": "Professor", "label": "Professor", "kind": "class"},
        ],
        "inheritance": [
            {"from": "PersonADT", "to": "Person"},
            {"from": "Person", "to": "Student"},
            {"from": "Person", "to": "Friend"},
            {"from": "Person", "to": "Professor"},
        ],
        "instances": [
            {"id": "player", "label": gameState.player.name, "className": "Student"},
            *[
                {"id": f"friend:{friend.name}", "label": friend.name, "className": "Friend"}
                for friend in (gameState.friends or [])
            ],
            *[
                {"id": f"professor:{professor.name}:{professor.courseName}", "label": professor.name, "className": "Professor"}
                for professor in (gameState.semesterProfessorPool or [])
            ],
        ],
    }


def latestActiveEvent(gameState):
    for log in reversed(gameState.logs or []):
        result = log.get("result", {})
        events = result.get("occurredEvents", []) if isinstance(result, dict) else []
        if events:
            event = events[-1]
            eventType = event.get("type", "event") if isinstance(event, dict) else "event"
            eventName = event.get("name") or event.get("eventCheck") or eventType if isinstance(event, dict) else str(event)
            return {
                "id": f"{eventType}:{eventName}",
                "title": str(eventName).replace("_", " "),
                "name": eventName,
                "content": eventType,
                "selections": [],
                "type": eventType,
            }
    return None


def latestLogsFromPlayerAction(gameState):
    logs = gameState.logs or []
    for index in range(len(logs) - 1, -1, -1):
        if logs[index].get("phase") == "player_action":
            return logs[index:]
    return logs[-1:] if logs else []


def buildRuntimeScreen(gameState):
    predictedScores, predictedGpa = examManager.predictScores(gameState.player, gameState.semesterProfessorPool)
    recentLogs = latestLogsFromPlayerAction(gameState)
    resultLines = []
    changes = []
    events = []
    for log in recentLogs:
        result = log.get("result", {})
        if not isinstance(result, dict):
            continue
        if result.get("message"):
            resultLines.append(result["message"])
        resultLines.extend(result.get("warnings", []))
        changes.extend(result.get("changedValues", []))
        events.extend(result.get("occurredEvents", []))
    warnings = []
    if gameState.player.currentHealth < config("turn", "healthDanger"):
        warnings.append("체력이 위험합니다.")
    elif gameState.player.currentHealth < config("turn", "healthLow"):
        warnings.append("체력이 낮습니다.")
    if round(predictedGpa, 1) < config("turn", "academicWarningGpa"):
        warnings.append("예상 평점이 낮습니다.")
    if gameState.player.stress >= config("turn", "stressWarning"):
        warnings.append("스트레스가 높습니다.")
    return {
        "header": f"{gameState.grade}학년 {gameState.semester}학기 / 남은 턴 {max(gameState.maxTurn - gameState.semesterTurn, 0)}",
        "stats": [
            {"label": "HP", "value": f"{gameState.player.currentHealth}/{gameState.player.maxHealth}"},
            {"label": "Stress", "value": str(gameState.player.stress)},
            {"label": "INT", "value": str(gameState.player.intelligence)},
            {"label": "GPA", "value": str(gameState.player.gpa)},
        ],
        "predictedScores": predictedScores[:3],
        "predictedGpa": predictedGpa,
        "warnings": warnings,
        "resultLines": resultLines[-5:],
        "changes": changes[-6:],
        "events": events[-3:],
    }


def serializeState(session):
    gameState = session["gameState"]
    state = gameState.toDict()
    activeEvent = latestActiveEvent(gameState)
    if activeEvent is not None:
        state["activeEvent"] = activeEvent
    state["graph"] = buildGraphState(gameState)
    state["pendingChoices"] = session.get("pendingChoices", [])
    state["eventDeckCount"] = len(load_json("gameConfig.json")["turn"]["events"])
    state["ending"] = session.get("ending")
    state["polymorphismResult"] = session.get("polymorphismResult")
    state["runtimeScreen"] = buildRuntimeScreen(gameState)
    return state


def findTarget(gameState, targetId):
    if targetId == "player":
        return gameState.player
    for friend in gameState.friends or []:
        if f"friend:{friend.name}" == targetId:
            return friend
    for professor in gameState.semesterProfessorPool or []:
        if f"professor:{professor.name}:{professor.courseName}" == targetId:
            return professor
    return None


def runPolymorphism(gameState, targetId):
    target = findTarget(gameState, targetId)
    if target is None:
        return {"output": "", "targetId": targetId}
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        target.showStatus()
    traceLog = TraceLog()
    actualType = target.__class__.__name__
    traceLog.addStep(
        "polymorphic_dispatch",
        sourceObjectId="runtime",
        sourceClass="RuntimeUI",
        methodName="PersonADT.showStatus",
        targetObjectId=targetId,
        message=f"PersonADT.showStatus() call dispatched to {actualType}.showStatus().",
    )
    traceLog.addStep(
        "method_call",
        sourceObjectId=targetId,
        sourceClass=actualType,
        methodName=f"{actualType}.showStatus",
        targetObjectId=targetId,
        message=f"Overridden {actualType}.showStatus() executed.",
    )
    return {
        "targetId": targetId,
        "declaredType": "PersonADT",
        "actualType": actualType,
        "className": actualType,
        "method": "showStatus",
        "output": buffer.getvalue().strip(),
        "traceSteps": traceLog.toDict(),
    }


def runClassPolymorphism(gameState, className):
    target = None
    if className == "Student":
        target = gameState.player
    elif className == "Friend":
        target = (gameState.friends or [None])[0]
    elif className == "Professor":
        target = (gameState.semesterProfessorPool or [None])[0]
    if target is None:
        return {"className": className, "method": "previewBehavior", "output": ""}
    traceLog = TraceLog()
    traceLog.addStep(
        "polymorphic_dispatch",
        sourceObjectId="runtime",
        sourceClass="RuntimeUI",
        methodName="Person.previewBehavior",
        targetObjectId=className,
        message=f"Person.previewBehavior() call dispatched to {className}.previewBehavior().",
    )
    return {
        "className": className,
        "declaredType": "Person",
        "actualType": target.__class__.__name__,
        "method": "previewBehavior",
        "output": target.previewBehavior(),
        "traceSteps": traceLog.toDict(),
    }


def serializeProfessorChoice(professor):
    return {
        "name": professor.name,
        "courseName": professor.courseName,
        "favorability": professor.favorability,
        "tendency": professor.tendency,
        "examDifficulty": professor.examDifficulty,
        "portraitId": professor.portraitId,
    }


def applyProfessorChoice(session, courseName, selectedIndex):
    session.pop("polymorphismResult", None)
    pendingChoices = session.get("pendingChoices", [])
    gameState = session["gameState"]
    choicePools = session.get("choicePools", {})
    for item in list(pendingChoices):
        if item["courseName"] != courseName:
            continue
        candidates = choicePools.get(courseName, [])
        selectedIndex = max(0, min(selectedIndex, len(candidates) - 1))
        selectedProfessor = candidates[selectedIndex]
        for index, professor in enumerate(gameState.semesterProfessorPool):
            if professor.courseName == courseName:
                gameState.semesterProfessorPool[index] = selectedProfessor
                break
        pendingChoices.remove(item)
        break


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            return self.respondJson({"ok": True})
        if parsed.path == "/api/state":
            sessionId = self.headers.get("X-Session-Id")
            session = SESSIONS.get(sessionId)
            if session is None:
                return self.respondJson({"error": "session_not_found"}, status=HTTPStatus.NOT_FOUND)
            return self.respondJson(serializeState(session))
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0"))
        payload = json.loads(self.rfile.read(length) or b"{}")
        if parsed.path == "/api/start":
            gameState, pendingChoices, choicePools = buildInitialGameState(payload)
            sessionId = uuid.uuid4().hex
            SESSIONS[sessionId] = {"gameState": gameState, "pendingChoices": pendingChoices, "choicePools": choicePools}
            return self.respondJson({"sessionId": sessionId, "state": serializeState(SESSIONS[sessionId])})
        sessionId = self.headers.get("X-Session-Id")
        session = SESSIONS.get(sessionId)
        if session is None:
            return self.respondJson({"error": "session_not_found"}, status=HTTPStatus.NOT_FOUND)
        gameState = session["gameState"]
        if parsed.path == "/api/action":
            applyWebAction(session, payload.get("action"))
            return self.respondJson({"state": serializeState(session)})
        if parsed.path == "/api/select":
            applyProfessorChoice(session, payload.get("courseName", ""), int(payload.get("selectedIndex", 0)))
            return self.respondJson({"state": serializeState(session)})
        if parsed.path == "/api/polymorphism":
            className = payload.get("className")
            if className:
                result = runClassPolymorphism(gameState, className)
            else:
                result = runPolymorphism(gameState, payload.get("targetId", ""))
            session["polymorphismResult"] = result
            return self.respondJson(result)
        return self.respondJson({"error": "not_found"}, status=HTTPStatus.NOT_FOUND)

    def respondJson(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"http://127.0.0.1:{port}")
    server.serve_forever()
