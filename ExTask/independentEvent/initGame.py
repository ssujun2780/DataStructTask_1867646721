import character.createCharacter as cc
import independentEvent.printInfo as pI
import independentEvent.selectProfessor as sP
import event.eventGameManual as eGM

from gameData import clear_screen, config, pause, read_int, read_yes_no, text

def checkLibraries(): #지피티 딸깎
    required = ["random", "sys", "os", "json"] # rich는 richCompat에서 선택적으로 처리
    
    for lib in required:
        try:
            __import__(lib)
        except ImportError:
            print(text("init", "missingLibrary", library=lib))
            print(text("init", "installLibrary", library=lib))
            return False
    return True

def startConsole():
    while True:
        print(text("init", "menuTitle"))
        print(text("init", "menuStart"))
        print(text("init", "menuManual"))
        print(text("init", "menuExit"))
        try:
            choice = input(text("common", "prompt"))
        except EOFError:
            print(text("common", "eofPrintRetry"))
            continue
        except ValueError:
            print(text("common", "valuePrintRetry"))
            continue
        if choice == "1":
            return True
        elif choice == "2":
            eGM.gameManual()
        elif choice == "3":
            return False
        else:
            print(text("common", "invalidInput"))

def initGame(): #첫 턴 출력까지 여기서 실행
    clear_screen()
    selectDiff, selectName = " ", " "
    selectMaxHealth, selectIntelligence = 0, 0
    grade = config("student", "startGrade")
    semester = config("student", "startSemester")
    #난이도 설정
    print(text("init", "difficultyTitle"))
    print(text("init", "difficultyHelp"))
    print(text("init", "difficultyNote"))
    while True:
        try:
            selectDiff = input(text("common", "prompt"))
        except EOFError:
            print(text("common", "eofPrintRetry"))
            continue
        break
    clear_screen()
    #이름 설정
    print(text("init", "nameTitle"))
    print(text("init", "nameNote"))
    while True:
        try:
            selectName = input(text("common", "prompt"))
        except EOFError:
            print(text("common", "eofPrintRetry"))
            continue
        break
    clear_screen()
    #최대체력 설정
    maxHealthRange = config("student", "recommendedMaxHealth")
    print(text("init", "maxHealthTitle"))
    print(text("init", "numberNote"))
    print(text("init", "maxHealthRange", min=maxHealthRange[0], max=maxHealthRange[1]))
    while True:
        selectMaxHealth = read_int()
        if(selectMaxHealth <= 0):
            print(text("init", "positiveRequired"))
            continue
        if(selectMaxHealth < config("student", "lowMaxHealthWarning")):
            print(text("init", "lowMaxHealthConfirm"))
            check = read_yes_no()
            if check == 'n':
                continue
        break
    clear_screen()
    #지능 설정
    intelligenceRange = config("student", "recommendedIntelligence")
    print(text("init", "intelligenceTitle"))
    print(text("init", "numberNote"))
    print(text("init", "intelligenceRange", min=intelligenceRange[0], max=intelligenceRange[1]))
    while True:
        selectIntelligence = read_int()
        if(selectIntelligence <= 0):
            print(text("init", "positiveRequired"))
            continue
        if(selectIntelligence < config("student", "lowIntelligenceWarning")):
            print(text("init", "lowIntelligenceConfirm"))
            check = read_yes_no()
            if check == 'n':
                continue
        break
    player = cc.createStudent(selectName, selectMaxHealth, selectDiff, selectIntelligence) #플레이어 생성
    clear_screen()
    #친구 생성
    friend, repeat = cc.createFriend(selectDiff)
    print(text("common", "separator"))
    #플레이어 정보 확인
    print(text("init", "playerInfo"))
    player.printInfo()
    pause()
    clear_screen()
    print(text("common", "separator"))
    #친구 확인
    print(text("init", "friendInfo", count=repeat))
    pI.printFriendInfo(friend)
    pause()
    clear_screen()
    print(text("common", "separator"))
    #과목 확인
    print(text("turn", "semesterStart", grade=grade, semester=semester))
    startCourse = cc.load_json("professorInfo.json")["courseName"][str(grade)][str(semester)]
    print(text("turn", "requiredCourses"))
    count = 1
    for i in startCourse:
        print(f"{count}. {i}")
        count += 1
    pause(text("turn", "courseRegistration"))
    #교수 선택
    clear_screen()
    professorPool = []
    semesterProfessorPool = []
    professorPool, semesterProfessorPool = sP.selectProfessorIndependentEvent(professorPool, selectDiff, grade, semester)
    clear_screen()
    print(text("common", "separator"))
    #교수 정보 최종 확인
    print(text("turn", "selectedProfessor"))
    pI.printProfessorInfo(semesterProfessorPool)
    pause(text("init", "gameStartPause"))
    #studentInfo에 있는 turn(한 학기 마무리까지 걸리는 턴) 반환
    maxTurn = int(cc.load_json("studentInfo.json")["turn"])
    clear_screen()

    return selectDiff, player, friend, professorPool, semesterProfessorPool, grade, semester, maxTurn, repeat




    
    





        
