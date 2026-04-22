import { useMemo, type RefObject } from "react";
import type { TraversalLogItem, TreeLayoutResult } from "./types";
import { getTraversalState } from "./utils/tree-traversal-state";
import TreeEdge from "./tree-edge";
import TreeNode from "./tree-node";

type TreeSvgProps = {
  layout: TreeLayoutResult;
  traversalLog: TraversalLogItem[];
  activeStep: number;
  zoom: number;
  containerRef: RefObject<HTMLDivElement | null>;
};

export default function TreeSvg({
  layout,
  traversalLog,
  activeStep,
  zoom,
  containerRef,
}: TreeSvgProps) {
  const traversalState = useMemo(
    () => getTraversalState(traversalLog, activeStep),
    [traversalLog, activeStep]
  );

  const nodeStateMap = useMemo(() => {
    const map = new Map<number, "default" | "visited" | "matched" | "active">();

    for (const node of layout.nodes) {
      let state: "default" | "visited" | "matched" | "active" = "default";

      if (traversalState.visitedNodeIds.has(node.id)) {
        state = "visited";
      }

      if (traversalState.currentNodeId === node.id) {
        state = "active";
      }

      if (traversalState.matchedNodeIds.has(node.id)) {
        state = "matched";
      }
      map.set(node.id, state);
    }

    return map;
  }, [layout.nodes, traversalState]);

  const scaledWidth = layout.width * zoom;
  const scaledHeight = layout.height * zoom;

  return (
    <div ref={containerRef} className="tv-canvas-wrapper">
      <svg
        width={scaledWidth}
        height={scaledHeight}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="tv-svg"
        preserveAspectRatio="xMinYMin meet"
      >
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
            />
          );
        })}

        {layout.nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            state={nodeStateMap.get(node.id) ?? "default"}
          />
        ))}
      </svg>
    </div>
  );
}