const LAYER_Y = {
  classTop: 150,
  classMid: 310,
  classLow: 450,
  object: 500,
  objectLow: 700,
  io: 880,
};

const CLASS_POSITIONS = {
  "class:PersonADT": { x: 600, y: 110 },
  "class:Person": { x: 600, y: 250 },
  "class:Student": { x: 120, y: 430 },
  "class:Friend": { x: 600, y: 430 },
  "class:Professor": { x: 1160, y: 430 },
  "class:Event": { x: 2170, y: 430 },
  "class:StatusEffect": { x: 2685, y: 430 },
  "class:GameState": { x: 2985, y: 430 },
  "class:Course": { x: 3285, y: 430 },
  "class:RuntimeService": { x: 3615, y: 430 },
};

const GROUP_SLOTS = {
  Student: { x: 90, width: 300, y: 640 },
  Friend: { x: 470, width: 560, y: 640 },
  Professor: { x: 1130, width: 820, y: 640 },
  Event: { x: 2050, width: 500, y: 640 },
  StatusEffect: { x: 2650, width: 260, y: 640 },
  GameState: { x: 2950, width: 260, y: 640 },
  Course: { x: 3250, width: 260, y: 640 },
  RuntimeService: { x: 3550, width: 800, y: 640 },
};

export function layoutGraph(nodes, edges, options = {}) {
  const nodeMap = new Map(nodes.map((node) => [node.id, { ...node }]));

  placeClassNodes(nodeMap);
  placeIoNodes(nodeMap);
  placeCollections(nodeMap);
  placeObjects(nodeMap);
  placeChildren(nodeMap);
  applyPinned(nodeMap, options.nodePositions || {});
  let laidOutNodes = [...nodeMap.values()];
  let groups = buildGroups(laidOutNodes);
  placeRuntimeUi(nodeMap, groups, edges);
  laidOutNodes = [...nodeMap.values()];
  groups = buildGroups(laidOutNodes);
  const laidOutEdges = edges.map((edge, index) => routeEdge(edge, nodeMap, index));
  return { nodes: laidOutNodes, edges: laidOutEdges, groups };
}

function placeIoNodes(nodeMap) {
  [...nodeMap.values()].filter((node) => node.kind === "runtimeUi").forEach((node) => {
    node.x = 900;
    node.y = LAYER_Y.io;
    node.layer = "runtime";
  });
  [...nodeMap.values()].filter((node) => node.kind === "io").forEach((node) => {
    node.x = 280;
    node.y = LAYER_Y.io;
    node.layer = "io";
  });
  [...nodeMap.values()].filter((node) => node.kind === "actions").forEach((node) => {
    node.x = 830;
    node.y = LAYER_Y.io + 8;
    node.layer = "io";
  });
  [...nodeMap.values()].filter((node) => node.kind === "choice").forEach((node) => {
    node.x = 1180;
    node.y = 520;
    node.layer = "choice";
  });
}

function placeClassNodes(nodeMap) {
  Object.entries(CLASS_POSITIONS).forEach(([id, pos]) => {
    const node = nodeMap.get(id);
    if (!node) return;
    node.x = pos.x;
    node.y = pos.y;
    node.layer = id.includes("PersonADT") || id.includes("Person") ? "classTop" : "classMid";
  });
}

function placeCollections(nodeMap) {
  [...nodeMap.values()].filter((node) => node.kind === "collection").forEach((node) => {
    const slot = GROUP_SLOTS[node.data.className] || { x: 1200, width: 260 };
    node.x = slot.x + Math.max(0, (slot.width - node.width) / 2);
    node.y = (slot.y || LAYER_Y.object) + 52;
    node.layer = "object";
  });
}

function placeObjects(nodeMap) {
  const grouped = {};
  [...nodeMap.values()].filter((node) => node.kind === "object" || node.kind === "event" || node.kind === "status").forEach((node) => {
    const key = node.kind === "event" ? "Event" : node.kind === "status" ? "StatusEffect" : node.data.className;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(node);
  });

  Object.entries(grouped).forEach(([key, items]) => {
    const slot = GROUP_SLOTS[key] || { x: 110, width: 320 };
    items.forEach((node, index) => {
      if (node.id === "object:initSettings") {
        node.x = 260;
        node.y = 721;
      } else if (key === "Student") {
        node.x = slot.x + 20;
        node.y = slot.y || LAYER_Y.object;
      } else if (key === "Friend" || key === "Professor") {
        const cols = key === "Professor" ? 3 : 2;
        const col = index % cols;
        const row = Math.floor(index / cols);
        node.x = slot.x + 18 + col * (node.width + 22);
        node.y = (slot.y || LAYER_Y.object) + 52 + row * (node.height + 24);
      } else if (key === "GameState") {
        node.x = slot.x + 12;
        node.y = (slot.y || LAYER_Y.object) + 52;
      } else {
        const cols = key === "RuntimeService" ? 3 : key === "Event" ? 2 : 1;
        const col = index % cols;
        const row = Math.floor(index / cols);
        node.x = slot.x + col * (node.width + 26);
        node.y = (slot.y || LAYER_Y.object) + row * (node.height + 28);
      }
      node.layer = "object";
    });
  });
}

