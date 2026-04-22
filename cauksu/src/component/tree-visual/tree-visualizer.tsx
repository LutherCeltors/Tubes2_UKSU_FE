import { useState } from "react";
import type { DomTraversalResponse } from "./types";
import TreeSvg from "./tree-svg";
import TraversalLogPanel from "./tree-traversal-log-panel";
import { useTraversalPlayback } from "./hooks/traversal-playback";
import "./tree-visual.css";

type TreeVisualizerProps = {
  data: DomTraversalResponse;
};

export default function TreeVisualizer({ data }: TreeVisualizerProps) {
  const maxStep = data.traversalLog.length - 1;

  const [activeStep, setActiveStep] = useState(() =>
    data.traversalLog.length > 0 ? 0 : -1
  );
  const [isPlaying, setIsPlaying] = useState(false);

  useTraversalPlayback(isPlaying, activeStep, maxStep, (nextStep) => {
    if (nextStep >= maxStep) {
      setActiveStep(maxStep);
      setIsPlaying(false);
      return;
    }

    setActiveStep(nextStep);
  });

  return (
    <section className="tv-root">
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

      <div className="tv-controls">
        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            setActiveStep(data.traversalLog.length > 0 ? 0 : -1);
          }}
          disabled={maxStep < 0}
        >
          Reset
        </button>

        <button
          type="button"
          onClick={() => setIsPlaying((prev) => !prev)}
          disabled={maxStep < 0}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <input
          type="range"
          min={0}
          max={Math.max(maxStep, 0)}
          value={Math.max(activeStep, 0)}
          onChange={(e) => {
            setIsPlaying(false);
            setActiveStep(Number(e.target.value));
          }}
          disabled={maxStep < 0}
        />

        <span>
          Step {maxStep >= 0 ? activeStep + 1 : 0} / {Math.max(data.traversalLog.length, 0)}
        </span>
      </div>

      <div className="tv-main-layout">
        <TreeSvg data={data} activeStep={activeStep} />

        <TraversalLogPanel
          log={data.traversalLog}
          activeStep={activeStep}
          onSelectStep={(step) => {
            setIsPlaying(false);
            setActiveStep(step);
          }}
        />
      </div>
    </section>
  );
}