import { useMemo, type RefObject } from "react";
import type { TraversalLogItem, TreeLayoutResult } from "./types";
import { getTraversalState } from "./utils/tree-traversal-state";
import TreeEdge from "./tree-edge";
import TreeNode from "./tree-node";

type TreeSvgProps = {
  layout: TreeLayoutResult;
  traversalLog: TraversalLogItem[];
  activeStep: number;
  stageRef: RefObject<HTMLDivElement | null>;
  cameraX: number;
  cameraY: number;
  zoom: number;
  expandedDetailNodeIds: Set<number>;
  isAllDetailsExpanded: boolean;
  onToggleNode: (nodeId: number) => void;
  onBackgroundPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onBackgroundPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onCanvasWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
};

export default function TreeSvg({
  layout,
  traversalLog,
  activeStep,
  stageRef,
  cameraX,
  cameraY,
  zoom,
  expandedDetailNodeIds,
  isAllDetailsExpanded,
  onToggleNode,
  onBackgroundPointerDown,
  onBackgroundPointerMove,
  onCanvasWheel,
}: TreeSvgProps) {
  const traversalState = useMemo(
    () => getTraversalState(traversalLog, activeStep),
    [traversalLog, activeStep]
  );

  const nodeStateMap = useMemo(() => {
    const map = new Map<number, "default" | "visited" | "matched" | "active">();

    for (const node of layout.nodes) {
      let state: "default" | "visited" | "matched" | "active" = "default";

      if (traversalState.visitedNodeIds.has(node.id)) state = "visited";
      if (traversalState.currentNodeId === node.id) state = "active";
      if (traversalState.matchedNodeIds.has(node.id)) state = "matched";

      map.set(node.id, state);
    }

    return map;
  }, [layout.nodes, traversalState]);

  const edgeVariant = isAllDetailsExpanded ? "curved" : "straight";

  return (
    <div
      ref={stageRef}
      className="tv-canvas-wrapper"
      onPointerDown={onBackgroundPointerDown}
      onPointerMove={onBackgroundPointerMove}
      onWheel={onCanvasWheel}
    >
      <svg className="tv-svg" width="100%" height="100%">
        <g transform={`translate(${cameraX} ${cameraY}) scale(${zoom})`}>
          {layout.edges.map((edge) => {
            let edgeState: "default" | "visited" | "active" = "default";

            if (traversalState.visitedNodeIds.has(edge.to)) {
              edgeState = "visited";
            }

            if (traversalState.currentNodeId === edge.to) {
              edgeState = "active";
            }

            return (
              <TreeEdge
                key={edge.id}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                state={edgeState}
                variant={edgeVariant}
              />
            );
          })}

          {layout.nodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              state={nodeStateMap.get(node.id) ?? "default"}
              isExpanded={expandedDetailNodeIds.has(node.id)}
              onToggle={onToggleNode}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
