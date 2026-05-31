import { apiAction, apiClassPolymorphism, apiPolymorphism, apiSelect, apiStart } from "./js/api.js";
import { createContextMenu } from "./js/context_menu.js";
import { createGraphInteraction } from "./js/graph_interaction.js";
import { createGraphRenderer } from "./js/graph_renderer.js";
import { createInspectorPanel } from "./js/inspector_panel.js";
import { mapGameStateToGraphModel } from "./js/mappers.js";
import { createStateStore } from "./js/state_store.js";
import { createTimelinePanel } from "./js/timeline_panel.js";

const UI = {
  ko: {
    actions: "행동",
    status: "게임 상태",
    replay: "실행 단계",
    output: "CLI 출력",
    choice: "선택",
    start: "시작",
    study: "공부",
    play: "놀기",
    exercise: "운동",
    rest: "휴식",
    fitView: "화면 맞춤",
    resetView: "배치 초기화",
    relayout: "재배치",
    graphHint: "클래스 덱 + 객체 카드 + 런타임 UI",
    replayIdle: "대기",
    replayReady: "다음 입력 대기",
    next: "다음",
    grade: "학년",
    semester: "학기",
    turn: "턴",
    examIn: "시험까지",
    chooseProfessor: "교수 선택",
    chooseOne: "후보 중 하나를 선택하세요.",
    noOutput: "실행 결과가 아직 없습니다.",
  },
  en: {
    actions: "Actions",
    status: "Game Status",
    replay: "Replay",
    output: "CLI Output",
    choice: "Choice",
    start: "Start",
    study: "Study",
    play: "Play",
    exercise: "Exercise",
    rest: "Rest",
    fitView: "Fit View",
    resetView: "Reset Layout",
    relayout: "Relayout",
    graphHint: "Class decks + object cards + runtime UI",
    replayIdle: "Idle",
    replayReady: "Waiting",
    next: "Next",
    grade: "Grade",
    semester: "Semester",
    turn: "Turn",
    examIn: "Exam in",
    chooseProfessor: "Choose Professor",
    chooseOne: "Select one candidate.",
    noOutput: "No runtime output yet.",
  },
};

function getDefaultPanels() {
  const viewport = document.getElementById("graph-viewport");
  const width = viewport?.clientWidth || 1600;
  const height = viewport?.clientHeight || 760;
  return {
    "action-panel": { x: 22, y: 24, width: Math.min(220, width - 44), height: 104 },
    "status-panel": { x: Math.min(262, Math.max(22, width - 692)), y: 24, width: 316, height: 104 },
    "replay-panel": { x: Math.min(600, Math.max(22, width - 360)), y: 24, width: 340, height: 154 },
    "choice-panel": { x: Math.max(16, width - 368), y: Math.max(164, Math.floor(height * 0.46)), width: 340, height: 280 },
    "output-panel": { x: Math.max(240, Math.floor(width * 0.22)), y: Math.max(380, height - 238), width: Math.max(360, Math.min(520, width * 0.28)), height: 176 },
  };
}

const store = createStateStore();
const contextMenu = createContextMenu(document.getElementById("context-menu"));
const inspector = createInspectorPanel(document.getElementById("inspector-content"));
const timeline = createTimelinePanel(document.getElementById("timeline-content"));
const renderer = createGraphRenderer({
  svg: document.getElementById("graph-canvas"),
  viewport: document.getElementById("graph-viewport"),
});
const interaction = createGraphInteraction(renderer, contextMenu);

const dom = {
  graphHint: document.getElementById("graph-hint"),
  startButton: document.getElementById("start-button"),
  relayoutButton: document.getElementById("relayout-button"),
  actionButtons: Array.from(document.querySelectorAll("[data-action]")),
  replayButtons: Array.from(document.querySelectorAll("[data-replay-mode]")),
  langButtons: Array.from(document.querySelectorAll("[data-lang]")),
  fitButton: document.getElementById("fit-view-button"),
  resetButton: document.getElementById("reset-view-button"),
  nextButton: document.getElementById("next-step-button"),
  replayStatus: document.getElementById("replay-status"),
  statusBody: document.getElementById("game-status"),
  choicePanel: document.getElementById("choice-panel"),
  choiceContent: document.getElementById("choice-panel-content"),
  outputPanel: document.getElementById("output-panel"),
  outputContent: document.getElementById("output-panel-content"),
  actionTitle: document.getElementById("action-panel-title"),
  statusTitle: document.getElementById("status-panel-title"),
  replayTitle: document.getElementById("replay-panel-title"),
  outputTitle: document.getElementById("output-panel-title"),
  choiceTitle: document.getElementById("choice-panel-title"),
  nodeDetailPanel: document.getElementById("node-detail-panel"),
  nodeDetailTitle: document.getElementById("node-detail-title"),
  nodeDetailSubtitle: document.getElementById("node-detail-subtitle"),
  nodeDetailContent: document.getElementById("node-detail-content"),
  nodeDetailClose: document.getElementById("node-detail-close"),
  panels: Array.from(document.querySelectorAll(".runtime-panel")),
};

initRuntimePanels();
bindControls();
bindGraphInteraction();
render();
renderer.fitView();

function render() {
  const state = store.getState();
  applyUIText();
  syncButtons();

  const graphModel = mapGameStateToGraphModel(state.gameState, {
    selectedNodeId: state.selectedNodeId,
    displayStates: state.displayStates,
    nodePositions: state.nodePositions,
    transientOwnerIds: state.transientOwnerIds,
    pinnedChildNodeIds: state.pinnedChildNodeIds,
    highlighted: state.highlighted,
    initDraft: state.initDraft,
    pendingRuntimeSelection: state.pendingRuntimeSelection,
  });

  renderer.render(graphModel);
  interaction.bindGraph(graphModel, {
    onSelectNode: handleNodeSelection,
    onContextNode: openContextMenu,
    onDragNode: moveNode,
    getNodePosition,
    onRuntimeAction: runGraphAction,
    onRuntimeChoice: runGraphChoice,
    onInitDifficulty: setInitDifficulty,
    onInitNext: advanceInitDraft,
  });

  if (!state.gameState) {
    setActionButtonsEnabled(false);
    inspector.renderEmpty(state.language);
    timeline.render([]);
    renderOutputPanel([]);
    renderChoicePanel([]);
    renderNodeDetail(null);
    dom.statusBody.innerHTML = "";
    dom.replayStatus.textContent = UI[state.language].replayIdle;
    applyRuntimePanelHighlight();
    return;
  }

  setActionButtonsEnabled(true);
  const selectedNode = graphModel.nodes.find((node) => node.id === state.selectedNodeId) || null;
  inspector.render(selectedNode, state.gameState, state.language);
  renderNodeDetail(selectedNode);
  timeline.render(state.gameState.logs || []);
  renderStatusPanel(state.gameState);
  renderChoicePanel(state.gameState.pendingChoices || []);
  renderOutputPanel(state.gameState.logs || []);
  updateReplayStatus();
  applyRuntimePanelHighlight();
}

