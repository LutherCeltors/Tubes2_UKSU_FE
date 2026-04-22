import { useMemo, useRef, useState } from "react";
import type { DomTraversalResponse } from "./types";
import TreeSvg from "./tree-svg";
import TraversalLogPanel from "./tree-traversal-log-panel";
import { useTraversalPlayback } from "./hooks/traversal-playback";
import { buildTreeLayout } from "./utils/tree-layout-builder";
import "./tree-visual.css";

type TreeVisualizerProps = {
  data: DomTraversalResponse;
};

function clampZoom(value: number) {
  return Math.min(Math.max(value, 0.25), 3);
}

export default function TreeVisualizer({ data }: TreeVisualizerProps) {
  const maxStep = data.traversalLog.length - 1;
  const layout = useMemo(() => buildTreeLayout(data.tree), [data.tree]);

  const [activeStep, setActiveStep] = useState(() =>
    data.traversalLog.length > 0 ? 0 : -1
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useTraversalPlayback(isPlaying, activeStep, maxStep, (nextStep) => {
    if (nextStep >= maxStep) {
      setActiveStep(maxStep);
      setIsPlaying(false);
      return;
    }

    setActiveStep(nextStep);
  });

  const handleZoomIn = () => {
    setZoom((prev) => clampZoom(prev + 0.2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => clampZoom(prev - 0.2));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleFitToScreen = () => {
    const container = containerRef.current;
    if (!container) return;

    const availableWidth = Math.max(container.clientWidth - 32, 1);
    const availableHeight = Math.max(container.clientHeight - 32, 1);

    const scaleX = availableWidth / layout.width;
    const scaleY = availableHeight / layout.height;

    setZoom(clampZoom(Math.min(scaleX, scaleY)));
  };

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
        <div className="tv-control-group">
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setActiveStep(data.traversalLog.length > 0 ? 0 : -1);
            }}
            disabled={maxStep < 0}
          >
            Reset Step
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

        <div className="tv-control-divider" />

        <div className="tv-control-group">
          <button type="button" onClick={handleZoomOut}>
            Zoom Out
          </button>

          <span className="tv-zoom-label">{Math.round(zoom * 100)}%</span>

          <button type="button" onClick={handleZoomIn}>
            Zoom In
          </button>

          <button type="button" onClick={handleResetZoom}>
            100%
          </button>

          <button type="button" onClick={handleFitToScreen}>
            Fit
          </button>
        </div>
      </div>

      <div className="tv-main-layout">
        <TreeSvg
          layout={layout}
          traversalLog={data.traversalLog}
          activeStep={activeStep}
          zoom={zoom}
          containerRef={containerRef}
        />

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