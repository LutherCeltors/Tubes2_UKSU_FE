import type { DomTreeNode, LayoutEdge, LayoutNode, TreeLayoutResult } from "../types";

export type TreeLayoutMode = "tree" | "indented";

const TREE_HORIZONTAL_GAP = 280;
const TREE_VERTICAL_GAP = 190;
const TREE_PADDING_X = 140;
const TREE_PADDING_Y = 110;

const INDENT_PADDING_X = 40;
const INDENT_PADDING_Y = 120;
const INDENT_GAP_X = 270;
const INDENT_GAP_Y = 185;
const EXPANDED_RECT_HALF_WIDTH = 122;

type DraftNode = {
  id: number;
  tag: string;
  attributes: Record<string, string>;
  depth: number;
  rawX: number;
  rawY: number;
  parentId: number | null;
};

export function buildTreeLayout(
  root: DomTreeNode,
  mode: TreeLayoutMode = "tree"
): TreeLayoutResult {
  if (mode === "indented") {
    return buildIndentedLayout(root);
  }

  return buildBalancedTreeLayout(root);
}

function buildBalancedTreeLayout(root: DomTreeNode): TreeLayoutResult {
  const draftNodes: DraftNode[] = [];
  let nextLeafX = 0;
  let maxDepth = 0;

  function traverse(node: DomTreeNode, depth: number, parentId: number | null): number {
    maxDepth = Math.max(maxDepth, depth);

    const children = node.children ?? [];
    let rawX: number;

    if (children.length === 0) {
      rawX = nextLeafX;
      nextLeafX += TREE_HORIZONTAL_GAP;
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
      rawY: depth * TREE_VERTICAL_GAP,
      parentId,
    });

    return rawX;
  }

  traverse(root, 0, null);

  const width = Math.max(nextLeafX + TREE_PADDING_X * 2, 900);
  const height = (maxDepth + 1) * TREE_VERTICAL_GAP + TREE_PADDING_Y * 2;

  return finalizeLayout(draftNodes, width, height, TREE_PADDING_X, TREE_PADDING_Y);
}

function buildIndentedLayout(root: DomTreeNode): TreeLayoutResult {
  const draftNodes: DraftNode[] = [];
  let rowIndex = 0;
  let maxDepth = 0;

  function traverse(node: DomTreeNode, depth: number, parentId: number | null) {
    maxDepth = Math.max(maxDepth, depth);

    draftNodes.push({
      id: node.id,
      tag: node.tag,
      attributes: node.attributes ?? {},
      depth,
      rawX: depth * INDENT_GAP_X + EXPANDED_RECT_HALF_WIDTH,
      rawY: rowIndex * INDENT_GAP_Y,
      parentId,
    });

    rowIndex += 1;

    (node.children ?? []).forEach((child) => traverse(child, depth + 1, node.id));
  }

  traverse(root, 0, null);

  const width = Math.max(
    maxDepth * INDENT_GAP_X + INDENT_PADDING_X * 2 + EXPANDED_RECT_HALF_WIDTH * 2 + 80,
    1000
  );

  const height = Math.max(
    rowIndex * INDENT_GAP_Y + INDENT_PADDING_Y * 2,
    700
  );

  return finalizeLayout(draftNodes, width, height, INDENT_PADDING_X, INDENT_PADDING_Y);
}

function finalizeLayout(
  draftNodes: DraftNode[],
  width: number,
  height: number,
  paddingX: number,
  paddingY: number
): TreeLayoutResult {
  const nodes: LayoutNode[] = draftNodes.map((node) => ({
    id: node.id,
    tag: node.tag,
    attributes: node.attributes,
    depth: node.depth,
    x: node.rawX + paddingX,
    y: node.rawY + paddingY,
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