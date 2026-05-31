import { createEdge, createNode, defaultDisplay } from "./graph_model.js";
import { layoutGraph } from "./graph_layout_engine.js";

const AGGREGATE_THRESHOLD = {
  Friend: 5,
  Professor: 4,
  Event: 3,
  StatusEffect: 3,
};

const CLASS_IDS = [
  "PersonADT",
  "Person",
  "Student",
  "Friend",
  "Professor",
  "Event",
  "StatusEffect",
  "Course",
  "GameState",
  "RuntimeService",
];

const SYSTEM_OBJECTS = [
  { className: "ActionManager", id: "object:actionManager", label: "ActionManager", methods: ["doStudy()", "doExercise()", "doRest()"] },
  { className: "InteractionManager", id: "object:interactionManager", label: "InteractionManager", methods: ["playWithFriend()"] },
  { className: "TurnManager", id: "object:turnManager", label: "TurnManager", methods: ["advanceTurn()", "checkTurnEnding()"] },
  { className: "ExamManager", id: "object:examManager", label: "ExamManager", methods: ["predictScores()", "calculateSemesterScore()"] },
  { className: "EventManager", id: "object:eventManager", label: "EventManager", methods: ["applyTurnEvents()"] },
  { className: "SemesterManager", id: "object:semesterManager", label: "SemesterManager", methods: ["startNewSemester()"] },
];

export function mapGameStateToGraphModel(gameState, options = {}) {
  const selectedNodeId = options.selectedNodeId || null;
  const displayStates = options.displayStates || {};
  const nodePositions = options.nodePositions || {};
  const transientOwnerIds = options.transientOwnerIds || [];
  const pinnedChildNodeIds = options.pinnedChildNodeIds || [];
  const highlighted = options.highlighted || { current: [], next: [], changed: [], runtimeEdges: [] };
  const initDraft = options.initDraft || null;
  const pendingRuntimeSelection = options.pendingRuntimeSelection || null;

  const nodes = [
    ...buildClassNodes(gameState, displayStates),
    buildRuntimeUiNode(gameState, displayStates, initDraft),
    ...(initDraft ? buildInitRuntimeNodes(initDraft, displayStates) : []),
    ...(gameState ? buildRuntimeNodes(gameState, displayStates, selectedNodeId, pendingRuntimeSelection) : []),
  ];

  const childNodes = [];
  nodes.push(...childNodes, ...buildReplayDetailNodes(nodes, highlighted));

  const edges = [
    createEdge({ id: "edge:PersonADT-Person", from: "class:PersonADT", to: "class:Person", kind: "inheritance", label: "extends" }),
    createEdge({ id: "edge:Person-Student", from: "class:Person", to: "class:Student", kind: "inheritance", label: "extends" }),
    createEdge({ id: "edge:Person-Friend", from: "class:Person", to: "class:Friend", kind: "inheritance", label: "extends" }),
    createEdge({ id: "edge:Person-Professor", from: "class:Person", to: "class:Professor", kind: "inheritance", label: "extends" }),
    ...buildOwnershipEdges(nodes),
    ...buildChildEdges(nodes),
  ];

  const laidOut = layoutGraph(nodes, edges, { nodePositions });
  return {
    nodes: laidOut.nodes.map((node) => ({
      ...node,
      selected: node.id === selectedNodeId,
      highlight: inferHighlight(node.id, highlighted),
    })),
    edges: laidOut.edges,
    groups: laidOut.groups,
    runtimeEdges: highlighted.runtimeEdges || [],
  };
}

