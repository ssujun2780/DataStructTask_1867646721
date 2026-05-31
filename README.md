# PersonADT OOP Interactive Web App

자료구조 수업 과제 2 제출용 인터랙티브 웹앱입니다.

현재 제출 대상은 루트의 정적 웹앱입니다.

- `index.html`
- `styles.css`
- `script.js`
- `vercel.json`

`ExTask/` 폴더는 이전에 목표했던 과제 작업물을 보관한 폴더입니다. 현재 제출용 메인 앱은 `ExTask/`가 아니라 루트의 `index.html`에서 실행됩니다.

## 주요 기능

- `PersonADT -> Person -> Student / Professor / Friend` 상속 트리 시각화
- 계층별 색상 표시
  - `PersonADT`: ADT 선언
  - `Person`: 공통 부모 클래스
  - `Student`, `Professor`, `Friend`: 구체 클래스
- 선택한 클래스의 Python 코드 표시 및 수정
- `PersonADT`는 추상 ADT 역할이므로 수정 및 직접 실행 불가
- `main 코드`에서 `__init__` 매개변수 수정 가능
- `main 실행`, `main 초기화`, `전체 코드 보기` 지원
- 우측 버튼으로 오버라이딩 함수 실행
- 다형성 비교 버튼으로 같은 함수가 클래스별로 다르게 동작하는 결과 확인
- Python 구문 오류 또는 실행 오류를 중앙 출력창에 표시

## 클래스 설계

- `PersonADT`
  - `introduce`
  - `get_role`
  - `daily_task`
  - `print_info`
  - 추상 메서드 선언만 담당

- `Person`
  - `name`, `age` 공통 속성 보유
  - 기본 구현 제공

- `Student`
  - `student_id` 속성 추가
  - 학생 역할에 맞게 메서드 오버라이딩

- `Professor`
  - `office` 속성 추가
  - 교수 역할에 맞게 메서드 오버라이딩

- `Friend`
  - `hobby` 속성 추가
  - 친구 역할에 맞게 메서드 오버라이딩

## 실행 방법

로컬에서는 루트의 `index.html`을 브라우저에서 열면 됩니다.

Python 실행은 브라우저에서 Pyodide CDN을 불러와 처리합니다. 따라서 Python 코드 실행 기능을 쓰려면 인터넷 연결이 필요합니다.

## Vercel 배포

이 repository를 Vercel에 import하면 루트의 `index.html`이 배포됩니다.

권장 설정:

- Framework Preset: `Other`
- Build Command: 비움
- Output Directory: `.`

README만 수정해서 커밋/푸시해도 Vercel은 새 배포를 만들 수 있습니다. 다만 Production URL은 보통 그대로 유지되고, 같은 링크가 최신 배포를 가리키게 됩니다.

## 기술 스택

- HTML5
- CSS
- Vanilla JavaScript
- Pyodide
