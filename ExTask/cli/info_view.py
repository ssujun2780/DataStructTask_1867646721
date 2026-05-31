import event.eventGameManual as gameManual
import independentEvent.printInfo as printInfo
from gameData import clear_screen, config, pause, read_choice, text


def showInfoMenu(friends, repeat, professorPool, semesterProfessorPool, grade, semester):
    while True:
        clear_screen()
        print(text("turn", "infoTitle"))
        print(text("turn", "infoFriend"))
        print(text("turn", "infoSemesterProfessor"))
        print(text("turn", "infoAllProfessor"))
        print(text("turn", "infoManual"))
        print(text("turn", "infoExit"))
        print(text("common", "enterNumber"))

        select = read_choice(config("turn", "validActions"))
        if select == 1:
            clear_screen()
            print(text("turn", "friendCount", count=repeat))
            printInfo.printFriendInfo(friends or [])
            pause()
        elif select == 2:
            clear_screen()
            print(text("turn", "semesterProfessorInfo", grade=grade, semester=semester))
            printInfo.printProfessorInfo(semesterProfessorPool or [])
            pause()
        elif select == 3:
            clear_screen()
            print(text("turn", "allProfessorInfo"))
            print(text("turn", "duplicateProfessorNote"))
            printInfo.printProfessorInfo(professorPool or [])
            pause()
        elif select == 4:
            gameManual.gameManual()
        else:
            break