function placeChildren(nodeMap) {
  const owners = new Map();
  [...nodeMap.values()].filter((node) => node.kind === "field" || node.kind === "method").forEach((node) => {
    if (!owners.has(node.data.ownerId)) owners.set(node.data.ownerId, []);
    owners.get(node.data.ownerId).push(node);
  });

  owners.forEach((nodes, ownerId) => {
    const owner = nodeMap.get(ownerId);
    if (!owner) return;
    const fields = nodes.filter((node) => node.kind === "field");
    const methods = nodes.filter((node) => node.kind === "method");
    const replayFields = fields.filter((node) => node.data.replayOnly);
    const regularFields = fields.filter((node) => !node.data.replayOnly);
    regularFields.forEach((node, index) => {
      node.x = owner.x - node.width - 96;
      node.y = owner.y + 8 + index * (node.height + 12);
      node.layer = "auxiliary";
    });
    const methodGap = 18;
    const methodWidth = methods[0]?.width || 0;
    const totalMethodWidth = methods.length * methodWidth + Math.max(0, methods.length - 1) * methodGap;
    methods.forEach((node, index) => {
      node.x = owner.x + owner.width / 2 - totalMethodWidth / 2 + index * (node.width + methodGap);
      node.y = owner.y + owner.height + 34;
      node.layer = "auxiliary";
    });
    replayFields.forEach((node, index) => {
      const method = node.data.methodNodeId ? nodeMap.get(node.data.methodNodeId) : methods[0];
      const anchor = method || owner;
      node.x = anchor.x + anchor.width / 2 - node.width / 2;
      node.y = anchor.y + anchor.height + 16 + index * (node.height + 12);
      node.layer = "auxiliary";
    });
  });
}

function applyPinned(nodeMap, nodePositions) {
  Object.entries(nodePositions).forEach(([id, pos]) => {
    const node = nodeMap.get(id);
    if (!node) return;
    node.x = pos.x;
    node.y = pos.y;
    node.pinned = true;
  });
}

function resolveCollisions(nodes) {
  const visible = nodes.filter((node) => node.visible !== false);
  for (let pass = 0; pass < 12; pass += 1) {
    let moved = false;
    for (let i = 0; i < visible.length; i += 1) {
      for (let j = i + 1; j < visible.length; j += 1) {
        const a = visible[i];
        const b = visible[j];
        if (!boxesOverlap(a, b)) continue;
        moved = true;
        if (a.layer === b.layer) {
          const push = overlapWidth(a, b) / 2 + spacingFor(a, b) / 2;
          if (!a.pinned) a.x -= push;
          if (!b.pinned) b.x += push;
        } else {
          const push = overlapHeight(a, b) / 2 + 24;
          if (!a.pinned) a.y -= push;
          if (!b.pinned) b.y += push;
        }
      }
    }
    if (!moved) break;
  }
}

function routeEdge(edge, nodeMap, index) {
  const from = nodeMap.get(edge.from);
  const to = nodeMap.get(edge.to);
  if (!from || !to) return { ...edge, pathPoints: [] };
  const ports = choosePorts(edge.kind, from, to);
  const start = pointForPort(from, ports.sourcePort);
  const end = pointForPort(to, ports.targetPort);
  const offset = edge.kind === "inheritance" || edge.kind === "instance"
    ? 0
    : ((index % 3) - 1) * 12;
  return {
    ...edge,
    sourcePort: ports.sourcePort,
    targetPort: ports.targetPort,
    pathPoints: orthogonal(start, end, ports, offset),
  };
}

function placeRuntimeUi(nodeMap, groups, edges) {
  const node = nodeMap.get("runtime:ui");
  if (!node || node.pinned) return;
  const initNode = nodeMap.get("object:initSettings");
  if (initNode) {
    node.x = 600;
    node.y = 650;
    initNode.x = 260;
    initNode.y = node.y + node.height / 2 - initNode.height / 2;
    return;
  }
  const graphBox = boundsOf([
    ...[...nodeMap.values()].filter((item) => item.id !== node.id && item.kind !== "field" && item.kind !== "method"),
    ...groups,
  ]);
  node.x = 360;
  node.y = Math.max(LAYER_Y.io, graphBox.maxY + 120);
}

function groupLinkPoints(group) {
  if (!group.parent) return [];
  const sx = group.parent.x;
  const sy = group.parent.y;
  const tx = Math.min(Math.max(sx, group.x + 16), group.x + group.width - 16);
  return [
    { x: sx, y: sy },
    { x: sx, y: group.y - 14 },
    { x: tx, y: group.y - 14 },
    { x: tx, y: group.y },
  ];
}

function padBox(item, pad) {
  return {
    x: item.x - pad,
    y: item.y - pad,
    width: item.width + pad * 2,
    height: item.height + pad * 2,
  };
}

