from event.Event import Event
import random
from gameData import clear_screen, config, pause, text


def _avgGpa(player):
    if player.semester <= 1:
        return 0.0
    return round(player.gpa / (player.semester - 1), 1)


def _clear():
    clear_screen()


def _pause():
    pause()
    _clear()


def _professor_text(event_id, field, **values):
    return text("eventText", "professorEvent", event_id, field, **values)


def _simpleEvent(title, content, options):
    return Event(title, content, options).occurEvent()


def _render_event(event_id, professor=None, player=None, option_values=None, **values):
    base_values = dict(values)
    if professor is not None:
        base_values.setdefault("professor_name", professor.name)
    if player is not None:
        base_values.setdefault("player_name", player.name)

    option_values = option_values or [{}, {}]
    title = _professor_text(event_id, "title", **base_values)
    content = _professor_text(event_id, "content", **base_values)
    options = [
        _professor_text(event_id, "option1", **{**base_values, **option_values[0]}),
        _professor_text(event_id, "option2", **{**base_values, **option_values[1]}),
    ]
    return _simpleEvent(title, content, options)


def commonOfficeHourEvent(player, professor):
    select = _render_event(
        "commonOfficeHour",
        professor=professor,
        option_values=[
            {"intelligence_delta": 2, "stress_delta": 2, "favor_delta": 2},
            {"favor_delta": -1},
        ],
    )

    if select == 1:
        player.changeIntelligence(2)
        player.changeStress(2)
        professor.changeFavorability(2)
        print(_professor_text("commonOfficeHour", "success"))
    else:
        professor.changeFavorability(-1)
        print(_professor_text("commonOfficeHour", "reject"))

    _pause()
    return player, professor


def commonMaterialArrangeEvent(player, professor):
    select = _render_event(
        "commonMaterialArrange",
        professor=professor,
        option_values=[
            {"health_delta": -4, "favor_delta": 3},
            {"favor_delta": -2},
        ],
    )

    if select == 1:
        player.changeCurrentHealth(-4)
        professor.changeFavorability(3)
        print(_professor_text("commonMaterialArrange", "success"))
    else:
        professor.changeFavorability(-2)
        print(_professor_text("commonMaterialArrange", "reject"))

    _pause()
    return player, professor


def commonReferenceBookEvent(player, professor):
    select = _render_event(
        "commonReferenceBook",
        professor=professor,
        option_values=[
            {"intelligence_delta": 3, "stress_delta": 2, "favor_delta": 1},
            {"favor_delta": -1},
        ],
    )

    if select == 1:
        player.changeIntelligence(3)
        player.changeStress(2)
        professor.changeFavorability(1)
        print(_professor_text("commonReferenceBook", "success"))
    else:
        professor.changeFavorability(-1)
        print(_professor_text("commonReferenceBook", "reject"))

    _pause()
    return player, professor


def generousProfessorEvent(player, professor):
    select = _render_event(
        "generous",
        professor=professor,
        option_values=[
            {"intelligence_delta": 2, "stress_delta": 4, "favor_delta": 2},
            {"favor_delta": -1},
        ],
    )

    if select == 1:
        player.changeIntelligence(2)
        player.changeStress(4)
        professor.changeFavorability(2)
        print(_professor_text("generous", "success"))
    else:
        professor.changeFavorability(-1)
        print(_professor_text("generous", "reject"))

    _pause()
    return player, professor


def strictProfessorEvent(player, professor):
    select = _render_event(
        "strict",
        professor=professor,
        option_values=[
            {"intelligence_delta": 3, "stress_delta": 4, "favor_delta": 2},
            {"stress_delta": 2, "favor_delta": -3},
        ],
    )

    if select == 1:
        player.changeIntelligence(3)
        player.changeStress(4)
        professor.changeFavorability(2)
        print(_professor_text("strict", "success"))
    else:
        player.changeStress(2)
        professor.changeFavorability(-3)
        print(_professor_text("strict", "reject"))

    _pause()
    return player, professor


