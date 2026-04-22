import { useMemo } from "react";
import type { DomTraversalResponse } from "./types";
import { buildTreeLayout } from "./utils/tree-layout-builder";
import { getTraversalState } from "./utils/tree-traversal-state";
import TreeEdge from "./tree-edge";
import TreeNode from "./tree-node";

type TreeSvgProps = {
  data: DomTraversalResponse;
  activeStep: number;
};

export default function TreeSvg({ data, activeStep }: TreeSvgProps) {
  const layout = useMemo(() => buildTreeLayout(data.tree), [data.tree]);

  const traversalState = useMemo(
    () => getTraversalState(data.traversalLog, activeStep),
    [data.traversalLog, activeStep]
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

  return (
    <div className="tv-canvas-wrapper">
      <svg
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="tv-svg"
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