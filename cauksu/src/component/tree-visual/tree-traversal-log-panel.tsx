import type { TraversalLogItem } from "./types";

type TraversalLogPanelProps = {
  log: TraversalLogItem[];
  activeStep: number;
  onSelectStep: (step: number) => void;
};

export default function TraversalLogPanel({
  log,
  activeStep,
  onSelectStep,
}: TraversalLogPanelProps) {
  return (
    <div className="tv-log-panel">
      <h3>Traversal Log</h3>

      <div className="tv-log-list">
        {log.map((item, index) => (
          <button
            key={`${item.nodeId}-${index}`}
            type="button"
            className={`tv-log-item ${index === activeStep ? "is-active" : ""}`}
            onClick={() => onSelectStep(index)}
          >
            <span>#{index + 1}</span>
            <span>Node {item.nodeId}</span>
            <span>{item.tag}</span>
            <span>{item.status}</span>
          </button>
        ))}
      </div>
    </div>
  );
}