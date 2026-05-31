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

const defaultCodeSnippets = {
  PersonADT: `from abc import ABC, abstractmethod

class PersonADT(ABC):
    @abstractmethod
    def introduce(self):
        pass

    @abstractmethod
    def get_role(self):
        pass

    @abstractmethod
    def daily_task(self):
        pass

    @abstractmethod
    def print_info(self):
        pass`,
  Person: `class Person(PersonADT):
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def introduce(self):
        return f"안녕하세요. 저는 {self.name}입니다."

    def get_role(self):
        return "일반 Person 객체입니다."

    def daily_task(self):
        return "기본 생활을 합니다."

    def print_info(self):
        return f"이름: {self.name}\\n나이: {self.age}"`,
  Student: `class Student(Person):
    def __init__(self, name, age, student_id):
        super().__init__(name, age)
        self.student_id = student_id

    def introduce(self):
        return super().introduce() + " 자료구조를 배우는 학생입니다."

    def get_role(self):
        return "Student: 수업을 듣고 과제를 제출합니다."

    def daily_task(self):
        return "강의를 듣고, 노트를 정리하고, 코드를 실습합니다."

    def print_info(self):
        return super().print_info() + f"\\n학번: {self.student_id}"`,
  Professor: `class Professor(Person):
    def __init__(self, name, age, office):
        super().__init__(name, age)
        self.office = office

    def introduce(self):
        return super().introduce() + " 자료구조를 가르치는 교수입니다."

    def get_role(self):
        return "Professor: 강의하고 학생의 질문에 답합니다."

    def daily_task(self):
        return "강의 자료를 만들고, 연구하고, 면담을 진행합니다."

    def print_info(self):
        return super().print_info() + f"\\n연구실: {self.office}"`,
  Friend: `class Friend(Person):
    def __init__(self, name, age, hobby):
        super().__init__(name, age)
        self.hobby = hobby

    def introduce(self):
        return super().introduce() + " 같이 공부하는 친구입니다."

    def get_role(self):
        return "Friend: 함께 문제를 풀고 서로 피드백합니다."

    def daily_task(self):
        return "스터디 시간을 잡고 어려운 문제를 같이 해결합니다."

    def print_info(self):
        return super().print_info() + f"\\n취미: {self.hobby}"`
};

const methodMap = {
  introduce: "introduce",
  getRole: "get_role",
  dailyTask: "daily_task",
  printInfo: "print_info"
};

const constructorMap = {
  PersonADT: "PersonADT()",
  Person: 'Person("김사람", 30)',
  Student: 'Student("이학생", 21, "20260001")',
  Professor: 'Professor("박교수", 47, "공학관 301호")',
  Friend: 'Friend("최친구", 22, "알고리즘 스터디")'
};

const savedCode = JSON.parse(localStorage.getItem("personDemoPythonCode") || "null");
const codeSnippets = savedCode || { ...defaultCodeSnippets };
codeSnippets.PersonADT = defaultCodeSnippets.PersonADT;

const defaultMainCode = `student = Student("이학생", 21, "20260001")
professor = Professor("박교수", 47, "공학관 301호")
friend = Friend("최친구", 22, "알고리즘 스터디")

print(student.print_info())`;
let mainCodeValue = localStorage.getItem("personDemoMainCode") || defaultMainCode;

let selectedClass = "PersonADT";
let editorReady = false;
let pyodideReady = null;

const output = document.querySelector("#output");
const selectedInfo = document.querySelector("#selectedInfo");
const classCode = document.querySelector("#classCode");
const mainCode = document.querySelector("#mainCode");
const checkCode = document.querySelector("#checkCode");
const saveCode = document.querySelector("#saveCode");
const resetCode = document.querySelector("#resetCode");
const runMain = document.querySelector("#runMain");
const resetMain = document.querySelector("#resetMain");
const showFullCode = document.querySelector("#showFullCode");
const pythonModal = document.querySelector("#pythonModal");
const closePythonModal = document.querySelector("#closePythonModal");
const classButtons = document.querySelectorAll("[data-class]");
const legendItems = document.querySelectorAll("[data-tier]");
const methodButtons = document.querySelectorAll("[data-method]");
const polyButtons = document.querySelectorAll("[data-poly]");

function getTier(className) {
  if (className === "PersonADT") {
    return "adt";
  }

  if (className === "Person") {
    return "parent";
  }

  return "concrete";
}

function setSelectedClass(className) {
  if (editorReady && selectedClass !== "PersonADT") {
    codeSnippets[selectedClass] = classCode.value;
  }

  selectedClass = className;
  selectedInfo.textContent = `현재 선택: ${className}`;
  classCode.value = codeSnippets[className];
  classCode.readOnly = className === "PersonADT";
  saveCode.disabled = className === "PersonADT";
  resetCode.disabled = className === "PersonADT";
  editorReady = true;

  classButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.class === className);
  });

  const tier = getTier(className);
  legendItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.tier === tier);
  });
}

function writeOutput(methodName, result) {
  output.textContent = `[${selectedClass}.${methodName} 실행 결과]\n\n${result}`;
}

function syncCurrentCode() {
  if (editorReady && selectedClass !== "PersonADT") {
    codeSnippets[selectedClass] = classCode.value;
  }

  codeSnippets.PersonADT = defaultCodeSnippets.PersonADT;
}

function buildPythonProgram(extraCode = "") {
  syncCurrentCode();
  return [
    codeSnippets.PersonADT,
    codeSnippets.Person,
    codeSnippets.Student,
    codeSnippets.Professor,
    codeSnippets.Friend,
    extraCode
  ].join("\n\n");
}