function applyUIText() {
  const t = UI[store.getState().language];
  dom.actionTitle.textContent = t.actions;
  dom.statusTitle.textContent = t.status;
  dom.replayTitle.textContent = t.replay;
  dom.outputTitle.textContent = t.output;
  dom.choiceTitle.textContent = t.choice;
  dom.graphHint.textContent = t.graphHint;
  dom.startButton.textContent = store.getState().gameState || store.getState().initDraft ? "\uC7AC\uC2DC\uC791" : t.start;
  dom.relayoutButton.textContent = t.relayout;
  document.querySelector('[data-action="study"]').textContent = t.study;
  document.querySelector('[data-action="play"]').textContent = t.play;
  document.querySelector('[data-action="exercise"]').textContent = t.exercise;
  document.querySelector('[data-action="rest"]').textContent = t.rest;
  dom.fitButton.textContent = t.fitView;
  dom.resetButton.textContent = t.resetView;
  dom.nextButton.textContent = t.next;
}

function syncButtons() {
  const state = store.getState();
  dom.replayButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.replayMode === state.replayMode);
  });
  dom.langButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === state.language);
  });
  const hasReplay = state.replaySequence.length > 0;
  const hasPendingStep = Boolean(state.pendingRuntimeSelection);
  dom.startButton.parentElement.classList.toggle("has-game", Boolean(state.gameState));
  dom.relayoutButton.disabled = !state.gameState;
  dom.nextButton.disabled = !hasReplay && !hasPendingStep;
}

function renderStatusPanel(gameState) {
  const t = UI[store.getState().language];
  const examIn = Math.max((gameState?.maxTurn || 1) - (gameState?.semesterTurn || 1), 0);
  dom.statusBody.innerHTML = [
    makeStatusCard(t.grade, String(gameState?.grade || 1)),
    makeStatusCard(t.semester, String(gameState?.semester || 1)),
    makeStatusCard(t.turn, `${gameState?.semesterTurn || 1} / ${gameState?.maxTurn || 1}`),
    makeStatusCard(t.examIn, String(examIn)),
  ].join("");
}

function makeStatusCard(label, value) {
  return `<div class="status-card"><span class="status-card__label">${escapeHtml(label)}</span><span class="status-card__value">${escapeHtml(value)}</span></div>`;
}

function renderChoicePanel(pendingChoices) {
  dom.choicePanel.classList.add("runtime-panel--hidden");
  dom.choiceContent.innerHTML = "";
}

function renderOutputPanel(logs) {
  const initDraft = store.getState().initDraft;
  const polymorphismResult = store.getState().polymorphismResult || store.getState().gameState?.polymorphismResult;
  if (polymorphismResult) {
    dom.outputPanel.classList.remove("is-init");
    dom.outputContent.innerHTML = renderPolymorphismOutput(polymorphismResult);
    return;
  }
  if (!store.getState().gameState && initDraft) {
    dom.outputPanel.classList.remove("is-init");
    dom.outputContent.innerHTML = "";
    return;
  }
  dom.outputPanel.classList.remove("is-init");
  const t = UI[store.getState().language];
  if (!logs.length) {
    dom.outputContent.innerHTML = `<div class="output-card">${escapeHtml(t.noOutput)}</div>`;
    return;
  }
  dom.outputContent.innerHTML = logs.slice(-4).reverse().map((log) => {
    const details = [];
    if (log.result?.message) details.push(log.result.message);
    if ((log.result?.warnings || []).length) details.push(...log.result.warnings);
    return `
      <div class="output-card">
        <strong>${escapeHtml(log.phase || "result")}</strong>
        ${details.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}
      </div>
    `;
  }).join("");
}

function renderPolymorphismOutput(result) {
  return `
    <div class="output-card output-card--polymorphism">
      <strong>다형성 실행 결과</strong>
      <div class="poly-output__meta">
        <span>선언 타입: ${escapeHtml(result.declaredType || "-")}</span>
        <span>실제 타입: ${escapeHtml(result.actualType || result.className || "-")}</span>
        <span>호출 메서드: ${escapeHtml(result.method || "-")}()</span>
      </div>
      <pre>${escapeHtml(result.output || "")}</pre>
    </div>
  `;
}

function handleInitInput(event) {
  if (!event.target.matches("[data-init-input]")) return;
  const draft = store.getState().initDraft;
  if (!draft) return;
  store.setState({ initDraft: { ...draft, [draft.step]: event.target.value } });
}

function setInitDifficulty(difficulty) {
  const draft = store.getState().initDraft;
  if (!draft) return;
  const nextDraft = { ...draft, difficulty };
  store.setState({ initDraft: nextDraft });
  applyInitDraftFlow(nextDraft, "input");
  render();
}

async function advanceInitDraft() {
  const input = document.querySelector("[data-init-input]");
  if (input) handleInitInput({ target: input });
  const draft = store.getState().initDraft;
  if (!draft) return;
  if (!canAdvanceInitDraft(draft)) return;
  const order = ["difficulty", "name", "maxHealth", "intelligence"];
  const nextStep = order[order.indexOf(draft.step) + 1];
  if (nextStep) {
    const nextDraft = { ...draft, step: nextStep };
    store.setState({ initDraft: nextDraft });
    applyInitDraftFlow(nextDraft, "prompt");
    render();
    return;
  }
  await submitInitDraft();
}

function canAdvanceInitDraft(draft) {
  if (draft.step === "difficulty") return Boolean(draft.difficulty);
  if (draft.step === "name") return Boolean(String(draft.name || "").trim());
  if (draft.step === "maxHealth" || draft.step === "intelligence") {
    const value = Number(draft[draft.step]);
    return Number.isFinite(value) && value > 0;
  }
  return true;
}

function applyInitDraftFlow(draft, direction = "prompt") {
  const replayMode = store.getState().replayMode;
  if (!draft || replayMode === "skip") {
    store.setState({ highlighted: { current: [], next: [], changed: [], runtimeEdges: [], methodNode: null, methodNodes: [], fieldChange: null } });
    renderer.setRuntimeFocus({ current: [], next: [], changed: [] });
    return;
  }
  const ownerNodeId = "object:initSettings";
  const runtimeNodeId = "runtime:ui";
  const methodName = direction === "input" ? "applyInput()" : "promptInput()";
  const methodNode = { id: `method:${ownerNodeId}:${methodName}`, ownerNodeId, label: methodName };
  const runtimeEdges = replayMode === "detailed"
    ? direction === "input"
      ? [{ from: runtimeNodeId, to: methodNode.id, kind: "current" }, { from: methodNode.id, to: ownerNodeId, kind: "current" }]
      : [{ from: ownerNodeId, to: methodNode.id, kind: "current" }, { from: methodNode.id, to: runtimeNodeId, kind: "current" }]
    : direction === "input"
      ? [{ from: runtimeNodeId, to: ownerNodeId, kind: "current" }]
      : [{ from: ownerNodeId, to: runtimeNodeId, kind: "current" }];
  const focusNodeIds = replayMode === "detailed"
    ? [ownerNodeId, methodNode.id, runtimeNodeId]
    : [ownerNodeId, runtimeNodeId];
  store.setState({
    transientOwnerIds: [ownerNodeId],
    highlighted: {
      current: focusNodeIds,
      next: [],
      changed: direction === "input" ? [ownerNodeId] : [],
      runtimeEdges,
      methodNode: replayMode === "detailed" ? methodNode : null,
      methodNodes: replayMode === "detailed" ? [methodNode] : [],
      fieldChange: null,
    },
  });
  renderer.setRuntimeFocus({ current: focusNodeIds.filter((id) => id !== runtimeNodeId), next: [], changed: [] });
}

