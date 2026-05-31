from core.results import GameResult
from core.trace import TraceLog


class TurnManager:
    def __init__(
        self,
        actionManager,
        interactionManager,
        examManager,
        eventManager,
        semesterManager,
        printTurnScreen,
        showInfoMenu,
        readChoice,
        validPlayerActionMenus,
        playerActionFromMenu,
        playerActionType,
        callFriend,
        advicePlayFriendEvent,
        checkSemesterEnding,
        checkTurnEnding,
        clearScreen,
        pause,
        config,
        text,
        printMessage,
        printWarning,
    ):
        self.actionManager = actionManager
        self.interactionManager = interactionManager
        self.examManager = examManager
        self.eventManager = eventManager
        self.semesterManager = semesterManager
        self.printTurnScreen = printTurnScreen
        self.showInfoMenu = showInfoMenu
        self.readChoice = readChoice
        self.validPlayerActionMenus = validPlayerActionMenus
        self.playerActionFromMenu = playerActionFromMenu
        self.playerActionType = playerActionType
        self.callFriend = callFriend
        self.advicePlayFriendEvent = advicePlayFriendEvent
        self.checkSemesterEnding = checkSemesterEnding
        self.checkTurnEnding = checkTurnEnding
        self.clearScreen = clearScreen
        self.pause = pause
        self.config = config
        self.text = text
        self.printMessage = printMessage
        self.printWarning = printWarning

    def runTurn(self, gameState):
        turnResult, phaseResults = self.runLegacyTurn(
                gameState.player,
                gameState.friends,
                gameState.repeat,
                gameState.professorPool,
                gameState.semesterProfessorPool,
                gameState.grade,
                gameState.semester,
                gameState.semesterTurn,
                gameState.maxTurn,
                gameState.difficulty,
                gameState.graduateRouteStep,
            )
        self._updateStatuses(gameState.player)
        for friend in gameState.friends or []:
            self._updateStatuses(friend)
        for professor in gameState.semesterProfessorPool or []:
            self._updateStatuses(professor)
        for phase, result in phaseResults:
            gameState.addLogEntry(phase, result)
        return gameState.applyTurnResult(turnResult)

    def runLegacyTurn(
        self,
        player,
        friend,
        repeat,
        professorPool,
        semesterProfessorPool,
        grade,
        semester,
        semesterTurn,
        maxTurn,
        difficulty,
        graduateRouteStep,
    ):
        phaseResults = []
        if semesterTurn == maxTurn:
            shouldReturn, semesterResult = self._handleSemesterBoundary(
                player,
                friend,
                professorPool,
                semesterProfessorPool,
                grade,
                semester,
                semesterTurn,
                difficulty,
                graduateRouteStep,
                phaseResults,
            )
            if shouldReturn:
                return semesterResult, phaseResults

            (
                player,
                friend,
                professorPool,
                semesterProfessorPool,
                grade,
                semester,
                semesterTurn,
                graduateRouteStep,
            ) = semesterResult

        action = self._readAction(
            player,
            friend,
            repeat,
            professorPool,
            semesterProfessorPool,
            grade,
            semester,
            semesterTurn,
            maxTurn,
        )

        self.clearScreen()
        player, friend = self._applyAction(action, player, friend, phaseResults)
        self.clearScreen()

        eventResult, player, friend, semesterProfessorPool, graduateRouteStep = self.eventManager.applyTurnEvents(
            player,
            friend,
            semesterProfessorPool,
            graduateRouteStep,
        )
        phaseResults.append(("turn_event", eventResult))

        if graduateRouteStep >= self.config("ending", "graduateRouteCompleteStep"):
            return (player, friend, professorPool, semesterProfessorPool, grade, semester, semesterTurn, "GRADUATE_SCHOOL", graduateRouteStep), phaseResults

        semesterTurn += 1
        turnEnding = self.checkTurnEnding(player)
        if turnEnding is not None:
            return (player, friend, professorPool, semesterProfessorPool, grade, semester, semesterTurn, turnEnding, graduateRouteStep), phaseResults

        return (player, friend, professorPool, semesterProfessorPool, grade, semester, semesterTurn, None, graduateRouteStep), phaseResults

    def _handleSemesterBoundary(
        self,
        player,
        friend,
        professorPool,
        semesterProfessorPool,
        grade,
        semester,
        semesterTurn,
        difficulty,
        graduateRouteStep,
        phaseResults,
    ):
        if grade == 4 and semester == 2:
            self.printMessage(self.text("turn", "graduated"))
            return True, (player, friend, professorPool, semesterProfessorPool, grade + 1, semester, semesterTurn, None, graduateRouteStep)

        examResult = self.examManager.calculateSemesterScore(player, semesterProfessorPool)
        phaseResults.append(("semester_exam", examResult))
        self.printMessage(examResult.message)
        for warning in examResult.warnings:
            self.printWarning(warning)

        if semester != 2:
            semester += 1
        else:
            semester = 1
            grade += 1
        semesterTurn = 1
        player.nextSemester()

        semesterEnding = self.checkSemesterEnding(player)
        if semesterEnding is not None:
            return True, (player, friend, professorPool, semesterProfessorPool, grade, semester, semesterTurn, semesterEnding, graduateRouteStep)

        self.pause(self.text("turn", "examEnded"))
        self.clearScreen()
        professorPool, semesterProfessorPool = self.semesterManager.startNewSemester(grade, semester, professorPool, difficulty)
        return False, (player, friend, professorPool, semesterProfessorPool, grade, semester, semesterTurn, graduateRouteStep)

    def _readAction(
        self,
        player,
        friend,
        repeat,
        professorPool,
        semesterProfessorPool,
        grade,
        semester,
        semesterTurn,
        maxTurn,
    ):
        while True:
            self.printTurnScreen(player, semesterProfessorPool, grade, semester, semesterTurn, maxTurn)
            select = self.readChoice(self.validPlayerActionMenus())
            action = self.playerActionFromMenu(select)
            if action.actionType == self.playerActionType.INFO:
                self.showInfoMenu(friend, repeat, professorPool, semesterProfessorPool, grade, semester)
                self.clearScreen()
                continue
            return action

    def _applyAction(self, action, player, friend, phaseResults):
        if action.actionType == self.playerActionType.STUDY:
            return self._doStudy(player, friend, phaseResults)
        if action.actionType == self.playerActionType.PLAY:
            return self._doPlay(player, friend, phaseResults)
        if action.actionType == self.playerActionType.EXERCISE:
            return self._doExercise(player, friend, phaseResults)
        if action.actionType == self.playerActionType.REST:
            return self._doRest(player, friend, phaseResults)
        return player, friend

    def _doStudy(self, player, friend, phaseResults):
        result = self.actionManager.doStudy(player)
        phaseResults.append(("player_action", result))
        self.printMessage(result.message)
        self.printMessage(self.text("turn", "fixedTip"))
        self.pause()
        return player, friend

    def _doPlay(self, player, friend, phaseResults):
        selection = self.callFriend(friend or [])
        if selection is None:
            return player, friend
        result = self.interactionManager.playWithFriend(player, selection)
        phaseResults.append(("player_action", result))
        self.printMessage(result.message)
        for warning in result.warnings:
            self.printMessage(warning)
        self.pause()
        return player, friend

    def _doExercise(self, player, friend, phaseResults):
        result = self.actionManager.doExercise(player)
        phaseResults.append(("player_action", result))
        self.printMessage(result.message)
        for warning in result.warnings:
            self.printMessage(warning)
        self.printMessage(self.text("turn", "exerciseTip"))
        self.pause()
        return player, friend

    def _doRest(self, player, friend, phaseResults):
        checkEvent = 0
        action = self.config("actions", "rest")
        if self._shouldTriggerFriendRestEvent(action):
            result = self.advicePlayFriendEvent(player, friend or [])
            if result is not None:
                player, friend, checkEvent = result
                phaseResults.append(self._buildFriendRestEventResult())
        if checkEvent == 0:
            result = self.actionManager.doRest(player)
            phaseResults.append(("player_action", result))
            self.printMessage(result.message)
            for warning in result.warnings:
                self.printMessage(warning)
            self.pause()
        return player, friend

    def _shouldTriggerFriendRestEvent(self, actionConfig):
        import random

        return random.random() < actionConfig["friendEventChance"]

    def _buildFriendRestEventResult(self):
        traceLog = TraceLog()
        traceLog.addStep(
            "event_trigger",
            sourceObjectId="turnManager",
            sourceClass="TurnManager",
            methodName="advicePlayFriendEvent",
            message="Friend rest event triggered.",
        )
        result = GameResult(success=True, message="")
        result.occurredEvents.append({"type": "friend_event", "name": "rest_friend_event"})
        result.traceSteps.extend(traceLog.steps)
        return "player_action", result

    def _updateStatuses(self, target):
        if hasattr(target, "updateStatuses"):
            target.updateStatuses()
