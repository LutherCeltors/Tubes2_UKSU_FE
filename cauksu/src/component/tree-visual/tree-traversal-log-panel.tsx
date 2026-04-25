import { useEffect, useMemo, useRef } from "react";
import type { TraversalLogItem } from "./types";
import { buildSortedBatches } from "./utils/tree-traversal-state";

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

  const sortedBatches = useMemo(() => buildSortedBatches(log), [log]);
  const batchToStep = useMemo(
    () => new Map(sortedBatches.map((b, i) => [b, i])),
    [sortedBatches]
  );

  const activeBatchValue = activeStep >= 0 ? sortedBatches[activeStep] : -1;

  useEffect(() => {
    if (activeStep < 0) return;
    const firstActiveIndex = log.findIndex((item) => item.batch === activeBatchValue);
    if (firstActiveIndex < 0) return;
    const activeItem = itemRefs.current[firstActiveIndex];
    if (!activeItem) return;
    activeItem.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
  }, [activeStep, activeBatchValue, log]);

  function getLogItemState(item: TraversalLogItem) {
    const itemStep = batchToStep.get(item.batch) ?? 0;

    if (item.batch === activeBatchValue) {
      return item.status === "matched" ? "matched" : "active";
    }

    if (itemStep > activeStep) return "default";

    return item.status === "matched" ? "matched" : "visited";
  }

  return (
    <div className="tv-log-panel">
      {showTitle && <h3>Traversal Log</h3>}

      <div className="tv-log-list">
        {log.map((item, index) => {
          const state = getLogItemState(item);
          const batchStep = batchToStep.get(item.batch) ?? 0;

          return (
            <button
              key={`${item.nodeId}-${index}`}
              type="button"
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              className={`tv-log-item tv-log-item--${state}`}
              onClick={() => onSelectStep(batchStep)}
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
