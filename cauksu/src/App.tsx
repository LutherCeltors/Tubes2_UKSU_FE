import "./App.css";
import { useState } from "react";
import TreeVisualizer from "./component/tree-visual/tree-visualizer";
import type { DomTraversalResponse } from "./component/tree-visual/types";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

type RequestData = {
  mode: "url" | "html";
  url?: string;
  html?: string;
  algorithm: "bfs" | "dfs";
  selector: string;
  resultMode: "TOP" | "ALL";
  topN?: number;
};

type OptionCardProps<T extends string> = {
  label: string;
  value: T;
  current: T;
  onSelect: (value: T) => void;
  description: string;
};

function OptionCard<T extends string>({
  label,
  value,
  current,
  onSelect,
  description,
}: OptionCardProps<T>) {
  const selected = value === current;

  return (
    <button
      type="button"
      className={`option-card${selected ? " option-card--selected" : ""}`}
      onClick={() => onSelect(value)}
    >
      <span className="option-card__radio" aria-hidden="true">
        <span className={`option-card__dot${selected ? " option-card__dot--on" : ""}`} />
      </span>

      <span className="option-card__text">
        <span className="option-card__label">{label}</span>
        <span className="option-card__desc">{description}</span>
      </span>
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="section-label">{children}</p>;
}

function StatPill({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string;
  accent?: "default" | "algo-bfs" | "algo-dfs";
}) {
  return (
    <div className={`app-stat-pill app-stat-pill--${accent}`}>
      <span className="app-stat-pill__value">{value}</span>
      <span className="app-stat-pill__label">{label}</span>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<"URL" | "MANUAL">("URL");
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState("");
  const [algorithm, setAlgorithm] = useState<"bfs" | "dfs">("bfs");
  const [selector, setSelector] = useState("");
  const [resultMode, setResultMode] = useState<"TOP" | "ALL">("ALL");
  const [topN, setTopN] = useState(10);

  const [treeData, setTreeData] = useState<DomTraversalResponse | null>(null);
  const [visualizationKey, setVisualizationKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasAttemptedSearch, setHasAttemptedSearch] = useState(false);

  const [isLeftMenuOpen, setLeftMenuOpen] = useState(true);
  const currentData = treeData ?? (!hasAttemptedSearch ? sampleData : null);

  const handleSubmit = async () => {
    const data: RequestData = {
      mode: mode === "URL" ? "url" : "html",
      url: mode === "URL" ? url : undefined,
      html: mode === "MANUAL" ? html : undefined,
      algorithm,
      selector,
      resultMode,
      topN: resultMode === "TOP" ? topN : undefined,
    };

    setIsLoading(true);
    setErrorMessage("");
    setHasAttemptedSearch(true);

    try {
      const res = await fetch("http://localhost:8080/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Request gagal dengan status ${res.status}`);
      }

      const result: DomTraversalResponse = await res.json();
      setTreeData(result);
      setVisualizationKey((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to fetch data.");
      setTreeData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <button className="app-menu-toggle" onClick={() => setLeftMenuOpen((prev) => !prev)}>
            {isLeftMenuOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>

          <h1 className="app-logo">CAUKSU</h1>
        </div>

        {currentData && (
          <div className="app-stats">
            <StatPill label="execution" value={`${currentData.executionTimeMs.toFixed(2)} ms`} />
            <StatPill label="nodes" value={`${currentData.nodesVisited} nodes`} />
            <StatPill label="depth" value={`depth ${currentData.maxDepth}`} />
            <StatPill
              label="algorithm"
              value={algorithm.toUpperCase()}
              accent={algorithm === "bfs" ? "algo-bfs" : "algo-dfs"}
            />
          </div>
        )}
      </header>

      <div className="app-body">
        <aside className={`app-sidebar ${isLeftMenuOpen ? "open" : "collapsed"}`}>
          <div className="input-panel">
            <SectionLabel>Input Mode</SectionLabel>
            <div className="option-group">
              <OptionCard
                label="URL"
                value="URL"
                current={mode}
                onSelect={setMode}
                description="Fetch from web"
              />
              <OptionCard
                label="HTML"
                value="MANUAL"
                current={mode}
                onSelect={setMode}
                description="Paste markup"
              />
            </div>

            <div className="field-wrap">
              {mode === "URL" ? (
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="text-input"
                />
              ) : (
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="<html>...</html>"
                  className="text-input text-input--area"
                />
              )}
            </div>

            <SectionLabel>Algorithm</SectionLabel>
            <div className="option-group">
              <OptionCard
                label="BFS"
                value="bfs"
                current={algorithm}
                onSelect={setAlgorithm}
                description="Level-by-level"
              />
              <OptionCard
                label="DFS"
                value="dfs"
                current={algorithm}
                onSelect={setAlgorithm}
                description="Depth-first"
              />
            </div>

            <SectionLabel>CSS Selector</SectionLabel>
            <div className="field-wrap">
              <input
                type="text"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder="div, .class, #id, p > span"
                className="text-input"
              />
            </div>

            <SectionLabel>Result Mode</SectionLabel>
            <div className="option-group">
              <OptionCard
                label="All"
                value="ALL"
                current={resultMode}
                onSelect={setResultMode}
                description="Every match"
              />
              <OptionCard
                label="Top N"
                value="TOP"
                current={resultMode}
                onSelect={setResultMode}
                description="First N results"
              />
            </div>

            {resultMode === "TOP" && (
              <div className="field-wrap">
                <input
                  type="number"
                  min={1}
                  value={topN}
                  onChange={(e) => setTopN(Math.max(1, Number(e.target.value)))}
                  className="text-input"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              className={`go-button${isLoading ? " go-button--loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? <span className="go-button__spinner" /> : "Go"}
            </button>

            {errorMessage && <div className="app-error-box">{errorMessage}</div>}
          </div>
        </aside>

        <main className="app-main">
          {currentData ? (
            <TreeVisualizer key={visualizationKey} data={currentData} />
          ) : (
            <div className="app-main-empty-state">
              <div className="app-main-empty-copy">
                <span>Configure inputs and press</span> <strong>Go</strong>
                <span>to visualise traversal</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const sampleData: DomTraversalResponse = {
  executionTimeMs: 2.5,
  nodesVisited: 15,
  maxDepth: 4,
  tree: {
    id: 1,
    tag: "html",
    attributes: {},
    children: [
      {
        id: 2,
        tag: "body",
        attributes: { class: "container" },
        children: [
          {
            id: 5,
            tag: "div",
            attributes: { id: "hero" },
            children: [
              {
                id: 8,
                tag: "h1",
                attributes: {},
                children: [],
              },
              {
                id: 9,
                tag: "p",
                attributes: {},
                children: [],
              },
            ],
          },
          {
            id: 6,
            tag: "section",
            attributes: {},
            children: [
              {
                id: 10,
                tag: "button",
                attributes: {},
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  traversalLog: [
    { nodeId: 1, tag: "html", status: "visited" },
    { nodeId: 2, tag: "body", status: "visited" },
    { nodeId: 5, tag: "div", status: "matched" },
  ],
};

export default App;
