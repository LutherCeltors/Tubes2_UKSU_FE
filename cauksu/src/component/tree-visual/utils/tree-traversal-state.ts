import type { TraversalLogItem } from "../types";

export function buildSortedBatches(log: TraversalLogItem[]): number[] {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const item of log) {
    if (!seen.has(item.batch)) {
      seen.add(item.batch);
      result.push(item.batch);
    }
  }
  return result.sort((a, b) => a - b);
}

export function getTraversalState(
  log: TraversalLogItem[],
  activeStep: number,
  sortedBatches: number[]
) {
  const visitedNodeIds = new Set<number>();
  const matchedNodeIds = new Set<number>();
  const currentNodeIds = new Set<number>();

  if (activeStep < 0 || sortedBatches.length === 0) {
    return { visitedNodeIds, matchedNodeIds, currentNodeIds };
  }

  const currentBatchValue = sortedBatches[activeStep];
  const batchToStep = new Map(sortedBatches.map((b, i) => [b, i]));

  for (const item of log) {
    const itemStep = batchToStep.get(item.batch) ?? 0;

    if (itemStep <= activeStep) {
      if (item.status === "visited" || item.status === "matched") {
        visitedNodeIds.add(item.nodeId);
      }
      if (item.status === "matched") {
        matchedNodeIds.add(item.nodeId);
      }
    }

    if (item.batch === currentBatchValue) {
      currentNodeIds.add(item.nodeId);
    }
  }

  return { visitedNodeIds, matchedNodeIds, currentNodeIds };
}
