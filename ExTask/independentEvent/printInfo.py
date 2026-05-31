from richCompat import Columns, Console, Panel, Text
from gameData import text

#Player, Student는 유일하므로 Student 구조체에 구현되어있음

console = Console()

def printFriendInfo(friend): #프랜드 리스트 넣어서 한번에 게임 내에 출력시키는 함수
    panels = []
    for i, friend in enumerate(friend, start=1):
        body = Text()
        body.append(f"{text('labels', 'name')} : {friend.name}\n")
        body.append(f"{text('labels', 'health')} : {friend.maxHealth}\n")
        body.append(f"{text('labels', 'favorability')} : {friend.favorability}\n")
        body.append(f"{text('labels', 'intelligence')} : {friend.intelligence}\n")
        # body.append(f"입대여부 : {friend.isArmy}\n")
        body.append(f"{text('labels', 'connect')} : {friend.isConnect}")

        panel = Panel(
            body,
            title=text("info", "friendPanelTitle", number=i),
            expand=True
        )
        panels.append(panel)

    console.print()
    console.print(text("info", "friendListTitle"))
    console.print(Columns(panels, expand=True, equal=True))
    console.print()

def printProfessorInfo(professorPool):
    panels = []

    for i, professor in enumerate(professorPool, start=1):
        body = Text()
        body.append(f"{text('labels', 'name')} : {professor.name}\n")
        body.append(f"{text('labels', 'tendency')} : {professor.tendency}\n")
        body.append(f"{text('labels', 'course')}: {professor.courseName}\n")
        body.append(f"{text('labels', 'courseDifficulty')} : {professor.courseDifficulty}\n")
        body.append(f"{text('labels', 'examDifficulty')} : {professor.examDifficulty}\n")
        body.append(f"{text('labels', 'favorability')} : {professor.favorability}")

        panel = Panel(
            body,
            #title=f"[bold cyan]{i}번 후보[/bold cyan]",
            expand=True
        )
        panels.append(panel)

    console.print()
    console.print(Columns(panels, expand=True, equal=True))
    console.print()