def researchProfessorEvent(player, professor):
    select = _render_event(
        "research",
        professor=professor,
        option_values=[
            {"intelligence_delta": 5, "stress_delta": 4, "favor_delta": 3},
            {"favor_delta": -2},
        ],
    )

    if select == 1:
        player.changeIntelligence(5)
        player.changeStress(4)
        professor.changeFavorability(3)
        print(_professor_text("research", "success"))
    else:
        professor.changeFavorability(-2)
        print(_professor_text("research", "reject"))

    _pause()
    return player, professor


def communicativeProfessorEvent(player, professor):
    select = _render_event(
        "communicative",
        professor=professor,
        option_values=[
            {"intelligence_delta": 3, "stress_delta": 2, "favor_delta": 2},
            {"favor_delta": -2},
        ],
    )

    if select == 1:
        player.changeIntelligence(3)
        player.changeStress(2)
        professor.changeFavorability(2)
        print(_professor_text("communicative", "success"))
    else:
        professor.changeFavorability(-2)
        print(_professor_text("communicative", "reject"))

    _pause()
    return player, professor


def severeProfessorEvent(player, professor):
    select = _render_event(
        "severe",
        professor=professor,
        option_values=[
            {"health_delta": -5, "intelligence_delta": 3, "favor_delta": 2},
            {"stress_delta": 2, "favor_delta": -3},
        ],
    )

    if select == 1:
        player.changeCurrentHealth(-5)
        player.changeIntelligence(3)
        professor.changeFavorability(2)
        print(_professor_text("severe", "success"))
    else:
        player.changeStress(2)
        professor.changeFavorability(-3)
        print(_professor_text("severe", "reject"))

    _pause()
    return player, professor


def looseProfessorEvent(player, professor):
    select = _render_event(
        "loose",
        professor=professor,
        option_values=[
            {"intelligence_delta": 4, "stress_delta": 1, "favor_delta": 1},
            {"stress_delta": -2, "favor_delta": -2},
        ],
    )

    if select == 1:
        player.changeIntelligence(4)
        player.changeStress(1)
        professor.changeFavorability(1)
        print(_professor_text("loose", "success"))
    else:
        player.changeStress(-2)
        professor.changeFavorability(-2)
        print(_professor_text("loose", "reject"))

    _pause()
    return player, professor


def _canTriggerGraduateRoute(player, professor, graduateRouteStep, routeIndex):
    routeConfig = config("professor", "graduateRoute")[routeIndex]
    if graduateRouteStep != routeIndex:
        return False
    if professor.tendency != text("selectProfessor", "tendency", "research"):
        return False
    if professor.favorability < routeConfig["favor"]:
        return False
    if player.intelligence < routeConfig["intelligence"]:
        return False
    if _avgGpa(player) < routeConfig["gpa"]:
        return False
    return True


def graduateRouteEvent1(player, professor, graduateRouteStep):
    if not _canTriggerGraduateRoute(player, professor, graduateRouteStep, 0):
        return player, professor, graduateRouteStep, 0

    select = _render_event(
        "graduate1",
        professor=professor,
        option_values=[
            {"intelligence_delta": 4, "stress_delta": 5, "favor_delta": 5},
            {"favor_delta": -3},
        ],
    )

    if select == 1:
        player.changeIntelligence(4)
        player.changeStress(5)
        professor.changeFavorability(5)
        graduateRouteStep = 1
        print(_professor_text("graduate1", "success"))
    else:
        professor.changeFavorability(-3)
        print(_professor_text("graduate1", "reject"))

    _pause()
    return player, professor, graduateRouteStep, 1


