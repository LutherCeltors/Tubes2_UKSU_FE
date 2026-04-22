import type { DomTraversalResponse } from "./types";

type StatsPanelProps = {
  data: DomTraversalResponse;
};

export default function StatsPanel({ data }: StatsPanelProps) {
  return (
    <div className="tv-stats">
      <div className="tv-stat-card">
        <span className="tv-stat-label">Execution Time</span>
        <strong>{data.executionTimeMs} ms</strong>
      </div>

      <div className="tv-stat-card">
        <span className="tv-stat-label">Nodes Visited</span>
        <strong>{data.nodesVisited}</strong>
      </div>

      <div className="tv-stat-card">
        <span className="tv-stat-label">Max Depth</span>
        <strong>{data.maxDepth}</strong>
      </div>
    </div>
  );
}