function renderNodeDetail(node) {
  if (!node || !["class", "object", "event", "status", "collection"].includes(node.kind)) {
    dom.nodeDetailPanel.classList.add("node-detail-panel--hidden");
    return;
  }
  dom.nodeDetailTitle.textContent = node.label;
  dom.nodeDetailSubtitle.textContent = `${node.kind}${node.readOnly ? " / read-only" : ""}`;
  dom.nodeDetailContent.innerHTML = `
    ${polymorphismActionCard(node)}
    <div class="section-card">
      <h3>Fields</h3>
      <div class="detail-list">${detailRows(node.data.fields || node.data.summaryFields || node.data || {})}</div>
    </div>
    <div class="section-card">
      <h3>Methods</h3>
      <div class="detail-list">${methodRows(node.data.methods || [])}</div>
    </div>
    <div class="section-card">
      <h3>State</h3>
      <div class="detail-list">
        <div><span>id</span><span>${escapeHtml(node.id)}</span></div>
        <div><span>class</span><span>${escapeHtml(node.data.className || node.label)}</span></div>
        <div><span>display</span><span>${escapeHtml(node.display?.mode || "compact")}</span></div>
      </div>
    </div>
  `;
  dom.nodeDetailPanel.classList.remove("node-detail-panel--hidden");
}

function polymorphismActionCard(node) {
  if (!isPolymorphicNode(node)) return "";
  const method = node.kind === "class" ? "previewBehavior" : "showStatus";
  const target = node.kind === "class" ? node.data.className || node.label : node.id;
  return `
    <div class="section-card polymorphism-card">
      <h3>오버라이딩 강조</h3>
      <button class="polymorphism-run-button" data-polymorphism-target="${escapeAttr(target)}" data-polymorphism-kind="${node.kind}">
        오버라이딩 메서드 실행: ${escapeHtml(method)}()
      </button>
      <div class="polymorphism-note">
        선언 타입으로 호출하고 실제 타입의 구현 결과를 Runtime UI에 출력합니다.
      </div>
    </div>
  `;
}

function isPolymorphicNode(node) {
  const className = node.kind === "class" ? node.data.className || node.label : node.data.className;
  return ["Student", "Friend", "Professor"].includes(className);
}

function detailRows(fields) {
  const entries = Array.isArray(fields)
    ? fields.map((value, index) => [String(index + 1), value])
    : Object.entries(fields);
  if (!entries.length) return `<div><span>none</span><span>-</span></div>`;
  return entries.slice(0, 16)
    .map(([key, value]) => `<div><span>${escapeHtml(key)}</span><span>${escapeHtml(formatDetailValue(value))}</span></div>`)
    .join("");
}

function methodRows(methods) {
  if (!methods.length) return `<div><span>none</span><span>-</span></div>`;
  return methods.slice(0, 16)
    .map((method, index) => `<div><span>${index + 1}</span><span>${escapeHtml(method)}</span></div>`)
    .join("");
}

