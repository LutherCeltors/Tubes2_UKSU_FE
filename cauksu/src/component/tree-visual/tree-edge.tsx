import { motion } from "framer-motion";

type TreeEdgeProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  state: "default" | "visited" | "active";
  variant?: "straight" | "curved";
};

const RECT_HALF_WIDTH = 122;
const RECT_HALF_HEIGHT = 50;

function buildStraightPath(x1: number, y1: number, x2: number, y2: number) {
  const controlX = (x1 + x2) / 2;
  const controlY = (y1 + y2) / 2;

  return `M ${x1} ${y1} L ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2} L ${x2} ${y2}`;
}

function buildCurvedPath(x1: number, y1: number, x2: number, y2: number) {
  const startX = x1;
  const startY = y1 + RECT_HALF_HEIGHT;

  const endX = x2 - RECT_HALF_WIDTH;
  const endY = y2;

  const dx = endX - startX;
  const dy = endY - startY;

  if (dx <= 0 || dy <= 0) {
    return buildStraightPath(x1, y1, x2, y2);
  }

  const radius = Math.min(28, dx / 3, dy / 3);
  const verticalEndY = endY - radius;
  const cornerEndX = startX + radius;

  return `
    M ${startX} ${startY}
    L ${startX} ${verticalEndY}
    Q ${startX} ${endY} ${cornerEndX} ${endY}
    L ${endX} ${endY}
  `;
}

export default function TreeEdge({
  x1,
  y1,
  x2,
  y2,
  state,
  variant = "straight",
}: TreeEdgeProps) {
  const pathData =
    variant === "curved"
      ? buildCurvedPath(x1, y1, x2, y2)
      : buildStraightPath(x1, y1, x2, y2);

  return (
    <motion.path
      d={pathData}
      animate={{ d: pathData }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      className={`tv-edge tv-edge--${state}`}
    />
  );
}