# PersonADT 오버라이딩 인터랙티브 웹앱

자료구조 수업 과제 조건에 맞춘 단일 페이지 웹앱입니다.

## 구현 내용

- 좌측: `PersonADT -> Person -> Student / Professor / Friend` 상속 트리 시각화
- 중앙: 함수 실행 결과 출력창
- 우측: 오버라이딩 함수 실행 버튼
- 다형성 비교: 같은 함수명으로 `Student`, `Professor`, `Friend` 객체를 호출했을 때 서로 다른 결과 출력

## 클래스 설계

- `PersonADT`: `introduce`, `getRole`, `dailyTask`, `printInfo` 선언 역할
- `Person`: 공통 속성 `name`, `age`와 기본 구현 제공
- `Student`: 학번과 학생 역할에 맞는 함수 오버라이딩
- `Professor`: 연구실과 교수 역할에 맞는 함수 오버라이딩
- `Friend`: 취미와 친구 역할에 맞는 함수 오버라이딩

## 실행 방법

`index.html` 파일을 브라우저에서 열면 바로 실행됩니다.

## Vercel 배포 방법

1. `inheritance_override_demo` 폴더를 GitHub public repository에 업로드합니다.
2. Vercel에서 `Add New Project`를 누르고 해당 GitHub repository를 import합니다.
3. Framework Preset은 `Other`, Build Command는 비워 두고, Output Directory는 `.`로 둡니다.
4. Deploy 후 생성된 Vercel URL을 제출 PDF에 적습니다.

## 기술 스택

HTML5, CSS, Vanilla JavaScript
