import type { Dispatch, SetStateAction } from 'react'

interface Props {
  mode: 'url' | 'html'
  setMode: Dispatch<SetStateAction<'url' | 'html'>>
  url: string
  setUrl: Dispatch<SetStateAction<string>>
  html: string
  setHtml: Dispatch<SetStateAction<string>>
  algorithm: 'bfs' | 'dfs'
  setAlgorithm: Dispatch<SetStateAction<'bfs' | 'dfs'>>
  selector: string
  setSelector: Dispatch<SetStateAction<string>>
  resultMode: 'ALL' | 'TOP'
  setResultMode: Dispatch<SetStateAction<'ALL' | 'TOP'>>
  topN: number
  setTopN: Dispatch<SetStateAction<number>>
  isLoading: boolean
  onSubmit: () => void
}

function OptionCard<T extends string>({
  label, value, current, onSelect, desc,
}: {
  label: string; value: T; current: T; onSelect: (v: T) => void; desc?: string
}) {
  const selected = value === current
  return (
    <div
      className={`option-card${selected ? ' option-card--selected' : ''}`}
      onClick={() => onSelect(value)}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(value)}
    >
      <div className="option-card__radio">
        <div className={`option-card__dot${selected ? ' option-card__dot--on' : ''}`} />
      </div>
      <div className="option-card__text">
        <span className="option-card__label">{label}</span>
        {desc && <span className="option-card__desc">{desc}</span>}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <p className="section-label">{children}</p>
}

export default function InputPanel({
  mode, setMode, url, setUrl, html, setHtml,
  algorithm, setAlgorithm, selector, setSelector,
  resultMode, setResultMode, topN, setTopN,
  isLoading, onSubmit,
}: Props) {
  return (
    <aside className="input-panel">
      <SectionLabel>Input Mode</SectionLabel>
      <div className="option-group">
        <OptionCard label="URL" value="url" current={mode} onSelect={setMode} desc="Fetch from web" />
        <OptionCard label="HTML" value="html" current={mode} onSelect={setMode} desc="Paste markup" />
      </div>

      <div className="field-wrap">
        {mode === 'url' ? (
          <input
            className="text-input"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        ) : (
          <textarea
            className="text-input text-input--area"
            value={html}
            onChange={e => setHtml(e.target.value)}
            placeholder="<html>...</html>"
          />
        )}
      </div>

      <SectionLabel>Algorithm</SectionLabel>
      <div className="option-group">
        <OptionCard label="BFS" value="bfs" current={algorithm} onSelect={setAlgorithm} desc="Level-by-level" />
        <OptionCard label="DFS" value="dfs" current={algorithm} onSelect={setAlgorithm} desc="Depth-first" />
      </div>

      <SectionLabel>CSS Selector</SectionLabel>
      <div className="field-wrap">
        <input
          className="text-input"
          type="text"
          value={selector}
          onChange={e => setSelector(e.target.value)}
          placeholder="div, .class, #id, p > span"
        />
      </div>

      <SectionLabel>Result Mode</SectionLabel>
      <div className="option-group">
        <OptionCard label="All" value="ALL" current={resultMode} onSelect={setResultMode} desc="Every match" />
        <OptionCard label="Top N" value="TOP" current={resultMode} onSelect={setResultMode} desc="First N results" />
      </div>

      {resultMode === 'TOP' && (
        <div className="field-wrap">
          <input
            className="text-input"
            type="number"
            min={1}
            value={topN}
            onChange={e => setTopN(Math.max(1, Number(e.target.value)))}
            placeholder="N"
          />
        </div>
      )}

      <button
        className={`go-button${isLoading ? ' go-button--loading' : ''}`}
        onClick={onSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="go-button__spinner" />
        ) : (
          'Go'
        )}
      </button>
    </aside>
  )
}
