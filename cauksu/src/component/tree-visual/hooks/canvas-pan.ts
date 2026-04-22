import { useEffect, useRef, useState } from "react";

type PanState = {
  startPointerX: number;
  startPointerY: number;
  startCameraX: number;
  startCameraY: number;
};

export function useCanvasPan() {
  const dragStateRef = useRef<PanState>({
    startPointerX: 0,
    startPointerY: 0,
    startCameraX: 0,
    startCameraY: 0,
  });

  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    if (!isPanning) return;

    function handlePointerUp() {
      setIsPanning(false);
    }

    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isPanning]);

  function startPan(
    event: React.PointerEvent<HTMLDivElement>,
    cameraX: number,
    cameraY: number
  ) {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest(".tv-node-group")) return;
    if (target.closest(".tv-floating-log")) return;

    dragStateRef.current = {
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startCameraX: cameraX,
      startCameraY: cameraY,
    };

    setIsPanning(true);
    event.preventDefault();
  }

  function getNextCameraPosition(clientX: number, clientY: number) {
    const dx = clientX - dragStateRef.current.startPointerX;
    const dy = clientY - dragStateRef.current.startPointerY;

    return {
      x: dragStateRef.current.startCameraX + dx,
      y: dragStateRef.current.startCameraY + dy,
    };
  }

  return {
    isPanning,
    startPan,
    getNextCameraPosition,
  };
}