function buildClassNodes(gameState, displayStates) {
  const counts = {
    Student: gameState?.player ? 1 : 0,
    Friend: (gameState?.friends || []).length,
    Professor: (gameState?.semesterProfessorPool || []).length,
    Event: gameState?.activeEvent ? 1 : (gameState?.eventDeckCount || 0),
    StatusEffect: countStatusEffects(gameState),
    Course: (gameState?.semesterProfessorPool || []).length,
    GameState: gameState ? 1 : 0,
    RuntimeService: gameState ? SYSTEM_OBJECTS.length : 0,
  };

  return CLASS_IDS.map((className) => createNode({
    id: `class:${className}`,
    kind: "class",
    label: className,
    width: ["PersonADT", "Person", "StatusEffect", "Course"].includes(className) ? 190 : 210,
    height: ["PersonADT", "Person", "StatusEffect", "Course"].includes(className) ? 92 : 112,
    data: {
      typeLabel: className === "PersonADT" ? "ADT" : "Class Deck",
      instanceCount: counts[className] || 0,
      fields: fallbackClassFields(className),
      methods: fallbackClassMethods(className),
      className,
    },
    display: { ...defaultDisplay("class"), ...(displayStates[`class:${className}`] || {}) },
    groupId: `group:${className.toLowerCase()}`,
  }));
}

