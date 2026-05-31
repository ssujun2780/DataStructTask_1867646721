from event.Event import Event

import random
from gameData import clear_screen, text


def _student_text(event_id, field, **values):
    return text("eventText", "studentEvent", event_id, field, **values)


def _show_student_event(event_id, content_field="content", **values):
    Event(
        _student_text(event_id, "title", **values),
        _student_text(event_id, content_field, **values),
        [],
    ).occurEvent()


def eurecaEvent(player):
    clear_screen()
    intelligence_delta = 5
    _show_student_event("eureka", intelligence_delta=intelligence_delta)
    player.changeIntelligence(intelligence_delta)
    return player


def explosionConcentrationEvent(player):
    clear_screen()
    amount = 2
    _show_student_event("concentration", amount=amount)
    player.changeIntelligence(amount)
    player.changeMaxHealth(amount)
    return player


def slumpEvent(player):
    clear_screen()
    stress_delta = 10
    _show_student_event("slump", stress_delta=stress_delta)
    player.changeStress(stress_delta)
    return player


def sickEvent(player):
    clear_screen()
    percent = 10
    _show_student_event("sick", percent=percent)
    decrease = int(player.maxHealth * (percent / 100))
    player.changeMaxHealth(-decrease)
    if player.currentHealth > player.maxHealth:
        player.changeCurrentHealth(player.maxHealth - player.currentHealth)
    return player


def goodHealthEvent(player):
    clear_screen()
    percent = 10
    _show_student_event("goodHealth", percent=percent)
    increase = int(player.maxHealth * (percent / 100))
    player.changeMaxHealth(increase)
    return player


def DoomsDayEvent(player):
    clear_screen()
    stress_delta = 100
    roll = random.random()
    if roll < 0.2:
        content_field = "content1"
    elif 0.2 <= roll < 0.4:
        content_field = "content2"
    elif 0.4 <= roll < 0.6:
        content_field = "content3"
    elif 0.6 <= roll < 0.8:
        content_field = "content4"
    else:
        content_field = "content5"

    _show_student_event("doomsDay", content_field, stress_delta=stress_delta)
    player.changeStress(stress_delta)
    return player


def hyeontaEvent(player):
    clear_screen()
    stress_delta = 5
    roll = random.random()
    if roll < 0.2:
        content_field = "content1"
    elif 0.2 <= roll < 0.4:
        content_field = "content2"
    elif 0.4 <= roll < 0.6:
        content_field = "content3"
    elif 0.6 <= roll < 0.8:
        content_field = "content4"
    elif 0.8 <= roll < 0.99:
        content_field = "content5"
    else:
        content_field = "content6"

    _show_student_event("hyeonta", content_field, stress_delta=stress_delta)
    player.changeStress(stress_delta)
    return player