function formatDetailValue(value) {
  if (Array.isArray(value)) return `${value.length} item`;
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function setGameState(nextGameState, options = {}) {
  const preserveSelection = options.preserveSelection !== false;
  store.setState({
    gameState: nextGameState,
    selectedNodeId: preserveSelection ? store.getState().selectedNodeId : null,
  });
  loadReplayFromState();
  render();
}

function loadReplayFromState() {
  const state = store.getState();
  const latestLogs = getLatestReplayLogs(state.gameState);
  const replaySequence = state.replayMode === "skip"
    ? []
    : latestLogs.flatMap((log) => buildReplaySteps(log, state.replayMode));
  store.setState({ replaySequence, replayIndex: -1 });
  applyReplayStep();
}

function getLatestReplayLogs(gameState) {
  const logs = gameState?.logs || [];
  if (!logs.length) return [];
  for (let i = logs.length - 1; i >= 0; i -= 1) {
    if (logs[i].phase === "player_action") return logs.slice(i);
  }
  const latestLog = getLatestReplayLog(gameState);
  return latestLog ? [latestLog] : [];
}

function getLatestReplayLog(gameState) {
  const logs = gameState?.logs || [];
  for (let i = logs.length - 1; i >= 0; i -= 1) {
    if ((logs[i].result?.traceSteps || []).length) return logs[i];
  }
  return logs.length ? logs[logs.length - 1] : null;
}

function buildReplaySteps(log, replayMode) {
  const traceSteps = log?.result?.traceSteps || [];
  const sequence = [];
  if (log?.phase === "player_action") {
    const managerNodeId = managerNodeForActionLog(log);
    sequence.push(createReplayStep({
      type: "panel_action",
      phase: log.phase,
      message: log.result?.message || log.phase,
      fromNodeId: "runtime:ui",
      toNodeId: managerNodeId,
    }));
  }
  if (log?.phase === "polymorphism") {
    const targetNodeId = log.result?.targetId
      ? objectIdToNodeId(log.result.targetId) || log.result.targetId
      : objectIdToNodeId(log.result?.className) || `class:${log.result?.className}`;
    sequence.push(createReplayStep({
      type: "panel_action",
      phase: log.phase,
      message: `다형성 호출: ${log.result?.method || "method"}()`,
      fromNodeId: "runtime:ui",
      toNodeId: targetNodeId,
    }));
  }
  traceSteps
    .filter((step) => shouldShowTraceStep(step, replayMode))
    .forEach((step) => {
      const replayStep = createReplayStep({
        type: step.type,
        phase: log?.phase || "",
        message: step.message || step.type,
        fromNodeId: resolveReplaySourceNodeId(step, sequence),
        toNodeId: resolveReplayTargetNodeId(step),
        methodNodes: replayMode === "detailed" ? buildReplayMethodNodes(step) : [],
        fieldChange: replayMode === "detailed" ? buildFieldChange(step) : null,
        rawStep: step,
      });
      applyDetailedMethodFlow(replayStep, sequence, replayMode);
      sequence.push(replayStep);
    });
  if (log?.result?.message || (log?.result?.warnings || []).length) {
    sequence.push(createReplayStep({
      type: "panel_output",
      phase: log?.phase || "",
      message: log.result?.message || log.phase,
      fromNodeId: currentOwnerOrPanel(sequence),
      toNodeId: "runtime:ui",
    }));
  }
  return sequence;
}

function managerNodeForActionLog(log) {
  const reasons = (log?.result?.changedValues || []).map((change) => change.reason || "");
  if (reasons.some((reason) => reason.startsWith("play"))) return "object:interactionManager";
  return "object:actionManager";
}

function createReplayStep({ type, phase = "", message = "", fromNodeId = "", toNodeId = "", methodNode = null, methodNodes = [], fieldChange = null, rawStep = null }) {
  const allMethodNodes = methodNodes.length ? methodNodes : (methodNode ? [methodNode] : []);
  const focusNodeIds = [...new Set([fromNodeId, toNodeId, ...allMethodNodes.map((node) => node.id), fieldChange?.nodeId].filter(Boolean))];
  const currentNodes = focusNodeIds;
  return {
    mode: type === "panel_action" || type === "panel_output" ? "io" : "trace",
    phase,
    type,
    message,
    fromNodeId,
    toNodeId,
    focusNodeIds,
    currentNodes,
    ownerIds: extractOwnerIds(currentNodes),
    runtimeEdges: fromNodeId && toNodeId ? [{ from: fromNodeId, to: toNodeId, kind: edgeKindForReplayStep(type) }] : [],
    methodNode: allMethodNodes[allMethodNodes.length - 1] || null,
    methodNodes: allMethodNodes,
    fieldChange,
    rawStep,
  };
}

function applyDetailedMethodFlow(step, sequence, replayMode) {
  if (replayMode !== "detailed" || !(step.methodNodes || []).length) return;
  const methodNodes = step.methodNodes || [];
  step.runtimeEdges = [];
  if (step.fromNodeId) {
    step.runtimeEdges.push({ from: step.fromNodeId, to: methodNodes[0].id, kind: edgeKindForReplayStep(step.type) });
  }
  for (let index = 0; index < methodNodes.length - 1; index += 1) {
    step.runtimeEdges.push({ from: methodNodes[index].id, to: methodNodes[index + 1].id, kind: "current" });
  }
  if (step.fieldChange?.nodeId) {
    step.runtimeEdges.push({ from: methodNodes[methodNodes.length - 1].id, to: step.fieldChange.nodeId, kind: edgeKindForReplayStep(step.type) });
  } else if (step.toNodeId && step.toNodeId !== methodNodes[methodNodes.length - 1].id) {
    step.runtimeEdges.push({ from: methodNodes[methodNodes.length - 1].id, to: step.toNodeId, kind: edgeKindForReplayStep(step.type) });
  }
  step.focusNodeIds = [...new Set([
    step.fromNodeId,
    step.toNodeId,
    ...methodNodes.map((node) => node.id),
    step.fieldChange?.nodeId,
  ].filter(Boolean))];
  step.currentNodes = step.focusNodeIds;
  step.ownerIds = extractOwnerIds(step.currentNodes);
}

function findPreviousMethodStep(sequence, ownerNodeId) {
  for (let index = sequence.length - 1; index >= 0; index -= 1) {
    const methodNode = sequence[index]?.methodNode;
    if (methodNode?.ownerNodeId === ownerNodeId) return sequence[index];
  }
  return null;
}

function shouldShowTraceStep(step, replayMode) {
  if (replayMode === "detailed") return true;
  return step.type === "method_call" || step.type === "event_trigger" || step.type === "polymorphic_dispatch";
}

function edgeKindForReplayStep(type) {
  if (type === "field_write") return "write";
  if (type === "condition_check") return "read";
  return "current";
}

function resolveReplaySourceNodeId(step, sequence) {
  const methodOwner = managerNodeForMethod(step.methodName);
  if (methodOwner) return methodOwner;
  const sourceNodeId = objectIdToNodeId(step.sourceObjectId);
  if (sourceNodeId) return sourceNodeId;
  return currentOwnerOrPanel(sequence);
}

function resolveReplayTargetNodeId(step) {
  return objectIdToNodeId(step.targetObjectId) || objectIdToNodeId(step.sourceObjectId) || "runtime:ui";
}

function buildReplayMethodNodes(step) {
  if (!step.methodName) return [];
  const managerOwnerId = managerNodeForMethod(step.methodName);
  const sourceOwnerId = managerOwnerId || objectIdToNodeId(step.sourceObjectId);
  const targetOwnerId = objectIdToNodeId(step.targetObjectId) || sourceOwnerId;
  const ownerIds = managerOwnerId ? [managerOwnerId] : [...new Set([sourceOwnerId, targetOwnerId].filter(Boolean))];
  if (!ownerIds.length && (step.sourceObjectId === "runtime" || step.targetObjectId === "runtime")) {
    const runtimeTarget = targetOwnerId || sourceOwnerId;
    if (runtimeTarget) ownerIds.push(runtimeTarget);
  }
  if (!ownerIds.length) return [];
  return ownerIds.map((ownerNodeId) => {
    const id = resolveMethodNodeId(ownerNodeId, step.methodName);
    return id ? { id, ownerNodeId, label: methodLabel(step.methodName) } : null;
  }).filter(Boolean);
}

function managerNodeForMethod(methodName) {
  if (!methodName) return null;
  if (methodName.startsWith("ActionManager.")) return "object:actionManager";
  if (methodName.startsWith("InteractionManager.")) return "object:interactionManager";
  if (methodName.startsWith("EventManager.")) return "object:eventManager";
  if (methodName.startsWith("TurnManager.")) return "object:turnManager";
  if (methodName.startsWith("ExamManager.")) return "object:examManager";
  if (methodName.startsWith("SemesterManager.")) return "object:semesterManager";
  return null;
}

function buildFieldChange(step) {
  if (!step.targetField || (step.type !== "field_write" && step.type !== "condition_check")) return null;
  const ownerNodeId = objectIdToNodeId(step.targetObjectId) || objectIdToNodeId(step.sourceObjectId);
  if (!ownerNodeId) return null;
  return {
    nodeId: `field:${ownerNodeId}:${step.targetField}`,
    ownerNodeId,
    methodNodeId: resolveMethodNodeId(ownerNodeId, step.methodName),
    fieldName: step.targetField,
    before: step.before,
    after: step.after,
    delta: calculateDelta(step.before, step.after),
  };
}

function calculateDelta(before, after) {
  return typeof before === "number" && typeof after === "number" ? after - before : null;
}

function methodLabel(methodName) {
  if (!methodName) return "";
  const tail = methodName.includes(".") ? methodName.split(".").pop() : methodName;
  return tail.endsWith("()") ? tail : `${tail}()`;
}

function resolveNodesForTraceStep(step) {
  const ownerNodeId = objectIdToNodeId(step.sourceObjectId) || objectIdToNodeId(step.targetObjectId);
  if (step.type === "method_call") {
    return [resolveMethodNodeId(ownerNodeId, step.methodName) || ownerNodeId].filter(Boolean);
  }
  if (step.type === "field_write" || step.type === "condition_check") {
    const targetOwnerId = objectIdToNodeId(step.targetObjectId) || ownerNodeId;
    const methodNodeId = resolveMethodNodeId(targetOwnerId, step.methodName);
    const fieldNodeId = targetOwnerId && step.targetField ? `field:${targetOwnerId}:${step.targetField}` : null;
    return [methodNodeId || targetOwnerId, fieldNodeId].filter(Boolean);
  }
  return [ownerNodeId].filter(Boolean);
}

function resolveMethodNodeId(ownerNodeId, methodName) {
  if (!ownerNodeId || !methodName) return null;
  const tail = methodName.includes(".") ? methodName.split(".").pop() : methodName;
  const normalized = tail.endsWith("()") ? tail : `${tail}()`;
  return `method:${ownerNodeId}:${normalized}`;
}

function extractOwnerIds(nodeIds) {
  const owners = new Set();
  nodeIds.forEach((nodeId) => {
    if (!nodeId) return;
    if (nodeId.startsWith("object:") || nodeId.startsWith("class:")) {
      owners.add(nodeId);
      return;
    }
    const parts = nodeId.split(":");
    if ((nodeId.startsWith("field:") || nodeId.startsWith("method:")) && parts.length >= 3) {
      owners.add(parts.slice(1, -1).join(":"));
    }
  });
  return [...owners];
}

function ownerIdsFromSelection(nodeId) {
  if (!nodeId) return [];
  if (nodeId.startsWith("object:") || nodeId.startsWith("class:")) return [nodeId];
  const parts = nodeId.split(":");
  if ((nodeId.startsWith("field:") || nodeId.startsWith("method:")) && parts.length >= 3) {
    return [parts.slice(1, -1).join(":")];
  }
  return [];
}

function objectIdToNodeId(objectId) {
  if (objectId === "runtime" || objectId === "runtime:ui") return "runtime:ui";
  if (objectId === "actionManager") return "object:actionManager";
  if (objectId === "interactionManager") return "object:interactionManager";
  if (objectId === "examManager") return "object:examManager";
  if (objectId === "eventManager") return "object:eventManager";
  if (objectId === "semesterManager") return "object:semesterManager";
  if (objectId === "turnManager") return "object:turnManager";
  if (objectId === "gameState") return "object:gameState";
  if (objectId === "player") return "object:player";
  if (objectId?.startsWith("friend:")) return `object:${objectId}`;
  if (objectId?.startsWith("professor:")) return `object:${objectId}`;
  if (["PersonADT", "Person", "Student", "Friend", "Professor", "Event", "StatusEffect", "Course", "GameState", "RuntimeService"].includes(objectId)) {
    return `class:${objectId}`;
  }
  return null;
}

function applyReplayStep() {
  const state = store.getState();
  if (!state.replaySequence.length || state.replayIndex < 0) {
    store.setState({
      highlighted: { current: [], next: [], changed: [], runtimeEdges: [], methodNode: null, methodNodes: [], fieldChange: null },
      transientOwnerIds: state.selectedNodeId ? ownerIdsFromSelection(state.selectedNodeId) : [],
    });
    renderer.setRuntimeFocus({ current: [], next: [], changed: [] });
    return;
  }
  const currentStep = state.replaySequence[state.replayIndex];
  const nextStep = state.replaySequence[state.replayIndex + 1];
  const runtimeEdges = currentStep?.runtimeEdges?.length
    ? [...currentStep.runtimeEdges]
    : [];
  if (nextStep?.currentNodes?.[0] && currentStep?.currentNodes?.[0]) {
    runtimeEdges.push({ from: currentStep.currentNodes[0], to: nextStep.currentNodes[0], kind: "next" });
  }
  store.setState({
    transientOwnerIds: [...new Set([...(currentStep?.ownerIds || []), ...(nextStep?.ownerIds || []), ...ownerIdsFromSelection(state.selectedNodeId)])],
    highlighted: {
      current: currentStep?.focusNodeIds || currentStep?.currentNodes || [],
      next: nextStep?.focusNodeIds || nextStep?.currentNodes || [],
      changed: currentStep?.fieldChange ? [currentStep.fieldChange.nodeId] : [],
      runtimeEdges,
      methodNode: currentStep?.methodNode || null,
      methodNodes: currentStep?.methodNodes || (currentStep?.methodNode ? [currentStep.methodNode] : []),
      fieldChange: currentStep?.fieldChange || null,
    },
  });
  renderer.setRuntimeFocus({
    current: (currentStep?.focusNodeIds || currentStep?.currentNodes || []).filter((id) => !id.startsWith("panel:")),
    next: (nextStep?.focusNodeIds || nextStep?.currentNodes || []).filter((id) => !id.startsWith("panel:")),
    changed: currentStep?.fieldChange ? [currentStep.fieldChange.nodeId] : [],
  });
  if (state.replayMode === "detailed") {
    const focusNode = (currentStep?.focusNodeIds || currentStep?.currentNodes || []).find((id) => !id.startsWith("panel:"));
    if (focusNode) renderer.focusNode(focusNode);
  }
}

function updateReplayStatus() {
  const state = store.getState();
  const t = UI[state.language];
  if (!state.replaySequence.length || state.replayIndex < 0) {
    dom.replayStatus.textContent = state.pendingRuntimeSelection
      ? "선택 적용 대기"
      : state.replaySequence.length
        ? `0/${state.replaySequence.length} ${t.replayReady}`
        : t.replayIdle;
    return;
  }
  const step = state.replaySequence[state.replayIndex];
  dom.replayStatus.textContent = step ? `${state.replayIndex + 1}/${state.replaySequence.length} ${step.message || step.type}` : t.replayReady;
}

function handleNodeSelection(nodeId) {
  if (nodeId.startsWith("group:")) {
    toggleGroupNode(nodeId);
    return;
  }
  if (nodeId.startsWith("collection:")) {
    toggleCollectionNode(nodeId);
    return;
  }
  store.setState({
    selectedNodeId: nodeId,
    transientOwnerIds: ownerIdsFromSelection(nodeId),
  });
  render();
  renderer.highlightNode(nodeId);
}

function togglePinChild(nodeId) {
  const state = store.getState();
  const pinnedChildNodeIds = state.pinnedChildNodeIds.includes(nodeId)
    ? state.pinnedChildNodeIds.filter((id) => id !== nodeId)
    : [...state.pinnedChildNodeIds, nodeId];
  store.setState({ pinnedChildNodeIds });
  render();
}

function openContextMenu(nodeId, x, y) {
  const isChild = nodeId.startsWith("field:") || nodeId.startsWith("method:");
  const ownerId = ownerIdsFromSelection(nodeId)[0] || nodeId;
  const pinned = store.getState().pinnedChildNodeIds.includes(nodeId);
  const isCollection = nodeId.startsWith("collection:");
  const groupClassId = classIdFromGroupNode(nodeId);
  const collectionClassId = classIdFromCollectionNode(nodeId);
  const expandableClassId = groupClassId || collectionClassId;
  const groupExpanded = expandableClassId
    ? store.getState().displayStates?.[expandableClassId]?.mode === "expanded"
    : false;
  contextMenu.open(x, y, null, [
    { label: "Expand", action: () => setOwnerMode(ownerId, "expanded"), disabled: isChild || isCollection },
    { label: "Collapse", action: () => setOwnerMode(ownerId, "collapsed"), disabled: isChild || isCollection },
    {
      label: groupExpanded ? "Collapse group" : "Expand group",
      action: () => toggleExpandableGroup(expandableClassId),
      disabled: !expandableClassId,
    },
    { label: "Pin node", action: () => togglePinChild(nodeId), disabled: !isChild || pinned },
    { label: "Unpin node", action: () => togglePinChild(nodeId), disabled: !isChild || !pinned },
    { label: "Focus here", action: () => renderer.focusNode(nodeId), disabled: nodeId.startsWith("collection:") ? false : false },
    { label: "Show in Inspector", action: () => handleNodeSelection(nodeId) },
  ]);
}

function classIdFromCollectionNode(nodeId) {
  const map = {
    "collection:events": "class:Event",
    "collection:statuses": "class:StatusEffect",
    "collection:friends": "class:Friend",
    "collection:professors": "class:Professor",
    "collection:runtime-services": "class:RuntimeService",
    "collection:courses": "class:Course",
  };
  return map[nodeId] || null;
}

function classIdFromGroupNode(nodeId) {
  const map = {
    "group:event": "class:Event",
    "group:status": "class:StatusEffect",
    "group:friend": "class:Friend",
    "group:professor": "class:Professor",
    "group:runtimeservice": "class:RuntimeService",
    "group:course": "class:Course",
    "group:gamestate": "class:GameState",
    "group:student": "class:Student",
  };
  return map[nodeId] || null;
}

function toggleExpandableGroup(classId) {
  if (!classId) return;
  const displayStates = { ...(store.getState().displayStates || {}) };
  const mode = displayStates[classId]?.mode === "expanded" ? "compact" : "expanded";
  displayStates[classId] = { ...(displayStates[classId] || {}), mode };
  store.setState({ displayStates });
  render();
}

function setOwnerMode(nodeId, mode) {
  const displayStates = { ...(store.getState().displayStates || {}) };
  displayStates[nodeId] = {
    portrait: true,
    fields: "hidden",
    methods: "hidden",
    references: "hidden",
    pinned: false,
    ...(displayStates[nodeId] || {}),
    mode,
  };
  store.setState({ displayStates });
  render();
}

function moveNode(nodeId, position) {
  const nodePositions = { ...(store.getState().nodePositions || {}) };
  if (nodeId.startsWith("group:")) {
    const graphModel = buildCurrentGraphModel();
    const group = graphModel.groups.find((item) => item.id === nodeId);
    if (!group) return;
    const dx = position.x - group.x;
    const dy = position.y - group.y;
    (group.memberIds || []).forEach((memberId) => {
      const member = graphModel.nodes.find((item) => item.id === memberId);
      if (member) nodePositions[memberId] = { x: member.x + dx, y: member.y + dy };
    });
    store.setState({ nodePositions });
    render();
    return;
  }
  nodePositions[nodeId] = position;
  store.setState({ nodePositions });
  render();
}

function getNodePosition(nodeId) {
  const graphModel = buildCurrentGraphModel();
  const node = graphModel.nodes.find((item) => item.id === nodeId);
  if (!node && nodeId.startsWith("group:")) {
    const group = graphModel.groups.find((item) => item.id === nodeId);
    return { x: group?.x || 0, y: group?.y || 0 };
  }
  return { x: node?.x || 0, y: node?.y || 0 };
}

function buildCurrentGraphModel() {
  return mapGameStateToGraphModel(store.getState().gameState, {
    selectedNodeId: store.getState().selectedNodeId,
    displayStates: store.getState().displayStates,
    nodePositions: store.getState().nodePositions,
    transientOwnerIds: store.getState().transientOwnerIds,
    pinnedChildNodeIds: store.getState().pinnedChildNodeIds,
    highlighted: store.getState().highlighted,
    initDraft: store.getState().initDraft,
    pendingRuntimeSelection: store.getState().pendingRuntimeSelection,
  });
}

function startGame() {
  const state = store.getState();
  if (state.initDraft || state.gameState || state.sessionId || state.pendingRuntimeSelection) {
    resetToInitialScreen();
    return;
  }
  const initDraft = { step: "difficulty", difficulty: "", name: "", maxHealth: "", intelligence: "" };
  store.setState({
    sessionId: null,
    gameState: null,
    polymorphismResult: null,
    selectedNodeId: null,
    transientOwnerIds: [],
    pinnedChildNodeIds: [],
    replaySequence: [],
    replayIndex: -1,
    pendingRuntimeSelection: null,
    highlighted: { current: [], next: [], changed: [], runtimeEdges: [], methodNode: null, methodNodes: [], fieldChange: null },
    initDraft,
  });
  applyInitDraftFlow(initDraft, "prompt");
  render();
  renderer.focusNode("runtime:ui");
}

function resetToInitialScreen() {
  store.setState({
    sessionId: null,
    gameState: null,
    polymorphismResult: null,
    initDraft: null,
    pendingRuntimeSelection: null,
    selectedNodeId: null,
    transientOwnerIds: [],
    pinnedChildNodeIds: [],
    replaySequence: [],
    replayIndex: -1,
    highlighted: { current: [], next: [], changed: [], runtimeEdges: [], methodNode: null, methodNodes: [], fieldChange: null },
  });
  renderer.setRuntimeFocus({ current: [], next: [], changed: [] });
  render();
  renderer.fitView();
}

async function submitInitDraft() {
  markBusy(dom.startButton);
  const draft = store.getState().initDraft || {};
  const payload = await apiStart({
    difficulty: draft.difficulty || "normal",
    name: draft.name || "Player",
    maxHealth: Number(draft.maxHealth || 70),
    intelligence: Number(draft.intelligence || 70),
  });
  store.setState({
    sessionId: payload.sessionId,
    gameState: payload.state,
    polymorphismResult: null,
    initDraft: null,
    pendingRuntimeSelection: null,
    selectedNodeId: null,
    transientOwnerIds: [],
    pinnedChildNodeIds: [],
  });
  loadReplayFromState();
  render();
  renderer.fitView();
}

async function runAction(action, button) {
  const sessionId = store.getState().sessionId;
  if (!sessionId) return;
  markBusy(button);
  const payload = await apiAction(sessionId, action);
  store.setState({ selectedNodeId: null, transientOwnerIds: [], polymorphismResult: null });
  setGameState(payload.state);
}

async function runGraphAction(action, target) {
  if (!store.getState().gameState) return;
  await runAction(action, target);
}

async function runGraphChoice(courseName, selectedIndex, target) {
  const sessionId = store.getState().sessionId;
  if (!sessionId || !courseName) return;
  const choice = store.getState().gameState?.pendingChoices?.find((item) => item.courseName === courseName);
  const candidate = choice?.candidates?.[selectedIndex] || null;
  const selection = { kind: choice?.kind || "choice", courseName, selectedIndex, candidate };
  const replayMode = store.getState().replayMode;
  if (replayMode === "skip") {
    markBusy(target);
    const payload = await apiSelect(sessionId, courseName, selectedIndex);
    store.setState({
      gameState: payload.state,
      pendingRuntimeSelection: null,
      selectedNodeId: null,
      transientOwnerIds: [],
      polymorphismResult: null,
      replaySequence: [],
      replayIndex: -1,
      highlighted: { current: [], next: [], changed: [], runtimeEdges: [], methodNode: null, methodNodes: [], fieldChange: null },
    });
    renderer.setRuntimeFocus({ current: [], next: [], changed: [] });
    render();
    return;
  }
  if (replayMode !== "skip") {
    store.setState({ pendingRuntimeSelection: selection });
    applyRuntimeSelectionFlow(selection);
    render();
    return;
  }
}

async function commitRuntimeSelection() {
  const selection = store.getState().pendingRuntimeSelection;
  const sessionId = store.getState().sessionId;
  if (!selection || !sessionId) return false;
  const payload = await apiSelect(sessionId, selection.courseName, selection.selectedIndex);
  store.setState({
    gameState: payload.state,
    pendingRuntimeSelection: null,
    selectedNodeId: null,
    transientOwnerIds: [],
    polymorphismResult: null,
    replaySequence: [],
    replayIndex: -1,
    highlighted: { current: [], next: [], changed: [], runtimeEdges: [], methodNode: null, methodNodes: [], fieldChange: null },
  });
  renderer.setRuntimeFocus({ current: [], next: [], changed: [] });
  render();
  return true;
}

function applyRuntimeSelectionFlow(selection) {
  const targetNodeId = runtimeSelectionTargetNodeId(selection);
  if (!targetNodeId) return;
  const replayMode = store.getState().replayMode;
  const methodNode = { id: `method:${targetNodeId}:selectProfessor()`, ownerNodeId: targetNodeId, label: "selectProfessor()" };
  const runtimeEdges = replayMode === "detailed"
    ? [{ from: "runtime:ui", to: methodNode.id, kind: "current" }, { from: methodNode.id, to: targetNodeId, kind: "current" }]
    : [{ from: "runtime:ui", to: targetNodeId, kind: "current" }];
  const focusNodeIds = replayMode === "detailed" ? ["runtime:ui", methodNode.id, targetNodeId] : ["runtime:ui", targetNodeId];
  store.setState({
    selectedNodeId: targetNodeId,
    transientOwnerIds: [targetNodeId],
    highlighted: {
      current: focusNodeIds,
      next: [],
      changed: [targetNodeId],
      runtimeEdges,
      methodNode: replayMode === "detailed" ? methodNode : null,
      methodNodes: replayMode === "detailed" ? [methodNode] : [],
      fieldChange: null,
    },
  });
}

function runtimeSelectionTargetNodeId(selection) {
  if (selection?.kind === "professor_select" && selection.candidate) {
    return `object:professor:${selection.candidate.name}:${selection.courseName}`;
  }
  return null;
}

async function runPolymorphism(nodeId) {
  const sessionId = store.getState().sessionId;
  if (!sessionId) return;
  let result = null;
  if (nodeId.startsWith("class:")) {
    result = await apiClassPolymorphism(sessionId, nodeId.replace("class:", ""));
  } else if (nodeId.startsWith("object:")) {
    result = await apiPolymorphism(sessionId, nodeId);
  }
  if (!result) return;
  inspector.renderPolymorphism(result);
  const currentGameState = store.getState().gameState;
  const replaySequence = store.getState().replayMode === "skip"
    ? []
    : buildReplaySteps({ phase: "polymorphism", result }, store.getState().replayMode);
  store.setState({
    gameState: currentGameState ? { ...currentGameState, polymorphismResult: result } : currentGameState,
    polymorphismResult: result,
    replaySequence,
    replayIndex: -1,
  });
  applyReplayStep();
  render();
}

function runSelectedPolymorphismFromButton(event) {
  const button = event.target.closest("[data-polymorphism-target]");
  if (!button) return;
  event.stopPropagation();
  const target = button.dataset.polymorphismTarget;
  if (!target) return;
  runPolymorphism(button.dataset.polymorphismKind === "class" ? `class:${target}` : target);
}

function clearPolymorphismResult() {
  if (store.getState().polymorphismResult) {
    store.setState({ polymorphismResult: null });
  }
}

function toggleCollectionNode(nodeId) {
  toggleExpandableGroup(classIdFromCollectionNode(nodeId));
}

function toggleGroupNode(nodeId) {
  toggleExpandableGroup(classIdFromGroupNode(nodeId));
}

function nextReplayStep() {
  if (store.getState().pendingRuntimeSelection) {
    commitRuntimeSelection();
    return;
  }
  const state = store.getState();
  if (!state.replaySequence.length) return;
  if (state.replayIndex >= state.replaySequence.length - 1) {
    store.setState({
      replaySequence: [],
      replayIndex: -1,
      highlighted: { current: [], next: [], changed: [], runtimeEdges: [], methodNode: null, methodNodes: [], fieldChange: null },
      transientOwnerIds: ownerIdsFromSelection(state.selectedNodeId),
    });
    renderer.setRuntimeFocus({ current: [], next: [], changed: [] });
    render();
    return;
  }
  store.setState({ replayIndex: state.replayIndex + 1 });
  applyReplayStep();
  render();
}

async function autoResolveChoices() {
  const sessionId = store.getState().sessionId;
  if (!sessionId) return;
  let choices = store.getState().gameState?.pendingChoices || [];
  while (choices.length) {
    const payload = await apiSelect(sessionId, choices[0].courseName, choices[0].selectedIndex || 0);
    store.setState({ gameState: payload.state });
    choices = payload.state?.pendingChoices || [];
  }
  loadReplayFromState();
  render();
}

function markBusy(button) {
  button?.classList.add("is-busy");
  window.setTimeout(() => button?.classList.remove("is-busy"), 500);
}

function bindControls() {
  dom.startButton.addEventListener("click", startGame);
  document.getElementById("graph-viewport").addEventListener("input", handleInitInput);
  document.getElementById("graph-viewport").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.matches("[data-init-input]")) {
      event.preventDefault();
      advanceInitDraft();
    }
  });
  dom.nodeDetailClose.addEventListener("click", () => {
    store.setState({ selectedNodeId: null, transientOwnerIds: [] });
    render();
  });
  dom.nodeDetailPanel.addEventListener("click", (event) => event.stopPropagation());
  dom.nodeDetailContent.addEventListener("click", runSelectedPolymorphismFromButton);
  dom.relayoutButton.addEventListener("click", () => {
    store.setState({ nodePositions: {} });
    render();
    renderer.fitView();
  });
  dom.actionButtons.forEach((button) => {
    button.disabled = true;
    button.addEventListener("click", () => runAction(button.getAttribute("data-action"), button));
  });
  dom.fitButton.addEventListener("click", () => renderer.fitView());
  dom.resetButton.addEventListener("click", () => {
    store.setState({ nodePositions: {} });
    renderer.resetView();
    render();
  });
  dom.replayButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      store.setState({ replayMode: button.dataset.replayMode });
      const initDraft = store.getState().initDraft;
      if (initDraft) {
        applyInitDraftFlow(initDraft, "prompt");
        render();
      } else if (button.dataset.replayMode === "skip") {
        await autoResolveChoices();
      } else {
        loadReplayFromState();
        render();
      }
    });
  });
  dom.langButtons.forEach((button) => {
    button.addEventListener("click", () => {
      store.setState({ language: button.dataset.lang });
      render();
    });
  });
  dom.nextButton.addEventListener("click", nextReplayStep);

  window.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "ArrowRight") {
      event.preventDefault();
      nextReplayStep();
    }
  });
}

