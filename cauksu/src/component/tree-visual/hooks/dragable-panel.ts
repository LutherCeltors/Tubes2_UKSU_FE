import { useEffect, useRef, useState, type RefObject } from "react";

type Position = {
  x: number;
  y: number;
};

type DragState = {
  startPointerX: number;
  startPointerY: number;
  startPanelX: number;
  startPanelY: number;
};

export function useDraggablePanel(
  containerRef: RefObject<HTMLElement | null>,
  initialPosition: Position = { x: 16, y: 16 }
) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState>({
    startPointerX: 0,
    startPointerY: 0,
    startPanelX: initialPosition.x,
    startPanelY: initialPosition.y,
  });

  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;

    function handlePointerMove(event: PointerEvent) {
      const container = containerRef.current;
      const panel = panelRef.current;
      if (!container || !panel) return;

      const deltaX = event.clientX - dragStateRef.current.startPointerX;
      const deltaY = event.clientY - dragStateRef.current.startPointerY;

      const rawX = dragStateRef.current.startPanelX + deltaX;
      const rawY = dragStateRef.current.startPanelY + deltaY;

      const maxX = Math.max(container.clientWidth - panel.offsetWidth - 12, 0);
      const maxY = Math.max(container.clientHeight - panel.offsetHeight - 12, 0);

      const nextX = Math.min(Math.max(rawX, 12), maxX);
      const nextY = Math.min(Math.max(rawY, 12), maxY);

      setPosition({ x: nextX, y: nextY });
    }

    function handlePointerUp() {
      setIsDragging(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, containerRef]);

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;

    dragStateRef.current = {
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startPanelX: position.x,
      startPanelY: position.y,
    };

    setIsDragging(true);
    event.preventDefault();
    event.stopPropagation();
  }

  return {
    panelRef,
    position,
    isDragging,
    setPosition,
    handlePointerDown,
  };
}