def graduateRouteEvent2(player, professor, graduateRouteStep):
    if not _canTriggerGraduateRoute(player, professor, graduateRouteStep, 1):
        return player, professor, graduateRouteStep, 0

    select = _render_event(
        "graduate2",
        professor=professor,
        option_values=[
            {"intelligence_delta": 5, "stress_delta": 6, "favor_delta": 5},
            {"favor_delta": -4},
        ],
    )

    if select == 1:
        player.changeIntelligence(5)
        player.changeStress(6)
        professor.changeFavorability(5)
        graduateRouteStep = 2
        print(_professor_text("graduate2", "success"))
    else:
        professor.changeFavorability(-4)
        print(_professor_text("graduate2", "reject"))

    _pause()
    return player, professor, graduateRouteStep, 1


def graduateRouteEvent3(player, professor, graduateRouteStep):
    if not _canTriggerGraduateRoute(player, professor, graduateRouteStep, 2):
        return player, professor, graduateRouteStep, 0

    select = _render_event(
        "graduate3",
        professor=professor,
        player=player,
        option_values=[
            {"stress_delta": 8, "favor_delta": 8},
            {"favor_delta": -6},
        ],
    )

    if select == 1:
        player.changeStress(8)
        professor.changeFavorability(8)
        graduateRouteStep = 3
        print(_professor_text("graduate3", "success"))
    else:
        professor.changeFavorability(-6)
        print(_professor_text("graduate3", "reject"))

    _pause()
    return player, professor, graduateRouteStep, 1


def _callTendencyEvent(player, professor):
    tendency = professor.tendency

    if tendency == text("selectProfessor", "tendency", "generous"):
        return generousProfessorEvent(player, professor)
    elif tendency == text("selectProfessor", "tendency", "strict"):
        return strictProfessorEvent(player, professor)
    elif tendency == text("selectProfessor", "tendency", "research"):
        return researchProfessorEvent(player, professor)
    elif tendency == text("selectProfessor", "tendency", "communicative"):
        return communicativeProfessorEvent(player, professor)
    elif tendency == text("selectProfessor", "tendency", "severe"):
        return severeProfessorEvent(player, professor)
    elif tendency == text("selectProfessor", "tendency", "loose"):
        return looseProfessorEvent(player, professor)

    return player, professor


def _callCommonEvent(player, professor):
    roll = random.random()
    firstSplit, secondSplit = config("professor", "commonEventSplit")

    if roll < firstSplit:
        return commonOfficeHourEvent(player, professor)
    elif roll < secondSplit:
        return commonMaterialArrangeEvent(player, professor)
    else:
        return commonReferenceBookEvent(player, professor)


def callProfessorEvent(player, semesterProfessorPool, graduateRouteStep):
    if not semesterProfessorPool:
        return player, semesterProfessorPool, graduateRouteStep, 0

    professor = random.choice(semesterProfessorPool)

    if professor.tendency == text("selectProfessor", "tendency", "research"):
        if graduateRouteStep == 0 and random.random() < config("professor", "graduateRouteChance"):
            player, professor, graduateRouteStep, check = graduateRouteEvent1(player, professor, graduateRouteStep)
            if check == 1:
                return player, semesterProfessorPool, graduateRouteStep, 2

        elif graduateRouteStep == 1 and random.random() < config("professor", "graduateRouteChance"):
            player, professor, graduateRouteStep, check = graduateRouteEvent2(player, professor, graduateRouteStep)
            if check == 1:
                return player, semesterProfessorPool, graduateRouteStep, 2

        elif graduateRouteStep == 2 and random.random() < config("professor", "graduateRouteChance"):
            player, professor, graduateRouteStep, check = graduateRouteEvent3(player, professor, graduateRouteStep)
            if check == 1:
                return player, semesterProfessorPool, graduateRouteStep, 2

    if random.random() < config("professor", "commonEventChance"):
        if random.random() < config("professor", "tendencyEventChance"):
            player, professor = _callTendencyEvent(player, professor)
        else:
            player, professor = _callCommonEvent(player, professor)
        return player, semesterProfessorPool, graduateRouteStep, 1

    return player, semesterProfessorPool, graduateRouteStep, 0