function buildRuntimeNodes(gameState, displayStates, selectedNodeId, pendingRuntimeSelection) {
  const nodes = [];
  const semesterProfessorPool = professorPoolForDisplay(gameState, pendingRuntimeSelection);

  const runtimeServicesExpanded = displayMode(displayStates, "class:RuntimeService") === "expanded";
  if (runtimeServicesExpanded) {
    nodes.push(...SYSTEM_OBJECTS.map((item) => createNode({
      id: item.id,
      kind: "object",
      label: item.label,
      width: 230,
      height: 134,
      data: {
        className: "RuntimeService",
        concreteClass: item.className,
        summaryFields: [item.className, "created at start"],
        fields: { concreteClass: item.className, role: "runtime service", lifecycle: "created at start" },
        methods: item.methods,
      },
      display: { ...defaultDisplay("object"), ...(displayStates[item.id] || {}) },
      readOnly: true,
      parentClassId: "class:RuntimeService",
      groupId: "group:runtimeservice",
    })));
  } else {
    nodes.push(createNode({
      id: "collection:runtime-services",
      kind: "collection",
      label: `${SYSTEM_OBJECTS.length} runtime services`,
      width: 250,
      height: 100,
      data: { className: "RuntimeService", count: SYSTEM_OBJECTS.length },
      display: { ...defaultDisplay("collection"), ...(displayStates["collection:runtime-services"] || {}) },
      parentClassId: "class:RuntimeService",
      groupId: "group:runtimeservice",
    }));
  }

  nodes.push(createNode({
    id: "object:player",
    kind: "object",
    label: gameState.player.name || "Player",
    width: 236,
    height: displayMode(displayStates, "object:player") === "expanded" ? 238 : 182,
    data: {
      className: "Student",
      portraitId: gameState.player.portraitId || "player_default",
      summaryFields: [
        `health ${gameState.player.currentHealth}/${gameState.player.maxHealth}`,
        `stress ${gameState.player.stress}`,
        `intelligence ${gameState.player.intelligence}`,
        `gpa ${gameState.player.gpa}`,
      ],
      fields: {
        currentHealth: gameState.player.currentHealth,
        maxHealth: gameState.player.maxHealth,
        stress: gameState.player.stress,
        intelligence: gameState.player.intelligence,
        gpa: gameState.player.gpa,
        academicWarningCount: gameState.player.academicWarningCount,
      },
      methods: ["showStatus()", "previewBehavior()", "changeStress()", "changeCurrentHealth()", "changeIntelligence()"],
    },
    display: { ...defaultDisplay("object"), ...(displayStates["object:player"] || {}) },
    readOnly: true,
    parentClassId: "class:Student",
    groupId: "group:student",
  }));

  nodes.push(...buildAggregatedObjects({
    className: "Friend",
    items: gameState.friends || [],
    threshold: AGGREGATE_THRESHOLD.Friend,
    selectedNodeId,
    deckExpanded: displayMode(displayStates, "class:Friend") === "expanded",
    makeId: (item) => `object:friend:${item.name}`,
    collectionId: "collection:friends",
    collectionLabel: `${(gameState.friends || []).length} friends`,
    toNode: (friend) => createNode({
      id: `object:friend:${friend.name}`,
      kind: "object",
      label: friend.name,
      width: 220,
      height: displayMode(displayStates, `object:friend:${friend.name}`) === "expanded" ? 220 : 172,
      data: {
        className: "Friend",
        portraitId: friend.portraitId || "friend_default_01",
        summaryFields: [`favor ${friend.favorability}`, `stress ${friend.stress}`, `connect ${friend.isConnect}`],
        fields: { favorability: friend.favorability, stress: friend.stress, isConnect: friend.isConnect, isArmy: friend.isArmy },
        methods: ["showStatus()", "previewBehavior()", "changeFavorability()"],
      },
      display: { ...defaultDisplay("object"), ...(displayStates[`object:friend:${friend.name}`] || {}) },
      parentClassId: "class:Friend",
      groupId: "group:friend",
    }),
  }));

  nodes.push(...buildAggregatedObjects({
    className: "Professor",
    items: semesterProfessorPool,
    threshold: AGGREGATE_THRESHOLD.Professor,
    selectedNodeId,
    deckExpanded: displayMode(displayStates, "class:Professor") === "expanded",
    makeId: (item) => `object:professor:${item.name}:${item.courseName}`,
    collectionId: "collection:professors",
    collectionLabel: `${semesterProfessorPool.length} professors`,
    toNode: (professor) => createNode({
      id: `object:professor:${professor.name}:${professor.courseName}`,
      kind: "object",
      label: professor.name,
      width: 236,
      height: displayMode(displayStates, `object:professor:${professor.name}:${professor.courseName}`) === "expanded" ? 232 : 182,
      data: {
        className: "Professor",
        portraitId: professor.portraitId || "professor_default_01",
        summaryFields: [`course ${professor.courseName}`, `favor ${professor.favorability}`, `exam ${professor.examDifficulty}`],
        fields: {
          courseName: professor.courseName,
          favorability: professor.favorability,
          tendency: professor.tendency,
          courseDifficulty: professor.courseDifficulty,
          examDifficulty: professor.examDifficulty,
        },
        methods: ["showStatus()", "previewBehavior()", "changeExamDiff()", "changeCoureDiff()"],
      },
      display: { ...defaultDisplay("object"), ...(displayStates[`object:professor:${professor.name}:${professor.courseName}`] || {}) },
      parentClassId: "class:Professor",
      groupId: "group:professor",
    }),
  }));

  if (gameState.activeEvent) {
    const expanded = displayMode(displayStates, "class:Event") === "expanded";
    if (expanded) {
      nodes.push(createNode({
        id: `event:${gameState.activeEvent.id || "active"}`,
        kind: "event",
        label: gameState.activeEvent.title || gameState.activeEvent.name || "Active Event",
        width: 260,
        height: 130,
        data: {
          className: "Event",
          content: gameState.activeEvent.content || "",
          selections: gameState.activeEvent.selections || [],
        },
        display: { ...defaultDisplay("event"), ...(displayStates[`event:${gameState.activeEvent.id || "active"}`] || {}) },
        parentClassId: "class:Event",
        groupId: "group:event",
      }));
    } else {
      nodes.push(createNode({
        id: "collection:events",
        kind: "collection",
        label: "1 events",
        width: 220,
        height: 100,
        data: { className: "Event", count: 1 },
        display: { ...defaultDisplay("collection"), ...(displayStates["collection:events"] || {}) },
        parentClassId: "class:Event",
        groupId: "group:event",
      }));
    }
  } else if (gameState.eventDeckCount) {
    const expanded = displayMode(displayStates, "class:Event") === "expanded";
    if (expanded) {
      Array.from({ length: gameState.eventDeckCount }).forEach((_, index) => {
        nodes.push(createNode({
          id: `event:deck:${index + 1}`,
          kind: "event",
          label: `Event ${index + 1}`,
          width: 210,
          height: 96,
          data: {
            className: "Event",
            content: "student/friend/professor turn event",
            selections: [],
          },
          display: { ...defaultDisplay("event"), ...(displayStates[`event:deck:${index + 1}`] || {}) },
          parentClassId: "class:Event",
          groupId: "group:event",
        }));
      });
    } else {
      nodes.push(createNode({
        id: "collection:events",
        kind: "collection",
        label: `${gameState.eventDeckCount} events`,
        width: 220,
        height: 100,
        data: { className: "Event", count: gameState.eventDeckCount },
        display: { ...defaultDisplay("collection"), ...(displayStates["collection:events"] || {}) },
        parentClassId: "class:Event",
        groupId: "group:event",
      }));
    }
  }

  const statuses = [
    ...(gameState.player?.statusEffects || []).map((status) => ({ owner: "object:player", ...status })),
  ];
  if (statuses.length) {
    const expanded = displayMode(displayStates, "class:StatusEffect") === "expanded";
    if (expanded) {
      statuses.forEach((status) => {
        nodes.push(createNode({
          id: `status:${status.owner}:${status.id}`,
          kind: "status",
          label: status.name,
          width: 190,
          height: 90,
          data: { owner: status.owner, duration: status.duration, description: status.description, className: "StatusEffect" },
          display: { ...defaultDisplay("status"), ...(displayStates[`status:${status.owner}:${status.id}`] || {}) },
          parentClassId: "class:StatusEffect",
          groupId: "group:status",
        }));
      });
    } else {
      nodes.push(createNode({
        id: "collection:statuses",
        kind: "collection",
        label: `${statuses.length} statuses`,
        width: 210,
        height: 100,
        data: { className: "StatusEffect", count: statuses.length },
        display: { ...defaultDisplay("collection"), ...(displayStates["collection:statuses"] || {}) },
        parentClassId: "class:StatusEffect",
        groupId: "group:status",
      }));
    }
  }

  if (semesterProfessorPool.length) {
    nodes.push(createNode({
      id: "collection:courses",
      kind: "collection",
      label: `${semesterProfessorPool.length} courses`,
      width: 210,
      height: 100,
      data: { className: "Course", count: semesterProfessorPool.length },
      display: { ...defaultDisplay("collection"), ...(displayStates["collection:courses"] || {}) },
      parentClassId: "class:Course",
      groupId: "group:course",
    }));
  }

  nodes.push(createNode({
    id: "object:gameState",
    kind: "object",
    label: "GameState",
    width: 210,
    height: 150,
    data: {
      className: "GameState",
      summaryFields: [
        `grade ${gameState.grade}`,
        `semester ${gameState.semester}`,
        `turn ${gameState.semesterTurn}/${gameState.maxTurn}`,
      ],
      fields: {
        grade: gameState.grade,
        semester: gameState.semester,
        semesterTurn: gameState.semesterTurn,
        maxTurn: gameState.maxTurn,
      },
      methods: ["toDict()", "addLogEntry()"],
    },
    display: { ...defaultDisplay("object"), ...(displayStates["object:gameState"] || {}) },
    readOnly: true,
    parentClassId: "class:GameState",
    groupId: "group:gamestate",
  }));

  return nodes;
}