function buildFullDisplayCode() {
  syncCurrentCode();
  mainCodeValue = mainCode.value;
  localStorage.setItem("personDemoMainCode", mainCodeValue);

  return [
    codeSnippets.PersonADT,
    codeSnippets.Person,
    codeSnippets.Student,
    codeSnippets.Professor,
    codeSnippets.Friend,
    "# main",
    mainCodeValue
  ].join("\n\n");
}

function formatPythonError(error) {
  return error.message || String(error);
}

function showPythonInstallPopup() {
  pythonModal.hidden = false;
}

async function loadPyodideRuntime() {
  if (pyodideReady) {
    return pyodideReady;
  }

  output.textContent = "[Python 런타임 준비]\n\n브라우저에서 Python 실행 환경을 불러오는 중입니다.";
  pyodideReady = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
    script.onload = async () => {
      try {
        resolve(await loadPyodide());
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = () => reject(new Error("Pyodide를 불러오지 못했습니다. 인터넷 연결 또는 CDN 접근을 확인하세요."));
    document.head.appendChild(script);
  });

  return pyodideReady;
}

async function runPython(extraCode, title) {
  try {
    const pyodide = await loadPyodideRuntime();
    const result = await pyodide.runPythonAsync(buildPythonProgram(extraCode));
    output.textContent = `[${title}]\n\n${result ?? "오류 없이 실행되었습니다."}`;
  } catch (error) {
    if (formatPythonError(error).includes("Pyodide")) {
      showPythonInstallPopup();
    }
    output.textContent = `[Python 오류]\n\n${formatPythonError(error)}`;
  }
}

function indentPython(code) {
  const lines = code.trimEnd().split("\n");
  return lines.length && lines.some((line) => line.trim())
    ? lines.map((line) => `    ${line}`).join("\n")
    : "    pass";
}

async function runMainCode() {
  mainCodeValue = mainCode.value;
  localStorage.setItem("personDemoMainCode", mainCodeValue);

  const code = `${mainSetupCode()}
_main_output or "main 코드가 오류 없이 실행되었습니다."`;

  await runPython(code, "main 실행 결과");
}

function mainSetupCode() {
  mainCodeValue = mainCode.value;
  localStorage.setItem("personDemoMainCode", mainCodeValue);
  const source = JSON.stringify(mainCodeValue);

  return `import sys
from io import StringIO

_old_stdout = sys.stdout
_stdout = StringIO()
_scope = {}
sys.stdout = _stdout
try:
    exec(${source}, globals(), _scope)
finally:
    sys.stdout = _old_stdout

_main_output = _stdout.getvalue()`;
}

function syncedMethodCode(className, pythonMethod) {
  const fallback = constructorMap[className];
  return `${mainSetupCode()}

_target = None
for _value in list(_scope.values()):
    if type(_value).__name__ == "${className}":
        _target = _value
        break

if _target is None:
    _target = ${fallback}

_result = _target.${pythonMethod}()
str(_result)`;
}

function syncedPolyCode(pythonMethod) {
  return `${mainSetupCode()}

_defaults = {
    "Student": Student("이학생", 21, "20260001"),
    "Professor": Professor("박교수", 47, "공학관 301호"),
    "Friend": Friend("최친구", 22, "알고리즘 스터디"),
}
_items = []
for _class_name in ["Student", "Professor", "Friend"]:
    _found = None
    for _value in list(_scope.values()):
        if type(_value).__name__ == _class_name:
            _found = _value
            break
    _items.append((_class_name, _found or _defaults[_class_name]))

_result = "\\n\\n".join(f"{_name}: {getattr(_obj, '${pythonMethod}')()}" for _name, _obj in _items)
_result`;
}

classButtons.forEach((button) => {
  button.addEventListener("click", () => setSelectedClass(button.dataset.class));
});

methodButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const methodName = button.dataset.method;
    const pythonMethod = methodMap[methodName];

    await runPython(syncedMethodCode(selectedClass, pythonMethod), `${selectedClass}.${methodName} 실행 결과`);
  });
});

polyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const methodName = button.dataset.poly;
    const pythonMethod = methodMap[methodName];

    await runPython(syncedPolyCode(pythonMethod), `다형성 비교: ${methodName}`);
  });
});

document.querySelector("#clearOutput").addEventListener("click", () => {
  output.textContent = "출력창을 비웠습니다.";
});

saveCode.addEventListener("click", () => {
  syncCurrentCode();
  localStorage.setItem("personDemoPythonCode", JSON.stringify(codeSnippets));
  output.textContent = `[Python 코드 저장]\n\n${selectedClass} 코드를 브라우저에 저장했습니다.`;
});

resetCode.addEventListener("click", () => {
  codeSnippets[selectedClass] = defaultCodeSnippets[selectedClass];
  classCode.value = codeSnippets[selectedClass];
  localStorage.setItem("personDemoPythonCode", JSON.stringify(codeSnippets));
  output.textContent = `[Python 코드 초기화]\n\n${selectedClass} 예시 코드를 기본값으로 되돌렸습니다.`;
});

checkCode.addEventListener("click", async () => {
  await runPython("\"현재 Python 코드는 문법 오류 없이 로드되었습니다.\"", "Python 코드 검사");
});

runMain.addEventListener("click", runMainCode);
resetMain.addEventListener("click", () => {
  mainCodeValue = defaultMainCode;
  mainCode.value = mainCodeValue;
  localStorage.setItem("personDemoMainCode", mainCodeValue);
  output.textContent = "[main 코드 초기화]\n\nmain 코드를 기본값으로 되돌렸습니다.";
});
showFullCode.addEventListener("click", () => {
  output.textContent = `[전체 Python 코드]\n\n${buildFullDisplayCode()}`;
});
closePythonModal.addEventListener("click", () => {
  pythonModal.hidden = true;
});

mainCode.value = mainCodeValue;
setSelectedClass(selectedClass);
