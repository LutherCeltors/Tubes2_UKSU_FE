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

export default function TreeEdge({
  x1,
  y1,
  x2,
  y2,
  state,
  variant = "straight",
}: TreeEdgeProps) {
  if (variant === "curved") {
    const startX = x1;
    const startY = y1 + RECT_HALF_HEIGHT;

    const endX = x2 - RECT_HALF_WIDTH;
    const endY = y2;

    const dx = endX - startX;
    const dy = endY - startY;

    if (dx <= 0 || dy <= 0) {
      return (
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          className={`tv-edge tv-edge--${state}`}
        />
      );
    }

    const radius = Math.min(40, dx / 3, dy / 3);

    const verticalEndY = endY - radius;
    const horizontalStartX = startX + radius;

    const pathData = `
      M ${startX} ${startY}
      L ${startX} ${verticalEndY}
      Q ${startX} ${endY} ${horizontalStartX} ${endY}
      L ${endX} ${endY}
    `;

    return <path d={pathData} className={`tv-edge tv-edge--${state}`} />;
  }

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      className={`tv-edge tv-edge--${state}`}
    />
  );
}