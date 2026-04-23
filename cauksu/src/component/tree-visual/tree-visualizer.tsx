import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { DomTraversalResponse, DomTreeNode } from "./types";
import TreeSvg from "./tree-svg";
import TraversalLogPanel from "./tree-traversal-log-panel";
import { useTraversalPlayback } from "./hooks/traversal-playback";
import { useDraggablePanel } from "./hooks/dragable-panel";
import { useCanvasPan } from "./hooks/canvas-pan";
import { buildTreeLayout, type TreeLayoutMode } from "./utils/tree-layout-builder";
import "./tree-visual.css";

type ViewportState = {
  x: number;
  y: number;
  zoom: number;
};

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
  const contentRef = useRef<SVGGElement | null>(null);
  const zoomLabelRef = useRef<HTMLSpanElement | null>(null);
  const viewportRef = useRef<ViewportState>({ x: 0, y: 0, zoom: 1 });
  const panFrameRef = useRef<number | null>(null);
  const pendingPanViewportRef = useRef<ViewportState | null>(null);

  const applyViewport = useCallback((nextViewport: ViewportState) => {
    viewportRef.current = nextViewport;

    if (contentRef.current) {
      contentRef.current.setAttribute(
        "transform",
        `translate(${nextViewport.x} ${nextViewport.y}) scale(${nextViewport.zoom})`
      );
    }

    if (zoomLabelRef.current) {
      zoomLabelRef.current.textContent = `${Math.round(nextViewport.zoom * 100)}%`;
    }
  }, []);

  const schedulePanViewport = useCallback((nextViewport: ViewportState) => {
    pendingPanViewportRef.current = nextViewport;

    if (panFrameRef.current !== null) return;

    panFrameRef.current = window.requestAnimationFrame(() => {
      panFrameRef.current = null;

      if (!pendingPanViewportRef.current) return;

      applyViewport(pendingPanViewportRef.current);
      pendingPanViewportRef.current = null;
    });
  }, [applyViewport]);

  const {
    panelRef,
    position: logPosition,
    isDragging: isDraggingLog,
    setPosition,
    handlePointerDown: handleLogPointerDown,
  } = useDraggablePanel(stageRef, { x: 16, y: 16 });

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

  const { isPanning, startPan, getNextCameraPosition } = useCanvasPan();

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const stageWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;
    const currentZoom = viewportRef.current.zoom;

    const centeredX = (stageWidth - layout.width * currentZoom) / 2;
    const centeredY = (stageHeight - layout.height * currentZoom) / 2;

    applyViewport({
      x: centeredX,
      y: centeredY,
      zoom: currentZoom,
    });
  }, [applyViewport, layout.width, layout.height, data]);

  useTraversalPlayback(isPlaying, activeStep, maxStep, (nextStep) => {
    if (nextStep >= maxStep) {
      setActiveStep(maxStep);
      setIsPlaying(false);
      return;
    }
    setActiveStep(nextStep);
  });

  const handleBackgroundPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    startPan(event, viewportRef.current.x, viewportRef.current.y);
  }, [startPan]);

  const handleBackgroundPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;

    const next = getNextCameraPosition(event.clientX, event.clientY);
    schedulePanViewport({
      x: next.x,
      y: next.y,
      zoom: viewportRef.current.zoom,
    });
  }, [getNextCameraPosition, isPanning, schedulePanViewport]);

  const zoomAroundPoint = useCallback((nextZoom: number, anchorX: number, anchorY: number) => {
    const currentViewport = viewportRef.current;
    if (nextZoom === currentViewport.zoom) return;

    const worldX = (anchorX - currentViewport.x) / currentViewport.zoom;
    const worldY = (anchorY - currentViewport.y) / currentViewport.zoom;

    applyViewport({
      x: anchorX - worldX * nextZoom,
      y: anchorY - worldY * nextZoom,
      zoom: nextZoom,
    });
  }, [applyViewport]);

  const zoomAroundViewportCenter = useCallback((nextZoom: number) => {
    const stage = stageRef.current;
    if (!stage) return;

    const viewportCenterX = stage.clientWidth / 2;
    const viewportCenterY = stage.clientHeight / 2;

    zoomAroundPoint(nextZoom, viewportCenterX, viewportCenterY);
  }, [zoomAroundPoint]);

  const handleZoomIn = useCallback(() => {
    const nextZoom = clampZoom(viewportRef.current.zoom + 0.1);
    zoomAroundViewportCenter(nextZoom);
  }, [zoomAroundViewportCenter]);

  const handleZoomOut = useCallback(() => {
    const nextZoom = clampZoom(viewportRef.current.zoom - 0.1);
    zoomAroundViewportCenter(nextZoom);
  }, [zoomAroundViewportCenter]);

  const handleResetZoom = useCallback(() => {
    zoomAroundViewportCenter(1);
  }, [zoomAroundViewportCenter]);

  const handleFitToScreen = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const availableWidth = Math.max(stage.clientWidth - 40, 1);
    const availableHeight = Math.max(stage.clientHeight - 40, 1);

    const scaleX = availableWidth / layout.width;
    const scaleY = availableHeight / layout.height;
    const nextZoom = clampZoom(Math.min(scaleX, scaleY));

    const centeredX = (stage.clientWidth - layout.width * nextZoom) / 2;
    const centeredY = (stage.clientHeight - layout.height * nextZoom) / 2;

    applyViewport({
      x: centeredX,
      y: centeredY,
      zoom: nextZoom,
    });
  }, [applyViewport, layout.height, layout.width]);

  const handleCanvasWheel = useCallback((event: WheelEvent | React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return;

    event.preventDefault();
    if ("stopPropagation" in event) {
      event.stopPropagation();
    }

    const stage = stageRef.current;
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const nextZoom = clampZoom(viewportRef.current.zoom * Math.exp(-event.deltaY * 0.01));

    zoomAroundPoint(nextZoom, pointerX, pointerY);
  }, [zoomAroundPoint]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleNativeWheel = (event: WheelEvent) => {
      handleCanvasWheel(event);
    };

    stage.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => {
      stage.removeEventListener("wheel", handleNativeWheel);
    };
  }, [handleCanvasWheel]);

  const handleToggleNode = useCallback((nodeId: number) => {
    setExpandedDetailNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const handleExpandAllDetails = useCallback(() => {
    setExpandedDetailNodeIds(new Set(allNodeIds));
  }, [allNodeIds]);

  const handleCollapseAllDetails = useCallback(() => {
    setExpandedDetailNodeIds(new Set());
  }, []);

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

          <span ref={zoomLabelRef} className="tv-zoom-label">
            100%
          </span>

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
          contentRef={contentRef}
          stageRef={stageRef}
          expandedDetailNodeIds={expandedDetailNodeIds}
          isAllDetailsExpanded={isAllDetailsExpanded}
          onToggleNode={handleToggleNode}
          onBackgroundPointerDown={handleBackgroundPointerDown}
          onBackgroundPointerMove={handleBackgroundPointerMove}
        />

        <div
          ref={panelRef}
          className={`tv-floating-log ${isDraggingLog ? "is-dragging" : ""}`}
          style={{
            left: `${logPosition.x}px`,
            top: `${logPosition.y}px`,
          }}
        >
          <div className="tv-floating-log-handle" onPointerDown={handleLogPointerDown}>
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
