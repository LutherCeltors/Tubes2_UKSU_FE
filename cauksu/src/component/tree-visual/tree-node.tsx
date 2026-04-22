import type { LayoutNode } from "./types";

type TreeNodeProps = {
  node: LayoutNode;
  state: "default" | "visited" | "matched" | "active";
};

export default function TreeNode({ node, state }: TreeNodeProps) {
  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      <circle r={28} className={`tv-node tv-node--${state}`} />
      <text textAnchor="middle" dy="0.35em" className="tv-node-id">
        {node.id}
      </text>
      <text textAnchor="middle" dy="48" className="tv-node-tag">
        {node.tag}
      </text>
    </g>
  );
}