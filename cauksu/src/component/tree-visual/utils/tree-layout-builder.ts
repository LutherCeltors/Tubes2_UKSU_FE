import type { DomTreeNode, LayoutEdge, LayoutNode, TreeLayoutResult } from "../types";

const HORIZONTAL_GAP = 170;
const VERTICAL_GAP = 180;
const PADDING_X = 100;
const PADDING_Y = 100;

type DraftNode = {
  id: number;
  tag: string;
  attributes: Record<string, string>;
  depth: number;
  rawX: number;
  rawY: number;
  parentId: number | null;
};

export function buildTreeLayout(root: DomTreeNode): TreeLayoutResult {
  const draftNodes: DraftNode[] = [];
  let nextLeafX = 0;
  let maxDepth = 0;

  function traverse(node: DomTreeNode, depth: number, parentId: number | null): number {
    maxDepth = Math.max(maxDepth, depth);

    const children = node.children ?? [];
    let rawX: number;

    if (children.length === 0) {
      rawX = nextLeafX;
      nextLeafX += HORIZONTAL_GAP;
    } else {
      const childXs = children.map((child) => traverse(child, depth + 1, node.id));
      rawX = (childXs[0] + childXs[childXs.length - 1]) / 2;
    }

    draftNodes.push({
      id: node.id,
      tag: node.tag,
      attributes: node.attributes ?? {},
      depth,
      rawX,
      rawY: depth * VERTICAL_GAP,
      parentId,
    });

    return rawX;
  }

  traverse(root, 0, null);

  const width = Math.max(nextLeafX + PADDING_X * 2, 800);
  const height = (maxDepth + 1) * VERTICAL_GAP + PADDING_Y * 2;

  const nodes: LayoutNode[] = draftNodes.map((node) => ({
    id: node.id,
    tag: node.tag,
    attributes: node.attributes,
    depth: node.depth,
    x: node.rawX + PADDING_X,
    y: node.rawY + PADDING_Y,
    parentId: node.parentId,
  }));

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const edges: LayoutEdge[] = [];

  for (const node of nodes) {
    if (node.parentId === null) continue;

    const parent = nodeMap.get(node.parentId);
    if (!parent) continue;

    edges.push({
      id: `${parent.id}-${node.id}`,
      from: parent.id,
      to: node.id,
      x1: parent.x,
      y1: parent.y,
      x2: node.x,
      y2: node.y,
    });
  }

  return { nodes, edges, width, height };
}