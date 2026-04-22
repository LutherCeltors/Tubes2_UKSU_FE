import { useEffect, useRef } from "react";
import type { TraversalLogItem } from "./types";

type TraversalLogPanelProps = {
  log: TraversalLogItem[];
  activeStep: number;
  onSelectStep: (step: number) => void;
  showTitle?: boolean;
};

export default function TraversalLogPanel({
  log,
  activeStep,
  onSelectStep,
  showTitle = true,
}: TraversalLogPanelProps) {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (activeStep < 0) return;

    const activeItem = itemRefs.current[activeStep];
    if (!activeItem) return;

    activeItem.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [activeStep]);

  function getLogItemState(item: TraversalLogItem, index: number) {
    if (index === activeStep) {
      if (item.status === "matched") {
        return "matched";
      }
      return "active";
    }

    if (index > activeStep) {
      return "default";
    }

    if (item.status === "visited") {
      return "visited";
    }

    if (item.status === "matched") {
      return "matched";
    }

    return "default";
  }

  return (
    <div className="tv-log-panel">
      {showTitle && <h3>Traversal Log</h3>}

      <div className="tv-log-list">
        {log.map((item, index) => {
          const state = getLogItemState(item, index);

          return (
            <button
              key={`${item.nodeId}-${index}`}
              type="button"
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              className={`tv-log-item tv-log-item--${state}`}
              onClick={() => onSelectStep(index)}
            >
              <span>#{index + 1}</span>
              <span>Node {item.nodeId}</span>
              <span>{item.tag}</span>
              <span>{item.status}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
