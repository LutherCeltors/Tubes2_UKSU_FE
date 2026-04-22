import { AnimatePresence, motion } from "framer-motion";
import type { LayoutNode } from "./types";

type TreeNodeProps = {
  node: LayoutNode;
  state: "default" | "visited" | "matched" | "active";
  isExpanded: boolean;
  onToggle: (nodeId: number) => void;
};

function formatAttributeText(attributes: Record<string, string>) {
  const entries = Object.entries(attributes);

  if (entries.length === 0) {
    return "-";
  }

  return entries.map(([key, value]) => `${key}="${value}"`).join(", ");
}

function wrapText(text: string, maxLineLength = 22, maxLines = 2) {
  if (text.length <= maxLineLength) {
    return [text];
  }

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxLineLength) {
      currentLine = nextLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;

      if (lines.length === maxLines - 1) {
        break;
      }
    }
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    lines.push(text.slice(0, maxLineLength));
  }

  const usedText = lines.join(" ");
  if (usedText.length < text.length) {
    const lastIndex = lines.length - 1;
    lines[lastIndex] = `${lines[lastIndex].slice(0, Math.max(lines[lastIndex].length - 3, 0))}...`;
  }

  return lines.slice(0, maxLines);
}

export default function TreeNode({
  node,
  state,
  isExpanded,
  onToggle,
}: TreeNodeProps) {
  const attributeText = formatAttributeText(node.attributes);
  const attributeLines = wrapText(attributeText, 22, 2);

  const rootLabelY = isExpanded ? -86 : -64;
  const levelLabelY = isExpanded ? -68 : -48;

  return (
    <motion.g
      className="tv-node-group is-clickable"
      onClick={() => onToggle(node.id)}
      initial={false}
      animate={{ x: node.x, y: node.y }}
      transition={{ type: "spring", stiffness: 180, damping: 24 }}
    >
      <title>
        {`Node ${node.id}
<${node.tag}>
${attributeText}
${isExpanded ? "Click to collapse detail" : "Click to expand detail"}`}
      </title>

      {node.depth === 0 && (
        <text textAnchor="middle" y={rootLabelY} className="tv-node-root-label">
          ROOT
        </text>
      )}

      <text textAnchor="middle" y={levelLabelY} className="tv-node-level-label">
        Level {node.depth}
      </text>

      <AnimatePresence mode="wait" initial={false}>
        {isExpanded ? (
          <motion.g
            key="expanded"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2 }}
          >
            <rect
              x={-122}
              y={-50}
              width={244}
              height={126}
              rx={16}
              ry={16}
              className={`tv-node-shape tv-node-shape--${state}`}
            />

            <rect
              x={92}
              y={-40}
              width={20}
              height={20}
              rx={6}
              ry={6}
              className="tv-node-badge"
            />
            <text x={102} y={-26} textAnchor="middle" className="tv-node-badge-symbol">
              −
            </text>

            <text x={-96} y={-16} className="tv-node-rect-label">
              id
            </text>
            <text x={-10} y={-16} className="tv-node-rect-separator">
              :
            </text>
            <text x={8} y={-16} className="tv-node-rect-value">
              {node.id}
            </text>

            <text x={-96} y={8} className="tv-node-rect-label">
              tag
            </text>
            <text x={-10} y={8} className="tv-node-rect-separator">
              :
            </text>
            <text x={8} y={8} className="tv-node-rect-value">
              {node.tag}
            </text>

            <text x={-96} y={32} className="tv-node-rect-label">
              attribute
            </text>
            <text x={-10} y={32} className="tv-node-rect-separator">
              :
            </text>

            {attributeLines.map((line, index) => (
              <text
                key={`${node.id}-attr-${index}`}
                x={8}
                y={32 + index * 15}
                className="tv-node-rect-value tv-node-rect-value--small"
              >
                {line}
              </text>
            ))}
          </motion.g>
        ) : (
          <motion.g
            key="collapsed"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2 }}
          >
            <circle r={30} className={`tv-node-shape tv-node-shape--${state}`} />

            <circle cx={20} cy={-20} r={10} className="tv-node-badge" />
            <text x={20} y={-16} textAnchor="middle" className="tv-node-badge-symbol">
              +
            </text>

            <text textAnchor="middle" dy="0.35em" className="tv-node-id">
              {node.id}
            </text>
            <text textAnchor="middle" y={50} className="tv-node-tag">
              {node.tag}
            </text>
          </motion.g>
        )}
      </AnimatePresence>
    </motion.g>
  );
}