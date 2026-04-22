import { useEffect, useRef, useState, type RefObject } from "react";

type DragState = {
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
};

export function useCanvasPan(containerRef: RefObject<HTMLDivElement | null>) {
  const dragStateRef = useRef<DragState>({
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    if (!isPanning) return;

    function handleMouseMove(event: MouseEvent) {
      const container = containerRef.current;
      if (!container) return;

      const dx = event.clientX - dragStateRef.current.startX;
      const dy = event.clientY - dragStateRef.current.startY;

      container.scrollLeft = dragStateRef.current.scrollLeft - dx;
      container.scrollTop = dragStateRef.current.scrollTop - dy;
    }

    function handleMouseUp() {
      setIsPanning(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning, containerRef]);

  function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;

    if (target.closest(".tv-node-group")) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };

    setIsPanning(true);
    event.preventDefault();
  }

  return {
    isPanning,
    handleMouseDown,
  };
}