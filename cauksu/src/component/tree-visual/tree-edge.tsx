type TreeEdgeProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  state: "default" | "visited" | "active";
};

export default function TreeEdge({ x1, y1, x2, y2, state }: TreeEdgeProps) {
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