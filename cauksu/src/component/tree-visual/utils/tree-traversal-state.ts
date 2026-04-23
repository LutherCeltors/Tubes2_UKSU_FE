import type { TraversalLogItem } from "../types";

export function getTraversalState(log: TraversalLogItem[], activeStep: number) {
  const visitedNodeIds = new Set<number>();
  const matchedNodeIds = new Set<number>();
  let currentNodeId: number | null = null;

  if (activeStep < 0) {
    return {
      visitedNodeIds,
      matchedNodeIds,
      currentNodeId,
    };
  }

  for (let i = 0; i <= activeStep && i < log.length; i++) {
    const step = log[i];

    if (step.status === "visited" || step.status === "matched") {
      visitedNodeIds.add(step.nodeId);
    }

    if (step.status === "matched") {
      matchedNodeIds.add(step.nodeId);
    }

    currentNodeId = step.nodeId;
  }

  return {
    visitedNodeIds,
    matchedNodeIds,
    currentNodeId,
  };
}