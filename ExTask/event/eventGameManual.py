from event.Event import Event
from gameData import clear_screen, pause, text


def gameManual():
    startSelection = Event(
        text("manual", "title"),
        text("manual", "content"),
        [text("manual", "internalOption"), text("manual", "structureOption")],
    ).occurEvent()

    if startSelection == 1:
        print(text("manual", "internalText"))
    else:
        print(text("manual", "structureText"))
    pause()
    clear_screen()
