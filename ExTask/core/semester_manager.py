import character.createCharacter as characterFactory
import independentEvent.printInfo as printInfo
import independentEvent.selectProfessor as selectProfessor
from gameData import clear_screen, pause, text


class SemesterManager:
    def startNewSemester(self, grade, semester, professorPool, difficulty):
        print(text("turn", "semesterStart", grade=grade, semester=semester))
        courses = characterFactory.load_json("professorInfo.json")["courseName"][str(grade)][str(semester)]
        print(text("turn", "requiredCourses"))
        for count, course in enumerate(courses, start=1):
            print(f"{count}. {course}")
        pause(text("turn", "courseRegistration"))

        clear_screen()
        professorPool, semesterProfessorPool = selectProfessor.selectProfessorIndependentEvent(
            professorPool,
            difficulty,
            grade,
            semester,
        )
        clear_screen()
        print(text("common", "separator"))
        print(text("turn", "selectedProfessor"))
        printInfo.printProfessorInfo(semesterProfessorPool)
        pause(text("turn", "newSemester"))
        clear_screen()
        return professorPool, semesterProfessorPool