function professorPoolForDisplay(gameState, pendingRuntimeSelection) {
  const pool = [...(gameState.semesterProfessorPool || [])];
  if (pendingRuntimeSelection?.kind !== "professor_select" || !pendingRuntimeSelection.candidate) return pool;
  const candidate = {
    ...pendingRuntimeSelection.candidate,
    courseName: pendingRuntimeSelection.courseName,
    maxHealth: pendingRuntimeSelection.candidate.maxHealth || 500,
    stress: pendingRuntimeSelection.candidate.stress || 0,
    intelligence: pendingRuntimeSelection.candidate.intelligence || 1000,
    tendency: pendingRuntimeSelection.candidate.tendency || "",
    courseDifficulty: pendingRuntimeSelection.candidate.courseDifficulty || "",
    statusEffects: pendingRuntimeSelection.candidate.statusEffects || [],
  };
  const index = pool.findIndex((professor) => professor.courseName === pendingRuntimeSelection.courseName);
  if (index >= 0) pool[index] = candidate;
  else pool.push(candidate);
  return pool;
}

function buildInitRuntimeNodes(initDraft, displayStates) {
  const stepLabels = {
    difficulty: "난이도",
    name: "이름",
    maxHealth: "최대 체력",
    intelligence: "지능",
  };
  return [createNode({
    id: "object:initSettings",
    kind: "object",
    label: "초기 설정",
    width: 220,
    height: 150,
    data: {
      className: "Runtime",
      summaryFields: [
        `step ${stepLabels[initDraft.step] || initDraft.step}`,
        `difficulty ${initDraft.difficulty || "normal"}`,
      ],
      fields: {
        difficulty: initDraft.difficulty || "normal",
        name: initDraft.name || "",
        maxHealth: initDraft.maxHealth,
        intelligence: initDraft.intelligence,
      },
      methods: ["promptInput()", "applyInput()", "startGame()"],
    },
    display: { ...defaultDisplay("object"), ...(displayStates["object:initSettings"] || {}) },
    readOnly: true,
    parentClassId: null,
    groupId: "group:runtime",
  })];
}

