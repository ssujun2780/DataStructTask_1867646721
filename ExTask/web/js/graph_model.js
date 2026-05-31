export function createNode({ id, kind, label, x, y, width, height, data, display, readOnly = false, parentClassId = null, groupId = null }) {
  return {
    id,
    kind,
    label,
    x,
    y,
    width,
    height,
    data: data || {},
    display: display || defaultDisplay(kind),
    readOnly,
    parentClassId,
    groupId,
  };
}

export function createEdge({ id, from, to, kind, label = "", visible = true }) {
  return { id, from, to, kind, label, visible };
}

export function defaultDisplay(kind) {
  return {
    mode: kind === "class" ? "compact" : "compact",
    portrait: kind === "object",
    fields: "hidden",
    methods: "hidden",
    references: "hidden",
    pinned: kind === "class",
  };
}
