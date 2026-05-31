export function createInspectorPanel(container) {
  function render(node, gameState, language = "ko") {
    if (!node) {
      renderEmpty(language);
      return;
    }

    const copy = textFor(language);
    const portrait = node.kind === "object"
      ? `<div class="portrait-slot">portrait slot</div>`
      : `<div class="muted">${copy.noPortrait}</div>`;
    const details = node.kind === "object" ? objectDetails(node, gameState) : classDetails(node, gameState);

    container.innerHTML = `
      <div class="section-card">
        <h3>${node.label}</h3>
        <div class="muted">${node.kind}${node.readOnly ? " / read-only" : ""}</div>
      </div>
      <div class="section-card">
        <h3>${copy.preview}</h3>
        ${portrait}
      </div>
      <div class="section-card">
        <h3>${copy.details}</h3>
        <div class="kv-list">${details}</div>
      </div>
      <div class="section-card">
        <h3>${copy.graphState}</h3>
        <div class="kv-list">
          <div><span>mode</span><span>${node.display.mode}</span></div>
          <div><span>portrait</span><span>${String(node.display.portrait)}</span></div>
          <div><span>pinned</span><span>${String(node.display.pinned)}</span></div>
        </div>
      </div>
      <div id="polymorphism-card" class="section-card">
        <h3>Polymorphism</h3>
        <div class="muted">${copy.polymorphism}</div>
      </div>
    `;
  }

  function objectDetails(node, gameState) {
    const target = resolveObject(node.id, gameState);
    if (!target) return `<div><span>status</span><span>missing</span></div>`;
    return Object.entries(target)
      .filter(([, value]) => typeof value !== "object" || Array.isArray(value))
      .slice(0, 12)
      .map(([key, value]) => `<div><span>${key}</span><span>${formatValue(value)}</span></div>`)
      .join("");
  }

  function classDetails(node, gameState) {
    const instances = countInstances(node.label, gameState);
    const methods = fallbackMethods(node.label)
      .map((value) => `<div><span>method</span><span>${value}</span></div>`)
      .join("");
    return `
      <div><span>instances</span><span>${instances}</span></div>
      ${methods}
    `;
  }

  function renderPolymorphism(result) {
    const panel = container.querySelector("#polymorphism-card");
    if (!panel) return;
    panel.innerHTML = `
      <h3>Polymorphism</h3>
      <div class="muted">${result.className || ""} / ${result.method || ""}</div>
      <pre>${escapeHtml(result.output || "")}</pre>
    `;
  }

  function renderEmpty(language = "ko") {
    const copy = textFor(language);
    container.innerHTML = `
      <div class="section-card">
        <h3>Inspector</h3>
        <div class="muted">${copy.empty}</div>
      </div>
    `;
  }

  return { render, renderEmpty, renderPolymorphism };
}

function resolveObject(nodeId, gameState) {
  if (nodeId === "object:player") return gameState.player;
  if (nodeId.startsWith("object:friend:")) {
    const name = nodeId.replace("object:friend:", "");
    return (gameState.friends || []).find((friend) => friend.name === name);
  }
  if (nodeId.startsWith("object:professor:")) {
    const key = nodeId.replace("object:professor:", "");
    const [name, ...courseParts] = key.split(":");
    const courseName = courseParts.join(":");
    return (gameState.semesterProfessorPool || []).find((professor) => professor.name === name && professor.courseName === courseName);
  }
  return null;
}

function countInstances(className, gameState) {
  if (className === "Student") return gameState?.player ? 1 : 0;
  if (className === "Friend") return (gameState?.friends || []).length;
  if (className === "Professor") return (gameState?.semesterProfessorPool || []).length;
  if (className === "Event") return gameState?.activeEvent ? 1 : 0;
  if (className === "StatusEffect") return (gameState?.player?.statusEffects || []).length;
  return 0;
}

function fallbackMethods(className) {
  if (className === "Student") return ["showStatus()", "previewBehavior()", "changeStress()"];
  if (className === "Friend") return ["showStatus()", "previewBehavior()", "changeFavorability()"];
  if (className === "Professor") return ["showStatus()", "previewBehavior()", "changeExamDiff()"];
  if (className === "Event") return ["toDict()"];
  return [];
}

function formatValue(value) {
  if (Array.isArray(value)) return `${value.length} item`;
  return String(value);
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function textFor(language) {
  if (language === "en") {
    return {
      preview: "Preview",
      details: "Details",
      graphState: "Graph State",
      noPortrait: "No portrait",
      polymorphism: "Objects call showStatus(); classes call previewBehavior().",
      empty: "Select a class deck or object card.",
    };
  }
  return {
    preview: "미리보기",
    details: "상세 정보",
    graphState: "그래프 상태",
    noPortrait: "초상화 없음",
    polymorphism: "객체는 showStatus(), 클래스는 previewBehavior()를 호출합니다.",
    empty: "클래스 덱이나 객체 카드를 선택하세요.",
  };
}
