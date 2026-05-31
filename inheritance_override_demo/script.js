class PersonADT {
  introduce() {
    throw new Error("PersonADT.introduce()는 선언만 있고 구현은 하위 클래스가 담당합니다.");
  }

  getRole() {
    throw new Error("PersonADT.getRole()는 선언만 있고 구현은 하위 클래스가 담당합니다.");
  }

  dailyTask() {
    throw new Error("PersonADT.dailyTask()는 선언만 있고 구현은 하위 클래스가 담당합니다.");
  }

  printInfo() {
    throw new Error("PersonADT.printInfo()는 선언만 있고 구현은 하위 클래스가 담당합니다.");
  }
}

class Person extends PersonADT {
  constructor(name, age) {
    super();
    this.name = name;
    this.age = age;
  }

  introduce() {
    return `안녕하세요. 저는 ${this.name}입니다.`;
  }

  getRole() {
    return "일반 Person 객체입니다.";
  }

  dailyTask() {
    return "기본 생활을 합니다.";
  }

  printInfo() {
    return `이름: ${this.name}\n나이: ${this.age}`;
  }
}

class Student extends Person {
  constructor(name, age, studentId) {
    super(name, age);
    this.studentId = studentId;
  }

  introduce() {
    return `${super.introduce()} 자료구조를 배우는 학생입니다.`;
  }

  getRole() {
    return "Student: 수업을 듣고 과제를 제출합니다.";
  }

  dailyTask() {
    return "강의를 듣고, 노트를 정리하고, 코드를 실습합니다.";
  }

  printInfo() {
    return `${super.printInfo()}\n학번: ${this.studentId}`;
  }
}

class Professor extends Person {
  constructor(name, age, office) {
    super(name, age);
    this.office = office;
  }

  introduce() {
    return `${super.introduce()} 자료구조를 가르치는 교수입니다.`;
  }

  getRole() {
    return "Professor: 강의하고 학생의 질문에 답합니다.";
  }

  dailyTask() {
    return "강의 자료를 만들고, 연구하고, 면담을 진행합니다.";
  }

  printInfo() {
    return `${super.printInfo()}\n연구실: ${this.office}`;
  }
}

class Friend extends Person {
  constructor(name, age, hobby) {
    super(name, age);
    this.hobby = hobby;
  }

  introduce() {
    return `${super.introduce()} 같이 공부하는 친구입니다.`;
  }

  getRole() {
    return "Friend: 함께 문제를 풀고 서로 피드백합니다.";
  }

  dailyTask() {
    return "스터디 시간을 잡고 어려운 문제를 같이 해결합니다.";
  }

  printInfo() {
    return `${super.printInfo()}\n취미: ${this.hobby}`;
  }
}

const samples = {
  PersonADT: new PersonADT(),
  Person: new Person("김사람", 30),
  Student: new Student("이학생", 21, "20260001"),
  Professor: new Professor("박교수", 47, "공학관 301호"),
  Friend: new Friend("최친구", 22, "알고리즘 스터디")
};

const codeSnippets = {
  PersonADT: `class PersonADT {
  introduce();  // 선언만 있음
  getRole();    // 선언만 있음
  dailyTask();  // 선언만 있음
  printInfo();  // 선언만 있음
}`,
  Person: `class Person extends PersonADT {
  introduce() {
    return "기본 자기소개";
  }

  printInfo() {
    return "공통 정보 출력";
  }
}`,
  Student: `class Student extends Person {
  introduce() {
    return "학생 방식 자기소개";
  }

  dailyTask() {
    return "강의, 과제, 실습";
  }
}`,
  Professor: `class Professor extends Person {
  getRole() {
    return "강의와 연구";
  }

  dailyTask() {
    return "수업 준비와 면담";
  }
}`,
  Friend: `class Friend extends Person {
  getRole() {
    return "스터디 동료";
  }

  dailyTask() {
    return "함께 문제 해결";
  }
}`
};

let selectedClass = "PersonADT";

const output = document.querySelector("#output");
const selectedInfo = document.querySelector("#selectedInfo");
const classCode = document.querySelector("#classCode");
const classButtons = document.querySelectorAll("[data-class]");
const methodButtons = document.querySelectorAll("[data-method]");
const polyButtons = document.querySelectorAll("[data-poly]");

function setSelectedClass(className) {
  selectedClass = className;
  selectedInfo.textContent = `현재 선택: ${className}`;
  classCode.textContent = codeSnippets[className];

  classButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.class === className);
  });
}

function writeOutput(methodName, result) {
  output.textContent = `[${selectedClass}.${methodName} 실행 결과]\n\n${result}`;
}

classButtons.forEach((button) => {
  button.addEventListener("click", () => setSelectedClass(button.dataset.class));
});

methodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const methodName = button.dataset.method;
    const target = samples[selectedClass];

    try {
      writeOutput(methodName, target[methodName]());
    } catch (error) {
      writeOutput(methodName, error.message);
    }
  });
});

polyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const methodName = button.dataset.poly;
    const classNames = ["Student", "Professor", "Friend"];
    const result = classNames
      .map((className) => `${className}: ${samples[className][methodName]()}`)
      .join("\n\n");

    output.textContent = `[다형성 비교: ${methodName}]\n\n${result}`;
  });
});

document.querySelector("#clearOutput").addEventListener("click", () => {
  output.textContent = "출력창을 비웠습니다.";
});

setSelectedClass(selectedClass);