function bindGraphInteraction() {
  interaction.onDoubleClick((nodeId) => {
    if (nodeId.startsWith("field:") || nodeId.startsWith("method:")) return;
    const mode = store.getState().displayStates?.[nodeId]?.mode || "compact";
    setOwnerMode(nodeId, mode === "expanded" ? "collapsed" : "expanded");
  });
  interaction.onNodeActivated((nodeId) => {
    handleNodeSelection(nodeId);
  });
  interaction.onBackground(() => {
    const initDraft = store.getState().initDraft;
    if (initDraft) {
      store.setState({ selectedNodeId: null, transientOwnerIds: [] });
      applyInitDraftFlow(initDraft, "prompt");
      render();
      return;
    }
    store.setState({
      selectedNodeId: null,
      transientOwnerIds: [],
      replaySequence: [],
      replayIndex: -1,
      highlighted: { current: [], next: [], changed: [], runtimeEdges: [], methodNode: null, methodNodes: [], fieldChange: null },
    });
    renderer.setRuntimeFocus({ current: [], next: [], changed: [] });
    render();
  });
}

function initRuntimePanels() {
  const panelLayouts = {};
  const defaultPanels = getDefaultPanels();
  document.querySelectorAll(".runtime-panel").forEach((panel) => {
    const panelId = panel.dataset.panelId;
    const layout = defaultPanels[panelId];
    if (layout) {
      applyPanelLayout(panel, layout);
      panelLayouts[panelId] = { ...layout };
    }
    makePanelDraggable(panel, panelLayouts);
  });
  store.setState({ panelLayouts });
}

