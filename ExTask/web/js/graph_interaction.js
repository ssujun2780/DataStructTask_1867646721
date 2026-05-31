export function createGraphInteraction(renderer, contextMenu) {
  let handlers = {};
  let doubleClickHandler = null;
  let activatedHandler = null;
  let backgroundHandler = null;
  let draggingCanvas = false;
  let draggingNode = null;
  let dragStart = null;
  let baseTransform = null;
  let baseNode = null;

  const svg = renderer.svg;
  const viewport = renderer.viewport;

  function isPanelEvent(event) {
    return Boolean(event.target.closest(".runtime-panel, .node-detail-panel, .context-menu"));
  }

  viewport.addEventListener("mousedown", (event) => {
    if (isPanelEvent(event)) return;
    if (event.target.closest("[data-runtime-action], [data-runtime-choice-index], [data-init-difficulty], [data-init-next], [data-init-input]")) return;
    const group = event.target.closest("g[data-node-id]");
    if (group) {
      draggingNode = group.dataset.nodeId;
      dragStart = { x: event.clientX, y: event.clientY };
      baseNode = handlers.getNodePosition?.(draggingNode);
      return;
    }
    draggingCanvas = true;
    dragStart = { x: event.clientX, y: event.clientY };
    baseTransform = renderer.getTransform();
  });

  window.addEventListener("mousemove", (event) => {
    if (draggingNode) {
      const scale = renderer.getTransform().scale;
      const dx = (event.clientX - dragStart.x) / scale;
      const dy = (event.clientY - dragStart.y) / scale;
      handlers.onDragNode?.(draggingNode, { x: baseNode.x + dx, y: baseNode.y + dy });
      return;
    }
    if (!draggingCanvas) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    renderer.setTransform({ ...baseTransform, x: baseTransform.x + dx, y: baseTransform.y + dy });
  });

  window.addEventListener("mouseup", () => {
    draggingCanvas = false;
    draggingNode = null;
  });

  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    const transform = renderer.getTransform();
    const delta = event.deltaY < 0 ? 1.08 : 0.92;
    renderer.setTransform({ ...transform, scale: Math.max(0.35, Math.min(1.8, transform.scale * delta)) });
  });

  viewport.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-runtime-action]");
    if (actionTarget) {
      event.stopPropagation();
      handlers.onRuntimeAction?.(actionTarget.dataset.runtimeAction, actionTarget);
      contextMenu.close();
      return;
    }
    const choiceTarget = event.target.closest("[data-runtime-choice-index]");
    if (choiceTarget) {
      event.stopPropagation();
      handlers.onRuntimeChoice?.(
        choiceTarget.dataset.runtimeChoiceCourse,
        Number(choiceTarget.dataset.runtimeChoiceIndex),
        choiceTarget
      );
      contextMenu.close();
      return;
    }
    const initDifficulty = event.target.closest("[data-init-difficulty]");
    if (initDifficulty) {
      event.stopPropagation();
      handlers.onInitDifficulty?.(initDifficulty.dataset.initDifficulty);
      contextMenu.close();
      return;
    }
    const initNext = event.target.closest("[data-init-next]");
    if (initNext) {
      event.stopPropagation();
      handlers.onInitNext?.();
      contextMenu.close();
      return;
    }
    if (isPanelEvent(event)) return;
    if (!event.target.closest("g[data-node-id]")) {
      backgroundHandler?.();
    }
    contextMenu.close();
  });

  function bindGraph(nextGraphModel, nextHandlers) {
    handlers = nextHandlers || {};
    svg.querySelectorAll("g[data-node-id]").forEach((group) => {
      group.addEventListener("click", (event) => {
        if (event?.target?.closest?.("[data-runtime-action], [data-runtime-choice-index], [data-init-difficulty], [data-init-next], [data-init-input]")) return;
        const nodeId = group.dataset.nodeId;
        handlers.onSelectNode?.(nodeId);
        activatedHandler?.(nodeId);
      });
      group.addEventListener("dblclick", () => {
        doubleClickHandler?.(group.dataset.nodeId);
      });
      group.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        handlers.onContextNode?.(group.dataset.nodeId, event.clientX, event.clientY);
      });
    });
  }

  return {
    bindGraph,
    onDoubleClick(handler) {
      doubleClickHandler = handler;
    },
    onNodeActivated(handler) {
      activatedHandler = handler;
    },
    onBackground(handler) {
      backgroundHandler = handler;
    },
  };
}
