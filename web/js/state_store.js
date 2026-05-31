export function createStateStore() {
  let state = {
    sessionId: null,
    gameState: null,
    polymorphismResult: null,
    initDraft: null,
    pendingRuntimeSelection: null,
    selectedNodeId: null,
    replayMode: "simple",
    language: "ko",
    displayStates: {},
    nodePositions: {},
    transientOwnerIds: [],
    pinnedChildNodeIds: [],
    replaySequence: [],
    replayIndex: -1,
    highlighted: { current: [], next: [], changed: [], runtimeEdges: [], methodNode: null, methodNodes: [], fieldChange: null },
  };

  return {
    getState() {
      return state;
    },
    setState(patch) {
      state = { ...state, ...patch };
      return state;
    },
  };
}