function makePanelDraggable(panel, panelLayouts) {
  const header = panel.querySelector(".runtime-panel__header");
  let dragging = false;
  let start = null;
  let origin = null;

  header.addEventListener("mousedown", (event) => {
    dragging = true;
    start = { x: event.clientX, y: event.clientY };
    origin = { x: panel.offsetLeft, y: panel.offsetTop, width: panel.offsetWidth, height: panel.offsetHeight };
    event.preventDefault();
  });

  window.addEventListener("mousemove", (event) => {
    if (!dragging) return;
    const next = {
      ...origin,
      x: Math.max(8, origin.x + (event.clientX - start.x)),
      y: Math.max(8, origin.y + (event.clientY - start.y)),
    };
    applyPanelLayout(panel, next);
    panelLayouts[panel.dataset.panelId] = next;
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    store.setState({ panelLayouts: { ...(store.getState().panelLayouts || {}), ...panelLayouts } });
  });
}

function applyPanelLayout(panel, layout) {
  const viewportRect = document.getElementById("graph-viewport").getBoundingClientRect();
  const width = Math.max(180, Math.min(layout.width, Math.max(180, viewportRect.width - 16)));
  const height = Math.max(78, Math.min(layout.height, Math.max(78, viewportRect.height - 16)));
  const x = Math.min(Math.max(8, layout.x), Math.max(8, viewportRect.width - width - 8));
  const y = Math.min(Math.max(8, layout.y), Math.max(8, viewportRect.height - height - 8));
  panel.style.left = `${x}px`;
  panel.style.top = `${y}px`;
  panel.style.width = `${width}px`;
  panel.style.height = `${height}px`;
}