function buildRuntimeUiNode(gameState, displayStates, initDraft) {
  const pendingChoice = gameState?.pendingChoices?.[0] || null;
  const hasGameScreen = Boolean(gameState?.runtimeScreen);
  return createNode({
    id: "runtime:ui",
    kind: "runtimeUi",
    label: "\ub7f0\ud0c0\uc784 UI",
    width: pendingChoice || initDraft || hasGameScreen ? 700 : 560,
    height: pendingChoice || initDraft || hasGameScreen ? 360 : 260,
    data: {
      input: cliInputLine(gameState, initDraft),
      lines: cliOutputLines(gameState, initDraft),
      screen: gameState?.runtimeScreen || null,
      initDraft,
      actions: gameState ? [
        { id: "study", label: "\uacf5\ubd80" },
        { id: "play", label: "\ub180\uae30" },
        { id: "exercise", label: "\uc6b4\ub3d9" },
        { id: "rest", label: "\ud734\uc2dd" },
      ] : [],
      choice: pendingChoice ? {
        courseName: pendingChoice.courseName,
        prompt: "\ud6c4\ubcf4 \uc911 \ud558\ub098\ub97c \uc120\ud0dd\ud558\uc138\uc694.",
        candidates: (pendingChoice.candidates || []).slice(0, 3).map((candidate, index) => ({
          index,
          name: candidate.name,
          courseName: candidate.courseName || pendingChoice.courseName,
          favorability: candidate.favorability,
          examDifficulty: candidate.examDifficulty,
        })),
      } : null,
    },
    display: { ...defaultDisplay("runtimeUi"), ...(displayStates["runtime:ui"] || {}) },
    groupId: "group:runtime",
  });
}

function cliInputLine(gameState, initDraft) {
  if (initDraft) return `입력: ${initDraft.step}`;
  if (!gameState) return "입력: 시작 대기";
  if ((gameState.pendingChoices || []).length) return "입력: 교수 선택";
  return "입력: 행동 선택 대기";
}

function cliOutputLines(gameState, initDraft) {
  if (initDraft) {
    const labels = {
      difficulty: "난이도를 선택하세요.",
      name: "이름을 입력하세요.",
      maxHealth: "최대 체력을 입력하세요.",
      intelligence: "지능을 입력하세요.",
    };
    return ["초기 설정", labels[initDraft.step] || ""];
  }
  if (gameState?.polymorphismResult) {
    const result = gameState.polymorphismResult;
    return [
      "다형성 실행 결과",
      `선언 타입: ${result.declaredType || "-"}`,
      `실제 타입: ${result.actualType || result.className || "-"}`,
      `호출 메서드: ${result.method || "-"}()`,
      ...(String(result.output || "").split("\n").slice(0, 5)),
    ];
  }
  const logs = gameState?.logs || [];
  const screen = gameState?.runtimeScreen;
  if (!screen) return ["출력: 실행 결과가 아직 없습니다."];
  return [
    screen.header,
    `HP ${gameState.player.currentHealth}/${gameState.player.maxHealth} / Stress ${gameState.player.stress}`,
    `INT ${gameState.player.intelligence} / GPA ${gameState.player.gpa} / 예상 ${screen.predictedGpa}`,
    ...(screen.resultLines || []),
    ...(screen.warnings || []),
  ].slice(0, logs.length ? 7 : 5);
}

