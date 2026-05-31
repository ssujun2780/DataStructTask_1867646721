const SVG_NS = "http://www.w3.org/2000/svg";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

export function createGraphRenderer({ svg, viewport }) {
  const edgesLayer = svg.querySelector("#graph-edges");
  const runtimeLayer = svg.querySelector("#graph-runtime-edges");
  const nodesLayer = svg.querySelector("#graph-nodes");
  const overlaysLayer = svg.querySelector("#graph-overlays");
  ensureRuntimeMarkers();

  let currentModel = { nodes: [], edges: [], groups: [], runtimeEdges: [] };
  let currentTransform = { x: 0, y: 0, scale: 1 };

  function render(model) {
    currentModel = model;
    edgesLayer.innerHTML = "";
    runtimeLayer.innerHTML = "";
    nodesLayer.innerHTML = "";
    overlaysLayer.innerHTML = "";

    (model.groups || []).forEach((group) => overlaysLayer.appendChild(renderGroup(group)));
    model.edges.filter((edge) => edge.visible !== false).forEach((edge) => edgesLayer.appendChild(renderEdge(edge)));
    (model.runtimeEdges || []).forEach((edge) => runtimeLayer.appendChild(renderRuntimeEdge(model, edge)));
    model.nodes.forEach((node) => nodesLayer.appendChild(renderNode(node)));
    applyTransform();
  }

  function renderGroup(group) {
    const g = document.createElementNS(SVG_NS, "g");
    g.dataset.nodeId = group.id;
    g.setAttribute("transform", `translate(${group.x}, ${group.y})`);
    if (group.parent) {
      const link = document.createElementNS(SVG_NS, "path");
      const sx = group.parent.x - group.x;
      const sy = group.parent.y - group.y;
      const tx = Math.min(Math.max(sx, 18), group.width - 18);
      link.setAttribute("d", `M ${sx} ${sy} L ${tx} 0`);
      link.setAttribute("class", "edge edge--instance");
      link.setAttribute("vector-effect", "non-scaling-stroke");
      g.appendChild(link);
    }
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", group.width);
    rect.setAttribute("height", group.height);
    rect.setAttribute("rx", "14");
    rect.setAttribute("fill", "rgba(43,52,72,0.18)");
    rect.setAttribute("stroke", "rgba(148,163,184,0.26)");
    rect.setAttribute("stroke-dasharray", "7 5");
    rect.setAttribute("stroke-width", "1.5");
    g.appendChild(rect);
    const header = document.createElementNS(SVG_NS, "rect");
    header.setAttribute("width", Math.min(group.width, 210));
    header.setAttribute("height", "28");
    header.setAttribute("rx", "10");
    header.setAttribute("fill", "rgba(49,46,129,0.72)");
    header.setAttribute("stroke", "rgba(226,232,240,0.12)");
    g.appendChild(header);
    g.appendChild(makeText(12, 19, `${group.label} / ${group.count || 0}\uac1c`, "node-badge"));
    return g;
  }

  function renderEdge(edge) {
    const g = document.createElementNS(SVG_NS, "g");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", pointsToPath(edge.pathPoints || []));
    path.setAttribute("class", `edge edge--${edge.kind}`);
    g.appendChild(path);
    if (edge.kind === "instance" && edge.label) {
      const midpoint = pathMidpoint(edge.pathPoints || []);
      if (midpoint) g.appendChild(makeText(midpoint.x + 6, midpoint.y - 6, edge.label, "edge-label"));
    }
    return g;
  }

  function renderRuntimeEdge(model, edge) {
    const path = document.createElementNS(SVG_NS, "path");
    const endpoints = resolveRuntimeEndpoints(model, edge);
    if (!endpoints) return path;
    path.setAttribute("d", buildRuntimePath(endpoints.from, endpoints.to));
    path.setAttribute("class", runtimeClassFor(edge.kind));
    path.setAttribute("marker-end", `url(#${runtimeMarkerId(edge.kind)})`);
    path.setAttribute("vector-effect", "non-scaling-stroke");
    return path;
  }

  function resolveRuntimeEndpoints(model, edge) {
    const fromBox = resolveRuntimeBox(model, edge.from);
    const toBox = resolveRuntimeBox(model, edge.to);
    if (!fromBox || !toBox) return null;
    const fromCenter = boxCenter(fromBox);
    const toCenter = boxCenter(toBox);
    return {
      from: pointOnBoxEdge(fromBox, toCenter),
      to: pointOnBoxEdge(toBox, fromCenter),
    };
  }

  function resolveRuntimeBox(model, refId) {
    if (!refId) return null;
    if (refId.startsWith("panel:")) {
      const panelId = refId.replace("panel:", "");
      const panel = document.getElementById(panelId);
      if (!panel) return null;
      const viewportRect = viewport.getBoundingClientRect();
      const rect = panel.getBoundingClientRect();
      return {
        x: (rect.left - viewportRect.left - currentTransform.x) / currentTransform.scale,
        y: (rect.top - viewportRect.top - currentTransform.y) / currentTransform.scale,
        width: rect.width / currentTransform.scale,
        height: rect.height / currentTransform.scale,
      };
    }
    const node = model.nodes.find((item) => item.id === refId);
    if (!node) return null;
    return { x: node.x, y: node.y, width: node.width, height: node.height };
  }

  function boxCenter(box) {
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  function pointOnBoxEdge(box, toward) {
    const center = boxCenter(box);
    const dx = toward.x - center.x;
    const dy = toward.y - center.y;
    if (Math.abs(dx) * box.height > Math.abs(dy) * box.width) {
      return {
        x: dx >= 0 ? box.x + box.width : box.x,
        y: center.y + (dy / Math.max(Math.abs(dx), 1)) * (box.width / 2),
      };
    }
    return {
      x: center.x + (dx / Math.max(Math.abs(dy), 1)) * (box.height / 2),
      y: dy >= 0 ? box.y + box.height : box.y,
    };
  }

  function buildRuntimePath(from, to) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  function runtimeClassFor(kind) {
    if (kind === "next") return "edge edge--runtimeNext";
    if (kind === "read") return "edge edge--runtimeRead";
    if (kind === "write") return "edge edge--runtimeWrite";
    return "edge edge--runtimeCurrent";
  }

  function runtimeMarkerId(kind) {
    if (kind === "next") return "runtime-arrow-next";
    if (kind === "read") return "runtime-arrow-read";
    if (kind === "write") return "runtime-arrow-write";
    return "runtime-arrow-current";
  }

  function ensureRuntimeMarkers() {
    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS(SVG_NS, "defs");
      svg.insertBefore(defs, svg.firstChild);
    }
    [
      ["runtime-arrow-current", "#f59e0b"],
      ["runtime-arrow-next", "#38bdf8"],
      ["runtime-arrow-read", "#fde047"],
      ["runtime-arrow-write", "#fb7185"],
    ].forEach(([id, color]) => {
      if (defs.querySelector(`#${id}`)) return;
      const marker = document.createElementNS(SVG_NS, "marker");
      marker.setAttribute("id", id);
      marker.setAttribute("markerWidth", "6");
      marker.setAttribute("markerHeight", "6");
      marker.setAttribute("refX", "5.2");
      marker.setAttribute("refY", "3");
      marker.setAttribute("orient", "auto");
      marker.setAttribute("markerUnits", "strokeWidth");
      const arrow = document.createElementNS(SVG_NS, "path");
      arrow.setAttribute("d", "M 0 0 L 6 3 L 0 6 z");
      arrow.setAttribute("fill", color);
      marker.appendChild(arrow);
      defs.appendChild(marker);
    });
  }

  function renderNode(node) {
    const group = document.createElementNS(SVG_NS, "g");
    group.dataset.nodeId = node.id;
    group.setAttribute("transform", `translate(${node.x}, ${node.y})`);
    if (node.highlight) group.classList.add(`node-${node.highlight}`);
    if (node.display?.pinned) group.classList.add("node-pinned");

    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", node.width);
    rect.setAttribute("height", node.height);
    rect.setAttribute("rx", node.kind === "field" || node.kind === "method" ? "10" : "14");
    rect.setAttribute("fill", fillForNode(node));
    rect.setAttribute("stroke", node.selected ? "#f59e0b" : "rgba(226,232,240,0.18)");
    rect.setAttribute("stroke-width", node.selected ? "3" : "1.5");
    group.appendChild(rect);

    group.appendChild(makeText(14, 22, node.label, "node-title"));
    const subtitle = subtitleForNode(node);
    if (subtitle) group.appendChild(makeText(14, 40, subtitle, "node-subtitle"));

    if (node.kind === "class") renderClassBody(group, node);
    if (node.kind === "object") renderObjectBody(group, node);
    if (node.kind === "event") renderEventBody(group, node);
    if (node.kind === "collection") renderCollectionBody(group, node);
    if (node.kind === "field") renderFieldBody(group, node);
    if (node.kind === "method") renderMethodBody(group, node);
    if (node.kind === "status") renderStatusBody(group, node);
    if (node.kind === "io") renderIoBody(group, node);
    if (node.kind === "actions") renderActionsBody(group, node);
    if (node.kind === "choice") renderChoiceBody(group, node);
    if (node.kind === "runtimeUi") renderRuntimeUiBody(group, node);

    return group;
  }

  function renderClassBody(group, node) {
    group.appendChild(makeText(14, 66, `${node.data.typeLabel || "Class"} / ${node.data.instanceCount || 0} instance`, "node-metric"));
    group.appendChild(makeText(14, 88, "Deck", "node-badge"));
    const count = makeText(node.width - 16, 22, `${node.data.instanceCount || 0}\uac1c`, "node-badge");
    count.setAttribute("text-anchor", "end");
    group.appendChild(count);
  }

  function renderObjectBody(group, node) {
    const portraitHeight = node.display.portrait === false ? 0 : node.display.mode === "expanded" ? 82 : 58;
    if (portraitHeight > 0) {
      const portrait = document.createElementNS(SVG_NS, "rect");
      portrait.setAttribute("x", "12");
      portrait.setAttribute("y", "50");
      portrait.setAttribute("width", node.width - 24);
      portrait.setAttribute("height", portraitHeight);
      portrait.setAttribute("rx", "8");
      portrait.setAttribute("fill", "rgba(255,255,255,0.05)");
      portrait.setAttribute("stroke", "rgba(255,255,255,0.15)");
      portrait.setAttribute("stroke-dasharray", "5 4");
      group.appendChild(portrait);
      group.appendChild(makeText(18, 84, "portrait", "node-badge"));
    }

    const fields = node.data.summaryFields || [];
    const baseY = portraitHeight > 0 ? 128 + Math.max(0, portraitHeight - 58) : 64;
    fields.slice(0, node.display.mode === "expanded" ? 5 : 3).forEach((field, index) => {
      group.appendChild(makeText(14, baseY + index * 18, field, "node-metric"));
    });

    if (node.readOnly) group.appendChild(makeText(node.width - 72, 22, "READ ONLY", "node-badge"));
  }

  function renderCollectionBody(group, node) {
    group.appendChild(makeText(14, 68, `${node.data.count} item`, "node-metric"));
    group.appendChild(makeText(14, 90, "right click / click to expand", "node-badge"));
  }

  function renderEventBody(group, node) {
    group.appendChild(makeText(14, 68, truncate(node.data.content || "", 72), "node-metric"));
    group.appendChild(makeText(14, 96, `${(node.data.selections || []).length} selection`, "node-badge"));
  }

  function renderFieldBody(group, node) {
    group.appendChild(makeText(14, 38, "field", "node-badge"));
    group.appendChild(makeText(14, 72, truncate(String(node.data.value), 26), "node-metric"));
  }

  function renderMethodBody(group, node) {
    group.appendChild(makeText(14, 38, "method", "node-badge"));
    group.appendChild(makeText(14, 72, "callable", "node-note"));
  }

  function renderStatusBody(group, node) {
    group.appendChild(makeText(14, 40, "status", "node-badge"));
    group.appendChild(makeText(14, 66, `duration ${node.data.duration}`, "node-metric"));
  }

  function renderIoBody(group, node) {
    const terminal = document.createElementNS(SVG_NS, "rect");
    terminal.setAttribute("x", "14");
    terminal.setAttribute("y", "50");
    terminal.setAttribute("width", node.width - 28);
    terminal.setAttribute("height", node.height - 64);
    terminal.setAttribute("rx", "8");
    terminal.setAttribute("fill", "rgba(15,23,42,0.42)");
    terminal.setAttribute("stroke", "rgba(226,232,240,0.16)");
    group.appendChild(terminal);

    group.appendChild(makeText(24, 74, truncate(node.data.input || "", 52), "node-metric"));
    (node.data.lines || []).slice(0, 6).forEach((line, index) => {
      group.appendChild(makeText(24, 100 + index * 16, truncate(line, 64), "node-note"));
    });
  }

  function renderActionsBody(group, node) {
    (node.data.actions || []).forEach((action, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 16 + col * 166;
      const y = 54 + row * 42;
      const button = document.createElementNS(SVG_NS, "rect");
      button.dataset.runtimeAction = action.id;
      button.setAttribute("x", x);
      button.setAttribute("y", y);
      button.setAttribute("width", "150");
      button.setAttribute("height", "32");
      button.setAttribute("rx", "7");
      button.setAttribute("fill", "rgba(15,23,42,0.54)");
      button.setAttribute("stroke", "rgba(226,232,240,0.24)");
      button.setAttribute("class", "runtime-action-button");
      group.appendChild(button);

      const label = makeText(x + 75, y + 21, action.label, "node-metric");
      label.dataset.runtimeAction = action.id;
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("class", "node-metric runtime-action-label");
      group.appendChild(label);
    });
  }

  function renderChoiceBody(group, node) {
    group.appendChild(makeText(16, 58, truncate(node.data.courseName || "", 28), "node-metric"));
    group.appendChild(makeText(16, 82, truncate(node.data.prompt || "", 34), "node-note"));
    (node.data.candidates || []).forEach((candidate, index) => {
      const y = 102 + index * 58;
      const card = document.createElementNS(SVG_NS, "rect");
      card.dataset.runtimeChoiceIndex = String(candidate.index);
      card.dataset.runtimeChoiceCourse = node.data.courseName || "";
      card.setAttribute("x", "16");
      card.setAttribute("y", y);
      card.setAttribute("width", node.width - 32);
      card.setAttribute("height", "48");
      card.setAttribute("rx", "8");
      card.setAttribute("fill", "rgba(255,255,255,0.06)");
      card.setAttribute("stroke", "rgba(226,232,240,0.18)");
      card.setAttribute("class", "runtime-choice-card");
      group.appendChild(card);

      const name = makeText(node.width / 2, y + 18, candidate.name || "", "node-metric");
      name.dataset.runtimeChoiceIndex = String(candidate.index);
      name.dataset.runtimeChoiceCourse = node.data.courseName || "";
      name.setAttribute("text-anchor", "middle");
      name.setAttribute("class", "node-metric runtime-choice-label");
      group.appendChild(name);

      const detail = makeText(node.width / 2, y + 36, `favor ${candidate.favorability} / exam ${candidate.examDifficulty}`, "node-note");
      detail.dataset.runtimeChoiceIndex = String(candidate.index);
      detail.dataset.runtimeChoiceCourse = node.data.courseName || "";
      detail.setAttribute("text-anchor", "middle");
      detail.setAttribute("class", "node-note runtime-choice-label");
      group.appendChild(detail);
    });
  }

  function renderRuntimeUiBody(group, node) {
    const hasChoice = Boolean(node.data.choice);
    const hasInit = Boolean(node.data.initDraft);
    const hasScreen = Boolean(node.data.screen) && !hasInit && !hasChoice;
    const outputWidth = hasChoice ? 300 : node.width - 28;
    const terminalHeight = hasChoice ? 188 : hasScreen ? 206 : 116;
    const terminal = document.createElementNS(SVG_NS, "rect");
    terminal.setAttribute("x", "14");
    terminal.setAttribute("y", "52");
    terminal.setAttribute("width", outputWidth);
    terminal.setAttribute("height", terminalHeight);
    terminal.setAttribute("rx", "8");
    terminal.setAttribute("fill", "rgba(15,23,42,0.42)");
    terminal.setAttribute("stroke", "rgba(226,232,240,0.16)");
    group.appendChild(terminal);

    if (hasScreen) {
      renderRuntimeGameScreen(group, node);
    } else {
      group.appendChild(makeText(24, 76, truncate(node.data.input || "", 34), "node-metric"));
      (node.data.lines || []).slice(0, hasChoice ? 8 : 5).forEach((line, index) => {
        group.appendChild(makeText(24, 102 + index * 16, truncate(line, 36), "node-note"));
      });
    }

    if (hasInit) {
      renderRuntimeInitControls(group, node);
      return;
    }

    const actionX = hasChoice ? 334 : 20;
    const actionY = hasChoice ? 52 : hasScreen ? 276 : 184;
    (node.data.actions || []).forEach((action, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = actionX + col * 138;
      const y = actionY + row * 38;
      const button = document.createElementNS(SVG_NS, "rect");
      button.dataset.runtimeAction = action.id;
      button.setAttribute("x", x);
      button.setAttribute("y", y);
      button.setAttribute("width", "124");
      button.setAttribute("height", "30");
      button.setAttribute("rx", "7");
      button.setAttribute("fill", "rgba(15,23,42,0.54)");
      button.setAttribute("stroke", "rgba(226,232,240,0.24)");
      button.setAttribute("class", "runtime-action-button");
      group.appendChild(button);

      const label = makeText(x + 62, y + 20, action.label, "node-metric");
      label.dataset.runtimeAction = action.id;
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("class", "node-metric runtime-action-label");
      group.appendChild(label);
    });

    if (!node.data.choice) return;
    group.appendChild(makeText(334, 144, truncate(node.data.choice.courseName || "", 24), "node-metric"));
    (node.data.choice.candidates || []).forEach((candidate, index) => {
      const y = 160 + index * 38;
      const card = document.createElementNS(SVG_NS, "rect");
      card.dataset.runtimeChoiceIndex = String(candidate.index);
      card.dataset.runtimeChoiceCourse = node.data.choice.courseName || "";
      card.setAttribute("x", "334");
      card.setAttribute("y", y);
      card.setAttribute("width", "282");
      card.setAttribute("height", "30");
      card.setAttribute("rx", "7");
      card.setAttribute("fill", "rgba(255,255,255,0.06)");
      card.setAttribute("stroke", "rgba(226,232,240,0.18)");
      card.setAttribute("class", "runtime-choice-card");
      group.appendChild(card);

      const text = makeText(475, y + 20, truncate(`${candidate.name} / favor ${candidate.favorability} / exam ${candidate.examDifficulty}`, 34), "node-note");
      text.dataset.runtimeChoiceIndex = String(candidate.index);
      text.dataset.runtimeChoiceCourse = node.data.choice.courseName || "";
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("class", "node-note runtime-choice-label");
      group.appendChild(text);
    });
  }

  function renderRuntimeGameScreen(group, node) {
    const screen = node.data.screen || {};
    group.appendChild(makeText(24, 76, truncate(screen.header || node.data.input || "", 48), "node-metric"));

    (screen.stats || []).slice(0, 4).forEach((stat, index) => {
      const x = 24 + index * 116;
      const card = document.createElementNS(SVG_NS, "rect");
      card.setAttribute("x", x);
      card.setAttribute("y", "88");
      card.setAttribute("width", "104");
      card.setAttribute("height", "42");
      card.setAttribute("rx", "7");
      card.setAttribute("fill", "rgba(255,255,255,0.08)");
      card.setAttribute("stroke", "rgba(226,232,240,0.18)");
      group.appendChild(card);
      group.appendChild(makeText(x + 10, 106, truncate(stat.label, 10), "node-note"));
      group.appendChild(makeText(x + 10, 124, truncate(stat.value, 13), "node-metric"));
    });

    const resultLines = (screen.resultLines || []).slice(-2);
    const changes = (screen.changes || []).slice(-3);
    const events = (screen.events || []).slice(-1);
    const leftX = 24;
    const rightX = 360;

    group.appendChild(makeText(leftX, 154, "게임 화면", "node-metric"));
    const screenLines = [
      ...(resultLines.length ? resultLines : ["행동을 선택하세요."]),
      ...(screen.warnings || []).slice(0, 1),
    ];
    screenLines.slice(0, 3).forEach((line, index) => {
      group.appendChild(makeText(leftX, 176 + index * 18, truncate(line, 43), "node-note"));
    });

    group.appendChild(makeText(rightX, 154, "변화", "node-metric"));
    if (!changes.length) {
      group.appendChild(makeText(rightX, 176, "아직 변화 없음", "node-note"));
    }
    changes.forEach((change, index) => {
      const delta = change.delta === null || change.delta === undefined ? "" : ` (${change.delta > 0 ? "+" : ""}${change.delta})`;
      const text = `${change.objectType}.${change.fieldName}: ${change.before} -> ${change.after}${delta}`;
      group.appendChild(makeText(rightX, 176 + index * 18, truncate(text, 41), "node-note node-note--changed"));
    });

    if (events.length) {
      const event = events[0];
      const label = `${event.type || "event"} ${event.name || event.eventCheck || ""}`.trim();
      group.appendChild(makeText(leftX, 238, `이벤트: ${truncate(label, 42)}`, "node-metric node-note--event"));
    } else if ((screen.predictedScores || []).length) {
      const score = screen.predictedScores[0];
      group.appendChild(makeText(leftX, 238, `예상 성적: ${truncate(`${score.courseName} ${score.score}`, 42)}`, "node-note"));
    }
  }

  function renderRuntimeInitControls(group, node) {
    const draft = node.data.initDraft;
    const labels = { difficulty: "난이도", name: "이름", maxHealth: "최대 체력", intelligence: "지능" };
    group.appendChild(makeText(334, 76, labels[draft.step] || "초기 설정", "node-metric"));
    if (draft.step === "difficulty") {
      ["easy", "normal", "hard"].forEach((item, index) => {
        const x = 334 + index * 90;
        const button = document.createElementNS(SVG_NS, "rect");
        button.dataset.initDifficulty = item;
        button.setAttribute("x", x);
        button.setAttribute("y", "94");
        button.setAttribute("width", "78");
        button.setAttribute("height", "34");
        button.setAttribute("rx", "7");
        button.setAttribute("fill", draft.difficulty === item ? "#f59e0b" : "rgba(15,23,42,0.54)");
        button.setAttribute("stroke", "rgba(226,232,240,0.24)");
        button.setAttribute("class", "runtime-init-button");
        group.appendChild(button);

        const text = makeText(x + 39, 116, item, "node-metric");
        text.dataset.initDifficulty = item;
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "node-metric runtime-init-label");
        group.appendChild(text);
      });
    } else {
      const input = document.createElementNS(SVG_NS, "foreignObject");
      input.setAttribute("x", "334");
      input.setAttribute("y", "94");
      input.setAttribute("width", "260");
      input.setAttribute("height", "40");
      const value = escapeHtml(String(draft[draft.step] || ""));
      const inputMode = draft.step === "name" ? "text" : "numeric";
      input.innerHTML = `<input xmlns="http://www.w3.org/1999/xhtml" class="runtime-svg-input" data-init-input inputmode="${inputMode}" value="${value}">`;
      group.appendChild(input);
    }
    const next = document.createElementNS(SVG_NS, "rect");
    next.dataset.initNext = "true";
    next.setAttribute("x", "334");
    next.setAttribute("y", "150");
    next.setAttribute("width", "260");
    next.setAttribute("height", "34");
    next.setAttribute("rx", "7");
    const canAdvance = canAdvanceInitDraft(draft);
    next.setAttribute("fill", canAdvance ? "rgba(15,23,42,0.54)" : "rgba(15,23,42,0.2)");
    next.setAttribute("stroke", "rgba(226,232,240,0.24)");
    next.setAttribute("class", `runtime-init-button${canAdvance ? "" : " is-disabled"}`);
    group.appendChild(next);
    const label = makeText(464, 172, "다음", "node-metric");
    label.dataset.initNext = "true";
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("class", "node-metric runtime-init-label");
    group.appendChild(label);
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

  function pointsToPath(points) {
    if (!points.length) return "";
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  }

  function pathMidpoint(points) {
    if (!points.length) return null;
    return points[Math.floor(points.length / 2)];
  }

  function makeText(x, y, value, className) {
    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("class", className);
    text.textContent = value;
    return text;
  }

  function fillForNode(node) {
    if (node.kind === "class") return "var(--node-class)";
    if (node.kind === "event") return "var(--node-event)";
    if (node.kind === "status") return "var(--node-status)";
    if (node.kind === "io") return "var(--node-object)";
    if (node.kind === "actions") return "var(--node-object)";
    if (node.kind === "choice") return "var(--node-class)";
    if (node.kind === "runtimeUi") return "var(--node-object)";
    if (node.kind === "field") return "var(--node-field)";
    if (node.kind === "method") return "var(--node-method)";
    if (node.kind === "collection") return "var(--panel-2)";
    if (node.kind === "object" && node.readOnly) return "var(--node-readonly)";
    return "var(--node-object)";
  }

  function subtitleForNode(node) {
    if (node.kind === "class") return "Class Deck";
    if (node.kind === "event") return "Event";
    if (node.kind === "collection") return node.data.className || "Collection";
    if (node.kind === "object") return node.data.className || "Object";
    if (node.kind === "io") return "Runtime Node";
    if (node.kind === "actions") return "Runtime Node";
    if (node.kind === "choice") return "Runtime Node";
    if (node.kind === "runtimeUi") return "Input / Output";
    return "";
  }

  function truncate(value, limit) {
    if (value.length <= limit) return value;
    return `${value.slice(0, limit - 1)}...`;
  }

  function fitView() {
    const boundsItems = [...currentModel.nodes, ...(currentModel.groups || [])];
    if (!boundsItems.length) return;
    const minX = Math.min(...boundsItems.map((item) => item.x));
    const minY = Math.min(...boundsItems.map((item) => item.y));
    const maxX = Math.max(...boundsItems.map((item) => item.x + item.width)) + 60;
    const maxY = Math.max(...boundsItems.map((item) => item.y + item.height)) + 60;
    const topPadding = viewport.clientHeight > 520 ? 184 : 126;
    const bottomPadding = viewport.clientHeight > 520 ? 76 : 64;
    const sidePadding = 28;
    const availableWidth = Math.max(280, viewport.clientWidth - sidePadding * 2);
    const availableHeight = Math.max(220, viewport.clientHeight - topPadding - bottomPadding);
    const scale = Math.min(
      availableWidth / (maxX - minX + 30),
      availableHeight / (maxY - minY + 30),
      1
    );
    currentTransform = { x: sidePadding - minX * scale, y: topPadding - minY * scale, scale: Math.max(scale, 0.28) };
    applyTransform();
  }

  function resetView() {
    currentTransform = { x: 0, y: 0, scale: 1 };
    applyTransform();
  }

  function focusNode(nodeId) {
    const node = currentModel.nodes.find((item) => item.id === nodeId);
    if (!node) return;
    const topReserved = viewport.clientHeight > 520 ? 260 : 180;
    const centerY = topReserved + (viewport.clientHeight - topReserved) / 2;
    currentTransform = {
      x: viewport.clientWidth / 2 - (node.x + node.width / 2) * currentTransform.scale,
      y: centerY - (node.y + node.height / 2) * currentTransform.scale,
      scale: currentTransform.scale,
    };
    applyTransform();
  }

  function setTransform(nextTransform) {
    currentTransform = nextTransform;
    applyTransform();
  }

  function applyTransform() {
    const value = `translate(${currentTransform.x} ${currentTransform.y}) scale(${currentTransform.scale})`;
    [edgesLayer, runtimeLayer, nodesLayer, overlaysLayer].forEach((layer) => layer.setAttribute("transform", value));
  }

  function getTransform() {
    return currentTransform;
  }

  function highlightNode(nodeId) {
    nodesLayer.querySelectorAll("g[data-node-id]").forEach((group) => {
      const rect = group.querySelector("rect");
      if (!rect) return;
      const active = group.dataset.nodeId === nodeId;
      rect.setAttribute("stroke", active ? "#f59e0b" : "rgba(226,232,240,0.18)");
      rect.setAttribute("stroke-width", active ? "3" : "1.5");
      group.classList.toggle("runtime-flash", active);
    });
  }

  function setRuntimeFocus(focus = { current: [], next: [], changed: [] }) {
    const active = new Set([...(focus.current || []), ...(focus.next || []), ...(focus.changed || [])]);
    nodesLayer.querySelectorAll("g[data-node-id]").forEach((group) => {
      group.classList.toggle("node-dimmed", active.size > 0 && !active.has(group.dataset.nodeId));
    });
    edgesLayer.querySelectorAll(".edge").forEach((edge) => {
      edge.classList.toggle("edge-dimmed", active.size > 0);
    });
  }

  return {
    render,
    fitView,
    resetView,
    focusNode,
    highlightNode,
    setTransform,
    getTransform,
    svg,
    viewport,
    setRuntimeFocus,
  };
}


