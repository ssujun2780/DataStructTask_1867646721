import character.createCharacter as cc
from richCompat import Columns, Console, Panel, Text
from gameData import clear_screen, text

console = Console()


def _printTempProfessor(tempProfessor, courseName): #지피티 딸깍 구현
    panels = []
    print(text("selectProfessor", "registrationTitle", course_name=courseName))

    for i, professor in enumerate(tempProfessor, start=1):
        body = Text()
        body.append(f"{text('labels', 'name')} : {professor.name}\n")
        body.append(f"{text('labels', 'tendency')} : {professor.tendency}\n")
        body.append(f"{text('labels', 'courseDifficulty')} : {professor.courseDifficulty}\n")
        body.append(f"{text('labels', 'examDifficulty')} : {professor.examDifficulty}")

        panel = Panel(
            body,
            title=text("selectProfessor", "candidateTitle", number=i),
            #subtitle=f"과목: {courseName}",
            expand=True
        )
        panels.append(panel)

    console.print()
    console.print(text("selectProfessor", "selectionTitle", course_name=courseName))
    console.print(Columns(panels, expand=True, equal=True))
    console.print()

    while True:
        try:
            selection = int(input(text("selectProfessor", "selectionPrompt")))
            if 1 <= selection <= len(tempProfessor):
                return selection
            console.print(text("selectProfessor", "rangeError", max_number=len(tempProfessor)))
        except ValueError:
            console.print(text("selectProfessor", "numberError"))


def _reviseProfessor(tempProfessor, grade, semester): #너무 힘들어서 지피티 딸깍으로 구현
    # 성향별 가중치
    tendencyWeight = {
        text("selectProfessor", "tendency", "generous"): (-1, -1),
        text("selectProfessor", "tendency", "strict"): (1, 1),
        text("selectProfessor", "tendency", "research"): (1, 0),
        text("selectProfessor", "tendency", "communicative"): (-1, 0),
        text("selectProfessor", "tendency", "severe"): (0, 1),
        text("selectProfessor", "tendency", "loose"): (0, -1),
    }

    # 학년-학기별 가중치
    semesterWeight = {
        (1, 1): (-2, -2),
        (1, 2): (-1, -2),
        (2, 1): (0, 0),
        (2, 2): (1, 0),
        (3, 1): (1, 0),
        (3, 2): (1, 1),
        (4, 1): (1, 1),
        (4, 2): (1, 1),
    }

    difficultyToInt = {
        text("selectProfessor", "difficulty", "easy"): 0,
        text("selectProfessor", "difficulty", "normal"): 1,
        text("selectProfessor", "difficulty", "hard"): 2,
    }

    intToDifficulty = {
        0: text("selectProfessor", "difficulty", "easy"),
        1: text("selectProfessor", "difficulty", "normal"),
        2: text("selectProfessor", "difficulty", "hard"),
    }

    def clamp(value):
        return max(0, min(2, value))

    classBonus, examBonus = semesterWeight[(grade, semester)]

    for professor in tempProfessor:
        classLevel = difficultyToInt[professor.courseDifficulty]
        examLevel = difficultyToInt[professor.examDifficulty]

        tendencyClassBonus, tendencyExamBonus = tendencyWeight[professor.tendency]

        classLevel += tendencyClassBonus + classBonus
        examLevel += tendencyExamBonus + examBonus

        classLevel = clamp(classLevel)
        examLevel = clamp(examLevel)

        professor.changeCoureDiff(intToDifficulty[classLevel])
        professor.changeExamDiff(intToDifficulty[examLevel])

    return tempProfessor

#학기마다 교수를 선택하는 독립 이벤트
def selectProfessorIndependentEvent(professorPool, difficulty, grade, semester):
    semesterProfessorPool = [] #학기에 수강하는 교수 정보 저장 -> 매학기마다 갱신되어야 함.
    #1. 학년 학기 데이터를 사용해 과목명을 불러온다.
    jsonInfo = cc.load_json("professorInfo.json")
    courseNames = jsonInfo["courseName"][str(grade)][str(semester)]
    #2. 과목마다 반복을 돌린다.
    for cn in courseNames:
        #3. 과목마다 3명씩 교수를 생성한다.
        tempProfessor = cc.createProfessor(difficulty, cn, professorPool)
        #4. 성향과 학년-학기에 따라 세부사항을 재조정한다.
        tempProfessor = _reviseProfessor(tempProfessor, grade, semester)
        #5. 예쁘게 출력하고 플레이어에게 선택을 하게 한다.
        selection = _printTempProfessor(tempProfessor, cn)
        #6. 선택된 교수만 풀에 넣는다.
        professorPool = cc.updateProfessorPool(professorPool, tempProfessor[selection-1], cn)
        semesterProfessorPool.append(tempProfessor[selection-1])
        clear_screen()
    #7. return
    return professorPool, semesterProfessorPool