function buildAggregatedObjects({ className, items, threshold, selectedNodeId, deckExpanded, makeId, collectionId, collectionLabel, toNode }) {
  const selectedRelevant = selectedNodeId && items.some((item) => makeId(item) === selectedNodeId);
  if (items.length >= threshold && !selectedRelevant && !deckExpanded) {
    return [createNode({
      id: collectionId,
      kind: "collection",
      label: collectionLabel,
      width: 230,
      height: 100,
      data: { className, count: items.length },
      display: defaultDisplay("collection"),
      parentClassId: `class:${className}`,
      groupId: `group:${className.toLowerCase()}`,
    })];
  }
  return items.map(toNode);
}

function buildExpandedChildren(nodes, transientOwnerIds, pinnedChildNodeIds, displayStates) {
  const childNodes = [];
  const ownerIds = new Set([
    ...transientOwnerIds,
    ...pinnedChildNodeIds.map((nodeId) => ownerIdFromChildNodeId(nodeId)).filter(Boolean),
  ]);

  ownerIds.forEach((ownerId) => {
    const owner = nodes.find((node) => node.id === ownerId);
    if (!owner) return;
    Object.entries(owner.data.fields || {}).forEach(([key, value]) => {
      const id = `field:${ownerId}:${key}`;
      const visible = transientOwnerIds.includes(ownerId) || pinnedChildNodeIds.includes(id);
      if (!visible) return;
      childNodes.push(createNode({
        id,
        kind: "field",
        label: key,
        width: 180,
        height: 56,
        data: { ownerId, value, className: owner.data.className },
        display: { ...defaultDisplay("field"), pinned: pinnedChildNodeIds.includes(id), ...(displayStates[id] || {}) },
        parentClassId: owner.parentClassId,
        groupId: owner.groupId,
      }));
    });
    (owner.data.methods || []).forEach((method) => {
      const id = `method:${ownerId}:${method}`;
      const visible = transientOwnerIds.includes(ownerId) || pinnedChildNodeIds.includes(id);
      if (!visible) return;
      childNodes.push(createNode({
        id,
        kind: "method",
        label: method,
        width: 200,
        height: 56,
        data: { ownerId, method, className: owner.data.className },
        display: { ...defaultDisplay("method"), pinned: pinnedChildNodeIds.includes(id), ...(displayStates[id] || {}) },
        parentClassId: owner.parentClassId,
        groupId: owner.groupId,
      }));
    });
  });

  return childNodes;
}

function buildReplayDetailNodes(nodes, highlighted) {
  const methodNodes = highlighted.methodNodes || (highlighted.methodNode ? [highlighted.methodNode] : []);
  const seen = new Set();
  const replayNodes = methodNodes.flatMap((item) => {
    if (!item?.id || seen.has(item.id)) return [];
    const owner = nodes.find((node) => node.id === item.ownerNodeId);
    if (!owner) return [];
    seen.add(item.id);
    return [createNode({
      id: item.id,
      kind: "method",
      label: item.label || item.id.split(":").pop(),
      width: 210,
      height: 64,
      data: { ownerId: item.ownerNodeId, method: item.label || "", className: owner.data.className },
      display: { ...defaultDisplay("method"), pinned: true },
      parentClassId: owner.parentClassId,
      groupId: owner.groupId,
    })];
  });
  if (highlighted.fieldChange?.nodeId && !seen.has(highlighted.fieldChange.nodeId)) {
    const owner = nodes.find((node) => node.id === highlighted.fieldChange.ownerNodeId);
    if (owner) {
      replayNodes.push(createNode({
        id: highlighted.fieldChange.nodeId,
        kind: "field",
        label: formatFieldChange(highlighted.fieldChange),
        width: 230,
        height: 58,
        data: {
          ownerId: highlighted.fieldChange.ownerNodeId,
          methodNodeId: highlighted.fieldChange.methodNodeId,
          value: formatFieldChange(highlighted.fieldChange),
          className: owner.data.className,
          replayOnly: true,
        },
        display: { ...defaultDisplay("field"), pinned: true },
        parentClassId: owner.parentClassId,
        groupId: owner.groupId,
      }));
    }
  }
  return replayNodes;
}