function shiftClassBranch(nodeMap, className, dx) {
  if (dx <= 0) return;
  const classNode = nodeMap.get(`class:${className}`);
  if (classNode && !classNode.pinned) classNode.x += dx;
  [...nodeMap.values()].forEach((node) => {
    const nodeClass = node.kind === "event" ? "Event" : node.kind === "status" ? "StatusEffect" : node.data?.className;
    if (nodeClass === className && node.kind !== "class" && !node.pinned) node.x += dx;
  });
}

function shiftGroup(nodeMap, group, dx) {
  if (dx <= 0) return;
  (group.memberIds || []).forEach((id) => {
    const node = nodeMap.get(id);
    if (node && !node.pinned) node.x += dx;
  });
  const classNode = nodeMap.get(`class:${group.className}`);
  if (classNode && !classNode.pinned) classNode.x += dx;
}

function boundsOf(items) {
  if (!items.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return {
    minX: Math.min(...items.map((item) => item.x)),
    minY: Math.min(...items.map((item) => item.y)),
    maxX: Math.max(...items.map((item) => item.x + item.width)),
    maxY: Math.max(...items.map((item) => item.y + item.height)),
  };
}

function choosePorts(kind, from, to) {
  if (kind === "inheritance" || kind === "instance") return { sourcePort: "bottom", targetPort: "top" };
  if (kind === "field") return { sourcePort: "left", targetPort: "right" };
  if (kind === "method") return { sourcePort: "right", targetPort: "left" };
  return from.x <= to.x
    ? { sourcePort: "right", targetPort: "left" }
    : { sourcePort: "left", targetPort: "right" };
}

function pointForPort(node, port) {
  if (port === "top") return { x: node.x + node.width / 2, y: node.y };
  if (port === "bottom") return { x: node.x + node.width / 2, y: node.y + node.height };
  if (port === "left") return { x: node.x, y: node.y + node.height / 2 };
  return { x: node.x + node.width, y: node.y + node.height / 2 };
}

function orthogonal(start, end, ports, offset) {
  if (ports.sourcePort === "bottom" && ports.targetPort === "top") {
    if (Math.abs(start.x - end.x) < 24) return [start, end];
    const midY = (start.y + end.y) / 2 + offset;
    return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
  }
  const midX = (start.x + end.x) / 2 + offset;
  return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
}

function buildGroups(nodes) {
  return [
    buildGroup("group:student", "Student 객체", nodes, "Student"),
    buildGroup("group:friend", "Friend Group", nodes, "Friend"),
    buildGroup("group:professor", "Professor Group", nodes, "Professor"),
    buildGroup("group:event", "Event 객체", nodes, "Event"),
    buildGroup("group:status", "StatusEffect 객체", nodes, "StatusEffect"),
    buildGroup("group:course", "Course 객체", nodes, "Course"),
    buildGroup("group:gamestate", "GameState 객체", nodes, "GameState"),
    buildGroup("group:runtimeservice", "RuntimeService 객체", nodes, "RuntimeService"),
  ].filter(Boolean);
}

function buildGroup(id, label, nodes, className) {
  const related = nodes.filter((node) => {
    const cls = node.kind === "status" ? "StatusEffect" : node.kind === "event" ? "Event" : node.data.className;
    return (node.kind === "object" || node.kind === "collection" || node.kind === "event" || node.kind === "status") && cls === className;
  });
  if (!related.length) return null;
  const clsNode = nodes.find((node) => node.id === `class:${className}`);
  const minX = Math.min(...related.map((node) => node.x)) - 28;
  const minY = Math.min(...related.map((node) => node.y)) - 26;
  const maxX = Math.max(...related.map((node) => node.x + node.width)) + 28;
  const maxY = Math.max(...related.map((node) => node.y + node.height)) + 26;
  return {
    id, label, className,
    x: minX, y: minY, width: maxX - minX, height: maxY - minY,
    count: related.length,
    memberIds: related.map((node) => node.id),
    parent: clsNode ? { x: clsNode.x + clsNode.width / 2, y: clsNode.y + clsNode.height } : null,
  };
}

function pointInsideBox(point, box) {
  return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
}

function pathIntersectsBox(points, box) {
  if (points.some((point) => pointInsideBox(point, box))) return true;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    if (a.x === b.x && a.x >= box.x && a.x <= box.x + box.width) {
      if (Math.max(a.y, b.y) >= box.y && Math.min(a.y, b.y) <= box.y + box.height) return true;
    }
    if (a.y === b.y && a.y >= box.y && a.y <= box.y + box.height) {
      if (Math.max(a.x, b.x) >= box.x && Math.min(a.x, b.x) <= box.x + box.width) return true;
    }
  }
  return false;
}

function boxesOverlap(a, b) {
  const gap = spacingFor(a, b);
  return boxesOverlapWithGap(a, b, gap);
}

function boxesOverlapWithGap(a, b, gap) {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + 20 <= b.y ||
    b.y + b.height + 20 <= a.y
  );
}

function overlapWidth(a, b) {
  return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
}

function overlapHeight(a, b) {
  return Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
}

function spacingFor(a, b) {
  if (a.kind === "class" || b.kind === "class") return 60;
  if (a.kind === "field" || a.kind === "method" || b.kind === "field" || b.kind === "method") return 12;
  return 40;
}
