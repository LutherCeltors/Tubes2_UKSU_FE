import { AnimatePresence, motion } from "framer-motion";
import type { LayoutNode } from "./types";

type TreeNodeProps = {
  node: LayoutNode;
  state: "default" | "visited" | "matched" | "active";
  isExpanded: boolean;
  onToggle: (nodeId: number) => void;
};

const EXPANDED_RECT = {
  x: -122,
  y: -58,
  width: 244,
  height: 146,
};

const EXPANDED_BADGE = {
  x: 92,
  y: -48,
  size: 20,
  textX: 102,
  textY: -34,
};

const RECT_CONTENT = {
  labelX: -96,
  separatorX: -10,
  valueX: 8,
};

function formatAttributeText(attributes: Record<string, string>) {
  const entries = Object.entries(attributes);

  if (entries.length === 0) {
    return "-";
  }

  return entries.map(([key, value]) => `${key}="${value}"`).join(", ");
}

function wrapText(text: string, maxLineLength = 20, maxLines = 2) {
  if (!text) {
    return ["-"];
  }

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

      if (word.length > maxLineLength) {
        lines.push(word.slice(0, maxLineLength - 3) + "...");
        currentLine = "";
      } else {
        currentLine = word;
      }

      if (lines.length >= maxLines) {
        break;
      }
    }
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  }

  const joined = lines.join(" ");
  if (joined.length < text.length) {
    const lastIndex = lines.length - 1;
    if (lastIndex >= 0) {
      const trimmed = lines[lastIndex].slice(0, Math.max(lines[lastIndex].length - 3, 0));
      lines[lastIndex] = `${trimmed}...`;
    }
  }

  return lines.slice(0, maxLines);
}

function renderMultilineText(
  x: number,
  y: number,
  lines: string[],
  className: string,
  lineHeight = 14
) {
  return (
    <text x={x} y={y} className={className}>
      {lines.map((line, index) => (
        <tspan key={`${className}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export default function TreeNode({
  node,
  state,
  isExpanded,
  onToggle,
}: TreeNodeProps) {
  const attributeText = formatAttributeText(node.attributes);

  const rootLabelY = isExpanded ? -94 : -64;
  const levelLabelY = isExpanded ? -68 : -48;

  const idLines = wrapText(String(node.id), 18, 2);
  const tagLines = wrapText(node.tag, 18, 2);
  const attributeLines = wrapText(attributeText, 22, 3);

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
              x={EXPANDED_RECT.x}
              y={EXPANDED_RECT.y}
              width={EXPANDED_RECT.width}
              height={EXPANDED_RECT.height}
              rx={16}
              ry={16}
              className={`tv-node-shape tv-node-shape--${state}`}
            />

            <rect
              x={EXPANDED_BADGE.x}
              y={EXPANDED_BADGE.y}
              width={EXPANDED_BADGE.size}
              height={EXPANDED_BADGE.size}
              rx={6}
              ry={6}
              className="tv-node-badge"
            />
            <text
              x={EXPANDED_BADGE.textX}
              y={EXPANDED_BADGE.textY}
              textAnchor="middle"
              className="tv-node-badge-symbol"
            >
              -
            </text>

            <text x={RECT_CONTENT.labelX} y={-22} className="tv-node-rect-label">
              id
            </text>
            <text x={RECT_CONTENT.separatorX} y={-22} className="tv-node-rect-separator">
              :
            </text>
            {renderMultilineText(RECT_CONTENT.valueX, -24, idLines, "tv-node-rect-value")}

            <text x={RECT_CONTENT.labelX} y={12} className="tv-node-rect-label">
              tag
            </text>
            <text x={RECT_CONTENT.separatorX} y={12} className="tv-node-rect-separator">
              :
            </text>
            {renderMultilineText(RECT_CONTENT.valueX, 10, tagLines, "tv-node-rect-value")}

            <text x={RECT_CONTENT.labelX} y={48} className="tv-node-rect-label">
              attribute
            </text>
            <text x={RECT_CONTENT.separatorX} y={48} className="tv-node-rect-separator">
              :
            </text>
            {renderMultilineText(RECT_CONTENT.valueX, 46, attributeLines, "tv-node-rect-value")}
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
          </motion.g>
        )}
      </AnimatePresence>
    </motion.g>
  );
}
