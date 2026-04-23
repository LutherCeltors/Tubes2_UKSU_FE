export type TraversalStatus = "visited" | "matched" | "skipped";

export interface DomTreeNode {
  id: number;
  tag: string;
  attributes?: Record<string, string>;
  children?: DomTreeNode[];
}

export interface TraversalLogItem {
  nodeId: number;
  tag: string;
  status: TraversalStatus;
}

export interface DomTraversalResponse {
  executionTimeMs: number;
  nodesVisited: number;
  maxDepth: number;
  tree: DomTreeNode;
  traversalLog: TraversalLogItem[];
}

export interface LayoutNode {
  id: number;
  tag: string;
  attributes: Record<string, string>;
  depth: number;
  x: number;
  y: number;
  parentId: number | null;
}

export interface LayoutEdge {
  id: string;
  from: number;
  to: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TreeLayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}