function setActionButtonsEnabled(enabled) {
  dom.actionButtons.forEach((button) => {
    button.disabled = !enabled;
  });
}

function buildRuntimeEdgesForStep(step, currentNodes) {
  if (step.type === "field_write") {
    const methodNode = currentNodes.find((id) => id.startsWith("method:")) || currentNodes[0];
    const fieldNode = currentNodes.find((id) => id.startsWith("field:"));
    return methodNode && fieldNode ? [{ from: methodNode, to: fieldNode, kind: "write" }] : [];
  }
  if (step.type === "condition_check") {
    const methodNode = currentNodes.find((id) => id.startsWith("method:")) || currentNodes[0];
    const fieldNode = currentNodes.find((id) => id.startsWith("field:"));
    return methodNode && fieldNode ? [{ from: methodNode, to: fieldNode, kind: "read" }] : [];
  }
  if (step.type === "method_call" && currentNodes[0]) {
    const owner = ownerIdsFromSelection(currentNodes[0])[0] || "runtime:ui";
    return [{ from: owner, to: currentNodes[0], kind: "current" }];
  }
  return [];
}

function currentOwnerOrPanel(sequence) {
  for (let i = sequence.length - 1; i >= 0; i -= 1) {
    const target = (sequence[i].currentNodes || []).find((id) => id.startsWith("method:") || id.startsWith("object:") || id.startsWith("panel:") || id.startsWith("runtime:"));
    if (target) return target;
  }
  return "runtime:ui";
}

function applyRuntimePanelHighlight() {
  const highlighted = store.getState().highlighted || {};
  const current = new Set((highlighted.current || []).filter((id) => id.startsWith("panel:")).map((id) => id.replace("panel:", "")));
  const next = new Set((highlighted.next || []).filter((id) => id.startsWith("panel:")).map((id) => id.replace("panel:", "")));
  const changed = new Set((highlighted.changed || []).filter((id) => id.startsWith("panel:")).map((id) => id.replace("panel:", "")));
  const active = new Set([...current, ...next, ...changed]);
  dom.panels.forEach((panel) => {
    const id = panel.dataset.panelId;
    panel.classList.toggle("is-current", current.has(id));
    panel.classList.toggle("is-next", next.has(id));
    panel.classList.toggle("is-changed", changed.has(id));
    panel.classList.toggle("is-dimmed", active.size > 0 && !active.has(id));
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

