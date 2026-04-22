import type { LayoutNode } from "./types";

type TreeNodeProps = {
  node: LayoutNode;
  state: "default" | "visited" | "matched" | "active";
};

function getAttributeLines(attributes: Record<string, string>) {
  const lines: string[] = [];

  if (attributes.id) {
    lines.push(`#${attributes.id}`);
  }

  if (attributes.class) {
    const classLine = attributes.class
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((className) => `.${className}`)
      .join(" ");

    if (classLine) {
      lines.push(classLine);
    }
  }

  const otherEntries = Object.entries(attributes).filter(
    ([key]) => key !== "id" && key !== "class"
  );

  if (otherEntries.length > 0) {
    lines.push(
      otherEntries
        .slice(0, 2)
        .map(([key, value]) => `${key}=${value}`)
        .join(" ")
    );
  }

  return lines.slice(0, 2);
}

function getTooltipText(node: LayoutNode) {
  const entries = Object.entries(node.attributes);

  if (entries.length === 0) {
    return `Node ${node.id}\n<${node.tag}>`;
  }

  return [
    `Node ${node.id}`,
    `<${node.tag}>`,
    ...entries.map(([key, value]) => `${key}="${value}"`),
  ].join("\n");
}

export default function TreeNode({ node, state }: TreeNodeProps) {
  const attributeLines = getAttributeLines(node.attributes);
  const tooltipText = getTooltipText(node);

  return (
    <g transform={`translate(${node.x}, ${node.y})`} className="tv-node-group">
      <title>{tooltipText}</title>

      {node.depth === 0 && (
        <text textAnchor="middle" y={-62} className="tv-node-root-label">
          ROOT
        </text>
      )}

      <text
        textAnchor="middle"
        y={node.depth === 0 ? -46 : -54}
        className="tv-node-level-label"
      >
        Level {node.depth}
      </text>

      <circle r={30} className={`tv-node tv-node--${state}`} />

      <text textAnchor="middle" dy="0.35em" className="tv-node-id">
        {node.id}
      </text>

      <text textAnchor="middle" y={50} className="tv-node-tag">
        {node.tag}
      </text>

      {attributeLines.map((line, index) => (
        <text
          key={`${node.id}-${index}`}
          textAnchor="middle"
          y={68 + index * 14}
          className="tv-node-attr"
        >
          {line}
        </text>
      ))}
    </g>
  );
}