function formatFieldChange(change) {
  const delta = change.delta === null || change.delta === undefined ? "" : ` (${change.delta > 0 ? "+" : ""}${change.delta})`;
  return `${change.fieldName}: ${change.before} -> ${change.after}${delta}`;
}

function buildOwnershipEdges(nodes) {
  const edges = [];
  const eventNode = nodes.find((node) => node.kind === "event");
  if (eventNode && nodes.find((node) => node.id === "object:player")) {
    edges.push(createEdge({
      id: `edge:${eventNode.id}-player`,
      from: eventNode.id,
      to: "object:player",
      kind: "ownership",
      label: "affects",
    }));
  }
  nodes.filter((node) => node.kind === "status").forEach((statusNode) => {
    edges.push(createEdge({
      id: `edge:${statusNode.id}-${statusNode.data.owner}`,
      from: statusNode.id,
      to: statusNode.data.owner,
      kind: "ownership",
      label: "affects",
    }));
  });
  return edges;
}

function buildChildEdges(nodes) {
  return nodes
    .filter((node) => node.kind === "field" || node.kind === "method")
    .filter((node) => !node.data.replayOnly)
    .map((node) => createEdge({
      id: `edge:${node.data.ownerId}-${node.id}`,
      from: node.data.ownerId,
      to: node.id,
      kind: node.kind,
      label: node.kind,
    }));
}

function displayMode(displayStates, id) {
  return displayStates[id]?.mode || "compact";
}

function ownerIdFromChildNodeId(nodeId) {
  const parts = nodeId.split(":");
  if ((nodeId.startsWith("field:") || nodeId.startsWith("method:")) && parts.length >= 3) {
    return parts.slice(1, -1).join(":");
  }
  return null;
}

function inferHighlight(nodeId, highlighted) {
  if ((highlighted.changed || []).includes(nodeId)) return "changed";
  if ((highlighted.current || []).includes(nodeId)) return "current";
  if ((highlighted.next || []).includes(nodeId)) return "next";
  return "";
}

function countStatusEffects(gameState) {
  const playerCount = (gameState?.player?.statusEffects || []).length;
  const friendCount = (gameState?.friends || []).reduce((sum, friend) => sum + (friend.statusEffects || []).length, 0);
  const professorCount = (gameState?.semesterProfessorPool || []).reduce((sum, professor) => sum + (professor.statusEffects || []).length, 0);
  return playerCount + friendCount + professorCount;
}

function fallbackClassFields(className) {
  if (className === "Student") return { currentHealth: "field", stress: "field", intelligence: "field", gpa: "field" };
  if (className === "Friend") return { favorability: "field", isConnect: "field" };
  if (className === "Professor") return { courseName: "field", favorability: "field", examDifficulty: "field" };
  if (className === "Event") return { selections: "field", content: "field" };
  if (className === "RuntimeService") return { concreteClass: "field", role: "field", lifecycle: "field" };
  return {};
}

function fallbackClassMethods(className) {
  if (className === "Student") return ["showStatus()", "previewBehavior()", "changeStress()"];
  if (className === "Friend") return ["showStatus()", "previewBehavior()", "changeFavorability()"];
  if (className === "Professor") return ["showStatus()", "previewBehavior()", "changeExamDiff()"];
  if (className === "Event") return ["toDict()"];
  if (className === "RuntimeService") return ["doStudy()", "applyTurnEvents()", "calculateSemesterScore()", "startNewSemester()"];
  return [];
}

