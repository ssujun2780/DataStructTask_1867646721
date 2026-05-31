게임 내적 구조에 대한 설명 --> event 파일의 eventGameManual 확인
게임 외적 구조에 대한 설명 --> UML_diagram.png 또는 eventGameManual 확인

[프로젝트 구조]
- main.py: 게임 시작점과 전체 플레이 루프
- gameData.py: JSON 데이터 로딩, 화면/입력/학점 계산 공통 유틸
- richCompat.py: rich 라이브러리가 없어도 출력이 깨지지 않게 하는 호환 계층
- json/: 밸런스, 텍스트, 캐릭터 생성 데이터
- character/: 플레이어, 친구, 교수 등 게임 캐릭터 모델
- event/: 턴 중 발생하는 선택지/랜덤 이벤트
- independentEvent/: 게임 시작, 학기 전환, 정보 출력, 엔딩 체크처럼 독립 실행되는 흐름

[정리 방향]
- 입력 반복 처리는 gameData.py의 read_int, read_choice, read_yes_no를 사용합니다.
- 평균 학점 계산은 gameData.py의 average_gpa를 사용합니다.
- 교수 생성 함수는 createProfessor를 사용합니다. 기존 오타 함수 createProfesser는 호환용으로 남겨 두었습니다.
- 친구 생성은 createNormalFriend/createSpecialFriend로 분리되어 있습니다.
- 친구 이름에 "친구"가 들어가지 않은 항목은 특수 친구 생성 경로를 사용합니다.
- 교수 생성은 createNormalProfessor/createSpecialProfessor로 분리되어 있습니다.
- 폴더는 Python 패키지로 인식되도록 __init__.py를 포함합니다.
- core/actions.py는 CLI 메뉴 숫자를 PlayerAction으로 변환합니다. 이후 웹 버튼도 같은 PlayerAction을 만들 수 있습니다.
- core/results.py는 GameResult와 ValueChange를 정의합니다. 현재는 공부 행동(_doStudy)의 변경값 기록에 먼저 적용되어 있습니다.
- core/trace.py는 TraceStep과 TraceLog를 정의합니다. 현재는 공부 행동(_doStudy)의 호출과 필드 변경 흐름을 기록합니다.
- core/action_manager.py는 플레이어 행동 규칙을 처리합니다. 현재는 공부/운동/기본 휴식 행동을 checkTurn.py에서 분리했습니다.
- core/interaction_manager.py는 객체 간 상호작용 규칙을 처리합니다. 현재는 친구와 놀기 결과를 checkTurn.py에서 분리했습니다.
- core/exam_manager.py는 학기 시험 점수 계산과 GPA/학사경고 반영을 처리합니다.
- core/exam_manager.py의 predictScores는 턴 화면의 예상 점수 계산에도 사용됩니다.
- core/event_manager.py는 턴 종료 후 학생/친구/교수 랜덤 이벤트 호출을 처리합니다.
- core/semester_manager.py는 새 학기 과목 표시와 교수 선택 흐름을 처리합니다. 현재는 CLI 입력 의존이 남아 있습니다.
- core/game_state.py는 현재 게임 상태를 묶는 GameState와 dict 직렬화 함수를 제공합니다. main.py는 GameState를 통해 turn() 결과를 반영합니다.
- independentEvent/checkTurn.py의 turnState(gameState)는 기존 turn()을 감싸는 호환 wrapper입니다.
- cli/turn_view.py는 턴 화면, 예측 점수, 경고, 행동 메뉴 출력을 담당합니다.
- cli/info_view.py는 정보 메뉴의 친구/교수/매뉴얼 출력을 담당합니다.

[초상화 리소스 규칙]
- 캐릭터 초상화는 사실적 이미지가 아니라 흑백 MS Paint풍 낙서 초상화로 통일합니다.
- Game Core는 이미지 파일을 직접 다루지 않고 portraitId만 보관합니다.
- 실제 이미지 표시 책임은 CLI/Web Adapter가 가집니다.
- 리소스 위치:
  - assets/portraits/student/
  - assets/portraits/friends/
  - assets/portraits/professors/
- Student/Friend/Professor는 선택 필드 portraitId를 가질 수 있습니다.
