import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { DomTraversalResponse, DomTreeNode } from "./types";
import TreeSvg from "./tree-svg";
import TraversalLogPanel from "./tree-traversal-log-panel";
import { useTraversalPlayback } from "./hooks/traversal-playback";
import { useDraggablePanel } from "./hooks/dragable-panel";
import { useCanvasPan } from "./hooks/canvas-pan";
import { buildTreeLayout, type TreeLayoutMode } from "./utils/tree-layout-builder";
import "./tree-visual.css";

function clampZoom(value: number) {
  return Math.min(Math.max(value, 0.01), 3);
}

function collectAllNodeIds(root: DomTreeNode) {
  const ids: number[] = [];

  function traverse(node: DomTreeNode) {
    ids.push(node.id);
    (node.children ?? []).forEach(traverse);
  }

  traverse(root);
  return ids;
}


export default function TreeVisualizer({ data }: { data: DomTraversalResponse }) {
  const maxStep = data.traversalLog.length - 1;
  const allNodeIds = useMemo(() => collectAllNodeIds(data.tree), [data.tree]);

  const [activeStep, setActiveStep] = useState(() =>
    data.traversalLog.length > 0 ? 0 : -1
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [cameraX, setCameraX] = useState(0);
  const [cameraY, setCameraY] = useState(0);
  const [isLogCollapsed, setIsLogCollapsed] = useState(false);
  const [expandedDetailNodeIds, setExpandedDetailNodeIds] = useState<Set<number>>(
    () => new Set()
  );

  const isAllDetailsExpanded = expandedDetailNodeIds.size === allNodeIds.length;
  const layoutMode: TreeLayoutMode = isAllDetailsExpanded ? "indented" : "tree";

  const layout = useMemo(
    () => buildTreeLayout(data.tree, layoutMode),
    [data.tree, layoutMode]
  );

  const stageRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const {
    panelRef,
    position: logPosition,
    isDragging: isDraggingLog,
    setPosition,
    handlePointerDown: handleLogPointerDown,
  } = useDraggablePanel(stageRef, { x: 800, y: 16 });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const panel = panelRef.current;

    if (!stage || !panel) return;

    const margin = 16;
    const x = stage.clientWidth - panel.offsetWidth - margin;
    const y = margin;

    setPosition({
      x: Math.max(x, margin),
      y,
    });
  }, [layout.width, layout.height, setPosition, panelRef]);

  const {
    isPanning,
    startPan,
    getNextCameraPosition,
  } = useCanvasPan();

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const stageWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;
    const currentZoom = zoomRef.current;

    const centeredX = (stageWidth - layout.width * currentZoom) / 2;
    const centeredY = (stageHeight - layout.height * currentZoom) / 2;

    setCameraX(centeredX);
    setCameraY(centeredY);
  }, [layout.width, layout.height, data]);

  useTraversalPlayback(isPlaying, activeStep, maxStep, (nextStep) => {
    if (nextStep >= maxStep) {
      setActiveStep(maxStep);
      setIsPlaying(false);
      return;
    }
    setActiveStep(nextStep);
  });

  const handleBackgroundPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startPan(event, cameraX, cameraY);
  };

  const handleBackgroundPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;

    const next = getNextCameraPosition(event.clientX, event.clientY);
    setCameraX(next.x);
    setCameraY(next.y);
  };

  function zoomAroundPoint(nextZoom: number, anchorX: number, anchorY: number) {
    if (nextZoom === zoom) return;

    const worldX = (anchorX - cameraX) / zoom;
    const worldY = (anchorY - cameraY) / zoom;

    setZoom(nextZoom);
    setCameraX(anchorX - worldX * nextZoom);
    setCameraY(anchorY - worldY * nextZoom);
  }

  function zoomAroundViewportCenter(nextZoom: number) {
    const stage = stageRef.current;
    if (!stage) return;

    const viewportCenterX = stage.clientWidth / 2;
    const viewportCenterY = stage.clientHeight / 2;

    zoomAroundPoint(nextZoom, viewportCenterX, viewportCenterY);
  }

  const handleZoomIn = () => {
    const nextZoom =  clampZoom(zoom + 0.1);
    zoomAroundViewportCenter(nextZoom);
  };

  const handleZoomOut = () => {
    const nextZoom =  clampZoom(zoom - 0.1);
    zoomAroundViewportCenter(nextZoom);
  };

  const handleResetZoom = () => {
    zoomAroundViewportCenter(1);
  };

  const handleFitToScreen = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const availableWidth = Math.max(stage.clientWidth - 40, 1);
    const availableHeight = Math.max(stage.clientHeight - 40, 1);

    const scaleX = availableWidth / layout.width;
    const scaleY = availableHeight / layout.height;
    const nextZoom = clampZoom(Math.min(scaleX, scaleY));

    setZoom(nextZoom);

    const centeredX = (stage.clientWidth - layout.width * nextZoom) / 2;
    const centeredY = (stage.clientHeight - layout.height * nextZoom) / 2;

    setCameraX(centeredX);
    setCameraY(centeredY);
  };

  const handleCanvasWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return;

    event.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const nextZoom = clampZoom(zoom * Math.exp(-event.deltaY * 0.01));

    zoomAroundPoint(nextZoom, pointerX, pointerY);
  };

  const handleToggleNode = (nodeId: number) => {
    setExpandedDetailNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleExpandAllDetails = () => {
    setExpandedDetailNodeIds(new Set(allNodeIds));
  };

  const handleCollapseAllDetails = () => {
    setExpandedDetailNodeIds(new Set());
  };

  return (
    <section className="tv-root">
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
          <button type="button" onClick={handleExpandAllDetails}>
            Expand All Details
          </button>

          <button type="button" onClick={handleCollapseAllDetails}>
            Collapse All Details
          </button>
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

      <div className="tv-stage">
        <TreeSvg
          layout={layout}
          traversalLog={data.traversalLog}
          activeStep={activeStep}
          stageRef={stageRef}
          cameraX={cameraX}
          cameraY={cameraY}
          zoom={zoom}
          expandedDetailNodeIds={expandedDetailNodeIds}
          isAllDetailsExpanded={isAllDetailsExpanded}
          onToggleNode={handleToggleNode}
          onBackgroundPointerDown={handleBackgroundPointerDown}
          onBackgroundPointerMove={handleBackgroundPointerMove}
          onCanvasWheel={handleCanvasWheel}
        />

        <div
          ref={panelRef}
          className={`tv-floating-log ${isDraggingLog ? "is-dragging" : ""}`}
          style={{
            left: `${logPosition.x}px`,
            top: `${logPosition.y}px`,
          }}
        >
          <div
            className="tv-floating-log-handle"
            onPointerDown={handleLogPointerDown}
          >
            <span>Traversal Log</span>

            <div className="tv-floating-log-actions">
              <button
                type="button"
                className="tv-floating-log-toggle"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setIsLogCollapsed((prev) => !prev)}
                aria-expanded={!isLogCollapsed}
                aria-label={isLogCollapsed ? "Expand traversal log" : "Collapse traversal log"}
              >
                {isLogCollapsed ? "Open" : "Collapse"}
              </button>

            </div>
          </div>

          {!isLogCollapsed && (
            <TraversalLogPanel
              log={data.traversalLog}
              activeStep={activeStep}
              onSelectStep={(step) => {
                setIsPlaying(false);
                setActiveStep(step);
              }}
              showTitle={false}
            />
          )}
        </div>
      </div>
    </section>
  );
}
